"use client";

import Link from "next/link";
import { useSite } from "@/components/providers/SiteProvider";
import { HomeIcon, LogoutIcon } from "@/components/ui/Icons";

/** Slim top bar for the admin area: brand, return to site and sign-out. */
export function SiteProviderChrome({
  adminName,
  backToSiteLabel,
}: {
  adminName: string;
  backToSiteLabel: string;
}) {
  const { settings, t } = useSite();

  return (
    <header className="sticky top-0 z-40 border-b border-line glass">
      <div className="mx-auto flex h-14 max-w-[100rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="flex shrink-0 items-center gap-2.5">
          <span className="brand-gradient-bg grid h-8 w-8 place-items-center rounded-lg text-xs font-black text-white">
            {settings.siteName.slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden text-sm font-bold sm:inline">
            {settings.siteName}
            <span className="ms-2 text-xs font-normal text-faint">{t("nav.admin")}</span>
          </span>
        </Link>

        <div className="ms-auto flex items-center gap-1.5">
          <Link
            href="/"
            className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted transition-colors hover:bg-white/8 hover:text-ink"
          >
            <HomeIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{backToSiteLabel}</span>
          </Link>

          <span className="hidden items-center gap-2.5 rounded-lg px-2 text-sm text-muted md:flex">
            <span className="brand-gradient-bg grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white">
              {adminName.slice(0, 1).toUpperCase()}
            </span>
            <span className="max-w-28 truncate">{adminName}</span>
          </span>

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              aria-label={t("nav.logout")}
              title={t("nav.logout")}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}