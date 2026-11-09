"use server";

/**
 * Voice notes (plan 026). The browser uploads the audio straight to the
 * attachments bucket; these actions record the note, list the unfinished
 * ones, discard one, and (applyVoiceNote) save what the agent approved.
 * Transcription and extraction run in /api/voice-notes/[id]/process.
 */
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { addClientNote, logContact } from "@/lib/actions/activity";
import { saveViewing, upsertPreferences } from "@/lib/actions/buyer";
import { saveAppointment } from "@/lib/actions/calendar";
import { createClient as createCrmClient, updateClientStage } from "@/lib/actions/clients";
import { createTask } from "@/lib/actions/tasks";
import { defaultStageForSide, type ClientSide } from "@/lib/crm";
import { getSessionProfile } from "@/lib/data/session";
import type { Json } from "@/lib/supabase/types";
import {
  mergePreferences,
  stageChange,
  toAppointmentInput,
  toClientValues,
  toTaskInputs,
  toTimelineEntry,
  toViewingValues,
} from "@/lib/voice/apply-map";
import { voiceApplySchema, type VoiceApplyInput } from "@/lib/voice/schema";
import { voiceNotesEnabled } from "@/lib/flags";
import { STORAGE_BUCKET } from "@/lib/storage/client-files";
import { createClient as createSupabase } from "@/lib/supabase/server";
import {
  VOICE_DAILY_LIMIT,
  VOICE_MAX_BYTES,
  VOICE_MAX_MS,
  VOICE_MIN_MS,
  containerFor,
  parseVoiceNotePath,
} from "@/lib/voice/formats";
import type { VoiceProposal } from "@/lib/voice/proposal";

type Supabase = Awaited<ReturnType<typeof createSupabase>>;

const idSchema = z.uuid();

const createSchema = z.object({
  path: z.string().max(300),
  mimeType: z.string().max(100),
  // the recorder stops itself at the limit; allow a little slack for timers
  durationMs: z.number().int().min(0).max(VOICE_MAX_MS + 5_000),
  sizeBytes: z.number().int().min(1).max(VOICE_MAX_BYTES),
  clientId: z.uuid().nullable(),
});
export type CreateVoiceNoteInput = z.infer<typeof createSchema>;

/** The signed-in agent, if voice notes are on for them. Every action re-checks: actions are reachable by direct POST. */
async function voiceSession(supabase: Supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, enabled: false } as const;
  const profile = await getSessionProfile();
  return { user, enabled: voiceNotesEnabled(profile) } as const;
}

async function notAuthenticated(): Promise<string> {
  return (await getTranslations("common"))("errors.notAuthenticated");
}

/** Records a note whose audio the browser has just uploaded. */
export async function createVoiceNote(
  input: CreateVoiceNoteInput
): Promise<{ id?: string; error: string | null }> {
  const [supabase, t] = await Promise.all([createSupabase(), getTranslations("server.voice.errors")]);
  const { user, enabled } = await voiceSession(supabase);
  if (!user) return { error: await notAuthenticated() };
  if (!enabled) return { error: t("notEnabled") };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { error: t("invalidRecording") };
  const v = parsed.data;
  const container = parseVoiceNotePath(v.path, user.id);
  if (!container || containerFor(v.mimeType) !== container) return { error: t("invalidRecording") };
  if (v.durationMs < VOICE_MIN_MS) return { error: t("tooShort") };

  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { count } = await supabase
    .from("voice_notes")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if ((count ?? 0) >= VOICE_DAILY_LIMIT) {
    await supabase.storage.from(STORAGE_BUCKET).remove([v.path]);
    return { error: t("dailyLimit", { limit: VOICE_DAILY_LIMIT }) };
  }

  const { data, error } = await supabase
    .from("voice_notes")
    .insert({
      client_id: v.clientId,
      status: "uploaded",
      audio_path: v.path,
      mime_type: v.mimeType,
      duration_ms: v.durationMs,
      size_bytes: v.sizeBytes,
    })
    .select("id")
    .single();
  if (error) {
    await supabase.storage.from(STORAGE_BUCKET).remove([v.path]);
    // RLS refuses a client the agent doesn't own
    return { error: error.code === "42501" ? t("clientNotFound") : t("saveFailed") };
  }
  return { id: data.id, error: null };
}

/** Throws a note away: audio, transcript and proposal. A saved note stays as it is. */
export async function discardVoiceNote(id: string): Promise<{ error: string | null }> {
  const [supabase, t] = await Promise.all([createSupabase(), getTranslations("server.voice.errors")]);
  const { user } = await voiceSession(supabase);
  if (!user) return { error: await notAuthenticated() };
  if (!idSchema.safeParse(id).success) return { error: t("notFound") };

  const { data: note } = await supabase
    .from("voice_notes")
    .select("id, status, audio_path")
    .eq("id", id)
    .maybeSingle();
  if (!note) return { error: t("notFound") };
  if (note.audio_path) await supabase.storage.from(STORAGE_BUCKET).remove([note.audio_path]);
  if (note.status === "applied") return { error: null };

  const { error } = await supabase
    .from("voice_notes")
    .update({ status: "discarded", audio_path: null, transcript: null, proposal: null })
    .eq("id", id);
  return { error: error ? t("saveFailed") : null };
}

export type OpenVoiceNote = {
  id: string;
  status: "uploaded" | "ready" | "failed";
  createdAt: string;
  durationMs: number | null;
  clientId: string | null;
  summary: string | null;
  error: string | null;
};

/** Notes the agent hasn't saved or discarded yet, newest first. */
export async function listOpenVoiceNotes(): Promise<OpenVoiceNote[]> {
  const supabase = await createSupabase();
  const { user, enabled } = await voiceSession(supabase);
  if (!user || !enabled) return [];

  const { data } = await supabase
    .from("voice_notes")
    .select("id, status, created_at, duration_ms, client_id, error, proposal")
    .in("status", ["uploaded", "ready", "failed"])
    .order("created_at", { ascending: false })
    .limit(10);
  return (data ?? []).map((n) => ({
    id: n.id,
    status: n.status as OpenVoiceNote["status"],
    createdAt: n.created_at,
    durationMs: n.duration_ms,
    clientId: n.client_id,
    summary: (n.proposal as VoiceProposal | null)?.summary || null,
    error: n.error,
  }));
}

export type ReadyVoiceNote = {
  id: string;
  clientId: string | null;
  transcript: string;
  proposal: VoiceProposal;
};

/** A processed note, to reopen its review cards. */
export async function getReadyVoiceNote(id: string): Promise<ReadyVoiceNote | null> {
  if (!idSchema.safeParse(id).success) return null;
  const supabase = await createSupabase();
  const { user, enabled } = await voiceSession(supabase);
  if (!user || !enabled) return null;

  const { data } = await supabase
    .from("voice_notes")
    .select("id, status, client_id, transcript, proposal")
    .eq("id", id)
    .maybeSingle();
  if (!data || data.status !== "ready" || !data.proposal) return null;
  return {
    id: data.id,
    clientId: data.client_id,
    transcript: data.transcript ?? "",
    proposal: data.proposal as unknown as VoiceProposal,
  };
}

export type VoiceSavedClient = {
  /** Position of the card in the request, so the sheet can find its follow-up text. */
  index: number;
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  isNew: boolean;
  saved: {
    timeline: boolean;
    viewing: boolean;
    preferences: boolean;
    stage: boolean;
    tasks: number;
    appointment: boolean;
  };
  errors: string[];
};

export type VoiceApplyResult = {
  error: string | null;
  clients: VoiceSavedClient[];
  looseTasks: number;
  /** Cards that couldn't be saved at all (e.g. the Free plan's client cap). */
  failed: { index: number; error: string }[];
};

/**
 * Saves what the agent approved on the review cards, through the same
 * actions the forms use. Each card is saved on its own: one failure (a client
 * cap, a deleted client) doesn't stop the others.
 */
export async function applyVoiceNote(input: VoiceApplyInput): Promise<VoiceApplyResult> {
  const empty = { clients: [], looseTasks: 0, failed: [] };
  const [supabase, t] = await Promise.all([createSupabase(), getTranslations("server.voice.errors")]);
  const { user, enabled } = await voiceSession(supabase);
  if (!user) return { error: await notAuthenticated(), ...empty };
  if (!enabled) return { error: t("notEnabled"), ...empty };

  const parsed = voiceApplySchema.safeParse(input);
  if (!parsed.success) return { error: t("checkForm"), ...empty };
  const v = parsed.data;

  const { data: note } = await supabase
    .from("voice_notes")
    .select("id, status")
    .eq("id", v.noteId)
    .maybeSingle();
  if (!note) return { error: t("notFound"), ...empty };
  if (note.status !== "ready") return { error: t("notReady"), ...empty };

  const clients: VoiceSavedClient[] = [];
  const failed: VoiceApplyResult["failed"] = [];

  for (const [index, g] of v.groups.entries()) {
    let client: { id: string; side: ClientSide; stage: string; name: string; phone: string | null; email: string | null };
    let isNew = false;
    if (g.client.kind === "existing") {
      const { data: row } = await supabase
        .from("clients")
        .select("id, side, stage, first_name, last_name, phone, email")
        .eq("id", g.client.id)
        .maybeSingle();
      if (!row) {
        failed.push({ index, error: t("clientNotFound") });
        continue;
      }
      client = {
        id: row.id,
        side: row.side,
        stage: row.stage,
        name: `${row.first_name} ${row.last_name ?? ""}`.trim(),
        phone: row.phone,
        email: row.email,
      };
    } else {
      const created = await createCrmClient(toClientValues(g.client));
      if (created.error || !created.id) {
        failed.push({ index, error: created.error ?? t("saveFailed") });
        continue;
      }
      isNew = true;
      client = {
        id: created.id,
        side: g.client.side,
        stage: defaultStageForSide(g.client.side),
        name: `${g.client.first_name} ${g.client.last_name}`.trim(),
        phone: g.client.phone || null,
        email: g.client.email || null,
      };
    }

    const saved: VoiceSavedClient["saved"] = {
      timeline: false,
      viewing: false,
      preferences: false,
      stage: false,
      tasks: 0,
      appointment: false,
    };
    const errors: string[] = [];
    const record = (error: string | null | undefined) => {
      if (error) errors.push(error);
      return !error;
    };

    const entry = toTimelineEntry(client.id, g);
    if (entry?.kind === "contact") saved.timeline = record((await logContact(entry.input)).error);
    if (entry?.kind === "note") saved.timeline = record((await addClientNote(entry.input)).error);

    // viewings and wishes are buyer records, as everywhere else in the app
    if (client.side === "buyer" && g.viewing) {
      const { values, schedule } = toViewingValues(g.viewing);
      saved.viewing = record((await saveViewing(client.id, null, values, schedule)).error);
    }
    if (client.side === "buyer" && g.preferences) {
      const { data: current } = await supabase
        .from("buyer_preferences")
        .select("budget_min, budget_max, bedrooms, bathrooms, property_types, area_notes")
        .eq("client_id", client.id)
        .maybeSingle();
      const merged = mergePreferences(
        current ? { ...current, property_types: current.property_types ?? [] } : null,
        g.preferences
      );
      saved.preferences = record((await upsertPreferences(client.id, merged)).error);
    }

    const nextStage = stageChange(client.side, client.stage, g.stage);
    if (nextStage) saved.stage = record((await updateClientStage(client.id, nextStage)).error);

    for (const task of toTaskInputs(client.id, g.tasks)) {
      if (record((await createTask(task)).error)) saved.tasks += 1;
    }
    if (g.appointment) {
      saved.appointment = record((await saveAppointment(null, toAppointmentInput(client.id, g.appointment))).error);
    }

    clients.push({ index, id: client.id, name: client.name, phone: client.phone, email: client.email, isNew, saved, errors });
  }

  let looseTasks = 0;
  for (const task of toTaskInputs(null, v.looseTasks)) {
    if (!(await createTask(task)).error) looseTasks += 1;
  }

  if (!clients.length && !looseTasks) {
    return { error: failed[0]?.error ?? t("saveFailed"), clients, looseTasks, failed };
  }

  await supabase
    .from("voice_notes")
    .update({
      status: "applied",
      applied_at: new Date().toISOString(),
      applied: {
        clients: clients.map((c) => ({ id: c.id, isNew: c.isNew, saved: c.saved, errors: c.errors.length })),
        looseTasks,
        failed: failed.length,
      } as unknown as Json,
    })
    .eq("id", v.noteId);

  return { error: null, clients, looseTasks, failed };
}
