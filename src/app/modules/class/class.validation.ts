import { z } from "zod";
import { dateStringSchema } from "../../utils/dateValidation";

export const createClassSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).optional(),
    type: z.enum(["VIRTUAL_RECORDED", "VIRTUAL_LIVE", "OFFLINE"]),
    skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "PRO"]),
    date: dateStringSchema.optional(),
    isFree: z.boolean().default(false),
    amount: z.number().int().min(0).optional(),
    capacity: z.number().int().min(1).optional(),
    location: z.string().trim().optional(),
    liveClassLink: z.string().trim().url().optional(),
  })
  .refine(data => data.isFree || data.amount !== undefined, {
    message: "Amount is required if class is not free",
    path: ["amount"],
  })
  .refine(data => data.type !== "OFFLINE" || data.location !== undefined, {
    message: "Location is required for offline classes",
    path: ["location"],
  })
  .refine(
    data => data.type !== "VIRTUAL_LIVE" || data.liveClassLink !== undefined,
    {
      message: "Live class link is required for virtual live classes",
      path: ["liveClassLink"],
    }
  );

export type TCreateClass = z.infer<typeof createClassSchema> & {
  teacherId: string;
  poster?: string;
};

export const updateClassSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).optional(),
    type: z.enum(["VIRTUAL_RECORDED", "VIRTUAL_LIVE", "OFFLINE"]).optional(),
    skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "PRO"]).optional(),
    date: dateStringSchema.optional(),
    isFree: z.boolean().optional(),
    amount: z.number().int().min(0).optional(),
    capacity: z.number().int().min(1).optional(),
    location: z.string().trim().optional(),
    liveClassLink: z.string().trim().url().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: "At least one field is required to update",
  });

export type TUpdateClass = z.infer<typeof updateClassSchema> & {
  poster?: string;
};
