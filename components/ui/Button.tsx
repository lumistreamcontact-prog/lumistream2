import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "whatsapp";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary:
    "brand-gradient-bg text-white shadow-lg shadow-black/30 hover:brightness-110 active:brightness-95",
  secondary:
    "bg-white/10 text-ink hover:bg-white/16 border border-line backdrop-blur-sm",
  ghost: "text-muted hover:text-ink hover:bg-white/8",
  outline: "border border-line text-ink hover:border-brand hover:text-brand",
  danger: "bg-danger/90 text-white hover:bg-danger",
  whatsapp: "bg-[#25D366] text-black font-semibold hover:bg-[#1eb455]",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-13 px-7 text-base gap-2.5 rounded-xl",
  icon: "h-10 w-10 rounded-xl justify-center",
};

const BASE =
  "inline-flex items-center justify-center font-medium transition-all duration-200 select-none " +
  "disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap cursor-pointer";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  external = false,
  prefetch,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
  external?: boolean;
  prefetch?: boolean;
}) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className);

  if (external || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} prefetch={prefetch}>
      {children}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-4 w-4 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin",
        className,
      )}
    />
  );
}