import { format, parseISO } from "date-fns";

import { formatTimeInTimeZone } from "@/lib/attention";
import { dateKeyInTimeZone } from "@/lib/home";
import {
  reminderDateWording,
  reminderMessage,
  whatsappLink,
} from "@/lib/whatsapp";
import type { CalendarEvent } from "@/lib/data/calendar";

/**
 * "Sun 27 Sep at 14:52", "domingo 27 de septiembre a las 14:52": when an
 * event starts, worded in the client's language and read on the agent's
 * clock. The day is formatted from the zone's `yyyy-MM-dd` key and the time
 * comes from Intl, so the process time zone (UTC on the server) never moves
 * either one.
 */
export function reminderWhen(
  startsAt: string,
  language: string | null | undefined,
  timeZone: string
): string {
  const { day, locale, at } = reminderDateWording(language);
  const dayLabel = format(parseISO(dateKeyInTimeZone(startsAt, timeZone)), day, {
    locale,
  });
  return `${dayLabel} ${at} ${formatTimeInTimeZone(startsAt, timeZone)}`;
}

/** One-tap WhatsApp reminder link for a calendar event, or null if no phone. */
export function eventReminderHref(
  e: CalendarEvent,
  timeZone: string
): string | null {
  if (!e.contact?.phone) return null;
  const { firstName, language, phone } = e.contact;
  const text = reminderMessage(
    firstName,
    language,
    e.reminderWhat,
    reminderWhen(e.starts_at, language, timeZone)
  );
  return whatsappLink(phone, text);
}
