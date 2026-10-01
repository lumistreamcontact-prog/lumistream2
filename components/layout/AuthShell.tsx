"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { useSite } from "@/components/providers/SiteProvider";
import { SparkIcon } from "@/components/ui/Icons";

/** Split-screen shell shared by login / register / password reset. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const { settings } = useSite();

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
      {/* Form side */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className={wide ? "w-full max-w-lg" : "w-full max-w-md"}>
          <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
            <span className="brand-gradient-bg grid h-9 w-9 place-items-center rounded-xl text-sm font-black text-white">
              {settings.siteName.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-lg font-bold tracking-tight">{settings.siteName}</span>
          </Link>

          <div className="surface-card animate-fade-up p-6 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}

            <div className="mt-6">{children}</div>
          </div>

          {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}
        </div>
      </div>

      {/* Brand side */}
      <aside className="relative hidden overflow-hidden border-s border-line lg:block">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(50rem 40rem at 70% 20%, color-mix(in srgb, var(--ls-brand) 28%, transparent), transparent 65%)," +
              "radial-gradient(40rem 34rem at 30% 80%, color-mix(in srgb, var(--ls-brand-2) 24%, transparent), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="relative flex h-full flex-col justify-end p-12">
          <SparkIcon className="h-8 w-8 text-brand" />
          <p className="mt-5 max-w-sm text-2xl font-bold leading-snug">
            {settings.siteDescription}
          </p>
          <p className="mt-3 text-sm text-muted">{settings.footerDisclaimer}</p>
        </div>
      </aside>
    </div>
  );
}