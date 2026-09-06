import type { Locale as DateFnsLocale } from "date-fns";
import { enGB, es } from "date-fns/locale";

/** date-fns locale for a UI language, for `format(date, pattern, { locale })`. */
export function dateFnsLocale(locale: string): DateFnsLocale {
  return locale === "es" ? es : enGB;
}
