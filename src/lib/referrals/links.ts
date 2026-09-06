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

export const REFERRAL_STATE_LABEL: Record<ReferralState, string> = {
  signed_up: "Signed up",
  subscribed: "Subscribed",
  rewarded: "Free month earned",
  left: "Left",
};

export type ClaimResult =
  | "claimed"
  | "invalid"
  | "self_referral"
  | "already_claimed"
  | "not_eligible";

export function claimMessage(
  result: string | undefined,
): { tone: "success" | "info" | "error"; text: string } | null {
  switch (result) {
    case "claimed":
      return {
        tone: "success",
        text: "Referral recorded. Once you're on Pro and pay your second month, you and the agent who referred you each get a free month.",
      };
    case "already_claimed":
      return { tone: "info", text: "You had already used a referral link, so nothing changed." };
    case "not_eligible":
      return {
        tone: "info",
        text: "Referral links are for new accounts, so this one didn't apply. You can still share your own link.",
      };
    case "self_referral":
      return {
        tone: "error",
        text: "That's your own referral link. Share it with a colleague instead.",
      };
    case "invalid":
      return {
        tone: "error",
        text: "That referral link isn't valid. You can still use LeadWing — it's free to start.",
      };
    default:
      return null;
  }
}
