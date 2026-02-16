import prisma from "../../utils/prisma";
import { uploadToS3, deleteFromS3 } from "../../utils/awss3";
import { TFile } from "../../interface/file.interface";
import { TCreateEventPayload, TUpdateEventPayload } from "./event.validation";
import ApiError from "../../classes/ApiError";
import { Prisma } from "@prisma/client";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import { TEventFiles } from "./event.interface";

const createEvent = async (
  creatorId: string,
  payload: TCreateEventPayload,
  files: TEventFiles
) => {
  if (!files?.poster?.length)
    throw new ApiError(400, "Poster file is required");
  payload.poster = await uploadToS3(files.poster[0] as TFile);

  if (files?.video?.length) {
    payload.video = await uploadToS3(files.video[0] as TFile);
  }
  payload.creatorId = creatorId;

  return prisma.event.create({ data: payload });
};

const updateEvent = async (
  id: string,
  creatorId: string,
  payload: TUpdateEventPayload,
  files: TEventFiles
) => {
  const event = await prisma.event.findUniqueOrThrow({ where: { id } });
  if (event.creatorId !== creatorId) {
    throw new ApiError(403, "You are not allowed to update this event");
  }

  if (files?.poster?.length) {
    payload.poster = await uploadToS3(files.poster[0] as TFile);
  }

  if (files?.video?.length) {
    payload.video = await uploadToS3(files.video[0] as TFile);
  }

  const result = await prisma.event.update({
    where: { id },
    data: payload,
  });

  if (result) {
    if (event?.poster && payload.poster) {
      await deleteFromS3(event.poster);
    }
    if (event?.video && payload.video) {
      await deleteFromS3(event.video);
    }
  }

  return result;
};

const getAll = async (
  options: TPaginationOptions,
  query: Record<string, any>
) => {
  const andConditions: Prisma.EventWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { title: { contains: query.searchTerm, mode: "insensitive" } },
        { description: { contains: query.searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (query.type) {
    andConditions.push({
      type: query.type,
    });
  }

  if (query.isFree !== undefined) {
    andConditions.push({
      isFree: query.isFree === "true",
    });
  }

  if (query.creatorId) {
    andConditions.push({
      creatorId: query.creatorId,
    });
  }

  const whereConditions: Prisma.EventWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const events = await prisma.event.findMany({
    where: whereConditions,
    skip,
    take,
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { createdAt: "desc" },
  });

  const total = await prisma.event.count({
    where: whereConditions,
  });

  const meta = {
    page,
    limit: take,
    total,
  };

  return { meta, events };
};

const getSingle = async (id: string, authId: string) => {
  const event = await prisma.event.findUnique({ where: { id } });

  const purchasedEvent = await prisma.purchasedEvent.findFirst({
    where: { eventId: id, attendanceId: authId },
    select: { id: true },
  });

  const bookmark = await prisma.favoriteEvent.findFirst({
    where: { eventId: id, authId },
    select: { id: true },
  });

  return { ...event, isPurchased: !!purchasedEvent, isBookmarked: !!bookmark };
};

export const EventService = {
  createEvent,
  updateEvent,
  getAll,
  getSingle,
};
