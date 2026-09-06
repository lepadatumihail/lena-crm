import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { findInviterByCode } from "@/lib/referrals/engine";
import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE,
  isValidReferralCode,
  normalizeReferralCode,
} from "@/lib/referrals/links";

/**
 * Stores the referral code in an httpOnly cookie that survives the sign-in
 * round-trip (Google OAuth or the email code), then sends the visitor to
 * sign in. /join/claim records it afterwards. The cookie is only a pointer:
 * the code is re-validated against the database at claim time.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: raw } = await params;
  const code = normalizeReferralCode(decodeURIComponent(raw));
  const valid = isValidReferralCode(code) && (await findInviterByCode(code)) !== null;
  if (!valid) {
    return NextResponse.redirect(new URL(`/join/${encodeURIComponent(code || raw)}`, request.url));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const destination = user ? "/join/claim" : "/login?next=%2Fjoin%2Fclaim";
  const res = NextResponse.redirect(new URL(destination, request.url));
  res.cookies.set({
    name: REFERRAL_COOKIE,
    value: code,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFERRAL_COOKIE_MAX_AGE,
  });
  return res;
}
