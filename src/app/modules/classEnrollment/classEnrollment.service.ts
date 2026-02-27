import { EnrollmentStatus, PaymentPurpose, Prisma } from "@prisma/client";
import Stripe from "stripe";
import config from "../../config";
import ApiError from "../../classes/ApiError";
import prisma from "../../utils/prisma";
import { generateTransactionId } from "../../utils/generateTransactionId";
import { sendEmail } from "../../utils/sendEmail";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import {
  TCreateClassEnrollment,
  TUpdateClassEnrollmentStatus,
} from "./classEnrollment.validation";

const stripe = new Stripe(config.payment.secret_key as string, {
  apiVersion: "2026-01-28.clover",
});

const create = async (payload: TCreateClassEnrollment, studentId: string) => {
  const auth = await prisma.auth.findUniqueOrThrow({
    where: { id: studentId },
    select: { id: true, email: true },
  });

  const klass = await prisma.class.findUniqueOrThrow({
    where: { id: payload.classId },
    select: {
      id: true,
      title: true,
      isFree: true,
      amount: true,
      teacherId: true,
    },
  });

  const existingEnrollment = await prisma.classEnrollment.findFirst({
    where: {
      classId: klass.id,
      studentId: auth.id,
    },
    select: { id: true, status: true },
  });

  if (existingEnrollment) {
    throw new ApiError(400, "Enrollment request already exists for this class");
  }

  if (klass.isFree) {
    const enrollment = await prisma.classEnrollment.create({
      data: {
        classId: klass.id,
        studentId: auth.id,
        status: EnrollmentStatus.PENDING,
      },
    });

    return {
      type: "enrollment" as const,
      result: enrollment,
      message: "Class enrollment request submitted successfully!",
    };
  }

  if (!klass.amount || klass.amount <= 0) {
    throw new ApiError(400, "Invalid class amount");
  }

  const transactionId = generateTransactionId("g8-tnx");

  const callbackEndpoint = config.payment.class_enrollment_callback_endpoint;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: auth.email,
    success_url: `${callbackEndpoint}?sessionId={CHECKOUT_SESSION_ID}&payerId=${auth.id}&transactionId=${transactionId}&classId=${klass.id}`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: klass.title,
          },
          unit_amount: Number(klass.amount),
        },
        quantity: 1,
      },
    ],
  });

  return {
    type: "payment" as const,
    url: session.url,
  };
};

const paymentCallback = async (query: Record<string, any>) => {
  const { sessionId, payerId, transactionId, classId } = query;
  if (!sessionId || !payerId || !transactionId || !classId) {
    throw new ApiError(400, "Missing payment callback parameters");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return;

  const existingPayment = await prisma.payment.findUnique({
    where: { transactionId },
    select: { id: true },
  });
  if (existingPayment) return;

  const klass = await prisma.class.findUniqueOrThrow({
    where: { id: classId },
    select: { id: true, amount: true, teacherId: true },
  });

  const existingEnrollment = await prisma.classEnrollment.findFirst({
    where: {
      classId,
      studentId: payerId,
    },
    select: { id: true, paymentId: true },
  });

  await prisma.$transaction(async tx => {
    const payment = await tx.payment.create({
      data: {
        payerId,
        receiverId: klass.teacherId,
        amount: Number(klass.amount),
        transactionId,
        purpose: PaymentPurpose.CLASS,
        stripeSessionId: session.id ?? null,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
      },
    });

    if (!existingEnrollment) {
      await tx.classEnrollment.create({
        data: {
          classId,
          studentId: payerId,
          status: EnrollmentStatus.PENDING,
          paymentId: payment.id,
        },
      });
    } else if (!existingEnrollment.paymentId) {
      await tx.classEnrollment.update({
        where: { id: existingEnrollment.id },
        data: { paymentId: payment.id },
      });
    }
  });
};

const getAll = async (
  teacherId: string,
  options: TPaginationOptions,
  query: Record<string, any>
) => {
  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 10);
  if (!Number.isFinite(page) || page < 1) {
    throw new ApiError(400, "Invalid page");
  }
  if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, "Invalid limit");
  }

  const status =
    typeof query.status === "string" ? query.status.toUpperCase() : undefined;
  const classId =
    typeof query.classId === "string" ? query.classId.trim() : undefined;

  const whereConditions: Prisma.ClassEnrollmentWhereInput = {
    class: { teacherId },
  };

  if (status) {
    const allowedStatuses = new Set([
      "PENDING",
      "ENROLLED",
      "DENIED",
      "CANCELED",
    ]);
    if (!allowedStatuses.has(status)) {
      throw new ApiError(400, "Invalid status value");
    }
    whereConditions.status = status as EnrollmentStatus;
  }

  if (classId) {
    whereConditions.classId = classId;
  }

  const {
    page: currentPage,
    take,
    skip,
    sortBy,
    orderBy,
  } = calculatePagination({
    ...options,
    page,
    limit,
  });

  const enrollments = await prisma.classEnrollment.findMany({
    where: whereConditions,
    select: {
      id: true,
      status: true,
      class: {
        select: {
          id: true,
          isFree: true,
          amount: true,
        },
      },
      student: {
        select: {
          id: true,
          profile: { select: { name: true, image: true } },
        },
      },
    },
    skip,
    take,
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { date: "desc" },
  });

  const total = await prisma.classEnrollment.count({
    where: whereConditions,
  });

  return {
    meta: {
      page: currentPage,
      limit: take,
      total,
    },
    enrollments,
  };
};

const updateStatus = async (
  id: string,
  teacherId: string,
  payload: TUpdateClassEnrollmentStatus
) => {
  const enrollment = await prisma.classEnrollment.findUnique({
    where: { id },
    include: {
      class: {
        select: {
          id: true,
          teacherId: true,
          title: true,
          isFree: true,
          amount: true,
          teacher: {
            select: {
              profile: { select: { name: true } },
            },
          },
        },
      },
      student: {
        select: {
          email: true,
          profile: { select: { name: true } },
        },
      },
      payment: {
        select: {
          id: true,
          stripePaymentIntentId: true,
          refundedAt: true,
        },
      },
    },
  });

  if (!enrollment) throw new ApiError(404, "Class enrollment not found");
  if (enrollment.class.teacherId !== teacherId) {
    throw new ApiError(403, "Not authorized");
  }
  if (enrollment.status !== EnrollmentStatus.PENDING) {
    throw new ApiError(400, "Only pending enrollment requests can be updated");
  }

  const nextStatusByAction: Record<
    TUpdateClassEnrollmentStatus["action"],
    EnrollmentStatus
  > = {
    ACCEPT: EnrollmentStatus.ENROLLED,
    DENY: EnrollmentStatus.DENIED,
    CANCEL: EnrollmentStatus.CANCELED,
  };

  if (
    payload.action === "DENY" &&
    enrollment.payment?.stripePaymentIntentId &&
    !enrollment.payment.refundedAt
  ) {
    const refund = await stripe.refunds.create({
      payment_intent: enrollment.payment.stripePaymentIntentId,
    });

    await prisma.payment.update({
      where: { id: enrollment.payment.id },
      data: {
        refundedAt: new Date(),
        stripeRefundId: refund.id,
      },
    });
  }

  const updated = await prisma.classEnrollment.update({
    where: { id },
    data: {
      status: nextStatusByAction[payload.action],
    },
  });

  const studentEmail = enrollment.student?.email;
  if (studentEmail) {
    const studentName = enrollment.student?.profile?.name || "there";
    const teacherName =
      enrollment.class.teacher?.profile?.name || "your teacher";
    const classTitle = enrollment.class.title || "your class";
    const isPaidClass = !enrollment.class.isFree;
    const refunded =
      payload.action === "DENY" && !!enrollment.payment?.stripePaymentIntentId;

    let paymentNote = "This class is free. No payment was required.";
    if (isPaidClass && payload.action === "ACCEPT") {
      paymentNote = "Your payment has been confirmed.";
    }
    if (isPaidClass && payload.action === "DENY") {
      paymentNote = refunded
        ? "Your payment has been refunded."
        : "If your payment was captured, it will be refunded.";
    }

    const templatePath =
      payload.action === "ACCEPT"
        ? "./src/app/emailTemplates/classEnrollmentAccepted.html"
        : "./src/app/emailTemplates/classEnrollmentDenied.html";

    const subject =
      payload.action === "ACCEPT"
        ? "Your class enrollment was accepted"
        : "Your class enrollment was denied";

    sendEmail(studentEmail, subject, templatePath, {
      name: studentName,
      classTitle,
      teacherName,
      paymentNote,
    }).catch(console.error);
  }

  return updated;
};

export const ClassEnrollmentService = {
  create,
  paymentCallback,
  getAll,
  updateStatus,
};
