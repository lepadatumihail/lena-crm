"use server";

import { getISOWeek, getISOWeekYear } from "date-fns";
import { z } from "zod";

import { createClient as createSupabase } from "@/lib/supabase/server";
import {
  getNotificationFeed,
  type NotificationFeed,
} from "@/lib/data/notifications";
import { getAttentionSignals } from "@/lib/data/attention";
import {
  formatDateKey,
  formatInTimeZone,
  formatTimeInTimeZone,
  relativeDayLabel,
} from "@/lib/attention";
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
  timeZone: string; // IANA zone (browser), used to format bodies server-side
};

// The browser supplies SyncContext; malformed values produce Invalid Date /
// NaN comparisons and garbage due_at/dedupe_key rows, so reject them up front.
const syncContextSchema = z.object({
  nowISO: z.iso.datetime(),
  dayStartISO: z.iso.datetime(),
  dayEndISO: z.iso.datetime(),
  todayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeZone: z.string().max(64),
});

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

  const parsed = syncContextSchema.safeParse(ctx);
  if (!parsed.success) return { error: "Invalid sync context" };

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
  // The largest reminder preset is 1 day, so nothing scheduled beyond
  // dayEnd + 2 days can ever produce a reminder or today-digest row.
  const upperISO = new Date(
    new Date(ctx.dayEndISO).getTime() + 2 * 86_400_000
  ).toISOString();
  const [apptRes, viewRes] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, type, title, client_id, starts_at, location, reminder_minutes, property_label, client:clients(first_name, last_name), property:properties(address, property_type)"
      )
      .gte("starts_at", ctx.dayStartISO)
      .lte("starts_at", upperISO)
      .order("starts_at", { ascending: true }),
    supabase
      .from("viewings")
      .select(
        "id, title, client_id, scheduled_at, reminder_minutes, client:clients(first_name, last_name)"
      )
      .not("scheduled_at", "is", null)
      .gte("scheduled_at", ctx.dayStartISO)
      .lte("scheduled_at", upperISO),
  ]);
  if (apptRes.error) return { error: apptRes.error.message };
  if (viewRes.error) return { error: viewRes.error.message };

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
          body: `${formatInTimeZone(e.starts_at, ctx.timeZone)}${
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
      .map((e) => `${formatTimeInTimeZone(e.starts_at, ctx.timeZone)} · ${e.title}`);
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

  // ---- 3-5: shared attention signals (stalled offers, stale buyers,
  // reservation key dates). The stalled-vs-follow-up dedupe lives in the
  // shared module, so both the bell and Home stay in lockstep. ----
  let signals;
  try {
    signals = await getAttentionSignals(supabase, {
      nowISO: ctx.nowISO,
      todayKey: ctx.todayKey,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load signals" };
  }

  for (const o of signals.stalledOffers) {
    rows.push({
      agent_id: agentId,
      type: "stalled_offer",
      title: `Offer pending · ${o.name}`,
      body: "Made an offer but isn't reserved yet — worth a nudge.",
      client_id: o.clientId,
      appointment_id: null,
      dedupe_key: `stalled:${o.clientId}:${weekKey}`,
      due_at: ctx.nowISO,
    });
  }
  for (const b of signals.staleBuyers) {
    rows.push({
      agent_id: agentId,
      type: "follow_up",
      title: `Follow up with ${b.name}`,
      body: `${STAGE_LABELS[b.stage as Stage] ?? b.stage} · no update in ${b.quietDays} days`,
      client_id: b.clientId,
      appointment_id: null,
      dedupe_key: `followup:${b.clientId}:${weekKey}`,
      due_at: ctx.nowISO,
    });
  }
  for (const r of signals.reservationDates) {
    rows.push({
      agent_id: agentId,
      type: "reservation_date",
      title: `${r.label} · ${r.name}`,
      body: `${formatDateKey(r.dateStr)} (${relativeDayLabel(r.diff)})`,
      client_id: r.clientId,
      appointment_id: null,
      dedupe_key: `resdate:${r.clientId}:${r.field}:${r.dateStr}`,
      due_at: `${r.dateStr}T00:00:00Z`,
    });
  }

  const toUpsert = rows;

  if (toUpsert.length > 0) {
    // Upsert refreshes title/body/due_at but leaves read_at untouched
    // (it isn't in the payload), so dismissed notifications stay dismissed.
    const { error } = await supabase
      .from("notifications")
      .upsert(toUpsert, { onConflict: "agent_id,dedupe_key" });
    if (error) return { error: error.message };
  }

  // Keep the table lean: drop notifications that were read over 30 days ago.
  const pruneBefore = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  await supabase.from("notifications").delete().lt("read_at", pruneBefore);

  return { error: null };
}

export async function loadNotifications(
  ctx: SyncContext
): Promise<NotificationFeed> {
  const { error } = await syncNotifications(ctx);
  if (error) throw new Error(error);
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
