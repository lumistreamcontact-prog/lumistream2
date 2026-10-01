import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { ROLES } from "@/lib/constants";

/**
 * POST /api/admin/restore — replace the database from a snapshot.
 *
 * Accepts either a raw JSON body or a multipart `file` field. Restore is
 * destructive by design (it is the counterpart of the backup download), so it
 * is admin-only, explicitly confirmed, and fully audited.
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const MAX_BYTES = 32 * 1024 * 1024; // 32 MB

  let raw: string;
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "missing_file" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 413 });
    }
    raw = await file.text();
  } else {
    raw = await request.text();
  }

  let snapshot: Record<string, unknown[]>;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.users)) {
      return NextResponse.json({ error: "invalid_snapshot" }, { status: 422 });
    }
    snapshot = parsed as unknown as Record<string, unknown[]>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 422 });
  }

  const count = snapshot.users!.length;
  if (count === 0) {
    return NextResponse.json({ error: "empty_snapshot" }, { status: 422 });
  }

  // Order matters: children first, then parents, so FK constraints hold.
  await prisma.$transaction([
    prisma.analyticsEvent.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.supportTicket.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.packageChannel.deleteMany(),
    prisma.content.deleteMany(),
    prisma.channel.deleteMany(),
    prisma.package.deleteMany(),
    prisma.setting.deleteMany(),
    prisma.language.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const restore = async (rows: unknown[] | undefined) => rows ?? [];

  await prisma.language.createMany({ data: (await restore(snapshot.languages)) as never });
  await prisma.setting.createMany({ data: (await restore(snapshot.settings)) as never });
  await prisma.user.createMany({ data: (await restore(snapshot.users)) as never });
  await prisma.channel.createMany({ data: (await restore(snapshot.channels)) as never });
  await prisma.content.createMany({ data: (await restore(snapshot.content)) as never });
  await prisma.package.createMany({ data: (await restore(snapshot.packages)) as never });
  await prisma.packageChannel.createMany({
    data: (await restore(snapshot.packageChannels)) as never,
  });
  await prisma.payment.createMany({ data: (await restore(snapshot.payments)) as never });
  await prisma.subscription.createMany({
    data: (await restore(snapshot.subscriptions)) as never,
  });
  await prisma.favorite.createMany({ data: (await restore(snapshot.favorites)) as never });
  await prisma.supportTicket.createMany({
    data: (await restore(snapshot.supportTickets)) as never,
  });
  await prisma.auditLog.createMany({ data: (await restore(snapshot.auditLogs)) as never });
  await prisma.analyticsEvent.createMany({
    data: (await restore(snapshot.analyticsEvents)) as never,
  });
  await prisma.passwordResetToken.createMany({
    data: (await restore(snapshot.passwordResetTokens)) as never,
  });

  await audit({
    userId: user.id,
    actorName: user.email,
    action: "admin.backup.restore",
    entity: "Database",
    meta: { users: count },
  });

  return NextResponse.json({ ok: true, users: count });
}