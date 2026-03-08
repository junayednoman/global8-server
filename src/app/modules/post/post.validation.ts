import { z } from "zod";

const mediaString = z.string().trim().min(1);

export const createPostSchema = z.object({
  images: z.array(mediaString).max(10).optional(),
  videos: z.array(mediaString).max(5).optional(),
  caption: z.string().trim().max(2000).optional(),
  isExclusive: z.boolean().optional(),
});

export const updatePostSchema = z.object({
  images: z.array(mediaString).max(10).optional(),
  videos: z.array(mediaString).max(5).optional(),
  caption: z.string().trim().max(2000).optional(),
  isExclusive: z.boolean().optional(),
});

export const patchShareCountSchema = z.object({
  count: z.number().int().min(1).default(1),
});

export type TCreatePost = z.infer<typeof createPostSchema>;
export type TUpdatePost = z.infer<typeof updatePostSchema>;
export type TPatchShareCount = z.infer<typeof patchShareCountSchema>;
