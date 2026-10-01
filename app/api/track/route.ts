import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { track, type AnalyticsType } from "@/lib/audit";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/validation";

const ALLOWED: AnalyticsType[] = [
  "page_view",
  "search",
  "play",
  "signup",
  "subscribe",
  "login",
  "contact",
];

/**
 * POST /api/track — lightweight traffic beacon.
 *
 * Fire-and-forget: it always answers 204 so a failed analytics write can never
 * break a page, and it is rate limited per IP to blunt event spam.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limit = rateLimit(`track:${ip}`, 120, 60 * 1000);
  if (!limit.ok) return new NextResponse(null, { status: 204 });

  try {
    const body = (await request.json()) as {
      type?: unknown;
      path?: unknown;
      query?: unknown;
      channelId?: unknown;
    };

    const type = ALLOWED.includes(body.type as AnalyticsType)
      ? (body.type as AnalyticsType)
      : "page_view";

    const user = await getSessionUser();

    await track(type, {
      userId: user?.id ?? null,
      path: sanitizeText(body.path, 300) || null,
      query: sanitizeText(body.query, 300) || null,
      channelId: typeof body.channelId === "string" ? body.channelId : null,
      ip,
    });
  } catch {
    /* analytics must never surface an error to the page */
  }

  return new NextResponse(null, { status: 204 });
}