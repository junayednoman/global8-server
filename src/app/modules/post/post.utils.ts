import { Prisma } from "@prisma/client";
import ApiError from "../../classes/ApiError";
import { deleteFromS3, uploadToS3 } from "../../utils/awss3";
import { TPostFiles } from "./post.interface";

export const postSelect = {
  id: true,
  creatorId: true,
  images: true,
  videos: true,
  caption: true,
  shares: true,
  isExclusive: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: {
      id: true,
      role: true,
      profile: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  },
  _count: {
    select: {
      comments: true,
      reactions: true,
    },
  },
} satisfies Prisma.PostSelect;

export const getPostOrderBy = (
  sortBy: string | undefined,
  orderBy: "asc" | "desc" | undefined
): Prisma.PostOrderByWithRelationInput => {
  const direction: Prisma.SortOrder = orderBy === "asc" ? "asc" : "desc";

  if (!sortBy) return { createdAt: "desc" };
  if (sortBy === "createdAt") return { createdAt: direction };
  if (sortBy === "updatedAt") return { updatedAt: direction };
  if (sortBy === "shares") return { shares: direction };

  throw new ApiError(400, "Invalid sortBy field");
};

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export const validatePostMediaFiles = (files: TPostFiles = {}) => {
  for (const file of files.images ?? []) {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new ApiError(400, "Only jpeg, png, and webp images are allowed");
    }
  }
  for (const file of files.videos ?? []) {
    if (!ALLOWED_VIDEO_TYPES.has(file.mimetype)) {
      throw new ApiError(400, "Only mp4, webm, and mov videos are allowed");
    }
  }
};

export const uploadPostMediaFiles = async (files: TPostFiles = {}) => {
  const imageUrls: string[] = [];
  const videoUrls: string[] = [];

  for (const file of files.images ?? []) {
    imageUrls.push(await uploadToS3(file));
  }
  for (const file of files.videos ?? []) {
    videoUrls.push(await uploadToS3(file));
  }

  return { imageUrls, videoUrls };
};

export const cleanupUploadedPostMedia = async (urls: string[]) => {
  for (const url of urls) {
    await deleteFromS3(url);
  }
};

type TPostWithCounts = Prisma.PostGetPayload<{
  select: typeof postSelect;
}>;

const toRelativeTime = (date: Date) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

export const mapFeedPost = (post: TPostWithCounts, isReacted: boolean) => {
  return {
    id: post.id,
    caption: post.caption,
    images: post.images,
    videos: post.videos,
    createdAt: post.createdAt,
    postedAgo: toRelativeTime(post.createdAt),
    creator: {
      id: post.creator.id,
      name: post.creator.profile?.name ?? null,
      image: post.creator.profile?.image ?? null,
      role: post.creator.role,
    },
    isReacted,
    stats: {
      shareCount: post.shares,
      commentCount: post._count.comments,
      reactionCount: post._count.reactions,
    },
  };
};
