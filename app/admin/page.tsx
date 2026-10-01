import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getAdminStats, getDailySeries, getRecentActivity, getTopChannels } from "@/lib/admin";
import { listSubscriptions } from "@/lib/admin-lists";
import { StatCard } from "@/components/admin/StatCard";
import { Badge, PageHeader, SectionHeader } from "@/components/ui/Primitives";
import { LinkButton } from "@/components/ui/Button";
import {
  ChartIcon,
  ClockIcon,
  FilmIcon,
  HeadsetIcon,
  PlusIcon,
  SparkIcon,
  TvIcon,
  UsersIcon,
} from "@/components/ui/Icons";
import { formatDateTime, formatNumber, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [{ t, locale }, settings, stats, series, top, activity, subscriptions] =
    await Promise.all([
      getDictionary(),
      getSettings(),
      getAdminStats(),
      getDailySeries(7),
      getTopChannels(6),
      getRecentActivity(10),
      listSubscriptions(6),
    ]);

  const peak = Math.max(1, ...series.map((d) => d.views));

  const quickActions = [
    { href: "/admin/channels/new", key: "admin.addChannel", icon: TvIcon },
    { href: "/admin/content/new", key: "admin.addContent", icon: FilmIcon },
    { href: "/admin/packages/new", key: "admin.addPackage", icon: SparkIcon },
    { href: "/admin/users/new", key: "admin.addUser", icon: UsersIcon },
  ];

  return (
    <div>
      <PageHeader title={t("admin.dashboard")} description={settings.siteName} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("admin.totalUsers")}
          value={formatNumber(stats.totalUsers, locale)}
          hint={`+${stats.newUsers} ${t("admin.newUsers")}`}
          icon={<UsersIcon className="h-5 w-5" />}
        />
        <StatCard
          label={t("admin.activeSubs")}
          value={formatNumber(stats.activeSubs, locale)}
          tone="ok"
          icon={<SparkIcon className="h-5 w-5" />}
        />
        <StatCard
          label={t("admin.totalRevenue")}
          value={formatPrice(stats.revenue, settings.currency, locale)}
          tone="info"
          hint={`${stats.paidCount} ${t("admin.conversion")}`}
          icon={<ChartIcon className="h-5 w-5" />}
        />
        <StatCard
          label={t("admin.totalChannels")}
          value={formatNumber(stats.activeChannels, locale)}
          tone="warn"
          hint={`${stats.totalContent} ${t("nav.content")}`}
          icon={<TvIcon className="h-5 w-5" />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="surface-card p-6">
            <SectionHeader title={t("admin.last7Days")} />
            <div className="flex h-40 items-end gap-2">
              {series.map((day) => (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] tabular-nums text-faint">{day.views}</span>
                  <div
                    className="brand-gradient-bg w-full rounded-t-md"
                    style={{ height: `${Math.max(4, (day.views / peak) * 120)}px` }}
                    role="presentation"
                  />
                  <span className="text-[10px] text-faint">{day.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card p-6">
            <SectionHeader title={t("admin.topChannels")} />
            <ul className="space-y-2.5">
              {top.map((channel, index) => (
                <li key={channel.id} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-xs tabular-nums text-faint">{index + 1}</span>
                  <Link
                    href={`/channels/${channel.slug}`}
                    className="min-w-0 flex-1 truncate hover:text-brand"
                  >
                    {channel.name}
                  </Link>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {formatNumber(channel.viewCount, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="surface-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              {t("admin.quickActions")}
            </h2>
            <div className="mt-3 grid gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2.5 text-sm text-muted transition-colors hover:border-brand hover:text-brand"
                >
                  <action.icon className="h-4 w-4" />
                  {t(action.key)}
                  <PlusIcon className="ms-auto h-3.5 w-3.5 text-faint" />
                </Link>
              ))}
            </div>
          </section>
<section className="surface-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                {t("admin.support")}
              </h2>
              {stats.openTickets > 0 && (
                <Badge tone="warn">
                  {stats.openTickets} {t("admin.ticketCount")}
                </Badge>
              )}
            </div>
            <LinkButton href="/admin/support" variant="secondary" size="sm" className="mt-3">
              <HeadsetIcon className="h-4 w-4" />
              {t("admin.support")}
            </LinkButton>
          </section>

          <section className="surface-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              {t("admin.recentActivity")}
            </h2>
            <ul className="mt-3 space-y-2 text-xs">
              {activity.map((event) => (
                <li key={event.id} className="flex items-start gap-2">
                  <ClockIcon className="mt-0.5 h-3 w-3 shrink-0 text-faint" />
                  <span className="min-w-0 flex-1">
                    <span className="text-brand">{event.type}</span>{" "}
                    <span className="text-muted">{event.path ?? "/"}</span>
                    <span className="block text-faint">
                      {formatDateTime(event.createdAt, locale)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section className="surface-card mt-6 p-6">
        <SectionHeader
          title={t("admin.payments")}
          action={
            <Link href="/admin/payments" className="text-sm font-medium text-brand hover:underline">
              {t("admin.viewAll")}
            </Link>
          }
        />
        {subscriptions.length === 0 ? (
          <p className="text-sm text-muted">{t("admin.noPayments")}</p>
        ) : (
          <ul className="divide-y divide-line/60 text-sm">
            {subscriptions.map((sub) => (
              <li key={sub.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-ink">
                  {sub.user.firstName} {sub.user.lastName}
                </span>
                <span className="text-xs text-faint" dir="ltr">
                  {sub.user.email}
                </span>
                <span className="text-xs text-muted">{sub.package.name}</span>
                <Badge tone={sub.status === "active" ? "ok" : "neutral"}>{sub.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}