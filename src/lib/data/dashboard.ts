import { cache } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import { createClient as createSupabase } from "@/lib/supabase/server";
import { BUYER_STAGES, SELLER_STAGES, type ClientSide, type Stage } from "@/lib/crm";
import { getAttentionSignals } from "@/lib/data/attention";
import { getCalendarEvents, type CalendarEvent } from "@/lib/data/calendar";
import { getAgentTimeZone, getSessionUser } from "@/lib/data/session";
import { formatDateKey } from "@/lib/attention";
import { dateKeyInTimeZone, type OnboardingInput } from "@/lib/home";
import { intlTag } from "@/i18n/config";
import { stageLabel } from "@/i18n/labels";

/*
  Home's data, one loader per section so each section streams on its own.
  Every loader is wrapped in React's `cache`: sections that need the same
  thing (the client scan, the next month of events) share one query within a
  request instead of asking again.
*/

export type StageCount = { stage: Stage; count: number };

export type PipelineCounts = {
  buyer: StageCount[];
  seller: StageCount[];
  buyerTotal: number;
  sellerTotal: number;
};

type ClientRow = {
  id: string;
  side: ClientSide;
  stage: string;
  first_name: string;
  last_name: string;
  priority: boolean;
  created_at: string;
  updated_at: string;
};

function tallyPipeline(rows: ClientRow[]): PipelineCounts {
  const tally = (stages: readonly Stage[], side: string): StageCount[] =>
    stages.map((s) => ({
      stage: s,
      count: rows.filter((c) => c.side === side && c.stage === s).length,
    }));
  return {
    buyer: tally(BUYER_STAGES, "buyer"),
    seller: tally(SELLER_STAGES, "seller"),
    buyerTotal: rows.filter((c) => c.side === "buyer").length,
    sellerTotal: rows.filter((c) => c.side === "seller").length,
  };
}

/** The agent's active clients, most recently touched first. */
const getActiveClients = cache(async (): Promise<ClientRow[]> => {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("id, side, stage, first_name, last_name, priority, created_at, updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientRow[];
});

/** Active clients per stage: the stat tiles and the upcoming panel's empty state. */
export const getPipelineCounts = cache(
  async (): Promise<PipelineCounts> => tallyPipeline(await getActiveClients())
);

/** A row in the Home "Recent clients" list. */
export type RecentClient = {
  id: string;
  name: string;
  side: ClientSide;
  stage: string;
  priority: boolean;
  /** Buyer budget ceiling or the seller's first listed asking price. */
  amount: number | null;
  updated_at: string;
};

const RECENT_LIMIT = 6;

/** The clients touched most recently, each with a budget or an asking price. */
export const getRecentClients = cache(async (): Promise<RecentClient[]> => {
  const recentRows = (await getActiveClients()).slice(0, RECENT_LIMIT);
  if (recentRows.length === 0) return [];
  const buyerIds = recentRows.filter((c) => c.side === "buyer").map((c) => c.id);
  const sellerIds = recentRows.filter((c) => c.side === "seller").map((c) => c.id);

  const supabase = await createSupabase();
  const [prefsRes, propsRes] = await Promise.all([
    buyerIds.length
      ? supabase
          .from("buyer_preferences")
          .select("client_id, budget_max")
          .in("client_id", buyerIds)
      : Promise.resolve({ data: [], error: null }),
    sellerIds.length
      ? supabase
          .from("properties")
          .select("client_id, price, created_at")
          .in("client_id", sellerIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (prefsRes.error) throw new Error(prefsRes.error.message);
  if (propsRes.error) throw new Error(propsRes.error.message);

  const amountByClient = new Map<string, number | null>();
  for (const p of prefsRes.data ?? []) amountByClient.set(p.client_id, p.budget_max);
  for (const p of propsRes.data ?? []) {
    // Earliest listing wins; later rows for the same seller are ignored.
    if (!amountByClient.has(p.client_id)) amountByClient.set(p.client_id, p.price);
  }

  return recentRows.map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`.trim(),
    side: c.side,
    stage: c.stage,
    priority: c.priority,
    amount: amountByClient.get(c.id) ?? null,
    updated_at: c.updated_at,
  }));
});

/** How far the account is set up, for the getting-started checklist. */
export const getOnboardingInput = cache(async (): Promise<OnboardingInput> => {
  const supabase = await createSupabase();
  const [clients, appointmentsRes, templatesRes, referralCount] = await Promise.all([
    getActiveClients(),
    supabase.from("appointments").select("id", { count: "exact", head: true }),
    supabase.from("email_templates").select("id", { count: "exact", head: true }),
    getSessionUser().then(async (user) => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("inviter_id", user.id);
      if (error) throw new Error(error.message);
      return count ?? 0;
    }),
  ]);
  if (appointmentsRes.error) throw new Error(appointmentsRes.error.message);
  if (templatesRes.error) throw new Error(templatesRes.error.message);

  return {
    clientCount: clients.length,
    appointmentCount: appointmentsRes.count ?? 0,
    templateCount: templatesRes.count ?? 0,
    referralCount,
  };
});

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/**
 * Calendar events from an hour before `nowISO` to 30 days after it. Keyed on
 * the instant, so the stat tiles and the upcoming panel of one render share
 * a single fetch.
 */
export const getHomeEvents = cache(
  async (nowISO: string): Promise<CalendarEvent[]> => {
    const now = Date.parse(nowISO);
    return getCalendarEvents(
      new Date(now - HOUR_MS).toISOString(),
      new Date(now + 30 * DAY_MS).toISOString()
    );
  }
);

export type AttentionItem = {
  id: string;
  kind: "new_lead" | "stalled_offer" | "follow_up" | "reservation";
  title: string;
  detail: string;
  href: string;
};

/**
 * Action items for the Home cockpit, most time-critical first: reservation
 * key dates, leads nobody has contacted yet, pending offers, quiet leads. The last three are a
 * read-only mirror of the notification signals; new leads are Home-only so
 * the bell doesn't ping the agent about a client they just typed in.
 * Titles are client names; the details are rendered in the agent's UI
 * language (this always runs inside a request).
 */
export const getNeedsAttention = cache(async (): Promise<AttentionItem[]> => {
  const [t, tCrm, locale, timeZone] = await Promise.all([
    getTranslations("home"),
    getTranslations("crm"),
    getLocale(),
    getAgentTimeZone(),
  ]);
  const supabase = await createSupabase();
  // Days turn over at the agent's own midnight, so "tomorrow" means theirs.
  const now = new Date();
  const ctx = {
    nowISO: now.toISOString(),
    todayKey: dateKeyInTimeZone(now.toISOString(), timeZone),
  };
  const [signals, newLeadsRes] = await Promise.all([
    getAttentionSignals(supabase, ctx),
    supabase
      .from("clients")
      .select("id, side, first_name, last_name, created_at")
      .eq("is_active", true)
      .or("and(side.eq.buyer,stage.eq.new),and(side.eq.seller,stage.eq.pending)")
      .order("created_at", { ascending: false }),
  ]);
  if (newLeadsRes.error) throw new Error(newLeadsRes.error.message);
  const items: AttentionItem[] = [];

  // The DB column name backs the (byte-stable) AttentionItem id.
  const RES_COL: Record<"ppc" | "notary" | "downpayment", string> = {
    ppc: "ppc_date",
    notary: "notary_date",
    downpayment: "down_payment_date",
  };

  for (const r of signals.reservationDates) {
    // `r.label` is the English fallback from the signal; the UI language wins.
    const when =
      r.diff === 0
        ? t("attention.relative.today")
        : r.diff === 1
          ? t("attention.relative.tomorrow")
          : t("attention.relative.inDays", { count: r.diff });
    items.push({
      id: `resdate:${r.clientId}:${RES_COL[r.field]}`,
      kind: "reservation",
      title: r.name,
      detail: t("attention.reservation", {
        label: t(`attention.reservationFields.${r.field}`),
        date: formatDateKey(r.dateStr, intlTag(locale)),
        when,
      }),
      href: `/clients/${r.clientId}`,
    });
  }

  // Stale buyers already cover "new" leads older than STALE_AFTER_DAYS.
  const staleIds = new Set(signals.staleBuyers.map((b) => b.clientId));
  for (const c of newLeadsRes.data ?? []) {
    if (staleIds.has(c.id)) continue;
    items.push({
      id: `newlead:${c.id}`,
      kind: "new_lead",
      title: `${c.first_name} ${c.last_name}`.trim(),
      detail: t(c.side === "buyer" ? "attention.newBuyer" : "attention.newSeller"),
      href:
        c.side === "buyer"
          ? `/clients/${c.id}?compose=intro`
          : `/clients/${c.id}`,
    });
  }

  for (const o of signals.stalledOffers) {
    items.push({
      id: `stalled:${o.clientId}`,
      kind: "stalled_offer",
      title: o.name,
      detail: t("attention.stalledOffer"),
      href: `/clients/${o.clientId}?compose=offer_followup`,
    });
  }

  for (const b of signals.staleBuyers) {
    items.push({
      id: `followup:${b.clientId}`,
      kind: "follow_up",
      title: b.name,
      detail: t("attention.followUp", {
        stage: stageLabel(tCrm, b.stage),
        days: b.quietDays,
      }),
      href: `/clients/${b.clientId}?compose=check_in`,
    });
  }

  return items;
});
