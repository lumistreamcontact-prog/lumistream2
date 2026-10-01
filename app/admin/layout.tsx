import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { SiteProviderChrome } from "@/components/admin/AdminHeader";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

/**
 * Admin shell. Deliberately separate from `app/(site)/layout.tsx` so the
 * marketing header, footer and WhatsApp FAB never appear on back-office pages.
 * `requireAdmin()` here is the authoritative gate; `proxy.ts` only avoids
 * flashing these screens to anonymous visitors.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const { t } = await getDictionary();

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50rem 32rem at 10% -10%, color-mix(in srgb, var(--ls-brand) 14%, transparent), transparent 60%)," +
            "radial-gradient(40rem 30rem at 95% 0%, color-mix(in srgb, var(--ls-brand-2) 12%, transparent), transparent 60%)",
        }}
      />

      <SiteProviderChrome adminName={admin.firstName} backToSiteLabel={t("admin.backToSite")} />

      <div className="mx-auto flex w-full max-w-[100rem] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        <aside className="lg:w-60 lg:shrink-0">
          <div className="surface-card p-3">
            <AdminNav />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
            <Link href="/admin" className="text-sm font-bold">
              {t("nav.admin")}
            </Link>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}