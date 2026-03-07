import { z } from "zod";

export const createFeedbackSchema = z.object({
  productId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  ratings: z.number().min(1).max(5),
  comment: z.string().trim().optional(),
}).refine(
  data => [data.productId, data.eventId, data.classId].filter(Boolean).length === 1,
  { message: "Exactly one of productId, eventId, or classId is required" }
);

export const updateFeedbackSchema = z
  .object({
    ratings: z.number().min(1).max(5).optional(),
    comment: z.string().trim().optional(),
  })
  .refine(data => data.ratings !== undefined || data.comment !== undefined, {
    message: "At least one field is required",
  });

export type TCreateFeedback = z.infer<typeof createFeedbackSchema>;
export type TUpdateFeedback = z.infer<typeof updateFeedbackSchema>;
