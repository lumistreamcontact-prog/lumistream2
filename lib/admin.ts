import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { PAYMENT_STATUS, SUBSCRIPTION_STATUS } from "./constants";

/**
 * Dashboard + entity-table read queries for the `/admin` area.
 *
 * Kept separate from `lib/data.ts` (which only serves the public catalogue) so
 * public pages can never surface disabled rows or subscriber emails.
 */

/* ------------------------------------------------------------------ */
/* Dashboard                                                          */
/* ------------------------------------------------------------------ */

export const getAdminStats = cache(async () => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsers,
    activeSubs,
    totalChannels,
    activeChannels,
    totalContent,
    revenue,
    paidCount,
    openTickets,
    totalViews,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.subscription.count({ where: { status: SUBSCRIPTION_STATUS.ACTIVE } }),
    prisma.channel.count(),
    prisma.channel.count({ where: { isActive: true } }),
    prisma.content.count({ where: { isActive: true } }),
    prisma.payment.aggregate({
      where: { status: PAYMENT_STATUS.PAID },
      _sum: { amount: true },
    }),
    prisma.payment.count({ where: { status: PAYMENT_STATUS.PAID } }),
    prisma.supportTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
    prisma.channel.aggregate({ _sum: { viewCount: true } }),
  ]);

  return {
    totalUsers,
    newUsers,
    activeSubs,
    totalChannels,
    activeChannels,
    totalContent,
    revenue: revenue._sum.amount ?? 0,
    paidCount,
    openTickets,
    totalViews: totalViews._sum.viewCount ?? 0,
  };
});

/** Day-by-day event buckets for the dashboard chart and the analytics screen. */
export const getDailySeries = cache(async (days = 7) => {
  const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const events = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { type: true, createdAt: true },
  });

  const buckets = new Map<string, { views: number; plays: number; signups: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    buckets.set(d.toISOString().slice(0, 10), { views: 0, plays: 0, signups: 0 });
  }

  for (const event of events) {
    const bucket = buckets.get(event.createdAt.toISOString().slice(0, 10));
    if (!bucket) continue;
    if (event.type === "page_view") bucket.views += 1;
    else if (event.type === "play") bucket.plays += 1;
    else if (event.type === "signup") bucket.signups += 1;
  }

  return [...buckets.entries()].map(([date, counts]) => ({ date, ...counts }));
});

export const getTopChannels = cache(async (limit = 6) =>
  prisma.channel.findMany({
    orderBy: { viewCount: "desc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      viewCount: true,
      subscriberCount: true,
    },
  }),
);

export const getRecentActivity = cache(async (limit = 12) =>
  prisma.analyticsEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, type: true, path: true, query: true, createdAt: true },
  }),
);

/* ------------------------------------------------------------------ */
/* Entity tables                                                      */
/* ------------------------------------------------------------------ */

export interface AdminListOptions {
  q?: string;
  take?: number;
  skip?: number;
}

const PAGE_SIZE = 50;

/** Shared pagination window for every admin table. */
export function page({ take, skip }: AdminListOptions) {
  return { take: Math.min(take ?? PAGE_SIZE, 200), skip: skip ?? 0 };
}

export const listUsers = cache(async (opts: AdminListOptions = {}) => {
  const q = opts.q?.trim();
  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { email: { contains: q } },
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { phone: { contains: q } },
        ],
      }
    : {};
  return prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    ...page(opts),
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { subscriptions: true, payments: true } },
    },
  });
});

export const countUsers = cache(async (q?: string) =>
  prisma.user.count({
    where: q
      ? {
          OR: [
            { email: { contains: q } },
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : {},
  }),
);

export const listChannels = cache(async (opts: AdminListOptions = {}) => {
  const q = opts.q?.trim();
  const where: Prisma.ChannelWhereInput = q
    ? { OR: [{ name: { contains: q } }, { slug: { contains: q } }, { country: { contains: q } }] }
    : {};
  return prisma.channel.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    ...page(opts),
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      quality: true,
      country: true,
      language: true,
      streamUrl: true,
      isActive: true,
      isFeatured: true,
      sortOrder: true,
      viewCount: true,
      _count: { select: { packages: true, favorites: true } },
    },
  });
});

export const countChannelsAdmin = cache(async (q?: string) =>
  prisma.channel.count({
    where: q ? { OR: [{ name: { contains: q } }, { slug: { contains: q } }] } : {},
  }),
);

/** Counts every language, optionally filtered by a search term. */
export const countLanguages = cache(async (q?: string) =>
  prisma.language.count({
    where: q
      ? {
          OR: [
            { code: { contains: q } },
            { name: { contains: q } },
            { nativeName: { contains: q } },
          ],
        }
      : {},
  }),
);