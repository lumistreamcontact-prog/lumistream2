"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { saveSettings } from "@/lib/settings";
import { completePayment } from "@/lib/payments";
import {
  sanitizeHexColor,
  sanitizeInternalPath,
  sanitizeNumberString,
  sanitizeText,
  sanitizeUrl,
  toBoolean,
  toInt,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/validation";
import { slugify, splitLines } from "@/lib/utils";
import {
  BUNDLED_LOCALES,
  CATEGORIES,
  CATEGORY_VALUES,
  CURRENCY_CODES,
  QUALITIES,
  ROLES,
  TICKET_STATUS,
} from "@/lib/constants";

/**
 * Every admin mutation lives here.
 *
 * Server Functions are reachable by a direct POST from anyone, so
 * `requireAdmin()` runs inside each action - the UI check is never the guard.
 */

type Entity = "channel" | "content" | "package" | "user" | "language";

const SETTING_PATHS = ["/", "/admin/settings", "/admin/appearance"] as const;

function str(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function assertEntity(entity: string): asserts entity is Entity {
  if (!["channel", "content", "package", "user", "language"].includes(entity)) {
    throw new Error(`Unsupported entity: ${entity}`);
  }
}

/* ------------------------------------------------------------------ */
/* Settings                                                           */
/* ------------------------------------------------------------------ */

/** Persist a group of site settings and refresh every screen that reads them. */
export async function saveSettingsAction(fd: FormData): Promise<void> {
  const admin = await requireAdmin();
  const group = str(fd, "group") || "general";

  const raw: Record<string, string> = {};
  for (const [key, value] of fd.entries()) {
    if (key === "group" || typeof value !== "string") continue;
    raw[key] = value;
  }

  // Sanitise by setting name so the appearance screen cannot inject CSS.
  if (raw.primaryColor) raw.primaryColor = sanitizeHexColor(raw.primaryColor, "#e11d48");
  if (raw.secondaryColor) raw.secondaryColor = sanitizeHexColor(raw.secondaryColor, "#0ea5e9");
  if (raw.backgroundOverlay) {
    raw.backgroundOverlay = sanitizeNumberString(raw.backgroundOverlay, 0, 1, "0.72");
  }
  if (raw.glassIntensity) {
    raw.glassIntensity = sanitizeNumberString(raw.glassIntensity, 0, 1, "0.12");
  }
  if (raw.radius) raw.radius = sanitizeNumberString(raw.radius, 0, 3, "1rem");
  if (raw.heroPrimaryLink) {
    raw.heroPrimaryLink = sanitizeInternalPath(raw.heroPrimaryLink) ?? "/channels";
  }
  if (raw.heroSecondaryLink) {
    raw.heroSecondaryLink = sanitizeInternalPath(raw.heroSecondaryLink) ?? "/packages";
  }
  for (const key of [
    "heroImage",
    "siteLogo",
    "siteFavicon",
    "backgroundImage",
    "facebookUrl",
    "twitterUrl",
    "instagramUrl",
    "telegramUrl",
    "youtubeUrl",
  ] as const) {
    if (raw[key]) raw[key] = sanitizeUrl(raw[key]) ?? "";
  }
  for (const key of ["siteName", "siteTagline", "supportEmail", "whatsappNumber"] as const) {
    if (raw[key]) raw[key] = sanitizeText(raw[key], key === "siteTagline" ? 160 : 200);
  }
  for (const key of ["siteDescription", "footerText", "footerDisclaimer"] as const) {
    if (raw[key] !== undefined) raw[key] = sanitizeText(raw[key], 2000);
  }
  if (raw.currency && !CURRENCY_CODES.includes(raw.currency)) raw.currency = "EUR";
  if (raw.defaultLocale && !BUNDLED_LOCALES.includes(raw.defaultLocale as never)) {
    raw.defaultLocale = "ar";
  }
  raw.showFooter = toBoolean(raw.showFooter) ? "true" : "false";
  raw.showSocial = toBoolean(raw.showSocial) ? "true" : "false";
  raw.demoMode = toBoolean(raw.demoMode) ? "true" : "false";

  await saveSettings(raw, group);
  await audit({
    userId: admin.id,
    actorName: admin.email,
    action: "admin.settings.update",
    entity: "Setting",
    entityId: group,
    meta: { keys: Object.keys(raw) },
  });

  for (const path of SETTING_PATHS) revalidatePath(path);
}

/* ------------------------------------------------------------------ */
/* Per-entity validation + persistence                                */
/* ------------------------------------------------------------------ */

async function buildEntityData(
  entity: Entity,
  id: string,
  fd: FormData,
): Promise<Record<string, unknown>> {
  switch (entity) {
    case "channel": {
      const name = sanitizeText(fd.get("name"), 120);
      const category = CATEGORY_VALUES.includes(str(fd, "category"))
        ? str(fd, "category")
        : CATEGORIES[0]!.value;
      const quality = QUALITIES.includes(str(fd, "quality") as never) ? str(fd, "quality") : "HD";

      return {
        name,
        slug: slugify(str(fd, "slug")) || slugify(name),
        description: sanitizeText(fd.get("description"), 2000) || null,
        logo: sanitizeUrl(fd.get("logo")) || null,
        poster: sanitizeUrl(fd.get("poster")) || null,
        streamUrl: sanitizeUrl(fd.get("streamUrl")) ?? "",
        fallbackUrl: sanitizeUrl(fd.get("fallbackUrl")) || null,
        country: sanitizeText(fd.get("country"), 80) || null,
        language: sanitizeText(fd.get("language"), 80) || null,
        category,
        quality,
        tags: sanitizeText(fd.get("tags"), 300) || null,
        sortOrder: toInt(fd.get("sortOrder")),
        isActive: toBoolean(fd.get("isActive")),
        isFeatured: toBoolean(fd.get("isFeatured")),
      };
    }

    case "content": {
      const title = sanitizeText(fd.get("title"), 160);
      return {
        title,
        slug: slugify(str(fd, "slug")) || slugify(title),
        originalTitle: sanitizeText(fd.get("originalTitle"), 160) || null,
        type: str(fd, "type") || "movie",
        description: sanitizeText(fd.get("description"), 4000) || null,
        poster: sanitizeUrl(fd.get("poster")) || null,
        videoUrl: sanitizeUrl(fd.get("videoUrl")) || null,
        trailerUrl: sanitizeUrl(fd.get("trailerUrl")) || null,
        year: toInt(fd.get("year")) || null,
        duration: toInt(fd.get("duration")) || null,
        ageRating: sanitizeText(fd.get("ageRating"), 20) || null,
        rating: Math.min(10, Math.max(0, Number(fd.get("rating")) || 0)),
        genres: sanitizeText(fd.get("genres"), 300) || null,
        director: sanitizeText(fd.get("director"), 120) || null,
        cast: sanitizeText(fd.get("cast"), 500) || null,
        sortOrder: toInt(fd.get("sortOrder")),
        isActive: toBoolean(fd.get("isActive")),
        isFeatured: toBoolean(fd.get("isFeatured")),
      };
    }

    case "package": {
      const name = sanitizeText(fd.get("name"), 120);
      // The features control is a single <textarea> (FieldSpec kind "lines"), so
      // the whole newline-separated block arrives as ONE FormData entry. Split it
      // into an array of lines before it is stored in the `jsonb` column.
      const features = splitLines(str(fd, "features")).map((line) => sanitizeText(line, 200));

      return {
        name,
        slug: slugify(str(fd, "slug")) || slugify(name),
        description: sanitizeText(fd.get("description"), 2000) || null,
        image: sanitizeUrl(fd.get("image")) || null,
        price: Math.max(0, Number(fd.get("price")) || 0),
        currency: CURRENCY_CODES.includes(str(fd, "currency")) ? str(fd, "currency") : "EUR",
        durationDays: Math.max(1, toInt(fd.get("durationDays"), 30)),
        durationLabel: sanitizeText(fd.get("durationLabel"), 40) || null,
        // `features` is a `jsonb` array — Prisma stores the array as-is.
        features: features as Prisma.InputJsonValue,
        maxDevices: Math.max(1, toInt(fd.get("maxDevices"), 1)),
        sortOrder: toInt(fd.get("sortOrder")),
        isActive: toBoolean(fd.get("isActive")),
        isPopular: toBoolean(fd.get("isPopular")),
      };
    }

    case "user": {
      const email = str(fd, "email").toLowerCase();
      const password = typeof fd.get("password") === "string" ? String(fd.get("password")) : "";

      const invalid: string[] = [];
      if (validateName(str(fd, "firstName"))) invalid.push("firstName");
      if (validateName(str(fd, "lastName"))) invalid.push("lastName");
      if (validateEmail(email)) invalid.push("email");
      if (!id || password) {
        if (validatePassword(password)) invalid.push("password");
      }
      if (invalid.length > 0) throw new Error(`INVALID_FIELDS:${invalid.join(",")}`);

      return {
        firstName: sanitizeText(fd.get("firstName"), 60),
        lastName: sanitizeText(fd.get("lastName"), 60),
        email,
        phone: sanitizeText(fd.get("phone"), 40) || null,
        role: str(fd, "role") === ROLES.ADMIN ? ROLES.ADMIN : ROLES.USER,
        isActive: toBoolean(fd.get("isActive")),
        ...(password ? { password: await hashPassword(password) } : {}),
      };
    }

    case "language":
      return {
        code: str(fd, "code").toLowerCase().slice(0, 8),
        name: sanitizeText(fd.get("name"), 60),
        nativeName: sanitizeText(fd.get("nativeName"), 60),
        dir: str(fd, "dir") === "rtl" ? "rtl" : "ltr",
        sortOrder: toInt(fd.get("sortOrder")),
        isDefault: toBoolean(fd.get("isDefault")),
        isActive: toBoolean(fd.get("isActive")),
      };
  }
}

async function createEntity(
  entity: Entity,
  data: Record<string, unknown>,
  channelIds: string[],
): Promise<void> {
  if (entity === "package") {
    const created = await prisma.package.create({ data: data as never });
    if (channelIds.length > 0) {
      await prisma.packageChannel.createMany({
        data: channelIds.map((channelId) => ({ packageId: created.id, channelId })),
      });
    }
    return;
  }
  await (prisma[entity] as { create: (a: unknown) => Promise<unknown> }).create({
    data,
    select: { id: true },
  });
}

async function updateEntity(
  entity: Entity,
  id: string,
  data: Record<string, unknown>,
  channelIds: string[],
): Promise<void> {
  await (prisma[entity] as { update: (a: unknown) => Promise<unknown> }).update({
    where: { id },
    data,
  });

  if (entity === "package") {
    await prisma.$transaction([
      prisma.packageChannel.deleteMany({ where: { packageId: id } }),
      ...(channelIds.length > 0
        ? [
            prisma.packageChannel.createMany({
              data: channelIds.map((channelId) => ({ packageId: id, channelId })),
            }),
          ]
        : []),
    ]);
  }
}

/** Create or update one catalogue row. Validation happens in buildEntityData. */
export async function saveEntityAction(fd: FormData): Promise<void> {
  const admin = await requireAdmin();
  const entity = str(fd, "entity");
  assertEntity(entity);

  const id = str(fd, "id");
  const channelIds = fd
    .getAll("channelIds")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);

  const data = await buildEntityData(entity, id, fd);

  if (id) await updateEntity(entity, id, data, channelIds);
  else await createEntity(entity, data, channelIds);

  await audit({
    userId: admin.id,
    actorName: admin.email,
    action: id ? `admin.${entity}.update` : `admin.${entity}.create`,
    entity,
    entityId: id || null,
  });

  revalidatePath(`/admin/${entity}s`);
  revalidatePath(`/admin/${entity}`);
  revalidatePath("/");
}

/** Delete a row. Related rows cascade according to the Prisma schema. */
export async function deleteEntityAction(fd: FormData): Promise<void> {
  const admin = await requireAdmin();
  const entity = str(fd, "entity");
  const id = str(fd, "id");
  assertEntity(entity);
  if (!id) throw new Error("MISSING_ID");

  // Never let an admin lock themselves out.
  if (entity === "user" && id === admin.id) throw new Error("CANNOT_DELETE_SELF");

  await (prisma[entity] as { delete: (a: unknown) => Promise<unknown> }).delete({ where: { id } });

  await audit({
    userId: admin.id,
    actorName: admin.email,
    action: `admin.${entity}.delete`,
    entity,
    entityId: id,
  });

  revalidatePath(`/admin/${entity}s`);
  revalidatePath("/");
}

/* ------------------------------------------------------------------ */
/* Support tickets                                                    */
/* ------------------------------------------------------------------ */

/** Reply to a ticket and/or move it through the workflow. */
export async function updateTicketAction(fd: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const status = TICKET_STATUS[(str(fd, "status") as keyof typeof TICKET_STATUS) ?? "open"] ?? "open";
  const reply = sanitizeText(fd.get("reply"), 4000);

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!ticket) throw new Error("TICKET_NOT_FOUND");

  await prisma.supportTicket.update({
    where: { id },
    data: {
      status,
      ...(reply ? { reply, repliedAt: new Date() } : {}),
    },
  });

  await audit({
    userId: admin.id,
    actorName: admin.email,
    action: "admin.ticket.update",
    entity: "SupportTicket",
    entityId: id,
    meta: { status },
  });

  revalidatePath("/admin/support");
}

/** Mark a pending payment as received and activate the subscription. */
export async function markPaymentPaidAction(fd: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = str(fd, "id");

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!payment) throw new Error("PAYMENT_NOT_FOUND");

  await completePayment(id);

  await audit({
    userId: admin.id,
    actorName: admin.email,
    action: "admin.payment.complete",
    entity: "Payment",
    entityId: id,
    meta: { previousStatus: payment.status },
  });

  revalidatePath("/admin/payments");
}
