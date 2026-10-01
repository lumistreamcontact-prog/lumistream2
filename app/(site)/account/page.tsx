import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { getActiveSubscription, expireStaleSubscriptions } from "@/lib/entitlements";
import { getSettings } from "@/lib/settings";
import { getUserPayments, getUserProfile, getUserTickets } from "@/lib/users";
import { prisma } from "@/lib/prisma";
import { AccountTabs } from "@/components/account/AccountTabs";
import { Badge } from "@/components/ui/Primitives";
import { initials, formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "My account", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const user = await requireUser();

  // Opportunistic housekeeping so the badge never shows a stale plan.
  await expireStaleSubscriptions().catch(() => 0);

  const [{ t, locale }, settings, profile] = await Promise.all([
    getDictionary(),
    getSettings(),
    getUserProfile(user.id),
  ]);

  const [subscription, payments, tickets, favoriteCount] = await Promise.all([
    getActiveSubscription(user.id),
    getUserPayments(user.id),
    getUserTickets(user.id),
    prisma.favorite.count({ where: { userId: user.id } }),
  ]);

  if (!profile) return null;

  const currency = settings.currency;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Identity header */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="brand-gradient-bg grid h-16 w-16 place-items-center rounded-2xl text-xl font-black text-white">
          {initials(profile.firstName, profile.lastName)}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="text-sm text-muted" dir="ltr">
            {profile.email}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone={profile.role === "admin" ? "brand" : "neutral"}>
              {profile.role === "admin" ? t("admin.admin") : t("admin.user")}
            </Badge>
            <Badge tone="neutral">
              {t("account.memberSince")} {formatDate(profile.createdAt, locale)}
            </Badge>
            {favoriteCount > 0 && (
              <Link href="/favorites">
                <Badge tone="info">
                  {favoriteCount} {t("nav.favorites")}
                </Badge>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-xs text-faint">
        <span>
          {t("account.subscriptionStatus")}:{" "}
          {subscription ? subscription.status : t("account.noSubscription")}
        </span>
        {profile.lastLoginAt && (
          <span>
            {t("auth.loginButton")}: {formatDateTime(profile.lastLoginAt, locale)}
          </span>
        )}
        {subscription?.endDate && (
          <span>
            {t("account.expiresOn")}: {formatDate(subscription.endDate, locale)}
          </span>
        )}
      </div>

      <AccountTabs
        subscription={
          subscription
            ? {
                id: subscription.id,
                status: subscription.status,
                startDate: subscription.startDate ? subscription.startDate.toISOString() : null,
                endDate: subscription.endDate ? subscription.endDate.toISOString() : null,
                autoRenew: subscription.autoRenew,
                package: {
                  name: subscription.package.name,
                  slug: subscription.package.slug,
                  price: subscription.package.price,
                  currency: subscription.package.currency || currency,
                  durationDays: subscription.package.durationDays,
                  maxDevices: subscription.package.maxDevices,
                },
              }
            : null
        }
        payments={payments.map((payment) => ({
          id: payment.id,
          reference: payment.reference,
          invoiceNo: payment.invoiceNo,
          amount: payment.amount,
          currency: payment.currency || currency,
          status: payment.status,
          paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
          createdAt: payment.createdAt.toISOString(),
          packageName: payment.package.name,
        }))}
        tickets={tickets.map((ticket) => ({
          id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          priority: ticket.priority,
          reply: ticket.reply,
          createdAt: ticket.createdAt.toISOString(),
          repliedAt: ticket.repliedAt ? ticket.repliedAt.toISOString() : null,
        }))}
        locale={locale}
        currency={currency}
      />
    </div>
  );
}