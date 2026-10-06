import { useState } from "react";
import { Link, useParams } from "react-router";
import { Banknote, PackageX, RefreshCw, XCircle } from "lucide-react";
import type { Order, OrderStatus } from "../../types";
import { ORDER_STATUS_LABELS } from "../../types";
import { adminService } from "../../API/services/adminService";
import { useApiQuery } from "../../Hooks/Api/useApiQuery";
import { EmptyState, Notice, PageLoader, PaymentBadge, StatusBadge } from "../../Components";
import OrderTimeline from "../../Components/Account/OrderTimeline";
import { DeliveryCard, OrderSummaryCard } from "../Account/OrderDetailPage";
import { ConfirmDialog } from "../../Components/Modal";
import Button from "../../Components/Button";
import { apiErrorMessage } from "../../utils/apiError";
import { showToast } from "../../utils/toastHelper";
import { formatDateTime } from "../../utils/format";

// The next step for each status, as the main button.
const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: "processing", label: "Start processing" },
  processing: { status: "shipped", label: "Mark as shipped" },
  shipped: { status: "delivered", label: "Mark as delivered" },
};

export default function AdminOrderDetailPage() {
  const { id = "" } = useParams();
  const { data: order, loading, error, setData } = useApiQuery(() => adminService.order(id), [id], "We couldn't load this order.");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (loading && !order) return <PageLoader />;
  if (error || !order) return <EmptyState icon={<PackageX />} title="Order not found" text={error ?? undefined} action={<Button to="/admin/orders">All orders</Button>} />;

  const run = async (key: string, action: () => Promise<Order>, done: string) => {
    setBusy(key);
    try {
      setData(await action());
      showToast(done);
      return true;
    } catch (err) {
      showToast(apiErrorMessage(err, "That didn't work."), "error");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const next = NEXT[order.status];
  const awaitingPaystack = order.paymentMethod === "paystack" && order.paymentStatus !== "paid";
  const blocked = Boolean(next && awaitingPaystack && next.status !== "processing");

  return (
    <div>
      <Link to="/admin/orders" className="text-sm text-brand hover:underline">
        ← Orders
      </Link>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.status} />
          <PaymentBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <OrderSummaryCard order={order} />
          <DeliveryCard order={order} />
        </div>

        <div className="space-y-5">
          <section className="rounded-md border border-line p-5">
            <h2 className="text-lg font-semibold">Update order</h2>
            {order.status === "delivered" || order.status === "cancelled" ? (
              <p className="mt-2 text-sm text-muted">This order is {ORDER_STATUS_LABELS[order.status].toLowerCase()}; there's nothing left to do.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {awaitingPaystack && (
                  <Notice tone="warning">
                    Waiting for the customer's Paystack payment. It's confirmed automatically; if they say they've paid, check with Paystack.
                  </Notice>
                )}
                {next && (
                  <Button block disabled={blocked} loading={busy === "next"} onClick={() => run("next", () => adminService.updateOrder(order.id, { status: next.status }), `Order marked ${ORDER_STATUS_LABELS[next.status].toLowerCase()}`)}>
                    {next.label}
                  </Button>
                )}
                {order.status !== "shipped" && order.status !== "pending" && (
                  <Button
                    block
                    variant="outline"
                    disabled={awaitingPaystack}
                    loading={busy === "deliver"}
                    onClick={() => run("deliver", () => adminService.updateOrder(order.id, { status: "delivered" }), "Order marked delivered")}
                  >
                    Mark as delivered
                  </Button>
                )}
                {order.paymentMethod === "delivery" && order.paymentStatus !== "paid" && (
                  <Button block variant="soft" loading={busy === "paid"} onClick={() => run("paid", () => adminService.updateOrder(order.id, { paymentStatus: "paid" }), "Payment recorded")}>
                    <Banknote className="h-4.5 w-4.5" /> Record cash/transfer payment
                  </Button>
                )}
                {awaitingPaystack && (
                  <Button block variant="soft" loading={busy === "check"} onClick={() => run("check", () => adminService.checkPayment(order.id), "Checked with Paystack")}>
                    <RefreshCw className="h-4.5 w-4.5" /> Check payment with Paystack
                  </Button>
                )}
                <Button block variant="danger-outline" onClick={() => setConfirmCancel(true)}>
                  Cancel order
                </Button>
                <p className="text-xs text-muted">
                  The customer gets an email at each step. Pay-on-delivery orders are marked paid when delivered.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-md border border-line p-5">
            <h2 className="mb-4 text-lg font-semibold">Timeline</h2>
            <OrderTimeline order={order} />
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={async () => {
          if (await run("cancel", () => adminService.updateOrder(order.id, { status: "cancelled" }), "Order cancelled")) setConfirmCancel(false);
        }}
        loading={busy === "cancel"}
        icon={<XCircle />}
        title="Cancel this order?"
        text={
          order.paymentStatus === "paid"
            ? "The items go back in stock and the customer is emailed. They've paid, so refund them from your Paystack dashboard or by transfer."
            : "The items go back in stock and the customer is emailed."
        }
        confirmLabel="Cancel order"
      />
    </div>
  );
}
