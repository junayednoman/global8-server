import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import ApiError from "../../classes/ApiError";
import { CartService } from "./cart.service";

const addItem = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const authId = (req.user as TAuthUser).id;
  const result = await CartService.addItem(authId, req.body);

  sendResponse(res, {
    status: 201,
    message: "Cart item added successfully!",
    data: result,
  });
});

const getMyCart = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const authId = (req.user as TAuthUser).id;
  const result = await CartService.getMyCart(authId);

  sendResponse(res, {
    message: "Cart retrieved successfully!",
    data: result,
  });
});

const updateQuantity = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const authId = (req.user as TAuthUser).id;
    const itemId = req.params.itemId;
    if (!itemId) throw new ApiError(400, "Cart item id is required");

    const result = await CartService.updateQuantity(authId, itemId, req.body);

    sendResponse(res, {
      message: "Cart item updated successfully!",
      data: result,
    });
  }
);

const removeItem = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const authId = (req.user as TAuthUser).id;
  const itemId = req.params.itemId;
  if (!itemId) throw new ApiError(400, "Cart item id is required");

  await CartService.removeItem(authId, itemId);

  sendResponse(res, {
    message: "Cart item removed successfully!",
    data: null,
  });
});

const clearCart = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const authId = (req.user as TAuthUser).id;
  await CartService.clearCart(authId);

  sendResponse(res, {
    message: "Cart cleared successfully!",
    data: null,
  });
});

export const CartController = {
  addItem,
  getMyCart,
  updateQuantity,
  removeItem,
  clearCart,
};
