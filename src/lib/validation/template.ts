import { z } from "zod";

export const templateFormSchema = z.object({
  name: z.string().trim().min(1, "Give it a name").max(120),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().min(1, "Write the message").max(4000),
});
export type TemplateFormValues = z.infer<typeof templateFormSchema>;

/** Variables an agent can drop into a template body or subject. */
export const TEMPLATE_VARIABLES = [
  "first_name",
  "full_name",
  "budget",
  "property",
  "agency",
] as const;
