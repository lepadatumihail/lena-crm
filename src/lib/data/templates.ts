import { createClient as createSupabase } from "@/lib/supabase/server";
import type { EmailTemplate } from "@/lib/supabase/types";

/** The agent's own saved message templates. */
export async function getTemplates(): Promise<EmailTemplate[]> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
