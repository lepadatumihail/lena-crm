"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { VOICE_MAX_MS, VOICE_WARN_MS, pickRecorderMime } from "@/lib/voice/formats";

export type RecorderError = "denied" | "unsupported" | "no_input";
export type Recording = { blob: Blob; mime: string; durationMs: number };
export type RecorderState = "idle" | "starting" | "recording";

const GRANTED_KEY = "lw.voice.micGranted";

function rememberMicGranted() {
  try {
    localStorage.setItem(GRANTED_KEY, "1");
  } catch {
    // private mode or blocked storage: the agent just sees the tap screen again
  }
}

/**
 * True when the microphone is already allowed, so holding + can record at
 * once without a permission prompt appearing mid-press. Where the browser
 * can't say (older Safari), we remember the last successful grant.
 */
export async function micAlreadyGranted(): Promise<boolean> {
  try {
    const status = await navigator.permissions?.query({ name: "microphone" as PermissionName });
    if (status) return status.state === "granted";
  } catch {
    // "microphone" isn't a known permission name in this browser
  }
  try {
    return localStorage.getItem(GRANTED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Records one voice note with MediaRecorder. `stop()` resolves to the
 * recording, or null if nothing was recorded or it was cancelled. The
 * microphone is released as soon as recording ends. At the 5-minute limit it
 * stops by itself and hands the recording to `onAutoStop`.
 */
export function useVoiceRecorder(options?: { onAutoStop?: (recording: Recording) => void }) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<RecorderError | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const resolveRef = useRef<((recording: Recording | null) => void) | null>(null);
  const cancelledRef = useRef(false);
  /** Set by cancel() while the browser is still asking for the microphone. */
  const abortStartRef = useRef(false);
  const onAutoStopRef = useRef(options?.onAutoStop);
  useEffect(() => {
    onAutoStopRef.current = options?.onAutoStop;
  });

  const release = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  const stop = useCallback((): Promise<Recording | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return Promise.resolve(null);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      try {
        recorder.stop();
      } catch {
        resolveRef.current = null;
        release();
        setState("idle");
        resolve(null);
      }
    });
  }, [release]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    abortStartRef.current = true;
    void stop();
  }, [stop]);

  const start = useCallback(async (): Promise<boolean> => {
    if (recorderRef.current) return true;
    abortStartRef.current = false;
    setError(null);
    const mime =
      typeof window !== "undefined" && typeof MediaRecorder !== "undefined"
        ? pickRecorderMime((m) => MediaRecorder.isTypeSupported(m))
        : null;
    if (!mime || !navigator.mediaDevices?.getUserMedia) {
      setError("unsupported");
      return false;
    }

    setState("starting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      setState("idle");
      const name = (e as { name?: string } | null)?.name;
      setError(name === "NotFoundError" || name === "OverconstrainedError" ? "no_input" : "denied");
      return false;
    }
    rememberMicGranted();
    if (abortStartRef.current) {
      // closed while the permission prompt was open: don't start recording
      stream.getTracks().forEach((track) => track.stop());
      setState("idle");
      return false;
    }

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 32_000 });
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      setState("idle");
      setError("unsupported");
      return false;
    }

    streamRef.current = stream;
    recorderRef.current = recorder;
    chunksRef.current = [];
    cancelledRef.current = false;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const durationMs = Date.now() - startedAtRef.current;
      const type = recorder.mimeType || mime;
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      release();
      setState("idle");
      const recording = cancelledRef.current || blob.size === 0 ? null : { blob, mime: type, durationMs };
      const resolve = resolveRef.current;
      resolveRef.current = null;
      if (resolve) resolve(recording);
      else if (recording) onAutoStopRef.current?.(recording);
    };

    startedAtRef.current = Date.now();
    // one chunk a second, so a long note isn't held as one growing buffer
    recorder.start(1000);
    setElapsedMs(0);
    setState("recording");
    timerRef.current = window.setInterval(() => {
      const ms = Date.now() - startedAtRef.current;
      setElapsedMs(ms);
      if (ms >= VOICE_MAX_MS && recorderRef.current?.state === "recording") {
        // no resolver is waiting, so onstop hands the recording to onAutoStop
        try {
          recorderRef.current.stop();
        } catch {
          release();
          setState("idle");
        }
      }
    }, 250);
    return true;
  }, [release]);

  // never leave the microphone on when the sheet unmounts
  useEffect(
    () => () => {
      cancelledRef.current = true;
      try {
        recorderRef.current?.stop();
      } catch {
        // already stopped
      }
      release();
    },
    [release]
  );

  return {
    state,
    elapsedMs,
    warn: state === "recording" && elapsedMs >= VOICE_WARN_MS,
    error,
    clearError: () => setError(null),
    start,
    stop,
    cancel,
  };
}
