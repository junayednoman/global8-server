import Stripe from "stripe";
import config from "../../config";
import { generateTransactionId } from "../../utils/generateTransactionId";
import prisma from "../../utils/prisma";
import { Payment, PaymentPurpose, Prisma } from "@prisma/client";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import ApiError from "../../classes/ApiError";

const stripe = new Stripe(config.payment.secret_key as string, {
  apiVersion: "2026-01-28.clover",
});

const createPurchaseEventPaymentSession = async (
  payload: Payment & { eventId: string },
  payerId: string
) => {
  const auth = await prisma.auth.findUniqueOrThrow({
    where: { id: payerId },
    select: { id: true, email: true },
  });

  const alreadyPurchased = await prisma.purchasedEvent.findFirst({
    where: {
      eventId: payload.eventId,
      attendanceId: auth.id,
    },
  });

  if (alreadyPurchased) {
    throw new ApiError(400, "You have already purchased this event!");
  }

  const event = await prisma.event.findUniqueOrThrow({
    where: { id: payload.eventId },
    select: { id: true, title: true, isFree: true, amount: true },
  });

  if (event.isFree) {
    const result = await prisma.purchasedEvent.create({
      data: {
        eventId: event.id,
        attendanceId: auth.id,
      },
    });

    return { result, message: "Event purchased successfully!" };
  }
  const transactionId = generateTransactionId("tnx");
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: auth.email,
    success_url: `${config.payment.callback_endpoint}?sessionId={CHECKOUT_SESSION_ID}&payerId=${auth.id}&transactionId=${transactionId}&eventId=${event.id}`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: event.title,
          },
          unit_amount: Number(event.amount),
        },
        quantity: 1,
      },
    ],
  });

  return { url: session.url };
};

const eventPurchasePaymentCallback = async (query: Record<string, any>) => {
  const { sessionId, payerId, transactionId, eventId } = query;

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status === "paid") {
    const event = await prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      select: { id: true, title: true, amount: true, creatorId: true },
    });
    const paymentPayload = {
      payerId,
      receiverId: event.creatorId,
      amount: Number(event.amount),
      transactionId,
      purpose: PaymentPurpose.EVENT,
    };

    const purchasedEventPayload = {
      attendanceId: payerId,
      eventId,
    };

    const existingPayment = await prisma.payment.findUnique({
      where: { transactionId },
    });

    if (existingPayment) {
      return;
    }

    await prisma.$transaction(async tx => {
      await tx.payment.create({
        data: paymentPayload,
      });
      await tx.purchasedEvent.create({
        data: purchasedEventPayload,
      });
    });
  }
};

const getPurchasedEvents = async (
  userId: string,
  options: TPaginationOptions
) => {
  const andConditions: Prisma.PurchasedEventWhereInput[] = [];

  const whereConditions: Prisma.PurchasedEventWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  andConditions.push({
    attendanceId: userId,
  });

  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const events = await prisma.purchasedEvent.findMany({
    where: whereConditions,
    include: {
      event: true,
    },
    skip,
    take,
    orderBy:
      sortBy && orderBy ? { [sortBy]: orderBy } : { purchasedAt: "desc" },
  });

  const total = await prisma.purchasedEvent.count({
    where: whereConditions,
  });

  const meta = {
    page,
    limit: take,
    total,
  };
  return { meta, events };
};

export const purchasedEventServices = {
  createPurchaseEventPaymentSession,
  eventPurchasePaymentCallback,
  getPurchasedEvents,
};
