import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { asJson, parseSignupSource, type SignupSource } from "@/lib/signup-source";
import { recordSiteEvent } from "@/lib/site-events-server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { localeCookieOptions } from "@/i18n/cookie";

/** A profile this young was made by the sign-in that is finishing now. */
const NEW_PROFILE_MS = 10 * 60 * 1000;
const newProfileSince = () => new Date(Date.now() - NEW_PROFILE_MS).toISOString();

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
      // Before adopting the profile's language, so a new one has the page's.
      await keepGoogleSignupLocale(data.user?.id, searchParams.get("locale"));
      await adoptProfileLocale(supabase, data.user?.id);
      await recordGoogleSignupSource(data.user?.id, parseSignupSource(searchParams.get("src")));
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      const base =
        !isLocalEnv && forwardedHost ? `https://${forwardedHost}` : origin;
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

/**
 * A Google sign-up can't carry metadata the way the email code does, so the
 * page it started on sends its utm tags and referring site here. They go on
 * the profile only if it was created in the last few minutes and has no
 * source yet: an existing agent signing in from an ad keeps the source they
 * joined with. The step is also counted in site_events. Best effort
 * throughout.
 */
async function recordGoogleSignupSource(userId: string | undefined, source: SignupSource | null) {
  if (!userId || !source) return;
  try {
    await createAdminClient()
      .from("profiles")
      .update({ signup_source: asJson(source) })
      .eq("id", userId)
      .is("signup_source", null)
      .gte("created_at", newProfileSince());
    await recordSiteEvent({ event: "signed_in", path: source.landing, ...source });
  } catch (err) {
    console.error("signup source not recorded:", err);
  }
}

/**
 * The language of the page a Google sign-up started on, for the same reason:
 * the email code carries it in metadata the database trigger copies. Only a
 * profile made in the last few minutes that is still on the default takes
 * it, so signing up from /es opens a Spanish app while an existing agent
 * keeps the language they chose. Best effort.
 */
async function keepGoogleSignupLocale(userId: string | undefined, locale: string | null) {
  if (!userId || !isLocale(locale) || locale === DEFAULT_LOCALE) return;
  try {
    await createAdminClient()
      .from("profiles")
      .update({ locale })
      .eq("id", userId)
      .eq("locale", DEFAULT_LOCALE)
      .gte("created_at", newProfileSince());
  } catch (err) {
    console.error("sign-up language not kept:", err);
  }
}

/** The language saved on the profile becomes this device's language. */
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
