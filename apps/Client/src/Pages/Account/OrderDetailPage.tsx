import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { CircleCheck, PackageX, XCircle } from "lucide-react";
import type { Order } from "../../types";
import { orderService } from "../../API/services/orderService";
import { useApiQuery } from "../../Hooks/Api/useApiQuery";
import { useCart } from "../../Context/CartContext";
import { EmptyState, Notice, PageLoader, PaymentBadge, StatusBadge } from "../../Components";
import OrderTimeline from "../../Components/Account/OrderTimeline";
import { ConfirmDialog } from "../../Components/Modal";
import Button from "../../Components/Button";
import { apiErrorMessage } from "../../utils/apiError";
import { showToast } from "../../utils/toastHelper";
import { formatDateTime, naira } from "../../utils/format";

export function OrderSummaryCard({ order }: { order: Order }) {
  return (
    <section className="rounded-md border border-line p-5">
      <h2 className="text-lg font-semibold">Items</h2>
      <ul className="mt-3 divide-y divide-line">
        {order.items.map((item, index) => (
          <li key={`${item.productId}-${index}`} className="flex items-center gap-3 py-3">
            <span className="h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-panel">{item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}</span>
            <span className="min-w-0 flex-1">
              <Link to={`/product/${item.productId}`} className="line-clamp-1 font-medium hover:text-brand">
                {item.name}
              </Link>
              <span className="block text-sm text-muted">
                {[item.color, item.storage].filter(Boolean).join(" • ")}
                {item.color || item.storage ? " · " : ""}
                {naira(item.price)} × {item.quantity}
              </span>
            </span>
            <span className="font-semibold">{naira(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-2 space-y-1.5 border-t border-line pt-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd>{naira(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Delivery</dt>
          <dd>{order.deliveryFee ? naira(order.deliveryFee) : "Free"}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <dt>Total</dt>
          <dd>{naira(order.total)}</dd>
        </div>
      </dl>
    </section>
  );
}

export function DeliveryCard({ order }: { order: Order }) {
  const { customer } = order;
  return (
    <section className="rounded-md border border-line p-5 text-sm">
      <h2 className="text-lg font-semibold">Delivery & payment</h2>
      <dl className="mt-3 space-y-3">
        <div>
          <dt className="text-muted">{order.deliveryMethod === "doorstep" ? "Deliver to" : "Pick up"}</dt>
          <dd className="font-medium">
            {customer.firstName} {customer.lastName}
            <br />
            {order.deliveryMethod === "doorstep" ? `${customer.address}, ${customer.city}, ${customer.state}` : "Our showroom: 12 Street Address City, Lagos"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Contact</dt>
          <dd className="font-medium">
            {customer.phone}
            <br />
            {customer.email}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Payment</dt>
          <dd className="flex items-center gap-2 font-medium">
            {order.paymentMethod === "paystack" ? "Online (Paystack)" : "Pay on delivery"} <PaymentBadge status={order.paymentStatus} />
          </dd>
        </div>
      </dl>
    </section>
  );
}

export default function OrderDetailPage() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const { add, setDrawerOpen } = useCart();
  const { data: order, error, loading, setData } = useApiQuery(() => orderService.get(id), [id], "We couldn't load this order.");
  const [verifying, setVerifying] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [justPaid, setJustPaid] = useState(false);
  const verified = useRef(false);

  // Back from Paystack: ?reference=... Ask the server to check the payment.
  const reference = params.get("reference");
  useEffect(() => {
    if (!reference || verified.current) return;
    verified.current = true;
    setVerifying(true);
    orderService
      .verifyPayment(reference)
      .then((result) => {
        setData(result);
        setJustPaid(result.paymentStatus === "paid");
        showToast(result.paymentStatus === "paid" ? "Payment received. Thank you!" : "Your payment wasn't completed.", result.paymentStatus === "paid" ? "success" : "error");
      })
      .catch((err) => showToast(apiErrorMessage(err, "We couldn't confirm your payment yet."), "error"))
      .finally(() => {
        setVerifying(false);
        setParams({}, { replace: true });
      });
  }, [reference, setData, setParams]);

  if ((loading && !order) || verifying) return <PageLoader label={verifying ? "Confirming your payment…" : "Loading…"} />;
  if (error || !order) return <EmptyState icon={<PackageX />} title="Order not found" text={error ?? undefined} action={<Button to="/account/orders">My orders</Button>} />;

  const placed = params.get("placed") === "1";
  const unpaid = order.paymentMethod === "paystack" && order.paymentStatus !== "paid" && order.status === "pending";
  const cancellable = ["pending", "processing"].includes(order.status);

  const pay = async () => {
    setBusy(true);
    try {
      window.location.assign(await orderService.pay(order.id));
    } catch (err) {
      showToast(apiErrorMessage(err, "We couldn't start the payment."), "error");
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      setData(await orderService.cancel(order.id));
      setConfirmCancel(false);
      showToast("Your order was cancelled", "info");
    } catch (err) {
      showToast(apiErrorMessage(err, "The order wasn't cancelled."), "error");
    } finally {
      setBusy(false);
    }
  };

  const buyAgain = () => {
    // Stock is checked again when the cart opens.
    order.items.forEach((item) => add({ productId: item.productId, name: item.name, image: item.image, price: item.price, color: item.color, storage: item.storage, quantity: item.quantity, stock: 20 }));
    setDrawerOpen(true);
  };

  return (
    <div>
      {(placed || justPaid) && (
        <div className="mb-6 flex flex-col items-center rounded-md border border-success/20 bg-success-soft px-4 py-8 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-success">
            <CircleCheck className="h-10 w-10" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold sm:text-[28px]">Your Order Has Been Received</h1>
          <p className="mt-1 text-[#686565]">Thank you for placing an order. We've emailed your confirmation.</p>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/account/orders" className="text-sm text-brand hover:underline">
            ← My orders
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {unpaid && (
        <Notice tone="warning" className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <span>{order.paymentStatus === "failed" ? "Your payment didn't go through." : "This order is waiting for payment."} We'll start packing as soon as it's paid.</span>
          <Button size="sm" onClick={pay} loading={busy}>
            Pay {naira(order.total)}
          </Button>
        </Notice>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <OrderSummaryCard order={order} />
          <DeliveryCard order={order} />
        </div>
        <div className="space-y-5">
          <section className="rounded-md border border-line p-5">
            <h2 className="mb-4 text-lg font-semibold">Track Order</h2>
            <OrderTimeline order={order} />
          </section>
          <div className="flex flex-col gap-3">
            {order.status === "delivered" && (
              <>
                <Button onClick={buyAgain}>Buy again</Button>
                <p className="text-center text-sm text-muted">Enjoying it? Leave a review on the product page.</p>
              </>
            )}
            {cancellable && (
              <Button variant="danger-outline" onClick={() => setConfirmCancel(true)}>
                Cancel order
              </Button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={cancel}
        loading={busy}
        icon={<XCircle />}
        title="Cancel this order?"
        text={order.paymentStatus === "paid" ? "You've already paid, so we'll contact you to arrange your refund." : "The items go back on sale and nothing is charged."}
        confirmLabel="Cancel order"
      />
    </div>
  );
}
