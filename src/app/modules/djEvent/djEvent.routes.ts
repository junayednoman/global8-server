import { UserRole } from "@prisma/client";
import { Router } from "express";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { uploadImage } from "../../utils/awss3";
import { DJEventController } from "./djEvent.controller";
import { createDJEventSchema, updateDJEventSchema } from "./djEvent.validation";

const router = Router();

router.post(
  "/",
  authorize(UserRole.DJ),
  uploadImage.single("image"),
  validate(createDJEventSchema, { formData: true }),
  DJEventController.create
);

router.get("/", DJEventController.getAll);
router.get("/:id", authorize({ optional: true }, UserRole.USER), DJEventController.getSingle);

router.patch(
  "/:id",
  authorize(UserRole.DJ),
  uploadImage.single("image"),
  validate(updateDJEventSchema, { formData: true }),
  DJEventController.update
);

router.delete("/:id", authorize(UserRole.DJ), DJEventController.remove);

export const djEventRoutes = router;
