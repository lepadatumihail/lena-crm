"use server";

import { revalidatePath } from "next/cache";

import { createClient as createSupabase } from "@/lib/supabase/server";
import { normalizeMonths } from "@/lib/calculator/deal";
import { dealFormSchema, toNumber, type DealFormValues } from "@/lib/validation/deal";

type ActionResult = { error: string | null };

/** Map validated form strings to the table's numeric columns. */
function toRow(v: DealFormValues) {
  return {
    title: v.title,
    analysis_date: v.analysis_date,
    property_type: v.property_type,
    // Purchase / sale prices are whole euros — rounding keeps them safe to
    // round-trip through the digit-grouped money input.
    asking_price: Math.round(toNumber(v.asking_price)),
    transfer_tax_pct: toNumber(v.transfer_tax_pct),
    lawyer_pct: toNumber(v.lawyer_pct),
    notary_pct: toNumber(v.notary_pct),
    renovation_price_per_sqm: toNumber(v.renovation_price_per_sqm),
    surface_sqm: toNumber(v.surface_sqm),
    contingency_pct: toNumber(v.contingency_pct),
    duration_months: normalizeMonths(v.duration_months),
    expected_sale_price: Math.round(toNumber(v.expected_sale_price)),
    agency_fee_pct: toNumber(v.agency_fee_pct),
    notes: v.notes ? v.notes : null,
  };
}

export async function createDealAnalysis(
  values: DealFormValues
): Promise<{ error: string | null; id?: string }> {
  const parsed = dealFormSchema.safeParse(values);
  if (!parsed.success) return { error: "Please check the form and try again." };

  const supabase = await createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("deal_analyses")
    .insert(toRow(parsed.data))
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/calculator");
  return { error: null, id: data.id };
}

export async function updateDealAnalysis(
  id: string,
  values: DealFormValues
): Promise<ActionResult> {
  const parsed = dealFormSchema.safeParse(values);
  if (!parsed.success) return { error: "Please check the form and try again." };

  const supabase = await createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: owned } = await supabase
    .from("deal_analyses")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!owned) return { error: "Analysis not found" };

  const { error } = await supabase
    .from("deal_analyses")
    .update(toRow(parsed.data))
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/calculator");
  return { error: null };
}

export async function deleteDealAnalysis(id: string): Promise<ActionResult> {
  const supabase = await createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: owned } = await supabase
    .from("deal_analyses")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!owned) return { error: "Analysis not found" };

  const { error } = await supabase.from("deal_analyses").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/calculator");
  return { error: null };
}
