import { Router } from "express";
import { UserRole } from "@prisma/client";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { LegalController } from "./legal.controller";
import { updateLegalSchema } from "./legal.validation";

const router = Router();

router.get("/", LegalController.get);
router.patch(
  "/",
  authorize(UserRole.ADMIN),
  validate(updateLegalSchema),
  LegalController.update
);

export const legalRoutes = router;
