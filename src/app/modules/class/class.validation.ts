import { z } from "zod";
import { dateStringSchema } from "../../utils/dateValidation";

export const createClassSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).optional(),
    type: z.enum(["VIRTUAL", "OFFLINE"]),
    skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "PRO"]),
    date: dateStringSchema,
    isFree: z.boolean().default(false),
    amount: z.number().int().min(0).optional(),
    capacity: z.number().int().min(1).optional(),
    location: z.string().trim().optional(),
    isPackage: z.boolean().default(false),
    packageInterval: z.enum(["ONE", "THREE", "SIX", "TWELVE"]).optional(),
  })
  .refine(data => data.isFree || data.amount !== undefined, {
    message: "Amount is required if class is not free",
    path: ["amount"],
  })
  .refine(data => !data.isPackage || data.packageInterval !== undefined, {
    message: "Package interval is required for packages",
    path: ["packageInterval"],
  })
  .refine(data => data.type !== "OFFLINE" || data.location !== undefined, {
    message: "Location is required for offline classes",
    path: ["location"],
  });

export type TCreateClass = z.infer<typeof createClassSchema> & {
  teacherId: string;
  poster?: string;
};

export const updateClassSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).optional(),
    type: z.enum(["VIRTUAL", "OFFLINE"]).optional(),
    skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "PRO"]).optional(),
    date: dateStringSchema.optional(),
    isFree: z.boolean().optional(),
    amount: z.number().int().min(0).optional(),
    capacity: z.number().int().min(1).optional(),
    location: z.string().trim().optional(),
    isPackage: z.boolean().optional(),
    packageInterval: z.enum(["ONE", "THREE", "SIX", "TWELVE"]).optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: "At least one field is required to update",
  });

export type TUpdateClass = z.infer<typeof updateClassSchema> & {
  poster?: string;
};
