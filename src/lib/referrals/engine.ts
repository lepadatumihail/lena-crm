import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import type { BillingPlan } from "@/lib/billing";
import type { ClaimResult } from "@/lib/referrals/links";
import type { SubStatus } from "@/lib/referrals/stripe-status";
import type { Enums, Profile } from "@/lib/supabase/types";

/**
 * The referral + billing engine. Every function here uses the service-role
 * client and is therefore only ever called from trusted server code: server
 * actions that have checked the caller, route handlers, and the Stripe
 * webhook. Anything atomic lives in the database (the RPCs); this file
 * sequences them.
 */

type Admin = ReturnType<typeof createAdminClient>;

export type Inviter = Pick<Profile, "id" | "full_name" | "email" | "referral_code">;

/** The agent behind a referral code, or null if the code is unknown. */
export async function findInviterByCode(
  code: string,
  admin: Admin = createAdminClient(),
): Promise<Inviter | null> {
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, email, referral_code")
    .eq("referral_code", code)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function claimReferral(code: string, userId: string): Promise<ClaimResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_referral", {
    p_code: code,
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
  return (data as ClaimResult) ?? "invalid";
}

export async function getProfile(userId: string, admin: Admin = createAdminClient()) {
  const { data, error } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function findProfileByStripeCustomer(customerId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function findProfileByEmail(email: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .ilike("email", email)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * A paying agent takes the next Founding number while the cohort of 20 has
 * room. Returns the number (the existing one if already allocated), or null
 * when the cohort is full.
 */
export async function promoteToFounder(userId: string): Promise<number | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("allocate_founding_number", { p_user_id: userId });
  if (error) throw new Error(error.message);
  return data ?? null;
}

export type PaidInvoiceResult = {
  status: Enums<"referral_status"> | "none";
  paid_invoice_count: number;
  rewarded: boolean;
};

/**
 * Count a paid invoice for a referred agent; on the 2nd one both sides get a
 * free month (decided in the database: a balance credit for subscribers,
 * comped Pro time for everyone else). Credits are then pushed to Stripe.
 */
export async function recordPaidInvoice(userId: string): Promise<PaidInvoiceResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("record_paid_invoice", { p_user_id: userId });
  if (error) throw new Error(error.message);
  const raw = (data ?? {}) as Partial<PaidInvoiceResult>;
  const result: PaidInvoiceResult = {
    status: raw.status ?? "none",
    paid_invoice_count: raw.paid_invoice_count ?? 0,
    rewarded: raw.rewarded ?? false,
  };
  if (result.rewarded) {
    const { data: ref } = await admin
      .from("referrals")
      .select("inviter_id, invitee_id")
      .eq("invitee_id", userId)
      .maybeSingle();
    if (ref) {
      await applyPendingCredits(ref.inviter_id, admin);
      await applyPendingCredits(ref.invitee_id, admin);
    }
  }
  return result;
}

export async function voidReferral(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("void_referral", { p_user_id: userId });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export type SubscriptionPatch = {
  stripe_customer_id?: string;
  plan?: BillingPlan | null;
  plan_monthly_eur?: number | null;
};

export async function setSubscriptionStatus(
  userId: string,
  status: SubStatus,
  extra: SubscriptionPatch = {},
) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ subscription_status: status, ...extra })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

/** Comp Pro time from the backend (admin comps, design partners). Returns the new pro_until. */
export async function grantProTime(
  userId: string,
  months: number,
  reason: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("grant_pro_time", {
    p_user_id: userId,
    p_months: months,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
  return data ?? null;
}

/**
 * Push unapplied balance credits to Stripe as customer-balance transactions,
 * so the next invoice drops by one month of the agent's plan per credit.
 * A no-op until Stripe is configured or until the agent has a Stripe
 * customer; the credits stay in the ledger.
 */
export async function applyPendingCredits(
  agentId: string,
  admin: Admin = createAdminClient(),
): Promise<number> {
  const stripe = getStripe();
  if (!stripe) return 0;
  const profile = await getProfile(agentId, admin);
  if (!profile?.stripe_customer_id) return 0;

  const { data: credits } = await admin
    .from("referral_credits")
    .select("*")
    .eq("agent_id", agentId)
    .eq("kind", "stripe_balance")
    .eq("applied_to_stripe", false);

  let applied = 0;
  for (const credit of credits ?? []) {
    const amount = Math.round(Number(credit.amount_eur) * 100);
    if (amount <= 0) continue;
    const txn = await stripe.customers.createBalanceTransaction(profile.stripe_customer_id, {
      amount: -amount,
      currency: "eur",
      description: `LeadWing free month (${credit.reason})`,
    });
    await admin
      .from("referral_credits")
      .update({ applied_to_stripe: true, stripe_balance_txn_id: txn.id })
      .eq("id", credit.id);
    applied++;
  }
  return applied;
}

export async function getFounderCount(admin: Admin = createAdminClient()): Promise<number> {
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .not("founding_number", "is", null);
  return count ?? 0;
}

/** Idempotency gate for webhook deliveries. True = first time we see this event. */
export async function claimStripeEvent(id: string, type: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("stripe_events").insert({ id, type });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw new Error(error.message);
}
