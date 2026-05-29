import { createClient as createSupabase } from "@/lib/supabase/server";
import type {
  BuyerPreferences,
  Reservation,
  Viewing,
  ViewingAttachment,
} from "@/lib/supabase/types";

export type ViewingWithAttachments = Viewing & {
  attachments: ViewingAttachment[];
};

export async function getBuyerPreferences(
  clientId: string
): Promise<BuyerPreferences | null> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("buyer_preferences")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getViewings(
  clientId: string
): Promise<ViewingWithAttachments[]> {
  const supabase = await createSupabase();
  const { data: viewings, error } = await supabase
    .from("viewings")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const ids = (viewings ?? []).map((v) => v.id);
  const byViewing = new Map<string, ViewingAttachment[]>();
  if (ids.length) {
    const { data: atts, error: attError } = await supabase
      .from("viewing_attachments")
      .select("*")
      .in("viewing_id", ids);
    if (attError) throw new Error(attError.message);
    for (const a of atts ?? []) {
      const list = byViewing.get(a.viewing_id) ?? [];
      list.push(a);
      byViewing.set(a.viewing_id, list);
    }
  }

  return (viewings ?? []).map((v) => ({
    ...v,
    attachments: byViewing.get(v.id) ?? [],
  }));
}

export async function getCommissionSummary(): Promise<{
  pipeline: number;
  closed: number;
}> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("reservations")
    .select("commission, closed_at");
  if (error) throw new Error(error.message);

  let pipeline = 0;
  let closed = 0;
  for (const r of data ?? []) {
    const amount = r.commission ?? 0;
    if (r.closed_at) closed += amount;
    else pipeline += amount;
  }
  return { pipeline, closed };
}

export async function getReservation(
  clientId: string
): Promise<Reservation | null> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
