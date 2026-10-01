"use client";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { useSite } from "@/components/providers/SiteProvider";
import { Badge } from "@/components/ui/Primitives";
import { CheckIcon, SparkIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { asStringArray, cn, formatPrice } from "@/lib/utils";

export interface PackageCardData {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  image?: string | null;
  price: number;
  currency: string;
  durationLabel?: string | null;
  durationDays: number;
  maxDevices: number;
  isPopular: boolean;
  /** `jsonb` array from the Package.features column — read with asStringArray(). */
  features?: Prisma.JsonValue;
  channelCount: number;
}

/** Pricing card. The Subscribe button always leads to a working checkout. */
export function PackageCard({
  pkg,
  className,
  locale = "en",
}: {
  pkg: PackageCardData;
  className?: string;
  locale?: string;
}) {
  const { t, user } = useSite();
  const features = asStringArray(pkg.features);
  const href = `/checkout/${pkg.slug}`;

  const period =
    pkg.durationDays >= 365 ? t("common.year") : pkg.durationDays <= 31 ? t("common.month") : null;

  return (
    <article
      className={cn(
        "surface-card hover-lift relative flex flex-col p-6",
        pkg.isPopular && "border-brand/50 shadow-lg shadow-brand/10",
        className,
      )}
    >
      {pkg.isPopular && (
        <span className="brand-gradient-bg absolute -top-3 start-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-lg">
          <SparkIcon className="h-3.5 w-3.5" />
          {t("packages.popular")}
        </span>
      )}

      <div className="flex items-start gap-3">
        {pkg.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pkg.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
        ) : (
          <span className="brand-gradient-bg grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-black text-white">
            {pkg.name.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight">{pkg.name}</h3>
          <p className="mt-0.5 text-xs text-faint">
            {pkg.channelCount} {t("packages.channelsIncluded")}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="text-4xl font-black tracking-tight text-gradient">
          {formatPrice(pkg.price, pkg.currency, locale)}
        </span>
        {period && (
          <span className="text-sm text-muted">
            {pkg.durationDays >= 365 ? t("packages.perYear") : t("packages.perMonth")}
          </span>
        )}
      </div>

      {pkg.description && (
        <p className="mt-3 text-sm leading-relaxed text-muted line-clamp-2">{pkg.description}</p>
      )}

      {features.length > 0 && (
        <ul className="mt-5 flex-1 space-y-2.5 text-sm">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-muted">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex items-center gap-2 border-t border-line pt-4 text-xs text-faint">
        <Badge tone="neutral">{pkg.maxDevices} screen{pkg.maxDevices > 1 ? "s" : ""}</Badge>
        {pkg.durationLabel && <Badge tone="neutral">{pkg.durationLabel}</Badge>}
      </div>

      <div className="mt-4">
        {user ? (
          <Link href={href} className="block">
            <Button fullWidth variant={pkg.isPopular ? "primary" : "secondary"}>
              {t("packages.subscribe")}
            </Button>
          </Link>
        ) : (
          <Link href={`/register?next=${encodeURIComponent(href)}`} className="block">
            <Button fullWidth variant={pkg.isPopular ? "primary" : "secondary"}>
              {t("nav.register")}
            </Button>
          </Link>
        )}
      </div>
    </article>
  );
}