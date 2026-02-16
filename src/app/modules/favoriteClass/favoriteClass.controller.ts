import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import { FavoriteClassService } from "./favoriteClass.service";
import pick from "../../utils/pick";

const toggle = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const result = await FavoriteClassService.toggleFavoriteClass(
    authId,
    req.body.classId
  );

  sendResponse(res, {
    message:
      result.action === "added"
        ? "Class added to favorites!"
        : "Class removed from favorites!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await FavoriteClassService.getFavoriteClasses(authId, options);

  sendResponse(res, {
    message: "Favorite classes retrieved successfully!",
    data: result,
  });
});

export const FavoriteClassController = {
  toggle,
  getAll,
};
