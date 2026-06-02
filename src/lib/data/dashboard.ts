import { differenceInCalendarDays, format } from "date-fns";

import { createClient as createSupabase } from "@/lib/supabase/server";
import {
  BUYER_STAGES,
  SELLER_STAGES,
  STAGE_LABELS,
  type Stage,
} from "@/lib/crm";

type Embedded<T> = T | T[] | null;
function one<T>(value: Embedded<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export type StageCount = { stage: string; label: string; count: number };

export async function getPipelineCounts(): Promise<{
  buyer: StageCount[];
  seller: StageCount[];
  buyerTotal: number;
  sellerTotal: number;
}> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("side, stage")
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  const rows = data ?? [];

  const tally = (stages: readonly Stage[], side: string): StageCount[] =>
    stages.map((s) => ({
      stage: s,
      label: STAGE_LABELS[s],
      count: rows.filter((c) => c.side === side && c.stage === s).length,
    }));

  return {
    buyer: tally(BUYER_STAGES, "buyer"),
    seller: tally(SELLER_STAGES, "seller"),
    buyerTotal: rows.filter((c) => c.side === "buyer").length,
    sellerTotal: rows.filter((c) => c.side === "seller").length,
  };
}

export type AttentionItem = {
  id: string;
  kind: "stalled_offer" | "follow_up" | "reservation";
  title: string;
  detail: string;
  href: string;
};

/**
 * Action items for the Home cockpit: pending offers, quiet leads, and
 * upcoming reservation dates. Read-only mirror of the notification signals.
 */
export async function getNeedsAttention(): Promise<AttentionItem[]> {
  const supabase = await createSupabase();
  const now = new Date();
  const items: AttentionItem[] = [];

  // Stalled offers — buyers with an offer who aren't reserved yet.
  type OfferRow = {
    client_id: string;
    client: Embedded<{
      first_name: string;
      last_name: string;
      side: string;
      is_active: boolean;
      stage: string;
    }>;
  };
  const offerRes = await supabase
    .from("viewings")
    .select(
      "client_id, client:clients(first_name, last_name, side, is_active, stage)"
    )
    .eq("had_offer", true);
  const stalled = new Set<string>();
  for (const v of (offerRes.data ?? []) as unknown as OfferRow[]) {
    const c = one(v.client);
    if (!c || c.side !== "buyer" || c.is_active === false) continue;
    if (c.stage === "reserved" || stalled.has(v.client_id)) continue;
    stalled.add(v.client_id);
    items.push({
      id: `stalled:${v.client_id}`,
      kind: "stalled_offer",
      title: `${c.first_name} ${c.last_name}`.trim(),
      detail: "Made an offer — not reserved yet",
      href: `/clients/${v.client_id}?compose=offer_followup`,
    });
  }

  // Follow-ups — any active, non-reserved buyer quiet for 7+ days.
  const staleBefore = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  type StaleRow = {
    id: string;
    first_name: string;
    last_name: string;
    stage: string;
    updated_at: string;
  };
  const staleRes = await supabase
    .from("clients")
    .select("id, first_name, last_name, stage, updated_at")
    .eq("side", "buyer")
    .eq("is_active", true)
    .neq("stage", "reserved")
    .lte("updated_at", staleBefore);
  for (const c of (staleRes.data ?? []) as StaleRow[]) {
    if (stalled.has(c.id)) continue;
    const days = Math.max(
      1,
      differenceInCalendarDays(now, new Date(c.updated_at))
    );
    items.push({
      id: `followup:${c.id}`,
      kind: "follow_up",
      title: `${c.first_name} ${c.last_name}`.trim(),
      detail: `${STAGE_LABELS[c.stage as Stage] ?? c.stage} · quiet ${days} days`,
      href: `/clients/${c.id}?compose=check_in`,
    });
  }

  // Reservation key dates within the next 5 days.
  type ResRow = {
    client_id: string;
    ppc_date: string | null;
    notary_date: string | null;
    down_payment_date: string | null;
    client: Embedded<{ first_name: string; last_name: string; is_active: boolean }>;
  };
  const resRes = await supabase
    .from("reservations")
    .select(
      "client_id, ppc_date, notary_date, down_payment_date, client:clients(first_name, last_name, is_active)"
    );
  const dateFields = [
    { col: "ppc_date", label: "PPC payment" },
    { col: "notary_date", label: "Notary" },
    { col: "down_payment_date", label: "Down payment" },
  ] as const;
  for (const r of (resRes.data ?? []) as unknown as ResRow[]) {
    const c = one(r.client);
    if (!c || c.is_active === false) continue;
    for (const f of dateFields) {
      const dateStr = r[f.col];
      if (!dateStr) continue;
      const d = new Date(`${dateStr}T00:00:00`);
      const diff = differenceInCalendarDays(d, now);
      if (diff < 0 || diff > 5) continue;
      const when = diff === 0 ? "today" : diff === 1 ? "tomorrow" : `in ${diff} days`;
      items.push({
        id: `resdate:${r.client_id}:${f.col}`,
        kind: "reservation",
        title: `${c.first_name} ${c.last_name}`.trim(),
        detail: `${f.label} · ${format(d, "EEE d MMM")} (${when})`,
        href: `/clients/${r.client_id}`,
      });
    }
  }

  return items;
}
