import { Prisma, UserRole } from "@prisma/client";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import prisma from "../../utils/prisma";
import { TPostFiles } from "./post.interface";
import {
  cleanupUploadedPostMedia,
  getPostOrderBy,
  postSelect,
  uploadPostMediaFiles,
  validatePostMediaFiles,
} from "./post.utils";
import { TCreatePost, TPatchShareCount, TUpdatePost } from "./post.validation";

const create = async (
  creatorId: string,
  payload: TCreatePost,
  files: TPostFiles = {}
) => {
  validatePostMediaFiles(files);
  const hasUploadedMedia =
    (files.images?.length ?? 0) > 0 || (files.videos?.length ?? 0) > 0;
  const hasPayloadMedia =
    Boolean(payload.images?.length) || Boolean(payload.videos?.length);
  const hasCaption = Boolean(payload.caption);
  if (!hasCaption && !hasPayloadMedia && !hasUploadedMedia) {
    throw new ApiError(
      400,
      "At least one of caption, images, or videos is required"
    );
  }

  const { imageUrls, videoUrls } = await uploadPostMediaFiles(files);
  const uploadedUrls = [...imageUrls, ...videoUrls];

  try {
    return await prisma.post.create({
      data: {
        creatorId,
        images: [...(payload.images ?? []), ...imageUrls],
        videos: [...(payload.videos ?? []), ...videoUrls],
        caption: payload.caption,
        isExclusive: payload.isExclusive ?? false,
      },
    });
  } catch (error) {
    if (uploadedUrls.length) {
      await cleanupUploadedPostMedia(uploadedUrls);
    }
    throw error;
  }
};

const getFeed = async (
  options: TPaginationOptions,
  query: Record<string, unknown>
) => {
  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 10);
  if (!Number.isFinite(page) || page < 1)
    throw new ApiError(400, "Invalid page");
  if (!Number.isFinite(limit) || limit < 1 || limit > 100)
    throw new ApiError(400, "Invalid limit");

  const searchTerm =
    typeof query.searchTerm === "string" ? query.searchTerm.trim() : undefined;
  const creatorId =
    typeof query.creatorId === "string" ? query.creatorId.trim() : undefined;

  const andConditions: Prisma.PostWhereInput[] = [];
  if (searchTerm) {
    andConditions.push({
      caption: { contains: searchTerm, mode: "insensitive" },
    });
  }
  if (creatorId) {
    andConditions.push({ creatorId });
  }

  const whereConditions: Prisma.PostWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const {
    page: currentPage,
    take,
    skip,
    sortBy,
    orderBy,
  } = calculatePagination({
    ...options,
    page,
    limit,
  });

  const posts = await prisma.post.findMany({
    where: whereConditions,
    skip,
    take,
    orderBy: getPostOrderBy(sortBy, orderBy),
    select: postSelect,
  });

  const total = await prisma.post.count({
    where: whereConditions,
  });

  return {
    meta: { page: currentPage, limit: take, total },
    posts,
  };
};

const getMy = async (
  authId: string,
  options: TPaginationOptions,
  query: Record<string, unknown>
) => {
  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 10);
  if (!Number.isFinite(page) || page < 1)
    throw new ApiError(400, "Invalid page");
  if (!Number.isFinite(limit) || limit < 1 || limit > 100)
    throw new ApiError(400, "Invalid limit");

  const searchTerm =
    typeof query.searchTerm === "string" ? query.searchTerm.trim() : undefined;

  const andConditions: Prisma.PostWhereInput[] = [{ creatorId: authId }];
  if (searchTerm) {
    andConditions.push({
      caption: { contains: searchTerm, mode: "insensitive" },
    });
  }

  const whereConditions: Prisma.PostWhereInput = { AND: andConditions };

  const {
    page: currentPage,
    take,
    skip,
    sortBy,
    orderBy,
  } = calculatePagination({
    ...options,
    page,
    limit,
  });

  const posts = await prisma.post.findMany({
    where: whereConditions,
    skip,
    take,
    orderBy: getPostOrderBy(sortBy, orderBy),
    select: postSelect,
  });

  const total = await prisma.post.count({
    where: whereConditions,
  });

  return {
    meta: { page: currentPage, limit: take, total },
    posts,
  };
};

const update = async (
  id: string,
  authId: string,
  role: UserRole,
  payload: TUpdatePost,
  files: TPostFiles = {}
) => {
  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, creatorId: true, images: true, videos: true },
  });
  if (!post) throw new ApiError(404, "Post not found");

  const canManage = post.creatorId === authId || role === UserRole.ADMIN;
  if (!canManage) throw new ApiError(403, "Not authorized");

  validatePostMediaFiles(files);
  const hasUploadedMedia =
    (files.images?.length ?? 0) > 0 || (files.videos?.length ?? 0) > 0;
  const hasPayloadFields =
    payload.images !== undefined ||
    payload.videos !== undefined ||
    payload.caption !== undefined ||
    payload.isExclusive !== undefined;
  if (!hasPayloadFields && !hasUploadedMedia) {
    throw new ApiError(400, "At least one field is required");
  }

  const { imageUrls, videoUrls } = await uploadPostMediaFiles(files);
  const uploadedUrls = [...imageUrls, ...videoUrls];

  try {
    const nextImages =
      payload.images !== undefined
        ? [...payload.images, ...imageUrls]
        : imageUrls.length
          ? [...post.images, ...imageUrls]
          : undefined;

    const nextVideos =
      payload.videos !== undefined
        ? [...payload.videos, ...videoUrls]
        : videoUrls.length
          ? [...post.videos, ...videoUrls]
          : undefined;

    return await prisma.post.update({
      where: { id },
      data: {
        ...(nextImages !== undefined ? { images: nextImages } : {}),
        ...(nextVideos !== undefined ? { videos: nextVideos } : {}),
        ...(payload.caption !== undefined ? { caption: payload.caption } : {}),
        ...(payload.isExclusive !== undefined
          ? { isExclusive: payload.isExclusive }
          : {}),
      },
      select: postSelect,
    });
  } catch (error) {
    if (uploadedUrls.length) {
      await cleanupUploadedPostMedia(uploadedUrls);
    }
    throw error;
  }
};

const remove = async (id: string, authId: string, role: UserRole) => {
  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, creatorId: true },
  });
  if (!post) throw new ApiError(404, "Post not found");

  const canManage = post.creatorId === authId || role === UserRole.ADMIN;
  if (!canManage) throw new ApiError(403, "Not authorized");

  await prisma.$transaction(async tx => {
    await tx.reaction.deleteMany({ where: { postId: id } });
    await tx.comment.deleteMany({ where: { postId: id } });
    await tx.post.delete({ where: { id } });
  });
};

const patchShareCount = async (id: string, payload: TPatchShareCount) => {
  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!post) throw new ApiError(404, "Post not found");

  return prisma.post.update({
    where: { id },
    data: {
      shares: {
        increment: payload.count,
      },
    },
    select: postSelect,
  });
};

export const PostService = {
  create,
  getFeed,
  getMy,
  update,
  remove,
  patchShareCount,
};
