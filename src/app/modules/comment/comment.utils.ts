import { Prisma } from "@prisma/client";

export const commentSelect = {
  id: true,
  postId: true,
  parentCommentId: true,
  content: true,
  date: true,
  reactor: {
    select: {
      id: true,
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
      reactions: true,
      replies: true,
    },
  },
} satisfies Prisma.CommentSelect;

type TSelectedComment = Prisma.CommentGetPayload<{
  select: typeof commentSelect;
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

export const mapComment = (
  comment: TSelectedComment,
  likedCommentIds: Set<string>
) => ({
  id: comment.id,
  postId: comment.postId,
  parentCommentId: comment.parentCommentId,
  content: comment.content,
  date: comment.date,
  postedAgo: toRelativeTime(comment.date),
  author: {
    id: comment.reactor.id,
    name: comment.reactor.profile?.name ?? null,
    image: comment.reactor.profile?.image ?? null,
  },
  isLiked: likedCommentIds.has(comment.id),
  likeCount: comment._count.reactions,
  replyCount: comment._count.replies,
});

export const collectCommentIds = (comments: TSelectedComment[]) =>
  comments.map(comment => comment.id);

export const collectCommentTreeIds = async (
  tx: Prisma.TransactionClient,
  rootCommentId: string
) => {
  const ids = [rootCommentId];
  let frontier = [rootCommentId];

  while (frontier.length) {
    const children = await tx.comment.findMany({
      where: { parentCommentId: { in: frontier } },
      select: { id: true },
    });

    frontier = children.map(child => child.id);
    ids.push(...frontier);
  }

  return ids;
};
