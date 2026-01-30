import z from "zod";

export const profileUpdateZod = z.object({
  name: z.string().min(1, "Name is required").trim(),
  phone: z.string().min(1, "Phone is required").trim(),
});
