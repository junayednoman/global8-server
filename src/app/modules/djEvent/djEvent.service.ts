import { Prisma } from "@prisma/client";
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
  DJ_EVENT_ALLOWED_SORT_FIELDS,
  DJ_EVENT_ORDER_BY_VALUES,
  DJ_EVENT_TIME_FILTER_VALUES,
} from "./djEvent.constants";
import { TCreateDJEvent, TUpdateDJEvent } from "./djEvent.validation";

const create = async (djId: string, payload: TCreateDJEvent, file?: TFile) => {
  const eventDate = parseDateOrThrow(payload.date);
  assertFutureDate(eventDate);

  let imageUrl: string | undefined;
  if (file) {
    imageUrl = await uploadToS3(file);
  }

  try {
    return await prisma.dJEvent.create({
      data: {
        ...payload,
        image: imageUrl,
        date: eventDate,
        djId,
      },
    });
  } catch (error) {
    if (imageUrl) {
      await deleteFromS3(imageUrl);
    }
    throw error;
  }
};

const getAll = async (
  options: TPaginationOptions,
  query: Record<string, any>
) => {
  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 10);
  if (!Number.isFinite(page) || page < 1) {
    throw new ApiError(400, "Invalid page");
  }
  if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, "Invalid limit");
  }

  let sortBy = typeof options.sortBy === "string" ? options.sortBy : undefined;
  const orderBy =
    typeof options.orderBy === "string"
      ? options.orderBy.toLowerCase()
      : undefined;

  if (sortBy && !DJ_EVENT_ALLOWED_SORT_FIELDS.has(sortBy)) {
    throw new ApiError(400, "Invalid sortBy field");
  }
  if (orderBy && !DJ_EVENT_ORDER_BY_VALUES.has(orderBy)) {
    throw new ApiError(400, "Invalid orderBy value");
  }
  if (!sortBy) {
    sortBy = "createdAt";
  }

  const andConditions: Prisma.DJEventWhereInput[] = [];

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

  if (typeof query.djId === "string" && query.djId.trim()) {
    andConditions.push({
      djId: query.djId,
    });
  }

  if (typeof query.date === "string" && query.date.trim()) {
    andConditions.push({
      date: parseDateOrThrow(query.date),
    });
  }

  const eventTimeFilter =
    typeof query.eventTime === "string" ? query.eventTime.toLowerCase() : undefined;

  if (eventTimeFilter) {
    if (!DJ_EVENT_TIME_FILTER_VALUES.has(eventTimeFilter)) {
      throw new ApiError(400, "Invalid eventTime value");
    }

    const now = new Date();
    andConditions.push({
      date: eventTimeFilter === "recent" ? { gte: now } : { lt: now },
    });
  }

  const whereConditions: Prisma.DJEventWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const { page: currentPage, take, skip } = calculatePagination({
    ...options,
    page,
    limit,
    sortBy,
    orderBy: orderBy as "asc" | "desc" | undefined,
  });

  const djEvents = await prisma.dJEvent.findMany({
    where: whereConditions,
    skip,
    take,
    orderBy: { [sortBy]: (orderBy ?? "desc") as "asc" | "desc" },
  });

  const total = await prisma.dJEvent.count({
    where: whereConditions,
  });

  const meta = {
    page: currentPage,
    limit: take,
    total,
  };

  return { meta, djEvents };
};

const getSingle = async (id: string, authId?: string) => {
  console.log('authId', authId);
  const djEvent = await prisma.dJEvent.findUnique({ where: { id } });
  if (!djEvent) return djEvent;
  if (!authId) {
    return { ...djEvent, isBookmarked: false };
  }

  const bookmark = await prisma.favoriteDJEvent.findFirst({
    where: { djEventId: id, authId },
    select: { id: true },
  });

  return { ...djEvent, isBookmarked: !!bookmark };
};

const update = async (
  id: string,
  djId: string,
  payload: TUpdateDJEvent,
  file?: TFile
) => {
  const djEvent = await prisma.dJEvent.findUnique({ where: { id } });
  if (!djEvent) throw new ApiError(404, "DJ event not found");

  if (djEvent.djId !== djId) {
    throw new ApiError(403, "Not authorized");
  }

  if (!file && Object.keys(payload || {}).length === 0) {
    throw new ApiError(400, "Update payload is required");
  }

  let uploadedImageUrl: string | undefined;
  if (file) {
    uploadedImageUrl = await uploadToS3(file);
    payload.image = uploadedImageUrl;
  }

  if (payload.date) {
    const eventDate = parseDateOrThrow(payload.date);
    assertFutureDate(eventDate);
    payload.date = eventDate.toISOString();
  }

  try {
    const result = await prisma.dJEvent.update({
      where: { id },
      data: {
        ...payload,
        ...(payload.date ? { date: parseDateOrThrow(payload.date) } : {}),
      },
    });

    if (result && djEvent.image && payload.image) {
      await deleteFromS3(djEvent.image);
    }

    return result;
  } catch (error) {
    if (uploadedImageUrl) {
      await deleteFromS3(uploadedImageUrl);
    }
    throw error;
  }
};

const remove = async (id: string, djId: string) => {
  const djEvent = await prisma.dJEvent.findUnique({ where: { id } });
  if (!djEvent) throw new ApiError(404, "DJ event not found");

  if (djEvent.djId !== djId) {
    throw new ApiError(403, "Not authorized");
  }

  const result = await prisma.$transaction(async tx => {
    await tx.favoriteDJEvent.deleteMany({ where: { djEventId: id } });
    return tx.dJEvent.delete({ where: { id } });
  });

  if (result.image) {
    await deleteFromS3(result.image);
  }

  return result;
};

export const DJEventService = {
  create,
  getAll,
  getSingle,
  update,
  remove,
};
