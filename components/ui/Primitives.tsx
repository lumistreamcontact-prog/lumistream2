import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "ok" | "warn" | "danger" | "info" | "live";
  className?: string;
}) {
  const tones = {
    neutral: "bg-white/10 text-muted border-white/10",
    brand: "bg-brand/15 text-brand border-brand/30",
    info: "bg-brand-2/15 text-brand-2 border-brand-2/30",
    ok: "bg-ok/15 text-ok border-ok/30",
    warn: "bg-warn/15 text-warn border-warn/30",
    danger: "bg-danger/15 text-danger border-danger/30",
    live: "bg-danger text-white border-danger",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Pulsing red dot used by the LIVE indicator. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2", className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line bg-surface/40 px-6 py-16 text-center">
      {icon && <div className="text-faint">{icon}</div>}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {description && <p className="mt-1.5 text-sm text-muted sm:text-base">{description}</p>}
      {children}
    </div>
  );
}

/** Star rating used on content cards. */
export function Rating({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-warn", className)}>
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.77l-5.2 2.73.99-5.79-4.21-4.1 5.82-.85L10 1.5z" />
      </svg>
      <span className="font-medium text-ink">{value ? value.toFixed(1) : "—"}</span>
    </span>
  );
}

/** Inline alert used by forms and admin screens. */
export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "ok" | "warn" | "danger";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    info: "border-brand-2/30 bg-brand-2/10 text-brand-2",
    ok: "border-ok/30 bg-ok/10 text-ok",
    warn: "border-warn/30 bg-warn/10 text-warn",
    danger: "border-danger/30 bg-danger/10 text-danger",
  } as const;

  return (
    <div role="alert" className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone])}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div>
    </div>
  );
}

/** Toast host — see `components/ui/ToastProvider.tsx`. */
export function Toast({
  message,
  tone = "ok",
}: {
  message: string;
  tone?: "ok" | "danger" | "info";
}) {
  const tones = {
    ok: "border-ok/40 bg-ok/15 text-ok",
    danger: "border-danger/40 bg-danger/15 text-danger",
    info: "border-brand-2/40 bg-brand-2/15 text-brand-2",
  } as const;
  return (
    <div
      role="status"
      className={cn(
        "animate-scale-in rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-xl",
        tones[tone],
      )}
    >
      {message}
    </div>
  );
}