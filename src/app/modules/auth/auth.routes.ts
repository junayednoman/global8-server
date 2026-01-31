import { Router } from "express";
import validate from "../../middlewares/validate";
import {
  changeAccountStatusZod,
  changePasswordZod,
  loginZodSchema,
  resetPasswordZod,
  signupZod,
} from "./auth.validation";
import { authController } from "./auth.controller";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";

const router = Router();

router.get("/:id", authorize(UserRole.ADMIN), authController.getSingle);
router.get("/refresh-token", authController.refreshToken);
router.get("/", authorize(UserRole.ADMIN), authController.getAll);
router.post("/signup", validate(signupZod), authController.signup);
router.post("/login", validate(loginZodSchema), authController.login);

router.post(
  "/reset-password",
  validate(resetPasswordZod),
  authController.resetPassword
);

router.post(
  "/change-password",
  authorize(
    UserRole.ADMIN,
    UserRole.CREATOR,
    UserRole.DJ,
    UserRole.EVENT_ORGANIZER,
    UserRole.TEACHER,
    UserRole.USER,
    UserRole.VENDOR
  ),
  validate(changePasswordZod),
  authController.changePassword
);

router.patch(
  "/change-account-status/:userId",
  authorize(UserRole.ADMIN),
  validate(changeAccountStatusZod),
  authController.changeAccountStatus
);

router.post("/logout", authorize(UserRole.ADMIN), authController.logout);

export const authRoutes = router;
