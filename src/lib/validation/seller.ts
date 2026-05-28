import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const numericString = (opts?: { int?: boolean }) =>
  z.string().trim().refine(
    (v) =>
      v === "" ||
      ((opts?.int ? Number.isInteger(Number(v)) : !Number.isNaN(Number(v))) &&
        Number(v) >= 0),
    { message: opts?.int ? "Enter a whole number" : "Enter a valid amount" }
  );

export const propertyFormSchema = z.object({
  property_type: z.string().optional().or(z.literal("")),
  price: numericString(),
  bedrooms: numericString({ int: true }),
  address: optionalText(300),
  city: optionalText(120),
  notes: optionalText(2000),
});
export type PropertyFormValues = z.infer<typeof propertyFormSchema>;
