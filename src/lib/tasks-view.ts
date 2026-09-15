import { DONE_MAX, DONE_PAGE_SIZE } from "@/lib/tasks";

export const TASKS_VIEWS = ["list", "board"] as const;
export type TasksViewKind = (typeof TASKS_VIEWS)[number];
export const DEFAULT_TASKS_VIEW: TasksViewKind = "list";
/** Remembers the last view. The toggle writes it; the page reads it. */
export const TASKS_VIEW_COOKIE = "tasks_view";
export const TASKS_VIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type TasksTab = "open" | "done";
/** A client filter: a client id, "none" for tasks without a client, or null for all. */
export type TasksClientScope = string | "none" | null;

export type TasksQuery = { tab?: string; client?: string; task?: string; done?: string };
export type TasksRequest = {
  view: TasksViewKind;
  tab: TasksTab;
  clientId: TasksClientScope;
  taskId: string | null;
  doneLimit: number;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isTasksView(value: unknown): value is TasksViewKind {
  return typeof value === "string" && (TASKS_VIEWS as readonly string[]).includes(value);
}

/** What /tasks renders: the remembered view plus the tab, client scope, task and Done range from the URL. */
export function resolveTasksRequest(query: TasksQuery, rememberedView: string | undefined): TasksRequest {
  const done = Number.parseInt(query.done ?? "", 10);
  return {
    view: isTasksView(rememberedView) ? rememberedView : DEFAULT_TASKS_VIEW,
    tab: query.tab === "done" ? "done" : "open",
    clientId: query.client === "none" ? "none" : query.client && UUID_RE.test(query.client) ? query.client : null,
    taskId: query.task && UUID_RE.test(query.task) ? query.task : null,
    doneLimit: Number.isFinite(done) ? Math.min(DONE_MAX, Math.max(DONE_PAGE_SIZE, done)) : DONE_PAGE_SIZE,
  };
}

/** The query string for a tasks screen (no leading "?"). Only non-default values are written. */
export function tasksSearch(p: { tab?: TasksTab; clientId?: TasksClientScope; taskId?: string; openNew?: boolean; doneLimit?: number } = {}): string {
  const search = new URLSearchParams();
  if (p.tab === "done") search.set("tab", "done");
  if (p.clientId) search.set("client", p.clientId);
  if (p.doneLimit && p.doneLimit > DONE_PAGE_SIZE) search.set("done", String(p.doneLimit));
  if (p.taskId) search.set("task", p.taskId);
  if (p.openNew) search.set("new", "1");
  return search.toString();
}

/** Link into /tasks from anywhere in the app. */
export function tasksHref(p: Parameters<typeof tasksSearch>[0] = {}): string {
  const qs = tasksSearch(p);
  return qs ? `/tasks?${qs}` : "/tasks";
}
