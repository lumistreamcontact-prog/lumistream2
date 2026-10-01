import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { getChannelBySlug, getRelatedChannels } from "@/lib/data";
import { getSessionUser } from "@/lib/auth";
import { getEntitlement } from "@/lib/entitlements";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { FavoriteButton } from "@/components/cards/FavoriteButton";
import { ChannelCard } from "@/components/cards/ChannelCard";
import { Badge, SectionHeader } from "@/components/ui/Primitives";
import { LinkButton } from "@/components/ui/Button";
import { LockIcon, TvIcon } from "@/components/ui/Icons";
import { formatDate } from "@/lib/utils";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { t } = await getDictionary();
  const channel = await getChannelBySlug(slug);

  if (!channel || !channel.isActive) return { title: t("common.notFound") };

  return {
    title: channel.name,
    description: channel.description ?? undefined,
    openGraph: { title: channel.name, description: channel.description ?? undefined },
  };
}

export default async function ChannelDetailPage({ params }: Params) {
  const { slug } = await params;
  const [{ t, locale }, settings, user] = await Promise.all([
    getDictionary(),
    getSettings(),
    getSessionUser(),
  ]);

  const channel = await getChannelBySlug(slug);
  if (!channel || !channel.isActive) notFound();

  const entitlement = await getEntitlement(user?.id, channel.id, {
    demoMode: settings.demoMode === "true",
  });

  const [related, favorite] = await Promise.all([
    getRelatedChannels(channel.id, channel.category),
    user
      ? prisma.favorite.findUnique({
          where: { userId_channelId: { userId: user.id, channelId: channel.id } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  // Best-effort view counter — never blocks the render.
  void prisma.channel
    .update({ where: { id: channel.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => undefined);

  const canWatch = entitlement.hasAccess && Boolean(user);

return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          {canWatch ? (
            <VideoPlayer
              channelId={channel.id}
              channelName={channel.name}
              isLive={channel.isLive}
              poster={channel.poster}
            />
          ) : (
            <LockedPanel
              t={t}
              name={channel.name}
              logo={channel.logo}
              signedIn={Boolean(user)}
              packageName={entitlement.packageName}
            />
          )}

          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{channel.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <Badge tone="live">{t("common.live")}</Badge>
                <Badge tone="neutral">{channel.quality}</Badge>
                <Badge tone="brand">{t(`category.${channel.category}`)}</Badge>
                {channel.country && <Badge tone="neutral">{channel.country}</Badge>}
                {channel.language && <Badge tone="neutral">{channel.language}</Badge>}
              </div>
            </div>

            <FavoriteButton channelId={channel.id} initial={Boolean(favorite)} />
          </div>

          {channel.description && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                {t("channels.about")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{channel.description}</p>
            </section>
          )}

          <p className="mt-6 text-xs text-faint">
            {t("admin.date")}: {formatDate(channel.updatedAt, locale)}
          </p>
        </div>

        <aside className="space-y-5">
          {channel.packages.length > 0 && (
            <div className="surface-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                {t("channels.availableIn")}
              </h2>
              <ul className="mt-3 space-y-2">
                {channel.packages.map((link) => (
                  <li key={link.packageId}>
                    <Link
                      href={`/checkout/${link.package.slug}`}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-white/5 hover:text-brand"
                    >
                      {link.package.name}
                      <span aria-hidden>→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              {t("support.channels")}
            </h2>
            <LinkButton href="/support" variant="outline" fullWidth className="mt-3">
              {t("support.title")}
            </LinkButton>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <SectionHeader title={t("channels.relatedChannels")} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((item) => (
              <ChannelCard
                key={item.id}
                channel={{
                  id: item.id,
                  slug: item.slug,
                  name: item.name,
                  logo: item.logo,
                  country: item.country,
                  language: item.language,
                  category: item.category,
                  quality: item.quality,
                  isLive: item.isLive,
                  viewCount: item.viewCount,
                  subscriberCount: item.subscriberCount,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Rendered instead of the player when entitlement is missing. */
function LockedPanel({
  t,
  name,
  logo,
  signedIn,
  packageName,
}: {
  t: (key: string) => string;
  name: string;
  logo: string | null;
  signedIn: boolean;
  packageName?: string;
}) {
  return (
    <div className="relative grid aspect-video w-full place-items-center overflow-hidden rounded-card border border-line bg-surface">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(40rem 30rem at 50% 0%, color-mix(in srgb, var(--ls-brand) 45%, transparent), transparent 65%)",
        }}
      />
      <div className="relative space-y-4 px-6 text-center">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={name} className="mx-auto h-16 w-auto object-contain opacity-70" />
        ) : (
          <TvIcon className="mx-auto h-12 w-12 text-faint" />
        )}
        <p className="flex items-center justify-center gap-2 text-lg font-bold">
          <LockIcon className="h-5 w-5 text-brand" />
          {t("channels.locked")}
        </p>
        <p className="max-w-sm text-sm text-muted">{t("channels.lockedText")}</p>
        <LinkButton href={signedIn ? "/packages" : "/register"} size="lg">
          {signedIn ? t("channels.choosePackage") : t("nav.register")}
        </LinkButton>
        {packageName && (
          <p className="text-xs text-faint">
            {t("account.currentPlan")}: {packageName}
          </p>
        )}
      </div>
    </div>
  );
}