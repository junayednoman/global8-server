import { z } from "zod";

export const toggleFavoriteDJEventSchema = z.object({
  djEventId: z.string().uuid(),
});

export type TToggleFavoriteDJEvent = z.infer<
  typeof toggleFavoriteDJEventSchema
>;
