import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import {
  calendarDaysFromToday,
  RESERVATION_LOOKAHEAD_DAYS,
  STALE_AFTER_DAYS,
} from "@/lib/attention";

/**
 * The shared "attention" signals — pending offers, quiet leads, and upcoming
 * reservation key dates. Both the notifications sync and the Home cockpit read
 * from here so they can never diverge again.
 *
 * Data-module convention (see src/lib/data/clients.ts): throw on query error;
 * callers decide how to surface it.
 */

export type AttentionContext = { nowISO: string; todayKey: string };

export type StalledOffer = { clientId: string; name: string };
export type StaleBuyer = {
  clientId: string;
  name: string;
  stage: string;
  quietDays: number;
};
export type ReservationDate = {
  clientId: string;
  name: string;
  field: "ppc" | "notary" | "downpayment";
  label: string;
  dateStr: string;
  diff: number;
};

type Embedded<T> = T | T[] | null | undefined;
function one<T>(value: Embedded<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
function fullName(c: { first_name: string; last_name: string }): string {
  return `${c.first_name} ${c.last_name}`.trim();
}

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
type StaleRow = {
  id: string;
  first_name: string;
  last_name: string;
  stage: string;
  updated_at: string;
};
type ResRow = {
  client_id: string;
  ppc_date: string | null;
  notary_date: string | null;
  down_payment_date: string | null;
  client: Embedded<{ first_name: string; last_name: string; is_active: boolean }>;
};

const RESERVATION_FIELDS = [
  { key: "ppc", col: "ppc_date", label: "PPC payment" },
  { key: "notary", col: "notary_date", label: "Notary" },
  { key: "downpayment", col: "down_payment_date", label: "Down payment" },
] as const;

export async function getAttentionSignals(
  supabase: SupabaseClient<Database>,
  ctx: AttentionContext
): Promise<{
  stalledOffers: StalledOffer[];
  staleBuyers: StaleBuyer[];
  reservationDates: ReservationDate[];
}> {
  const staleBefore = new Date(
    new Date(ctx.nowISO).getTime() - STALE_AFTER_DAYS * 86_400_000
  ).toISOString();

  const [offerRes, staleRes, resRes] = await Promise.all([
    supabase
      .from("viewings")
      .select(
        "client_id, client:clients(first_name, last_name, side, is_active, stage)"
      )
      .eq("had_offer", true),
    supabase
      .from("clients")
      .select("id, first_name, last_name, stage, updated_at")
      .eq("side", "buyer")
      .eq("is_active", true)
      .neq("stage", "reserved")
      .lte("updated_at", staleBefore),
    supabase
      .from("reservations")
      .select(
        "client_id, ppc_date, notary_date, down_payment_date, client:clients(first_name, last_name, is_active)"
      ),
  ]);

  if (offerRes.error) throw new Error(offerRes.error.message);
  if (staleRes.error) throw new Error(staleRes.error.message);
  if (resRes.error) throw new Error(resRes.error.message);

  // ---- Stalled offers: buyers who made an offer but aren't reserved yet ----
  const stalledOffers: StalledOffer[] = [];
  const stalledClients = new Set<string>();
  for (const v of (offerRes.data ?? []) as unknown as OfferRow[]) {
    const c = one(v.client);
    if (!c || c.side !== "buyer" || c.is_active === false) continue;
    if (c.stage === "reserved" || stalledClients.has(v.client_id)) continue;
    stalledClients.add(v.client_id);
    stalledOffers.push({ clientId: v.client_id, name: fullName(c) });
  }

  // ---- Stale buyers: active, non-reserved buyers quiet for 7+ days. A client
  // already flagged as a stalled offer doesn't also need a generic follow-up.
  const staleBuyers: StaleBuyer[] = [];
  for (const c of (staleRes.data ?? []) as StaleRow[]) {
    if (stalledClients.has(c.id)) continue;
    const quietDays = Math.max(
      1,
      -calendarDaysFromToday(c.updated_at.slice(0, 10), ctx.todayKey)
    );
    staleBuyers.push({
      clientId: c.id,
      name: fullName(c),
      stage: c.stage,
      quietDays,
    });
  }

  // ---- Reservation key dates within the next RESERVATION_LOOKAHEAD_DAYS days ----
  const reservationDates: ReservationDate[] = [];
  for (const r of (resRes.data ?? []) as unknown as ResRow[]) {
    const c = one(r.client);
    if (!c || c.is_active === false) continue;
    for (const f of RESERVATION_FIELDS) {
      const dateStr = r[f.col];
      if (!dateStr) continue;
      const diff = calendarDaysFromToday(dateStr, ctx.todayKey);
      if (diff < 0 || diff > RESERVATION_LOOKAHEAD_DAYS) continue;
      reservationDates.push({
        clientId: r.client_id,
        name: fullName(c),
        field: f.key,
        label: f.label,
        dateStr,
        diff,
      });
    }
  }

  return { stalledOffers, staleBuyers, reservationDates };
}
