import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().max(300).optional(),
  socialLinks: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  isVisible: z.boolean().optional(),
});

export type TUpdateProfilePayload = z.infer<typeof updateProfileSchema> & {
  authId: string;
  image?: string;
  coverImage?: string;
};
