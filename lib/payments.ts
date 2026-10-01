import { prisma } from "./prisma";
import {
  PAYMENT_STATUS,
  SUBSCRIPTION_STATUS,
  type PaymentStatus,
} from "./constants";
import { addDays, generateReference } from "./utils";

export interface CheckoutInput {
  userId: string;
  packageId: string;
  currency: string;
  /** Opaque blob from the gateway (e.g. Stripe PaymentIntent id). Never card data. */
  providerRef?: string | null;
  provider?: string;
  method?: string;
}

export interface CheckoutResult {
  paymentId: string;
  reference: string;
  status: PaymentStatus;
}

/**
 * Creates a `pending` Payment row. No card data is ever persisted here — the
 * browser collects payment details directly with the gateway and only the
 * resulting token/reference reaches this function.
 */
export async function createCheckout(
  input: CheckoutInput,
): Promise<CheckoutResult> {
  const pkg = await prisma.package.findUnique({
    where: { id: input.packageId },
    select: { id: true, price: true, currency: true, durationDays: true, isActive: true },
  });
  if (!pkg || !pkg.isActive) throw new Error("PACKAGE_UNAVAILABLE");

  const reference = generateReference("PAY");
  const payment = await prisma.payment.create({
    data: {
      reference,
      userId: input.userId,
      packageId: pkg.id,
      amount: pkg.price,
      currency: input.currency || pkg.currency,
      status: PAYMENT_STATUS.PENDING,
      provider: input.provider ?? process.env.PAYMENT_PROVIDER ?? "manual",
      providerRef: input.providerRef ?? null,
      method: input.method ?? null,
      invoiceNo: `INV-${Date.now().toString(36).toUpperCase()}`,
    },
    select: { id: true, reference: true, status: true },
  });

  return {
    paymentId: payment.id,
    reference: payment.reference,
    status: payment.status as PaymentStatus,
  };
}

/**
 * Marks a payment as paid and activates the subscription in one transaction.
 * Safe to call twice (idempotent) — gateway webhooks may retry.
 */
export async function completePayment(paymentId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { package: { select: { durationDays: true } } },
    });
    if (!payment) throw new Error("PAYMENT_NOT_FOUND");
    if (payment.status === PAYMENT_STATUS.PAID) return; // idempotent

    const now = new Date();
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: PAYMENT_STATUS.PAID, paidAt: now },
    });

    // A user holds one active subscription at a time; extending stacks on the
    // remaining time if one is still running.
    const existing = await tx.subscription.findFirst({
      where: { userId: payment.userId, status: SUBSCRIPTION_STATUS.ACTIVE },
      orderBy: { endDate: "desc" },
    });

    const base =
      existing?.endDate && existing.endDate > now ? existing.endDate : now;

    await tx.subscription.create({
      data: {
        userId: payment.userId,
        packageId: payment.packageId,
        paymentId: payment.id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startDate: existing?.startDate ?? now,
        endDate: addDays(base, payment.package.durationDays),
      },
    });

    // Cancel any other running subscriptions so entitlement stays unambiguous.
    await tx.subscription.updateMany({
      where: {
        userId: payment.userId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        id: existing ? { not: existing.id } : undefined,
      },
      data: { status: SUBSCRIPTION_STATUS.CANCELLED },
    });
  });
}

export async function failPayment(
  paymentId: string,
  reason: string,
): Promise<void> {
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: PAYMENT_STATUS.FAILED, failureReason: reason.slice(0, 255) },
  });
}

/**
 * Dev/demo gateway: simulates an authorisation result. Replace with a real
 * provider (Stripe/PayPal/CMI) by posting to the provider and calling
 * `completePayment` from the provider's webhook route.
 */
export function demoGatewayResult(cardNumber: string): "paid" | "failed" {
  const digits = (cardNumber || "").replace(/\D/g, "");
  if (digits.length < 12) return "failed";
  // Deterministic rule so the demo is testable: cards ending 0002 decline.
  return digits.endsWith("0002") ? "failed" : "paid";
}