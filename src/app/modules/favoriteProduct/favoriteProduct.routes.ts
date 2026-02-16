import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { FavoriteProductController } from "./favoriteProduct.controller";
import validate from "../../middlewares/validate";
import { toggleFavoriteProductSchema } from "./favoriteProduct.validation";

const router = Router();

router.post(
  "/",
  authorize(),
  validate(toggleFavoriteProductSchema),
  FavoriteProductController.toggle
);

router.get("/", authorize(), FavoriteProductController.getAll);

export const favoriteProductRoutes = router;
