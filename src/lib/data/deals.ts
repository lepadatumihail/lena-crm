import { createClient as createSupabase } from "@/lib/supabase/server";
import type { DealAnalysis } from "@/lib/supabase/types";

export async function getDealAnalyses(): Promise<DealAnalysis[]> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("deal_analyses")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDealAnalysisById(
  id: string
): Promise<DealAnalysis | null> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("deal_analyses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
