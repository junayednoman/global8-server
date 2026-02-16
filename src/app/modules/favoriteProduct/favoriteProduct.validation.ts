import { z } from "zod";

export const toggleFavoriteProductSchema = z.object({
  productId: z.string().uuid(),
});

export type TToggleFavoriteProduct = z.infer<
  typeof toggleFavoriteProductSchema
>;
