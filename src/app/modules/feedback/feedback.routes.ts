import { UserRole } from "@prisma/client";
import { Router } from "express";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { FeedbackController } from "./feedback.controller";
import {
  createFeedbackSchema,
  updateFeedbackSchema,
} from "./feedback.validation";

const router = Router();

router.post(
  "/",
  authorize(UserRole.USER),
  validate(createFeedbackSchema),
  FeedbackController.create
);

router.get("/", FeedbackController.getAll);

router.patch(
  "/:id",
  authorize(UserRole.USER),
  validate(updateFeedbackSchema),
  FeedbackController.update
);

router.delete("/:id", authorize(UserRole.USER), FeedbackController.remove);

export const feedbackRoutes = router;
