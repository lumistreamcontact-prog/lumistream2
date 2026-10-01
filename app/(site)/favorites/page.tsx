import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { getFavoriteChannels } from "@/lib/users";
import { ChannelCard } from "@/components/cards/ChannelCard";
import { EmptyState, PageHeader } from "@/components/ui/Primitives";
import { LinkButton } from "@/components/ui/Button";
import { HeartIcon } from "@/components/ui/Icons";

export const metadata: Metadata = { title: "Favorites" };

export default async function FavoritesPage() {
  const user = await requireUser();
  const { t } = await getDictionary();
  const channels = await getFavoriteChannels(user.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title={t("favorites.title")} description={t("favorites.empty")} />

      {channels.length === 0 ? (
        <EmptyState
          icon={<HeartIcon className="h-10 w-10" />}
          title={t("account.noFavorites")}
          action={
            <LinkButton href="/channels" variant="primary">
              {t("nav.channels")}
            </LinkButton>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
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
                favorite: true,
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Link href="/channels" className="text-sm font-medium text-brand hover:underline">
          {t("common.viewAll")}: {t("nav.channels")}
        </Link>
      </div>
    </div>
  );
}