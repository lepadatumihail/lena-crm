import { createClient as createSupabase } from "@/lib/supabase/server";
import {
  BUYER_STAGES,
  SELLER_STAGES,
  STAGE_LABELS,
  type Stage,
} from "@/lib/crm";
import { getAttentionSignals } from "@/lib/data/attention";
import { formatDateKey, relativeDayLabel } from "@/lib/attention";

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
  // Server-clock day boundary (UTC in prod). The bell uses the browser's;
  // near-midnight drift here is accepted.
  const now = new Date();
  const ctx = { nowISO: now.toISOString(), todayKey: now.toISOString().slice(0, 10) };
  const signals = await getAttentionSignals(supabase, ctx);
  const items: AttentionItem[] = [];

  // The DB column name backs the (byte-stable) AttentionItem id.
  const RES_COL: Record<"ppc" | "notary" | "downpayment", string> = {
    ppc: "ppc_date",
    notary: "notary_date",
    downpayment: "down_payment_date",
  };

  for (const o of signals.stalledOffers) {
    items.push({
      id: `stalled:${o.clientId}`,
      kind: "stalled_offer",
      title: o.name,
      detail: "Made an offer — not reserved yet",
      href: `/clients/${o.clientId}?compose=offer_followup`,
    });
  }

  for (const b of signals.staleBuyers) {
    items.push({
      id: `followup:${b.clientId}`,
      kind: "follow_up",
      title: b.name,
      detail: `${STAGE_LABELS[b.stage as Stage] ?? b.stage} · quiet ${b.quietDays} days`,
      href: `/clients/${b.clientId}?compose=check_in`,
    });
  }

  for (const r of signals.reservationDates) {
    items.push({
      id: `resdate:${r.clientId}:${RES_COL[r.field]}`,
      kind: "reservation",
      title: r.name,
      detail: `${r.label} · ${formatDateKey(r.dateStr)} (${relativeDayLabel(r.diff)})`,
      href: `/clients/${r.clientId}`,
    });
  }

  return items;
}
