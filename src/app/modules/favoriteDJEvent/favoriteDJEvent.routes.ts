import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { FavoriteDJEventController } from "./favoriteDJEvent.controller";
import validate from "../../middlewares/validate";
import { toggleFavoriteDJEventSchema } from "./favoriteDJEvent.validation";

const router = Router();

router.post(
  "/",
  authorize(),
  validate(toggleFavoriteDJEventSchema),
  FavoriteDJEventController.toggle
);

router.get("/", authorize(), FavoriteDJEventController.getAll);

export const favoriteDJEventRoutes = router;
