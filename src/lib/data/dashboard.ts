import { getLocale, getTranslations } from "next-intl/server";

import { createClient as createSupabase } from "@/lib/supabase/server";
import { BUYER_STAGES, SELLER_STAGES, type ClientSide, type Stage } from "@/lib/crm";
import { getAttentionSignals } from "@/lib/data/attention";
import { formatDateKey } from "@/lib/attention";
import { firstNameFrom, type OnboardingInput } from "@/lib/home";
import { intlTag } from "@/i18n/config";
import { stageLabel } from "@/i18n/labels";

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

export async function getPipelineCounts(): Promise<PipelineCounts> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("side, stage")
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  return tallyPipeline((data ?? []) as ClientRow[]);
}

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

export type HomeOverview = {
  /** The agent's first name for the greeting, when we know it. */
  firstName: string | null;
  counts: PipelineCounts;
  recent: RecentClient[];
  onboarding: OnboardingInput;
};

const RECENT_LIMIT = 6;

/**
 * Everything on Home that comes from the agent's own book: pipeline counts,
 * the recently touched clients, and the "getting started" checklist inputs.
 * One client scan feeds all three so the page does a single round of queries.
 */
export async function getHomeOverview(): Promise<HomeOverview> {
  const supabase = await createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [clientsRes, profileRes, appointmentsRes, templatesRes, referralsRes] =
    await Promise.all([
      supabase
        .from("clients")
        .select(
          "id, side, stage, first_name, last_name, priority, created_at, updated_at"
        )
        .eq("is_active", true)
        .order("updated_at", { ascending: false }),
      user
        ? supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase.from("appointments").select("id", { count: "exact", head: true }),
      supabase.from("email_templates").select("id", { count: "exact", head: true }),
      user
        ? supabase
            .from("referrals")
            .select("id", { count: "exact", head: true })
            .eq("inviter_id", user.id)
        : Promise.resolve({ count: 0, error: null }),
    ]);

  if (clientsRes.error) throw new Error(clientsRes.error.message);
  if (profileRes.error) throw new Error(profileRes.error.message);
  if (appointmentsRes.error) throw new Error(appointmentsRes.error.message);
  if (templatesRes.error) throw new Error(templatesRes.error.message);
  if (referralsRes.error) throw new Error(referralsRes.error.message);

  const rows = (clientsRes.data ?? []) as ClientRow[];
  const recentRows = rows.slice(0, RECENT_LIMIT);
  const buyerIds = recentRows.filter((c) => c.side === "buyer").map((c) => c.id);
  const sellerIds = recentRows.filter((c) => c.side === "seller").map((c) => c.id);

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

  const recent: RecentClient[] = recentRows.map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`.trim(),
    side: c.side,
    stage: c.stage,
    priority: c.priority,
    amount: amountByClient.get(c.id) ?? null,
    updated_at: c.updated_at,
  }));

  return {
    firstName: firstNameFrom(profileRes.data?.full_name, user?.email),
    counts: tallyPipeline(rows),
    recent,
    onboarding: {
      clientCount: rows.length,
      appointmentCount: appointmentsRes.count ?? 0,
      templateCount: templatesRes.count ?? 0,
      referralCount: referralsRes.count ?? 0,
    },
  };
}

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
export async function getNeedsAttention(): Promise<AttentionItem[]> {
  const [t, tCrm, locale] = await Promise.all([
    getTranslations("home"),
    getTranslations("crm"),
    getLocale(),
  ]);
  const supabase = await createSupabase();
  // Server-clock day boundary (UTC in prod). The bell uses the browser's;
  // near-midnight drift here is accepted.
  const now = new Date();
  const ctx = { nowISO: now.toISOString(), todayKey: now.toISOString().slice(0, 10) };
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
}
