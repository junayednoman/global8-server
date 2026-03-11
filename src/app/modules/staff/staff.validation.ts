import { z } from "zod";

export const createStaffSchema = z.object({
  name: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
});

export const updateStaffSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  role: z.string().trim().min(1).max(200).optional(),
});

export type TCreateStaff = z.infer<typeof createStaffSchema>;
export type TUpdateStaff = z.infer<typeof updateStaffSchema>;
