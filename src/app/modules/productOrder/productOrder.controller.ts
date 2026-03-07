import { Response } from "express";
import ApiError from "../../classes/ApiError";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import pick from "../../utils/pick";
import { sendResponse } from "../../utils/sendResponse";
import { ProductOrderService } from "./productOrder.service";

const create = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await ProductOrderService.create(req.body, req.user as TAuthUser);

  sendResponse(res, {
    status: 200,
    message: "Order created successfully!",
    data: result,
  });
});

const createPaymentSession = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    if (!req.params.id) throw new ApiError(400, "Order id is required");

    const result = await ProductOrderService.createPaymentSession(
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
    await ProductOrderService.paymentCallback(req.query);
    sendResponse(res, {
      message: "Order payment processed successfully!",
      data: null,
    });
  }
);

const getAll = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const filters = pick(req.query, ["status", "paymentStatus", "searchTerm"]);
  const result = await ProductOrderService.getAll(
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

  const result = await ProductOrderService.getDetails(
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

    const result = await ProductOrderService.updateStatus(
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

export const ProductOrderController = {
  create,
  createPaymentSession,
  paymentCallback,
  getAll,
  getDetails,
  updateStatus,
};
