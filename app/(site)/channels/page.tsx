import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { countChannels, getChannelFacets, getChannels } from "@/lib/data";
import type { ChannelFilters as ChannelFiltersType } from "@/lib/data";
import { ChannelCard } from "@/components/cards/ChannelCard";
import { EmptyState, PageHeader } from "@/components/ui/Primitives";
import { ChannelFilters } from "@/components/channels/ChannelFilters";
import { LinkButton } from "@/components/ui/Button";
import { TvIcon } from "@/components/ui/Icons";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Channels" };

const SORTS = ["name", "newest", "popular", "trending"] as const;
type Sort = (typeof SORTS)[number];

interface SearchParams {
  q?: string;
  category?: string;
  country?: string;
  language?: string;
  quality?: string;
  package?: string;
  sort?: string;
}

export default async function ChannelsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { t } = await getDictionary();

  const sort: Sort = SORTS.includes(sp.sort as Sort) ? (sp.sort as Sort) : "newest";

  const filters: ChannelFiltersType = {
    q: sp.q?.slice(0, 80),
    category: sp.category,
    country: sp.country,
    language: sp.language,
    quality: sp.quality,
    packageId: sp.package,
    sort,
    limit: 120,
  };

  const user = await getSessionUser();
  const [channels, total, facets, favorites] = await Promise.all([
    getChannels(filters),
    countChannels(filters),
    getChannelFacets(),
    user
      ? prisma.favorite.findMany({ where: { userId: user.id }, select: { channelId: true } })
      : Promise.resolve([]),
  ]);

  const favoriteIds = new Set(favorites.map((f) => f.channelId));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title={t("channels.title")} description={t("channels.subtitle")} />

      <Suspense fallback={<div className="mb-8 h-20 skeleton rounded-xl" />}>
        <ChannelFilters facets={facets} resultCount={total} />
      </Suspense>

      {channels.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<TvIcon className="h-10 w-10" />}
            title={t("channels.empty")}
            action={
              <Link href="/packages" className="text-sm font-medium text-brand hover:underline">
                {t("packages.title")}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={{
                id: channel.id,
                slug: channel.slug,
                name: channel.name,
                logo: channel.logo,
                country: channel.country,
                language: channel.language,
                category: channel.category,
                quality: channel.quality,
                isLive: channel.isLive,
                viewCount: channel.viewCount,
                subscriberCount: channel.subscriberCount,
                favorite: favoriteIds.has(channel.id),
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-14 flex justify-center">
        <LinkButton href="/packages" variant="secondary" size="lg">
          {t("packages.choosePrompt")}
        </LinkButton>
      </div>
    </div>
  );
}