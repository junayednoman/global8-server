import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import { FavoriteEventService } from "./favoriteEvent.service";
import pick from "../../utils/pick";

const toggle = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const result = await FavoriteEventService.toggleFavoriteEvent(
    authId,
    req.body.eventId
  );

  sendResponse(res, {
    message:
      result.action === "added"
        ? "Event added to favorites!"
        : "Event removed from favorites!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await FavoriteEventService.getFavoriteEvents(authId, options);

  sendResponse(res, {
    message: "Favorite events retrieved successfully!",
    data: result,
  });
});

export const FavoriteEventController = {
  toggle,
  getAll,
};
