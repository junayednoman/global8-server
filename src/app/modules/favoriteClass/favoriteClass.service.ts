import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";

const toggleFavoriteClass = async (authId: string, classId: string) => {
  const klass = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true },
  });
  if (!klass) throw new ApiError(404, "Class not found");

  const existing = await prisma.favoriteClass.findFirst({
    where: { authId, classId },
    select: { id: true },
  });

  if (existing) {
    await prisma.favoriteClass.delete({ where: { id: existing.id } });
    return { action: "removed" as const };
  }

  const favorite = await prisma.favoriteClass.create({
    data: { authId, classId },
  });

  return { action: "added" as const, favoriteId: favorite.id };
};

const getFavoriteClasses = async (
  authId: string,
  options: TPaginationOptions
) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const favorites = await prisma.favoriteClass.findMany({
    where: { authId },
    include: {
      class: true,
    },
    skip,
    take,
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { createdAt: "desc" },
  });

  const total = await prisma.favoriteClass.count({
    where: { authId },
  });

  const meta = {
    page,
    limit: take,
    total,
  };

  return { meta, favorites };
};

export const FavoriteClassService = {
  toggleFavoriteClass,
  getFavoriteClasses,
};
