/**
 * Pure, timezone-aware helpers for the "attention" signals (notifications +
 * Home cockpit). No I/O — everything here is unit-testable in isolation.
 *
 * Notification bodies are formatted on the server (UTC in production), so we
 * cannot lean on `date-fns` `format`, which renders in the process timezone.
 * These helpers take an explicit IANA `timeZone` (supplied by the browser) and
 * format via `Intl.DateTimeFormat`. Day math is done in pure UTC arithmetic on
 * the `yyyy-MM-dd` keys, which is immune to both the process TZ and DST.
 */

/** Follow-up nudge threshold: a buyer quiet this many days is "stale". */
export const STALE_AFTER_DAYS = 7;
/** A pending offer comes back as a nudge this many days after the agent last chased it. */
export const OFFER_CHASE_AFTER_DAYS = 3;
/** Reservation key dates within this many days surface as a signal. */
export const RESERVATION_LOOKAHEAD_DAYS = 5;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Strictly parse a `yyyy-MM-dd` key into [year, monthIndex, day]. */
function parseDateKey(dateStr: string): [number, number, number] {
  if (!DATE_RE.test(dateStr)) {
    throw new RangeError(`Invalid date key: ${dateStr}`);
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  return [y, m - 1, d];
}

/**
 * Whole calendar days from `todayKey` to `dateStr` (both `yyyy-MM-dd`),
 * timezone- and DST-proof because it compares two UTC midnights.
 * Future dates are positive, past dates negative.
 */
export function calendarDaysFromToday(
  dateStr: string,
  todayKey: string
): number {
  const target = Date.UTC(...parseDateKey(dateStr));
  const today = Date.UTC(...parseDateKey(todayKey));
  return Math.round((target - today) / 86_400_000);
}

/** Resolve an IANA zone, falling back to UTC if it's invalid (Intl throws). */
function safeFormatter(
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
  locale = "en-GB"
): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat(locale, { timeZone, ...options });
  } catch {
    return new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...options });
  }
}

/**
 * "Sat 14 Jun, 10:00" — the instant rendered in the given IANA `timeZone`
 * (en-GB, 24-hour). Mirrors `date-fns` `format(d, "EEE d MMM, HH:mm")` but in
 * an explicit zone rather than the process TZ.
 */
export function formatInTimeZone(
  isoInstant: string,
  timeZone: string,
  locale = "en-GB"
): string {
  const date = new Date(isoInstant);
  const parts = safeFormatter(
    timeZone,
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
    locale
  ).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("weekday")} ${get("day")} ${get("month")}, ${get("hour")}:${get(
    "minute"
  )}`;
}

/** "10:00" — the instant's wall-clock time in the given IANA `timeZone`. */
export function formatTimeInTimeZone(
  isoInstant: string,
  timeZone: string,
  locale = "en-GB"
): string {
  const date = new Date(isoInstant);
  const parts = safeFormatter(
    timeZone,
    { hour: "2-digit", minute: "2-digit", hour12: false },
    locale
  ).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("hour")}:${get("minute")}`;
}

/**
 * "Sat 14 Jun" — date-only label for a `yyyy-MM-dd` key (reservation key
 * dates have no time component). Rendered from a noon-UTC instant so the
 * calendar day is stable in every IANA zone, no TZ argument needed.
 */
export function formatDateKey(dateStr: string, locale = "en-GB"): string {
  const [y, m, d] = parseDateKey(dateStr);
  const date = new Date(Date.UTC(y, m, d, 12, 0, 0));
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("weekday")} ${get("day")} ${get("month")}`;
}
