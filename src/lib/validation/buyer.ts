import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const optionalDate = z.string().optional().or(z.literal(""));

// Numeric fields are kept as strings in forms (what inputs hold) and coerced
// to number | null in the server actions via toNumberOrNull().
const numericString = (opts?: { int?: boolean }) =>
  z.string().trim().refine(
    (v) =>
      v === "" ||
      ((opts?.int ? Number.isInteger(Number(v)) : !Number.isNaN(Number(v))) &&
        Number(v) >= 0),
    { message: opts?.int ? "Enter a whole number" : "Enter a valid amount" }
  );

export function toNumberOrNull(v: string | undefined | null): number | null {
  if (v == null) return null;
  const t = v.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
}

export function emptyToNull(v: string | undefined | null): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export const preferencesFormSchema = z.object({
  property_types: z.array(z.string()),
  budget_min: numericString(),
  budget_max: numericString(),
  bedrooms: numericString({ int: true }),
  bathrooms: numericString({ int: true }),
  area_notes: optionalText(2000),
});
export type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;

export const viewingFormSchema = z.object({
  title: optionalText(200),
  description: optionalText(2000),
  property_price: numericString(),
  had_offer: z.boolean(),
  offer_price: numericString(),
  // optional scheduling — when a date is set the viewing shows on the calendar
  client_id: z.string().optional().or(z.literal("")),
  date: optionalDate,
  time: z.string(),
  reminder: z.string(),
});
export type ViewingFormValues = z.infer<typeof viewingFormSchema>;

export const reservationFormSchema = z.object({
  down_payment: numericString(),
  down_payment_date: optionalDate,
  ppc: numericString(),
  ppc_date: optionalDate,
  notary_date: optionalDate,
  notary_notes: optionalText(2000),
  commission: numericString(),
  closed_at: optionalDate,
});
export type ReservationFormValues = z.infer<typeof reservationFormSchema>;
