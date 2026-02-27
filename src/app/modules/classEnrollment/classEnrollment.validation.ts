import { z } from "zod";

export const createClassEnrollmentSchema = z.object({
  classId: z.string().uuid(),
});

export const updateClassEnrollmentStatusSchema = z.object({
  action: z.enum(["ACCEPT", "DENY", "CANCEL"]),
});

export type TCreateClassEnrollment = z.infer<
  typeof createClassEnrollmentSchema
>;
export type TUpdateClassEnrollmentStatus = z.infer<
  typeof updateClassEnrollmentStatusSchema
>;
