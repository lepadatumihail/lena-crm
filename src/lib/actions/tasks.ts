"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { isMissingTableError } from "@/lib/supabase/errors";
import { createClient as createSupabase } from "@/lib/supabase/server";
import type { TaskPriority, TaskStatus } from "@/lib/supabase/types";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/tasks";
import { taskInputSchema, type TaskInput } from "@/lib/validation/task";

type ActionResult = { error: string | null };

// Ids and enum choices arrive from the browser; validate before Postgres sees them.
const idSchema = z.uuid();
const statusSchema = z.enum(TASK_STATUSES);
const prioritySchema = z.enum(TASK_PRIORITIES);

type Supabase = Awaited<ReturnType<typeof createSupabase>>;
type ErrorsT = Awaited<ReturnType<typeof getTranslations<"server.tasks.errors">>>;

/** Server Functions are reachable by direct POST, so every action re-checks the session. RLS scopes the rest. */
async function signedIn(supabase: Supabase): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user != null;
}

async function notAuthenticated(): Promise<string> {
  return (await getTranslations("common"))("errors.notAuthenticated");
}

/**
 * A failed query as a message: a missing table means the migration hasn't
 * run. Only on writes that set client_id (`clientWrite`) does 42501 mean the
 * tasks policy refused a client the agent does not own; anywhere else 42501
 * is a real permission problem and its message is kept.
 */
function failure(
  t: ErrorsT,
  error: { code?: string; message: string },
  { clientWrite = false } = {}
): string {
  if (isMissingTableError(error)) return t("notReady");
  if (clientWrite && error.code === "42501") return t("clientNotFound");
  return error.message;
}

/**
 * Same check as addDocument in src/lib/actions/documents.ts: the tasks
 * policy already rejects a client the agent does not own, this read only
 * turns that into a friendly message. Returns null when fine.
 */
async function clientProblem(
  supabase: Supabase,
  t: ErrorsT,
  clientId: string | null
): Promise<string | null> {
  if (!clientId) return null;
  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .maybeSingle();
  if (error) return error.message;
  return data ? null : t("clientNotFound");
}

/** Every page that lists tasks, plus the client pages a change touches. */
function revalidateTaskPaths(...clientIds: (string | null | undefined)[]) {
  revalidatePath("/tasks");
  revalidatePath("/home");
  for (const id of new Set(clientIds.filter((id): id is string => Boolean(id)))) {
    revalidatePath(`/clients/${id}`);
  }
}

/**
 * Deletes a task's UNREAD task_due rows, except `keep` (the current due
 * date's key). Rows the agent already read stay. Deleting instead of marking
 * read matters for Undo and reopening: the next sync recreates a still-due
 * key as unread. Best effort, RLS-scoped.
 */
async function clearTaskNotifications(
  supabase: Supabase,
  taskId: string,
  keep?: string
): Promise<void> {
  let query = supabase
    .from("notifications")
    .delete()
    .eq("task_id", taskId)
    .is("read_at", null);
  if (keep) query = query.neq("dedupe_key", keep);
  await query;
}

function taskColumns(v: TaskInput) {
  return {
    title: v.title,
    description: v.description,
    status: v.status,
    priority: v.priority,
    client_id: v.client_id,
    due_on: v.due_on,
  };
}

export async function createTask(
  input: TaskInput
): Promise<{ error: string | null; id?: string }> {
  const [supabase, t] = await Promise.all([
    createSupabase(),
    getTranslations("server.tasks.errors"),
  ]);
  if (!(await signedIn(supabase))) return { error: await notAuthenticated() };
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) return { error: t("checkForm") };
  const v = parsed.data;
  const problem = await clientProblem(supabase, t, v.client_id);
  if (problem) return { error: problem };

  const { data, error } = await supabase
    .from("tasks")
    .insert(taskColumns(v))
    .select("id")
    .single();
  if (error) return { error: failure(t, error, { clientWrite: true }) };
  revalidateTaskPaths(v.client_id);
  return { error: null, id: data.id };
}

export async function updateTask(
  id: string,
  input: TaskInput
): Promise<ActionResult> {
  const [supabase, t] = await Promise.all([
    createSupabase(),
    getTranslations("server.tasks.errors"),
  ]);
  if (!(await signedIn(supabase))) return { error: await notAuthenticated() };
  const parsedId = idSchema.safeParse(id);
  const parsed = taskInputSchema.safeParse(input);
  if (!parsedId.success || !parsed.success) return { error: t("checkForm") };
  const taskId = parsedId.data;
  const v = parsed.data;

  // The client it was about, so that page refreshes too when the link moves.
  const { data: before, error: readError } = await supabase
    .from("tasks")
    .select("client_id")
    .eq("id", taskId)
    .maybeSingle();
  if (readError) return { error: failure(t, readError) };
  if (!before) return { error: t("notFound") };
  if (v.client_id !== before.client_id) {
    const problem = await clientProblem(supabase, t, v.client_id);
    if (problem) return { error: problem };
  }

  const { error } = await supabase
    .from("tasks")
    .update(taskColumns(v))
    .eq("id", taskId);
  if (error) return { error: failure(t, error, { clientWrite: true }) };

  // Done (or no due date) clears every unread ping; a new due date clears
  // the pings for the old one and leaves the current one alone.
  const keep =
    v.status !== "done" && v.due_on ? `task-due:${taskId}:${v.due_on}` : undefined;
  await clearTaskNotifications(supabase, taskId, keep);

  revalidateTaskPaths(before.client_id, v.client_id);
  return { error: null };
}

export async function setTaskStatus(
  id: string,
  status: TaskStatus
): Promise<ActionResult> {
  const [supabase, t] = await Promise.all([
    createSupabase(),
    getTranslations("server.tasks.errors"),
  ]);
  if (!(await signedIn(supabase))) return { error: await notAuthenticated() };
  const parsedId = idSchema.safeParse(id);
  const parsedStatus = statusSchema.safeParse(status);
  if (!parsedId.success || !parsedStatus.success) return { error: t("checkForm") };

  // The updated row comes back (RLS hides others), so "not found" costs no extra read.
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: parsedStatus.data })
    .eq("id", parsedId.data)
    .select("client_id")
    .maybeSingle();
  if (error) return { error: failure(t, error) };
  if (!data) return { error: t("notFound") };

  if (parsedStatus.data === "done") {
    await clearTaskNotifications(supabase, parsedId.data);
  }
  revalidateTaskPaths(data.client_id);
  return { error: null };
}

export async function setTaskPriority(
  id: string,
  priority: TaskPriority
): Promise<ActionResult> {
  const [supabase, t] = await Promise.all([
    createSupabase(),
    getTranslations("server.tasks.errors"),
  ]);
  if (!(await signedIn(supabase))) return { error: await notAuthenticated() };
  const parsedId = idSchema.safeParse(id);
  const parsedPriority = prioritySchema.safeParse(priority);
  if (!parsedId.success || !parsedPriority.success) {
    return { error: t("checkForm") };
  }

  // The updated row comes back (RLS hides others), so "not found" costs no extra read.
  const { data, error } = await supabase
    .from("tasks")
    .update({ priority: parsedPriority.data })
    .eq("id", parsedId.data)
    .select("client_id")
    .maybeSingle();
  if (error) return { error: failure(t, error) };
  if (!data) return { error: t("notFound") };

  revalidateTaskPaths(data.client_id);
  return { error: null };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const [supabase, t] = await Promise.all([
    createSupabase(),
    getTranslations("server.tasks.errors"),
  ]);
  if (!(await signedIn(supabase))) return { error: await notAuthenticated() };
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: t("checkForm") };

  // The deleted row comes back, so the client page it was on refreshes too.
  // Its notifications go with it: notifications.task_id cascades.
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", parsedId.data)
    .select("client_id")
    .maybeSingle();
  if (error) return { error: failure(t, error) };
  if (!data) return { error: t("notFound") };

  revalidateTaskPaths(data.client_id);
  return { error: null };
}
