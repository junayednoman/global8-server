import { Router } from "express";
import { UserRole } from "@prisma/client";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { ClassEnrollmentController } from "./classEnrollment.controller";
import {
  createClassEnrollmentSchema,
  updateClassEnrollmentStatusSchema,
} from "./classEnrollment.validation";

const router = Router();

router.post(
  "/",
  authorize(UserRole.USER),
  validate(createClassEnrollmentSchema),
  ClassEnrollmentController.create
);

router.get("/", authorize(UserRole.TEACHER), ClassEnrollmentController.getAll);

router.patch(
  "/:id/status",
  authorize(UserRole.TEACHER),
  validate(updateClassEnrollmentStatusSchema),
  ClassEnrollmentController.updateStatus
);

router.get("/checkout-callback", ClassEnrollmentController.paymentCallback);

export const classEnrollmentRoutes = router;
