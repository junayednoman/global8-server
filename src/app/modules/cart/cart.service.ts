import ApiError from "../../classes/ApiError";
import prisma from "../../utils/prisma";
import { TAddToCart, TUpdateCartItem } from "./cart.validation";
import {
  calculateSnapshotPrice,
  getExpiryDate,
  getOrCreateActiveCart,
  getProductImage,
  isColorAvailable,
  isSizeAvailable,
} from "./cart.utils";

const addItem = async (authId: string, payload: TAddToCart) => {
  const quantityToAdd = payload.quantity ?? 1;
  if (!Number.isFinite(quantityToAdd) || quantityToAdd < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  const product = await prisma.product.findUnique({
    where: { id: payload.productId },
    select: {
      id: true,
      title: true,
      price: true,
      discount: true,
      shippingCost: true,
      quantity: true,
      colors: true,
    },
  });

  if (!product) throw new ApiError(404, "Product not found");
  if (product.quantity < 1) throw new ApiError(409, "Product out of stock");
  if (!isSizeAvailable(product.sizes, payload.size)) {
    throw new ApiError(400, "Selected size is not available for this product");
  }
  if (!isColorAvailable(product.colors, payload.color)) {
    throw new ApiError(400, "Selected color is not available for this product");
  }

  const unitPrice = calculateSnapshotPrice(product.price, product.discount);

  const result = await prisma.$transaction(async tx => {
    const cart = await getOrCreateActiveCart(tx, authId);

    const existingItem = await tx.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id,
        },
      },
      select: { id: true, quantity: true },
    });

    const nextQuantity = existingItem
      ? existingItem.quantity + quantityToAdd
      : quantityToAdd;

    if (nextQuantity > product.quantity) {
      throw new ApiError(409, "Requested quantity exceeds stock");
    }

    if (existingItem) {
      return tx.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: nextQuantity,
          ...(payload.size ? { size: payload.size } : {}),
          ...(payload.color ? { color: payload.color } : {}),
        },
      });
    }

    return tx.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: quantityToAdd,
        price: unitPrice,
        size: payload.size,
        color: payload.color,
      },
    });
  });

  return {
    id: result.id,
    productId: product.id,
    title: product.title,
    image: getProductImage(product.colors, payload.color),
    quantity: result.quantity,
    unitPrice,
  };
};

const getMyCart = async (authId: string) => {
  const now = new Date();
  const cart = await prisma.cart.findUnique({
    where: { authId },
    select: { id: true, expiresAt: true },
  });

  if (cart?.expiresAt && cart.expiresAt < now) {
    await prisma.$transaction(async tx => {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.delete({ where: { id: cart.id } });
    });
    return {
      meta: { totalItems: 0 },
      summary: { subtotal: 0, shippingFee: 0, total: 0 },
      items: [],
      expiresAt: null,
    };
  }

  if (!cart) {
    return {
      meta: { totalItems: 0 },
      summary: { subtotal: 0, shippingFee: 0, total: 0 },
      items: [],
      expiresAt: null,
    };
  }

  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          price: true,
          discount: true,
          shippingCost: true,
          colors: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const mappedItems = items.map(item => {
    const unitPrice = item.price;
    const lineSubtotal = unitPrice * item.quantity;
    const shippingCost = (item.product.shippingCost ?? 0) * item.quantity;
    return {
      id: item.id,
      productId: item.product.id,
      title: item.product.title,
      image: getProductImage(item.product.colors, item.color),
      quantity: item.quantity,
      unitPrice,
      lineSubtotal,
      shippingCost,
      size: item.size ?? null,
      color: item.color ?? null,
    };
  });

  const subtotal = mappedItems.reduce(
    (sum, item) => sum + item.lineSubtotal,
    0
  );
  const shippingFee = mappedItems.reduce(
    (sum, item) => sum + item.shippingCost,
    0
  );

  return {
    meta: { totalItems: mappedItems.length },
    summary: {
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
    },
    items: mappedItems,
    expiresAt: cart.expiresAt ?? null,
  };
};

const updateQuantity = async (
  authId: string,
  itemId: string,
  payload: TUpdateCartItem
) => {
  const cart = await prisma.cart.findUnique({
    where: { authId },
    select: { id: true, expiresAt: true },
  });
  if (!cart) throw new ApiError(404, "Cart not found");
  if (cart.expiresAt && cart.expiresAt < new Date()) {
    await prisma.$transaction(async tx => {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.delete({ where: { id: cart.id } });
    });
    throw new ApiError(404, "Cart not found");
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    include: { product: { select: { quantity: true } } },
  });
  if (!item) throw new ApiError(404, "Cart item not found");

  if (payload.quantity > item.product.quantity) {
    throw new ApiError(409, "Requested quantity exceeds stock");
  }

  const updated = await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity: payload.quantity },
  });

  await prisma.cart.update({
    where: { id: cart.id },
    data: { expiresAt: getExpiryDate() },
  });

  return updated;
};

const removeItem = async (authId: string, itemId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { authId },
    select: { id: true, expiresAt: true },
  });
  if (!cart) throw new ApiError(404, "Cart not found");
  if (cart.expiresAt && cart.expiresAt < new Date()) {
    await prisma.$transaction(async tx => {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.delete({ where: { id: cart.id } });
    });
    throw new ApiError(404, "Cart not found");
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    select: { id: true },
  });
  if (!item) throw new ApiError(404, "Cart item not found");

  await prisma.cartItem.delete({ where: { id: item.id } });
};

const clearCart = async (authId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { authId },
    select: { id: true, expiresAt: true },
  });
  if (!cart) return;
  if (cart.expiresAt && cart.expiresAt < new Date()) {
    await prisma.$transaction(async tx => {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.delete({ where: { id: cart.id } });
    });
    return;
  }

  await prisma.$transaction(async tx => {
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({
      where: { id: cart.id },
      data: { expiresAt: getExpiryDate() },
    });
  });
};

export const CartService = {
  addItem,
  getMyCart,
  updateQuantity,
  removeItem,
  clearCart,
};
