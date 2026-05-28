import { createClient as createSupabase } from "@/lib/supabase/server";
import type { Property } from "@/lib/supabase/types";

export async function getProperties(clientId: string): Promise<Property[]> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
