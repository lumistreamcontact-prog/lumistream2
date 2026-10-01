import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { ROLES } from "@/lib/constants";

/**
 * GET /api/admin/backup — full JSON snapshot of every table.
 *
 * Admin-only. Password hashes and raw stream URLs are included on purpose:
 * this is an operator restore file, never a public export. The same snapshot
 * format is what `scripts/backup.mjs` writes and `POST /api/admin/restore`
 * consumes.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [
    users,
    languages,
    settings,
    channels,
    content,
    packages,
    packageChannels,
    subscriptions,
    payments,
    favorites,
    supportTickets,
    auditLogs,
    analyticsEvents,
    passwordResetTokens,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.language.findMany(),
    prisma.setting.findMany(),
    prisma.channel.findMany(),
    prisma.content.findMany(),
    prisma.package.findMany(),
    prisma.packageChannel.findMany(),
    prisma.subscription.findMany(),
    prisma.payment.findMany(),
    prisma.favorite.findMany(),
    prisma.supportTicket.findMany(),
    prisma.auditLog.findMany(),
    prisma.analyticsEvent.findMany(),
    prisma.passwordResetToken.findMany(),
  ]);

  const snapshot = {
    meta: {
      app: "lumistream2",
      version: 1,
      createdAt: new Date().toISOString(),
      createdBy: user.email,
      counts: {
        users: users.length,
        channels: channels.length,
        content: content.length,
        packages: packages.length,
        payments: payments.length,
      },
    },
    users,
    languages,
    settings,
    channels,
    content,
    packages,
    packageChannels,
    subscriptions,
    payments,
    favorites,
    supportTickets,
    auditLogs,
    analyticsEvents,
    passwordResetTokens,
  };

  await audit({
    userId: user.id,
    actorName: user.email,
    action: "admin.backup.export",
    entity: "Database",
    meta: snapshot.meta.counts,
  });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lumistream-backup-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}