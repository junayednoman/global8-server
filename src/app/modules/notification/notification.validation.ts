import { z } from "zod";

export const createNotificationSchema = z.object({
  receiverId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(2000),
});

export type TCreateNotification = z.infer<typeof createNotificationSchema>;
