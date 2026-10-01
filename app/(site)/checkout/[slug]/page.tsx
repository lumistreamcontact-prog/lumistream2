import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { getPackageBySlug } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { requireUser } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/entitlements";
import { CheckoutForm } from "@/components/forms/CheckoutForm";
import { Badge, PageHeader } from "@/components/ui/Primitives";
import { CheckIcon, ShieldIcon } from "@/components/ui/Icons";
import { asStringArray } from "@/lib/utils";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { t } = await getDictionary();
  const pkg = await getPackageBySlug(slug);
  return { title: pkg ? pkg.name : t("packages.title") };
}

export default async function CheckoutPage({ params }: Params) {
  const { slug } = await params;
  const user = await requireUser();

  const [{ t, locale }, settings] = await Promise.all([getDictionary(), getSettings()]);

  const pkg = await getPackageBySlug(slug);
  if (!pkg || !pkg.isActive) notFound();

  const active = await getActiveSubscription(user.id);
  const features = asStringArray(pkg.features);
  const currency = pkg.currency || settings.currency;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title={t("subscribe.checkoutTitle")} description={pkg.name} />

      {active && active.packageId === pkg.id && (
        <p className="mb-6 rounded-xl border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok">
          {t("account.currentPlan")}: {active.package.name}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <CheckoutForm
          packageId={pkg.id}
          packageName={pkg.name}
          packageSlug={pkg.slug}
          price={pkg.price}
          currency={currency}
          channelCount={pkg._count.channels}
          durationDays={pkg.durationDays}
          durationLabel={pkg.durationLabel}
          maxDevices={pkg.maxDevices}
        />

        <aside className="space-y-4">
          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              {t("subscribe.orderSummary")}
            </h2>

            <p className="mt-3 text-sm font-medium">{pkg.name}</p>
            {pkg.description && (
              <p className="mt-1 text-xs leading-relaxed text-muted">{pkg.description}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-1.5">
              <Badge tone="neutral">{pkg._count.channels} {t("packages.channelsIncluded")}</Badge>
              <Badge tone="neutral">{pkg.durationLabel ?? `${pkg.durationDays}d`}</Badge>
              <Badge tone="neutral">
                {pkg.maxDevices} × {t("nav.account")}
              </Badge>
            </div>

            {features.length > 0 && (
              <ul className="mt-4 space-y-2 text-xs text-muted">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="surface-card flex items-start gap-3 p-5">
            <ShieldIcon className="h-5 w-5 shrink-0 text-ok" />
            <p className="text-xs leading-relaxed text-muted">
              {t("packages.securePayment")}
            </p>
          </div>

          <Link
            href="/packages"
            className="block text-center text-xs text-faint transition-colors hover:text-brand"
          >
            {t("common.back")}: {t("packages.title")}
          </Link>
        </aside>
      </div>

      <p className="mt-10 text-center text-xs text-faint">
        {t("common.all")} · {locale}
      </p>
    </div>
  );
}