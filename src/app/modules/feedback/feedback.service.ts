import { Prisma } from "@prisma/client";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import prisma from "../../utils/prisma";
import { TCreateFeedback, TUpdateFeedback } from "./feedback.validation";

const create = async (authId: string, payload: TCreateFeedback) => {
  const targetType = payload.productId
    ? "product"
    : payload.eventId
      ? "event"
      : "class";

  if (targetType === "product") {
    const product = await prisma.product.findUnique({
      where: { id: payload.productId as string },
      select: { id: true },
    });
    if (!product) throw new ApiError(404, "Product not found");

    const existing = await prisma.feedback.findFirst({
      where: { giverId: authId, productId: payload.productId as string },
      select: { id: true },
    });
    if (existing)
      throw new ApiError(409, "You have already reviewed this product");
  }

  if (targetType === "event") {
    const event = await prisma.event.findUnique({
      where: { id: payload.eventId as string },
      select: { id: true },
    });
    if (!event) throw new ApiError(404, "Event not found");

    const existing = await prisma.feedback.findFirst({
      where: { giverId: authId, eventId: payload.eventId as string },
      select: { id: true },
    });
    if (existing)
      throw new ApiError(409, "You have already reviewed this event");
  }

  if (targetType === "class") {
    const klass = await prisma.class.findUnique({
      where: { id: payload.classId as string },
      select: { id: true },
    });
    if (!klass) throw new ApiError(404, "Class not found");

    const existing = await prisma.feedback.findFirst({
      where: { giverId: authId, classId: payload.classId as string },
      select: { id: true },
    });
    if (existing)
      throw new ApiError(409, "You have already reviewed this class");
  }

  return prisma.feedback.create({
    data: {
      giverId: authId,
      productId: payload.productId,
      eventId: payload.eventId,
      classId: payload.classId,
      ratings: payload.ratings,
      comment: payload.comment,
    },
  });
};

const getAll = async (
  options: TPaginationOptions,
  query: Record<string, any>
) => {
  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 10);
  if (!Number.isFinite(page) || page < 1)
    throw new ApiError(400, "Invalid page");
  if (!Number.isFinite(limit) || limit < 1 || limit > 100)
    throw new ApiError(400, "Invalid limit");

  const andConditions: Prisma.FeedbackWhereInput[] = [];

  const productId =
    typeof query.productId === "string" ? query.productId.trim() : undefined;
  const eventId =
    typeof query.eventId === "string" ? query.eventId.trim() : undefined;
  const classId =
    typeof query.classId === "string" ? query.classId.trim() : undefined;
  const targetType =
    typeof query.targetType === "string"
      ? query.targetType.trim().toLowerCase()
      : undefined;

  const idsCount = [productId, eventId, classId].filter(Boolean).length;
  if (idsCount === 0) {
    throw new ApiError(
      400,
      "One target id is required: productId, eventId, or classId"
    );
  }
  if (idsCount > 1) {
    throw new ApiError(400, "Use only one target id filter at a time");
  }

  if (targetType) {
    const allowedTargetTypes = new Set(["product", "event", "class"]);
    if (!allowedTargetTypes.has(targetType)) {
      throw new ApiError(400, "Invalid targetType value");
    }
    if (targetType === "product") {
      andConditions.push({
        productId: { not: null },
        eventId: null,
        classId: null,
      });
    }
    if (targetType === "event") {
      andConditions.push({
        eventId: { not: null },
        productId: null,
        classId: null,
      });
    }
    if (targetType === "class") {
      andConditions.push({
        classId: { not: null },
        productId: null,
        eventId: null,
      });
    }
  }

  if (productId) andConditions.push({ productId });
  if (eventId) andConditions.push({ eventId });
  if (classId) andConditions.push({ classId });

  const whereConditions: Prisma.FeedbackWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

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

  const feedbacks = await prisma.feedback.findMany({
    where: whereConditions,
    include: {
      giver: {
        select: {
          id: true,
          profile: { select: { name: true, image: true } },
        },
      },
      product: {
        select: { id: true, title: true },
      },
      event: {
        select: { id: true, title: true },
      },
      class: {
        select: { id: true, title: true },
      },
    },
    skip,
    take,
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { date: "desc" },
  });

  const total = await prisma.feedback.count({
    where: whereConditions,
  });

  return {
    meta: { page: currentPage, limit: take, total },
    feedbacks,
  };
};

const update = async (id: string, authId: string, payload: TUpdateFeedback) => {
  const feedback = await prisma.feedback.findUnique({
    where: { id },
    select: { id: true, giverId: true },
  });
  if (!feedback) throw new ApiError(404, "Feedback not found");
  if (feedback.giverId !== authId) throw new ApiError(403, "Not authorized");

  return prisma.feedback.update({
    where: { id },
    data: {
      ...(payload.ratings !== undefined ? { ratings: payload.ratings } : {}),
      ...(payload.comment !== undefined ? { comment: payload.comment } : {}),
    },
  });
};

const remove = async (id: string, authId: string) => {
  const feedback = await prisma.feedback.findUnique({
    where: { id },
    select: { id: true, giverId: true },
  });
  if (!feedback) throw new ApiError(404, "Feedback not found");
  if (feedback.giverId !== authId) throw new ApiError(403, "Not authorized");

  await prisma.feedback.delete({ where: { id } });
};

export const FeedbackService = {
  create,
  getAll,
  update,
  remove,
};
