import { z } from "zod";

export const purchaseEventPaymentSchema = z.object({
  eventId: z.string().uuid("Invalid event id"),
});
