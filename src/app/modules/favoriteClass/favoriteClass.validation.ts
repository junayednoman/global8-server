import { z } from "zod";

export const toggleFavoriteClassSchema = z.object({
  classId: z.string().uuid(),
});

export type TToggleFavoriteClass = z.infer<typeof toggleFavoriteClassSchema>;
