import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Minus, Plus, Star } from "lucide-react";
import type { OrderStatus, PaymentStatus } from "../types";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "../types";
import { cx, naira, percentOff } from "../utils/format";

// Small pieces used across the shop and the admin.

export function Stars({ rating, size = "sm", className }: { rating: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const px = size === "sm" ? "h-3.5 w-3.5" : size === "md" ? "h-4.5 w-4.5" : "h-6 w-6";
  return (
    <span className={cx("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cx(px, n <= Math.round(rating) ? "fill-star text-star" : "fill-line text-line")} aria-hidden="true" />
      ))}
    </span>
  );
}

export function Price({ price, compareAtPrice, size = "md" }: { price: number; compareAtPrice?: number | null; size?: "sm" | "md" | "lg" }) {
  const off = percentOff(price, compareAtPrice ?? null);
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className={cx("font-semibold", off ? "text-sale" : "text-ink", size === "lg" ? "text-3xl" : size === "md" ? "text-lg" : "text-base")}>
        {naira(price)}
      </span>
      {off > 0 && <span className={cx("text-muted line-through", size === "lg" ? "text-lg" : "text-sm")}>{naira(compareAtPrice!)}</span>}
    </span>
  );
}

const ORDER_TONES: Record<OrderStatus, string> = {
  pending: "bg-warning-soft text-warning",
  processing: "bg-info-soft text-info",
  shipped: "bg-brand-soft text-brand",
  delivered: "bg-success-soft text-success",
  cancelled: "bg-danger-soft text-danger",
};

const PAYMENT_TONES: Record<PaymentStatus, string> = {
  pending: "bg-warning-soft text-warning",
  paid: "bg-success-soft text-success",
  failed: "bg-danger-soft text-danger",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={cx("inline-flex rounded-full px-3 py-1 text-xs font-semibold", ORDER_TONES[status])}>{ORDER_STATUS_LABELS[status]}</span>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={cx("inline-flex rounded-full px-3 py-1 text-xs font-semibold", PAYMENT_TONES[status])}>{PAYMENT_STATUS_LABELS[status]}</span>;
}

export function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <span className="inline-flex rounded-full bg-danger-soft px-3 py-1 text-xs font-semibold text-danger">Out of stock</span>;
  if (stock <= 5) return <span className="inline-flex rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">{stock} left</span>;
  return <span className="inline-flex rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">In stock</span>;
}

// − 1 + with a cap.
export function QuantityStepper({
  value,
  onChange,
  max,
  size = "md",
  label = "Quantity",
}: {
  value: number;
  onChange: (value: number) => void;
  max: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <div className="inline-flex items-center rounded-md border border-line" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} className={cx(box, "flex items-center justify-center text-ink disabled:text-line")} aria-label="Decrease quantity">
        <Minus className="h-4 w-4" />
      </button>
      <span className={cx("min-w-9 border-x border-line text-center font-semibold", size === "sm" ? "text-sm leading-8" : "leading-10")} aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} className={cx(box, "flex items-center justify-center text-ink disabled:text-line")} aria-label="Increase quantity">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

// Numbered pages with arrows, as in the design. Shows at most 7 numbers.
export function Pagination({ page, total, limit, onChange }: { page: number; total: number; limit: number; onChange: (page: number) => void }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  const start = Math.max(1, Math.min(page - 3, pages - 6));
  const numbers = Array.from({ length: Math.min(7, pages) }, (_, i) => start + i);
  const box = "flex h-10 min-w-10 items-center justify-center rounded-md px-2 text-sm font-semibold";
  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Pages">
      <button type="button" className={cx(box, "border border-line disabled:opacity-40")} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {numbers.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-current={n === page ? "page" : undefined}
          className={cx(box, n === page ? "bg-brand text-white" : "border border-line hover:border-brand")}
        >
          {n}
        </button>
      ))}
      <button type="button" className={cx(box, "border border-line disabled:opacity-40")} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

// "Home > All Categories > iPhone 15".
export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="py-3 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-subtle" aria-hidden="true" />}
            {item.to ? (
              <Link to={item.to} className="hover:text-brand">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-ink" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
