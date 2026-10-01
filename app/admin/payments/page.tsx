import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { countPaymentsAdmin, listPayments } from "@/lib/admin-lists";
import { markPaymentPaidAction } from "@/app/admin/actions";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { Badge, EmptyState, PageHeader } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/Icons";
import { formatDateTime, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments" };

interface SearchParams {
  q?: string;
}

export default async function PaymentsAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const [{ t, locale }, settings] = await Promise.all([getDictionary(), getSettings()]);
  const q = sp.q?.slice(0, 80);

  const [payments, total] = await Promise.all([listPayments({ q }), countPaymentsAdmin(q)]);

  return (
    <div>
      <PageHeader title={t("admin.payments")}>
        <div className="mt-4">
          <AdminSearch />
        </div>
      </PageHeader>

      <p className="mb-3 text-xs text-faint">
        {total} {t("common.results")}
      </p>

      {payments.length === 0 ? (
        <EmptyState title={t("admin.noPayments")} />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-start text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2/40 text-xs uppercase tracking-wider text-faint">
                  <th className="px-4 py-3 text-start font-medium">{t("subscribe.reference")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("admin.owner")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("subscribe.plan")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("subscribe.amount")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("common.status")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("admin.date")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3">
                      <span className="block font-mono text-xs" dir="ltr">
                        {payment.reference}
                      </span>
                      {payment.invoiceNo && (
                        <span className="font-mono text-[10px] text-faint" dir="ltr">
                          {payment.invoiceNo}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <span className="block text-xs" dir="ltr">
                        {payment.user.email}
                      </span>
                      <span className="text-[11px] text-faint">
                        {payment.user.firstName} {payment.user.lastName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{payment.package.name}</td>
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {formatPrice(payment.amount, payment.currency || settings.currency, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          payment.status === "paid"
                            ? "ok"
                            : payment.status === "failed"
                              ? "danger"
                              : "warn"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-faint">
                      {formatDateTime(payment.paidAt ?? payment.createdAt, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {payment.status !== "paid" && (
                          <form action={markPaymentPaidAction}>
                            <input type="hidden" name="id" value={payment.id} />
                            <Button type="submit" size="sm" variant="secondary">
                              <CheckIcon className="h-4 w-4" />
                              {t("admin.markPaid")}
                            </Button>
                          </form>
                        )}
                      </div>
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