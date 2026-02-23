import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { FavoriteProductController } from "./favoriteProduct.controller";
import validate from "../../middlewares/validate";
import { toggleFavoriteProductSchema } from "./favoriteProduct.validation";
import { UserRole } from "@prisma/client";

const router = Router();

router.post(
  "/",
  authorize(UserRole.USER),
  validate(toggleFavoriteProductSchema),
  FavoriteProductController.toggle
);

router.get("/", authorize(UserRole.USER), FavoriteProductController.getAll);

export const favoriteProductRoutes = router;
