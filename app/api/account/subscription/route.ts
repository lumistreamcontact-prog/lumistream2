import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { SUBSCRIPTION_STATUS } from "@/lib/constants";

/**
 * DELETE /api/account/subscription — cancel the active subscription.
 *
 * The row is kept (status becomes `cancelled`) so billing history stays
 * intact; entitlement checks only ever look at `active` rows, so access is
 * revoked immediately.
 */
export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await prisma.subscription.updateMany({
    where: { userId: user.id, status: SUBSCRIPTION_STATUS.ACTIVE },
    data: { status: SUBSCRIPTION_STATUS.CANCELLED },
  });

  await audit({
    userId: user.id,
    actorName: user.email,
    action: "account.subscription.cancel",
    entity: "Subscription",
    meta: { cancelled: result.count },
  });

  return NextResponse.json({ ok: true, cancelled: result.count });
}