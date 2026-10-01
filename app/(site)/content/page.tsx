import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getContent, getGenres } from "@/lib/data";
import { ContentCard } from "@/components/cards/ContentCard";
import { EmptyState, PageHeader } from "@/components/ui/Primitives";
import { FilmIcon } from "@/components/ui/Icons";
import { CONTENT_TYPES } from "@/lib/constants";
import { ContentFilters } from "@/components/content/ContentFilters";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Movies & Content" };

const TYPES = ["movie", "series", "documentary"] as const;
const SORTS = ["newest", "rating", "title"] as const;

interface SearchParams {
  type?: string;
  q?: string;
  genre?: string;
  sort?: string;
}

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const [{ t }, genres, total] = await Promise.all([
    getDictionary(),
    getGenres(),
    prisma.content.count({ where: { isActive: true } }),
  ]);

  const items = await getContent({
    type: TYPES.includes(sp.type as (typeof TYPES)[number]) ? sp.type : undefined,
    q: sp.q?.slice(0, 80),
    genre: sp.genre,
    sort: SORTS.includes(sp.sort as (typeof SORTS)[number])
      ? (sp.sort as (typeof SORTS)[number])
      : "newest",
    limit: 120,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title={t("content.title")} description={t("content.subtitle")} />

      <ContentFilters genres={genres} types={Object.values(CONTENT_TYPES)} />

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={<FilmIcon className="h-10 w-10" />} title={t("content.empty")} />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
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
      )}

      <p className="mt-10 text-center text-xs text-faint">
        {items.length} / {total}
      </p>
    </div>
  );
}