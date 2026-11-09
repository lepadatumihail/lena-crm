"use client";

/**
 * Voice notes (plan 026): one recorder and one sheet for the whole signed-in
 * app. Hold the phone's + to talk (a small floating bar shows while you hold,
 * because a modal sheet would swallow the release), or open the sheet from
 * "Voice note" in a New menu or on a client's page and tap to record. Then:
 * upload → transcribe and sort (/api/voice-notes/[id]/process) → review
 * cards → Save.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Mic, Square, X } from "lucide-react";

import { VOICE_NOTE_EVENT } from "@/components/shell/new-actions";
import { useAgentId, useVoiceNotes } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { intlTag } from "@/i18n/config";
import {
  createVoiceNote,
  discardVoiceNote,
  getReadyVoiceNote,
  listOpenVoiceNotes,
  type OpenVoiceNote,
  type VoiceApplyResult,
} from "@/lib/actions/voice";
import { STORAGE_BUCKET } from "@/lib/storage/client-files";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { VOICE_MIN_MS, containerFor, contentTypeFor, voiceNotePath } from "@/lib/voice/formats";
import type { VoiceProposal } from "@/lib/voice/proposal";

import { micAlreadyGranted, useVoiceRecorder, type Recording } from "./use-voice-recorder";
import { VoiceReview } from "./voice-review";
import { VoiceSaved } from "./voice-saved";

type Phase = "closed" | "idle" | "recording" | "uploading" | "processing" | "review" | "saved" | "error";
type Mode = "hold" | "tap";
type Target = { clientId: string | null; clientName: string | null };

type VoiceNoteControls = {
  enabled: boolean;
  /** Opens the sheet ready to record, optionally about one client. */
  open: (target?: Partial<Target>) => void;
  /** A long press on + began; recording starts if the mic is already allowed. */
  holdStart: () => void;
  /** The finger lifted. */
  holdEnd: () => void;
};

const VoiceNoteContext = createContext<VoiceNoteControls | null>(null);

/** The voice-note controls, or null outside the signed-in shell. */
export function useVoiceNoteControls(): VoiceNoteControls | null {
  return useContext(VoiceNoteContext);
}

const ERROR_KEYS = {
  unauthorized: "errors.unauthorized",
  disabled: "errors.disabled",
  not_found: "errors.not_found",
  busy: "errors.busy",
  audio_missing: "errors.audio_missing",
  transcribe_failed: "errors.transcribe_failed",
  empty: "errors.empty",
  extract_failed: "errors.extract_failed",
} as const;
const RETRYABLE = new Set(["transcribe_failed", "extract_failed", "network"]);

function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function VoiceNoteProvider({ children }: { children: ReactNode }) {
  const enabled = useVoiceNotes();
  if (!enabled) return <>{children}</>;
  return <VoiceNoteRuntime>{children}</VoiceNoteRuntime>;
}

function VoiceNoteRuntime({ children }: { children: ReactNode }) {
  const t = useTranslations("voice");
  const locale = intlTag(useLocale());
  const router = useRouter();
  const agentId = useAgentId();
  const isMobile = useIsMobile();

  const [phase, setPhaseState] = useState<Phase>("closed");
  const [mode, setModeState] = useState<Mode>("tap");
  const [target, setTarget] = useState<Target>({ clientId: null, clientName: null });
  const [noteId, setNoteId] = useState<string | null>(null);
  const [ready, setReady] = useState<{ transcript: string; proposal: VoiceProposal } | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [openNotes, setOpenNotes] = useState<OpenVoiceNote[]>([]);
  const [saved, setSaved] = useState<{ result: VoiceApplyResult; followUps: (string | null)[] } | null>(null);
  const [sorting, setSorting] = useState(false);

  const phaseRef = useRef<Phase>("closed");
  const modeRef = useRef<Mode>("tap");
  const targetRef = useRef<Target>(target);
  const holdingRef = useRef(false);
  const detachHoldRef = useRef<(() => void) | null>(null);
  /** Bumped on close, so a result that arrives after the sheet closed is ignored. */
  const runRef = useRef(0);

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);
  const setMode = useCallback((next: Mode) => {
    modeRef.current = next;
    setModeState(next);
  }, []);

  const refreshOpenNotes = useCallback(() => {
    void listOpenVoiceNotes().then(setOpenNotes);
  }, []);

  const fail = useCallback(
    (message: string, canRetry: boolean) => {
      setErrorText(message);
      setRetryable(canRetry);
      setPhase("error");
    },
    [setPhase]
  );

  const process = useCallback(
    async (id: string) => {
      const run = runRef.current;
      setNoteId(id);
      setSorting(false);
      setPhase("processing");
      try {
        const res = await fetch(`/api/voice-notes/${id}/process`, { method: "POST" });
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          transcript?: string;
          proposal?: VoiceProposal;
        };
        if (run !== runRef.current) return;
        if (!res.ok || !body.proposal) {
          const code = body.error ?? "network";
          const key = ERROR_KEYS[code as keyof typeof ERROR_KEYS];
          fail(key ? t(key) : t("errors.network"), RETRYABLE.has(code));
          return;
        }
        setReady({ transcript: body.transcript ?? "", proposal: body.proposal });
        setPhase("review");
      } catch {
        if (run === runRef.current) fail(t("errors.network"), true);
      }
    },
    [fail, setPhase, t]
  );

  const send = useCallback(
    async (rec: Recording) => {
      const run = runRef.current;
      const container = containerFor(rec.mime);
      if (!container || !agentId) {
        fail(t("unsupported"), false);
        return;
      }
      setPhase("uploading");
      const path = voiceNotePath(agentId, crypto.randomUUID(), container);
      const { error: uploadError } = await createClient()
        .storage.from(STORAGE_BUCKET)
        .upload(path, rec.blob, { upsert: false, contentType: contentTypeFor(container) });
      if (run !== runRef.current) return;
      if (uploadError) {
        fail(t("errors.upload"), false);
        return;
      }
      const created = await createVoiceNote({
        path,
        mimeType: rec.mime,
        durationMs: Math.round(rec.durationMs),
        sizeBytes: rec.blob.size,
        clientId: targetRef.current.clientId,
      });
      if (run !== runRef.current) return;
      if (created.error || !created.id) {
        fail(created.error ?? t("errors.network"), false);
        return;
      }
      await process(created.id);
    },
    [agentId, fail, process, setPhase, t]
  );

  const recorder = useVoiceRecorder({ onAutoStop: (rec) => void send(rec) });
  const { start, stop, cancel } = recorder;

  const finish = useCallback(async () => {
    const rec = await stop();
    if (!rec) {
      if (phaseRef.current === "recording") {
        setMode("tap");
        setPhase("idle");
      }
      return;
    }
    if (rec.durationMs < VOICE_MIN_MS) {
      setHint(t("tooShort"));
      setMode("tap");
      setPhase("idle");
      refreshOpenNotes();
      return;
    }
    await send(rec);
  }, [refreshOpenNotes, send, setMode, setPhase, stop, t]);

  const open = useCallback(
    (next?: Partial<Target>) => {
      if (phaseRef.current !== "closed") return;
      const nextTarget = { clientId: next?.clientId ?? null, clientName: next?.clientName ?? null };
      targetRef.current = nextTarget;
      setTarget(nextTarget);
      setMode("tap");
      setHint(null);
      setErrorText(null);
      setPhase("idle");
      refreshOpenNotes();
    },
    [refreshOpenNotes, setMode, setPhase]
  );

  const detachHold = useCallback(() => {
    detachHoldRef.current?.();
    detachHoldRef.current = null;
  }, []);

  const holdEnd = useCallback(() => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    detachHold();
    if (modeRef.current === "hold" && phaseRef.current === "recording") void finish();
  }, [detachHold, finish]);

  const holdStart = useCallback(async () => {
    if (phaseRef.current !== "closed") return;
    holdingRef.current = true;
    // the release can land anywhere once the finger moves, so listen on the window
    const end = () => holdEnd();
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("blur", end);
    detachHoldRef.current = () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("blur", end);
    };

    const granted = await micAlreadyGranted();
    if (!granted || !holdingRef.current) {
      // first time (or let go already): the sheet asks properly instead
      holdingRef.current = false;
      detachHold();
      open();
      return;
    }
    const none = { clientId: null, clientName: null };
    targetRef.current = none;
    setTarget(none);
    setHint(null);
    setErrorText(null);
    setMode("hold");
    setPhase("recording");
    navigator.vibrate?.(15);
    const ok = await start();
    if (!ok) {
      holdingRef.current = false;
      detachHold();
      setMode("tap");
      setPhase("idle");
      return;
    }
    // released while the microphone was still starting
    if (!holdingRef.current) void finish();
  }, [detachHold, finish, holdEnd, open, setMode, setPhase, start]);

  const close = useCallback(() => {
    runRef.current += 1;
    holdingRef.current = false;
    detachHold();
    cancel();
    setPhase("closed");
    setReady(null);
    setSaved(null);
    setNoteId(null);
    setErrorText(null);
    setHint(null);
  }, [cancel, detachHold, setPhase]);

  const startTap = useCallback(async () => {
    setHint(null);
    const ok = await start();
    if (ok) setPhase("recording");
  }, [setPhase, start]);

  const resume = useCallback(
    async (note: OpenVoiceNote) => {
      setNoteId(note.id);
      if (note.status === "ready") {
        const run = runRef.current;
        const full = await getReadyVoiceNote(note.id);
        if (run !== runRef.current) return;
        if (full) {
          setReady({ transcript: full.transcript, proposal: full.proposal });
          setPhase("review");
          return;
        }
      }
      await process(note.id);
    },
    [process, setPhase]
  );

  const discard = useCallback(
    async (id: string | null) => {
      if (id) await discardVoiceNote(id);
      setReady(null);
      setNoteId(null);
      setErrorText(null);
      setMode("tap");
      setPhase("idle");
      refreshOpenNotes();
    },
    [refreshOpenNotes, setMode, setPhase]
  );

  // "Voice note" in ⌘K, the phone's + sheet or Home's New menu
  useEffect(() => {
    const onEvent = () => open();
    window.addEventListener(VOICE_NOTE_EVENT, onEvent);
    return () => window.removeEventListener(VOICE_NOTE_EVENT, onEvent);
  }, [open]);

  // one request does both steps; the second message is a fair guess at when sorting starts
  useEffect(() => {
    if (phase !== "processing") return;
    const timer = window.setTimeout(() => setSorting(true), 2500);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const controls = useMemo<VoiceNoteControls>(
    () => ({ enabled: true, open, holdStart: () => void holdStart(), holdEnd }),
    [open, holdStart, holdEnd]
  );

  const holdOverlay = phase === "recording" && mode === "hold";
  const sheetOpen = phase !== "closed" && !holdOverlay;
  const recError =
    recorder.error === "denied"
      ? t("micDenied")
      : recorder.error === "no_input"
        ? t("noInput")
        : recorder.error === "unsupported"
          ? t("unsupported")
          : null;

  return (
    <VoiceNoteContext value={controls}>
      {children}

      {holdOverlay ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4"
          aria-live="polite"
        >
          <div className="bg-foreground text-background flex items-center gap-2.5 rounded-full px-4 py-2 text-sm shadow-lg">
            <span className="size-2.5 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden />
            <span className="tabular-nums">{clock(recorder.elapsedMs)}</span>
            <span className="opacity-80">{recorder.warn ? t("warning") : t("releaseHint")}</span>
          </div>
        </div>
      ) : null}

      <Sheet open={sheetOpen} onOpenChange={(next) => !next && close()}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "flex flex-col gap-0",
            isMobile
              ? "max-h-[90svh] rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
              : "w-full sm:max-w-md"
          )}
        >
          <SheetHeader className="pb-2">
            <SheetTitle>
              {target.clientName ? t("titleFor", { name: target.clientName }) : t("title")}
            </SheetTitle>
            <SheetDescription className={cn(phase !== "idle" && "sr-only")}>{t("description")}</SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" aria-live="polite">
            {phase === "idle" ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <Button type="button" size="lg" className="h-14 rounded-full px-6" onClick={startTap} disabled={recorder.state === "starting"}>
                  {recorder.state === "starting" ? <Loader2 className="animate-spin" /> : <Mic />}
                  {t("start")}
                </Button>
                <p className="text-muted-foreground max-w-xs text-sm">{t("micExplainer")}</p>
                {recError ? <p role="alert" className="text-destructive max-w-xs text-sm">{recError}</p> : null}
                {hint ? <p className="max-w-xs text-sm">{hint}</p> : null}
                {isMobile && !target.clientId ? (
                  <p className="text-muted-foreground max-w-xs text-xs">{t("holdHint")}</p>
                ) : null}
                {openNotes.length ? (
                  <OpenNotes
                    notes={openNotes}
                    locale={locale}
                    onResume={(note) => void resume(note)}
                    onDiscard={(id) => void discard(id)}
                  />
                ) : null}
              </div>
            ) : null}

            {phase === "recording" ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span className="size-2.5 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden />
                  {t("recording")}
                </p>
                <p className="text-4xl font-medium tabular-nums">{clock(recorder.elapsedMs)}</p>
                {recorder.warn ? <p className="text-sm">{t("warning")}</p> : null}
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={close}>
                    <X /> {t("cancel")}
                  </Button>
                  <Button type="button" onClick={() => void finish()}>
                    <Square /> {t("stop")}
                  </Button>
                </div>
              </div>
            ) : null}

            {phase === "uploading" || phase === "processing" ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Loader2 className="text-muted-foreground size-6 animate-spin" />
                <p className="text-sm">
                  {phase === "uploading" ? t("uploading") : sorting ? t("sorting") : t("listening")}
                </p>
              </div>
            ) : null}

            {phase === "review" && ready && noteId ? (
              <VoiceReview
                key={noteId}
                noteId={noteId}
                proposal={ready.proposal}
                transcript={ready.transcript}
                onSaved={(result, followUps) => {
                  setSaved({ result, followUps });
                  setPhase("saved");
                  router.refresh();
                }}
                onDiscard={() => void discard(noteId)}
              />
            ) : null}

            {phase === "saved" && saved ? (
              <VoiceSaved
                result={saved.result}
                followUps={saved.followUps}
                onRecordAnother={() => {
                  setSaved(null);
                  setReady(null);
                  setNoteId(null);
                  setMode("tap");
                  setPhase("idle");
                  refreshOpenNotes();
                }}
                onClose={close}
              />
            ) : null}

            {phase === "error" ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <p role="alert" className="max-w-xs text-sm">
                  {errorText}
                </p>
                <div className="flex gap-2">
                  {noteId ? (
                    <Button type="button" variant="ghost" onClick={() => void discard(noteId)}>
                      {t("discard")}
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" onClick={() => setPhase("idle")}>
                      {t("cancel")}
                    </Button>
                  )}
                  {retryable && noteId ? (
                    <Button type="button" onClick={() => void process(noteId)}>
                      {t("retry")}
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </VoiceNoteContext>
  );
}

function OpenNotes({
  notes,
  locale,
  onResume,
  onDiscard,
}: {
  notes: OpenVoiceNote[];
  locale: string;
  onResume: (note: OpenVoiceNote) => void;
  onDiscard: (id: string) => void;
}) {
  const t = useTranslations("voice");
  const when = (iso: string) => {
    const date = new Date(iso);
    const today = new Date().toDateString() === date.toDateString();
    return date.toLocaleString(locale, today ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };
  return (
    <section className="flex w-full flex-col gap-2 text-left">
      <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{t("openNotes")}</h3>
      <ul className="flex flex-col gap-1.5">
        {notes.map((note) => (
          <li key={note.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onResume(note)}>
              <span className="block truncate text-sm">{note.summary ?? when(note.createdAt)}</span>
              <span className="text-muted-foreground block text-xs">
                {note.status === "ready" ? t("openReady") : note.status === "failed" ? t("openFailed") : t("openWaiting")}
                {note.summary ? ` · ${when(note.createdAt)}` : null}
              </span>
            </button>
            <Button type="button" variant="ghost" size="icon-xs" aria-label={t("discard")} onClick={() => onDiscard(note.id)}>
              <X />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
