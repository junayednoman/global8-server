import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import { FavoriteProductService } from "./favoriteProduct.service";
import pick from "../../utils/pick";

const toggle = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const result = await FavoriteProductService.toggleFavoriteProduct(
    authId,
    req.body.productId
  );

  sendResponse(res, {
    message:
      result.action === "added"
        ? "Product added to favorites!"
        : "Product removed from favorites!",
    data: result,
  });
});

const getAll = handleAsyncRequest(async (req: TRequest, res) => {
  const authId = (req.user as TAuthUser).id;
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await FavoriteProductService.getFavoriteProducts(
    authId,
    options
  );

  sendResponse(res, {
    message: "Favorite products retrieved successfully!",
    data: result,
  });
});

export const FavoriteProductController = {
  toggle,
  getAll,
};
