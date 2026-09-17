import { z } from "zod";

import type { ValidationT } from "./i18n";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export function clientFormSchema(t: ValidationT) {
  return z.object({
    side: z.enum(["buyer", "seller"]),
    first_name: z.string().trim().min(1, t("firstNameRequired")).max(100),
    // Optional: portal leads often arrive with a first name only.
    last_name: z.string().trim().max(100),
    email: z.union([z.literal(""), z.email(t("invalidEmail"))]),
    phone: optionalText(50),
    language: optionalText(50),
    nationality: optionalText(50),
    agency: optionalText(120),
    notes: optionalText(5000),
    priority: z.boolean(),
    deal_type: z.enum(["direct", "collab"]).optional(),
    seller_role: z.enum(["owner", "representative"]).optional(),
  });
}

export type ClientFormValues = z.infer<ReturnType<typeof clientFormSchema>>;
