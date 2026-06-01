"use server";

import {
  differenceInCalendarDays,
  format,
  getISOWeek,
  getISOWeekYear,
} from "date-fns";

import { createClient as createSupabase } from "@/lib/supabase/server";
import {
  getNotificationFeed,
  type NotificationFeed,
} from "@/lib/data/notifications";
import { appointmentTitle, type AppointmentType } from "@/lib/calendar";
import { STAGE_LABELS, type Stage } from "@/lib/crm";
import type { Enums } from "@/lib/supabase/types";

type ActionResult = { error: string | null };
type NotificationType = Enums<"notification_type">;

/**
 * Local time context from the browser, so "today" / "due" boundaries respect
 * the agent's timezone rather than the (UTC) server clock.
 */
export type SyncContext = {
  nowISO: string;
  dayStartISO: string;
  dayEndISO: string;
  todayKey: string; // yyyy-MM-dd (local)
};

type NotificationInsert = {
  agent_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  client_id: string | null;
  appointment_id: string | null;
  dedupe_key: string;
  due_at: string;
};

type Embedded<T> = T | T[] | null | undefined;
function one<T>(value: Embedded<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
function fullName(c: { first_name: string; last_name: string } | null): string {
  return c ? `${c.first_name} ${c.last_name}`.trim() : "a client";
}

export async function syncNotifications(
  ctx: SyncContext
): Promise<ActionResult> {
  const supabase = await createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const agentId = user.id;

  const now = new Date(ctx.nowISO);
  const dayStart = new Date(ctx.dayStartISO);
  const dayEnd = new Date(ctx.dayEndISO);
  const weekKey = `${getISOWeekYear(now)}-W${String(getISOWeek(now)).padStart(
    2,
    "0"
  )}`;
  const rows: NotificationInsert[] = [];

  // ---- 1 & 2: reminders + today's digest (meetings AND dated viewings) ----
  type ApptRow = {
    id: string;
    type: AppointmentType;
    title: string | null;
    client_id: string | null;
    starts_at: string;
    location: string | null;
    reminder_minutes: number | null;
    property_label: string | null;
    client: Embedded<{ first_name: string; last_name: string }>;
    property: Embedded<{ address: string | null; property_type: string | null }>;
  };
  type ViewRow = {
    id: string;
    title: string | null;
    client_id: string;
    scheduled_at: string;
    reminder_minutes: number | null;
    client: Embedded<{ first_name: string; last_name: string }>;
  };
  const [apptRes, viewRes] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, type, title, client_id, starts_at, location, reminder_minutes, property_label, client:clients(first_name, last_name), property:properties(address, property_type)"
      )
      .gte("starts_at", ctx.dayStartISO)
      .order("starts_at", { ascending: true }),
    supabase
      .from("viewings")
      .select(
        "id, title, client_id, scheduled_at, reminder_minutes, client:clients(first_name, last_name)"
      )
      .not("scheduled_at", "is", null)
      .gte("scheduled_at", ctx.dayStartISO),
  ]);

  type SchedEvent = {
    key: string; // dedupe namespace, e.g. "appt:<id>" / "viewing:<id>"
    title: string;
    starts_at: string;
    reminder_minutes: number | null;
    client_id: string | null;
    location: string | null;
    appointment_id: string | null;
  };
  const events: SchedEvent[] = [];

  for (const a of (apptRes.data ?? []) as unknown as ApptRow[]) {
    const prop = one(a.property);
    const propLabel =
      a.property_label || prop?.address || prop?.property_type || null;
    events.push({
      key: `appt:${a.id}`,
      title: appointmentTitle(
        { type: a.type, title: a.title },
        { clientName: fullName(one(a.client)), property: propLabel }
      ),
      starts_at: a.starts_at,
      reminder_minutes: a.reminder_minutes,
      client_id: a.client_id,
      location: a.location,
      appointment_id: a.id,
    });
  }
  for (const v of (viewRes.data ?? []) as unknown as ViewRow[]) {
    const buyer = one(v.client);
    const buyerName = buyer
      ? `${buyer.first_name} ${buyer.last_name}`.trim()
      : null;
    events.push({
      key: `viewing:${v.id}`,
      title: v.title?.trim() || (buyerName ? `Viewing with ${buyerName}` : "Viewing"),
      starts_at: v.scheduled_at,
      reminder_minutes: v.reminder_minutes,
      client_id: v.client_id,
      location: null,
      appointment_id: null,
    });
  }

  const todays: SchedEvent[] = [];
  for (const e of events) {
    const start = new Date(e.starts_at);
    if (e.reminder_minutes != null) {
      const remindAt = new Date(start.getTime() - e.reminder_minutes * 60000);
      if (remindAt.getTime() <= now.getTime()) {
        rows.push({
          agent_id: agentId,
          type: "appointment_reminder",
          title: e.title,
          body: `${format(start, "EEE d MMM, HH:mm")}${
            e.location ? ` · ${e.location}` : ""
          }`,
          client_id: e.client_id,
          appointment_id: e.appointment_id,
          dedupe_key: `reminder:${e.key}`,
          due_at: remindAt.toISOString(),
        });
      }
    }
    if (start >= dayStart && start <= dayEnd) todays.push(e);
  }

  if (todays.length > 0) {
    todays.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const lines = todays
      .slice(0, 3)
      .map((e) => `${format(new Date(e.starts_at), "HH:mm")} · ${e.title}`);
    if (todays.length > 3) lines.push(`+${todays.length - 3} more`);
    rows.push({
      agent_id: agentId,
      type: "appointment_today",
      title: `${todays.length} appointment${
        todays.length > 1 ? "s" : ""
      } today`,
      body: lines.join("\n"),
      client_id: null,
      appointment_id: null,
      dedupe_key: `today-digest:${ctx.todayKey}`,
      due_at: ctx.dayStartISO,
    });
  }

  // ---- 3: follow-up nudges (buyers stuck in new/contacted, 7+ days idle) ----
  const staleBefore = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();
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
    .in("stage", ["new", "contacted"])
    .lte("updated_at", staleBefore);
  for (const c of (staleRes.data ?? []) as StaleRow[]) {
    const days = Math.max(
      1,
      differenceInCalendarDays(now, new Date(c.updated_at))
    );
    rows.push({
      agent_id: agentId,
      type: "follow_up",
      title: `Follow up with ${fullName(c)}`,
      body: `${STAGE_LABELS[c.stage as Stage] ?? c.stage} · no update in ${days} days`,
      client_id: c.id,
      appointment_id: null,
      dedupe_key: `followup:${c.id}:${weekKey}`,
      due_at: ctx.nowISO,
    });
  }

  // ---- 4: reservation key dates within the next 5 days ----
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
    { key: "ppc", col: "ppc_date", label: "PPC payment" },
    { key: "notary", col: "notary_date", label: "Notary" },
    { key: "downpayment", col: "down_payment_date", label: "Down payment" },
  ] as const;
  for (const r of (resRes.data ?? []) as unknown as ResRow[]) {
    const client = one(r.client);
    if (!client || client.is_active === false) continue;
    for (const f of dateFields) {
      const dateStr = r[f.col];
      if (!dateStr) continue;
      const d = new Date(`${dateStr}T00:00:00`);
      const diff = differenceInCalendarDays(d, now);
      if (diff < 0 || diff > 5) continue;
      const when = diff === 0 ? "today" : diff === 1 ? "tomorrow" : `in ${diff} days`;
      rows.push({
        agent_id: agentId,
        type: "reservation_date",
        title: `${f.label} · ${fullName(client)}`,
        body: `${format(d, "EEE d MMM")} (${when})`,
        client_id: r.client_id,
        appointment_id: null,
        dedupe_key: `resdate:${r.client_id}:${f.key}:${dateStr}`,
        due_at: d.toISOString(),
      });
    }
  }

  // ---- 5: stalled offers (offer made but buyer not reserved) ----
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
  const seen = new Set<string>();
  for (const v of (offerRes.data ?? []) as unknown as OfferRow[]) {
    const c = one(v.client);
    if (!c || c.side !== "buyer" || c.is_active === false) continue;
    if (c.stage === "reserved" || seen.has(v.client_id)) continue;
    seen.add(v.client_id);
    rows.push({
      agent_id: agentId,
      type: "stalled_offer",
      title: `Offer pending · ${fullName(c)}`,
      body: "Made an offer but isn't reserved yet — worth a nudge.",
      client_id: v.client_id,
      appointment_id: null,
      dedupe_key: `stalled:${v.client_id}:${weekKey}`,
      due_at: ctx.nowISO,
    });
  }

  if (rows.length > 0) {
    // Upsert refreshes title/body/due_at but leaves read_at untouched
    // (it isn't in the payload), so dismissed notifications stay dismissed.
    const { error } = await supabase
      .from("notifications")
      .upsert(rows, { onConflict: "agent_id,dedupe_key" });
    if (error) return { error: error.message };
  }
  return { error: null };
}

export async function loadNotifications(
  ctx: SyncContext
): Promise<NotificationFeed> {
  await syncNotifications(ctx);
  return getNotificationFeed();
}

export async function markNotificationRead(id: string): Promise<ActionResult> {
  const supabase = await createSupabase();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  return { error: error?.message ?? null };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = await createSupabase();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  return { error: error?.message ?? null };
}
