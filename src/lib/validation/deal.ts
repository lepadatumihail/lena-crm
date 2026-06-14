import { z } from "zod";

// Numeric fields are kept as strings in forms (what the inputs hold) and coerced
// to numbers in the server action via toNumber(). Mirrors the buyer-side pattern.
const numericString = (opts?: { int?: boolean; max?: number }) =>
  z.string().trim().refine(
    (v) => {
      if (v === "") return true;
      const n = Number(v);
      if (Number.isNaN(n) || n < 0) return false;
      if (opts?.int && !Number.isInteger(n)) return false;
      if (opts?.max != null && n > opts.max) return false;
      return true;
    },
    {
      message: opts?.int
        ? "Enter a whole number"
        : opts?.max != null
          ? `Enter a number between 0 and ${opts.max}`
          : "Enter a valid amount",
    }
  );

/** Coerce a form string to a number, treating blank / invalid as 0. */
export function toNumber(v: string | number | null | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v == null) return 0;
  const n = Number(v.trim());
  return Number.isFinite(n) ? n : 0;
}

export const dealFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  analysis_date: z.string().min(1, "Date is required"),
  property_type: z.enum(["resale", "new_build"]),
  // acquisition
  asking_price: numericString(),
  transfer_tax_pct: numericString({ max: 100 }),
  lawyer_pct: numericString({ max: 100 }),
  notary_pct: numericString({ max: 100 }),
  // renovation / project
  renovation_price_per_sqm: numericString(),
  surface_sqm: numericString(),
  contingency_pct: numericString({ max: 100 }),
  duration_months: numericString({ int: true }),
  // exit
  expected_sale_price: numericString(),
  agency_fee_pct: numericString({ max: 100 }),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type DealFormValues = z.infer<typeof dealFormSchema>;
