import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import { FavoriteDJEventService } from "./favoriteDJEvent.service";
import pick from "../../utils/pick";

const toggle = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const result = await FavoriteDJEventService.toggleFavoriteDJEvent(
    authId,
    req.body.djEventId
  );

  sendResponse(res, {
    message:
      result.action === "added"
        ? "DJ event added to favorites!"
        : "DJ event removed from favorites!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await FavoriteDJEventService.getFavoriteDJEvents(
    authId,
    options
  );

  sendResponse(res, {
    message: "Favorite DJ events retrieved successfully!",
    data: result,
  });
});

export const FavoriteDJEventController = {
  toggle,
  getAll,
};
