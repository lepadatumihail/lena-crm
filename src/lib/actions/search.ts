"use server";

import { createClient as createSupabase } from "@/lib/supabase/server";
import type { ClientSide } from "@/lib/crm";

/** One row of the quick-search index: enough to match on and to label. */
export type SearchClient = {
  id: string;
  name: string;
  side: ClientSide;
  stage: string;
  email: string | null;
  phone: string | null;
  agency: string | null;
};

const INDEX_LIMIT = 500;

/**
 * The agent's active clients, most recently touched first. Loaded once when
 * the search opens and filtered in the browser: an independent agent's book
 * is a few hundred rows at most, so one round-trip beats one per keystroke.
 */
export async function searchIndex(): Promise<SearchClient[]> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("id, first_name, last_name, side, stage, email, phone, agency")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(INDEX_LIMIT);
  if (error) throw new Error(error.message);
  return (data ?? []).map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`.trim(),
    side: c.side,
    stage: c.stage,
    email: c.email,
    phone: c.phone,
    agency: c.agency,
  }));
}
