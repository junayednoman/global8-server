import ApiError from "../../classes/ApiError";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import { sendResponse } from "../../utils/sendResponse";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import pick from "../../utils/pick";
import { ClassService } from "./class.service";
import { TFile } from "../../interface/file.interface";

const create = handleAsyncRequest(async (req: TRequest, res) => {
  const teacherId = (req.user as TAuthUser).id;
  const result = await ClassService.create(teacherId, req.body, req.file as TFile | undefined);

  sendResponse(res, {
    status: 201,
    message: "Class created successfully!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const filters = pick(req.query, ["searchTerm", "teacherId", "type", "skillLevel", "isFree", "isPackage", "date"]);

  const result = await ClassService.getAll(options, filters, req.user?.id as string | undefined);

  sendResponse(res, {
    message: "Classes retrieved successfully!",
    data: result,
  });
});

const getSingle = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Class id is required");
  const result = await ClassService.getSingle(req.params.id, req.user?.id as string | undefined);

  sendResponse(res, {
    message: "Class retrieved successfully!",
    data: result,
  });
});

const addVideo = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Class id is required");
  if (!req.body.title) throw new ApiError(400, "Video title is required");
  if (!req.file) throw new ApiError(400, "Video file is required");

  const teacherId = (req.user as TAuthUser).id;
  const result = await ClassService.addVideo(req.params.id, teacherId, req.body.title, req.file as TFile);

  sendResponse(res, {
    message: "Video added to class successfully!",
    data: result,
  });
});

const update = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Class id is required");
  const teacherId = (req.user as TAuthUser).id;

  const result = await ClassService.update(req.params.id, teacherId, req.body, req.file as TFile | undefined);

  sendResponse(res, {
    message: "Class updated successfully!",
    data: result,
  });
});

const remove = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Class id is required");
  const teacherId = (req.user as TAuthUser).id;

  await ClassService.remove(req.params.id, teacherId);

  sendResponse(res, {
    message: "Class deleted successfully!",
    data: null,
  });
});

export const ClassController = {
  create,
  getAll,
  getSingle,
  addVideo,
  update,
  remove,
};
