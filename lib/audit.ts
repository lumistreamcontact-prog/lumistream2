import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";
import { clientIp } from "./rate-limit";

interface AuditInput {
  request?: Request;
  userId?: string | null;
  actorName?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  /** Stored verbatim in the `jsonb` column. */
  meta?: Prisma.InputJsonValue;
}

/**
 * Append-only trail of privileged and security-relevant actions, surfaced in
 * Admin > Audit log. Never throws into the request path.
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        actorName: input.actorName ?? null,
        action: input.action,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        // `meta` is a real `jsonb` column, so the object is stored as-is.
        meta: input.meta ?? undefined,
        ip: input.request ? clientIp(input.request) : null,
        userAgent: input.request?.headers.get("user-agent")?.slice(0, 255) ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to record entry", error);
  }
}

export type AnalyticsType =
  | "page_view"
  | "search"
  | "play"
  | "signup"
  | "subscribe"
  | "login"
  | "contact";

/** Lightweight traffic/event tracking that feeds Admin > Analytics. */
export async function track(
  type: AnalyticsType,
  data: {
    path?: string | null;
    query?: string | null;
    userId?: string | null;
    channelId?: string | null;
    meta?: Prisma.InputJsonValue;
    ip?: string | null;
  } = {},
): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        type,
        path: data.path ?? null,
        query: data.query ?? null,
        userId: data.userId ?? null,
        channelId: data.channelId ?? null,
        meta: data.meta ?? undefined,
        ip: data.ip ?? null,
      },
    });
  } catch (error) {
    console.error("[analytics] failed to record event", error);
  }
}