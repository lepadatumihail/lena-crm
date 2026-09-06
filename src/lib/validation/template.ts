import { z } from "zod";

import type { ValidationT } from "./i18n";

export function templateFormSchema(t: ValidationT) {
  return z.object({
    name: z.string().trim().min(1, t("nameRequired")).max(120),
    subject: z.string().trim().max(200).optional().or(z.literal("")),
    body: z.string().trim().min(1, t("messageRequired")).max(4000),
  });
}
export type TemplateFormValues = z.infer<ReturnType<typeof templateFormSchema>>;

/** Variables an agent can drop into a template body or subject. */
export const TEMPLATE_VARIABLES = [
  "first_name",
  "full_name",
  "budget",
  "property",
  "agency",
] as const;
