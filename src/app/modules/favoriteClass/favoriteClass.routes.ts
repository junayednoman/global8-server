import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { FavoriteClassController } from "./favoriteClass.controller";
import validate from "../../middlewares/validate";
import { toggleFavoriteClassSchema } from "./favoriteClass.validation";

const router = Router();

router.post(
  "/",
  authorize(),
  validate(toggleFavoriteClassSchema),
  FavoriteClassController.toggle
);

router.get("/", authorize(), FavoriteClassController.getAll);

export const favoriteClassRoutes = router;
