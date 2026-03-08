import { UserRole } from "@prisma/client";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import prisma from "../../utils/prisma";
import { TCreateComment, TUpdateComment } from "./comment.validation";
import {
  collectCommentIds,
  collectCommentTreeIds,
  commentSelect,
  mapComment,
} from "./comment.utils";

const create = async (authId: string, payload: TCreateComment) => {
  if (payload.postId) {
    const post = await prisma.post.findUnique({
      where: { id: payload.postId },
      select: { id: true },
    });
    if (!post) throw new ApiError(404, "Post not found");
  }

  if (payload.parentCommentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: payload.parentCommentId },
      select: { id: true },
    });
    if (!parent) throw new ApiError(404, "Parent comment not found");
  }

  const createdComment = await prisma.comment.create({
    data: {
      reactorId: authId,
      postId: payload.postId,
      parentCommentId: payload.parentCommentId,
      content: payload.content,
    },
    select: {
      id: true,
      reactorId: true,
      postId: true,
      parentCommentId: true,
      content: true,
      date: true,
      updatedAt: true,
    },
  });

  return {
    id: createdComment.id,
    reactorId: createdComment.reactorId,
    postId: createdComment.postId,
    parentCommentId: createdComment.parentCommentId,
    content: createdComment.content,
    date: createdComment.date,
    isEdited:
      createdComment.updatedAt.getTime() > createdComment.date.getTime(),
  };
};

const getAll = async (
  authId: string | undefined,
  options: TPaginationOptions,
  query: Record<string, unknown>
) => {
  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 10);
  if (!Number.isFinite(page) || page < 1)
    throw new ApiError(400, "Invalid page");
  if (!Number.isFinite(limit) || limit < 1 || limit > 100)
    throw new ApiError(400, "Invalid limit");

  const postId =
    typeof query.postId === "string" ? query.postId.trim() : undefined;
  const parentCommentId =
    typeof query.parentCommentId === "string"
      ? query.parentCommentId.trim()
      : undefined;

  if (!postId && !parentCommentId) {
    throw new ApiError(400, "Either postId or parentCommentId is required");
  }
  if (postId && parentCommentId) {
    throw new ApiError(400, "Use either postId or parentCommentId, not both");
  }

  if (postId) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) throw new ApiError(404, "Post not found");
  }

  if (parentCommentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentCommentId },
      select: { id: true },
    });
    if (!parentComment) throw new ApiError(404, "Parent comment not found");
  }

  const whereConditions = {
    ...(postId ? { postId, parentCommentId: null } : {}),
    ...(parentCommentId !== undefined ? { parentCommentId } : {}),
  };

  const {
    page: currentPage,
    take,
    skip,
  } = calculatePagination({
    ...options,
    page,
    limit,
    sortBy: "date",
    orderBy: "desc",
  });

  const comments = await prisma.comment.findMany({
    where: whereConditions,
    orderBy: { date: "desc" },
    skip,
    take,
    select: commentSelect,
  });

  const total = await prisma.comment.count({
    where: whereConditions,
  });

  const likedCommentIds = new Set<string>();
  if (authId && comments.length) {
    const commentIds = collectCommentIds(comments);
    const likedReactions = await prisma.reaction.findMany({
      where: {
        reactorId: authId,
        commentId: { in: commentIds },
      },
      select: { commentId: true },
    });

    likedReactions.forEach(reaction => {
      if (reaction.commentId) likedCommentIds.add(reaction.commentId);
    });
  }

  return {
    meta: { page: currentPage, limit: take, total },
    comments: comments.map(comment => mapComment(comment, likedCommentIds)),
  };
};

const update = async (
  id: string,
  authId: string,
  role: UserRole,
  payload: TUpdateComment
) => {
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { id: true, reactorId: true },
  });
  if (!comment) throw new ApiError(404, "Comment not found");

  const canManage = comment.reactorId === authId || role === UserRole.ADMIN;
  if (!canManage) throw new ApiError(403, "Not authorized");

  const updated = await prisma.comment.update({
    where: { id },
    data: { content: payload.content },
    select: commentSelect,
  });

  const isLiked = await prisma.reaction.findFirst({
    where: { reactorId: authId, commentId: id },
    select: { id: true },
  });

  return mapComment(updated, new Set<string>(isLiked ? [id] : []));
};

const remove = async (id: string, authId: string, role: UserRole) => {
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { id: true, reactorId: true },
  });
  if (!comment) throw new ApiError(404, "Comment not found");

  const canManage = comment.reactorId === authId || role === UserRole.ADMIN;
  if (!canManage) throw new ApiError(403, "Not authorized");

  await prisma.$transaction(async tx => {
    const ids = await collectCommentTreeIds(tx, id);
    await tx.reaction.deleteMany({
      where: {
        commentId: { in: ids },
      },
    });

    for (const commentId of ids.reverse()) {
      await tx.comment.delete({ where: { id: commentId } });
    }
  });
};

export const CommentService = {
  create,
  getAll,
  update,
  remove,
};
