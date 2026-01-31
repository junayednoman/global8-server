import { Router } from "express";
import { ProfileController } from "./profile.controller";
import { updateProfileSchema } from "./profile.validation";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import validate from "../../middlewares/validate";
import { upload } from "../../utils/awss3";

const router = Router();

router.get("/my", authorize(UserRole.USER), ProfileController.getMyProfile);
router.patch(
  "/",
  authorize(UserRole.USER),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  validate(updateProfileSchema, { formData: true }),
  ProfileController.updateProfile
);

export const profileRoutes = router;
