import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";

const toggleFavoriteEvent = async (authId: string, eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
  if (!event) throw new ApiError(404, "Event not found");

  const existing = await prisma.favoriteEvent.findFirst({
    where: { authId, eventId },
    select: { id: true },
  });

  if (existing) {
    await prisma.favoriteEvent.delete({ where: { id: existing.id } });
    return { action: "removed" as const };
  }

  const favorite = await prisma.favoriteEvent.create({
    data: { authId, eventId },
  });

  return { action: "added" as const, favoriteId: favorite.id };
};

const getFavoriteEvents = async (
  authId: string,
  options: TPaginationOptions
) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const favorites = await prisma.favoriteEvent.findMany({
    where: { authId },
    include: {
      event: true,
    },
    skip,
    take,
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { createdAt: "desc" },
  });

  const total = await prisma.favoriteEvent.count({
    where: { authId },
  });

  const meta = {
    page,
    limit: take,
    total,
  };

  return { meta, favorites };
};

export const FavoriteEventService = {
  toggleFavoriteEvent,
  getFavoriteEvents,
};
