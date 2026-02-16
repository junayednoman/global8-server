import { TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import pick from "../../utils/pick";
import { sendResponse } from "../../utils/sendResponse";
import { purchasedEventServices } from "./purchasedEvent.service";
import { Response } from "express";

const createPurchaseEventPaymentSession = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const { url, result, message } =
      await purchasedEventServices.createPurchaseEventPaymentSession(
        req.body,
        req.user?.id as string
      );
    sendResponse(res, {
      message: message ? message : "Event purchased successfully!",
      data: message ? result : { url },
    });
  }
);

const eventPurchasePaymentCallback = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await purchasedEventServices.eventPurchasePaymentCallback(
      req.query
    );
    sendResponse(res, {
      message: "Event purchased successfully!",
      data: result,
    });
  }
);

const getPurchasedEvents = handleAsyncRequest(async (req: TRequest, res) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "orderBy"]);
  const result = await purchasedEventServices.getPurchasedEvents(
    req.user?.id as string,
    options
  );
  sendResponse(res, {
    message: "Purchased events retrieved successfully!",
    data: result,
  });
});

export const purchasedEventController = {
  createPurchaseEventPaymentSession,
  eventPurchasePaymentCallback,
  getPurchasedEvents,
};
