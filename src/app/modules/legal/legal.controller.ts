import { Response } from "express";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { TRequest } from "../../interface/global.interface";
import { LegalService } from "./legal.service";

const get = handleAsyncRequest(async (_req: TRequest, res: Response) => {
  const result = await LegalService.get();
  sendResponse(res, {
    message: "Legal data retrieved successfully!",
    data: result,
  });
});

const update = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await LegalService.upsert(req.body);
  sendResponse(res, {
    message: "Legal data updated successfully!",
    data: result,
  });
});

export const LegalController = {
  get,
  update,
};
