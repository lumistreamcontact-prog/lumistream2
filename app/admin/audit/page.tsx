import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { listAuditLogs } from "@/lib/admin-lists";
import { Badge, EmptyState, PageHeader } from "@/components/ui/Primitives";
import { ShieldIcon } from "@/components/ui/Icons";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditAdminPage() {
  const [{ t, locale }, logs] = await Promise.all([getDictionary(), listAuditLogs(200)]);

  return (
    <div>
      <PageHeader title={t("admin.audit")} description={t("admin.backupHint")} />

      {logs.length === 0 ? (
        <EmptyState icon={<ShieldIcon className="h-10 w-10" />} title={t("admin.noLogs")} />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-start text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2/40 text-xs uppercase tracking-wider text-faint">
                  <th className="px-4 py-3 text-start font-medium">{t("admin.action")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("admin.entity")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("admin.owner")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("admin.ip")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("admin.date")}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3">
                      <Badge tone="brand">{log.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {log.entity ?? "—"}
                      {log.entityId && (
                        <span className="ms-1 font-mono text-[10px] text-faint" dir="ltr">
                          {log.entityId.slice(-6)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted" dir="ltr">
                      {log.user?.email ?? log.actorName ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-faint" dir="ltr">
                      {log.ip ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-faint">
                      {formatDateTime(log.createdAt, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}