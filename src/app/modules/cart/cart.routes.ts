import { Router } from "express";
import { UserRole } from "@prisma/client";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { CartController } from "./cart.controller";
import { addToCartSchema, updateCartItemSchema } from "./cart.validation";

const router = Router();

router.post(
  "/",
  authorize(UserRole.USER),
  validate(addToCartSchema),
  CartController.addItem
);
router.get("/my", authorize(UserRole.USER), CartController.getMyCart);
router.delete("/", authorize(UserRole.USER), CartController.clearCart);
router.delete("/:itemId", authorize(UserRole.USER), CartController.removeItem);
router.patch(
  "/:itemId",
  authorize(UserRole.USER),
  validate(updateCartItemSchema),
  CartController.updateQuantity
);

export const cartRoutes = router;
