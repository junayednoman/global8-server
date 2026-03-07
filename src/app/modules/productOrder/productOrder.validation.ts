import { OrderStatus } from "@prisma/client";
import { z } from "zod";

export const createProductOrderSchema = z.object({
  vendorId: z.string().uuid(),
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
});

export const updateProductOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export type TCreateProductOrder = z.infer<typeof createProductOrderSchema>;
export type TUpdateProductOrderStatus = z.infer<
  typeof updateProductOrderStatusSchema
>;
