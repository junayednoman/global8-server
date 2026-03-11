import { UserRole } from "@prisma/client";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import prisma from "../../utils/prisma";
import { TCreateNotification } from "./notification.validation";

const create = async (_authId: string, payload: TCreateNotification) => {
  const receiver = await prisma.auth.findUnique({
    where: { id: payload.receiverId },
    select: { id: true },
  });
  if (!receiver) throw new ApiError(404, "Receiver not found");

  return prisma.notification.create({
    data: {
      receiverId: payload.receiverId,
      title: payload.title,
      body: payload.body,
    },
    select: {
      id: true,
      receiverId: true,
      title: true,
      body: true,
      date: true,
    },
  });
};

const createDummy = async (authId: string) => {
  return prisma.notification.create({
    data: {
      receiverId: authId,
      title: "Test Notification",
      body: "This is a dummy notification for testing.",
    },
    select: {
      id: true,
      receiverId: true,
      title: true,
      body: true,
      date: true,
    },
  });
};

const getAll = async (authId: string, options: TPaginationOptions) => {
  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 20);
  if (!Number.isFinite(page) || page < 1)
    throw new ApiError(400, "Invalid page");
  if (!Number.isFinite(limit) || limit < 1 || limit > 100)
    throw new ApiError(400, "Invalid limit");

  const {
    page: currentPage,
    take,
    skip,
  } = calculatePagination({
    ...options,
    page,
    limit,
    sortBy: "date",
    orderBy: "desc",
  });

  const notifications = await prisma.notification.findMany({
    where: { receiverId: authId },
    orderBy: { date: "desc" },
    skip,
    take,
    select: {
      id: true,
      receiverId: true,
      title: true,
      body: true,
      date: true,
    },
  });

  const total = await prisma.notification.count({
    where: { receiverId: authId },
  });

  return {
    meta: { page: currentPage, limit: take, total },
    notifications,
  };
};

const remove = async (id: string, authId: string, role: UserRole) => {
  const notification = await prisma.notification.findUnique({
    where: { id },
    select: { id: true, receiverId: true },
  });
  if (!notification) throw new ApiError(404, "Notification not found");

  const canManage =
    notification.receiverId === authId || role === UserRole.ADMIN;
  if (!canManage) throw new ApiError(403, "Not authorized");

  await prisma.notification.delete({ where: { id } });
};

export const NotificationService = {
  create,
  createDummy,
  getAll,
  remove,
};
