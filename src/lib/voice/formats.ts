/**
 * Recording formats, storage paths and limits for voice notes (plan 026).
 * Shared by the browser recorder and the server, so both agree on what a
 * note may be.
 */

/** The longest note: the recorder stops itself here. */
export const VOICE_MAX_MS = 5 * 60_000;
/** When the recorder warns that the note is nearly at its limit. */
export const VOICE_WARN_MS = VOICE_MAX_MS - 30_000;
/** Anything shorter is a slip of the finger and is thrown away. */
export const VOICE_MIN_MS = 1_000;
/** The attachments bucket's per-file cap (20260601120000_attachments_size_limit.sql). */
export const VOICE_MAX_BYTES = 15 * 1024 * 1024;
/** Fair use: notes per agent in any 24 hours. */
export const VOICE_DAILY_LIMIT = 30;
/** A failed note keeps its audio this long for a retry; then it is removed. */
export const VOICE_AUDIO_TTL_MS = 24 * 60 * 60_000;

/** MediaRecorder types to try, best first: Chrome and Android record webm/Opus, iOS Safari mp4/AAC. */
export const RECORDER_MIME_ORDER = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"] as const;

/** How a note is stored. Also OpenRouter's `input_audio.format`; both worked in plan 026 Phase 0. */
export type VoiceContainer = "webm" | "m4a";

/** The first recorder type this browser supports, or null when it can't record. */
export function pickRecorderMime(isTypeSupported: (mime: string) => boolean): string | null {
  for (const mime of RECORDER_MIME_ORDER) {
    try {
      if (isTypeSupported(mime)) return mime;
    } catch {
      // some browsers throw on types they don't know; try the next one
    }
  }
  return null;
}

/** The container for a recorder MIME type, ignoring codec parameters. */
export function containerFor(mime: string | null | undefined): VoiceContainer | null {
  const base = (mime ?? "").split(";")[0].trim().toLowerCase();
  if (base === "audio/webm") return "webm";
  if (base === "audio/mp4" || base === "audio/m4a" || base === "audio/x-m4a" || base === "audio/aac") {
    return "m4a";
  }
  return null;
}

/** The Content-Type a stored note is uploaded with. */
export function contentTypeFor(container: VoiceContainer): string {
  return container === "webm" ? "audio/webm" : "audio/mp4";
}

/** Where a note's audio lives in the attachments bucket; the storage policies key on the first folder. */
export function voiceNotePath(agentId: string, fileId: string, container: VoiceContainer): string {
  return `${agentId}/voice-notes/${fileId}.${container}`;
}

const FILE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webm|m4a)$/i;

/** The container of a path inside the agent's own voice-notes folder, or null for any other path. */
export function parseVoiceNotePath(path: string, agentId: string): VoiceContainer | null {
  const prefix = `${agentId}/voice-notes/`;
  if (!path.startsWith(prefix)) return null;
  const match = FILE_NAME.exec(path.slice(prefix.length));
  return match ? (match[1].toLowerCase() as VoiceContainer) : null;
}
