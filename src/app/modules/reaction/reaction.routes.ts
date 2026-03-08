import { Router } from "express";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { ReactionController } from "./reaction.controller";
import { toggleReactionSchema } from "./reaction.validation";

const router = Router();

router.post(
  "/toggle",
  authorize(),
  validate(toggleReactionSchema),
  ReactionController.toggle
);

export const reactionRoutes = router;
