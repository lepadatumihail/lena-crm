/**
 * Processes one voice note (plan 026):
 * 1. download the audio
 * 2. transcribe it
 * 3. remove the audio
 * 4. sort the transcript into client updates
 * 5. match the people to the agent's clients
 * 6. store the proposal the review cards show
 * Nothing is written to a client here; that waits for Save. Transcripts and
 * proposals are never logged.
 */
import { generateText, Output } from "ai";
import { z } from "zod";

import { voiceExtractionModel } from "@/lib/ai/openrouter";
import { getSessionProfile } from "@/lib/data/session";
import { voiceNotesEnabled } from "@/lib/flags";
import { openrouterTranscribe } from "@/lib/openrouter";
import { STORAGE_BUCKET } from "@/lib/storage/client-files";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { resolveTimeZone } from "@/lib/time-zones";
import { VOICE_AUDIO_TTL_MS, parseVoiceNotePath } from "@/lib/voice/formats";
import { buildInstructions, buildPrompt, todayContext, uiLanguageFor } from "@/lib/voice/prompt";
import {
  buildProposal,
  sanitizeExtraction,
  type CandidatePreferences,
  type ProposalCandidate,
  type VoiceProposal,
} from "@/lib/voice/proposal";
import { voiceExtractionSchema } from "@/lib/voice/schema";

export const maxDuration = 60;

type Supabase = Awaited<ReturnType<typeof createClient>>;
type FailCode =
  | "unauthorized"
  | "disabled"
  | "not_found"
  | "busy"
  | "audio_missing"
  | "transcribe_failed"
  | "empty"
  | "extract_failed";

function fail(code: FailCode, status: number): Response {
  return Response.json({ error: code }, { status });
}

async function markFailed(supabase: Supabase, id: string, code: FailCode, status: number): Promise<Response> {
  await supabase.from("voice_notes").update({ status: "failed", error: code }).eq("id", id);
  return fail(code, status);
}

/** OpenRouter's reported cost of an AI SDK call, when usage accounting is on. */
function openrouterCost(meta: unknown): number {
  const cost = (meta as { openrouter?: { usage?: { cost?: unknown } } } | undefined)?.openrouter?.usage?.cost;
  return typeof cost === "number" && Number.isFinite(cost) ? cost : 0;
}

/** Audio that outlived its 24 hours (a failed or abandoned note) is removed. Best effort. */
async function removeStaleAudio(supabase: Supabase): Promise<void> {
  try {
    const before = new Date(Date.now() - VOICE_AUDIO_TTL_MS).toISOString();
    const { data } = await supabase
      .from("voice_notes")
      .select("id, audio_path")
      .not("audio_path", "is", null)
      .lt("created_at", before)
      .limit(50);
    const stale = (data ?? []).filter((n) => n.audio_path);
    if (!stale.length) return;
    await supabase.storage.from(STORAGE_BUCKET).remove(stale.map((n) => n.audio_path as string));
    await supabase
      .from("voice_notes")
      .update({ audio_path: null })
      .in("id", stale.map((n) => n.id));
  } catch {
    // the next note tries again
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return fail("not_found", 404);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("unauthorized", 401);
  const profile = await getSessionProfile();
  if (!voiceNotesEnabled(profile)) return fail("disabled", 403);

  const { data: note } = await supabase
    .from("voice_notes")
    .select("id, status, client_id, audio_path, transcript, proposal, cost_usd")
    .eq("id", id)
    .maybeSingle();
  if (!note) return fail("not_found", 404);
  // a retried request after a slow network: hand back what's already there
  if (note.status === "ready" && note.proposal) {
    return Response.json({ id, status: "ready", transcript: note.transcript ?? "", proposal: note.proposal });
  }
  if (note.status !== "uploaded" && note.status !== "failed") return fail("busy", 409);

  await removeStaleAudio(supabase);

  let transcript = note.transcript ?? "";
  let cost = Number(note.cost_usd ?? 0);
  if (!transcript) {
    const container = note.audio_path ? parseVoiceNotePath(note.audio_path, user.id) : null;
    if (!note.audio_path || !container) return markFailed(supabase, id, "audio_missing", 422);
    const { data: blob, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(note.audio_path);
    if (downloadError || !blob) return markFailed(supabase, id, "audio_missing", 422);

    try {
      const result = await openrouterTranscribe({
        audio: new Uint8Array(await blob.arrayBuffer()),
        format: container,
      });
      transcript = result.text;
      cost += result.cost ?? 0;
    } catch {
      // the audio stays (up to 24 hours) so the agent can retry
      return markFailed(supabase, id, "transcribe_failed", 502);
    }

    // the audio has done its job: remove it before anything else can fail
    await supabase.storage.from(STORAGE_BUCKET).remove([note.audio_path]);
    const { error: saveError } = await supabase
      .from("voice_notes")
      .update({ transcript: transcript || null, cost_usd: cost, audio_path: null })
      .eq("id", id);
    if (saveError) return markFailed(supabase, id, "transcribe_failed", 500);
    if (!transcript) return markFailed(supabase, id, "empty", 422);
  }

  const timeZone = resolveTimeZone(profile?.time_zone);
  const { today, weekday } = todayContext(new Date(), timeZone);

  // newest first, so the most recently touched clients are offered first
  const { data: clientRows } = await supabase
    .from("clients")
    .select("id, first_name, last_name, side, stage, phone, email, language, is_active")
    .order("updated_at", { ascending: false })
    .limit(3000);
  const toCandidate = (c: NonNullable<typeof clientRows>[number]): ProposalCandidate => ({
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name ?? "",
    side: c.side,
    stage: c.stage,
    phone: c.phone,
    email: c.email,
    language: c.language,
    preferences: null,
  });
  const active = (clientRows ?? []).filter((c) => c.is_active).map(toCandidate);
  const boundRow = note.client_id ? (clientRows ?? []).find((c) => c.id === note.client_id) : undefined;
  const bound = boundRow ? toCandidate(boundRow) : null;

  let extraction;
  try {
    const result = await generateText({
      model: voiceExtractionModel(),
      instructions: buildInstructions({
        today,
        weekday,
        timeZone,
        uiLanguage: uiLanguageFor(profile?.locale),
        boundClient: bound ? { first_name: bound.first_name, last_name: bound.last_name, side: bound.side } : null,
      }),
      prompt: buildPrompt(transcript),
      output: Output.object({ schema: voiceExtractionSchema }),
      temperature: 0.2,
      maxRetries: 1,
    });
    extraction = result.output;
    cost += openrouterCost(result.providerMetadata);
  } catch {
    // the transcript is kept, so a retry only redoes this step
    await supabase.from("voice_notes").update({ cost_usd: cost }).eq("id", id);
    return markFailed(supabase, id, "extract_failed", 502);
  }

  const proposal: VoiceProposal = buildProposal(sanitizeExtraction(extraction, today), { clients: active, bound });

  // current buyer preferences for every offered client, so a card can show old → new
  const candidateIds = Array.from(
    new Set(proposal.groups.flatMap((g) => g.match.candidates.filter((c) => c.side === "buyer").map((c) => c.id)))
  );
  if (candidateIds.length) {
    const { data: prefs } = await supabase
      .from("buyer_preferences")
      .select("client_id, budget_min, budget_max, bedrooms, bathrooms, property_types, area_notes")
      .in("client_id", candidateIds);
    const byClient = new Map<string, CandidatePreferences>(
      (prefs ?? []).map((p) => [
        p.client_id,
        {
          budget_min: p.budget_min,
          budget_max: p.budget_max,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          property_types: p.property_types ?? [],
          area_notes: p.area_notes,
        },
      ])
    );
    for (const g of proposal.groups) {
      g.match.candidates = g.match.candidates.map((c) => ({ ...c, preferences: byClient.get(c.id) ?? null }));
    }
  }

  const { error } = await supabase
    .from("voice_notes")
    .update({ status: "ready", proposal: proposal as unknown as Json, cost_usd: cost, error: null })
    .eq("id", id);
  if (error) return markFailed(supabase, id, "extract_failed", 500);

  return Response.json({ id, status: "ready", transcript, proposal });
}
