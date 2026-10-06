import { useState } from "react";
import type { AdminStats } from "../../types";
import { naira, plural } from "../../utils/format";

// "₦1.2M", "₦850k" for the axis.
const compact = (amount: number) =>
  amount >= 1_000_000 ? `₦${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1)}M` : amount >= 1000 ? `₦${Math.round(amount / 1000)}k` : `₦${amount}`;

const dayLabel = (date: string, options: Intl.DateTimeFormatOptions) => new Date(`${date}T12:00:00`).toLocaleDateString("en-NG", options);

// A rounded-up axis top with three gridlines.
function niceMax(value: number) {
  if (value <= 0) return 3000;
  const step = 10 ** Math.floor(Math.log10(value / 3));
  return Math.ceil(value / 3 / step) * step * 3;
}

// Paid revenue per day for the last 14 days: one series in the brand violet,
// thin columns with rounded tops, hairline gridlines, and a tooltip per day.
// A table carries the same numbers for screen readers.
export default function RevenueChart({ daily }: { daily: AdminStats["daily"] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...daily.map((d) => d.revenue)));
  const ticks = [max, (max * 2) / 3, max / 3, 0];
  const point = active !== null ? daily[active] : null;

  return (
    <figure>
      <div className="relative flex h-56 gap-3" aria-hidden="true">
        <div className="flex w-12 shrink-0 flex-col justify-between text-right text-xs text-muted">
          {ticks.map((tick) => (
            <span key={tick} className="-translate-y-1/2 last:translate-y-0">
              {compact(tick)}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          {ticks.map((tick, index) => (
            <span key={tick} className="absolute inset-x-0 border-t border-line" style={{ top: `${(index / 3) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-0.5" onMouseLeave={() => setActive(null)}>
            {daily.map((day, index) => (
              <div
                key={day.date}
                className="flex h-full flex-1 cursor-default items-end justify-center"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                tabIndex={0}
              >
                <span
                  className="block w-full max-w-6 rounded-t-sm transition-opacity"
                  style={{
                    height: `${(day.revenue / max) * 100}%`,
                    minHeight: day.orders ? 2 : 0,
                    backgroundColor: "var(--color-brand)",
                    opacity: active === null || active === index ? 1 : 0.45,
                  }}
                />
              </div>
            ))}
          </div>
          {point && active !== null && (
            <div
              className="pointer-events-none absolute -top-2 z-10 w-40 -translate-x-1/2 -translate-y-full rounded-md bg-ink px-3 py-2 text-xs text-white shadow-float"
              style={{ left: `${((active + 0.5) / daily.length) * 100}%` }}
            >
              <p className="font-semibold">{dayLabel(point.date, { weekday: "short", day: "numeric", month: "short" })}</p>
              <p className="mt-0.5">{naira(point.revenue)} paid</p>
              <p className="text-white/70">{plural(point.orders, "order")}</p>
            </div>
          )}
        </div>
      </div>
      <div className="ml-15 mt-2 flex text-xs text-muted" aria-hidden="true">
        {daily.map((day, index) => (
          <span key={day.date} className="flex-1 text-center">
            {/* Every third day, counted back from today so today is labelled. */}
            {(daily.length - 1 - index) % 3 === 0 ? dayLabel(day.date, { day: "numeric", month: "short" }) : ""}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Paid revenue and orders per day</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Revenue</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((day) => (
            <tr key={day.date}>
              <td>{dayLabel(day.date, { day: "numeric", month: "long" })}</td>
              <td>{naira(day.revenue)}</td>
              <td>{day.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
