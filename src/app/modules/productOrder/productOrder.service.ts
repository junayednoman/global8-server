import {
  OrderPaymentStatus,
  OrderStatus,
  PaymentPurpose,
  Prisma,
  UserRole,
} from "@prisma/client";
import ApiError from "../../classes/ApiError";
import { TAuthUser } from "../../interface/global.interface";
import {
  calculatePagination,
  TPaginationOptions,
} from "../../utils/paginationCalculation";
import prisma from "../../utils/prisma";
import { generateTransactionId } from "../../utils/generateTransactionId";
import {
  createCheckoutSession,
  ensureOrderAccess,
  generateOrderId,
  getPagination,
  getProductImage,
  mapOrderStatusForUi,
  retrieveCheckoutSession,
} from "./productOrder.utils";
import {
  TCreateProductOrder,
  TUpdateProductOrderStatus,
} from "./productOrder.validation";

const create = async (payload: TCreateProductOrder, auth: TAuthUser) => {
  const cart = await prisma.cart.findUnique({
    where: { authId: auth.id },
    include: {
      cartItems: {
        include: {
          product: {
            select: {
              id: true,
              vendorId: true,
              title: true,
              colors: true,
              quantity: true,
              shippingCost: true,
            },
          },
        },
      },
    },
  });

  if (!cart || cart.cartItems.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }

  if (cart.expiresAt && cart.expiresAt < new Date()) {
    throw new ApiError(400, "Cart has expired");
  }

  const vendorCartItems = cart.cartItems.filter(
    item => item.product.vendorId === payload.vendorId
  );
  if (vendorCartItems.length === 0) {
    throw new ApiError(400, "No cart items found for the selected vendor");
  }

  const subtotal = vendorCartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingFee = vendorCartItems.reduce(
    (sum, item) => sum + (item.product.shippingCost ?? 0) * item.quantity,
    0
  );
  const total = subtotal + shippingFee;

  const generatedOrderId = generateOrderId();
  const transactionId = generateTransactionId("ord");
  const receiverId = payload.vendorId;
  const session =
    total > 0
      ? await createCheckoutSession(
          auth.email,
          {
            id: "pending-order",
            orderId: generatedOrderId,
            orderItems: vendorCartItems.map(item => ({
              productTitle: item.product.title,
              price: item.price,
              quantity: item.quantity,
            })),
          },
          transactionId
        )
      : null;

  await prisma.$transaction(async tx => {
    for (const item of vendorCartItems) {
      const latestProduct = await tx.product.findUnique({
        where: { id: item.productId },
        select: { quantity: true },
      });
      if (!latestProduct) throw new ApiError(404, "Product not found");
      if (latestProduct.quantity < item.quantity) {
        throw new ApiError(409, "Insufficient stock for one or more products");
      }
    }

    const order = await tx.order.create({
      data: {
        authId: auth.id,
        orderId: generatedOrderId,
        customerName: payload.name,
        customerPhone: payload.phone,
        addressLine1: payload.address,
        paymentMethod: "STRIPE",
        paymentStatus:
          total > 0 ? OrderPaymentStatus.PENDING : OrderPaymentStatus.PAID,
        status: OrderStatus.PROCESSING,
        subtotal,
        shippingFee,
        total,
      },
    });

    await tx.orderItem.createMany({
      data: vendorCartItems.map(item => ({
        orderId: order.id,
        productId: item.productId,
        vendorId: item.product.vendorId,
        productTitle: item.product.title,
        productImage: getProductImage(item.product.colors, item.color),
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
      })),
    });

    if (total === 0) {
      for (const item of vendorCartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          product: { vendorId: payload.vendorId },
        },
      });
    }

    if (total > 0) {
      await tx.payment.create({
        data: {
          payerId: auth.id,
          receiverId,
          amount: total,
          transactionId,
          purpose: PaymentPurpose.PRODUCT,
          stripeSessionId: session?.id ?? null,
          stripePaymentIntentId:
            typeof session?.payment_intent === "string"
              ? session.payment_intent
              : null,
          orderId: order.id,
        },
      });
    }
  });

  return {
    checkoutUrl: total > 0 ? (session?.url ?? null) : null,
  };
};

const createPaymentSession = async (id: string, auth: TAuthUser) => {
  const order = await prisma.order.findFirst({
    where: { id, authId: auth.id },
    include: { orderItems: true },
  });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.paymentStatus === OrderPaymentStatus.PAID) {
    throw new ApiError(400, "Order is already paid");
  }

  const transactionId = generateTransactionId("ord");
  const receiverId =
    order.orderItems.find(item => !!item.vendorId)?.vendorId ?? null;
  const session = await createCheckoutSession(
    auth.email,
    {
      id: order.id,
      orderId: order.orderId,
      orderItems: order.orderItems.map(item => ({
        productTitle: item.productTitle,
        price: item.price,
        quantity: item.quantity,
      })),
    },
    transactionId
  );

  await prisma.$transaction(async tx => {
    await tx.payment.create({
      data: {
        payerId: auth.id,
        receiverId,
        amount: order.total,
        transactionId,
        purpose: PaymentPurpose.PRODUCT,
        stripeSessionId: session.id ?? null,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        orderId: order.id,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: OrderPaymentStatus.PENDING },
    });
  });

  return { checkoutUrl: session.url };
};

const paymentCallback = async (query: Record<string, any>) => {
  const { sessionId, transactionId } = query;
  if (!sessionId || !transactionId) {
    throw new ApiError(400, "Missing payment callback parameters");
  }

  const session = await retrieveCheckoutSession(sessionId);
  if (session.payment_status !== "paid") return;

  await prisma.$transaction(async tx => {
    const payment = await tx.payment.findUnique({
      where: { transactionId },
      select: {
        id: true,
        orderId: true,
        stripePaymentIntentId: true,
        stripeSessionId: true,
      },
    });
    if (!payment) throw new ApiError(404, "Payment not found");
    if (payment.stripeSessionId && payment.stripeSessionId !== session.id) {
      throw new ApiError(400, "Payment session mismatch");
    }
    if (payment.orderId !== null) {
      const targetOrder = await tx.order.findUnique({
        where: { id: payment.orderId },
        select: { id: true },
      });
      if (!targetOrder) throw new ApiError(404, "Order not found");
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        stripeSessionId: session.id ?? null,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : payment.stripePaymentIntentId,
        paidAt: new Date(),
      },
    });

    const targetOrderId = payment.orderId;
    if (!targetOrderId) {
      throw new ApiError(404, "Payment is not linked to any order");
    }

    const targetOrder = await tx.order.findUnique({
      where: { id: targetOrderId },
      include: { orderItems: true },
    });
    if (!targetOrder) throw new ApiError(404, "Order not found");

    if (targetOrder.paymentStatus === OrderPaymentStatus.PAID) {
      return;
    }

    for (const item of targetOrder.orderItems) {
      const latestProduct = await tx.product.findUnique({
        where: { id: item.productId },
        select: { quantity: true },
      });
      if (!latestProduct || latestProduct.quantity < item.quantity) {
        throw new ApiError(
          409,
          "Insufficient stock to finalize this paid order"
        );
      }
    }

    for (const item of targetOrder.orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    const userCart = await tx.cart.findUnique({
      where: { authId: targetOrder.authId },
      select: { id: true },
    });

    if (userCart) {
      await tx.cartItem.deleteMany({
        where: {
          cartId: userCart.id,
          productId: { in: targetOrder.orderItems.map(item => item.productId) },
        },
      });
    }

    await tx.order.update({
      where: { id: targetOrderId },
      data: {
        paymentStatus: OrderPaymentStatus.PAID,
        paymentMethod: "STRIPE",
      },
    });
  });
};

const getAll = async (
  auth: TAuthUser,
  options: TPaginationOptions,
  query: Record<string, any>
) => {
  const { page, limit } = getPagination(options);

  const andConditions: Prisma.OrderWhereInput[] = [];

  if (auth.role === UserRole.USER) {
    andConditions.push({ authId: auth.id });
  } else if (auth.role === UserRole.VENDOR) {
    andConditions.push({ orderItems: { some: { vendorId: auth.id } } });
  }

  const status =
    typeof query.status === "string" ? query.status.toUpperCase() : undefined;
  if (status) {
    const allowed = new Set([
      "PROCESSING",
      "READY_TO_SHIP",
      "SHIPPED",
      "DELIVERED",
    ]);
    if (!allowed.has(status)) throw new ApiError(400, "Invalid status value");
    andConditions.push({ status: status as OrderStatus });
  }

  const paymentStatus =
    typeof query.paymentStatus === "string"
      ? query.paymentStatus.toUpperCase()
      : undefined;
  if (paymentStatus) {
    const allowed = new Set([
      "PENDING",
      "PAID",
      "UNPAID",
      "FAILED",
      "REFUNDED",
    ]);
    if (!allowed.has(paymentStatus)) {
      throw new ApiError(400, "Invalid paymentStatus value");
    }
    andConditions.push({ paymentStatus: paymentStatus as OrderPaymentStatus });
  }

  const searchTerm =
    typeof query.searchTerm === "string" ? query.searchTerm.trim() : undefined;
  if (searchTerm) {
    andConditions.push({
      orderId: { contains: searchTerm, mode: "insensitive" },
    });
  }

  const whereConditions: Prisma.OrderWhereInput =
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

  const orders = await prisma.order.findMany({
    where: whereConditions,
    skip,
    take,
    orderBy: sortBy && orderBy ? { [sortBy]: orderBy } : { date: "desc" },
    include: {
      orderItems: {
        take: 1,
        where:
          auth.role === UserRole.VENDOR ? { vendorId: auth.id } : undefined,
      },
    },
  });

  const total = await prisma.order.count({
    where: whereConditions,
  });

  const sanitizedOrders = orders.map(order => ({
    orderId: order.orderId,
    status: mapOrderStatusForUi(order.status),
    placedAt: order.date,
    item:
      order.orderItems[0] === undefined
        ? null
        : {
            image: order.orderItems[0].productImage,
            title: order.orderItems[0].productTitle,
            quantity: order.orderItems[0].quantity,
            size: order.orderItems[0].size,
            price: order.orderItems[0].price,
          },
  }));

  return {
    meta: { page: currentPage, limit: take, total },
    orders: sanitizedOrders,
  };
};

const getDetails = async (id: string, auth: TAuthUser) => {
  const order = await ensureOrderAccess(id, auth);

  const orderItems =
    auth.role === UserRole.VENDOR
      ? order.orderItems.filter(item => item.vendorId === auth.id)
      : order.orderItems;

  return {
    ...order,
    status: mapOrderStatusForUi(order.status),
    orderItems,
    latestPayment: order.payments[0] ?? null,
  };
};

const updateStatus = async (
  id: string,
  auth: TAuthUser,
  payload: TUpdateProductOrderStatus
) => {
  const order = await ensureOrderAccess(id, auth);

  const statusFlow: Record<string, OrderStatus[]> = {
    PROCESSING: [OrderStatus.READY_TO_SHIP, OrderStatus.SHIPPED],
    READY_TO_SHIP: [OrderStatus.SHIPPED],
    SHIPPED: [OrderStatus.DELIVERED],
    DELIVERED: [],
  };

  const currentStatus = order.status;
  const allowedNext = statusFlow[currentStatus] ?? [];
  if (!allowedNext.includes(payload.status)) {
    throw new ApiError(400, "Invalid status transition");
  }

  const requiresPaidBeforeShipping =
    payload.status === OrderStatus.SHIPPED ||
    payload.status === OrderStatus.DELIVERED;
  if (
    requiresPaidBeforeShipping &&
    order.paymentStatus !== OrderPaymentStatus.PAID
  ) {
    throw new ApiError(400, "Order must be paid before shipment");
  }

  return prisma.order.update({
    where: { id },
    data: { status: payload.status },
  });
};

export const ProductOrderService = {
  create,
  createPaymentSession,
  paymentCallback,
  getAll,
  getDetails,
  updateStatus,
};
