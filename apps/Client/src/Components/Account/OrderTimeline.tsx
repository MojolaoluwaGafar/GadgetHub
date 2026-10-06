import type { Order, OrderStatus } from "../../types";
import { cx, formatDateTime, formatDay } from "../../utils/format";
import placedIcon from "../../assets/icons/track-placed.png";
import processingIcon from "../../assets/icons/track-processing.png";
import shippedIcon from "../../assets/icons/track-shipped.png";
import deliveredIcon from "../../assets/icons/track-delivered.png";

const STEPS: { status: OrderStatus; title: string; text: string; icon: string }[] = [
  { status: "pending", title: "Order Placed", text: "Your order has been confirmed", icon: placedIcon },
  { status: "processing", title: "Processing", text: "Your order is being prepared", icon: processingIcon },
  { status: "shipped", title: "Shipped", text: "Your order is on its way", icon: shippedIcon },
  { status: "delivered", title: "Delivered", text: "Your order has been delivered", icon: deliveredIcon },
];

// The design's tracker: circles joined by a line, violet up to the order's
// current status, with the time each step was reached.
export default function OrderTimeline({ order }: { order: Order }) {
  const reached = (status: OrderStatus) => order.timeline.find((step) => step.status === status)?.at;
  const current = STEPS.findIndex((step) => step.status === order.status);
  const cancelledAt = reached("cancelled");

  return (
    <div>
      {order.status !== "cancelled" && order.status !== "delivered" && order.estimatedDelivery && (
        <div className="mb-5 rounded-md border border-[#c4c1c1] bg-[#f4f4f4] p-4">
          <p className="pb-1 text-sm text-gray-500">{order.deliveryMethod === "pickup" ? "Ready for pickup" : "Estimated Delivery"}</p>
          <span className="font-medium">{formatDay(order.estimatedDelivery)}</span>
        </div>
      )}
      <ol>
        {STEPS.map((step, index) => {
          const at = reached(step.status) ?? (index === 0 ? order.createdAt : undefined);
          const done = order.status === "cancelled" ? Boolean(at) : index <= current;
          if (order.status === "cancelled" && !done) return null;
          const last = order.status !== "cancelled" && index === STEPS.length - 1;
          return (
            <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0">
              {!last && <span className={cx("absolute left-4 top-8 -ml-px h-[calc(100%-2rem)] w-0.5", done && index < current ? "bg-brand" : "bg-[#a8a8a8]")} />}
              <span className={cx("relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full", done ? "bg-brand" : "border border-[#a8a8a8] bg-white")}>
                <img src={step.icon} alt="" className={cx("h-4 w-4 object-contain", done && "brightness-0 invert")} />
              </span>
              <div>
                <p className="text-lg font-semibold">{step.title}</p>
                <p className="text-muted">{step.text}</p>
                {done && at && <p className="text-sm text-[#949596]">{formatDateTime(at)}</p>}
              </div>
            </li>
          );
        })}
        {order.status === "cancelled" && (
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger text-sm font-bold text-white">✕</span>
            <div>
              <p className="text-lg font-semibold text-danger">Cancelled</p>
              <p className="text-muted">This order was cancelled</p>
              {cancelledAt && <p className="text-sm text-[#949596]">{formatDateTime(cancelledAt)}</p>}
            </div>
          </li>
        )}
      </ol>
    </div>
  );
}
