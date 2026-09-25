"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { isMissingTableError } from "@/lib/supabase/errors";
import { createClient as createSupabase } from "@/lib/supabase/server";
import {
  activityNoteSchema,
  logContactSchema,
  type LogContactInput,
} from "@/lib/validation/activity";

type ActionResult = { error: string | null };

// Ids arrive from the browser; validate before Postgres sees them.
const idSchema = z.uuid();

type Supabase = Awaited<ReturnType<typeof createSupabase>>;
type ErrorsT = Awaited<ReturnType<typeof getTranslations<"server.activity.errors">>>;

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

/** A failed write as a message: a missing table means the migration hasn't run, 42501 a client the agent doesn't own. */
function failure(t: ErrorsT, error: { code?: string; message: string }): string {
  if (isMissingTableError(error)) return t("notReady");
  if (error.code === "42501") return t("clientNotFound");
  return error.message;
}

/** The pages that show a client's activity or how quiet they are. */
function revalidateClient(clientId: string) {
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/home");
}

/**
 * Logs that the agent reached a client. The client_activity trigger moves
 * clients.last_contacted_at, which clears them from the quiet list; this
 * also drops the bell's unread nudges about them, which the next sync would
 * not recreate. Returns the entry's id so the caller can offer Undo.
 */
export async function logContact(
  input: LogContactInput
): Promise<{ error: string | null; id?: string }> {
  const [supabase, t] = await Promise.all([
    createSupabase(),
    getTranslations("server.activity.errors"),
  ]);
  if (!(await signedIn(supabase))) return { error: await notAuthenticated() };
  const parsed = logContactSchema.safeParse(input);
  if (!parsed.success) return { error: t("checkForm") };
  const v = parsed.data;

  const { data, error } = await supabase
    .from("client_activities")
    .insert({ client_id: v.clientId, kind: "contact", channel: v.channel, body: v.body })
    .select("id")
    .single();
  if (error) return { error: failure(t, error) };

  // Best effort: the nudges are about a client the agent just reached.
  await supabase
    .from("notifications")
    .delete()
    .eq("client_id", v.clientId)
    .in("type", ["follow_up", "stalled_offer"])
    .is("read_at", null);

  revalidateClient(v.clientId);
  return { error: null, id: data.id };
}

/** Adds a note to a client's activity. */
export async function addClientNote(input: {
  clientId: string;
  body: string;
}): Promise<{ error: string | null; id?: string }> {
  const [supabase, t] = await Promise.all([
    createSupabase(),
    getTranslations("server.activity.errors"),
  ]);
  if (!(await signedIn(supabase))) return { error: await notAuthenticated() };
  const parsed = activityNoteSchema.safeParse(input);
  if (!parsed.success) return { error: t("checkForm") };

  const { data, error } = await supabase
    .from("client_activities")
    .insert({ client_id: parsed.data.clientId, kind: "note", body: parsed.data.body })
    .select("id")
    .single();
  if (error) return { error: failure(t, error) };
  revalidateClient(parsed.data.clientId);
  return { error: null, id: data.id };
}

/**
 * Deletes a note or undoes a logged contact; the trigger moves
 * last_contacted_at back. Stage moves are history and stay.
 */
export async function deleteActivity(id: string): Promise<ActionResult> {
  const [supabase, t] = await Promise.all([
    createSupabase(),
    getTranslations("server.activity.errors"),
  ]);
  if (!(await signedIn(supabase))) return { error: await notAuthenticated() };
  if (!idSchema.safeParse(id).success) return { error: t("notFound") };

  const { data, error } = await supabase
    .from("client_activities")
    .delete()
    .eq("id", id)
    .in("kind", ["contact", "note"])
    .select("client_id");
  if (error) return { error: failure(t, error) };
  const clientId = data?.[0]?.client_id;
  if (!clientId) return { error: t("notFound") };
  revalidateClient(clientId);
  return { error: null };
}
