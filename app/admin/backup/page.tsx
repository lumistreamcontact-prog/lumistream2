import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { RestoreForm } from "@/components/admin/RestoreForm";
import { PageHeader, SectionHeader } from "@/components/ui/Primitives";
import { DownloadIcon, ShieldIcon } from "@/components/ui/Icons";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Backup" };

export default async function BackupAdminPage() {
  const { t, locale } = await getDictionary();

  const [users, channels, content, packages, payments] = await Promise.all([
    prisma.user.count(),
    prisma.channel.count(),
    prisma.content.count(),
    prisma.package.count(),
    prisma.payment.count(),
  ]);

  const stats = [
    { label: t("admin.users"), value: users },
    { label: t("admin.channels"), value: channels },
    { label: t("admin.content"), value: content },
    { label: t("admin.packages"), value: packages },
    { label: t("admin.payments"), value: payments },
  ];

  return (
    <div className="max-w-3xl">
      <PageHeader title={t("admin.backup")} description={t("admin.backupHint")} />

      <section className="surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              {t("admin.createBackup")}
            </h2>
            <p className="mt-1.5 text-sm text-muted">{t("admin.backupHint")}</p>
          </div>
          <a
            href="/api/admin/backup"
            className="brand-gradient-bg inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-lg shadow-black/30 transition-all hover:brightness-110"
          >
            <DownloadIcon className="h-4 w-4" />
            {t("admin.downloadBackup")}
          </a>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {stats.map((stat) => (
            <li key={stat.label} className="rounded-xl border border-line px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wider text-faint">{stat.label}</p>
              <p className="mt-1 text-lg font-black tabular-nums">
                {formatNumber(stat.value, locale)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-card mt-6 p-6">
        <SectionHeader title={t("admin.restoreBackup")} />
        <RestoreForm />
      </section>

      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-faint">
        <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0" />
        {t("subscribe.secureNote")}
      </p>
    </div>
  );
}