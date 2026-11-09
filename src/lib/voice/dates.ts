/**
 * Guards for the dates a voice note's extraction proposes (plan 026). A date
 * that doesn't exist, or sits far outside the agent's near future, becomes
 * null: the review card then shows "no date" instead of a wrong one.
 */

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/;

/** How far ahead a proposed date may be. */
export const MAX_DAYS_AHEAD = 730;

/** Days since the epoch for a real calendar day, or null (2026-02-30 is not one). */
function dayNumber(key: string): number | null {
  const match = DAY.exec(key);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return Math.round(date.getTime() / 86_400_000);
}

/** A due date from yesterday to two years after the agent's today, else null. */
export function dueDateOrNull(value: string | null | undefined, todayKey: string): string | null {
  if (!value) return null;
  const day = dayNumber(value);
  const today = dayNumber(todayKey);
  if (day == null || today == null) return null;
  return day >= today - 1 && day <= today + MAX_DAYS_AHEAD ? value : null;
}

/** A local "YYYY-MM-DDTHH:mm" from today to two years ahead, else null. */
export function localDateTimeOrNull(value: string | null | undefined, todayKey: string): string | null {
  if (!value) return null;
  const match = LOCAL.exec(value);
  if (!match) return null;
  if (Number(match[2]) > 23 || Number(match[3]) > 59) return null;
  const day = dayNumber(match[1]);
  const today = dayNumber(todayKey);
  if (day == null || today == null) return null;
  return day >= today && day <= today + MAX_DAYS_AHEAD ? value : null;
}
