import { UserRole } from "@prisma/client";
import { Router } from "express";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { uploadImage, upload } from "../../utils/awss3";
import { ClassController } from "./class.controller";
import { createClassSchema, updateClassSchema } from "./class.validation";

const router = Router();

router.post(
  "/",
  authorize(UserRole.TEACHER),
  uploadImage.single("poster"),
  validate(createClassSchema, { formData: true }),
  ClassController.create
);

router.get("/", authorize({ optional: true }), ClassController.getAll);
router.get("/:id", authorize({ optional: true }), ClassController.getSingle);

router.post(
  "/:id/add-video",
  authorize(UserRole.TEACHER),
  upload.single("video"),
  ClassController.addVideo
);

router.patch(
  "/:id",
  authorize(UserRole.TEACHER),
  uploadImage.single("poster"),
  validate(updateClassSchema, { formData: true }),
  ClassController.update
);

router.delete("/:id", authorize(UserRole.TEACHER), ClassController.remove);

export const classRoutes = router;
