import { z } from "zod";

export const toggleFavoriteEventSchema = z.object({
  eventId: z.string().uuid(),
});

export type TToggleFavoriteEvent = z.infer<typeof toggleFavoriteEventSchema>;
