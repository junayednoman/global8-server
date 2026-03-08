import { Router } from "express";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { CommentController } from "./comment.controller";
import { createCommentSchema, updateCommentSchema } from "./comment.validation";

const router = Router();

router.post(
  "/",
  authorize(),
  validate(createCommentSchema),
  CommentController.create
);
router.get("/", authorize({ optional: true }), CommentController.getAll);
router.patch(
  "/:id",
  authorize(),
  validate(updateCommentSchema),
  CommentController.update
);
router.delete("/:id", authorize(), CommentController.remove);

export const commentRoutes = router;
