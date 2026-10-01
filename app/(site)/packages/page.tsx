import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getActivePackages } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { PackageCard } from "@/components/cards/PackageCard";
import { CheckIcon } from "@/components/ui/Icons";
import { PageHeader } from "@/components/ui/Primitives";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Packages" };

export default async function PackagesPage() {
  const [{ t, locale }, packages, settings, user] = await Promise.all([
    getDictionary(),
    getActivePackages(),
    getSettings(),
    getSessionUser(),
  ]);

  const totalChannels = packages.reduce((sum, pkg) => sum + pkg._count.channels, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title={t("packages.title")} description={t("packages.subtitle")} />

      {packages.length === 0 ? (
        <p className="text-sm text-muted">{t("common.noResults")}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              locale={locale}
              pkg={{
                id: pkg.id,
                slug: pkg.slug,
                name: pkg.name,
                description: pkg.description,
                image: pkg.image,
                price: pkg.price,
                currency: pkg.currency || settings.currency,
                durationLabel: pkg.durationLabel,
                durationDays: pkg.durationDays,
                maxDevices: pkg.maxDevices,
                isPopular: pkg.isPopular,
                features: pkg.features,
                channelCount: pkg._count.channels,
              }}
            />
          ))}
        </div>
      )}

      <ul className="mt-14 grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
        {[t("packages.securePayment"), t("packages.features"), t("packages.duration"), t("support.hours")].map(
          (line) => (
            <li key={line} className="flex items-start gap-2.5">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
              <span>{line}</span>
            </li>
          ),
        )}
      </ul>

      {!user && (
        <p className="mt-8 text-center text-xs text-faint">
          {totalChannels > 0
            ? `${totalChannels} ${t("packages.channelsIncluded")}`
            : t("packages.choosePrompt")}
        </p>
      )}
    </div>
  );
}