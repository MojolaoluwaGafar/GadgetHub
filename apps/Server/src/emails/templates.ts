import type { Order } from "../types/shared";
import { button, clientUrl, detailRows, emailLayout, escapeHtml, itemsTable, naira, paragraph } from "./layout";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const orderUrl = (order: Order) => `${clientUrl()}/account/orders/${order.id}`;

const deliveryLine = (order: Order) =>
  order.deliveryMethod === "doorstep"
    ? `${order.customer.address}, ${order.customer.city}, ${order.customer.state}`
    : "Pickup at our Lagos showroom";

const totals = (order: Order): [string, number][] => [
  ["Subtotal", order.subtotal],
  ["Delivery", order.deliveryFee],
  ["Total", order.total],
];

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" }) : "Soon";

export function welcomeEmail(firstName: string): EmailContent {
  const shop = `${clientUrl()}/products`;
  return {
    subject: "Welcome to GadgetHub",
    html: emailLayout({
      preheader: "Your account is ready. The latest gadgets, delivered across Nigeria.",
      heading: `Welcome, ${escapeHtml(firstName)}`,
      body:
        paragraph("Your GadgetHub account is ready. Save favourites to your wishlist, check out in a minute, and follow every order from packing to your door.") +
        button(shop, "Start shopping"),
    }),
    text: `Welcome to GadgetHub, ${firstName}!\n\nYour account is ready. Start shopping: ${shop}`,
  };
}

export function resetPasswordEmail(firstName: string, token: string): EmailContent {
  const link = `${clientUrl()}/reset-password/${token}`;
  return {
    subject: "Reset your GadgetHub password",
    html: emailLayout({
      preheader: "Use this link within 30 minutes to choose a new password.",
      heading: "Choose a new password",
      body:
        paragraph(`Hi ${escapeHtml(firstName)}, someone (hopefully you) asked to reset the password for this account.`) +
        button(link, "Reset my password") +
        paragraph("The link works once and expires in 30 minutes. If you didn't ask for this, you can ignore this email; your password stays the same."),
    }),
    text: `Hi ${firstName},\n\nReset your GadgetHub password here (expires in 30 minutes):\n${link}\n\nIf you didn't ask for this, ignore this email.`,
  };
}

export function orderPlacedEmail(order: Order): EmailContent {
  const payNote =
    order.paymentMethod === "delivery"
      ? `Please have ${naira(order.total)} ready when your order arrives. We accept cash and transfer.`
      : order.paymentStatus === "paid"
        ? "We've received your payment. Thank you!"
        : "We'll start packing as soon as your payment is confirmed.";
  return {
    subject: `Order ${order.orderNumber} received`,
    html: emailLayout({
      preheader: `Thanks for your order. Estimated delivery: ${formatDate(order.estimatedDelivery)}.`,
      heading: "Thanks for your order",
      body:
        paragraph(`Hi ${escapeHtml(order.customer.firstName)}, we've got your order and we're getting it ready.`) +
        detailRows([
          ["Order", escapeHtml(order.orderNumber)],
          ["Delivery", escapeHtml(deliveryLine(order))],
          ["Expected", formatDate(order.estimatedDelivery)],
        ]) +
        itemsTable(order.items, totals(order)) +
        paragraph(payNote) +
        button(orderUrl(order), "Track your order"),
    }),
    text: `Hi ${order.customer.firstName},\n\nThanks for your order ${order.orderNumber} (total NGN ${order.total.toLocaleString("en-NG")}).\nTrack it here: ${orderUrl(order)}`,
  };
}

const STATUS_COPY: Record<string, { subject: string; heading: string; line: string }> = {
  processing: {
    subject: "is being packed",
    heading: "We're packing your order",
    line: "Your order is confirmed and our team is packing it now.",
  },
  shipped: {
    subject: "is on its way",
    heading: "Your order is on its way",
    line: "Your order has left our warehouse and is heading to you.",
  },
  delivered: {
    subject: "was delivered",
    heading: "Delivered. Enjoy!",
    line: "Your order has been delivered. We hope you love it; you can now review what you bought on its product page.",
  },
  cancelled: {
    subject: "was cancelled",
    heading: "Your order was cancelled",
    line: "Your order has been cancelled. If you paid online, contact us and we'll arrange your refund.",
  },
};

export function orderStatusEmail(order: Order): EmailContent | null {
  const copy = STATUS_COPY[order.status];
  if (!copy) return null;
  return {
    subject: `Order ${order.orderNumber} ${copy.subject}`,
    html: emailLayout({
      preheader: copy.line,
      heading: copy.heading,
      body:
        paragraph(`Hi ${escapeHtml(order.customer.firstName)}, ${copy.line.charAt(0).toLowerCase()}${copy.line.slice(1)}`) +
        detailRows([
          ["Order", escapeHtml(order.orderNumber)],
          ["Total", naira(order.total)],
        ]) +
        button(orderUrl(order), "View your order"),
    }),
    text: `Hi ${order.customer.firstName},\n\n${copy.line}\nOrder ${order.orderNumber}: ${orderUrl(order)}`,
  };
}

// To the shop (ADMIN_NOTIFY_EMAIL): a new order to pack.
export function newOrderAdminEmail(order: Order): EmailContent {
  const link = `${clientUrl()}/admin/orders/${order.id}`;
  return {
    subject: `New order ${order.orderNumber}: ${naira(order.total).replace("&#8358;", "NGN ")}`,
    html: emailLayout({
      preheader: `${order.customer.firstName} ${order.customer.lastName} placed an order.`,
      heading: "New order",
      body:
        detailRows([
          ["Customer", escapeHtml(`${order.customer.firstName} ${order.customer.lastName}`)],
          ["Payment", order.paymentMethod === "delivery" ? "Pay on delivery" : "Paystack"],
          ["Delivery", escapeHtml(deliveryLine(order))],
        ]) +
        itemsTable(order.items, totals(order)) +
        button(link, "Open in admin"),
    }),
    text: `New order ${order.orderNumber} from ${order.customer.firstName} ${order.customer.lastName}: ${link}`,
  };
}
