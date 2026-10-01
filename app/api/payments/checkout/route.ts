import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { completePayment, createCheckout, demoGatewayResult, failPayment } from "@/lib/payments";
import { audit, track } from "@/lib/audit";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/payments/checkout
 *
 * Creates a `pending` Payment, asks the (demo) gateway for an authorisation
 * result, then settles the payment and activates the subscription.
 *
 * No card data is persisted: only the gateway reference and the amount end up
 * in the database. Replace the `demoGatewayResult` block with a real provider
 * (Stripe / PayPal / CMI) and call `completePayment` from its webhook route.
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ip = clientIp(request);
  const limit = rateLimit(`checkout:${user.id}:${ip}`, 10, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "errors.tooManyAttempts" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const packageId = typeof body.packageId === "string" ? body.packageId : "";
  const cardNumber = typeof body.cardNumber === "string" ? body.cardNumber : "";
  const method = typeof body.method === "string" ? body.method : "card";
  const holder = typeof body.holder === "string" ? body.holder.trim().slice(0, 80) : "";

  if (!packageId) {
    return NextResponse.json({ errors: { form: "errors.required" } }, { status: 422 });
  }

  if (method === "card" && cardNumber.replace(/\D/g, "").length < 12) {
    return NextResponse.json({ errors: { cardNumber: "errors.required" } }, { status: 422 });
  }

  const pkg = await prisma.package.findFirst({
    where: { id: packageId, isActive: true },
    select: { id: true, name: true, currency: true },
  });
  if (!pkg) {
    return NextResponse.json({ error: "PACKAGE_UNAVAILABLE" }, { status: 404 });
  }

  // Only the last four digits are ever retained, and only as a provider ref.
  const last4 = cardNumber.replace(/\D/g, "").slice(-4);
  const providerRef = method === "card" ? `demo:${last4}` : `manual:${holder || user.email}`;

  let checkout;
  try {
    checkout = await createCheckout({
      userId: user.id,
      packageId: pkg.id,
      currency: pkg.currency,
      provider: process.env.PAYMENT_PROVIDER ?? "manual",
      method,
      providerRef,
    });
  } catch {
    return NextResponse.json({ error: "PACKAGE_UNAVAILABLE" }, { status: 404 });
  }

  const outcome = demoGatewayResult(cardNumber);

  if (outcome === "failed") {
    await failPayment(checkout.paymentId, "Card declined by the gateway");
    await track("subscribe", {
      userId: user.id,
      path: `/checkout/${pkg.id}`,
      meta: { status: "failed" },
      ip,
    });
    return NextResponse.json({ error: "errors.paymentFailed" }, { status: 402 });
  }

  await completePayment(checkout.paymentId);

  const payment = await prisma.payment.findUnique({
    where: { id: checkout.paymentId },
    select: { invoiceNo: true },
  });

  await track("subscribe", {
    userId: user.id,
    path: `/checkout/${pkg.id}`,
    meta: { status: "paid", reference: checkout.reference },
    ip,
  });
  await audit({
    request,
    userId: user.id,
    actorName: user.email,
    action: "payment.checkout",
    entity: "Payment",
    entityId: checkout.paymentId,
    meta: { reference: checkout.reference, package: pkg.name },
  });

  return NextResponse.json({
    ok: true,
    reference: checkout.reference,
    invoice: payment?.invoiceNo ?? "",
    status: "paid",
  });
}