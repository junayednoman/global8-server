import { z } from "zod";

export const toggleReactionSchema = z
  .object({
    postId: z.string().uuid().optional(),
    commentId: z.string().uuid().optional(),
  })
  .refine(data => [data.postId, data.commentId].filter(Boolean).length === 1, {
    message: "Exactly one of postId or commentId is required",
  });

export type TToggleReaction = z.infer<typeof toggleReactionSchema>;
