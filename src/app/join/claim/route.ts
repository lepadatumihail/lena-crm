import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { claimInvite } from "@/lib/referrals/engine";
import { INVITE_COOKIE, type ClaimResult, normalizeInviteCode } from "@/lib/invites";

/** Redeems the invite cookie for the signed-in user, once, then clears it. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=%2Fjoin%2Fclaim", request.url));
  }

  const clear = (res: NextResponse) => {
    res.cookies.set({ name: INVITE_COOKIE, value: "", path: "/", maxAge: 0 });
    return res;
  };

  const code = request.cookies.get(INVITE_COOKIE)?.value;
  if (!code) return clear(NextResponse.redirect(new URL("/home", request.url)));

  let result: ClaimResult = "invalid";
  try {
    result = await claimInvite(normalizeInviteCode(code), user.id);
  } catch {
    result = "invalid";
  }
  return clear(NextResponse.redirect(new URL(`/invites?claimed=${result}`, request.url)));
}
