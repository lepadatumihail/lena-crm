"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createInvitesForAgent,
  getProfile,
  mintInvites,
  promoteToFounder,
  recordPaidInvoice,
  setSubscriptionStatus,
  voidReferral,
} from "@/lib/referrals/engine";
import type { SubStatus } from "@/lib/referrals/stripe-status";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES: SubStatus[] = ["none", "trialing", "active", "past_due", "canceled"];

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

/** The founder. Checked against the caller's own profile row, never a form field. */
async function requireAdmin() {
  const user = await requireUser();
  const { data } = await createAdminClient()
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!data?.is_admin) throw new Error("Not authorized");
  return user;
}

function userIdFrom(formData: FormData): string {
  const id = String(formData.get("userId") ?? "");
  if (!UUID.test(id)) throw new Error("Invalid user id");
  return id;
}

/** Founding agents mint their remaining codes themselves. */
export async function createMyInviteCodes() {
  const user = await requireUser();
  await createInvitesForAgent(user.id);
  revalidatePath("/invites");
}

// ---------------- admin ----------------

export async function adminSeedInvites(formData: FormData) {
  await requireAdmin();
  const count = Math.min(20, Math.max(1, Number(formData.get("count")) || 1));
  const note = String(formData.get("note") ?? "").trim().slice(0, 120) || null;
  await mintInvites({ inviterId: null, count, note });
  revalidatePath("/admin");
}

/**
 * Manual stand-in for the Stripe "invoice.paid" webhook: mark the agent
 * paying, allocate a Founding number if they were invited, count the invoice
 * towards the referral reward.
 */
export async function adminRecordPaidInvoice(formData: FormData) {
  await requireAdmin();
  const userId = userIdFrom(formData);
  await setSubscriptionStatus(userId, "active");
  const profile = await getProfile(userId);
  if (profile?.founding_intent && profile.founding_number == null) {
    await promoteToFounder(userId);
  }
  await recordPaidInvoice(userId);
  revalidatePath("/admin");
  revalidatePath("/invites");
}

export async function adminAllocateFounding(formData: FormData) {
  await requireAdmin();
  await promoteToFounder(userIdFrom(formData));
  revalidatePath("/admin");
  revalidatePath("/invites");
}

export async function adminSetStatus(formData: FormData) {
  await requireAdmin();
  const userId = userIdFrom(formData);
  const status = String(formData.get("status") ?? "") as SubStatus;
  if (!STATUSES.includes(status)) throw new Error("Invalid status");
  await setSubscriptionStatus(userId, status);
  if (status === "canceled") await voidReferral(userId);
  revalidatePath("/admin");
}

export async function adminRevokeInvite(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("inviteId") ?? "");
  if (!UUID.test(id)) throw new Error("Invalid invite id");
  await createAdminClient()
    .from("invites")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("status", "active");
  revalidatePath("/admin");
}
