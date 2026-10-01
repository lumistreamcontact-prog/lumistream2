/**
 * HLS manifest rewriting used by `/api/stream/[id]/p`.
 *
 * Every URI the player would otherwise see is replaced with an encrypted,
 * token-protected path back through our own origin. This keeps the upstream
 * stream URL private (it is never rendered to the client) and lets us enforce
 * entitlement on every segment request.
 */

export interface RewriteContext {
  /** Absolute URL of the manifest being rewritten (for resolving relatives). */
  baseUrl: string;
  /** Route prefix that segments are proxied through, e.g. `/api/stream/abc/p`. */
  routePrefix: string;
  /** Short-lived playback token appended to every generated URL. */
  token: string;
  /** Encrypts an absolute URL into the opaque path parameter. */
  encode: (url: string) => string;
}

/** Resolve a possibly-relative URI against the manifest URL. */
export function resolveUri(uri: string, baseUrl: string): string | null {
  const trimmed = uri.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return null;
  }
}

export function buildProxyUrl(ctx: RewriteContext, absoluteUrl: string): string {
  return `${ctx.routePrefix}?u=${ctx.encode(absoluteUrl)}&t=${encodeURIComponent(ctx.token)}`;
}

const URI_ATTR_RE = /URI="([^"]*)"/gi;

/**
 * Rewrite a manifest so every segment/key/map URI points at our proxy.
 * Lines that are not URIs (tags, durations, codec metadata) pass through.
 */
export function rewriteManifest(manifest: string, ctx: RewriteContext): string {
  const lines = manifest.split(/\r?\n/);
  const out: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();

    // Rewrite URI="..." attributes on tag lines (EXT-X-KEY, EXT-X-MAP, ...).
    if (line.includes('URI="')) {
      out.push(
        raw.replace(URI_ATTR_RE, (_match, uri: string) => {
          const abs = resolveUri(uri, ctx.baseUrl);
          return abs ? `URI="${buildProxyUrl(ctx, abs)}"` : _match;
        }),
      );
      continue;
    }

    // A bare line that is itself a URI (segments and child manifests).
    if (line && !line.startsWith("#")) {
      const abs = resolveUri(line, ctx.baseUrl);
      if (abs) {
        out.push(buildProxyUrl(ctx, abs));
        continue;
      }
    }

    out.push(raw);
  }

  return out.join("\n");
}

export function isManifest(url: string, contentType?: string | null): boolean {
  if (contentType?.includes("mpegurl")) return true;
  const path = url.split("?")[0]!.toLowerCase();
  return path.endsWith(".m3u8") || path.endsWith(".m3u");
}

export function isSegment(url: string, contentType?: string | null): boolean {
  if (contentType?.includes("mpegurl")) return false;
  const path = url.split("?")[0]!.toLowerCase();
  return (
    path.endsWith(".ts") ||
    path.endsWith(".m4s") ||
    path.endsWith(".mp4") ||
    path.endsWith(".aac") ||
    path.endsWith(".cmfv") ||
    path.endsWith(".cmfa") ||
    contentType?.includes("mp2t") === true
  );
}

/** Correct MIME type per HLS/RFC 8216 for proxied parts. */
export function contentTypeFor(url: string, upstream?: string | null): string {
  if (upstream) return upstream;
  const path = url.split("?")[0]!.toLowerCase();
  if (path.endsWith(".m3u8") || path.endsWith(".m3u")) return "application/vnd.apple.mpegurl";
  if (path.endsWith(".ts")) return "video/mp2t";
  if (path.endsWith(".m4s") || path.endsWith(".mp4")) return "video/mp4";
  if (path.endsWith(".aac")) return "audio/aac";
  if (path.endsWith(".vtt")) return "text/vtt";
  if (path.endsWith(".webvtt")) return "text/vtt";
  return "application/octet-stream";
}