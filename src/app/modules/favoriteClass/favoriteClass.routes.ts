import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { FavoriteClassController } from "./favoriteClass.controller";
import validate from "../../middlewares/validate";
import { toggleFavoriteClassSchema } from "./favoriteClass.validation";
import { UserRole } from "@prisma/client";

const router = Router();

router.post(
  "/",
  authorize(UserRole.USER),
  validate(toggleFavoriteClassSchema),
  FavoriteClassController.toggle
);

router.get("/", authorize(UserRole.USER), FavoriteClassController.getAll);

export const favoriteClassRoutes = router;
