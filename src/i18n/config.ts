/**
 * UI languages. The agent picks one (sidebar / marketing nav); it is stored in
 * a cookie for rendering and on the profile for server jobs that run without
 * a request (calendar feed) and to restore the cookie on a new device.
 *
 * This is the agent's UI language only. Messages to clients follow the
 * client's own language (see message-composer / actions/messages).
 */
export const LOCALES = ["en", "es", "ru"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

/** Cookie carrying the UI language; read by i18n/request.ts on every request. */
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  es: "Español",
  ru: "Русский",
};

/** BCP 47 tag used for Intl date/number formatting in each UI language. */
export const INTL_TAGS: Record<AppLocale, string> = {
  en: "en-GB",
  es: "es-ES",
  ru: "ru-RU",
};

export function isLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Intl tag for a locale, falling back to the default language's tag. */
export function intlTag(locale: string | null | undefined): string {
  return isLocale(locale) ? INTL_TAGS[locale] : INTL_TAGS[DEFAULT_LOCALE];
}

/** Best supported language from an Accept-Language header, or null. */
export function negotiateLocale(header: string | null | undefined): AppLocale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="));
      const weight = q ? Number.parseFloat(q.slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), weight: Number.isNaN(weight) ? 0 : weight };
    })
    .filter((r) => r.tag && r.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}

/** The UI language for any value: a supported locale as-is, anything else English. */
export function asLocale(value: unknown): AppLocale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Request header the proxy sets when the URL itself names the language
 * (/es and everything under it). i18n/request.ts honours it over the cookie;
 * the proxy strips any copy a client sent, so it is never spoofable.
 */
export const LOCALE_HEADER = "x-ui-locale";
