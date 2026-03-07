import ApiError from "../../classes/ApiError";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import pick from "../../utils/pick";
import { sendResponse } from "../../utils/sendResponse";
import { FeedbackService } from "./feedback.service";

const create = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const result = await FeedbackService.create(authId, req.body);

  sendResponse(res, {
    status: 201,
    message: "Feedback created successfully!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const filters = pick(req.query, ["productId", "eventId", "classId", "targetType"]);
  const result = await FeedbackService.getAll(options, filters);

  sendResponse(res, {
    message: "Feedback retrieved successfully!",
    data: result,
  });
});

const update = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  if (!req.params.id) throw new ApiError(400, "Feedback id is required");

  const result = await FeedbackService.update(req.params.id, authId, req.body);

  sendResponse(res, {
    message: "Feedback updated successfully!",
    data: result,
  });
});

const remove = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  if (!req.params.id) throw new ApiError(400, "Feedback id is required");

  await FeedbackService.remove(req.params.id, authId);

  sendResponse(res, {
    message: "Feedback deleted successfully!",
    data: null,
  });
});

export const FeedbackController = {
  create,
  getAll,
  update,
  remove,
};
