import { z } from "zod";

import type { ValidationT } from "./i18n";

// Numeric fields are kept as strings in forms (what the inputs hold) and coerced
// to numbers in the server action via toNumber(). Mirrors the buyer-side pattern.
const numericString = (t: ValidationT, opts?: { int?: boolean; max?: number }) =>
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
        ? t("wholeNumber")
        : opts?.max != null
          ? t("numberBetween", { max: opts.max })
          : t("invalidAmount"),
    }
  );

/** Coerce a form string to a number, treating blank / invalid as 0. */
export function toNumber(v: string | number | null | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v == null) return 0;
  const n = Number(v.trim());
  return Number.isFinite(n) ? n : 0;
}

export function dealFormSchema(t: ValidationT) {
  return z.object({
    title: z.string().trim().min(1, t("titleRequired")).max(120),
    analysis_date: z.string().min(1, t("dateRequired")),
    property_type: z.enum(["resale", "new_build"]),
    // acquisition
    asking_price: numericString(t),
    transfer_tax_pct: numericString(t, { max: 100 }),
    lawyer_pct: numericString(t, { max: 100 }),
    notary_pct: numericString(t, { max: 100 }),
    // renovation / project
    renovation_price_per_sqm: numericString(t),
    surface_sqm: numericString(t),
    contingency_pct: numericString(t, { max: 100 }),
    duration_months: numericString(t, { int: true }),
    // exit
    expected_sale_price: numericString(t),
    agency_fee_pct: numericString(t, { max: 100 }),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  });
}

export type DealFormValues = z.infer<ReturnType<typeof dealFormSchema>>;
