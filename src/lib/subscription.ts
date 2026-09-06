import type { BillingPlan } from "@/lib/billing";

/**
 * Pure helpers for the billing page: what Stripe and the profile know,
 * turned into labels. No I/O here, so all of it is unit-tested. The
 * snapshots are built by src/lib/data/billing.ts from live Stripe objects.
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

export type BadgeTone = "default" | "secondary" | "outline" | "success" | "warning" | "destructive";

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

export const PHASE_BADGE: Record<SubscriptionPhase, { label: string; tone: BadgeTone }> = {
  active: { label: "Active", tone: "success" },
  past_due: { label: "Payment past due", tone: "warning" },
  ending: { label: "Ending", tone: "warning" },
  canceled: { label: "Canceled", tone: "outline" },
  incomplete: { label: "Incomplete", tone: "secondary" },
};

export function invoiceStatusBadge(status: string | null): { label: string; tone: BadgeTone } {
  switch (status) {
    case "paid":
      return { label: "Paid", tone: "success" };
    case "open":
      return { label: "Due", tone: "warning" };
    case "void":
      return { label: "Void", tone: "outline" };
    case "uncollectible":
      return { label: "Unpaid", tone: "destructive" };
    case "draft":
      return { label: "Draft", tone: "secondary" };
    default:
      return { label: "—", tone: "outline" };
  }
}

/** "€19" for whole amounts, "€22.99" otherwise. Stripe amounts are in cents. */
export function formatMoney(cents: number, currency = "eur"): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}

/** "6 Oct 2026" */
export function formatBillingDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "6 Sep – 6 Oct 2026", dropping the first year when both dates share it. */
export function formatPeriod(startIso: string | null, endIso: string | null): string | null {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString(
    "en-GB",
    sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" },
  );
  return `${startLabel} – ${formatBillingDate(endIso)}`;
}

/** "per month" / "per year" */
export function intervalLabel(interval: "month" | "year" | null): string | null {
  return interval === "month" ? "per month" : interval === "year" ? "per year" : null;
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
export function paymentMethodLabel(pm: PaymentMethodSnapshot): {
  title: string;
  detail: string | null;
} {
  switch (pm.type) {
    case "card": {
      const brand = pm.brand ? (CARD_BRANDS[pm.brand] ?? titleCase(pm.brand)) : "Card";
      return {
        title: pm.last4 ? `${brand} ending ${pm.last4}` : brand,
        detail:
          pm.expMonth && pm.expYear
            ? `Expires ${String(pm.expMonth).padStart(2, "0")}/${pm.expYear}`
            : null,
      };
    }
    case "sepa_debit":
      return {
        title: pm.last4 ? `SEPA direct debit ending ${pm.last4}` : "SEPA direct debit",
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
