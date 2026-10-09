import { LOCALES, type AppLocale } from "@/i18n/config";

/**
 * The client tracker's downloads (plan 019): one workbook per language, built
 * at build time by src/app/downloads/[file]/route.ts. Kept apart from the
 * builder so the tool page's buttons can name the files without pulling the
 * Excel writer into the browser.
 */
export const TRACKER_FILES = {
  en: "leadwing-client-tracker.xlsx",
  es: "plantilla-clientes-inmobiliaria-leadwing.xlsx",
  ru: "leadwing-tablitsa-klientov.xlsx",
} as const satisfies Record<AppLocale, string>;

export const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function trackerPath(locale: AppLocale): string {
  return `/downloads/${TRACKER_FILES[locale]}`;
}

/** The language a download name stands for, or null for any other name. */
export function trackerLocale(file: string): AppLocale | null {
  return LOCALES.find((locale) => TRACKER_FILES[locale] === file) ?? null;
}

/**
 * "Make a copy in Google Sheets": each file's
 * `https://docs.google.com/spreadsheets/d/<id>/copy` link, once it has been
 * uploaded to the founder's Drive, converted to Sheets and shared view-only.
 * Sharing makes the file public, so it waits for the founder's yes; until
 * then the button stays hidden. Re-upload both whenever the columns change.
 */
export const TRACKER_SHEETS_COPY_URL: Record<AppLocale, string | null> = {
  en: null,
  es: null,
  ru: null,
};
