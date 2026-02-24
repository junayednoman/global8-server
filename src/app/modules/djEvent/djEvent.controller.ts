import ApiError from "../../classes/ApiError";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import { sendResponse } from "../../utils/sendResponse";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import pick from "../../utils/pick";
import { DJEventService } from "./djEvent.service";

const create = handleAsyncRequest(async (req: TRequest, res) => {
  const djId = (req.user as TAuthUser).id;
  const result = await DJEventService.create(djId, req.body, req.file);

  sendResponse(res, {
    status: 201,
    message: "DJ event created successfully!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await DJEventService.getAll(options, req.query, req.user?.id);

  sendResponse(res, {
    message: "DJ events retrieved successfully!",
    data: result,
  });
});

const getSingle = handleAsyncRequest(async (req: TRequest, res) => {
  const result = await DJEventService.getSingle(
    req.params.id as string,
    req.user?.id as string
  );

  sendResponse(res, {
    message: "DJ event retrieved successfully!",
    data: result,
  });
});

const update = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "DJ event id is required");
  const djId = (req.user as TAuthUser).id;

  const result = await DJEventService.update(req.params.id, djId, req.body, req.file);

  sendResponse(res, {
    message: "DJ event updated successfully!",
    data: result,
  });
});

const remove = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "DJ event id is required");
  const djId = (req.user as TAuthUser).id;

  await DJEventService.remove(req.params.id, djId);

  sendResponse(res, {
    message: "DJ event deleted successfully!",
    data: null,
  });
});

export const DJEventController = {
  create,
  getAll,
  getSingle,
  update,
  remove,
};
