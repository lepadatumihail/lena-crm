import { format, parseISO } from "date-fns";

import { dateFnsLocale } from "@/i18n/dates";

/**
 * A day key (yyyy-MM-dd, the agent's day) as a short label: "11 Sep", and
 * "12 Dec 2025" once it falls outside the year of `todayKey`.
 */
export function dayLabel(dayKey: string, todayKey: string, locale: string): string {
  const pattern = dayKey.slice(0, 4) === todayKey.slice(0, 4) ? "d MMM" : "d MMM yyyy";
  // parseISO on a date-only key is local midnight of that day, so the day never shifts.
  return format(parseISO(dayKey), pattern, { locale: dateFnsLocale(locale) });
}
