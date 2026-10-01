import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const CONTROL =
  "w-full rounded-xl border border-line bg-surface-2/70 px-3.5 text-sm text-ink " +
  "placeholder:text-faint transition-colors " +
  "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-muted">
          {label}
          {required && <span className="ms-1 text-brand">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={cn(CONTROL, "h-11", invalid && "border-danger focus:border-danger focus:ring-danger/25", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL, "h-11 cursor-pointer pe-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(
        CONTROL,
        "min-h-28 py-2.5 resize-y",
        invalid && "border-danger focus:border-danger focus:ring-danger/25",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-sm text-muted", className)}>
      <input
        type="checkbox"
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-line bg-surface-2 accent-[var(--ls-brand)]"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3" htmlFor={id}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-[var(--ls-brand)]" : "bg-line",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[inset-inline-start] duration-200",
            checked ? "start-[1.375rem]" : "start-0.5",
          )}
        />
      </button>
      {label && <span className="text-sm text-muted">{label}</span>}
    </label>
  );
}