import type { ReactNode, MouseEvent } from "react";
import { Link } from "react-router";
import { LoaderCircle } from "lucide-react";
import { cx } from "../utils/format";

type Variant = "primary" | "outline" | "soft" | "ghost" | "danger" | "danger-outline" | "white";
type Size = "lg" | "md" | "sm";

type Props = {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Renders a link styled as a button. */
  to?: string;
  variant?: Variant;
  size?: Size;
  /** Full width. */
  block?: boolean;
  disabled?: boolean;
  /** Shows a spinner and blocks clicks. */
  loading?: boolean;
  className?: string;
  ariaLabel?: string;
};

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  outline: "border border-brand bg-white text-brand hover:bg-brand-soft",
  soft: "bg-brand-soft text-brand hover:bg-brand-tint",
  ghost: "text-ink hover:bg-panel",
  danger: "bg-danger text-white hover:brightness-90",
  "danger-outline": "border border-danger bg-white text-danger hover:bg-danger-soft",
  white: "bg-white text-brand hover:bg-brand hover:text-white",
};

const SIZES: Record<Size, string> = {
  lg: "h-12 px-6 text-base",
  md: "h-11 px-5 text-[15px]",
  sm: "h-9 px-3.5 text-sm",
};

// The design's buttons: solid violet with slightly rounded corners.
export default function Button({
  children,
  type = "button",
  onClick,
  to,
  variant = "primary",
  size = "md",
  block,
  disabled,
  loading,
  className,
  ariaLabel,
}: Props) {
  const classes = cx(
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-colors duration-150",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
    (disabled || loading) && "pointer-events-none opacity-50",
    className,
  );

  if (to) {
    return (
      <Link to={to} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={classes} disabled={disabled || loading} aria-label={ariaLabel} aria-busy={loading}>
      {loading && <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
