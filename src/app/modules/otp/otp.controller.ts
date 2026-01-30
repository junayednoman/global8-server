import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { sendResponse } from "../../utils/sendResponse";
import { otpServices } from "./otp.service";
import { Request, Response } from "express";

const verifyOtp = handleAsyncRequest(async (req: Request, res: Response) => {
  const result = await otpServices.verifyOtp(req.body);
  sendResponse(res, {
    message: "OTP verified successfully!",
    data: result,
  });
});

const sendOtp = handleAsyncRequest(async (req: Request, res: Response) => {
  const result = await otpServices.sendOtp(req.body.email);
  sendResponse(res, {
    message: "OTP sent successfully!",
    data: result,
  });
});

export const otpController = {
  verifyOtp,
  sendOtp,
};
