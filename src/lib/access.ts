import type { Profile } from "@/lib/supabase/types";

/**
 * Single source of truth for "can this agent use the app?".
 *
 * Access model (see plans/invite-referral-spec.md §3-F):
 *   - active                          → in
 *   - past_due                        → in (Stripe dunning grace; locks only once it cancels)
 *   - trialing AND now < trial_ends_at → in
 *   - everything else (expired trial, canceled, none) → HARD paywall at /upgrade
 *
 * Pure and time-injectable so it can be unit-tested without a clock.
 */
export type AccessProfile = Pick<
  Profile,
  "subscription_status" | "trial_ends_at"
>;

export type AccessReason =
  | "trial_expired"
  | "canceled"
  | "no_subscription";

export type AccessState =
  | { ok: true }
  | { ok: false; reason: AccessReason };

export function accessState(
  profile: AccessProfile,
  now: Date = new Date(),
): AccessState {
  switch (profile.subscription_status) {
    case "active":
    case "past_due":
      return { ok: true };
    case "trialing": {
      const ends = profile.trial_ends_at
        ? new Date(profile.trial_ends_at)
        : null;
      if (ends && now.getTime() < ends.getTime()) return { ok: true };
      return { ok: false, reason: "trial_expired" };
    }
    case "canceled":
      return { ok: false, reason: "canceled" };
    case "none":
    default:
      return { ok: false, reason: "no_subscription" };
  }
}

export function hasAccess(profile: AccessProfile, now: Date = new Date()): boolean {
  return accessState(profile, now).ok;
}
