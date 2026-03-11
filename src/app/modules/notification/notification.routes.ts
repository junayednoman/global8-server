import { Router } from "express";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { NotificationController } from "./notification.controller";
import { createNotificationSchema } from "./notification.validation";

const router = Router();

router.post(
  "/",
  authorize(),
  validate(createNotificationSchema),
  NotificationController.create
);
router.post("/dummy", authorize(), NotificationController.createDummy);
router.get("/", authorize(), NotificationController.getAll);
router.delete("/:id", authorize(), NotificationController.remove);

export const notificationRoutes = router;
