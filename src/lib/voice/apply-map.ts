/**
 * One approved review card → the inputs the existing actions take (plan
 * 026). Saving a voice note goes through the same actions as the forms, so
 * validation, revalidation and side effects stay identical. These functions
 * are pure; the tests run their output through the real schemas.
 */
import { defaultStageForSide, stagesForSide, type ClientSide } from "@/lib/crm";
import type { LogContactInput } from "@/lib/validation/activity";
import type { PreferencesFormValues, ViewingFormValues } from "@/lib/validation/buyer";
import type { AppointmentInput } from "@/lib/validation/calendar";
import type { ClientFormValues } from "@/lib/validation/client";
import type { TaskInput } from "@/lib/validation/task";

import type { CandidatePreferences } from "./proposal";
import type { VoiceApplyGroup, VoiceApplyTask } from "./schema";

type NewClient = Extract<VoiceApplyGroup["client"], { kind: "new" }>;

/** A new client as the client form would submit it. */
export function toClientValues(c: NewClient): ClientFormValues {
  return {
    side: c.side,
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email,
    phone: c.phone,
    language: c.language,
    nationality: "",
    agency: "",
    notes: "",
    priority: false,
  };
}

/** The timeline entry: a logged contact when the agent spoke to them, otherwise a plain note. */
export function toTimelineEntry(
  clientId: string,
  g: Pick<VoiceApplyGroup, "note" | "contact_channel">
):
  | { kind: "contact"; input: LogContactInput }
  | { kind: "note"; input: { clientId: string; body: string } }
  | null {
  const body = g.note?.trim() || null;
  if (g.contact_channel) return { kind: "contact", input: { clientId, channel: g.contact_channel, body } };
  if (body) return { kind: "note", input: { clientId, body } };
  return null;
}

const amountText = (value: number | null | undefined) => (value == null ? "" : String(value));

/** A viewing record, as the viewing dialog would submit one with no calendar slot. */
export function toViewingValues(v: NonNullable<VoiceApplyGroup["viewing"]>): {
  values: ViewingFormValues;
  schedule: { scheduled_at: null; reminder_minutes: null };
} {
  return {
    values: {
      title: v.property,
      description: v.feedback,
      property_price: amountText(v.property_price),
      had_offer: v.had_offer,
      offer_price: v.had_offer ? amountText(v.offer_price) : "",
      client_id: "",
      date: "",
      time: "",
      reminder: "",
    },
    schedule: { scheduled_at: null, reminder_minutes: null },
  };
}

/** What the note said wins; every field it didn't mention keeps its current value. */
export function mergePreferences(
  current: CandidatePreferences | null,
  proposed: NonNullable<VoiceApplyGroup["preferences"]>
): PreferencesFormValues {
  const pick = <T>(next: T | null, now: T | null | undefined): T | null => (next != null ? next : (now ?? null));
  return {
    property_types: proposed.property_types ?? current?.property_types ?? [],
    budget_min: amountText(pick(proposed.budget_min, current?.budget_min)),
    budget_max: amountText(pick(proposed.budget_max, current?.budget_max)),
    bedrooms: amountText(pick(proposed.bedrooms, current?.bedrooms)),
    bathrooms: amountText(pick(proposed.bathrooms, current?.bathrooms)),
    area_notes: pick(proposed.area_notes, current?.area_notes) ?? "",
  };
}

/** To-dos, open and unprioritised like a task added by hand. */
export function toTaskInputs(clientId: string | null, tasks: readonly VoiceApplyTask[]): TaskInput[] {
  return tasks.map((t) => ({
    title: t.title,
    description: null,
    status: "todo",
    priority: "none",
    client_id: clientId,
    due_on: t.due_on,
  }));
}

/** A meeting on the calendar; the instant was resolved in the browser like the appointment dialog does. */
export function toAppointmentInput(
  clientId: string,
  a: NonNullable<VoiceApplyGroup["appointment"]>
): AppointmentInput {
  const start = new Date(a.starts_at);
  return {
    type: "meeting",
    title: a.title,
    client_id: clientId,
    property_id: null,
    property_label: null,
    starts_at: start.toISOString(),
    ends_at: new Date(start.getTime() + a.duration_minutes * 60_000).toISOString(),
    location: a.location,
    notes: null,
    reminder_minutes: null,
  };
}

/** A stage move only when it is valid for the client's side and actually changes something. */
export function stageChange(side: ClientSide, current: string | null, proposed: string | null): string | null {
  if (!proposed) return null;
  if (!(stagesForSide(side) as readonly string[]).includes(proposed)) return null;
  const now = current ?? defaultStageForSide(side);
  return proposed === now ? null : proposed;
}
