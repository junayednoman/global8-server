import { z } from "zod";
import { ProductType } from "@prisma/client";

export const createProductSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.nativeEnum(ProductType).optional(),
  price: z.number().int().positive(),
  quantity: z.number().int().min(0).optional(),
  sizes: z.array(z.string().min(1)).optional(),
  material: z.string().optional(),
  weight: z.number().optional(),
  discount: z.number().int().min(0).max(100).optional(),
  shippingCost: z.number().int().min(0).optional(),
  storeLink: z.string().url().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type TCreateProduct = z.infer<typeof createProductSchema> & {
  colors: { color: string; image: string }[];
};
export type TUpdateProduct = z.infer<typeof updateProductSchema>;

export const addProductColorSchema = z.object({
  color: z.string().min(1),
});

export type TAddProductColor = z.infer<typeof addProductColorSchema> & {
  image: string;
};
