import prisma from "../../utils/prisma";
import { uploadToS3, deleteFromS3 } from "../../utils/awss3";
import { TFile } from "../../interface/file.interface";
import { TCreateProduct, TUpdateProduct } from "./product.validation";
import ApiError from "../../classes/ApiError";
import { Prisma } from "@prisma/client";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";

type TProductColor = { color: string; image: string };
const create = async (
  vendorId: string,
  payload: TCreateProduct,
  file: TFile
) => {
  if (!file) throw new ApiError(400, "Image is required");

  const image = await uploadToS3(file);
  const colors = [{ color: "default", image }];

  payload.colors = colors;

  return prisma.product.create({
    data: {
      ...payload,
      vendorId,
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

  const searchTerm =
    typeof query.searchTerm === "string" ? query.searchTerm.trim() : undefined;
  const andConditions: Prisma.ProductWhereInput[] = [];
  if (searchTerm) {
    andConditions.push({
      OR: [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (query.type) {
    andConditions.push({
      type: query.type,
    });
  }

  if (query.vendorId) {
    andConditions.push({
      vendorId: query.vendorId,
    });
  }

  const whereConditions: Prisma.ProductWhereInput =
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
  const products = await prisma.product.findMany({
    where: whereConditions,
    skip,
    take,
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { createdAt: "desc" },
  });

  const total = await prisma.product.count({
    where: whereConditions,
  });

  const meta = {
    page: currentPage,
    limit: take,
    total,
  };
  return { meta, products };
};

const getSingle = async (id: string, authId?: string) => {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!authId) {
    return { ...product, isBookmarked: false };
  }

  const bookmark = await prisma.favoriteProduct.findFirst({
    where: { productId: id, authId },
    select: { id: true },
  });

  return { ...product, isBookmarked: !!bookmark };
};

const addProductColor = async (id: string, color: string, file: TFile) => {
  const product = await prisma.product.findUniqueOrThrow({ where: { id } });
  const normalizedColor = color?.trim().toLowerCase();
  if (!normalizedColor) throw new ApiError(400, "Color is required");
  if (!file) throw new ApiError(400, "Image is required");

  const image = await uploadToS3(file);
  const colorObj = { color: normalizedColor, image };

  const colors = Array.isArray(product.colors)
    ? (product.colors as TProductColor[])
    : [];

  const exists = colors.some(
    c => c.color?.trim().toLowerCase() === normalizedColor
  );
  if (exists) throw new ApiError(409, "Color already exists");

  colors.push(colorObj);

  return prisma.product.update({
    where: { id },
    data: { colors },
  });
};

const removeProductColor = async (id: string, color: string) => {
  const product = await prisma.product.findUniqueOrThrow({ where: { id } });
  const normalizedColor = color?.trim().toLowerCase();
  if (!normalizedColor) throw new ApiError(400, "Color is required");
  const colors = Array.isArray(product.colors)
    ? (product.colors as TProductColor[])
    : [];

  if (colors.length <= 1)
    throw new ApiError(400, "You cannot remove the last color!");

  const index = colors.findIndex(
    c => c.color?.trim().toLowerCase() === normalizedColor
  );
  if (index === -1) throw new ApiError(404, "Color not found");

  const [removed] = colors.splice(index, 1);

  const result = await prisma.product.update({
    where: { id },
    data: { colors },
  });

  if (removed?.image) {
    await deleteFromS3(removed.image);
  }

  return result;
};

const update = async (
  id: string,
  vendorId: string,
  payload: TUpdateProduct
) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.vendorId !== vendorId)
    throw new ApiError(403, "Not authorized");
  if (!payload || Object.keys(payload).length === 0) {
    throw new ApiError(400, "Update payload is required");
  }

  return prisma.product.update({
    where: { id },
    data: payload,
  });
};

const remove = async (id: string, vendorId: string) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.vendorId !== vendorId)
    throw new ApiError(403, "Not authorized");

  const colors = Array.isArray(product.colors)
    ? (product.colors as TProductColor[])
    : [];

  const orderItemCount = await prisma.orderItem.count({
    where: { productId: id },
  });
  if (orderItemCount > 0) {
    throw new ApiError(409, "Cannot delete product with existing orders");
  }

  const result = await prisma.$transaction(async tx => {
    await tx.favoriteProduct.deleteMany({ where: { productId: id } });
    await tx.cartItem.deleteMany({ where: { productId: id } });
    await tx.feedback.deleteMany({ where: { productId: id } });
    return tx.product.delete({ where: { id } });
  });

  for (const color of colors) {
    if (color.image) await deleteFromS3(color.image);
  }

  return result;
};

export const ProductService = {
  create,
  getAll,
  getSingle,
  addProductColor,
  removeProductColor,
  update,
  remove,
};
