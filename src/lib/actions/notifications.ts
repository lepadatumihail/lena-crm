"use server";

import { getISOWeek, getISOWeekYear } from "date-fns";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";

import { createClient as createSupabase } from "@/lib/supabase/server";
import {
  getNotificationFeed,
  getNotificationHistory,
  type NotificationFeed,
  type NotificationHistory,
} from "@/lib/data/notifications";
import { getAttentionSignals } from "@/lib/data/attention";
import { getAgentTimeZone, getSessionUser } from "@/lib/data/session";
import {
  calendarDaysFromToday,
  formatDateKey,
  formatInTimeZone,
  formatTimeInTimeZone,
} from "@/lib/attention";
import { dateKeyInTimeZone, dayRangeInTimeZone } from "@/lib/home";
import { isMissingTableError } from "@/lib/supabase/errors";
import type { AppointmentType } from "@/lib/calendar";
import type { Enums } from "@/lib/supabase/types";
import { appointmentTitleFor } from "@/i18n/appointments";
import { intlTag } from "@/i18n/config";
import { propertyTypeLabel, stageLabel } from "@/i18n/labels";

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
  // Optional on purpose: postgrest-js sends `?columns=` as the union of keys
  // across the upsert batch, so a key present on every row would make the
  // whole sync fail with PGRST204 on a database without the column. Only
  // task_due rows set it, and they only exist once the table does.
  task_id?: string | null;
  dedupe_key: string;
  due_at: string;
};

type Embedded<T> = T | T[] | null | undefined;
function one<T>(value: Embedded<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
type ServerT = Awaited<ReturnType<typeof getTranslations<"server.notifications">>>;
function fullName(
  c: { first_name: string; last_name: string } | null,
  fallback: string
): string {
  return c ? `${c.first_name} ${c.last_name}`.trim() : fallback;
}

function relativeDay(t: ServerT, diff: number): string {
  if (diff === 0) return t("today");
  if (diff === 1) return t("tomorrow");
  return t("inDays", { count: diff });
}

export async function syncNotifications(
  ctx: SyncContext
): Promise<ActionResult> {
  // getSessionUser is the same cached lookup getAgentTimeZone uses, so the
  // auth check and the zone read share one Supabase Auth call.
  const [supabase, t, ta, tc, locale, agentZone, user] = await Promise.all([
    createSupabase(),
    getTranslations("server.notifications"),
    getTranslations("server.appointments"),
    getTranslations("crm"),
    getLocale(),
    getAgentTimeZone(),
    getSessionUser(),
  ]);
  // Task pings use the agent's profile zone and the server's own clock, the
  // same day as the sidebar badge, Home and /tasks, so every device produces
  // the same live task keys and a skewed browser clock near midnight cannot
  // change them. Appointment reminders and the digest keep the browser's day.
  const serverNowISO = new Date().toISOString();
  const taskTodayKey = dateKeyInTimeZone(serverNowISO, agentZone);
  const taskDayStart = new Date(
    dayRangeInTimeZone(serverNowISO, agentZone).start
  );
  const tag = intlTag(locale);
  if (!user) return { error: t("errors.notAuthenticated") };
  const agentId = user.id;

  const parsed = syncContextSchema.safeParse(ctx);
  if (!parsed.success) return { error: t("errors.invalidContext") };

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
  type TaskDueRow = {
    id: string;
    title: string;
    due_on: string;
    client_id: string | null;
    client: Embedded<{ first_name: string; last_name: string }>;
  };
  // The largest reminder preset is 1 day, so nothing scheduled beyond
  // dayEnd + 2 days can ever produce a reminder or today-digest row.
  const upperISO = new Date(
    new Date(ctx.dayEndISO).getTime() + 2 * 86_400_000
  ).toISOString();
  const [apptRes, viewRes, taskRes] = await Promise.all([
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
    supabase
      .from("tasks")
      .select("id, title, due_on, client_id, client:clients(first_name, last_name)")
      .neq("status", "done")
      .lte("due_on", taskTodayKey)
      .order("due_on", { ascending: false }),
  ]);
  if (apptRes.error) return { error: apptRes.error.message };
  if (viewRes.error) return { error: viewRes.error.message };
  if (taskRes.error && !isMissingTableError(taskRes.error)) {
    return { error: taskRes.error.message };
  }

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
      a.property_label ||
      prop?.address ||
      (prop?.property_type ? propertyTypeLabel(tc, prop.property_type) : null);
    events.push({
      key: `appt:${a.id}`,
      title: appointmentTitleFor(
        ta,
        { type: a.type, title: a.title },
        { clientName: fullName(one(a.client), ta("aClient")), property: propLabel }
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
      title:
        v.title?.trim() ||
        (buyerName ? ta("viewingWith", { name: buyerName }) : ta("viewing")),
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
          body: `${formatInTimeZone(e.starts_at, ctx.timeZone, tag)}${
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
      .map(
        (e) => `${formatTimeInTimeZone(e.starts_at, ctx.timeZone, tag)} · ${e.title}`
      );
    if (todays.length > 3) lines.push(t("more", { count: todays.length - 3 }));
    rows.push({
      agent_id: agentId,
      type: "appointment_today",
      title: t("appointmentsToday", { count: todays.length }),
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
    return { error: e instanceof Error ? e.message : t("errors.signals") };
  }

  for (const o of signals.stalledOffers) {
    rows.push({
      agent_id: agentId,
      type: "stalled_offer",
      title: t("offerPending", { name: o.name }),
      body: t("offerPendingBody"),
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
      title: t("followUp", { name: b.name }),
      body: t("followUpBody", {
        stage: stageLabel(tc, b.stage),
        days: b.quietDays,
      }),
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
      title: t("keyDate", { label: t(`keyDates.${r.field}`), name: r.name }),
      body: t("keyDateBody", {
        date: formatDateKey(r.dateStr, tag),
        when: relativeDay(t, r.diff),
      }),
      client_id: r.clientId,
      appointment_id: null,
      dedupe_key: `resdate:${r.clientId}:${r.field}:${r.dateStr}`,
      due_at: `${r.dateStr}T00:00:00Z`,
    });
  }

  // ---- 6: tasks due today or overdue. One row per task per due date, so a
  // rescheduled task pings again; the title is rewritten on every sync, so
  // "due today" turns into "overdue" by itself. Completing the task deletes
  // its unread rows (actions/tasks.ts); deleting the task cascades them.
  // The day is the agent's profile zone (see above). due_at: due-today rows
  // sit at the agent's midnight, overdue rows near 06:00 on their due day (the
  // margin absorbs a DST hour). Both are in the past, so the bell reads
  // "N hours/days ago", never "in N hours", and the page files the row under
  // its due day. ----
  const DAY_MS = 86_400_000;
  const taskRows = (taskRes.data ?? []) as unknown as TaskDueRow[];
  const liveTaskKeys: string[] = [];
  for (const task of taskRows) {
    const late = -calendarDaysFromToday(task.due_on, taskTodayKey);
    const client = one(task.client);
    const dedupe_key = `task-due:${task.id}:${task.due_on}`;
    liveTaskKeys.push(dedupe_key);
    rows.push({
      agent_id: agentId,
      type: "task_due",
      title: late > 0 ? t("taskOverdue", { days: late }) : t("taskDue"),
      body: client ? `${task.title} · ${fullName(client, "")}` : task.title,
      client_id: task.client_id,
      appointment_id: null,
      task_id: task.id,
      dedupe_key,
      due_at:
        late > 0
          ? new Date(
              taskDayStart.getTime() - late * DAY_MS + 6 * 3_600_000
            ).toISOString()
          : taskDayStart.toISOString(),
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

  // Generic prune, minus task pings: their key repeats on every sync while the
  // task stays open and overdue, so pruning a read one would re-ping it unread.
  await supabase
    .from("notifications")
    .delete()
    .lt("read_at", pruneBefore)
    .not("dedupe_key", "like", "task-due:%");

  // Task pings only live while their task is open and due. Remove the ones this
  // sync did not produce: unread ones at once (the task was completed or
  // rescheduled, or a sync raced a completion and put a cleared row back), read
  // ones after the usual 30 days. Skipped when the tasks read failed (table
  // missing) or may be truncated at PostgREST's 1000-row cap, because then a
  // missing key is not proof that a ping is stale.
  if (!taskRes.error && taskRows.length < 1000) {
    const live = new Set(liveTaskKeys);
    // Compare instants, not strings: Postgres returns "+00:00" offsets while
    // pruneBefore ends in "Z".
    const pruneBeforeMs = Date.parse(pruneBefore);
    const { data: pings } = await supabase
      .from("notifications")
      .select("id, dedupe_key, read_at")
      .like("dedupe_key", "task-due:%");
    const staleIds = (pings ?? [])
      .filter(
        (p) =>
          !live.has(p.dedupe_key) &&
          (p.read_at == null || Date.parse(p.read_at) < pruneBeforeMs)
      )
      .map((p) => p.id);
    for (let i = 0; i < staleIds.length; i += 100) {
      await supabase
        .from("notifications")
        .delete()
        .in("id", staleIds.slice(i, i + 100));
    }
  }

  return { error: null };
}

export async function loadNotifications(
  ctx: SyncContext
): Promise<NotificationFeed> {
  const { error } = await syncNotifications(ctx);
  if (error) throw new Error(error);
  return getNotificationFeed();
}

/** One page of the full feed, for the notifications page's "Load more". */
export async function loadNotificationHistory(
  offset: number,
  unreadOnly: boolean
): Promise<NotificationHistory> {
  return getNotificationHistory({ offset, unreadOnly });
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
