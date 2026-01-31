import { Response } from "express";
import { ProfileService } from "./profile.service";
import { TAuthUser, TRequest } from "../../interface/global.interface";
import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";

const getMyProfile = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const authId = (req.user as TAuthUser).id;
    const result = await ProfileService.getMyProfile(authId);

    sendResponse(res, {
      message: "Profile retrieved successfully!",
      data: result,
    });
  }
);

const updateProfile = handleAsyncRequest(
  async (req: TRequest, res: Response) => {
    const authId = (req.user as TAuthUser).id;
    const payload = req.body;
    const result = await ProfileService.updateProfile(
      authId,
      payload,
      req.files as any
    );

    sendResponse(res, {
      message: "Profile updated successfully!",
      data: result,
    });
  }
);

export const ProfileController = {
  getMyProfile,
  updateProfile,
};
