import crypto from "crypto";
import type { Order as OrderDto, OrderStatus, Paginated, PaymentStatus, PlaceOrderResponse } from "../types/shared";
import { Order, type OrderDoc } from "../Models/Order";
import { Product, type ProductDoc } from "../Models/Product";
import { nextSequence } from "../Models/Counter";
import { env } from "../config/env";
import { escapeRegex } from "../Utils/params";
import { logger } from "../Utils/logger";
import type { PlaceOrderParsed } from "../Validation/orderSchema";
import { newOrderAdminEmail, orderPlacedEmail, orderStatusEmail } from "../emails/templates";
import { notify } from "./notifyService";
import { rememberAddress } from "./authService";
import * as paystack from "./paystackService";
import { toOrderDto } from "./mappers";
import { ServiceError } from "./errors";

const DAY_MS = 86_400_000;

// Each status can only move forward; cancelling is possible until the order
// has been delivered.
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "shipped", "delivered", "cancelled"],
  processing: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const orderNumber = async () => `GH-${new Date().getFullYear()}-${String(await nextSequence("order")).padStart(5, "0")}`;

// ------------------------------------------------------------------ stock

// Takes the units out of stock, product by product, only where enough are
// left. If any product runs short, the ones already taken go back.
async function reserveStock(lines: Map<string, { product: ProductDoc; quantity: number }>) {
  const taken: [string, number][] = [];
  for (const [id, { product, quantity }] of lines) {
    const result = await Product.updateOne({ _id: id, stock: { $gte: quantity } }, { $inc: { stock: -quantity } });
    if (result.modifiedCount === 0) {
      await Promise.all(taken.map(([takenId, n]) => Product.updateOne({ _id: takenId }, { $inc: { stock: n } })));
      const left = (await Product.findById(id).select("stock"))?.stock ?? 0;
      throw new ServiceError(
        409,
        left > 0 ? `Only ${left} ${product.name} left. Lower the quantity to continue.` : `${product.name} just sold out. Remove it to continue.`,
      );
    }
    taken.push([id, quantity]);
  }
}

// Puts a cancelled order's items back on the shelf (once).
async function restock(order: OrderDoc) {
  if (order.restockedAt) return;
  const counts = new Map<string, number>();
  for (const item of order.items) {
    if (item.productId) counts.set(item.productId, (counts.get(item.productId) ?? 0) + (item.quantity ?? 0));
  }
  await Promise.all(
    [...counts].map(([id, quantity]) =>
      // Products deleted since, or from the first version's mock ids, are skipped.
      /^[a-f0-9]{24}$/.test(id) ? Product.updateOne({ _id: id }, { $inc: { stock: quantity } }) : null,
    ),
  );
  order.restockedAt = new Date();
}

function setStatus(order: OrderDoc, status: OrderStatus) {
  order.status = status;
  order.timeline.push({ status, at: new Date() });
}

// ------------------------------------------------------------------ customers

export async function place(userId: string, input: PlaceOrderParsed, returnBase: string): Promise<PlaceOrderResponse> {
  if (input.paymentMethod === "paystack" && !paystack.isPaystackConfigured()) {
    throw new ServiceError(400, "Online payment isn't available right now. Choose pay on delivery.", "paymentMethod");
  }

  // Prices, names and photos come from the database; the cart only says what
  // and how many. The first version charged whatever total the browser sent.
  const ids = [...new Set(input.items.map((item) => item.productId))];
  const products = new Map((await Product.find({ _id: { $in: ids } })).map((p) => [String(p._id), p]));
  const lines = new Map<string, { product: ProductDoc; quantity: number }>();
  const items = input.items.map((item) => {
    const product = products.get(item.productId);
    if (!product) throw new ServiceError(409, "Something in your cart isn't sold anymore. Remove it to continue.");

    const colors = product.colors.map((c) => c.name ?? "");
    const color = colors.length ? (item.color && colors.includes(item.color) ? item.color : colors[0]!) : null;
    const storage = product.storageOptions.length
      ? item.storage && product.storageOptions.includes(item.storage)
        ? item.storage
        : product.storageOptions[0]!
      : null;

    const line = lines.get(item.productId) ?? { product, quantity: 0 };
    line.quantity += item.quantity;
    lines.set(item.productId, line);
    return {
      productId: item.productId,
      name: product.name,
      image: product.images[0]?.url ?? null,
      price: product.price,
      quantity: item.quantity,
      color,
      storage,
    };
  });

  await reserveStock(lines);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = input.deliveryMethod === "doorstep" ? env.deliveryFee() : 0;
  const now = new Date();
  const pickup = input.deliveryMethod === "pickup";
  let order: OrderDoc;
  try {
    order = await Order.create({
      user: userId,
      orderNumber: await orderNumber(),
      customer: {
        ...input.customer,
        address: pickup ? "" : input.customer.address,
        city: pickup ? "" : input.customer.city,
        state: pickup ? "" : input.customer.state,
      },
      items,
      deliveryMethod: input.deliveryMethod,
      paymentMethod: input.paymentMethod,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      timeline: [{ status: "pending", at: now }],
      deliveryDate: new Date(now.getTime() + (pickup ? 1 : 2) * DAY_MS),
    });
  } catch (error) {
    await Promise.all([...lines].map(([id, { quantity }]) => Product.updateOne({ _id: id }, { $inc: { stock: quantity } })));
    throw error;
  }

  if (input.saveAddress && !pickup) {
    await rememberAddress(userId, input.customer).catch((error) => logger.warn({ err: error }, "Could not save checkout address"));
  }

  if (input.paymentMethod === "delivery") {
    announce(order);
    return { order: toOrderDto(order), paymentUrl: null };
  }

  try {
    return { order: toOrderDto(order), paymentUrl: await startPayment(order, returnBase) };
  } catch (error) {
    // Payment never started, so the order didn't really happen.
    await restock(order);
    await order.deleteOne();
    throw error;
  }
}

// Confirmation to the customer and a heads-up to the shop. Pay-on-delivery
// orders are announced straight away; Paystack ones once they're paid.
function announce(order: OrderDoc) {
  const dto = toOrderDto(order);
  notify(dto.customer.email, orderPlacedEmail(dto));
  notify(process.env.ADMIN_NOTIFY_EMAIL?.trim(), newOrderAdminEmail(dto));
}

async function startPayment(order: OrderDoc, returnBase: string): Promise<string> {
  const reference = `${order.orderNumber}-${crypto.randomBytes(3).toString("hex")}`;
  const url = await paystack.initialize({
    email: order.customer?.email ?? "",
    amount: order.total,
    reference,
    // Paystack adds ?trxref=...&reference=... when it sends the shopper back.
    callbackUrl: `${returnBase}/account/orders/${order._id}`,
    metadata: { orderId: String(order._id), orderNumber: order.orderNumber },
  });
  order.paystackReference = reference;
  await order.save();
  return url;
}

async function findOwned(userId: string, id: string): Promise<OrderDoc> {
  const order = await Order.findById(id);
  if (!order || String(order.user) !== userId) throw new ServiceError(404, "We couldn't find that order.");
  return order;
}

export async function listMine(userId: string): Promise<OrderDto[]> {
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
  return orders.map(toOrderDto);
}

export async function getMine(userId: string, id: string): Promise<OrderDto> {
  return toOrderDto(await findOwned(userId, id));
}

// "Pay now" on an unpaid Paystack order: a fresh checkout link.
export async function retryPayment(userId: string, id: string, returnBase: string): Promise<string> {
  const order = await findOwned(userId, id);
  if (order.paymentMethod !== "paystack") throw new ServiceError(400, "This order is paid on delivery.");
  if (order.paymentStatus === "paid") throw new ServiceError(409, "This order is already paid.");
  if (order.status === "cancelled") throw new ServiceError(409, "This order was cancelled.");
  return startPayment(order, returnBase);
}

export async function cancelMine(userId: string, id: string): Promise<OrderDto> {
  const order = await findOwned(userId, id);
  if (!["pending", "processing"].includes(order.status)) {
    throw new ServiceError(409, "This order has already shipped, so it can't be cancelled here. Contact us for a return.");
  }
  return cancel(order);
}

async function cancel(order: OrderDoc): Promise<OrderDto> {
  setStatus(order, "cancelled");
  await restock(order);
  await order.save();
  const dto = toOrderDto(order);
  const email = orderStatusEmail(dto);
  if (email) notify(dto.customer.email, email);
  return dto;
}

// ------------------------------------------------------------------ payments

async function markPaid(order: OrderDoc, amountKobo: number) {
  if (order.paymentStatus === "paid") return;
  if (amountKobo < Math.round(order.total * 100)) {
    logger.error({ orderId: String(order._id), amountKobo, total: order.total }, "Paystack amount is less than the order total");
    throw new ServiceError(400, "The amount paid doesn't match this order. Please contact us.");
  }
  order.paymentStatus = "paid";
  order.paidAt = new Date();
  // A paid order goes straight to the packing queue.
  if (order.status === "pending") setStatus(order, "processing");
  await order.save();
  announce(order);
}

// The shopper is back from Paystack with a reference: ask Paystack how it went.
export async function verifyPayment(userId: string | null, reference: string): Promise<OrderDto> {
  const order = await Order.findOne({ paystackReference: reference });
  if (!order || (userId && String(order.user) !== userId)) throw new ServiceError(404, "We couldn't find a payment with that reference.");
  if (order.paymentStatus === "paid") return toOrderDto(order);

  const transaction = await paystack.verify(reference);
  if (transaction.status === "success" && transaction.currency === "NGN") {
    await markPaid(order, transaction.amount);
  } else if (transaction.status === "failed") {
    order.paymentStatus = "failed";
    await order.save();
  }
  return toOrderDto(order);
}

// Paystack's webhook (signature already checked).
export async function handleWebhook(event: { event?: string; data?: { reference?: string; amount?: number; currency?: string } }) {
  if (event.event !== "charge.success" || !event.data?.reference) return;
  const order = await Order.findOne({ paystackReference: event.data.reference });
  if (!order) {
    logger.warn({ reference: event.data.reference }, "Paystack webhook for an unknown reference");
    return;
  }
  if (event.data.currency && event.data.currency !== "NGN") return;
  await markPaid(order, event.data.amount ?? 0);
}

// ------------------------------------------------------------------ admin

export interface AdminListOptions {
  q?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  page: number;
  limit: number;
}

export async function adminList(options: AdminListOptions): Promise<Paginated<OrderDto>> {
  const filter: Record<string, unknown> = {};
  if (options.status) filter.status = options.status;
  if (options.paymentStatus) filter.paymentStatus = options.paymentStatus;
  const q = options.q?.trim().slice(0, 60);
  if (q) {
    const pattern = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [
      { orderNumber: pattern },
      { "customer.firstName": pattern },
      { "customer.lastName": pattern },
      { "customer.email": pattern },
      { "customer.phone": pattern },
    ];
  }
  const [docs, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((options.page - 1) * options.limit).limit(options.limit),
    Order.countDocuments(filter),
  ]);
  return { items: docs.map(toOrderDto), total, page: options.page, limit: options.limit };
}

export async function adminGet(id: string): Promise<OrderDto> {
  const order = await Order.findById(id);
  if (!order) throw new ServiceError(404, "We couldn't find that order.");
  return toOrderDto(order);
}

export async function adminUpdate(id: string, input: { status?: OrderStatus; paymentStatus?: PaymentStatus }): Promise<OrderDto> {
  const order = await Order.findById(id);
  if (!order) throw new ServiceError(404, "We couldn't find that order.");
  const current = order.status as OrderStatus;

  if (input.paymentStatus && input.paymentStatus !== order.paymentStatus) {
    // Paystack payments are confirmed by Paystack, not by hand.
    if (order.paymentMethod === "paystack") {
      throw new ServiceError(400, "Paystack confirms online payments. Use \"Check payment\" to ask it again.");
    }
    order.paymentStatus = input.paymentStatus;
    order.paidAt = input.paymentStatus === "paid" ? new Date() : null;
  }

  if (input.status && input.status !== current) {
    if (!NEXT[current].includes(input.status)) {
      throw new ServiceError(409, `A ${current} order can't be marked ${input.status}.`);
    }
    if (input.status === "cancelled") return cancel(order);
    if (["shipped", "delivered"].includes(input.status) && order.paymentMethod === "paystack" && order.paymentStatus !== "paid") {
      throw new ServiceError(409, "This order hasn't been paid yet, so it can't ship.");
    }
    setStatus(order, input.status);
    // Pay on delivery: handing it over is when the money is collected.
    if (input.status === "delivered" && order.paymentMethod === "delivery" && order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      order.paidAt = new Date();
    }
    await order.save();
    const dto = toOrderDto(order);
    const email = orderStatusEmail(dto);
    if (email) notify(dto.customer.email, email);
    return dto;
  }

  await order.save();
  return toOrderDto(order);
}

// "Check payment": the admin asks Paystack about the order's latest transaction.
export async function adminCheckPayment(id: string): Promise<OrderDto> {
  const order = await Order.findById(id);
  if (!order) throw new ServiceError(404, "We couldn't find that order.");
  if (!order.paystackReference) throw new ServiceError(400, "This order has no online payment to check.");
  return verifyPayment(null, order.paystackReference);
}
