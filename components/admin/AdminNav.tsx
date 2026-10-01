"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import {
  ChartIcon,
  ClockIcon,
  DashboardIcon,
  DownloadIcon,
  FilmIcon,
  GlobeIcon,
  HeadsetIcon,
  PaletteIcon,
  ShieldIcon,
  SparkIcon,
  TvIcon,
  UsersIcon,
  CardIcon,
} from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    labelKey: null,
    items: [{ href: "/admin", key: "admin.dashboard", icon: DashboardIcon, exact: true }],
  },
  {
    labelKey: null,
    items: [
      { href: "/admin/users", key: "admin.users", icon: UsersIcon },
      { href: "/admin/channels", key: "admin.channels", icon: TvIcon },
      { href: "/admin/content", key: "admin.content", icon: FilmIcon },
      { href: "/admin/packages", key: "admin.packages", icon: CardIcon },
      { href: "/admin/payments", key: "admin.payments", icon: ClockIcon },
    ],
  },
  {
    labelKey: null,
    items: [
      { href: "/admin/support", key: "admin.support", icon: HeadsetIcon },
      { href: "/admin/analytics", key: "admin.analytics", icon: ChartIcon },
      { href: "/admin/audit", key: "admin.audit", icon: ShieldIcon },
    ],
  },
  {
    labelKey: null,
    items: [
      { href: "/admin/languages", key: "admin.languages", icon: GlobeIcon },
      { href: "/admin/appearance", key: "admin.appearance", icon: PaletteIcon },
      { href: "/admin/settings", key: "admin.settings", icon: SparkIcon },
      { href: "/admin/backup", key: "admin.backup", icon: DownloadIcon },
    ],
  },
] as const;

/** Sidebar navigation for the `/admin` area. */
export function AdminNav() {
  const { t } = useSite();
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label={t("nav.admin")} className="space-y-6">
      {SECTIONS.map((section, index) => (
        <ul key={index} className="space-y-1">
          {section.items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, "exact" in item ? item.exact : undefined);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand/15 text-brand"
                      : "text-muted hover:bg-white/6 hover:text-ink",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t(item.key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ))}
    </nav>
  );
}