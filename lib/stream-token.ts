import crypto from "node:crypto";

const STREAM_TTL_SECONDS = 60 * 60 * 2; // 2 hours

function streamSecret(): string {
  return (
    process.env.STREAM_SECRET ||
    process.env.JWT_SECRET ||
    "lumistream-development-only-stream-secret"
  );
}

/**
 * Short-lived signed token embedded in playback URLs. It proves to the stream
 * proxy that the request came from our own player after a successful
 * entitlement check, without ever exposing the upstream stream URL.
 */
export function signStreamToken(channelId: string, userId: string): string {
  const payload = `${channelId}.${userId}.${Date.now()}`;
  const sig = crypto.createHmac("sha256", streamSecret()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifyStreamToken(
  token: string,
): { channelId: string; userId: string } | null {
  try {
    const [encoded, sig] = token.split(".");
    if (!encoded || !sig) return null;

    const payload = Buffer.from(encoded, "base64url").toString("utf8");
    const [channelId, userId, issuedAt] = payload.split(".");
    if (!channelId || !userId || !issuedAt) return null;

    const expected = crypto
      .createHmac("sha256", streamSecret())
      .update(payload)
      .digest("base64url");

    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const ageSeconds = (Date.now() - Number(issuedAt)) / 1000;
    if (!Number.isFinite(ageSeconds) || ageSeconds > STREAM_TTL_SECONDS) return null;

    return { channelId, userId };
  } catch {
    return null;
  }
}

/**
 * Encrypts an absolute upstream URL so the browser only ever sees an opaque
 * path under `/api/stream/...`. Prevents users from reading the origin URL
 * out of the manifest and re-sharing it directly.
 */
export function encodeUpstreamUrl(url: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(url, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decodeUpstreamUrl(encoded: string): string | null {
  try {
    const raw = Buffer.from(encoded, "base64url");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

function key(): Buffer {
  return crypto.createHash("sha256").update(streamSecret()).digest();
}

/** Timing-safe string comparison for webhook signature checks. */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Generate a random URL-safe token (password reset links). */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}