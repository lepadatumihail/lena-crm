import type { Enums } from "@/lib/supabase/types";

export type SubStatus = Enums<"sub_status">;

/**
 * Stripe subscription statuses → the one column that gates access.
 * We never use Stripe trials (the 7-day trial is a DB flag), so a Stripe
 * "trialing" is treated as active. Unknown or transitional statuses return
 * null so the caller leaves the profile untouched.
 */
export function mapStripeSubscriptionStatus(status: string): SubStatus | null {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return null;
  }
}
