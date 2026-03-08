import { Prisma } from "@prisma/client";
import ApiError from "../../classes/ApiError";
import prisma from "../../utils/prisma";
import { TToggleReaction } from "./reaction.validation";

export const resolveReactionTarget = async (payload: TToggleReaction) => {
  if (payload.postId) {
    const post = await prisma.post.findUnique({
      where: { id: payload.postId },
      select: { id: true },
    });
    if (!post) throw new ApiError(404, "Post not found");

    return {
      where: { postId: payload.postId } as Prisma.ReactionWhereInput,
      data: { postId: payload.postId },
      targetId: payload.postId,
      targetType: "post" as const,
    };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: payload.commentId as string },
    select: { id: true },
  });
  if (!comment) throw new ApiError(404, "Comment not found");

  return {
    where: { commentId: payload.commentId as string } as Prisma.ReactionWhereInput,
    data: { commentId: payload.commentId as string },
    targetId: payload.commentId as string,
    targetType: "comment" as const,
  };
};
