import { FileType } from "@prisma/client";
import { z } from "zod";

export const createChatSchema = z.object({
  recipientId: z.string().uuid(),
});

export const sendMessageSchema = z
  .object({
    text: z.string().trim().min(1).max(2000).optional(),
    file: z.string().trim().url().optional(),
    fileType: z.nativeEnum(FileType).optional(),
  })
  .refine(data => data.text || data.file, {
    message: "Either text or file is required",
  })
  .refine(data => !data.file || data.fileType, {
    message: "fileType is required when file is provided",
  });

export type TCreateChat = z.infer<typeof createChatSchema>;
export type TSendMessage = z.infer<typeof sendMessageSchema>;
