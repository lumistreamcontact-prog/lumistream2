"use client";
import Link from "next/link";
import { useSite } from "@/components/providers/SiteProvider";
import { Badge, LiveDot } from "@/components/ui/Primitives";
import { PlayIcon } from "@/components/ui/Icons";
import { FavoriteButton } from "./FavoriteButton";
import { cn, formatNumber } from "@/lib/utils";

export interface ChannelCardData {
  id: string;
  slug: string;
  name: string;
  logo?: string | null;
  country?: string | null;
  language?: string | null;
  category: string;
  quality: string;
  isLive: boolean;
  viewCount: number;
  subscriberCount: number;
  favorite?: boolean;
}

/**
 * Channel tile used on the home page, channels grid and favourites list.
 * Renders a logo when supplied and a typographic monogram fallback otherwise,
 * so the card never shows a broken image.
 */
export function ChannelCard({
  channel,
  className,
  variant = "grid",
}: {
  channel: ChannelCardData;
  className?: string;
  variant?: "grid" | "rail";
}) {
  const { t } = useSite();

  return (
    <article
      className={cn(
        "group surface-card hover-lift relative flex flex-col overflow-hidden p-3",
        variant === "rail" && "w-56 shrink-0",
        className,
      )}
    >
      <Link
        href={`/channels/${channel.slug}`}
        className="flex flex-1 flex-col gap-3 focus-visible:outline-none"
      >
        {/* Logo / monogram */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-gradient-to-br from-white/8 to-white/2">
          {channel.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={channel.logo}
              alt={channel.name}
              loading="lazy"
              className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="brand-gradient-bg grid h-full w-full place-items-center text-2xl font-black text-white/95">
              {channel.name
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </div>
          )}

          {channel.isLive && (
            <span className="absolute start-2 top-2">
              <Badge tone="live" className="gap-1.5">
                <LiveDot className="h-1.5 w-1.5" />
                {t("common.live")}
              </Badge>
            </span>
          )}

          <span className="absolute bottom-2 end-2">
            <Badge tone="neutral" className="backdrop-blur-sm">
              {channel.quality}
            </Badge>
          </span>

          {/* Hover play affordance */}
          <span className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="brand-gradient-bg grid h-12 w-12 place-items-center rounded-full text-white shadow-xl">
              <PlayIcon className="ms-0.5 h-5 w-5" />
            </span>
          </span>
        </div>

        <div className="space-y-1.5">
          <h3 className="line-clamp-1 text-sm font-semibold leading-tight">{channel.name}</h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-faint">
            <span className="rounded-md bg-white/6 px-1.5 py-0.5 text-muted">
              {t(`category.${channel.category}`)}
            </span>
            {channel.country && <span className="line-clamp-1">{channel.country}</span>}
            {channel.language && (
              <>
                <span aria-hidden>·</span>
                <span>{channel.language}</span>
              </>
            )}
          </div>
          {channel.subscriberCount > 0 && (
            <p className="text-[11px] text-faint">
              {formatNumber(channel.subscriberCount)} {t("home.viewerCount")}
            </p>
          )}
        </div>
      </Link>

      <FavoriteButton
        channelId={channel.id}
        initial={Boolean(channel.favorite)}
        className="absolute end-2 top-2 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
      />
    </article>
  );
}