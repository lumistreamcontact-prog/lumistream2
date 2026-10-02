import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PAYMENT_STATUS, ROLES, SUBSCRIPTION_STATUS } from "@/lib/constants";

/** 7-day buckets of page views / plays / signups for the dashboard chart. */
async function dailySeries() {
  const since = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const events = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { type: true, createdAt: true },
  });

  const buckets = new Map<string, { views: number; plays: number; signups: number }>();
  for (let i = 0; i < 7; i++) {
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
}

/**
 * GET /api/admin/overview — one round trip for the whole back-office dashboard.
 *
 * The `/admin` pages are Server Components reading Prisma directly, so before
 * this route there was no REST surface a native client could use: the only
 * admin endpoints were the full-table `backup` / `restore` pair. This is the
 * read-only, paginated counterpart the mobile app renders the dashboard from.
 *
 * Admin-only, and deliberately excluding password hashes, stream URLs, reset
 * tokens and audit bodies — the same line `lib/admin.ts` draws for the web UI.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

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
    series,
    topChannels,
    activity,
    subscriptions,
    users,
    channels,
    content,
    packages,
    tickets,
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
    dailySeries(),
    prisma.channel.findMany({
      orderBy: { viewCount: "desc" },
      take: 6,
      select: {
        id: true,
        slug: true,
        name: true,
        logo: true,
        category: true,
        viewCount: true,
        subscriberCount: true,
      },
    }),
    prisma.analyticsEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, type: true, path: true, createdAt: true },
    }),
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        status: true,
        createdAt: true,
        endDate: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        package: { select: { id: true, name: true } },
      },
    }),

    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
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
    }),
    prisma.channel.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 50,
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        quality: true,
        country: true,
        language: true,
        isActive: true,
        isFeatured: true,
        viewCount: true,
        subscriberCount: true,
        _count: { select: { packages: true, favorites: true } },
      },
    }),
    prisma.content.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        year: true,
        genres: true,
        isActive: true,
        isFeatured: true,
        viewCount: true,
      },
    }),
    prisma.package.findMany({
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
      take: 50,
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        currency: true,
        durationDays: true,
        isPopular: true,
        isActive: true,
        _count: { select: { channels: true, subscriptions: true } },
      },
    }),
    prisma.supportTicket.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
        user: { select: { id: true, email: true, firstName: true } },
      },
    }),
  ]);

  return NextResponse.json({
    viewer: { id: user.id, firstName: user.firstName, email: user.email, role: user.role },
    stats: {
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
    },
    series,
    topChannels,
    activity,
    subscriptions,
    tables: { users, channels, content, packages, tickets },
  });
}
