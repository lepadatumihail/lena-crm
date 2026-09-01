import type { Enums, Invite } from "@/lib/supabase/types";

/** Crockford base32: no I, L, O, U, so codes survive being read out loud. */
export const INVITE_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const INVITE_CODE_LENGTH = 8;

/** Set by /join/[code]/accept, read once by /join/claim after sign-in. */
export const INVITE_COOKIE = "lw_invite";
export const INVITE_COOKIE_MAX_AGE = 30 * 60;

export const FOUNDING_CAP = 20;
export const FOUNDING_INVITE_QUOTA = 3;
export const FOUNDING_PRICE_EUR = 19;
export const STANDARD_PRICE_EUR = 29;
/** One free month = one founding-price month, applied as a Stripe credit. */
export const FREE_MONTH_EUR = 19;

export function generateInviteCode(length = INVITE_CODE_LENGTH): string {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let code = "";
  for (const b of bytes) code += INVITE_CODE_ALPHABET[b % INVITE_CODE_ALPHABET.length];
  return code;
}

/** Uppercase, strip separators, and forgive the classic look-alikes. */
export function normalizeInviteCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
}

export function isValidInviteCode(code: string): boolean {
  return new RegExp(`^[${INVITE_CODE_ALPHABET}]{${INVITE_CODE_LENGTH}}$`).test(code);
}

/** "ABCD-EFGH" for display; the bare code is what URLs and the DB use. */
export function formatInviteCode(code: string): string {
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

export function joinPath(code: string): string {
  return `/join/${code}`;
}

export function freeMonthsFromCredit(totalEur: number): number {
  return Math.floor(totalEur / FREE_MONTH_EUR);
}

export type ReferralStatus = Enums<"referral_status">;

export type InviteState =
  | "available"
  | "expired"
  | "revoked"
  | "joined"
  | "qualified"
  | "rewarded"
  | "left";

/** One label per invite, folding the referral's progress into it once redeemed. */
export function inviteState(
  invite: Pick<Invite, "status" | "expires_at">,
  referralStatus: ReferralStatus | null,
  now: Date = new Date()
): InviteState {
  if (invite.status === "revoked") return "revoked";
  if (invite.status === "redeemed") {
    switch (referralStatus) {
      case "qualified":
        return "qualified";
      case "rewarded":
        return "rewarded";
      case "void":
        return "left";
      default:
        return "joined";
    }
  }
  if (invite.status === "expired" || new Date(invite.expires_at).getTime() <= now.getTime())
    return "expired";
  return "available";
}

export const INVITE_STATE_LABEL: Record<InviteState, string> = {
  available: "Available",
  expired: "Expired",
  revoked: "Revoked",
  joined: "Joined",
  qualified: "Qualified",
  rewarded: "Free month earned",
  left: "Left",
};

export type ClaimResult = "claimed" | "invalid" | "self_referral" | "already_claimed";

export function claimMessage(result: string | undefined): { tone: "success" | "info" | "error"; text: string } | null {
  switch (result) {
    case "claimed":
      return {
        tone: "success",
        text: "Your Founding spot is reserved. Subscribe at €19 a month, locked for life, and your three invites unlock.",
      };
    case "already_claimed":
      return { tone: "info", text: "You had already claimed an invite, so nothing changed." };
    case "self_referral":
      return { tone: "error", text: "That was your own invite code. Share it with a colleague instead." };
    case "invalid":
      return { tone: "error", text: "That invite is no longer valid. You can still use LeadWing at the standard plan." };
    default:
      return null;
  }
}
