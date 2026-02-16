import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { FavoriteEventController } from "./favoriteEvent.controller";
import validate from "../../middlewares/validate";
import { toggleFavoriteEventSchema } from "./favoriteEvent.validation";

const router = Router();

router.post(
  "/",
  authorize(),
  validate(toggleFavoriteEventSchema),
  FavoriteEventController.toggle
);

router.get("/", authorize(), FavoriteEventController.getAll);

export const favoriteEventRoutes = router;
