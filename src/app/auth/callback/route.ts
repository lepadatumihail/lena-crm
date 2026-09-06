import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { localeCookieOptions } from "@/i18n/cookie";

function safeNext(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/home";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await adoptProfileLocale(supabase, data.user?.id);
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      const base =
        !isLocalEnv && forwardedHost ? `https://${forwardedHost}` : origin;
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

/** A device without the language cookie takes the language saved on the profile. */
async function adoptProfileLocale(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | undefined
) {
  if (!userId) return;
  const { data } = await supabase
    .from("profiles")
    .select("locale")
    .eq("id", userId)
    .maybeSingle();
  const locale = data?.locale;
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, localeCookieOptions());
}
