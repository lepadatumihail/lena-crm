import { createClient as createSupabase } from "@/lib/supabase/server";
import type { ClientSide } from "@/lib/crm";
import type { Client } from "@/lib/supabase/types";

export async function getClients(
  side: ClientSide,
  opts?: { includeInactive?: boolean }
): Promise<Client[]> {
  const supabase = await createSupabase();
  let query = supabase
    .from("clients")
    .select("*")
    .eq("side", side)
    .order("priority", { ascending: false })
    .order("updated_at", { ascending: false });

  if (!opts?.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
