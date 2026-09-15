/**
 * Pure helpers for tasks: the status and priority vocabularies, their tones,
 * due-date states, page sizes and the default ordering. No I/O, so the list,
 * the board, the Home panel and the notification sync all agree, and client
 * components can import it.
 */
import { calendarDaysFromToday } from "@/lib/attention";
import type { Task, TaskPriority, TaskStatus } from "@/lib/supabase/types";
import type { Tone } from "@/lib/tones";

export type { Task, TaskPriority, TaskStatus };

/** Every status, in board-column order. */
export const TASK_STATUSES = ["todo", "in_progress", "waiting", "done"] as const satisfies readonly TaskStatus[];

/** The statuses that still need doing: everything but done. */
export const OPEN_TASK_STATUSES = ["todo", "in_progress", "waiting"] as const satisfies readonly TaskStatus[];

/** Every priority, lowest first — the Postgres enum's own order. */
export const TASK_PRIORITIES = ["none", "low", "medium", "high", "urgent"] as const satisfies readonly TaskPriority[];

/** Higher sorts first. Mirrors the enum's declaration order (`order by priority desc`). */
export const PRIORITY_RANK: Record<TaskPriority, number> = { none: 0, low: 1, medium: 2, high: 3, urgent: 4 };

/** Done tasks per step of the Done tab ("Load more" adds another step). */
export const DONE_PAGE_SIZE = 40;
/** The most done tasks one page render will ask for. */
export const DONE_MAX = 1000;
/** Done cards the board shows before pointing at the Done tab. */
export const BOARD_DONE_LIMIT = 8;
/** Rows Home's Due today panel shows; the header still counts them all. */
export const DUE_TASKS_LIMIT = 6;

/** One tone per status: board column dots, list section dots, status glyphs. */
export const TASK_STATUS_TONES: Record<TaskStatus, Tone> = {
  todo: "neutral",
  in_progress: "blue",
  waiting: "amber",
  done: "green",
};

/**
 * Linear's convention: the bars say the level, only Urgent is coloured.
 * Colour on a row stays reserved for the due date and the status.
 */
export const TASK_PRIORITY_TONES: Record<TaskPriority, Tone> = {
  none: "neutral",
  low: "neutral",
  medium: "neutral",
  high: "neutral",
  urgent: "orange",
};

export type DueState = "overdue" | "today" | "tomorrow" | "upcoming" | "none";

/**
 * Where a due date stands against the agent's `todayKey` (yyyy-MM-dd in
 * their time zone). Pure day arithmetic on the keys, so it is immune to the
 * process time zone and to DST.
 */
export function dueState(dueOn: string | null, todayKey: string): DueState {
  if (!dueOn) return "none";
  const diff = calendarDaysFromToday(dueOn, todayKey);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  return "upcoming";
}

export const DUE_TONES: Record<DueState, Tone> = {
  overdue: "red",
  today: "amber",
  tomorrow: "neutral",
  upcoming: "neutral",
  none: "neutral",
};

export function isOpenStatus(status: TaskStatus): boolean {
  return status !== "done";
}

export type TaskOrder = Pick<Task, "priority" | "due_on" | "created_at">;

/**
 * The default order everywhere open tasks are listed: priority first
 * (urgent on top), then the nearest due date with undated tasks last, then
 * the oldest task first. The database query orders the same way; this is
 * for re-sorting after an optimistic change.
 */
export function compareTasks(a: TaskOrder, b: TaskOrder): number {
  const byPriority = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  if (byPriority !== 0) return byPriority;
  if (a.due_on !== b.due_on) {
    if (a.due_on == null) return 1;
    if (b.due_on == null) return -1;
    return a.due_on < b.due_on ? -1 : 1;
  }
  if (a.created_at === b.created_at) return 0;
  return a.created_at < b.created_at ? -1 : 1;
}

/** Done rows, newest completed first, id as the tie-break. Never mutates the input. */
export function sortDoneTasks<T extends Pick<Task, "completed_at" | "id">>(rows: readonly T[]): T[] {
  return [...rows].sort(
    (a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "") || b.id.localeCompare(a.id)
  );
}

/** Rows bucketed by status, every status present (empty ones too), row order kept. */
export function groupTasksByStatus<T extends { status: TaskStatus }>(rows: readonly T[]): Record<TaskStatus, T[]> {
  const groups = Object.fromEntries(TASK_STATUSES.map((status) => [status, [] as T[]])) as Record<TaskStatus, T[]>;
  for (const row of rows) groups[row.status].push(row);
  return groups;
}
