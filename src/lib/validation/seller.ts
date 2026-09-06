import { z } from "zod";

import type { ValidationT } from "./i18n";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const numericString = (t: ValidationT, opts?: { int?: boolean }) =>
  z.string().trim().refine(
    (v) =>
      v === "" ||
      ((opts?.int ? Number.isInteger(Number(v)) : !Number.isNaN(Number(v))) &&
        Number(v) >= 0),
    { message: opts?.int ? t("wholeNumber") : t("invalidAmount") }
  );

export function propertyFormSchema(t: ValidationT) {
  return z.object({
    property_type: z.string().optional().or(z.literal("")),
    price: numericString(t),
    bedrooms: numericString(t, { int: true }),
    address: optionalText(300),
    city: optionalText(120),
    notes: optionalText(2000),
  });
}
export type PropertyFormValues = z.infer<ReturnType<typeof propertyFormSchema>>;
