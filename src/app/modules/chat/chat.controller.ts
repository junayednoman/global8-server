import ApiError from "../../classes/ApiError";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import pick from "../../utils/pick";
import { sendResponse } from "../../utils/sendResponse";
import { ChatService } from "./chat.service";

const create = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const result = await ChatService.create(authId, req.body);

  sendResponse(res, {
    status: 201,
    message: "Chat created successfully!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser)?.id;
  if (!authId) throw new ApiError(401, "Unauthorized");

  const options = pick(req.query, ["page", "limit", "searchTerm"]);
  const result = await ChatService.getAll(authId, options);

  sendResponse(res, {
    message: "Chats retrieved successfully!",
    data: result,
  });
});

const getSingle = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.chatId) throw new ApiError(400, "Chat id is required");
  const authId = (req.user as TAuthUser).id;

  const result = await ChatService.getSingle(authId, req.params.chatId);
  sendResponse(res, {
    message: "Chat retrieved successfully!",
    data: result,
  });
});

const getMessages = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.chatId) throw new ApiError(400, "Chat id is required");
  const authId = (req.user as TAuthUser).id;

  const options = pick(req.query, ["page", "limit"]);
  const result = await ChatService.getMessages(
    authId,
    req.params.chatId,
    options
  );

  sendResponse(res, {
    message: "Messages retrieved successfully!",
    data: result,
  });
});

const sendMessage = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.chatId) throw new ApiError(400, "Chat id is required");
  const authId = (req.user as TAuthUser).id;

  const result = await ChatService.sendMessage(
    authId,
    req.params.chatId,
    req.body
  );
  sendResponse(res, {
    status: 201,
    message: "Message sent successfully!",
    data: result,
  });
});

const markRead = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.chatId) throw new ApiError(400, "Chat id is required");
  const authId = (req.user as TAuthUser).id;

  const result = await ChatService.markRead(authId, req.params.chatId);
  sendResponse(res, {
    message: "Chat marked as read!",
    data: result,
  });
});

export const ChatController = {
  create,
  getAll,
  getSingle,
  getMessages,
  sendMessage,
  markRead,
};
