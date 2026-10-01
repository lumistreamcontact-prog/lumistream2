import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { listTickets } from "@/lib/admin-lists";
import { updateTicketAction } from "@/app/admin/actions";
import { Badge, EmptyState, PageHeader } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { HeadsetIcon } from "@/components/ui/Icons";
import { TICKET_PRIORITY, TICKET_STATUS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Support" };

const PRIORITY_TONE = {
  low: "neutral",
  normal: "info",
  high: "warn",
  urgent: "danger",
} as const;

export default async function SupportAdminPage() {
  const [{ t, locale }, tickets] = await Promise.all([getDictionary(), listTickets(80)]);
  const open = tickets.filter((ticket) => ticket.status === "open" || ticket.status === "in_progress");

  return (
    <div>
      <PageHeader
        title={t("admin.support")}
        description={`${open.length} ${t("admin.ticketCount")}`}
      />

      {tickets.length === 0 ? (
        <EmptyState icon={<HeadsetIcon className="h-10 w-10" />} title={t("admin.noTickets")} />
      ) : (
        <ul className="space-y-4">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold">{ticket.subject}</h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {ticket.name} · <span dir="ltr">{ticket.email}</span>
                    {ticket.phone && ` · ${ticket.phone}`}
                  </p>
                  <p className="mt-0.5 text-xs text-faint">
                    {formatDateTime(ticket.createdAt, locale)}
                    {ticket.userId && ` · ${t("admin.user")}`}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1.5">
                  <Badge
                    tone={
                      ticket.status === "resolved"
                        ? "ok"
                        : ticket.status === "closed"
                          ? "neutral"
                          : "warn"
                    }
                  >
                    {ticket.status}
                  </Badge>
                  <Badge tone={PRIORITY_TONE[ticket.priority as keyof typeof PRIORITY_TONE] ?? "neutral"}>
                    {ticket.priority}
                  </Badge>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-line rounded-xl border border-line bg-surface-2/40 p-4 text-sm leading-relaxed text-muted">
                {ticket.message}
              </p>

              {ticket.reply && (
                <div className="mt-3 rounded-xl border border-ok/30 bg-ok/5 p-4">
                  <p className="text-xs uppercase tracking-wider text-ok">{t("admin.reply")}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted">{ticket.reply}</p>
                  {ticket.repliedAt && (
                    <p className="mt-1 text-xs text-faint">
                      {formatDateTime(ticket.repliedAt, locale)}
                    </p>
                  )}
                </div>
              )}

              <form action={updateTicketAction} className="mt-4 space-y-3 border-t border-line pt-4">
                <input type="hidden" name="id" value={ticket.id} />

                <Textarea
                  name="reply"
                  defaultValue={ticket.reply ?? ""}
                  rows={2}
                  placeholder={t("admin.reply")}
                  aria-label={t("admin.reply")}
                />

                <div className="flex flex-wrap items-center gap-2">
                  {Object.entries(TICKET_STATUS).map(([key, value]) => (
                    <Button key={key} type="submit" name="status" value={value} size="sm" variant="outline">
                      {value === "resolved" ? t("admin.markResolved") : value === "closed" ? t("admin.markClosed") : value}
                    </Button>
                  ))}
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-faint">
        {t("admin.priority")}: {Object.keys(TICKET_PRIORITY).join(", ")}
      </p>
    </div>
  );
}