import type { BillingPlan, BillingT } from "@/lib/billing";
import type { Tone } from "@/lib/tones";

/**
 * Pure helpers for the billing page: what Stripe and the profile know,
 * turned into labels. No I/O here, so all of it is unit-tested. The
 * snapshots are built by src/lib/data/billing.ts from live Stripe objects.
 *
 * Anything the agent reads takes the `billing` translator (`BillingT`);
 * brand names (Visa, PayPal, SEPA…) stay as they are in every language.
 */

/** A Stripe subscription, flattened to what the page shows. Dates are ISO strings. */
export type SubscriptionSnapshot = {
  id: string;
  /** Stripe's own status string (active, past_due, canceled, …). */
  status: string;
  /** Our plan id from the price's lookup key; null for a price we don't know. */
  plan: BillingPlan | null;
  amountCents: number | null;
  currency: string;
  interval: "month" | "year" | null;
  startedAt: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  canceledAt: string | null;
  endedAt: string | null;
};

export type PaymentMethodSnapshot = {
  /** Stripe payment method type: card, sepa_debit, link, paypal, … */
  type: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  email: string | null;
};

export type InvoiceSnapshot = {
  id: string;
  number: string | null;
  createdAt: string;
  status: string | null;
  totalCents: number;
  amountPaidCents: number;
  amountDueCents: number;
  currency: string;
  hostedUrl: string | null;
  pdfUrl: string | null;
  periodStart: string | null;
  periodEnd: string | null;
};

/** Stripe's preview of the next invoice, credits and tax included. */
export type UpcomingInvoice = {
  totalCents: number;
  amountDueCents: number;
  taxCents: number;
  creditAppliedCents: number;
  currency: string;
};

export type SubscriptionPhase = "active" | "past_due" | "ending" | "canceled" | "incomplete";

/**
 * Where the subscription is in its life. "ending" is still Pro with a
 * cancellation scheduled; "canceled" is over. Stripe's statuses are finer
 * than the page needs.
 */
export function subscriptionPhase(
  sub: Pick<SubscriptionSnapshot, "status" | "cancelAtPeriodEnd" | "cancelAt" | "endedAt">,
): SubscriptionPhase {
  if (sub.status === "canceled" || sub.status === "incomplete_expired" || sub.endedAt) {
    return "canceled";
  }
  if (sub.cancelAtPeriodEnd || sub.cancelAt) return "ending";
  if (sub.status === "past_due" || sub.status === "unpaid") return "past_due";
  if (sub.status === "active" || sub.status === "trialing") return "active";
  return "incomplete";
}

/** When a scheduled or completed cancellation takes (or took) effect. */
export function subscriptionEndsOn(
  sub: Pick<
    SubscriptionSnapshot,
    "cancelAt" | "cancelAtPeriodEnd" | "currentPeriodEnd" | "endedAt" | "canceledAt"
  >,
): string | null {
  return (
    sub.endedAt ??
    sub.cancelAt ??
    (sub.cancelAtPeriodEnd ? sub.currentPeriodEnd : null) ??
    sub.canceledAt ??
    null
  );
}

const PHASE_TONE: Record<SubscriptionPhase, Tone> = {
  active: "green",
  past_due: "amber",
  ending: "amber",
  canceled: "neutral",
  incomplete: "neutral",
};

/** The subscription's phase as a tag: its label and tone. */
export function phaseTag(
  t: BillingT,
  phase: SubscriptionPhase,
): { label: string; tone: Tone } {
  return { label: t(`phase.${phase}`), tone: PHASE_TONE[phase] };
}

/** A Stripe invoice status as a tag: its label and tone. */
export function invoiceStatusTag(
  t: BillingT,
  status: string | null,
): { label: string; tone: Tone } {
  switch (status) {
    case "paid":
      return { label: t("invoiceStatus.paid"), tone: "green" };
    case "open":
      return { label: t("invoiceStatus.open"), tone: "amber" };
    case "void":
      return { label: t("invoiceStatus.void"), tone: "neutral" };
    case "uncollectible":
      return { label: t("invoiceStatus.uncollectible"), tone: "red" };
    case "draft":
      return { label: t("invoiceStatus.draft"), tone: "neutral" };
    default:
      return { label: t("invoiceStatus.unknown"), tone: "neutral" };
  }
}

/** "€19" for whole amounts, "€22.99" otherwise. Stripe amounts are in cents. */
export function formatMoney(cents: number, currency = "eur", locale = "en-GB"): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}

/** "6 Oct 2026" */
export function formatBillingDate(
  iso: string | null | undefined,
  locale = "en-GB"
): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "6 Sep – 6 Oct 2026", dropping the first year when both dates share it. */
export function formatPeriod(
  startIso: string | null,
  endIso: string | null,
  locale = "en-GB"
): string | null {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString(
    locale,
    sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" },
  );
  return `${startLabel} – ${formatBillingDate(endIso, locale)}`;
}

const CARD_BRANDS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unionpay: "UnionPay",
  cartes_bancaires: "Cartes Bancaires",
  eftpos_au: "eftpos",
};

function titleCase(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** "Visa ending 4242" + "Expires 04/2028"; SEPA, Link and PayPal get their own wording. */
export function paymentMethodLabel(
  t: BillingT,
  pm: PaymentMethodSnapshot,
): {
  title: string;
  detail: string | null;
} {
  switch (pm.type) {
    case "card": {
      const brand = pm.brand ? (CARD_BRANDS[pm.brand] ?? titleCase(pm.brand)) : t("method.card");
      return {
        title: pm.last4 ? t("method.cardEnding", { brand, last4: pm.last4 }) : brand,
        detail:
          pm.expMonth && pm.expYear
            ? t("method.expires", {
                month: String(pm.expMonth).padStart(2, "0"),
                year: String(pm.expYear),
              })
            : null,
      };
    }
    case "sepa_debit":
      return {
        title: pm.last4 ? t("method.sepaEnding", { last4: pm.last4 }) : t("method.sepa"),
        detail: null,
      };
    case "link":
      return { title: "Link", detail: pm.email };
    case "paypal":
      return { title: "PayPal", detail: pm.email };
    default:
      return { title: titleCase(pm.type), detail: null };
  }
}

/**
 * How much of a customer-balance credit lands on an invoice of this total.
 * Stripe keeps the balance negative while the customer is in credit.
 */
export function creditApplied(totalCents: number, startingBalanceCents: number): number {
  if (startingBalanceCents >= 0 || totalCents <= 0) return 0;
  return Math.min(-startingBalanceCents, totalCents);
}
