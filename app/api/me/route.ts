import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/entitlements";

/**
 * GET /api/me — the session bootstrap endpoint used by `SiteProvider` and by
 * any future native app. Returns only non-sensitive fields.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });

  const subscription = await getActiveSubscription(user.id);

  return NextResponse.json({
    user,
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          package: {
            id: subscription.package.id,
            name: subscription.package.name,
            slug: subscription.package.slug,
          },
        }
      : null,
  });
}