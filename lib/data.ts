import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export interface ChannelFilters {
  q?: string;
  category?: string;
  country?: string;
  language?: string;
  quality?: string;
  packageId?: string;
  featured?: boolean;
  limit?: number;
  skip?: number;
  sort?: "name" | "newest" | "popular" | "trending";
}

export function buildChannelWhere(filters: ChannelFilters): Prisma.ChannelWhereInput {
  const where: Prisma.ChannelWhereInput = { isActive: true };

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q } },
      { description: { contains: filters.q } },
      { tags: { contains: filters.q } },
      { country: { contains: filters.q } },
    ];
  }

  if (filters.category && filters.category !== "all") where.category = filters.category;
  if (filters.country && filters.country !== "all") where.country = filters.country;
  if (filters.language && filters.language !== "all") where.language = filters.language;
  if (filters.quality && filters.quality !== "all") where.quality = filters.quality;
  if (filters.featured) where.isFeatured = true;

  if (filters.packageId && filters.packageId !== "all") {
    where.packages = { some: { packageId: filters.packageId } };
  }

  return where;
}

function channelOrderBy(sort?: ChannelFilters["sort"]): Prisma.ChannelOrderByWithRelationInput[] {
  switch (sort) {
    case "name":
      return [{ name: "asc" }];
    case "popular":
      return [{ subscriberCount: "desc" }];
    case "trending":
      return [{ viewCount: "desc" }];
    case "newest":
    default:
      return [{ isFeatured: "desc" }, { sortOrder: "asc" }, { name: "asc" }];
  }
}

/** Public channel listing used by the Channels page, search and filters. */
export async function getChannels(filters: ChannelFilters = {}) {
  const where = buildChannelWhere(filters);
  return prisma.channel.findMany({
    where,
    orderBy: channelOrderBy(filters.sort),
    take: Math.min(filters.limit ?? 120, 300),
    skip: filters.skip ?? 0,
    include: {
      packages: {
        select: { packageId: true, package: { select: { id: true, name: true, slug: true } } },
      },
    },
  });
}

export async function countChannels(filters: ChannelFilters = {}): Promise<number> {
  return prisma.channel.count({ where: buildChannelWhere(filters) });
}

/** Distinct values that populate the filter dropdowns. */
export const getChannelFacets = cache(async () => {
  const [countries, languages, qualities, categories, total] = await Promise.all([
    prisma.channel.findMany({
      where: { isActive: true, country: { not: null } },
      distinct: ["country"],
      select: { country: true },
      orderBy: { country: "asc" },
    }),
    prisma.channel.findMany({
      where: { isActive: true, language: { not: null } },
      distinct: ["language"],
      select: { language: true },
      orderBy: { language: "asc" },
    }),
    prisma.channel.findMany({
      where: { isActive: true },
      distinct: ["quality"],
      select: { quality: true },
      orderBy: { quality: "asc" },
    }),
    prisma.channel.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: { _all: true },
    }),
    prisma.channel.count({ where: { isActive: true } }),
  ]);

  return {
    countries: countries.map((c) => c.country).filter((c): c is string => !!c),
    languages: languages.map((l) => l.language).filter((l): l is string => !!l),
    qualities: qualities.map((q) => q.quality).filter((q): q is string => !!q),
    categories: categories
      .map((c) => ({ value: c.category, count: c._count._all }))
      .sort((a, b) => b.count - a.count),
    total,
  };
});

export const getFeaturedChannels = cache(async (limit = 12) =>
  prisma.channel.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: limit,
  }),
);

export const getTrendingChannels = cache(async (limit = 10) =>
  prisma.channel.findMany({
    where: { isActive: true },
    orderBy: { viewCount: "desc" },
    take: limit,
  }),
);

export const getChannelBySlug = cache(async (slug: string) =>
  prisma.channel.findUnique({
    where: { slug },
    include: {
      packages: {
        include: { package: { select: { id: true, name: true, slug: true, price: true } } },
      },
    },
  }),
);

export const getRelatedChannels = cache(async (channelId: string, category: string, limit = 6) =>
  prisma.channel.findMany({
    where: { isActive: true, category, id: { not: channelId } },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    take: limit,
  }),
);
/* ------------------------------------------------------------------ */
/* Packages                                                            */
/* ------------------------------------------------------------------ */

export const getActivePackages = cache(async () =>
  prisma.package.findMany({
    where: { isActive: true },
    orderBy: [{ isPopular: "desc" }, { sortOrder: "asc" }, { price: "asc" }],
    include: { _count: { select: { channels: true } } },
  }),
);

export const getPackageBySlug = cache(async (slug: string) =>
  prisma.package.findUnique({
    where: { slug },
    include: { _count: { select: { channels: true } } },
  }),
);

/* ------------------------------------------------------------------ */
/* Content (VOD)                                                       */
/* ------------------------------------------------------------------ */

export interface ContentFilters {
  type?: string;
  q?: string;
  genre?: string;
  featured?: boolean;
  sort?: "newest" | "rating" | "title";
  limit?: number;
  skip?: number;
}

function contentWhere(filters: ContentFilters): Prisma.ContentWhereInput {
  const where: Prisma.ContentWhereInput = { isActive: true };
  if (filters.type && filters.type !== "all") where.type = filters.type;
  if (filters.genre && filters.genre !== "all") where.genres = { contains: filters.genre };
  if (filters.featured) where.isFeatured = true;
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q } },
      { originalTitle: { contains: filters.q } },
      { description: { contains: filters.q } },
      { genres: { contains: filters.q } },
      { director: { contains: filters.q } },
    ];
  }
  return where;
}

export async function getContent(filters: ContentFilters = {}) {
  const orderBy: Prisma.ContentOrderByWithRelationInput[] =
    filters.sort === "rating"
      ? [{ rating: "desc" }]
      : filters.sort === "title"
        ? [{ title: "asc" }]
        : [{ isFeatured: "desc" }, { sortOrder: "asc" }, { year: "desc" }];

  return prisma.content.findMany({
    where: contentWhere(filters),
    orderBy,
    take: Math.min(filters.limit ?? 60, 200),
    skip: filters.skip ?? 0,
  });
}

export const getContentBySlug = cache(async (slug: string) =>
  prisma.content.findUnique({ where: { slug } }),
);

export const getGenres = cache(async () => {
  const rows = await prisma.content.findMany({
    where: { isActive: true },
    distinct: ["genres"],
    select: { genres: true },
  });
  const set = new Set<string>();
  for (const row of rows) {
    for (const g of (row.genres ?? "").split(",")) {
      const t = g.trim();
      if (t) set.add(t);
    }
  }
  return [...set].sort();
});

/* ------------------------------------------------------------------ */
/* Home                                                                */
/* ------------------------------------------------------------------ */

export async function getHomeData() {
  const [featured, trending, latest, packages, stats] = await Promise.all([
    getFeaturedChannels(12),
    getTrendingChannels(10),
    prisma.content.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 12,
    }),
    prisma.package.findMany({
      where: { isActive: true },
      orderBy: [{ isPopular: "desc" }, { sortOrder: "asc" }],
      take: 3,
      include: { _count: { select: { channels: true } } },
    }),
    prisma.$transaction([
      prisma.channel.count({ where: { isActive: true } }),
      prisma.content.count({ where: { isActive: true } }),
      prisma.channel.aggregate({ _sum: { subscriberCount: true } }),
    ]),
  ]);

  return {
    featured,
    trending,
    latest,
    packages,
    channelCount: stats[0],
    contentCount: stats[1],
    viewerCount: stats[2]._sum.subscriberCount ?? 0,
  };
}