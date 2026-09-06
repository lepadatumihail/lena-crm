import type { Enums } from "@/lib/supabase/types";

/**
 * Prices and plans. Decision record: plans/free-pro-pricing.md.
 *
 * Free is capped at 3 clients (see access.ts). Pro is one product with four
 * Stripe prices, recognised by lookup key. The first FOUNDING_CAP paying
 * agents lock the founding price for life; Stripe keeps a subscription on
 * the price object it started on, so the lock needs no code.
 */
export const FOUNDING_CAP = 20;

export type BillingPlan = Enums<"billing_plan">;
export type BillingTier = "founding" | "standard";
export type BillingInterval = "monthly" | "yearly";

/** EUR before IVA. Yearly ≈ 20% off, rounded so the per-month figure is whole. */
export const PRICES: Record<BillingTier, Record<BillingInterval, number>> = {
  founding: { monthly: 19, yearly: 180 },
  standard: { monthly: 29, yearly: 276 },
};

export const PLAN_IDS: readonly BillingPlan[] = [
  "founding_monthly",
  "founding_yearly",
  "standard_monthly",
  "standard_yearly",
];

export function planId(tier: BillingTier, interval: BillingInterval): BillingPlan {
  return `${tier}_${interval}`;
}

export function planTier(plan: BillingPlan): BillingTier {
  return plan.startsWith("founding") ? "founding" : "standard";
}

export function planInterval(plan: BillingPlan): BillingInterval {
  return plan.endsWith("yearly") ? "yearly" : "monthly";
}

export function isFoundingPlan(plan: BillingPlan | null | undefined): boolean {
  return plan != null && planTier(plan) === "founding";
}

/** The Stripe price's lookup_key is the plan id; anything else is not ours. */
export function planFromLookupKey(key: string | null | undefined): BillingPlan | null {
  return key && (PLAN_IDS as readonly string[]).includes(key) ? (key as BillingPlan) : null;
}

/** What "one free month" is worth on a plan: the monthly price, or a twelfth of the yearly one. */
export function planMonthlyEur(plan: BillingPlan): number {
  const tier = planTier(plan);
  return planInterval(plan) === "monthly"
    ? PRICES[tier].monthly
    : PRICES[tier].yearly / 12;
}

/** "€19/mo" or "€180/yr" */
export function priceLabel(tier: BillingTier, interval: BillingInterval): string {
  return `€${PRICES[tier][interval]}/${interval === "monthly" ? "mo" : "yr"}`;
}

export function planLabel(plan: BillingPlan): string {
  const tier = planTier(plan);
  return `${tier === "founding" ? "Founding" : "Pro"} · ${priceLabel(tier, planInterval(plan))}`;
}

/** Whole-percent saving of yearly over twelve monthly payments. */
export function yearlySavingPct(tier: BillingTier): number {
  const { monthly, yearly } = PRICES[tier];
  return Math.round((1 - yearly / (monthly * 12)) * 100);
}

export function foundingSpotsLeft(founderCount: number): number {
  return Math.max(0, FOUNDING_CAP - founderCount);
}

/** "19 founding spots left" / "1 founding spot left". `bare` drops the word founding. */
export function foundingSpotsLabel(spotsLeft: number, bare = false): string {
  const noun = spotsLeft === 1 ? "spot" : "spots";
  return `${spotsLeft} ${bare ? "" : "founding "}${noun} left`;
}

export function foundingOpen(founderCount: number): boolean {
  return foundingSpotsLeft(founderCount) > 0;
}

/** The tier a new subscriber gets right now. */
export function currentTier(founderCount: number): BillingTier {
  return foundingOpen(founderCount) ? "founding" : "standard";
}

/**
 * Payment Links, one per price. Server-only reads (the pricing page resolves
 * them and hands plain URLs to the client), kept under NEXT_PUBLIC_ for
 * continuity with the existing env files.
 */
export function paymentLink(tier: BillingTier, interval: BillingInterval): string | undefined {
  const links: Record<BillingPlan, string | undefined> = {
    founding_monthly: process.env.NEXT_PUBLIC_STRIPE_LINK_FOUNDING_MONTHLY,
    founding_yearly: process.env.NEXT_PUBLIC_STRIPE_LINK_FOUNDING_YEARLY,
    standard_monthly: process.env.NEXT_PUBLIC_STRIPE_LINK_STANDARD_MONTHLY,
    standard_yearly: process.env.NEXT_PUBLIC_STRIPE_LINK_STANDARD_YEARLY,
  };
  return links[planId(tier, interval)]?.trim() || undefined;
}

/**
 * Payment Links accept these two params, which is how the webhook maps the
 * Stripe customer back to the agent (client_reference_id = auth user id).
 */
export function checkoutUrl(
  link: string | undefined,
  userId: string,
  email?: string | null,
): string | undefined {
  if (!link) return undefined;
  const url = new URL(link);
  url.searchParams.set("client_reference_id", userId);
  if (email) url.searchParams.set("prefilled_email", email);
  return url.toString();
}
