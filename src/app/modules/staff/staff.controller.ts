import ApiError from "../../classes/ApiError";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { StaffService } from "./staff.service";

const getAll = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const result = await StaffService.getAll(authId);
  sendResponse(res, {
    message: "Staff list retrieved successfully!",
    data: result,
  });
});

const create = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const result = await StaffService.create(authId, req.body);
  sendResponse(res, {
    status: 201,
    message: "Staff created successfully!",
    data: result,
  });
});

const update = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Staff id is required");
  const authId = (req.user as TAuthUser).id;
  const result = await StaffService.update(req.params.id, authId, req.body);
  sendResponse(res, {
    message: "Staff updated successfully!",
    data: result,
  });
});

const remove = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Staff id is required");
  const authId = (req.user as TAuthUser).id;
  await StaffService.remove(req.params.id, authId);
  sendResponse(res, {
    message: "Staff deleted successfully!",
    data: null,
  });
});

export const StaffController = {
  getAll,
  create,
  update,
  remove,
};
