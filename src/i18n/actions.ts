"use server";

import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  type AppLocale,
} from "./config";
import { localeCookieOptions } from "./cookie";

/**
 * Switch the UI language. The cookie takes effect on the next render; the
 * profile copy is best effort so switching still works before the migration
 * that adds `profiles.locale` has been applied.
 */
export async function setLocale(input: string): Promise<{ locale: AppLocale }> {
  const locale = isLocale(input) ? input : DEFAULT_LOCALE;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, localeCookieOptions());

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.rpc("set_locale", { p_locale: locale });
  }
  return { locale };
}

/**
 * After sign-in on a device without the cookie, adopt the language saved on
 * the profile. Returns the locale that was applied, or null if none.
 */
export async function syncLocaleFromProfile(): Promise<AppLocale | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("locale")
    .eq("id", user.id)
    .maybeSingle();
  const locale = data?.locale;
  if (!isLocale(locale)) return null;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, localeCookieOptions());
  return locale;
}
