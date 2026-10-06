import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import Button from "./Button";
import { cx } from "../utils/format";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

// A centred dialog over a dimmed page. Escape and the backdrop close it, and
// focus moves into it so keyboard users land in the right place.
export default function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 motion-safe:animate-fade-in sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        className={cx(
          "relative flex max-h-[92vh] w-full flex-col rounded-t-xl bg-white shadow-float outline-none motion-safe:animate-pop sm:rounded-xl",
          size === "sm" ? "sm:max-w-md" : size === "md" ? "sm:max-w-lg" : "sm:max-w-2xl",
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button type="button" onClick={onClose} className="-mr-2 rounded-md p-2 text-muted hover:bg-panel hover:text-ink" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

// The design's confirm dialogs: a big round icon, a question, and two buttons.
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  icon,
  tone = "danger",
  title,
  text,
  confirmLabel,
  loading,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  icon: ReactNode;
  tone?: "danger" | "success" | "brand";
  title: string;
  text?: ReactNode;
  confirmLabel: string;
  loading?: boolean;
  children?: ReactNode;
}) {
  const tones = {
    danger: "bg-danger-soft text-danger",
    success: "bg-success-soft text-success",
    brand: "bg-brand-soft text-brand",
  };
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center py-2 text-center">
        <span className={cx("flex h-24 w-24 items-center justify-center rounded-full [&>svg]:h-11 [&>svg]:w-11", tones[tone])}>{icon}</span>
        <h2 className="mt-5 text-2xl font-semibold">{title}</h2>
        {text && <p className="mt-2 text-muted">{text}</p>}
        {children && <div className="mt-4 w-full text-left">{children}</div>}
        <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <Button variant="ghost" className="border border-line" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
