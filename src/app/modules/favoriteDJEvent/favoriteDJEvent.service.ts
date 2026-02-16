import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";

const toggleFavoriteDJEvent = async (authId: string, djEventId: string) => {
  const djEvent = await prisma.dJEvent.findUnique({
    where: { id: djEventId },
    select: { id: true },
  });
  if (!djEvent) throw new ApiError(404, "DJ event not found");

  const existing = await prisma.favoriteDJEvent.findFirst({
    where: { authId, djEventId },
    select: { id: true },
  });

  if (existing) {
    await prisma.favoriteDJEvent.delete({ where: { id: existing.id } });
    return { action: "removed" as const };
  }

  const favorite = await prisma.favoriteDJEvent.create({
    data: { authId, djEventId },
  });

  return { action: "added" as const, favoriteId: favorite.id };
};

const getFavoriteDJEvents = async (
  authId: string,
  options: TPaginationOptions
) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const favorites = await prisma.favoriteDJEvent.findMany({
    where: { authId },
    include: {
      djEvent: true,
    },
    skip,
    take,
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { createdAt: "desc" },
  });

  const total = await prisma.favoriteDJEvent.count({
    where: { authId },
  });

  const meta = {
    page,
    limit: take,
    total,
  };

  return { meta, favorites };
};

export const FavoriteDJEventService = {
  toggleFavoriteDJEvent,
  getFavoriteDJEvents,
};
