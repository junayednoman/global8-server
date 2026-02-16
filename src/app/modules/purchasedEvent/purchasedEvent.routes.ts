import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import { purchasedEventController } from "./purchasedEvent.controller";

const router = Router();

router.post(
  "/create-checkout-session",
  authorize(UserRole.USER),
  purchasedEventController.createPurchaseEventPaymentSession
);

router.get(
  "/checkout-callback",
  purchasedEventController.eventPurchasePaymentCallback
);

router.get(
  "/",
  authorize(UserRole.USER),
  purchasedEventController.getPurchasedEvents
);

export const purchasedEventRoutes = router;
