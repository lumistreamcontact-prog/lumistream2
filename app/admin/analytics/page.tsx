import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getAdminStats, getDailySeries, getTopChannels } from "@/lib/admin";
import { StatCard } from "@/components/admin/StatCard";
import { PageHeader, SectionHeader } from "@/components/ui/Primitives";
import { ChartIcon, PlayIcon, SparkIcon, TvIcon } from "@/components/ui/Icons";
import { formatNumber, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

const RANGES = [
  { days: 7, key: "admin.last7Days" },
  { days: 30, key: "admin.month" },
] as const;

export default async function AnalyticsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const days = sp.range === "30" ? 30 : 7;

  const [{ t, locale }, settings, stats, series, top] = await Promise.all([
    getDictionary(),
    getSettings(),
    getAdminStats(),
    getDailySeries(days),
    getTopChannels(10),
  ]);

  const peak = Math.max(1, ...series.map((d) => Math.max(d.views, d.plays)));
  const totals = series.reduce(
    (acc, d) => ({ views: acc.views + d.views, plays: acc.plays + d.plays, signups: acc.signups + d.signups }),
    { views: 0, plays: 0, signups: 0 },
  );

  return (
    <div>
      <PageHeader title={t("admin.analytics")} description={t("admin.analyticsSummary")}>
        <div className="mt-4 flex gap-2">
          {RANGES.map((range) => (
            <a
              key={range.days}
              href={`/admin/analytics?range=${range.days}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                days === range.days
                  ? "bg-brand/15 text-brand"
                  : "text-muted hover:bg-white/6 hover:text-ink"
              }`}
            >
              {t(range.key)}
            </a>
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("admin.pageViews")}
          value={formatNumber(totals.views, locale)}
          icon={<ChartIcon className="h-5 w-5" />}
        />
        <StatCard
          label={t("admin.plays")}
          value={formatNumber(totals.plays, locale)}
          tone="info"
          icon={<PlayIcon className="h-5 w-5" />}
        />
        <StatCard
          label={t("admin.signups")}
          value={formatNumber(totals.signups, locale)}
          tone="ok"
          icon={<SparkIcon className="h-5 w-5" />}
        />
        <StatCard
          label={t("admin.totalRevenue")}
          value={formatPrice(stats.revenue, settings.currency, locale)}
          tone="warn"
          icon={<TvIcon className="h-5 w-5" />}
        />
      </div>

      <section className="surface-card mt-6 p-6">
        <SectionHeader title={t("admin.last7Days")} />
        <div className="overflow-x-auto">
          <div className="flex min-w-[40rem] items-end gap-1.5">
            {series.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-32 w-full items-end gap-0.5">
                  <div
                    className="flex-1 rounded-t bg-brand/70"
                    style={{ height: `${Math.max(2, (day.views / peak) * 100)}%` }}
                    title={`${day.date}: ${day.views}`}
                  />
                  <div
                    className="flex-1 rounded-t bg-brand-2/70"
                    style={{ height: `${Math.max(2, (day.plays / peak) * 100)}%` }}
                    title={`${day.date}: ${day.plays}`}
                  />
                </div>
                <span className="text-[10px] text-faint">{day.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-brand/70" />
            {t("admin.pageViews")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-brand-2/70" />
            {t("admin.plays")}
          </span>
        </div>
      </section>

      <section className="surface-card mt-6 p-6">
        <SectionHeader title={t("admin.topChannels")} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] text-start text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wider text-faint">
                <th className="pb-2 text-start font-medium">{t("admin.channelName")}</th>
                <th className="pb-2 text-start font-medium">{t("admin.pageViews")}</th>
                <th className="pb-2 text-start font-medium">{t("home.viewerCount")}</th>
              </tr>
            </thead>
            <tbody>
              {top.map((channel) => (
                <tr key={channel.id} className="border-b border-line/60">
                  <td className="py-2.5">{channel.name}</td>
                  <td className="py-2.5 tabular-nums text-muted">
                    {formatNumber(channel.viewCount, locale)}
                  </td>
                  <td className="py-2.5 tabular-nums text-muted">
                    {formatNumber(channel.subscriberCount, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}