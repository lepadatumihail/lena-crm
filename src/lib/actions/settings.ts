"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { createClient as createSupabase } from "@/lib/supabase/server";
import {
  settingsFormSchema,
  type SettingsFormValues,
} from "@/lib/validation/settings";

/**
 * Save the agent's name and time zone. Agents cannot write their own profile
 * row, so both go through one definer function; then every page under the
 * shell re-renders, since the layout reads both.
 */
export async function saveSettings(
  values: SettingsFormValues
): Promise<{ error: string | null }> {
  const [t, tv] = await Promise.all([
    getTranslations("settings"),
    getTranslations("validation"),
  ]);
  const parsed = settingsFormSchema(tv).safeParse(values);
  if (!parsed.success) return { error: t("errors.checkForm") };

  const supabase = await createSupabase();
  const { error } = await supabase.rpc("update_my_settings", {
    p_full_name: parsed.data.full_name,
    p_time_zone: parsed.data.time_zone,
  });
  if (error) {
    // PGRST202: the function isn't there, so the migration hasn't run yet.
    return { error: error.code === "PGRST202" ? t("errors.notReady") : error.message };
  }

  revalidatePath("/", "layout");
  return { error: null };
}
