import { z } from "zod";

export const createCommunitySchema = z.object({
  title: z.string().trim().min(1).max(120),
  subTitle: z.string().trim().max(300).optional(),
});

export const updateCommunitySchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    subTitle: z.string().trim().max(300).optional(),
  })
  .refine(data => data.title !== undefined || data.subTitle !== undefined, {
    message: "At least one field is required",
  });

export const reviewJoinRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type TCreateCommunity = z.infer<typeof createCommunitySchema>;
export type TUpdateCommunity = z.infer<typeof updateCommunitySchema>;
export type TReviewJoinRequest = z.infer<typeof reviewJoinRequestSchema>;
