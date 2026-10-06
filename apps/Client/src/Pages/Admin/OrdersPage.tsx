import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Filter, Search, XCircle } from "lucide-react";
import type { Order, OrderStatus } from "../../types";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "../../types";
import { adminService } from "../../API/services/adminService";
import { useApiQuery } from "../../Hooks/Api/useApiQuery";
import { useDebounced } from "../../Hooks/useDebounced";
import { ErrorState, Pagination, Skeleton } from "../../Components";
import { ConfirmDialog } from "../../Components/Modal";
import { AdminHeading } from "../../Layout/AdminLayout";
import { apiErrorMessage } from "../../utils/apiError";
import { showToast } from "../../utils/toastHelper";
import { cx, naira } from "../../utils/format";

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-orange-100 text-orange-600",
  processing: "bg-blue-100 text-blue-600",
  shipped: "bg-brand-soft text-brand",
  delivered: "bg-green-100 text-green-600",
  cancelled: "bg-red-100 text-red-600",
};

const PAYMENT_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-600",
  pending: "bg-orange-100 text-orange-600",
  failed: "bg-red-100 text-red-600",
};

// The design's Orders page.
export default function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const urlQ = params.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const query = useDebounced(q);
  const status = (params.get("status") ?? "") as OrderStatus | "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);

  // The top bar's search sends ?q= here.
  useEffect(() => setQ(urlQ), [urlQ]);

  const { data, loading, error, refetch } = useApiQuery(() => adminService.orders({ q: query, status, page }), [query, status, page], "We couldn't load orders.");

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  };

  const cancel = async () => {
    if (!cancelling) return;
    setBusy(true);
    try {
      await adminService.updateOrder(cancelling.id, { status: "cancelled" });
      showToast(`Order ${cancelling.orderNumber} cancelled`);
      setCancelling(null);
      refetch();
    } catch (err) {
      showToast(apiErrorMessage(err, "The order wasn't cancelled."), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminHeading title="Orders" text="Manage and track all customer orders." />

      <div className="mt-3 flex flex-col gap-5 rounded-md border border-[#e7e4e4] p-5 md:flex-row">
        <div className="relative md:w-2/3">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (page > 1) set("page", "");
            }}
            placeholder="Search order ID or customer…"
            aria-label="Search orders"
            className="h-11 w-full rounded-md border border-[#d4d1d1] pl-10 pr-3 focus:border-brand focus:outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
          <select value={status} onChange={(e) => set("status", e.target.value)} aria-label="Order status" className="h-11 w-full rounded-md border border-[#e7e4e4] pl-8 md:w-[220px]">
            <option value="">All Status</option>
            {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[#e7e4e4] bg-white">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[1.2fr_1.5fr_1.5fr_1fr_1fr_1fr_2fr] bg-[#fff9f9] px-5 py-4 text-sm font-medium text-[#7a7a7a]">
              <p>Order ID</p>
              <p>Customer</p>
              <p>Date</p>
              <p>Status</p>
              <p>Payment</p>
              <p>Total Amount</p>
              <p>Actions</p>
            </div>
            {loading && !data ? (
              Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="border-t border-[#e7e4e4] px-5 py-4">
                  <Skeleton className="h-6" />
                </div>
              ))
            ) : data?.items.length ? (
              data.items.map((order) => (
                <div key={order.id} className="grid grid-cols-[1.2fr_1.5fr_1.5fr_1fr_1fr_1fr_2fr] items-center border-t border-[#e7e4e4] px-5 py-4 text-sm">
                  <p className="truncate font-medium">{order.orderNumber}</p>
                  <p className="truncate">
                    {order.customer.firstName} {order.customer.lastName}
                  </p>
                  <p className="truncate text-[#605f5f]">
                    {new Date(order.createdAt).toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <span className={cx("w-fit rounded-full px-3 py-1 text-xs font-medium", STATUS_STYLES[order.status])}>{ORDER_STATUS_LABELS[order.status]}</span>
                  <span className={cx("w-fit rounded-full px-3 py-1 text-xs font-medium", PAYMENT_STYLES[order.paymentStatus])}>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span>
                  <p className="truncate font-medium">{naira(order.total)}</p>
                  <div className="flex gap-4 whitespace-nowrap font-medium">
                    <Link to={`/admin/orders/${order.id}`} className="text-brand hover:underline">
                      View
                    </Link>
                    <Link to={`/admin/orders/${order.id}`} className="text-[#059d28] hover:underline">
                      Update
                    </Link>
                    {["pending", "processing", "shipped"].includes(order.status) && (
                      <button type="button" onClick={() => setCancelling(order)} className="text-[#e60e0e] hover:underline">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="border-t border-[#e7e4e4] px-5 py-4 text-gray-500">No orders found</p>
            )}
          </div>
        </div>
      )}
      <div className="mt-6">
        <Pagination page={page} total={data?.total ?? 0} limit={PAGE_SIZE} onChange={(p) => set("page", p > 1 ? String(p) : "")} />
      </div>

      <ConfirmDialog
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        onConfirm={cancel}
        loading={busy}
        icon={<XCircle />}
        title="Cancel Order"
        text={
          cancelling?.paymentStatus === "paid"
            ? `Cancel ${cancelling.orderNumber}? The items go back in stock. The customer has paid, so refund them from Paystack or by transfer.`
            : `Cancel ${cancelling?.orderNumber}? The items go back in stock and the customer is emailed.`
        }
        confirmLabel="Cancel Order"
      />
    </div>
  );
}
