import type { CalendarEvent } from "@/lib/data/calendar";

/** UTC basic format for Google Calendar template URLs, e.g. 20260614T100000Z */
function basic(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** A "render" URL that opens Google Calendar with the event pre-filled. */
export function googleCalendarHref(e: CalendarEvent): string {
  const start = new Date(e.starts_at);
  const end = e.ends_at
    ? new Date(e.ends_at)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const notes = e.kind === "meeting" ? e.appointment.notes : e.viewing.description;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${basic(start)}/${basic(end)}`,
  });
  if (e.location) params.set("location", e.location);
  if (notes) params.set("details", notes);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
