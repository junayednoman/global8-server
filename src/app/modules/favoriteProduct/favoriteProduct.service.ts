import prisma from "../../utils/prisma";
import ApiError from "../../classes/ApiError";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";

const toggleFavoriteProduct = async (authId: string, productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) throw new ApiError(404, "Product not found");

  const existing = await prisma.favoriteProduct.findFirst({
    where: { authId, productId },
    select: { id: true },
  });

  if (existing) {
    await prisma.favoriteProduct.delete({ where: { id: existing.id } });
    return { action: "removed" as const };
  }

  const favorite = await prisma.favoriteProduct.create({
    data: { authId, productId },
  });

  return { action: "added" as const, favoriteId: favorite.id };
};

const getFavoriteProducts = async (
  authId: string,
  options: TPaginationOptions
) => {
  const { page, take, skip, sortBy, orderBy } = calculatePagination(options);

  const favorites = await prisma.favoriteProduct.findMany({
    where: { authId },
    include: {
      product: true,
    },
    skip,
    take,
    orderBy:
      sortBy && orderBy ? { [sortBy]: orderBy } : { createdAt: "desc" },
  });

  const total = await prisma.favoriteProduct.count({
    where: { authId },
  });

  const meta = {
    page,
    limit: take,
    total,
  };

  return { meta, favorites };
};

export const FavoriteProductService = {
  toggleFavoriteProduct,
  getFavoriteProducts,
};
