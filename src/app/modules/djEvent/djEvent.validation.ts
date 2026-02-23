import { z } from "zod";
import { dateStringSchema } from "../../utils/dateValidation";

export const createDJEventSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000).optional(),
  date: dateStringSchema,
});

export type TCreateDJEvent = z.infer<typeof createDJEventSchema> & {
  djId: string;
  image?: string;
};

export const updateDJEventSchema = createDJEventSchema.partial();

export type TUpdateDJEvent = z.infer<typeof updateDJEventSchema> & {
  image?: string;
};
