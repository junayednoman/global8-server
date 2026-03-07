import { Prisma } from "@prisma/client";

type TProductColor = { color?: string; image?: string };

const CART_EXPIRY_DAYS = 7;
const CART_EXPIRY_MS = CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export const getExpiryDate = () => new Date(Date.now() + CART_EXPIRY_MS);

export const getProductImage = (
  colors: unknown,
  preferredColor?: string | null
) => {
  if (!Array.isArray(colors)) return null;
  const normalizedPreferred = preferredColor?.trim().toLowerCase();

  const normalizedColors = colors
    .map(c => (typeof c === "object" && c ? (c as TProductColor) : null))
    .filter(Boolean) as TProductColor[];

  if (normalizedPreferred) {
    const match = normalizedColors.find(
      c => c.color?.trim().toLowerCase() === normalizedPreferred && c.image
    );
    if (match?.image) return match.image;
  }

  const firstWithImage = normalizedColors.find(c => !!c.image);
  return firstWithImage?.image ?? null;
};

export const calculateSnapshotPrice = (
  price: number,
  discount?: number | null
) => {
  if (!discount || discount <= 0) return price;
  const discounted = price - Math.round((price * discount) / 100);
  return Math.max(0, discounted);
};

export const isSizeAvailable = (sizes: unknown, size?: string | null) => {
  if (!size) return true;
  if (!Array.isArray(sizes)) return false;
  return sizes.some(s => String(s) === size);
};

export const isColorAvailable = (colors: unknown, color?: string | null) => {
  if (!color) return true;
  if (!Array.isArray(colors)) return false;
  return colors.some(c => {
    if (!c || typeof c !== "object") return false;
    const current = c as TProductColor;
    return current.color === color;
  });
};

export const getOrCreateActiveCart = async (
  tx: Prisma.TransactionClient,
  authId: string
) => {
  const now = new Date();
  const existingCart = await tx.cart.findUnique({
    where: { authId },
    select: { id: true, expiresAt: true },
  });

  if (existingCart?.expiresAt && existingCart.expiresAt < now) {
    await tx.cartItem.deleteMany({ where: { cartId: existingCart.id } });
    await tx.cart.delete({ where: { id: existingCart.id } });
    return tx.cart.create({
      data: {
        authId,
        expiresAt: getExpiryDate(),
      },
    });
  }

  if (!existingCart) {
    return tx.cart.create({
      data: {
        authId,
        expiresAt: getExpiryDate(),
      },
    });
  }

  return tx.cart.update({
    where: { id: existingCart.id },
    data: { expiresAt: getExpiryDate() },
  });
};
