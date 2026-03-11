import ApiError from "../../classes/ApiError";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import pick from "../../utils/pick";
import { sendResponse } from "../../utils/sendResponse";
import { NotificationService } from "./notification.service";

const create = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const result = await NotificationService.create(authId, req.body);

  sendResponse(res, {
    status: 201,
    message: "Notification created successfully!",
    data: result,
  });
});

const createDummy = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const result = await NotificationService.createDummy(authId);

  sendResponse(res, {
    status: 201,
    message: "Dummy notification created successfully!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser)?.id;
  if (!authId) throw new ApiError(401, "Unauthorized");

  const options = pick(req.query, ["page", "limit"]);
  const result = await NotificationService.getAll(authId, options);

  sendResponse(res, {
    message: "Notifications retrieved successfully!",
    data: result,
  });
});

const remove = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Notification id is required");
  const user = req.user as TAuthUser;
  await NotificationService.remove(req.params.id, user.id, user.role);

  sendResponse(res, {
    message: "Notification deleted successfully!",
    data: null,
  });
});

export const NotificationController = {
  create,
  createDummy,
  getAll,
  remove,
};
