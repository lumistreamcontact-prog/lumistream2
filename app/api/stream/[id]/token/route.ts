import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEntitlement } from "@/lib/entitlements";
import { getSettings } from "@/lib/settings";
import { signStreamToken } from "@/lib/stream-token";
import { track } from "@/lib/audit";

/**
 * GET /api/stream/[id]/token
 *
 * Issues a short-lived playback token *after* checking entitlement. The player
 * then requests the manifest through `/api/stream/[id]/p`, and every segment
 * it references is proxied through us as well — so the upstream origin URL is
 * never sent to the browser.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const channel = await prisma.channel.findFirst({
    where: { id, isActive: true },
    select: { id: true, slug: true, name: true, isLive: true },
  });

  if (!channel) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const settings = await getSettings();
  const entitlement = await getEntitlement(user.id, channel.id, {
    demoMode: settings.demoMode === "true",
  });

  if (!entitlement.hasAccess) {
    return NextResponse.json(
      {
        error: "subscription_required",
        packageName: entitlement.packageName,
        endDate: entitlement.endDate,
      },
      { status: 403 },
    );
  }

  await track("play", { userId: user.id, channelId: channel.id, path: `/channels/${channel.slug}` });

  return NextResponse.json({
    // Relative URL: the browser only ever talks to our own origin.
    url: `/api/stream/${channel.id}/p`,
    token: signStreamToken(channel.id, user.id),
    isLive: channel.isLive,
    expiresIn: 7200,
  });
}