import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  isLocale,
  negotiateLocale,
  type AppLocale,
} from "./config";
import { messagesFor } from "./messages";

/**
 * Resolves the UI language for the current request. The app has no URL
 * prefixes: the cookie set by the switcher wins, then the browser's
 * Accept-Language, then English. The marketing pages do have one URL per
 * language; for those the proxy pins the language in a request header, which
 * beats the cookie. Server code that runs outside a request (calendar feed)
 * passes the profile's language explicitly via `getTranslations({ locale })`.
 */
export default getRequestConfig(async ({ locale: explicit }) => {
  let locale: AppLocale | null = isLocale(explicit) ? explicit : null;

  const requestHeaders = await headers();
  if (!locale) {
    const pinned = requestHeaders.get(LOCALE_HEADER);
    if (isLocale(pinned)) locale = pinned;
  }

  if (!locale) {
    const store = await cookies();
    const fromCookie = store.get(LOCALE_COOKIE)?.value;
    if (isLocale(fromCookie)) locale = fromCookie;
  }

  if (!locale) {
    locale = negotiateLocale(requestHeaders.get("accept-language")) ?? DEFAULT_LOCALE;
  }

  return {
    locale,
    messages: messagesFor(locale),
    onError(error) {
      // Missing keys already fall back to English via the catalog merge; only
      // surface anything else, and only where a developer will see it.
      if (process.env.NODE_ENV !== "production") console.error(error);
    },
  };
});
