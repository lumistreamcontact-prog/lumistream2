"use client";
import Link from "next/link";
import { useSite } from "@/components/providers/SiteProvider";
import { Badge, Rating } from "@/components/ui/Primitives";
import { PlayIcon } from "@/components/ui/Icons";
import { cn, splitList } from "@/lib/utils";

export interface ContentCardData {
  id: string;
  slug: string;
  title: string;
  type: string;
  poster?: string | null;
  backdrop?: string | null;
  year?: number | null;
  rating: number;
  duration?: number | null;
  genres?: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  movie: "content.movies",
  series: "content.series",
  documentary: "content.documentaries",
};

/** Poster tile for the VOD catalogue. */
export function ContentCard({
  item,
  className,
  variant = "grid",
}: {
  item: ContentCardData;
  className?: string;
  variant?: "grid" | "rail" | "wide";
}) {
  const { t } = useSite();
  const genres = splitList(item.genres);

  return (
    <article
      className={cn(
        "group surface-card hover-lift relative overflow-hidden",
        variant === "rail" && "w-44 shrink-0",
        className,
      )}
    >
      <Link href={`/content/${item.slug}`} className="block focus-visible:outline-none">
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-2">
          {item.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.poster}
              alt={item.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="brand-gradient-bg grid h-full w-full place-items-center p-4 text-center">
              <span className="line-clamp-3 text-sm font-bold text-white/95">{item.title}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

          <span className="absolute end-2 top-2">
            <Badge tone="neutral" className="backdrop-blur-sm">
              {t(TYPE_LABEL[item.type] ?? "nav.content")}
            </Badge>
          </span>

          {item.rating > 0 && (
            <span className="absolute start-2 top-2">
              <Rating value={item.rating} className="rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm" />
            </span>
          )}

          <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="brand-gradient-bg grid h-12 w-12 place-items-center rounded-full text-white shadow-xl">
              <PlayIcon className="ms-0.5 h-5 w-5" />
            </span>
          </span>

          <div className="absolute inset-x-0 bottom-0 p-3">
            <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white">
              {item.title}
            </h3>
            <p className="mt-1 flex items-center gap-2 text-[11px] text-white/65">
              {item.year && <span>{item.year}</span>}
              {genres[0] && (
                <>
                  <span aria-hidden>·</span>
                  <span className="line-clamp-1">{genres[0]}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}