import { EnrollmentStatus, Prisma } from "@prisma/client";
import ApiError from "../../classes/ApiError";
import { TFile } from "../../interface/file.interface";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";
import { assertFutureDate, parseDateOrThrow } from "../../utils/dateValidation";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import prisma from "../../utils/prisma";
import {
  CLASS_ALLOWED_SORT_FIELDS,
  CLASS_ORDER_BY_VALUES,
} from "./class.constants";
import { TCreateClass, TUpdateClass } from "./class.validation";

const sanitizeClassVideos = (videos: unknown) => {
  if (!Array.isArray(videos)) return [];

  return videos
    .map(video => {
      if (!video || typeof video !== "object") return null;
      const currentVideo = video as Record<string, unknown>;
      const title =
        typeof currentVideo.title === "string" ? currentVideo.title : "";
      const url = typeof currentVideo.url === "string" ? currentVideo.url : "";
      if (!title || !url) return null;
      return { title, url };
    })
    .filter((video): video is { title: string; url: string } => !!video);
};

const create = async (
  teacherId: string,
  payload: TCreateClass,
  file?: TFile
) => {
  let classDate: Date | undefined = undefined;
  if (payload.date) {
    classDate = parseDateOrThrow(payload.date);
    assertFutureDate(classDate);
  }

  if (!payload.isFree && payload.amount === undefined) {
    throw new ApiError(400, "Amount is required for paid classes");
  }
  if (payload.type === "OFFLINE" && !payload.location) {
    throw new ApiError(400, "Location is required for offline classes");
  }
  if (payload.type === "VIRTUAL_LIVE" && !payload.liveClassLink) {
    throw new ApiError(
      400,
      "Live class link is required for virtual live classes"
    );
  }

  let posterUrl: string | undefined;
  if (file) {
    posterUrl = await uploadToS3(file);
  }

  try {
    return await prisma.class.create({
      data: {
        ...payload,
        poster: posterUrl,
        date: classDate,
        teacherId,
        videos: [],
      },
    });
  } catch (error) {
    if (posterUrl) {
      await deleteFromS3(posterUrl);
    }
    throw error;
  }
};

const getAll = async (
  options: TPaginationOptions,
  query: Record<string, any>,
  authId?: string
) => {
  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 10);
  if (!Number.isFinite(page) || page < 1)
    throw new ApiError(400, "Invalid page");
  if (!Number.isFinite(limit) || limit < 1 || limit > 100)
    throw new ApiError(400, "Invalid limit");

  let sortBy = typeof options.sortBy === "string" ? options.sortBy : undefined;
  const orderBy =
    typeof options.orderBy === "string"
      ? options.orderBy.toLowerCase()
      : undefined;

  if (sortBy && !CLASS_ALLOWED_SORT_FIELDS.has(sortBy))
    throw new ApiError(400, "Invalid sortBy field");
  if (orderBy && !CLASS_ORDER_BY_VALUES.has(orderBy))
    throw new ApiError(400, "Invalid orderBy value");
  if (!sortBy) sortBy = "createdAt";

  const andConditions: Prisma.ClassWhereInput[] = [];

  const searchTerm =
    typeof query.searchTerm === "string" ? query.searchTerm.trim() : undefined;
  if (searchTerm) {
    andConditions.push({
      OR: [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (query.teacherId) andConditions.push({ teacherId: query.teacherId });
  if (query.type) andConditions.push({ type: query.type });
  if (query.skillLevel) andConditions.push({ skillLevel: query.skillLevel });

  if (query.isFree !== undefined) {
    andConditions.push({ isFree: query.isFree === "true" });
  }
  if (typeof query.date === "string" && query.date.trim()) {
    andConditions.push({ date: parseDateOrThrow(query.date) });
  }
  if (query.enrolled !== undefined) {
    if (!authId) {
      throw new ApiError(401, "Unauthorized");
    }
    if (query.enrolled === "true") {
      andConditions.push({
        classEnrollments: {
          some: {
            studentId: authId,
            status: EnrollmentStatus.ENROLLED,
          },
        },
      });
    }
  }

  const whereConditions: Prisma.ClassWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const {
    skip,
    take,
    page: currentPage,
  } = calculatePagination({
    ...options,
    page,
    limit,
    sortBy,
    orderBy: orderBy as "asc" | "desc" | undefined,
  });

  const classes = await prisma.class.findMany({
    where: whereConditions,
    skip,
    take,
    orderBy: { [sortBy]: (orderBy ?? "desc") as "asc" | "desc" },
    select: {
      id: true,
      title: true,
      poster: true,
      type: true,
      skillLevel: true,
    },
  });

  const total = await prisma.class.count({ where: whereConditions });

  const classIds = classes.map(c => c.id);
  let bookmarkedClassIds = new Set<string>();
  let enrolledClassIds = new Set<string>();

  if (authId && classIds.length > 0) {
    const [bookmarks, enrollments] = await Promise.all([
      prisma.favoriteClass.findMany({
        where: { authId, classId: { in: classIds } },
        select: { classId: true },
      }),
      prisma.classEnrollment.findMany({
        where: {
          studentId: authId,
          classId: { in: classIds },
          status: EnrollmentStatus.ENROLLED,
        },
        select: { classId: true },
      }),
    ]);
    bookmarkedClassIds = new Set(bookmarks.map(b => b.classId));
    enrolledClassIds = new Set(enrollments.map(e => e.classId));
  }

  const classesWithStatus = classes.map(c => ({
    ...c,
    isBookmarked: bookmarkedClassIds.has(c.id),
    isEnrolled: enrolledClassIds.has(c.id),
  }));

  return {
    meta: { page: currentPage, limit: take, total },
    classes: classesWithStatus,
  };
};

const getSingle = async (id: string, authId?: string) => {
  const currentClass = await prisma.class.findUnique({
    where: { id },
    include: {
      teacher: {
        select: { id: true, profile: { select: { name: true, image: true } } },
      },
    },
  });
  if (!currentClass) return null;
  if (!authId)
    return {
      ...currentClass,
      videos: sanitizeClassVideos(currentClass?.videos),
      isBookmarked: false,
      isEnrolled: false,
    };

  const [bookmark, enrollment] = await Promise.all([
    prisma.favoriteClass.findFirst({
      where: { classId: id, authId },
      select: { id: true },
    }),
    prisma.classEnrollment.findFirst({
      where: {
        classId: id,
        studentId: authId,
        status: EnrollmentStatus.ENROLLED,
      },
      select: { id: true },
    }),
  ]);

  return {
    ...currentClass,
    videos: sanitizeClassVideos(currentClass?.videos),
    isBookmarked: !!bookmark,
    isEnrolled: !!enrollment,
  };
};

const addVideo = async (
  classId: string,
  teacherId: string,
  title: string,
  file: TFile
) => {
  const targetClass = await prisma.class.findUniqueOrThrow({
    where: { id: classId },
  });

  if (targetClass.teacherId !== teacherId)
    throw new ApiError(403, "Not authorized to modify this class");

  const videoUrl = await uploadToS3(file);

  try {
    const existingVideos = sanitizeClassVideos(targetClass.videos);

    const newVideo = {
      title,
      url: videoUrl,
    };
    const updatedVideos = [...existingVideos, newVideo];

    return await prisma.class.update({
      where: { id: classId },
      data: { videos: updatedVideos },
    });
  } catch (error) {
    if (videoUrl) await deleteFromS3(videoUrl);
    throw error;
  }
};

const update = async (
  id: string,
  teacherId: string,
  payload: Partial<TUpdateClass>,
  file?: TFile
) => {
  const targetClass = await prisma.class.findUniqueOrThrow({ where: { id } });
  if (targetClass.teacherId !== teacherId)
    throw new ApiError(403, "Not authorized to update this class");

  if (!file && Object.keys(payload || {}).length === 0) {
    throw new ApiError(400, "Update payload is required");
  }

  const mergedFree =
    payload.isFree !== undefined ? payload.isFree : targetClass.isFree;
  const mergedAmount =
    payload.amount !== undefined ? payload.amount : targetClass.amount;
  if (!mergedFree && !mergedAmount)
    throw new ApiError(400, "Amount required if changing to a paid class");

  const mergedType =
    payload.type !== undefined ? payload.type : targetClass.type;
  const mergedLocation =
    payload.location !== undefined ? payload.location : targetClass.location;
  if (mergedType === "OFFLINE" && !mergedLocation)
    throw new ApiError(400, "Location required for offline class");
  const mergedLiveClassLink =
    payload.liveClassLink !== undefined
      ? payload.liveClassLink
      : targetClass.liveClassLink;
  if (mergedType === "VIRTUAL_LIVE" && !mergedLiveClassLink)
    throw new ApiError(400, "Live class link required for virtual live class");

  let uploadedPosterUrl: string | undefined;
  if (file) {
    uploadedPosterUrl = await uploadToS3(file);
    payload.poster = uploadedPosterUrl;
  }

  if (payload.date) {
    const classDate = parseDateOrThrow(payload.date);
    assertFutureDate(classDate);
    payload.date = classDate.toISOString();
  }

  try {
    const result = await prisma.class.update({
      where: { id },
      data: {
        ...payload,
        ...(payload.date ? { date: parseDateOrThrow(payload.date) } : {}),
      },
    });

    if (result && targetClass.poster && payload.poster) {
      await deleteFromS3(targetClass.poster);
    }

    return result;
  } catch (error) {
    if (uploadedPosterUrl) await deleteFromS3(uploadedPosterUrl);
    throw error;
  }
};

const remove = async (id: string, teacherId: string) => {
  const targetClass = await prisma.class.findUnique({ where: { id } });
  if (!targetClass) throw new ApiError(404, "Class not found");
  if (targetClass.teacherId !== teacherId)
    throw new ApiError(403, "Not authorized to delete this class");

  const enrollmentCount = await prisma.classEnrollment.count({
    where: {
      classId: id,
      status: { in: [EnrollmentStatus.PENDING, EnrollmentStatus.ENROLLED] },
    },
  });
  if (enrollmentCount > 0) {
    throw new ApiError(
      409,
      "Cannot delete class: there are active student enrollments."
    );
  }

  const result = await prisma.$transaction(async tx => {
    await tx.favoriteClass.deleteMany({ where: { classId: id } });
    await tx.feedback.deleteMany({ where: { classId: id } });
    return tx.class.delete({ where: { id } });
  });

  if (result.poster) {
    await deleteFromS3(result.poster);
  }

  const existingVideos = Array.isArray(result.videos) ? result.videos : [];
  for (const video of existingVideos) {
    if (video && typeof video === "object" && "url" in video) {
      await deleteFromS3(video.url as string).catch(console.error);
    }
  }

  return result;
};

export const ClassService = {
  create,
  getAll,
  getSingle,
  addVideo,
  update,
  remove,
};
