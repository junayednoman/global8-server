import ApiError from "../../classes/ApiError";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import pick from "../../utils/pick";
import { sendResponse } from "../../utils/sendResponse";
import { CommunityService } from "./community.service";

const create = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const result = await CommunityService.create(authId, req.body, req.file);

  sendResponse(res, {
    status: 201,
    message: "Community created successfully!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res) => {
  const options = pick(req.query, ["page", "limit"]);
  const query = pick(req.query, ["searchTerm"]);
  const result = await CommunityService.getAll(req.user?.id, options, query);

  sendResponse(res, {
    message: "Communities retrieved successfully!",
    data: result,
  });
});

const getMy = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const options = pick(req.query, ["page", "limit"]);
  const query = pick(req.query, ["searchTerm"]);
  const result = await CommunityService.getMy(authId, options, query);

  sendResponse(res, {
    message: "My communities retrieved successfully!",
    data: result,
  });
});

const getSingle = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Community id is required");
  const result = await CommunityService.getSingle(req.params.id, req.user?.id);

  sendResponse(res, {
    message: "Community retrieved successfully!",
    data: result,
  });
});

const requestToJoin = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Community id is required");
  const authId = (req.user as TAuthUser).id;
  const result = await CommunityService.requestToJoin(req.params.id, authId);

  sendResponse(res, {
    status: 201,
    message: "Join request submitted successfully!",
    data: result,
  });
});

const reviewJoinRequest = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Community id is required");
  if (!req.params.requestId) throw new ApiError(400, "Request id is required");
  const authId = (req.user as TAuthUser).id;

  const result = await CommunityService.reviewJoinRequest(
    req.params.id,
    req.params.requestId,
    authId,
    req.body
  );

  sendResponse(res, {
    message: "Join request updated successfully!",
    data: result,
  });
});

const getJoinRequests = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Community id is required");
  const authId = (req.user as TAuthUser).id;
  const options = pick(req.query, ["page", "limit"]);
  const query = pick(req.query, ["status"]);
  const result = await CommunityService.getJoinRequests(
    req.params.id,
    authId,
    options,
    query
  );

  sendResponse(res, {
    message: "Join requests retrieved successfully!",
    data: result,
  });
});

const removeMember = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Community id is required");
  if (!req.params.memberAuthId)
    throw new ApiError(400, "Member auth id is required");
  const authId = (req.user as TAuthUser).id;

  await CommunityService.removeMember(
    req.params.id,
    req.params.memberAuthId,
    authId
  );

  sendResponse(res, {
    message: "Community member removed successfully!",
    data: null,
  });
});

const update = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Community id is required");
  const authId = (req.user as TAuthUser).id;

  const result = await CommunityService.update(
    req.params.id,
    authId,
    req.body,
    req.file
  );

  sendResponse(res, {
    message: "Community updated successfully!",
    data: result,
  });
});

const remove = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Community id is required");
  const authId = (req.user as TAuthUser).id;

  await CommunityService.remove(req.params.id, authId);

  sendResponse(res, {
    message: "Community deleted successfully!",
    data: null,
  });
});

const getMembers = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Community id is required");
  const authId = (req.user as TAuthUser).id;
  const options = pick(req.query, ["page", "limit"]);
  const result = await CommunityService.getMembers(
    req.params.id,
    authId,
    options
  );

  sendResponse(res, {
    message: "Community members retrieved successfully!",
    data: result,
  });
});

export const CommunityController = {
  create,
  getAll,
  getMy,
  getSingle,
  requestToJoin,
  reviewJoinRequest,
  getJoinRequests,
  removeMember,
  update,
  remove,
  getMembers,
};
