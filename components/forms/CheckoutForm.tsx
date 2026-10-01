"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Primitives";
import { formatPrice } from "@/lib/utils";

export interface CheckoutFormProps {
  packageId: string;
  packageName: string;
  packageSlug: string;
  price: number;
  currency: string;
  channelCount: number;
  durationDays: number;
  durationLabel: string | null;
  maxDevices: number;
}

/**
 * Checkout for the demo gateway.
 *
 * Card details travel straight to the payment endpoint and are never persisted —
 * only the resulting Payment reference reaches the database. Swap the body of
 * `POST /api/payments/checkout` for a Stripe PaymentIntent in production.
 */
export function CheckoutForm(props: CheckoutFormProps) {
  const { t, locale } = useSite();
  const router = useRouter();

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [holder, setHolder] = useState("");
  const [method, setMethod] = useState("card");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ ok: boolean; reference: string; invoice: string } | null>(
    null,
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: props.packageId,
          cardNumber,
          expiry,
          cvc,
          holder,
          method,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        reference?: string;
        invoice?: string;
        errors?: Record<string, string>;
      };

      if (!res.ok) {
        setErrors(data.errors ?? { form: data.error ?? "errors.paymentFailed" });
        return;
      }

      setDone({ ok: true, reference: data.reference ?? "", invoice: data.invoice ?? "" });
      router.refresh();
    } catch {
      setErrors({ form: "errors.network" });
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    if (!done.ok) {
      return (
        <div className="space-y-4 text-center">
          <Alert tone="danger" title={t("subscribe.failedTitle")}>
            {t("subscribe.failedText")}
          </Alert>
          <Button onClick={() => setDone(null)} variant="secondary" fullWidth>
            {t("subscribe.tryAgain")}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-5 text-center">
        <Alert tone="ok" title={t("subscribe.successTitle")}>
          {t("subscribe.successText")}
        </Alert>

        <dl className="surface-card space-y-2 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{t("subscribe.reference")}</dt>
            <dd className="font-medium" dir="ltr">
              {done.reference}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{t("subscribe.invoice")}</dt>
            <dd className="font-medium" dir="ltr">
              {done.invoice}
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => router.push("/channels")} fullWidth>
            {t("subscribe.startWatching")}
          </Button>
          <Link
            href="/account"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-line text-sm font-medium text-muted transition-colors hover:border-brand hover:text-brand"
          >
            {t("account.title")}
          </Link>
        </div>
      </div>
    );
  }
return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {errors.form && <Alert tone="danger">{t(errors.form)}</Alert>}

      <Field label={t("subscribe.paymentMethod")} htmlFor="method">
        <Select id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="card">{t("subscribe.card")}</option>
          <option value="transfer">{t("support.emailUs")}</option>
        </Select>
      </Field>

      <Field label={t("support.name")} htmlFor="holder">
        <Input
          id="holder"
          autoComplete="cc-name"
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
          placeholder={t("support.name")}
        />
      </Field>

      <Field
        label={t("subscribe.card")}
        htmlFor="cardNumber"
        error={errors.cardNumber ? t(errors.cardNumber) : undefined}
      >
        <Input
          id="cardNumber"
          inputMode="numeric"
          autoComplete="cc-number"
          dir="ltr"
          required
          placeholder="4242 4242 4242 4242"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          invalid={Boolean(errors.cardNumber)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="MM/YY" htmlFor="expiry">
          <Input
            id="expiry"
            inputMode="numeric"
            autoComplete="cc-exp"
            dir="ltr"
            placeholder="12/28"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </Field>
        <Field label="CVC" htmlFor="cvc">
          <Input
            id="cvc"
            inputMode="numeric"
            autoComplete="cc-csc"
            dir="ltr"
            placeholder="123"
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
          />
        </Field>
      </div>

      <dl className="surface-card space-y-2 p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">{t("subscribe.plan")}</dt>
          <dd className="font-medium">{props.packageName}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">{t("packages.duration")}</dt>
          <dd className="font-medium">{props.durationLabel ?? props.durationDays}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">{t("packages.channelsIncluded")}</dt>
          <dd className="font-medium">{props.channelCount}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">{t("admin.maxDevices")}</dt>
          <dd className="font-medium">{props.maxDevices}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-2 text-base">
          <dt className="font-semibold">{t("subscribe.amount")}</dt>
          <dd className="text-gradient text-lg font-black">
            {formatPrice(props.price, props.currency, locale)}
          </dd>
        </div>
      </dl>

      <Button type="submit" fullWidth size="lg" loading={loading}>
        {loading ? t("subscribe.processing") : t("subscribe.payNow")}
      </Button>

      <p className="text-center text-xs leading-relaxed text-faint">{t("subscribe.secureNote")}</p>
    </form>
  );
}