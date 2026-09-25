import { format } from "date-fns";

import type { Enums } from "@/lib/supabase/types";
import type { Tone } from "@/lib/tones";

export type AppointmentType = Enums<"appointment_type">;
export type NotificationType = Enums<"notification_type">;

export const APPOINTMENT_TYPES = ["meeting", "viewing"] as const;

/** One tone per kind of event, shared by the calendar and Home: viewings are the brand's. */
export const EVENT_TONES: Record<AppointmentType, Tone> = {
  viewing: "brand",
  meeting: "neutral",
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

/** "14:30" or "14:30–15:30" in 24h time (Spanish convention). */
export function formatTimeRange(
  startsAt: string,
  endsAt: string | null
): string {
  const start = format(new Date(startsAt), "HH:mm");
  if (!endsAt) return start;
  return `${start}–${format(new Date(endsAt), "HH:mm")}`;
}

