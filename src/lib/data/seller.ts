import { createClient as createSupabase } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/errors";
import type { Property, PropertyAttachment } from "@/lib/supabase/types";

export type ListingMatch = {
  property: Property;
  sellerId: string;
  sellerName: string;
};

export type PropertyWithAttachments = Property & {
  /** Its PDFs and photos, oldest first; null until the property_attachments table exists. */
  attachments: PropertyAttachment[] | null;
};

/** Find the agent's active seller listings that fit a buyer's preferences. */
export async function getMatchingListings(prefs: {
  property_types: string[];
  budget_min: number | null;
  budget_max: number | null;
  bedrooms: number | null;
}): Promise<ListingMatch[]> {
  const supabase = await createSupabase();

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const props = properties ?? [];
  if (props.length === 0) return [];

  const sellerIds = [...new Set(props.map((p) => p.client_id))];
  const { data: sellers, error: sellerError } = await supabase
    .from("clients")
    .select("id, first_name, last_name, is_active")
    .in("id", sellerIds);
  if (sellerError) throw new Error(sellerError.message);

  const sellerMap = new Map((sellers ?? []).map((s) => [s.id, s]));
  const types = prefs.property_types ?? [];
  const matches: ListingMatch[] = [];

  for (const p of props) {
    const seller = sellerMap.get(p.client_id);
    if (!seller || !seller.is_active) continue;
    if (types.length && p.property_type && !types.includes(p.property_type))
      continue;
    if (p.price != null) {
      if (prefs.budget_min != null && p.price < prefs.budget_min) continue;
      if (prefs.budget_max != null && p.price > prefs.budget_max) continue;
    }
    if (prefs.bedrooms != null && p.bedrooms != null && p.bedrooms < prefs.bedrooms)
      continue;
    matches.push({
      property: p,
      sellerId: seller.id,
      sellerName: `${seller.first_name} ${seller.last_name}`.trim(),
    });
  }
  return matches;
}

export async function getProperties(
  clientId: string
): Promise<PropertyWithAttachments[]> {
  const supabase = await createSupabase();
  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const ids = (properties ?? []).map((p) => p.id);
  const byProperty = new Map<string, PropertyAttachment[]>();
  // A deploy can land before its migration: without the table the page still
  // renders, only without files and without the attach menu.
  let attachmentsReady = true;
  if (ids.length) {
    const { data: atts, error: attError } = await supabase
      .from("property_attachments")
      .select("*")
      .in("property_id", ids)
      .order("created_at", { ascending: true });
    if (isMissingTableError(attError)) attachmentsReady = false;
    else if (attError) throw new Error(attError.message);
    for (const a of atts ?? []) {
      const list = byProperty.get(a.property_id) ?? [];
      list.push(a);
      byProperty.set(a.property_id, list);
    }
  }

  return (properties ?? []).map((p) => ({
    ...p,
    attachments: attachmentsReady ? (byProperty.get(p.id) ?? []) : null,
  }));
}
