import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { FavoriteEventController } from "./favoriteEvent.controller";
import validate from "../../middlewares/validate";
import { toggleFavoriteEventSchema } from "./favoriteEvent.validation";
import { UserRole } from "@prisma/client";

const router = Router();

router.post(
  "/",
  authorize(UserRole.USER),
  validate(toggleFavoriteEventSchema),
  FavoriteEventController.toggle
);

router.get("/", authorize(UserRole.USER), FavoriteEventController.getAll);

export const favoriteEventRoutes = router;
