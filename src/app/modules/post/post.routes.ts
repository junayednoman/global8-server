import { Router } from "express";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { upload } from "../../utils/awss3";
import { PostController } from "./post.controller";
import {
  createPostSchema,
  patchShareCountSchema,
  updatePostSchema,
} from "./post.validation";

const router = Router();

const postMediaUpload = upload.fields([
  { name: "images", maxCount: 5 },
  { name: "videos", maxCount: 2 },
]);

router.post(
  "/",
  authorize(),
  postMediaUpload,
  validate(createPostSchema, { formData: true }),
  PostController.create
);
router.get("/feed", authorize({ optional: true }), PostController.getFeed);
router.get("/my", authorize(), PostController.getMy);
router.patch(
  "/:id",
  authorize(),
  postMediaUpload,
  validate(updatePostSchema, { formData: true }),
  PostController.update
);
router.delete("/:id", authorize(), PostController.remove);
router.patch(
  "/:id/share-count",
  authorize(),
  validate(patchShareCountSchema),
  PostController.patchShareCount
);

export const postRoutes = router;
