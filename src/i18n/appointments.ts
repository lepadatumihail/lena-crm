import type enServer from "../../messages/en/server.json";
import type { AppointmentType } from "@/lib/calendar";

type AppointmentKey = keyof typeof enServer.appointments;
/** Translator for the `server.appointments` namespace (server code only). */
export type AppointmentsT = (
  key: AppointmentKey,
  values?: Record<string, string | number>
) => string;

/**
 * Display title for an appointment in the agent's language: the custom title
 * when set, otherwise derived from the type, client and property. Used
 * wherever the server builds one: the calendar loader, the notification sync
 * and the ICS feed.
 */
export function appointmentTitleFor(
  t: AppointmentsT,
  appt: { type: AppointmentType; title: string | null },
  opts?: { clientName?: string | null; property?: string | null }
): string {
  const custom = appt.title?.trim();
  if (custom) return custom;

  const name = opts?.clientName?.trim();
  if (appt.type === "viewing") {
    const place = opts?.property?.trim();
    if (name && place) return t("viewingWithAt", { name, place });
    if (place) return t("viewingAt", { place });
    if (name) return t("viewingWith", { name });
    return t("viewing");
  }
  return name ? t("meetingWith", { name }) : t("meeting");
}
