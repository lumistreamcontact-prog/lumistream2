import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { getContent, getContentBySlug } from "@/lib/data";
import { ContentCard } from "@/components/cards/ContentCard";
import { Badge, Rating, SectionHeader } from "@/components/ui/Primitives";
import { LinkButton } from "@/components/ui/Button";
import { ClockIcon, PlayIcon, StarIcon } from "@/components/ui/Icons";
import { formatDate, formatDuration, splitList } from "@/lib/utils";
import { getSessionUser } from "@/lib/auth";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { t } = await getDictionary();
  const item = await getContentBySlug(slug);
  if (!item || !item.isActive) return { title: t("common.notFound") };

  return {
    title: item.title,
    description: item.description ?? undefined,
    openGraph: { title: item.title, description: item.description ?? undefined },
  };
}

const TYPE_LABEL: Record<string, string> = {
  movie: "content.movies",
  series: "content.series",
  documentary: "content.documentaries",
};

export default async function ContentDetailPage({ params }: Params) {
  const { slug } = await params;
  const [{ t, locale }, user] = await Promise.all([getDictionary(), getSessionUser()]);

  const item = await getContentBySlug(slug);
  if (!item || !item.isActive) notFound();

  const genres = splitList(item.genres);
  const cast = splitList(item.cast);
  const related = await getContent({ type: item.type, limit: 7, skip: 1 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative">
        {item.backdrop && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.backdrop}
            alt=""
            className="absolute inset-x-0 -top-24 -z-10 h-96 w-full rounded-card object-cover opacity-30 blur-sm"
          />
        )}

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="w-40 shrink-0 overflow-hidden rounded-card border border-line bg-surface shadow-2xl sm:w-56">
            {item.poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.poster} alt={item.title} className="aspect-[2/3] w-full object-cover" />
            ) : (
              <div className="brand-gradient-bg grid aspect-[2/3] w-full place-items-center p-4 text-center">
                <span className="line-clamp-3 text-sm font-bold text-white/95">{item.title}</span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{t(TYPE_LABEL[item.type] ?? "nav.content")}</Badge>
              {item.year && <Badge tone="neutral">{item.year}</Badge>}
              {item.ageRating && <Badge tone="warn">{item.ageRating}</Badge>}
              {item.rating > 0 && <Rating value={item.rating} />}
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{item.title}</h1>
            {item.originalTitle && (
              <p className="mt-1 text-sm text-muted" dir="auto">
                {item.originalTitle}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              {item.duration && (
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {formatDuration(item.duration)}
                </span>
              )}
              {item.rating > 0 && (
                <span className="flex items-center gap-1.5">
                  <StarIcon className="h-3.5 w-3.5 text-warn" />
                  {item.rating.toFixed(1)} / 10
                </span>
              )}
              {item.releaseDate && <span>{formatDate(item.releaseDate, locale)}</span>}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <LinkButton href="/content" variant="secondary" size="md">
                {t("common.back")}
              </LinkButton>
              {item.trailerUrl && (
                <LinkButton href={item.trailerUrl} external size="md">
                  <PlayIcon className="h-4 w-4" />
                  {t("content.watchTrailer")}
                </LinkButton>
              )}
              {item.videoUrl && (
                <LinkButton
                  href={user ? `/content/${item.slug}?play=1` : "/login"}
                  variant="primary"
                >
                  {t("content.play")}
                </LinkButton>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            {t("content.overview")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {item.description ?? t("content.subtitle")}
          </p>

          {cast.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                {t("content.cast")}
              </h3>
              <p className="mt-2 text-sm text-muted">{cast.join(", ")}</p>
            </div>
          )}
        </div>

        <aside className="surface-card space-y-4 p-5 text-sm">
          {item.director && (
            <div>
              <p className="text-xs uppercase tracking-wider text-faint">{t("content.director")}</p>
              <p className="mt-0.5">{item.director}</p>
            </div>
          )}
          {genres.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-faint">{t("content.genres")}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {genres.map((genre) => (
                  <Badge key={genre} tone="neutral">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wider text-faint">{t("content.duration")}</p>
            <p className="mt-0.5">{formatDuration(item.duration)}</p>
          </div>
          {item.releaseDate && (
            <div>
              <p className="text-xs uppercase tracking-wider text-faint">
                {t("content.releaseDate")}
              </p>
              <p className="mt-0.5">{formatDate(item.releaseDate, locale)}</p>
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <SectionHeader title={t("content.title")} />
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {related.map((entry) => (
              <ContentCard
                key={entry.id}
                item={{
                  id: entry.id,
                  slug: entry.slug,
                  title: entry.title,
                  type: entry.type,
                  poster: entry.poster,
                  year: entry.year,
                  rating: entry.rating,
                  duration: entry.duration,
                  genres: entry.genres,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}