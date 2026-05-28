import { createClient as createSupabase } from "@/lib/supabase/server";
import type { DocumentRow } from "@/lib/supabase/types";

export async function getDocuments(clientId: string): Promise<DocumentRow[]> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
