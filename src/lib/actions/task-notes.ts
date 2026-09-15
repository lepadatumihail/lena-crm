"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { isMissingTableError } from "@/lib/supabase/errors";
import { createClient as createSupabase } from "@/lib/supabase/server";
import type { TaskNote } from "@/lib/supabase/types";
import { taskNoteBodySchema } from "@/lib/validation/task";

/** More than a task ever gathers; the drawer shows the newest this many. */
const NOTES_LIMIT = 200;

// Ids arrive from the browser; validate before Postgres sees them.
const idSchema = z.uuid();

type Supabase = Awaited<ReturnType<typeof createSupabase>>;

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
 * A task's notes, newest first, loaded when the task drawer opens: notes show
 * nowhere else, so no page render carries them. `notes: null` means the
 * table isn't there yet (a deploy ahead of its migration).
 */
export async function listTaskNotes(
  taskId: string
): Promise<{ notes: TaskNote[] | null; error: string | null }> {
  const [supabase, t] = await Promise.all([
    createSupabase(),
    getTranslations("server.tasks.errors"),
  ]);
  if (!(await signedIn(supabase))) return { notes: [], error: await notAuthenticated() };
  const parsedId = idSchema.safeParse(taskId);
  if (!parsedId.success) return { notes: [], error: t("notFound") };

  const { data, error } = await supabase
    .from("task_notes")
    .select("*")
    .eq("task_id", parsedId.data)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(NOTES_LIMIT);
  if (error) {
    if (isMissingTableError(error)) return { notes: null, error: null };
    return { notes: [], error: error.message };
  }
  return { notes: data ?? [], error: null };
}

export async function addTaskNote(
  taskId: string,
  body: string
): Promise<{ error: string | null; note?: TaskNote }> {
  const [supabase, t] = await Promise.all([
    createSupabase(),
    getTranslations("server.tasks.errors"),
  ]);
  if (!(await signedIn(supabase))) return { error: await notAuthenticated() };
  const parsedId = idSchema.safeParse(taskId);
  const parsedBody = taskNoteBodySchema.safeParse(body);
  if (!parsedId.success || !parsedBody.success) return { error: t("checkForm") };

  const { data, error } = await supabase
    .from("task_notes")
    .insert({ task_id: parsedId.data, body: parsedBody.data })
    .select("*")
    .single();
  if (error) {
    if (isMissingTableError(error)) return { error: t("notesNotReady") };
    // 23503: the task was deleted meanwhile. 42501: the policy refused a task
    // that is not the agent's. Either way there is no task to write on.
    if (error.code === "23503" || error.code === "42501") return { error: t("notFound") };
    return { error: error.message };
  }
  return { error: null, note: data };
}

export async function deleteTaskNote(id: string): Promise<{ error: string | null }> {
  const [supabase, t] = await Promise.all([
    createSupabase(),
    getTranslations("server.tasks.errors"),
  ]);
  if (!(await signedIn(supabase))) return { error: await notAuthenticated() };
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: t("checkForm") };

  // The deleted row comes back (RLS hides others), so "not found" costs no extra read.
  const { data, error } = await supabase
    .from("task_notes")
    .delete()
    .eq("id", parsedId.data)
    .select("id")
    .maybeSingle();
  if (error) return { error: isMissingTableError(error) ? t("notesNotReady") : error.message };
  if (!data) return { error: t("noteNotFound") };
  return { error: null };
}
