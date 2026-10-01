"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, Input, Switch } from "@/components/ui/Input";
import { Alert, Badge, EmptyState } from "@/components/ui/Primitives";
import { CardIcon, ClockIcon, HeadsetIcon, UserIcon } from "@/components/ui/Icons";
import { cn, formatDate, formatDateTime, formatPrice } from "@/lib/utils";

interface SubscriptionView {
  id: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  autoRenew: boolean;
  package: {
    name: string;
    slug: string;
    price: number;
    currency: string;
    durationDays: number;
    maxDevices: number;
  };
}

interface PaymentView {
  id: string;
  reference: string;
  invoiceNo: string | null;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  packageName: string;
}

interface TicketView {
  id: string;
  subject: string;
  status: string;
  priority: string;
  reply: string | null;
  createdAt: string;
  repliedAt: string | null;
}

const TABS = ["profile", "subscription", "billing", "tickets"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, string> = {
  profile: "account.profile",
  subscription: "account.subscription",
  billing: "account.billing",
  tickets: "account.tickets",
};

const TAB_ICON: Record<Tab, typeof UserIcon> = {
  profile: UserIcon,
  subscription: ClockIcon,
  billing: CardIcon,
  tickets: HeadsetIcon,
};

/** Tabbed self-service area: profile, subscription, billing and tickets. */
export function AccountTabs({
  subscription,
  payments,
  tickets,
  locale,
  currency,
}: {
  subscription: SubscriptionView | null;
  payments: PaymentView[];
  tickets: TicketView[];
  locale: string;
  currency: string;
}) {
  const { t, user } = useSite();
  const { push } = useToast();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("profile");
  const [busy, setBusy] = useState(false);

  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
  });

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = (await res.json().catch(() => ({}))) as { errors?: Record<string, string> };
      if (!res.ok) {
        push(t(data.errors?.form ?? "errors.generic"), "danger");
        return;
      }
      push(t("account.profileUpdated"), "ok");
      router.refresh();
    } catch {
      push(t("errors.network"), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setPwErrors({});
    setBusy(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwords),
      });
      const data = (await res.json().catch(() => ({}))) as { errors?: Record<string, string> };
      if (!res.ok) {
        setPwErrors(data.errors ?? { form: "errors.generic" });
        return;
      }
      setPasswords({ current: "", next: "", confirm: "" });
      push(t("account.passwordChanged"), "ok");
    } catch {
      setPwErrors({ form: "errors.network" });
    } finally {
      setBusy(false);
    }
  }

  async function cancelSubscription() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/subscription", { method: "DELETE" });
      if (!res.ok) {
        push(t("errors.generic"), "danger");
        return;
      }
      push(t("account.subscriptionCancelled"), "ok");
      router.refresh();
    } catch {
      push(t("errors.network"), "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8">
      <div role="tablist" aria-label={t("account.title")} className="flex flex-wrap gap-1.5">
        {TABS.map((key) => {
          const Icon = TAB_ICON[key];
          return (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
                tab === key ? "bg-brand/15 text-brand" : "text-muted hover:bg-white/6 hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t(TAB_LABEL[key])}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "profile" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={saveProfile} className="surface-card space-y-4 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                {t("account.updateProfile")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("auth.firstName")} htmlFor="p-first">
                  <Input
                    id="p-first"
                    value={profile.firstName}
                    onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  />
                </Field>
                <Field label={t("auth.lastName")} htmlFor="p-last">
                  <Input
                    id="p-last"
                    value={profile.lastName}
                    onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label={t("support.phone")} htmlFor="p-phone">
                <Input
                  id="p-phone"
                  dir="ltr"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                />
              </Field>
              <Field label={t("auth.email")} htmlFor="p-email">
                <Input id="p-email" dir="ltr" value={user?.email ?? ""} disabled />
              </Field>
              <Button type="submit" loading={busy}>
                {t("common.save")}
              </Button>
            </form>

            <form onSubmit={savePassword} className="surface-card space-y-4 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                {t("account.changePassword")}
              </h2>

              {pwErrors.form && <Alert tone="danger">{t(pwErrors.form)}</Alert>}

              <Field label={t("account.currentPassword")} htmlFor="pw-current">
                <Input
                  id="pw-current"
                  type="password"
                  autoComplete="current-password"
                  value={passwords.current}
                  onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                />
              </Field>
              <Field label={t("account.newPassword")} htmlFor="pw-new">
                <Input
                  id="pw-new"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={passwords.next}
                  onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                />
              </Field>
              <Field
                label={t("auth.confirmPassword")}
                htmlFor="pw-confirm"
                error={pwErrors.confirmPassword ? t(pwErrors.confirmPassword) : undefined}
              >
                <Input
                  id="pw-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  invalid={Boolean(pwErrors.confirmPassword)}
                />
              </Field>
              <Button type="submit" loading={busy} variant="secondary">
                {t("account.changePassword")}
              </Button>
            </form>
          </div>
        )}

        {tab === "subscription" && (
          <div className="surface-card p-6">
            {subscription ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{subscription.package.name}</h2>
                    <p className="mt-1 text-sm text-muted">{t("account.renewHint")}</p>
                  </div>
                  <Badge tone="ok">{subscription.status}</Badge>
                </div>

                <dl className="grid gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-faint">
                      {t("account.startedOn")}
                    </dt>
                    <dd className="mt-0.5">{formatDate(subscription.startDate, locale)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-faint">
                      {t("account.expiresOn")}
                    </dt>
                    <dd className="mt-0.5">{formatDate(subscription.endDate, locale)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-faint">
                      {t("admin.maxDevices")}
                    </dt>
                    <dd className="mt-0.5">{subscription.package.maxDevices}</dd>
                  </div>
                </dl>

                <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 px-4 py-3">
                  <span className="text-sm text-muted">{t("account.autoRenew")}</span>
                  <Switch checked={subscription.autoRenew} onChange={() => undefined} disabled />
                </div>

                <div className="flex flex-wrap gap-2 border-t border-line pt-5">
                  <LinkButton href={`/checkout/${subscription.package.slug}`}>
                    {t("account.renew")}
                  </LinkButton>
                  <Button variant="danger" onClick={cancelSubscription} loading={busy}>
                    {t("account.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState
                title={t("account.noSubscription")}
                action={
                  <LinkButton href="/packages" variant="primary">
                    {t("account.subscribeNow")}
                  </LinkButton>
                }
              />
            )}
          </div>
        )}

        {tab === "billing" && (
          <div className="surface-card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              {t("account.billing")}
            </h2>

            {payments.length === 0 ? (
              <p className="mt-4 text-sm text-muted">{t("account.noPayments")}</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[34rem] text-start text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs uppercase tracking-wider text-faint">
                      <th className="pb-2 text-start font-medium">{t("subscribe.reference")}</th>
                      <th className="pb-2 text-start font-medium">{t("subscribe.plan")}</th>
                      <th className="pb-2 text-start font-medium">{t("subscribe.amount")}</th>
                      <th className="pb-2 text-start font-medium">{t("common.status")}</th>
                      <th className="pb-2 text-start font-medium">{t("admin.date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-line/60">
                        <td className="py-2.5 font-mono text-xs" dir="ltr">
                          {payment.reference}
                        </td>
                        <td className="py-2.5 text-muted">{payment.packageName}</td>
                        <td className="py-2.5 font-medium">
                          {formatPrice(payment.amount, payment.currency || currency, locale)}
                        </td>
                        <td className="py-2.5">
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
                        <td className="py-2.5 text-xs text-faint">
                          {formatDateTime(payment.paidAt ?? payment.createdAt, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "tickets" && (
          <div className="surface-card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                {t("account.tickets")}
              </h2>
              <LinkButton href="/support" size="sm" variant="secondary">
                {t("support.send")}
              </LinkButton>
            </div>

            {tickets.length === 0 ? (
              <p className="mt-4 text-sm text-muted">{t("account.noTickets")}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {tickets.map((ticket) => (
                  <li key={ticket.id} className="rounded-xl border border-line p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{ticket.subject}</p>
                      <div className="flex gap-1.5">
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
                        <Badge tone="info">{ticket.priority}</Badge>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-faint">
                      {formatDateTime(ticket.createdAt, locale)}
                    </p>
                    {ticket.reply && (
                      <p className="mt-3 rounded-lg bg-surface-2/60 p-3 text-sm text-muted">
                        {ticket.reply}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
