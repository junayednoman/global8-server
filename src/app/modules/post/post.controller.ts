import ApiError from "../../classes/ApiError";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import pick from "../../utils/pick";
import { sendResponse } from "../../utils/sendResponse";
import { TPostFiles } from "./post.interface";
import { PostService } from "./post.service";

const create = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const result = await PostService.create(
    authId,
    req.body,
    req.files as TPostFiles
  );

  sendResponse(res, {
    status: 201,
    message: "Post created successfully!",
    data: result,
  });
});

const getFeed = handleAsyncRequest(async (req: TRequest, res) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const query = pick(req.query, ["searchTerm", "creatorId"]);
  const result = await PostService.getFeed(req.user?.id, options, query);

  sendResponse(res, {
    message: "Posts retrieved successfully!",
    data: result,
  });
});

const getMy = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const query = pick(req.query, ["searchTerm"]);
  const result = await PostService.getMy(authId, options, query);

  sendResponse(res, {
    message: "My posts retrieved successfully!",
    data: result,
  });
});

const update = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Post id is required");
  const user = req.user as TAuthUser;

  const result = await PostService.update(
    req.params.id,
    user.id,
    user.role,
    req.body,
    req.files as TPostFiles
  );

  sendResponse(res, {
    message: "Post updated successfully!",
    data: result,
  });
});

const remove = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Post id is required");
  const user = req.user as TAuthUser;

  await PostService.remove(req.params.id, user.id, user.role);

  sendResponse(res, {
    message: "Post deleted successfully!",
    data: null,
  });
});

const patchShareCount = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Post id is required");
  const result = await PostService.patchShareCount(req.params.id, req.body);

  sendResponse(res, {
    message: "Post share count updated successfully!",
    data: result,
  });
});

export const PostController = {
  create,
  getFeed,
  getMy,
  update,
  remove,
  patchShareCount,
};
