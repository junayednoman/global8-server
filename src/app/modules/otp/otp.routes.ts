import { Router } from "express";
import validate from "../../middlewares/validate";
import { otpController } from "./otp.controller";
import { verifyOtpZod } from "./otp.validation";

const router = Router();

router.post("/send", otpController.sendOtp);

router.post("/verify", validate(verifyOtpZod), otpController.verifyOtp);

export const otpRoutes = router;
