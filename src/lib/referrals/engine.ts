import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import {
  type ClaimResult,
  generateInviteCode,
} from "@/lib/invites";
import type { Enums, Invite, Profile } from "@/lib/supabase/types";
import type { SubStatus } from "@/lib/referrals/stripe-status";

/**
 * The referral engine. Every function here uses the service-role client and
 * is therefore only ever called from trusted server code: server actions
 * that have checked the caller, route handlers, and the Stripe webhook.
 * Anything atomic lives in the database (the RPCs); this file sequences them.
 */

type Admin = ReturnType<typeof createAdminClient>;

export type ActiveInvite = {
  invite: Invite;
  inviter: Pick<Profile, "id" | "full_name" | "email"> | null;
};

export async function findActiveInvite(code: string): Promise<ActiveInvite | null> {
  const admin = createAdminClient();
  const { data: invite, error } = await admin
    .from("invites")
    .select("*")
    .eq("code", code)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error || !invite) return null;

  let inviter: ActiveInvite["inviter"] = null;
  if (invite.inviter_id) {
    const { data } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", invite.inviter_id)
      .maybeSingle();
    inviter = data ?? null;
  }
  return { invite, inviter };
}

export async function claimInvite(code: string, userId: string): Promise<ClaimResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_founding_invite", {
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

/** Mint codes. inviterId null = founder seed (no quota). Retries on code collision. */
export async function mintInvites(opts: {
  inviterId: string | null;
  count: number;
  note?: string | null;
  admin?: Admin;
}): Promise<Invite[]> {
  const admin = opts.admin ?? createAdminClient();
  const minted: Invite[] = [];
  for (let i = 0; i < opts.count; i++) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await admin
        .from("invites")
        .insert({ code: generateInviteCode(), inviter_id: opts.inviterId, note: opts.note ?? null })
        .select("*")
        .single();
      if (!error && data) {
        minted.push(data);
        break;
      }
      if (error?.code !== "23505") throw new Error(error?.message ?? "Could not create invite");
    }
  }
  return minted;
}

export async function inviteQuota(userId: string, admin: Admin = createAdminClient()) {
  const [{ data: profile }, { count }] = await Promise.all([
    admin.from("profiles").select("invite_quota").eq("id", userId).maybeSingle(),
    admin.from("invites").select("id", { count: "exact", head: true }).eq("inviter_id", userId),
  ]);
  const quota = profile?.invite_quota ?? 0;
  const used = count ?? 0;
  return { quota, used, remaining: Math.max(0, quota - used) };
}

/** Mint whatever the agent's quota still allows. */
export async function createInvitesForAgent(userId: string, note?: string): Promise<Invite[]> {
  const admin = createAdminClient();
  const { remaining } = await inviteQuota(userId, admin);
  if (remaining <= 0) return [];
  return mintInvites({ inviterId: userId, count: remaining, note: note ?? null, admin });
}

/**
 * First payment by someone with founding intent: take a Founding number if
 * the cohort of 20 still has room, then hand out their three codes.
 * Returns the number, or null when the cohort is full or already allocated.
 */
export async function promoteToFounder(userId: string): Promise<number | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("allocate_founding_number", { p_user_id: userId });
  if (error) throw new Error(error.message);
  const number = data ?? null;
  if (number != null) await createInvitesForAgent(userId, "Founding allocation");
  return number;
}

export type PaidInvoiceResult = {
  status: Enums<"referral_status"> | "none";
  paid_invoice_count: number;
  rewarded: boolean;
};

/** Count a paid invoice for the invitee; on the 2nd one both sides get a free month. */
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

export async function setSubscriptionStatus(
  userId: string,
  status: SubStatus,
  extra: { stripe_customer_id?: string } = {}
) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ subscription_status: status, ...extra })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

/**
 * Push unapplied credits to Stripe as customer-balance transactions, so the
 * next invoice drops by 19 EUR per credit. A no-op until Stripe is configured
 * or until the agent has a Stripe customer; the credits stay in the ledger.
 */
export async function applyPendingCredits(
  agentId: string,
  admin: Admin = createAdminClient()
): Promise<number> {
  const stripe = getStripe();
  if (!stripe) return 0;
  const profile = await getProfile(agentId, admin);
  if (!profile?.stripe_customer_id) return 0;

  const { data: credits } = await admin
    .from("referral_credits")
    .select("*")
    .eq("agent_id", agentId)
    .eq("applied_to_stripe", false);

  let applied = 0;
  for (const credit of credits ?? []) {
    const txn = await stripe.customers.createBalanceTransaction(profile.stripe_customer_id, {
      amount: -Math.round(Number(credit.amount_eur) * 100),
      currency: "eur",
      description: `LeadWing referral credit (${credit.reason})`,
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
