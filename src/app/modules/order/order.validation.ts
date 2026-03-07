import { OrderStatus } from "@prisma/client";
import { z } from "zod";

export const createOrderSchema = z.object({
  vendorId: z.string().uuid(),
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export type TCreateOrder = z.infer<typeof createOrderSchema>;
export type TUpdateOrderStatus = z.infer<typeof updateOrderStatusSchema>;
