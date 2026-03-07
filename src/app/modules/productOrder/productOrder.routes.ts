import { UserRole } from "@prisma/client";
import { Router } from "express";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { ProductOrderController } from "./productOrder.controller";
import {
  createProductOrderSchema,
  updateProductOrderStatusSchema,
} from "./productOrder.validation";

const router = Router();

router.post(
  "/",
  authorize(UserRole.USER),
  validate(createProductOrderSchema),
  ProductOrderController.create
);
router.get(
  "/",
  authorize(UserRole.USER, UserRole.VENDOR, UserRole.ADMIN),
  ProductOrderController.getAll
);
router.get("/checkout-callback", ProductOrderController.paymentCallback);
router.get(
  "/:id",
  authorize(UserRole.USER, UserRole.VENDOR, UserRole.ADMIN),
  ProductOrderController.getDetails
);
router.post(
  "/:id/create-checkout-session",
  authorize(UserRole.USER),
  ProductOrderController.createPaymentSession
);
router.patch(
  "/:id/status",
  authorize(UserRole.VENDOR, UserRole.ADMIN),
  validate(updateProductOrderStatusSchema),
  ProductOrderController.updateStatus
);

export const productOrderRoutes = router;
