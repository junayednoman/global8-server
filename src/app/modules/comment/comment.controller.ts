import ApiError from "../../classes/ApiError";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import pick from "../../utils/pick";
import { sendResponse } from "../../utils/sendResponse";
import { CommentService } from "./comment.service";

const create = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const result = await CommentService.create(authId, req.body);

  sendResponse(res, {
    status: 201,
    message: "Comment created successfully!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res) => {
  const options = pick(req.query, ["page", "limit"]);
  const query = pick(req.query, ["postId", "parentCommentId"]);
  const result = await CommentService.getAll(req.user?.id, options, query);

  sendResponse(res, {
    message: "Comments retrieved successfully!",
    data: result,
  });
});

const update = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Comment id is required");
  const user = req.user as TAuthUser;
  const result = await CommentService.update(
    req.params.id,
    user.id,
    user.role,
    req.body
  );

  sendResponse(res, {
    message: "Comment updated successfully!",
    data: result,
  });
});

const remove = handleAsyncRequest(async (req: TRequest, res) => {
  if (!req.params.id) throw new ApiError(400, "Comment id is required");
  const user = req.user as TAuthUser;
  await CommentService.remove(req.params.id, user.id, user.role);

  sendResponse(res, {
    message: "Comment deleted successfully!",
    data: null,
  });
});

export const CommentController = {
  create,
  getAll,
  update,
  remove,
};
