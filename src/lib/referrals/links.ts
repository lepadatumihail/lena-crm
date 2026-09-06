import { SITE_URL } from "@/lib/site";
import type { Enums, Referral } from "@/lib/supabase/types";

/**
 * Referral links. Every agent gets one permanent code at signup
 * (profiles.referral_code, generated in the database with the same
 * alphabet). /join/[code] records who referred whom; the reward fires only
 * when the referred agent pays their second invoice.
 */

/** Crockford base32: no I, L, O, U, so codes survive being read out loud. */
export const REFERRAL_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const REFERRAL_CODE_LENGTH = 8;

/** Set by /join/[code]/accept, read once by /join/claim after sign-in. */
export const REFERRAL_COOKIE = "lw_ref";
export const REFERRAL_COOKIE_MAX_AGE = 30 * 60;

/** Uppercase, strip separators, and forgive the classic look-alikes. */
export function normalizeReferralCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
}

export function isValidReferralCode(code: string): boolean {
  return new RegExp(`^[${REFERRAL_CODE_ALPHABET}]{${REFERRAL_CODE_LENGTH}}$`).test(code);
}

/** "ABCD-EFGH" for display; the bare code is what URLs and the DB use. */
export function formatReferralCode(code: string): string {
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

export function joinPath(code: string): string {
  return `/join/${code}`;
}

export function referralUrl(code: string): string {
  return `${SITE_URL}${joinPath(code)}`;
}

export type ReferralStatus = Enums<"referral_status">;

/** What the referrer sees for each agent they brought in. */
export type ReferralState = "signed_up" | "subscribed" | "rewarded" | "left";

/**
 * `qualified` only exists for an instant inside record_paid_invoice (it is
 * replaced by `rewarded` in the same transaction), so it reads as subscribed.
 */
export function referralState(
  referral: Pick<Referral, "status" | "paid_invoice_count">,
): ReferralState {
  switch (referral.status) {
    case "rewarded":
      return "rewarded";
    case "void":
      return "left";
    default:
      return referral.paid_invoice_count >= 1 ? "subscribed" : "signed_up";
  }
}

/** Badge wording lives in the `referrals` catalog under `state.*`. */
export const REFERRAL_STATE_KEY = {
  signed_up: "state.signed_up",
  subscribed: "state.subscribed",
  rewarded: "state.rewarded",
  left: "state.left",
} as const satisfies Record<ReferralState, string>;

export type ClaimResult =
  | "claimed"
  | "invalid"
  | "self_referral"
  | "already_claimed"
  | "not_eligible";

/** A key in the `referrals` catalog; the page that shows the banner resolves it. */
export type ClaimMessageKey =
  | "claim.claimed"
  | "claim.alreadyClaimed"
  | "claim.notEligible"
  | "claim.selfReferral"
  | "claim.invalid";

export function claimMessage(
  result: string | undefined,
): { tone: "success" | "info" | "error"; key: ClaimMessageKey } | null {
  switch (result) {
    case "claimed":
      return { tone: "success", key: "claim.claimed" };
    case "already_claimed":
      return { tone: "info", key: "claim.alreadyClaimed" };
    case "not_eligible":
      return { tone: "info", key: "claim.notEligible" };
    case "self_referral":
      return { tone: "error", key: "claim.selfReferral" };
    case "invalid":
      return { tone: "error", key: "claim.invalid" };
    default:
      return null;
  }
}
