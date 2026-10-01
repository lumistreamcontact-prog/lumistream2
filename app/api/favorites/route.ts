import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/favorites — ids of the signed-in user's favourite channels. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { channelId: true },
  });

  return NextResponse.json({ channelIds: favorites.map((f) => f.channelId) });
}

/** POST /api/favorites — add a channel to favourites. */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const channelId = await readChannelId(request);
  if (!channelId) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const channel = await prisma.channel.findFirst({
    where: { id: channelId, isActive: true },
    select: { id: true },
  });
  if (!channel) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Idempotent — the unique constraint makes repeated POSTs safe.
  await prisma.favorite.upsert({
    where: { userId_channelId: { userId: user.id, channelId } },
    create: { userId: user.id, channelId },
    update: {},
  });

  return NextResponse.json({ ok: true, channelId });
}

/** DELETE /api/favorites — remove a channel from favourites. */
export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const channelId = await readChannelId(request);
  if (!channelId) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  await prisma.favorite.deleteMany({ where: { userId: user.id, channelId } });

  return NextResponse.json({ ok: true, channelId });
}

async function readChannelId(request: NextRequest): Promise<string | null> {
  try {
    const body = (await request.json()) as { channelId?: unknown };
    return typeof body.channelId === "string" && body.channelId.length > 0
      ? body.channelId
      : null;
  } catch {
    return null;
  }
}