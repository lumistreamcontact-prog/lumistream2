import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getHomeData, getChannelFacets } from "@/lib/data";
import { CATEGORIES } from "@/lib/constants";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInternalPath } from "@/lib/validation";
import { formatNumber } from "@/lib/utils";
import { Hero } from "@/components/home/Hero";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { ChannelRail } from "@/components/home/ChannelRail";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CtaBanner } from "@/components/home/CtaBanner";
import { ContentCard } from "@/components/cards/ContentCard";
import { PackageCard } from "@/components/cards/PackageCard";

export const revalidate = 60;

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const [settings, { t, locale }, user, home, facets] = await Promise.all([
    getSettings(),
    getDictionary(),
    getSessionUser(),
    getHomeData(),
    getChannelFacets(),
  ]);

  // Prime the favourite buttons for signed-in visitors in one extra query.
  const favorites = user
    ? await prisma.favorite.findMany({
        where: { userId: user.id },
        select: { channelId: true },
      })
    : [];
  const favoriteIds = new Set(favorites.map((f) => f.channelId));

  const toCard = (c: (typeof home.featured)[number]) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    logo: c.logo,
    country: c.country,
    language: c.language,
    category: c.category,
    quality: c.quality,
    isLive: c.isLive,
    viewCount: c.viewCount,
    subscriberCount: c.subscriberCount,
    favorite: favoriteIds.has(c.id),
  });

  const hero = {
    badge: settings.heroBadge,
    title: settings.heroTitle,
    subtitle: settings.heroSubtitle,
    image: settings.heroImage,
    primaryLabel: settings.heroPrimaryLabel,
    primaryLink: sanitizeInternalPath(settings.heroPrimaryLink) ?? "/channels",
    secondaryLabel: settings.heroSecondaryLabel,
    secondaryLink: sanitizeInternalPath(settings.heroSecondaryLink) ?? "/packages",
    whatsappLabel: settings.heroWhatsappLabel,
    whatsappNumber: settings.whatsappNumber,
  };

  const stats = {
    channels: formatNumber(home.channelCount, locale),
    content: formatNumber(home.contentCount, locale),
    viewers: formatNumber(home.viewerCount, locale),
  };

  const categoryCounts = new Map(facets.categories.map((c) => [c.value, c.count]));
return (
    <>
      <Hero hero={hero} stats={stats} />

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <CategoryTiles
          categories={CATEGORIES.map((c) => ({
            value: c.value,
            label: t(c.labelKey),
            count: categoryCounts.get(c.value) ?? 0,
          }))}
        />

        <ChannelRail
          title={t("home.featuredChannels")}
          href="/channels"
          viewAllLabel={t("common.viewAll")}
          channels={home.featured.map(toCard)}
        />

        {home.latest.length > 0 && (
          <section>
            <div className="mb-5 flex items-end justify-between gap-3">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                {t("home.latestContent")}
              </h2>
              <Link
                href="/content"
                className="shrink-0 text-sm font-medium text-brand hover:underline"
              >
                {t("common.viewAll")}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {home.latest.slice(0, 6).map((item) => (
                <ContentCard
                  key={item.id}
                  item={{
                    id: item.id,
                    slug: item.slug,
                    title: item.title,
                    type: item.type,
                    poster: item.poster,
                    year: item.year,
                    rating: item.rating,
                    duration: item.duration,
                    genres: item.genres,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {home.trending.length > 0 && (
          <ChannelRail
            title={t("nav.channels")}
            href="/channels?sort=trending"
            viewAllLabel={t("common.viewAll")}
            channels={home.trending.map(toCard)}
          />
        )}

        {home.packages.length > 0 && (
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                  {t("home.topPackages")}
                </h2>
                <p className="mt-1 text-sm text-muted">{t("packages.subtitle")}</p>
              </div>
              <Link href="/packages" className="text-sm font-medium text-brand hover:underline">
                {t("common.viewAll")}
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {home.packages.map((pkg) => (
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
          </section>
        )}

        <HowItWorks />
        <CtaBanner />
      </div>
    </>
  );
}