import { Response } from "express";
import ApiError from "../../classes/ApiError";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import pick from "../../utils/pick";
import { sendResponse } from "../../utils/sendResponse";
import { OrderService } from "./order.service";

const create = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await OrderService.create(req.body, req.user as TAuthUser);

  sendResponse(res, {
    status: result.type === "payment" ? 200 : 201,
    message:
      result.type === "payment"
        ? "Order created and payment session generated successfully!"
        : "Order placed successfully!",
    data: result,
  });
});

const createPaymentSession = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    if (!req.params.id) throw new ApiError(400, "Order id is required");

    const result = await OrderService.createPaymentSession(
      req.params.id,
      req.user as TAuthUser
    );

    sendResponse(res, {
      message: "Order payment session generated successfully!",
      data: result,
    });
  }
);

const paymentCallback = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    await OrderService.paymentCallback(req.query);
    sendResponse(res, {
      message: "Order payment processed successfully!",
      data: null,
    });
  }
);

const getAll = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const filters = pick(req.query, ["status", "paymentStatus", "searchTerm"]);
  const result = await OrderService.getAll(
    req.user as TAuthUser,
    options,
    filters
  );

  sendResponse(res, {
    message: "Orders retrieved successfully!",
    data: result,
  });
});

const getDetails = handleAsyncRequest(async (req: TRequest, res: Response) => {
  if (!req.params.id) throw new ApiError(400, "Order id is required");

  const result = await OrderService.getDetails(
    req.params.id,
    req.user as TAuthUser
  );

  sendResponse(res, {
    message: "Order details retrieved successfully!",
    data: result,
  });
});

const updateStatus = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    if (!req.params.id) throw new ApiError(400, "Order id is required");

    const result = await OrderService.updateStatus(
      req.params.id,
      req.user as TAuthUser,
      req.body
    );

    sendResponse(res, {
      message: "Order status updated successfully!",
      data: result,
    });
  }
);

export const OrderController = {
  create,
  createPaymentSession,
  paymentCallback,
  getAll,
  getDetails,
  updateStatus,
};
