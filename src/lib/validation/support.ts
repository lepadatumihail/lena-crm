import { z } from "zod";

import type { ValidationT } from "./i18n";

/**
 * What an agent can file from the help dialog. The kind steers the subject line
 * so the inbox sorts itself; everything else is free text.
 */
export const SUPPORT_KINDS = [
  "bug",
  "feedback",
  "feature",
  "billing",
  "question",
] as const;

export type SupportKind = (typeof SUPPORT_KINDS)[number];

export const SUPPORT_MESSAGE_MAX = 4000;

export function supportFormSchema(t: ValidationT) {
  return z.object({
    kind: z.enum(SUPPORT_KINDS),
    // Prefilled with the signed-in address but editable, so an agent can point
    // the reply at a mailbox they actually read.
    replyTo: z.email(t("invalidEmail")),
    subject: z.string().trim().max(200).optional().or(z.literal("")),
    message: z
      .string()
      .trim()
      .min(1, t("messageRequired"))
      .max(SUPPORT_MESSAGE_MAX),
  });
}

export type SupportFormValues = z.infer<ReturnType<typeof supportFormSchema>>;
