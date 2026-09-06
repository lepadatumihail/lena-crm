import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { claimReferral } from "@/lib/referrals/engine";
import { REFERRAL_COOKIE, type ClaimResult, normalizeReferralCode } from "@/lib/referrals/links";

/** Records the referral cookie for the signed-in user, once, then clears it. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=%2Fjoin%2Fclaim", request.url));
  }

  const clear = (res: NextResponse) => {
    res.cookies.set({ name: REFERRAL_COOKIE, value: "", path: "/", maxAge: 0 });
    return res;
  };

  const code = request.cookies.get(REFERRAL_COOKIE)?.value;
  if (!code) return clear(NextResponse.redirect(new URL("/home", request.url)));

  let result: ClaimResult = "invalid";
  try {
    result = await claimReferral(normalizeReferralCode(code), user.id);
  } catch {
    result = "invalid";
  }
  return clear(NextResponse.redirect(new URL(`/referrals?claimed=${result}`, request.url)));
}
