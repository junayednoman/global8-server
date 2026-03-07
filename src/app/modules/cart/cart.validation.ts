import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).optional(),
  size: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});

export type TAddToCart = z.infer<typeof addToCartSchema>;
export type TUpdateCartItem = z.infer<typeof updateCartItemSchema>;
