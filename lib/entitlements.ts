import { prisma } from "./prisma";
import { SUBSCRIPTION_STATUS } from "./constants";

export interface Entitlement {
  hasAccess: boolean;
  subscriptionId?: string;
  packageId?: string;
  packageName?: string;
  endDate?: Date | null;
  status?: string;
  reason?: "active" | "expired" | "cancelled" | "pending" | "none" | "admin";
}

/**
 * Decides whether a user may watch a given channel.
 *
 * Rules:
 *  - admins always pass
 *  - `demoMode` (Admin > Settings) opens the catalogue for evaluation
 *  - otherwise an `active` subscription whose `endDate` is in the future
 *    must include the channel through one of its packages
 */
export async function getEntitlement(
  userId: string | null | undefined,
  channelId?: string,
  opts: { demoMode?: boolean } = {},
): Promise<Entitlement> {
  if (!userId) {
    return { hasAccess: false, reason: "none" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return { hasAccess: false, reason: "none" };

  if (user.role === "admin") {
    return { hasAccess: true, reason: "admin" };
  }

  const now = new Date();
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    include: { package: { select: { id: true, name: true } } },
    orderBy: { endDate: "desc" },
  });

  if (!subscription) {
    return { hasAccess: opts.demoMode === true, reason: "none" };
  }

  if (channelId) {
    const link = await prisma.packageChannel.findUnique({
      where: {
        packageId_channelId: { packageId: subscription.packageId, channelId },
      },
      select: { channelId: true },
    });

    if (!link) {
      // Not in the subscribed package — demo mode still allows a preview.
      return {
        hasAccess: opts.demoMode === true,
        subscriptionId: subscription.id,
        packageId: subscription.package.id,
        packageName: subscription.package.name,
        endDate: subscription.endDate,
        status: subscription.status,
        reason: "expired",
      };
    }
  }

  return {
    hasAccess: true,
    subscriptionId: subscription.id,
    packageId: subscription.package.id,
    packageName: subscription.package.name,
    endDate: subscription.endDate,
    status: subscription.status,
    reason: "active",
  };
}

/** The user-wide active subscription, if any (account/subscription screens). */
export async function getActiveSubscription(userId: string) {
  const now = new Date();
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    include: { package: true },
    orderBy: { endDate: "desc" },
  });
}

/**
 * Marks subscriptions whose `endDate` has passed as expired.
 * Called opportunistically on dashboard and account reads.
 */
export async function expireStaleSubscriptions(): Promise<number> {
  const result = await prisma.subscription.updateMany({
    where: {
      status: SUBSCRIPTION_STATUS.ACTIVE,
      endDate: { not: null, lte: new Date() },
    },
    data: { status: SUBSCRIPTION_STATUS.EXPIRED },
  });
  return result.count;
}