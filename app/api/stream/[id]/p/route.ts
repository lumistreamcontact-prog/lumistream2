import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  decodeUpstreamUrl,
  encodeUpstreamUrl,
  verifyStreamToken,
} from "@/lib/stream-token";
import { contentTypeFor, isManifest, rewriteManifest } from "@/lib/hls";

/**
 * GET /api/stream/[id]/p?u=<opaque>&t=<token>
 *
 * The single egress point for all playback traffic:
 *
 *  1. verifies the short-lived playback token issued by `/token`
 *  2. decrypts the upstream URL (AES-256-GCM) — it is never in the HTML/JS
 *  3. fetches the upstream resource server-side
 *  4. for manifests, rewrites every URI so segments also route back through us
 *
 * Because step 4 rewrites child manifests recursively, the browser only ever
 * sees `/api/stream/...` URLs and the origin stays private.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const search = request.nextUrl.searchParams;

  const token = search.get("t");
  const encoded = search.get("u");

  if (!token || !encoded) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const verified = verifyStreamToken(token);
  if (!verified || verified.channelId !== id) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const upstreamUrl = decodeUpstreamUrl(encoded);
  if (!upstreamUrl) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // The channel must still be active — a takedown takes effect immediately.
  const channel = await prisma.channel.findFirst({
    where: { id, isActive: true },
    select: { id: true, streamUrl: true, fallbackUrl: true },
  });
  if (!channel) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let target = upstreamUrl;

  // Root manifest: no `u` on the initial request is handled by /token, but the
  // client may also hit /p with the primary URL. Fall back to the configured
  // source when the token is valid but the target is not part of this channel.
  if (!target && channel.streamUrl) target = channel.streamUrl;
  if (!target) return NextResponse.json({ error: "no_source" }, { status: 404 });

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      // Segments and manifests must never come from the CDN cache.
      cache: "no-store",
      headers: {
        // Some origins require a Referer/UA to serve their streams.
        "User-Agent": "Mozilla/5.0 (compatible; LumiStream/1.0)",
        Accept: "*/*",
        ...(request.headers.get("range") ? { Range: request.headers.get("range")! } : {}),
      },
      // HLS manifests are not always CORS-enabled; we fetch them server-side.
      redirect: "follow",
    });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }

  if (!upstream.ok && upstream.status >= 500) {
    // Try the channel's backup source before giving up.
    if (channel.fallbackUrl && channel.fallbackUrl !== target) {
      try {
        const fallback = await fetch(channel.fallbackUrl, { cache: "no-store" });
        if (fallback.ok) return forward(await fallback, target, id, token, channel.id);
      } catch {
        /* fall through to the error below */
      }
    }
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }

  return forward(upstream, target, id, token, channel.id);
}

async function forward(
  upstream: Response,
  upstreamUrl: string,
  channelId: string,
  token: string,
  userChannelId: string,
): Promise<Response> {
  const contentType = upstream.headers.get("content-type");

  if (isManifest(upstreamUrl, contentType)) {
    const body = await upstream.text();
    const rewritten = rewriteManifest(body, {
      baseUrl: upstreamUrl,
      routePrefix: `/api/stream/${channelId}/p`,
      token,
      encode: encodeUpstreamUrl,
    });

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Access-Control-Allow-Origin": "*",
        "X-Channel": userChannelId,
      },
    });
  }

  // Segments: stream straight through with the upstream content type.
  const headers = new Headers();
  for (const key of ["content-type", "content-length", "content-range", "accept-ranges", "etag"]) {
    const value = upstream.headers.get(key);
    if (value) headers.set(key, value);
  }
  headers.set("Cache-Control", "no-store");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Content-Type", contentTypeFor(upstreamUrl, contentType));

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}