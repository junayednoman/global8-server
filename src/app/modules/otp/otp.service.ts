import { UserStatus } from "@prisma/client";
import generateOTP from "../../utils/generateOTP";
import prisma from "../../utils/prisma";
import { sendEmail } from "../../utils/sendEmail";
import ApiError from "../../middlewares/classes/ApiError";
import bcrypt from "bcrypt";
import { TVerifyOtpInput } from "./otp.validation";

const verifyOtp = async (payload: TVerifyOtpInput) => {
  const auth = await prisma.auth.findUniqueOrThrow({
    where: {
      email: payload.email,
    },
  });

  const otp = await prisma.oTP.findUniqueOrThrow({
    where: {
      authId: auth.id,
      isVerified: false,
    },
  });

  const hasOtpExpired = otp.expires < new Date();

  if (otp.attempts > 3)
    throw new ApiError(400, "Too many attempts! Please request a new one!");

  if (hasOtpExpired) {
    throw new ApiError(400, "OTP expired! Please request a new one!");
  }

  // Update the OTP attempts
  await prisma.oTP.update({
    where: {
      authId: auth.id,
    },
    data: {
      attempts: {
        increment: 1,
      },
    },
  });

  const hasMatched = await bcrypt.compare(payload.otp, otp.otp);
  if (!hasMatched) {
    throw new ApiError(400, "Invalid OTP! Please try again!");
  }

  const result = await prisma.$transaction(async tn => {
    if (payload.verifyAccount) {
      const updatedAuth = await tn.auth.update({
        where: {
          email: payload.email,
        },
        data: {
          status: UserStatus.ACTIVE,
        },
        include: {
          profile: true,
        },
      });

      await prisma.oTP.delete({
        where: {
          authId: auth.id,
        },
      });

      // send verification success email
      if (updatedAuth) {
        const subject = "Welcome to Wisper! Your Email is Verified";
        const name = updatedAuth.profile?.name || "there";
        const path = "./src/app/emailTemplates/verificationSuccess.html";
        sendEmail(updatedAuth.email, subject, path, { name });
      }
    } else {
      await tn.oTP.update({
        where: {
          authId: auth.id,
        },
        data: {
          isVerified: true,
        },
      });
    }
  });

  return result;
};

const sendOtp = async (email: string) => {
  const auth = await prisma.auth.findUniqueOrThrow({
    where: {
      email: email,
    },
    select: {
      id: true,
      profile: {
        select: {
          name: true,
        },
      },
      admin: {
        select: {
          name: true,
        },
      },
    },
  });

  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  const otpData = {
    authId: auth.id,
    otp: hashedOtp,
    expires: otpExpires,
    attempts: 0,
    isVerified: false,
  };

  await prisma.oTP.upsert({
    where: {
      authId: auth.id,
    },
    update: otpData,
    create: otpData,
  });

  // send email
  const subject = "Your One-Time Password (OTP)";
  const path = "./src/app/emailTemplates/otp.html";
  sendEmail(email, subject, path, {
    otp,
    name: (auth?.profile?.name as string) || (auth?.admin?.name as string),
  });
};

export const otpServices = {
  verifyOtp,
  sendOtp,
};
