import { Router } from "express";
import authorize from "../../middlewares/authorize";
import validate from "../../middlewares/validate";
import { ChatController } from "./chat.controller";
import { createChatSchema, sendMessageSchema } from "./chat.validation";

const router = Router();

router.post(
  "/",
  authorize(),
  validate(createChatSchema),
  ChatController.create
);
router.get("/", authorize(), ChatController.getAll);
router.get("/:chatId", authorize(), ChatController.getSingle);
router.get("/:chatId/messages", authorize(), ChatController.getMessages);
router.post(
  "/:chatId/messages",
  authorize(),
  validate(sendMessageSchema),
  ChatController.sendMessage
);
router.post("/:chatId/read", authorize(), ChatController.markRead);

export const chatRoutes = router;
