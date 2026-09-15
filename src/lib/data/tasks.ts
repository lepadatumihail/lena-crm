import { cache } from "react";

import { isMissingTableError } from "@/lib/supabase/errors";
import { createClient as createSupabase } from "@/lib/supabase/server";
import type { Task } from "@/lib/supabase/types";
import { DONE_MAX, DONE_PAGE_SIZE } from "@/lib/tasks";

type Embedded<T> = T | T[] | null;
function one<T>(value: Embedded<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export type TaskClientRef = { id: string; first_name: string; last_name: string; side: string };

/** A task with the client it is about, if any. */
export type TaskRow = Task & { client: TaskClientRef | null };
type RawTaskRow = Task & { client: Embedded<TaskClientRef> };

const TASK_SELECT = "*, client:clients(id, first_name, last_name, side)";
const toRow = (raw: RawTaskRow): TaskRow => ({ ...raw, client: one(raw.client) });

/** A client scope for done tasks: one client's id, "none" for tasks without a client, or null for all. */
export type DoneScope = string | "none" | null;

async function openTasks(clientId?: string): Promise<TaskRow[] | null> {
  const supabase = await createSupabase();
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .neq("status", "done")
    .order("priority", { ascending: false })
    .order("due_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (clientId) query = query.eq("client_id", clientId);
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(error.message);
  }
  return ((data ?? []) as unknown as RawTaskRow[]).map(toRow);
}

/** Every open task, for the tasks page. `null` = the table isn't there yet. */
export const getOpenTasks = (): Promise<TaskRow[] | null> => openTasks();

/** A client's open tasks, for the panel on their page. `null` = not ready. */
export const getClientTasks = (clientId: string): Promise<TaskRow[] | null> => openTasks(clientId);

export type DoneTasksPage = { rows: TaskRow[]; hasMore: boolean };

/**
 * The first `limit` done tasks, newest completed first, optionally scoped to
 * one client or to tasks without a client. The Done tab asks for a bigger
 * limit on "Load more", so every re-render after a change returns the whole
 * loaded range and nothing has to be stitched together in the browser.
 * `null` = not ready.
 */
export async function getDoneTasks({
  limit = DONE_PAGE_SIZE,
  clientId = null,
}: { limit?: number; clientId?: DoneScope } = {}): Promise<DoneTasksPage | null> {
  const supabase = await createSupabase();
  const size = Math.min(DONE_MAX, Math.max(1, Math.trunc(limit)));
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("status", "done")
    .order("completed_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    // inclusive range: one row past the limit, purely to know whether "Load more" is warranted
    .range(0, size);
  if (clientId === "none") query = query.is("client_id", null);
  else if (clientId) query = query.eq("client_id", clientId);
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(error.message);
  }
  const rows = ((data ?? []) as unknown as RawTaskRow[]).map(toRow);
  // At DONE_MAX there is no bigger page to ask for, so stop offering "Load more".
  const hasMore = size < DONE_MAX && rows.length > size;
  return { rows: rows.slice(0, size), hasMore };
}

/** Open tasks due on `todayKey` or earlier, most overdue first, for Home. `null` = not ready. */
export const getDueTasks = cache(async (todayKey: string, limit: number): Promise<TaskRow[] | null> => {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .neq("status", "done")
    .lte("due_on", todayKey)
    .order("due_on", { ascending: true })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(error.message);
  }
  return ((data ?? []) as unknown as RawTaskRow[]).map(toRow);
});

/**
 * Open tasks due today or overdue, for the sidebar badge and Home's count.
 * Never throws: the layout renders every page, so a tasks problem must cost
 * the badge, not the app. A HEAD request against a missing table returns no
 * error and no count, which lands on the same `null`. Cached per request
 * because the layout and Home both ask.
 */
export const countDueTasks = cache(async (todayKey: string): Promise<number | null> => {
  try {
    const supabase = await createSupabase();
    const { count, error } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .neq("status", "done")
      .lte("due_on", todayKey);
    if (error) return null;
    return count ?? null;
  } catch {
    return null;
  }
});

/** One task, or null when missing, not the agent's, table absent, or the id is not a uuid. */
export async function getTaskById(id: string): Promise<TaskRow | null> {
  const supabase = await createSupabase();
  const { data, error } = await supabase.from("tasks").select(TASK_SELECT).eq("id", id).maybeSingle();
  if (error) {
    // 22P02: invalid_text_representation — not a uuid.
    if (isMissingTableError(error) || error.code === "22P02") return null;
    throw new Error(error.message);
  }
  return data ? toRow(data as unknown as RawTaskRow) : null;
}
