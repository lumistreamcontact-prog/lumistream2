import { cache } from "react";
import { prisma } from "./prisma";

/**
 * Read queries backing the signed-in "My account" area.
 *
 * Every projection here is deliberately narrow: the session user never needs
 * the password hash, and channel rows never expose `streamUrl` (upstream URLs
 * are only ever reachable through the signed proxy in `lib/stream-token.ts`).
 */

/** Public profile fields shown on the account screen. */
export const getUserProfile = cache(async (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
    },
  }),
);

/**
 * The signed-in user's favourite channels. `streamUrl` / `fallbackUrl` are
 * intentionally excluded so they can never reach the client bundle.
 */
export const getFavoriteChannels = cache(async (userId: string) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      channel: {
        select: {
          id: true,
          slug: true,
          name: true,
          logo: true,
          poster: true,
          country: true,
          language: true,
          category: true,
          quality: true,
          isLive: true,
          viewCount: true,
          subscriberCount: true,
        },
      },
    },
  });
  return favorites.map((f) => f.channel);
});

/** Billing history, newest first. */
export const getUserPayments = cache(async (userId: string) =>
  prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { package: { select: { name: true, slug: true } } },
  }),
);

/** Support tickets the signed-in user opened. */
export const getUserTickets = cache(async (userId: string) =>
  prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      reply: true,
      createdAt: true,
      repliedAt: true,
    },
  }),
);

/** Full subscription history (active + past). */
export const getUserSubscriptions = cache(async (userId: string) =>
  prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      package: { select: { name: true, slug: true, price: true, currency: true } },
    },
  }),
);