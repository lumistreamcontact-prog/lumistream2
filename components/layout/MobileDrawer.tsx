"use client";

import Link from "next/link";
import { useSite } from "@/components/providers/SiteProvider";
import { GridIcon, LogoutIcon, UserIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  key: string;
  exact?: boolean;
  auth?: boolean;
}

/** Off-canvas navigation used below the `lg` breakpoint. */
export function MobileDrawer({
  items,
  active,
  onClose,
}: {
  items: NavItem[];
  active: (href: string, exact?: boolean) => boolean;
  onClose: () => void;
}) {
  const { t, user } = useSite();

  return (
    <>
      <div
        className="fixed inset-0 top-16 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden
      />
      <nav
        aria-label="Mobile"
        className="glass animate-fade-in fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto p-4 lg:hidden"
      >
        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "block rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                active(item.href, item.exact)
                  ? "bg-brand/15 text-brand"
                  : "text-muted hover:bg-white/8 hover:text-ink",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </div>

        <div className="my-4 h-px bg-line" />

        <div className="space-y-1">
          {user ? (
            <>
              <Link
                href="/account"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted hover:bg-white/8 hover:text-ink"
              >
                <UserIcon className="h-[18px] w-[18px]" />
                {t("nav.account")}
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted hover:bg-white/8 hover:text-ink"
                >
                  <GridIcon className="h-[18px] w-[18px]" />
                  {t("nav.admin")}
                </Link>
              )}
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-danger hover:bg-danger/10"
                >
                  <LogoutIcon className="h-[18px] w-[18px]" />
                  {t("nav.logout")}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={onClose}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-ink hover:bg-white/8"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="brand-gradient-bg block rounded-xl px-4 py-3 text-center text-sm font-semibold text-white"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
}