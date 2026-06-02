import { format } from "date-fns";

import { reminderMessage, whatsappLink } from "@/lib/whatsapp";
import type { CalendarEvent } from "@/lib/data/calendar";

/** One-tap WhatsApp reminder link for a calendar event, or null if no phone. */
export function eventReminderHref(e: CalendarEvent): string | null {
  if (!e.contact?.phone) return null;
  const when = format(new Date(e.starts_at), "EEE d MMM 'at' HH:mm");
  const text = reminderMessage(
    e.contact.firstName,
    e.contact.language,
    e.reminderWhat,
    when
  );
  return whatsappLink(e.contact.phone, text);
}
