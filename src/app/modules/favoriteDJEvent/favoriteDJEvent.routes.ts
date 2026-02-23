import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { FavoriteDJEventController } from "./favoriteDJEvent.controller";
import validate from "../../middlewares/validate";
import { toggleFavoriteDJEventSchema } from "./favoriteDJEvent.validation";
import { UserRole } from "@prisma/client";

const router = Router();

router.post(
  "/",
  authorize(UserRole.USER),
  validate(toggleFavoriteDJEventSchema),
  FavoriteDJEventController.toggle
);

router.get("/", authorize(UserRole.USER), FavoriteDJEventController.getAll);

export const favoriteDJEventRoutes = router;
