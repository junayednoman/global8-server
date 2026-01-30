import { Router } from "express";
import handleZodValidation from "../../middlewares/handleZodValidation";
import { otpController } from "./otp.controller";
import { verifyOtpZod } from "./otp.validation";

const router = Router();

router.post("/send", otpController.sendOtp);

router.post(
  "/verify",
  handleZodValidation(verifyOtpZod),
  otpController.verifyOtp
);

export const otpRoutes = router;
