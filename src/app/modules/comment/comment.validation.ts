import { z } from "zod";

export const createCommentSchema = z
  .object({
    postId: z.string().uuid().optional(),
    content: z.string().trim().min(1).max(2000),
    parentCommentId: z.string().uuid().optional(),
  })
  .refine(
    data => [data.postId, data.parentCommentId].filter(Boolean).length === 1,
    { message: "Exactly one of postId or parentCommentId is required" }
  );

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export type TCreateComment = z.infer<typeof createCommentSchema>;
export type TUpdateComment = z.infer<typeof updateCommentSchema>;
