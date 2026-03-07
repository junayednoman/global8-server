import { OrderStatus, UserRole } from "@prisma/client";
import Stripe from "stripe";
import ApiError from "../../classes/ApiError";
import config from "../../config";
import { TAuthUser } from "../../interface/global.interface";
import prisma from "../../utils/prisma";

const stripe = new Stripe(config.payment.secret_key as string, {
  apiVersion: "2026-01-28.clover",
});

type TColor = { color?: string; image?: string };

export const generateOrderId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 900 + 100).toString();
  return `ORD-${timestamp}${random}`;
};

export const getProductImage = (colors: unknown, color?: string | null) => {
  if (!Array.isArray(colors)) return null;
  if (color) {
    const matched = colors.find(current => {
      if (!current || typeof current !== "object") return false;
      const parsed = current as TColor;
      return parsed.color === color && !!parsed.image;
    }) as TColor | undefined;
    if (matched?.image) return matched.image;
  }

  const first = colors.find(current => {
    if (!current || typeof current !== "object") return false;
    const parsed = current as TColor;
    return !!parsed.image;
  }) as TColor | undefined;

  return first?.image ?? null;
};

export const ensureOrderAccess = async (orderId: string, auth: TAuthUser) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: true,
      payments: {
        orderBy: { paidAt: "desc" },
      },
    },
  });

  if (!order) throw new ApiError(404, "Order not found");

  if (auth.role === UserRole.USER && order.authId !== auth.id) {
    throw new ApiError(403, "Not authorized to access this order");
  }

  if (auth.role === UserRole.VENDOR) {
    const hasVendorItem = order.orderItems.some(item => item.vendorId === auth.id);
    if (!hasVendorItem) {
      throw new ApiError(403, "Not authorized to access this order");
    }
  }

  return order;
};

export const createCheckoutSession = async (
  email: string,
  order: {
    id: string;
    orderId: string;
    orderItems: Array<{
      productTitle: string | null;
      price: number;
      quantity: number;
    }>;
  },
  transactionId: string
) => {
  const callbackEndpoint = config.payment.callback_endpoint;

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    success_url: `${callbackEndpoint}?sessionId={CHECKOUT_SESSION_ID}&transactionId=${transactionId}&orderId=${order.orderId}`,
    line_items: order.orderItems.map(item => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.productTitle || "Product",
        },
        unit_amount: Number(item.price),
      },
      quantity: item.quantity,
    })),
  });
};

export const retrieveCheckoutSession = async (sessionId: string) => {
  return stripe.checkout.sessions.retrieve(sessionId);
};

export const mapOrderStatusForUi = (status: OrderStatus) => {
  return status === OrderStatus.READY_TO_SHIP ? "SHIPPED" : status;
};

export const getPagination = (options: {
  page?: number;
  limit?: number;
  sortBy?: string;
  orderBy?: "asc" | "desc";
}) => {
  const page = Number(options.page ?? 1);
  const limit = Number(options.limit ?? 10);
  if (!Number.isFinite(page) || page < 1) throw new ApiError(400, "Invalid page");
  if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, "Invalid limit");
  }
  return { page, limit };
};
