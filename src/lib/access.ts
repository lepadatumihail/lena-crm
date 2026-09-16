import type { Profile } from "@/lib/supabase/types";

/**
 * Single source of truth for "what can this agent do?".
 *
 * Two tiers, one difference:
 *   Free — up to FREE_CLIENT_LIMIT clients (every row counts, inactive too).
 *   Pro  — unlimited. Reached through a live Stripe subscription (dunning
 *          included: Stripe is still retrying) OR comped Pro time running
 *          (a referral reward or an admin comp, stored as pro_until).
 *
 * Nothing is ever locked or deleted: over the cap, only *adding* a client
 * is blocked. The trigger `clients_enforce_free_limit` mirrors this in the
 * database as the backstop. Pure and time-injectable for tests.
 */
export const FREE_CLIENT_LIMIT = 10;

export type AccessProfile = Pick<Profile, "subscription_status" | "pro_until"> & {
  /** The founder is never capped in their own product. */
  is_admin?: boolean;
};

/** A live Stripe subscription, dunning included. */
export function isSubscribed(profile: AccessProfile): boolean {
  return (
    profile.subscription_status === "active" || profile.subscription_status === "past_due"
  );
}

/** Comped Pro time that has not run out yet. */
export function hasProTime(profile: AccessProfile, now: Date = new Date()): boolean {
  if (!profile.pro_until) return false;
  return new Date(profile.pro_until).getTime() > now.getTime();
}

export function isPro(
  profile: AccessProfile | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!profile) return false;
  return profile.is_admin === true || isSubscribed(profile) || hasProTime(profile, now);
}

/** How many clients this agent may have; null means unlimited. */
export function clientLimit(
  profile: AccessProfile | null | undefined,
  now: Date = new Date(),
): number | null {
  return isPro(profile, now) ? null : FREE_CLIENT_LIMIT;
}

export function canAddClient(
  profile: AccessProfile | null | undefined,
  clientCount: number,
  now: Date = new Date(),
): boolean {
  const limit = clientLimit(profile, now);
  return limit === null || clientCount < limit;
}

export type PlanState = {
  tier: "free" | "pro";
  /** Why they are Pro: a subscription, comped time, being the admin, or neither (Free). */
  source: "subscription" | "comp" | "admin" | null;
  proUntil: string | null;
  limit: number | null;
};

export function planState(
  profile: AccessProfile | null | undefined,
  now: Date = new Date(),
): PlanState {
  if (profile && isSubscribed(profile)) {
    return { tier: "pro", source: "subscription", proUntil: null, limit: null };
  }
  if (profile && hasProTime(profile, now)) {
    return { tier: "pro", source: "comp", proUntil: profile.pro_until, limit: null };
  }
  if (profile?.is_admin) {
    return { tier: "pro", source: "admin", proUntil: null, limit: null };
  }
  return { tier: "free", source: null, proUntil: null, limit: FREE_CLIENT_LIMIT };
}
