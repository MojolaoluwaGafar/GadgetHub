import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { cx } from "../utils/format";

// Shared look for every text box, dropdown and text area.
export const inputClass = (hasError?: boolean) =>
  cx(
    "w-full rounded-md border bg-white px-3.5 text-ink placeholder:text-subtle/70",
    "transition-shadow focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/12",
    "disabled:bg-panel disabled:text-muted",
    hasError ? "border-danger" : "border-line",
  );

type WrapperProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

// A label above a control, with a hint or error below it.
export function Field({ label, htmlFor, error, hint, optional, children, className }: WrapperProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between text-sm font-semibold text-ink">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-subtle">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { id: string; hasError?: boolean; icon?: ReactNode };

export function TextInput({ id, hasError, icon, className, ...rest }: InputProps) {
  const input = (
    <input
      id={id}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError ? `${id}-error` : undefined}
      className={cx(inputClass(hasError), "h-11", Boolean(icon) && "pl-10", className)}
      {...rest}
    />
  );
  if (!icon) return input;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle">{icon}</span>
      {input}
    </div>
  );
}

// A password box with a show/hide button.
export function PasswordInput({ id, hasError, className, ...rest }: Omit<InputProps, "type" | "icon">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={cx(inputClass(hasError), "h-11 pr-11", className)}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-subtle hover:text-ink"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
      </button>
    </div>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { id: string; hasError?: boolean; children: ReactNode };

export function SelectInput({ id, hasError, className, children, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        id={id}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={cx(inputClass(hasError), "h-11 appearance-none pr-10", className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
    </div>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; hasError?: boolean };

export function TextArea({ id, hasError, className, ...rest }: TextAreaProps) {
  return (
    <textarea
      id={id}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError ? `${id}-error` : undefined}
      className={cx(inputClass(hasError), "py-2.5", className)}
      {...rest}
    />
  );
}

// An on/off switch with a label (the design's toggles).
export function Toggle({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="block h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
