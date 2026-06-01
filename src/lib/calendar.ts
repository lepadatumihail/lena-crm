import { format } from "date-fns";

import type { Enums } from "@/lib/supabase/types";

export type AppointmentType = Enums<"appointment_type">;
export type NotificationType = Enums<"notification_type">;

export const APPOINTMENT_TYPES = ["meeting", "viewing"] as const;

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  meeting: "Meeting",
  viewing: "Viewing",
};

export type ReminderPreset = { value: number | null; label: string };

export const REMINDER_PRESETS: ReminderPreset[] = [
  { value: null, label: "No reminder" },
  { value: 0, label: "At time of event" },
  { value: 10, label: "10 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 180, label: "3 hours before" },
  { value: 1440, label: "1 day before" },
];

export function reminderLabel(minutes: number | null): string {
  const preset = REMINDER_PRESETS.find((r) => r.value === minutes);
  if (preset) return preset.label;
  if (minutes == null) return "No reminder";
  if (minutes % 1440 === 0) return `${minutes / 1440} days before`;
  if (minutes % 60 === 0) return `${minutes / 60} hours before`;
  return `${minutes} minutes before`;
}

/** Build a human title for an appointment, falling back to a derived one. */
export function appointmentTitle(
  appt: { type: AppointmentType; title: string | null },
  opts?: { clientName?: string | null; property?: string | null }
): string {
  const custom = appt.title?.trim();
  if (custom) return custom;

  const who = opts?.clientName?.trim();
  if (appt.type === "viewing") {
    const place = opts?.property?.trim();
    if (who && place) return `Viewing · ${who} @ ${place}`;
    if (place) return `Viewing @ ${place}`;
    if (who) return `Viewing with ${who}`;
    return "Viewing";
  }
  return who ? `Meeting with ${who}` : "Meeting";
}

/** "14:30" or "14:30–15:30" in 24h time (Costa del Sol convention). */
export function formatTimeRange(
  startsAt: string,
  endsAt: string | null
): string {
  const start = format(new Date(startsAt), "HH:mm");
  if (!endsAt) return start;
  return `${start}–${format(new Date(endsAt), "HH:mm")}`;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  appointment_reminder: "Reminder",
  appointment_today: "Today",
  follow_up: "Follow up",
  reservation_date: "Key date",
  stalled_offer: "Offer",
};
