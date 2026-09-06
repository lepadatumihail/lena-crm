"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  grantProTime,
  promoteToFounder,
  recordPaidInvoice,
  setSubscriptionStatus,
  voidReferral,
} from "@/lib/referrals/engine";
import type { SubStatus } from "@/lib/referrals/stripe-status";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES: SubStatus[] = ["none", "active", "past_due", "canceled"];

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

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/referrals");
  revalidatePath("/pricing");
}

// ---------------- admin ----------------

/**
 * Manual stand-in for the Stripe "invoice.paid" webhook: mark the agent
 * subscribed and count the invoice towards their referrer's reward.
 */
export async function adminRecordPaidInvoice(formData: FormData) {
  await requireAdmin();
  const userId = userIdFrom(formData);
  await setSubscriptionStatus(userId, "active");
  await recordPaidInvoice(userId);
  revalidateAll();
}

/** Hand out a Founding number by hand (a payment recorded outside Stripe). */
export async function adminAllocateFounding(formData: FormData) {
  await requireAdmin();
  await promoteToFounder(userIdFrom(formData));
  revalidateAll();
}

export async function adminSetStatus(formData: FormData) {
  await requireAdmin();
  const userId = userIdFrom(formData);
  const status = String(formData.get("status") ?? "") as SubStatus;
  if (!STATUSES.includes(status)) throw new Error("Invalid status");
  await setSubscriptionStatus(userId, status);
  if (status === "canceled") await voidReferral(userId);
  revalidateAll();
}

/** Comp a month of Pro from the backend: design partners, goodwill, testing. */
export async function adminCompMonth(formData: FormData) {
  await requireAdmin();
  const userId = userIdFrom(formData);
  const months = Math.min(12, Math.max(1, Number(formData.get("months")) || 1));
  await grantProTime(userId, months, "manual_comp");
  revalidateAll();
}
