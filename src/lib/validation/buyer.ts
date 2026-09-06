import { z } from "zod";

import type { ValidationT } from "./i18n";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const optionalDate = z.string().optional().or(z.literal(""));

// Numeric fields are kept as strings in forms (what inputs hold) and coerced
// to number | null in the server actions via toNumberOrNull().
const numericString = (t: ValidationT, opts?: { int?: boolean }) =>
  z.string().trim().refine(
    (v) =>
      v === "" ||
      ((opts?.int ? Number.isInteger(Number(v)) : Number.isFinite(Number(v))) &&
        Number(v) >= 0),
    { message: opts?.int ? t("wholeNumber") : t("invalidAmount") }
  );

export function toNumberOrNull(v: string | undefined | null): number | null {
  if (v == null) return null;
  const t = v.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function emptyToNull(v: string | undefined | null): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function preferencesFormSchema(t: ValidationT) {
  return z.object({
    property_types: z.array(z.string()),
    budget_min: numericString(t),
    budget_max: numericString(t),
    bedrooms: numericString(t, { int: true }),
    bathrooms: numericString(t, { int: true }),
    area_notes: optionalText(2000),
  });
}
export type PreferencesFormValues = z.infer<ReturnType<typeof preferencesFormSchema>>;

export function viewingFormSchema(t: ValidationT) {
  return z.object({
    title: optionalText(200),
    description: optionalText(2000),
    property_price: numericString(t),
    had_offer: z.boolean(),
    offer_price: numericString(t),
    // optional scheduling — when a date is set the viewing shows on the calendar
    client_id: z.string().optional().or(z.literal("")),
    date: optionalDate,
    time: z.string(),
    reminder: z.string(),
  });
}
export type ViewingFormValues = z.infer<ReturnType<typeof viewingFormSchema>>;

// The viewing dialog's scheduling block is passed to saveViewing as a second
// argument alongside the (already-validated) form values; validate it too so a
// crafted call can't write garbage scheduled_at / reminder_minutes.
export const viewingScheduleSchema = z.object({
  scheduled_at: z.iso.datetime().nullable(),
  reminder_minutes: z.number().int().min(0).max(10080).nullable(),
});

export function reservationFormSchema(t: ValidationT) {
  return z.object({
    down_payment: numericString(t),
    down_payment_date: optionalDate,
    ppc: numericString(t),
    ppc_date: optionalDate,
    notary_date: optionalDate,
    notary_notes: optionalText(2000),
    commission: numericString(t),
    closed_at: optionalDate,
  });
}
export type ReservationFormValues = z.infer<ReturnType<typeof reservationFormSchema>>;
