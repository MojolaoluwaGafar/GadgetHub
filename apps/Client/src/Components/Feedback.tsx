import type { ReactNode } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import Button from "./Button";
import { cx } from "../utils/format";

// Shown while a page's code or data loads.
export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted" role="status">
      <LoaderCircle className="h-8 w-8 text-brand motion-safe:animate-spin" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

// "Nothing here yet", with an icon in the design's soft violet circle.
export function EmptyState({
  icon,
  title,
  text,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  text?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center px-4 py-14 text-center", className)}>
      <span className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-soft text-brand [&>svg]:h-11 [&>svg]:w-11">{icon}</span>
      <h2 className="mt-5 text-2xl font-semibold text-ink">{title}</h2>
      {text && <p className="mt-2 max-w-md text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div className={cx("flex flex-col items-center px-4 py-12 text-center", className)} role="alert">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <CircleAlert className="h-7 w-7" />
      </span>
      <p className="mt-4 max-w-md text-ink">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

// A grey block that shimmers while content loads.
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-md", className)} aria-hidden="true" />;
}

// A short note in a coloured box.
export function Notice({ tone = "info", children, className }: { tone?: "info" | "warning" | "success" | "danger"; children: ReactNode; className?: string }) {
  const tones = {
    info: "bg-brand-soft text-ink border-brand-tint",
    warning: "bg-warning-soft text-ink border-warning/20",
    success: "bg-success-soft text-ink border-success/20",
    danger: "bg-danger-soft text-ink border-danger/20",
  };
  return <div className={cx("rounded-md border px-4 py-3 text-sm", tones[tone], className)}>{children}</div>;
}
