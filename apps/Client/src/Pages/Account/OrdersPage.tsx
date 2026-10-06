import { useState } from "react";
import { useNavigate } from "react-router";
import { Package, XCircle } from "lucide-react";
import type { Order, OrderStatus } from "../../types";
import { ORDER_STATUS_LABELS } from "../../types";
import { orderService } from "../../API/services/orderService";
import { useApiQuery } from "../../Hooks/Api/useApiQuery";
import { useCart } from "../../Context/CartContext";
import { EmptyState, ErrorState, Skeleton } from "../../Components";
import OrderTimeline from "../../Components/Account/OrderTimeline";
import Modal, { ConfirmDialog } from "../../Components/Modal";
import Button from "../../Components/Button";
import { apiErrorMessage } from "../../utils/apiError";
import { showToast } from "../../utils/toastHelper";
import { cx, formatDay, naira } from "../../utils/format";

const TABS = [
  { id: "active", label: "Active", match: (o: Order) => ["pending", "processing", "shipped"].includes(o.status) },
  { id: "completed", label: "Completed", match: (o: Order) => o.status === "delivered" },
  { id: "cancelled", label: "Cancelled", match: (o: Order) => o.status === "cancelled" },
] as const;

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-[#e4f2ff] text-[#056ec8]",
  processing: "bg-[#e4f2ff] text-[#056ec8]",
  shipped: "bg-brand-soft text-brand",
  delivered: "bg-[#e8ffed] text-success",
  cancelled: "bg-[#ffeded] text-danger",
};

// The design's order card.
function OrderCard({ order, onTrack, onCancel }: { order: Order; onTrack: () => void; onCancel: () => void }) {
  const navigate = useNavigate();
  const { add, setDrawerOpen } = useCart();
  const product = order.items[0]!;
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const awaitingPayment = order.paymentMethod === "paystack" && order.paymentStatus !== "paid" && order.status === "pending";

  const primary = () => {
    if (order.status === "delivered") {
      order.items.forEach((item) => add({ productId: item.productId, name: item.name, image: item.image, price: item.price, color: item.color, storage: item.storage, quantity: item.quantity, stock: 20 }));
      setDrawerOpen(true);
    } else if (awaitingPayment) navigate(`/account/orders/${order.id}`);
    else onTrack();
  };

  return (
    <article className="relative w-full rounded-md border border-line bg-white p-4 sm:p-6">
      <span className={cx("absolute right-5 top-5 flex h-10 min-w-[82px] items-center justify-center rounded-xl px-3", STATUS_COLORS[order.status])}>
        {awaitingPayment ? "Unpaid" : ORDER_STATUS_LABELS[order.status]}
      </span>
      <div className="flex flex-col gap-4 lg:flex-row">
        <span className="h-[97px] w-[78px] shrink-0 overflow-hidden rounded-md bg-panel">{product.image && <img src={product.image} alt="" className="h-full w-full object-cover" />}</span>
        <div className="flex-1 pr-24">
          <h2 className="font-semibold">{product.name}</h2>
          {order.items.length > 1 && <p className="text-sm text-[#a2a3a3]">and {order.items.length - 1} more</p>}
          <p className="text-sm text-[#848182]">
            Order <span className="font-medium">{order.orderNumber}</span>
          </p>
          <p className="text-[#535051]">Placed on {new Date(order.createdAt).toDateString()}</p>
          {order.estimatedDelivery && order.status !== "cancelled" && order.status !== "delivered" && (
            <p className="text-sm font-medium text-green-600">Est Delivery: {formatDay(order.estimatedDelivery)}</p>
          )}
          <div className="flex gap-5 pt-2">
            <p>Qty: {units}</p>
            <p className="font-semibold">{naira(order.total)}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 pt-5 lg:flex-row">
        {order.status !== "cancelled" && (
          <Button className="h-12 min-w-[133px]" onClick={primary}>
            {order.status === "delivered" ? "Buy Again" : awaitingPayment ? "Pay Now" : "Track Order"}
          </Button>
        )}
        <Button variant="outline" className="h-12 min-w-[129px]" to={`/account/orders/${order.id}`}>
          View Details
        </Button>
        {["pending", "processing"].includes(order.status) && (
          <button type="button" onClick={onCancel} className="h-12 min-w-[143px] text-danger">
            Cancel Order
          </button>
        )}
      </div>
    </article>
  );
}

export default function OrdersPage() {
  const { data, loading, error, refetch, setData } = useApiQuery(() => orderService.mine(), [], "We couldn't load your orders.");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("active");
  const [tracking, setTracking] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const current = TABS.find((t) => t.id === tab)!;
  const orders = data?.filter(current.match) ?? [];

  const cancel = async () => {
    if (!cancelling) return;
    setBusy(true);
    try {
      const updated = await orderService.cancel(cancelling.id);
      setData((list) => list?.map((o) => (o.id === updated.id ? updated : o)) ?? null);
      setCancelling(null);
      showToast("Order cancelled", "info");
    } catch (err) {
      showToast(apiErrorMessage(err, "The order wasn't cancelled."), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">My Orders</h1>
      <div className="flex w-full border-b border-[#eeeaea] pt-5" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cx("flex h-[46px] w-1/3 items-center justify-center font-semibold sm:text-lg", tab === t.id ? "border-b-2 border-brand bg-brand-soft" : "text-subtle")}
          >
            {t.label} ({data ? data.filter(t.match).length : 0})
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : loading && !data ? (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-48" />)
        ) : orders.length === 0 ? (
          <EmptyState icon={<Package />} title="No orders found." action={!data?.length && <Button to="/products">Start Shopping</Button>} />
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} onTrack={() => setTracking(order)} onCancel={() => setCancelling(order)} />)
        )}
      </div>

      <Modal open={Boolean(tracking)} onClose={() => setTracking(null)} title="Track Order" size="sm">
        {tracking && <OrderTimeline order={tracking} />}
      </Modal>
      <ConfirmDialog
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        onConfirm={cancel}
        loading={busy}
        icon={<XCircle />}
        title="Cancel Order"
        text={cancelling?.paymentStatus === "paid" ? "You've already paid, so we'll contact you to arrange your refund." : "Are you sure you want to cancel this order?"}
        confirmLabel="Cancel Order"
      />
    </div>
  );
}
