import { TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { adminServices } from "./admin.service";
import { Response } from "express";

const getProfile = handleAsyncRequest(async (req: TRequest, res: Response) => {
  const result = await adminServices.getProfile(req.user?.id as string);
  sendResponse(res, {
    message: "Profile fetched successfully!",
    data: result,
  });
});

const updateProfile = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const result = await adminServices.updateProfile(
      req.user?.id as string,
      req.body,
      req.file
    );
    sendResponse(res, {
      message: "Profile updated successfully!",
      data: result,
    });
  }
);

export const adminController = {
  getProfile,
  updateProfile,
};
