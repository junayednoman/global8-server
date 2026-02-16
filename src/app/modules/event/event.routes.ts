import { Router } from "express";
import authorize from "../../middlewares/authorize";
import { UserRole } from "@prisma/client";
import validate from "../../middlewares/validate";
import { upload } from "../../utils/awss3";
import { EventController } from "./event.controller";
import { createEventSchema, updateEventSchema } from "./event.validation";

const router = Router();

router.post(
  "/",
  authorize(UserRole.USER),
  upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  validate(createEventSchema, { formData: true }),
  EventController.createEvent
);

router.get("/", EventController.getEvents);
router.get("/:id", EventController.getEvent);

router.patch(
  "/:id",
  authorize(UserRole.USER),
  upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  validate(updateEventSchema, { formData: true }),
  EventController.updateEvent
);

export const eventRoutes = router;
