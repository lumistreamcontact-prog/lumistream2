import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { type AdminListOptions, page } from "./admin";

export const listContent = cache(async (opts: AdminListOptions = {}) => {
  const q = opts.q?.trim();
  const where: Prisma.ContentWhereInput = q
    ? { OR: [{ title: { contains: q } }, { slug: { contains: q } }, { director: { contains: q } }] }
    : {};
  return prisma.content.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    ...page(opts),
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      year: true,
      genres: true,
      isActive: true,
      isFeatured: true,
      sortOrder: true,
      viewCount: true,
    },
  });
});

export const countContentAdmin = cache(async (q?: string) =>
  prisma.content.count({ where: q ? { title: { contains: q } } : {} }),
);

export const listPackages = cache(async (opts: AdminListOptions = {}) => {
  const q = opts.q?.trim();
  const where: Prisma.PackageWhereInput = q
    ? { OR: [{ name: { contains: q } }, { slug: { contains: q } }] }
    : {};
  return prisma.package.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    ...page(opts),
    include: { _count: { select: { channels: true, subscriptions: true } } },
  });
});

export const countPackagesAdmin = cache(async (q?: string) =>
  prisma.package.count({ where: q ? { name: { contains: q } } : {} }),
);

export const listPayments = cache(async (opts: AdminListOptions = {}) => {
  const q = opts.q?.trim();
  const where: Prisma.PaymentWhereInput = q
    ? {
        OR: [
          { reference: { contains: q } },
          { invoiceNo: { contains: q } },
          { user: { email: { contains: q } } },
        ],
      }
    : {};
  return prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    ...page(opts),
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      package: { select: { id: true, name: true, slug: true } },
    },
  });
});

export const countPaymentsAdmin = cache(async (q?: string) =>
  prisma.payment.count({
    where: q ? { OR: [{ reference: { contains: q } }, { user: { email: { contains: q } } }] } : {},
  }),
);

export const listSubscriptions = cache(async (limit = 20) =>
  prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      package: { select: { name: true } },
    },
  }),
);

export const listLanguages = cache(async () =>
  prisma.language.findMany({ orderBy: { sortOrder: "asc" } }),
);

export const countLanguages = cache(async (q?: string) =>
  prisma.language.count({
    where: q
      ? { OR: [{ code: { contains: q } }, { name: { contains: q } }, { nativeName: { contains: q } }] }
      : {},
  }),
);

export const listTickets = cache(async (take = 100) =>
  prisma.supportTicket.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take,
    include: { user: { select: { id: true, email: true, firstName: true } } },
  }),
);

export const listAuditLogs = cache(async (take = 150) =>
  prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { id: true, email: true } } },
  }),
);

/** Rows offered by the channel multi-select on the package editor. */
export const listSelectableChannels = cache(async () =>
  prisma.channel.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true },
  }),
);

export const listPackageChannelIds = cache(async (packageId: string) =>
  prisma.packageChannel.findMany({ where: { packageId }, select: { channelId: true } }),
);

/** Single-row lookup used to prefill the generic admin editor. */
export const getEntityRow = cache(
  async (entity: string, id: string): Promise<Record<string, unknown> | null> => {
    switch (entity) {
      case "channel":
        return prisma.channel.findUnique({ where: { id } });
      case "content":
        return prisma.content.findUnique({ where: { id } });
      case "package":
        return prisma.package.findUnique({ where: { id } });
      case "user":
        return prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
          },
        });
      case "language":
        return prisma.language.findUnique({ where: { id } });
      default:
        return null;
    }
  },
);