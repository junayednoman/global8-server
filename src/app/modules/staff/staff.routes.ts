import { Router } from "express";
import { UserRole } from "@prisma/client";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { StaffController } from "./staff.controller";
import { createStaffSchema, updateStaffSchema } from "./staff.validation";

const router = Router();

router.get(
  "/",
  authorize(UserRole.CREATOR, UserRole.EVENT_ORGANIZER),
  StaffController.getAll
);
router.post(
  "/",
  authorize(UserRole.CREATOR, UserRole.EVENT_ORGANIZER),
  validate(createStaffSchema),
  StaffController.create
);
router.patch(
  "/:id",
  authorize(UserRole.CREATOR, UserRole.EVENT_ORGANIZER),
  validate(updateStaffSchema),
  StaffController.update
);
router.delete(
  "/:id",
  authorize(UserRole.CREATOR, UserRole.EVENT_ORGANIZER),
  StaffController.remove
);

export const staffRoutes = router;
