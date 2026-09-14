import { z } from "zod";

import { isValidTimeZone } from "@/lib/time-zones";
import type { ValidationT } from "./i18n";

/** The longest name the profile keeps; the database trims to the same. */
export const NAME_MAX = 80;

export function settingsFormSchema(t: ValidationT) {
  return z.object({
    full_name: z.string().trim().max(NAME_MAX, t("nameTooLong", { max: NAME_MAX })),
    time_zone: z.string().refine(isValidTimeZone, t("pickTimeZone")),
  });
}
export type SettingsFormValues = z.infer<ReturnType<typeof settingsFormSchema>>;
