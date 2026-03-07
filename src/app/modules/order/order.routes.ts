import { UserRole } from "@prisma/client";
import { Router } from "express";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { OrderController } from "./order.controller";
import { createOrderSchema, updateOrderStatusSchema } from "./order.validation";

const router = Router();

router.post(
  "/",
  authorize(UserRole.USER),
  validate(createOrderSchema),
  OrderController.create
);
router.get(
  "/",
  authorize(UserRole.USER, UserRole.VENDOR, UserRole.ADMIN),
  OrderController.getAll
);
router.get("/checkout-callback", OrderController.paymentCallback);
router.get(
  "/:id",
  authorize(UserRole.USER, UserRole.VENDOR, UserRole.ADMIN),
  OrderController.getDetails
);
router.post(
  "/:id/create-checkout-session",
  authorize(UserRole.USER),
  OrderController.createPaymentSession
);
router.patch(
  "/:id/status",
  authorize(UserRole.VENDOR, UserRole.ADMIN),
  validate(updateOrderStatusSchema),
  OrderController.updateStatus
);

export const orderRoutes = router;
