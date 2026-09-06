import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  negotiateLocale,
  type AppLocale,
} from "./config";
import { messagesFor } from "./messages";

/**
 * Resolves the UI language for the current request. No URL prefixes: the
 * cookie set by the switcher wins, then the browser's Accept-Language, then
 * English. Server code that runs outside a request (calendar feed) passes the
 * profile's language explicitly via `getTranslations({ locale })`.
 */
export default getRequestConfig(async ({ locale: explicit }) => {
  let locale: AppLocale | null = isLocale(explicit) ? explicit : null;

  if (!locale) {
    const store = await cookies();
    const fromCookie = store.get(LOCALE_COOKIE)?.value;
    if (isLocale(fromCookie)) locale = fromCookie;
  }

  if (!locale) {
    const requestHeaders = await headers();
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
