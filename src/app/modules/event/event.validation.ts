import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  type: z.enum(["LOCAL", "VIRTUAL"]),
  location: z.string().optional(),
  date: z.string().optional(),
  isFree: z.boolean().optional(),
  amount: z.number().optional(),
});

export type TCreateEventPayload = z.infer<typeof createEventSchema> & {
  creatorId: string;
  poster?: string;
  video?: string;
};

export const updateEventSchema = createEventSchema.partial();

export type TUpdateEventPayload = z.infer<typeof updateEventSchema> & {
  poster?: string;
  video?: string;
};
