import type Stripe from "stripe";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planState, type PlanState } from "@/lib/access";
import { planFromLookupKey, planLabel } from "@/lib/billing";
import { getFounderCount } from "@/lib/referrals/engine";
import { getStripe } from "@/lib/stripe";
import {
  creditApplied,
  subscriptionPhase,
  type InvoiceSnapshot,
  type PaymentMethodSnapshot,
  type SubscriptionSnapshot,
  type UpcomingInvoice,
} from "@/lib/subscription";
import type { Profile, ReferralCredit } from "@/lib/supabase/types";

export type StripeSnapshot = {
  subscription: SubscriptionSnapshot | null;
  paymentMethod: PaymentMethodSnapshot | null;
  /** Customer balance in cents. Negative means credit waiting for the next invoice. */
  balanceCents: number;
  upcoming: UpcomingInvoice | null;
  invoices: InvoiceSnapshot[];
};

export type BillingOverview = {
  email: string;
  profile: Profile | null;
  plan: PlanState;
  planLabel: string | null;
  clientCount: number;
  founderCount: number;
  credits: ReferralCredit[];
  /** Free months earned so far, however they were delivered. */
  monthsEarned: number;
  /** Balance credits not yet pushed to Stripe (no customer yet, or Stripe not configured). */
  unappliedCreditEur: number;
  /** null until the agent has a Stripe customer and Stripe is configured. */
  stripe: StripeSnapshot | null;
  /** Stripe was asked and did not answer; the page falls back to what the profile knows. */
  stripeUnavailable: boolean;
};

/**
 * Everything the signed-in agent's billing page needs. The profile is the
 * source of truth for access (the webhook keeps it current); Stripe is read
 * live for the parts we never store: card, next invoice, invoice history.
 */
export async function getMyBillingOverview(): Promise<BillingOverview> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const [{ data: profile }, { count }, { data: credits }, founderCount] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase
      .from("referral_credits")
      .select("*")
      .eq("agent_id", user.id)
      .order("created_at", { ascending: false }),
    getFounderCount(createAdminClient()),
  ]);

  const stripe = getStripe();
  let snapshot: StripeSnapshot | null = null;
  let stripeUnavailable = false;
  if (stripe && profile?.stripe_customer_id) {
    try {
      snapshot = await loadStripeSnapshot(stripe, profile.stripe_customer_id);
    } catch (err) {
      console.error("billing: could not load the Stripe snapshot", err);
      stripeUnavailable = true;
    }
  }

  const ledger = credits ?? [];
  return {
    email: user.email ?? "",
    profile: profile ?? null,
    plan: planState(profile),
    planLabel: profile?.plan ? planLabel(profile.plan) : null,
    clientCount: count ?? 0,
    founderCount,
    credits: ledger,
    monthsEarned: ledger.reduce((acc, c) => acc + c.months, 0),
    unappliedCreditEur: ledger
      .filter((c) => c.kind === "stripe_balance" && !c.applied_to_stripe)
      .reduce((acc, c) => acc + Number(c.amount_eur), 0),
    stripe: snapshot,
    stripeUnavailable,
  };
}

/** Statuses that still mean "there is a subscription to talk about". */
const LIVE_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "paused", "incomplete"]);

async function loadStripeSnapshot(stripe: Stripe, customerId: string): Promise<StripeSnapshot> {
  const [customer, subscriptions, invoices] = await Promise.all([
    stripe.customers.retrieve(customerId, {
      expand: ["invoice_settings.default_payment_method"],
    }),
    stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
      expand: ["data.default_payment_method"],
    }),
    stripe.invoices.list({ customer: customerId, limit: 24 }),
  ]);

  // Stripe lists newest first: the live subscription if there is one, else the latest ended one.
  const sub =
    subscriptions.data.find((s) => LIVE_STATUSES.has(s.status)) ?? subscriptions.data[0] ?? null;
  const snapshot = sub ? toSubscriptionSnapshot(sub) : null;
  const phase = snapshot ? subscriptionPhase(snapshot) : null;
  const upcoming =
    sub && (phase === "active" || phase === "past_due")
      ? await previewUpcoming(stripe, customerId, sub.id)
      : null;
  const live = isDeleted(customer) ? null : customer;

  return {
    subscription: snapshot,
    paymentMethod: paymentMethodOf(sub, live),
    balanceCents: live?.balance ?? 0,
    upcoming,
    invoices: invoices.data.filter((inv) => inv.status !== "draft").map(toInvoiceSnapshot),
  };
}

function isDeleted(
  customer: Stripe.Customer | Stripe.DeletedCustomer,
): customer is Stripe.DeletedCustomer {
  return (customer as Stripe.DeletedCustomer).deleted === true;
}

const iso = (unix: number) => new Date(unix * 1000).toISOString();
const isoOrNull = (unix: number | null | undefined) => (unix ? iso(unix) : null);

function toSubscriptionSnapshot(sub: Stripe.Subscription): SubscriptionSnapshot {
  const item = sub.items.data[0];
  const price = item?.price;
  const recurring = price?.recurring?.interval;
  const interval: SubscriptionSnapshot["interval"] =
    recurring === "month" ? "month" : recurring === "year" ? "year" : null;
  return {
    id: sub.id,
    status: sub.status,
    plan: planFromLookupKey(price?.lookup_key),
    amountCents: price?.unit_amount ?? null,
    currency: price?.currency ?? "eur",
    interval,
    startedAt: iso(sub.start_date),
    currentPeriodStart: item ? iso(item.current_period_start) : null,
    currentPeriodEnd: item ? iso(item.current_period_end) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    cancelAt: isoOrNull(sub.cancel_at),
    canceledAt: isoOrNull(sub.canceled_at),
    endedAt: isoOrNull(sub.ended_at),
  };
}

/** Stripe returns ids unless the field was expanded; we only want the object. */
function expanded<T extends object>(value: string | T | null | undefined): T | null {
  return value && typeof value === "object" ? value : null;
}

function paymentMethodOf(
  sub: Stripe.Subscription | null,
  customer: Stripe.Customer | null,
): PaymentMethodSnapshot | null {
  const pm =
    expanded(sub?.default_payment_method) ??
    expanded(customer?.invoice_settings.default_payment_method);
  if (!pm) return null;
  return {
    type: pm.type,
    brand: pm.card?.display_brand ?? pm.card?.brand ?? null,
    last4: pm.card?.last4 ?? pm.sepa_debit?.last4 ?? null,
    expMonth: pm.card?.exp_month ?? null,
    expYear: pm.card?.exp_year ?? null,
    email: pm.link?.email ?? pm.paypal?.payer_email ?? null,
  };
}

/**
 * What Stripe will charge next, credits and tax included. Null when there is
 * no upcoming invoice (cancellation scheduled) or the preview fails; the page
 * then shows the plan price instead.
 */
async function previewUpcoming(
  stripe: Stripe,
  customerId: string,
  subscriptionId: string,
): Promise<UpcomingInvoice | null> {
  try {
    const inv = await stripe.invoices.createPreview({
      customer: customerId,
      subscription: subscriptionId,
    });
    return {
      totalCents: inv.total,
      amountDueCents: inv.amount_due,
      taxCents: (inv.total_taxes ?? []).reduce((acc, tax) => acc + tax.amount, 0),
      creditAppliedCents: creditApplied(inv.total, inv.starting_balance),
      currency: inv.currency,
    };
  } catch (err) {
    console.warn("billing: no upcoming invoice preview", err instanceof Error ? err.message : err);
    return null;
  }
}

function toInvoiceSnapshot(inv: Stripe.Invoice): InvoiceSnapshot {
  const line = inv.lines.data[0];
  return {
    id: inv.id,
    number: inv.number,
    createdAt: iso(inv.created),
    status: inv.status,
    totalCents: inv.total,
    amountPaidCents: inv.amount_paid,
    amountDueCents: inv.amount_due,
    currency: inv.currency,
    hostedUrl: inv.hosted_invoice_url ?? null,
    pdfUrl: inv.invoice_pdf ?? null,
    periodStart: line ? iso(line.period.start) : null,
    periodEnd: line ? iso(line.period.end) : null,
  };
}
