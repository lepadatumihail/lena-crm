"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Check, Download, Loader2, RotateCcw, Undo2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import type { ImportActions } from "@/lib/actions/import";
import type { AppLocale } from "@/i18n/config";
import { clientsPath, type ClientSide } from "@/lib/crm";
import { toBatches } from "@/lib/import/batch";
import type { RowOutcome } from "@/lib/import/build";
import { TONE_BG, TONE_INK } from "@/lib/tones";
import { cn } from "@/lib/utils";
import type { ImportRow } from "@/lib/validation/import";

import { UndoDialog } from "./undo-dialog";
import { notImportedCsv, readyRows, type NotImported } from "./wizard-state";

type Phase = "starting" | "running" | "stopping" | "stopped" | "failed" | "done";

type RunState = {
  phase: Phase;
  importId: string | null;
  /** Rows saved so far. */
  imported: number;
  /** Batches sent so far; a retry starts from here. */
  nextBatch: number;
  error: string | null;
  limitReached: boolean;
};

/**
 * Sends the ready rows in batches and shows the outcome. Stop finishes the
 * current batch; an error keeps what was saved and offers the rest again.
 */
export function RunStep({
  side,
  fileName,
  headers,
  outcomes,
  actions,
  onRunningChange,
  onAnother,
}: {
  side: ClientSide;
  fileName: string;
  headers: string[];
  outcomes: RowOutcome[];
  actions: ImportActions;
  onRunningChange: (running: boolean) => void;
  onAnother: () => void;
}) {
  const t = useTranslations("imports");
  const locale = useLocale() as AppLocale;
  const ready = useMemo(() => readyRows(outcomes), [outcomes]);
  const batches = useMemo(() => toBatches(ready), [ready]);
  const total = ready.length;
  const skippedInReview = outcomes.length - total;

  const [state, setState] = useState<RunState>({
    phase: "starting",
    importId: null,
    imported: 0,
    nextBatch: 0,
    error: null,
    limitReached: false,
  });
  const stopRef = useRef(false);
  const startedRef = useRef(false);
  const [undoOpen, setUndoOpen] = useState(false);
  const [undone, setUndone] = useState(false);

  async function send(importId: string, from: number, imported: number) {
    onRunningChange(true);
    setState((s) => ({ ...s, phase: "running", error: null, limitReached: false }));
    let done = imported;
    let index = from;
    for (; index < batches.length; index++) {
      const rows: ImportRow[] = batches[index].map((o) => o.row);
      const result = await actions.importClientBatch(importId, side, rows);
      if (result.error) {
        setState({ phase: "failed", importId, imported: done, nextBatch: index, error: result.error, limitReached: !!result.limitReached });
        onRunningChange(false);
        return;
      }
      done += result.imported ?? rows.length;
      setState((s) => ({ ...s, imported: done, nextBatch: index + 1 }));
      if (stopRef.current) {
        index++;
        break;
      }
    }
    const finished = index >= batches.length;
    await actions.finishClientImport(importId, { skipped: skippedInReview + (total - done) });
    setState({ phase: finished ? "done" : "stopped", importId, imported: done, nextBatch: index, error: null, limitReached: false });
    onRunningChange(false);
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void (async () => {
      const start = await actions.startClientImport({ side, fileName, rowCount: outcomes.length });
      if (start.error || !start.importId) {
        setState((s) => ({ ...s, phase: "failed", error: start.error ?? t("errors.failed") }));
        return;
      }
      await send(start.importId, 0, 0);
    })();
    // Runs once: the rows are fixed when this step mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stop() {
    stopRef.current = true;
    setState((s) => (s.phase === "running" ? { ...s, phase: "stopping" } : s));
  }

  function retry() {
    if (!state.importId) return;
    stopRef.current = false;
    void send(state.importId, state.nextBatch, state.imported);
  }

  const notImported: NotImported[] = useMemo(() => {
    const sentRows = state.phase === "done" ? total : batches.slice(0, state.nextBatch).reduce((n, b) => n + b.length, 0);
    const rows: NotImported[] = [];
    for (const o of outcomes) {
      if (o.status === "skipped") {
        if (o.reason !== "filteredOut") rows.push({ reason: o.reason, lines: o.lines, source: o.source });
      }
    }
    for (const o of ready.slice(sentRows)) rows.push({ reason: "notImported", lines: o.lines, source: o.source });
    return rows;
  }, [outcomes, ready, batches, state.phase, state.nextBatch, total]);

  function downloadNotImported() {
    const csv = notImportedCsv(
      notImported,
      headers,
      {
        line: t("review.line"),
        reason: t("review.reason"),
        reasonOf: (reason) => t(`skips.${reason}`),
      },
      locale
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = t("done.skippedFile");
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const busy = state.phase === "starting" || state.phase === "running" || state.phase === "stopping";
  const percent = total === 0 ? 100 : Math.round((state.imported / total) * 100);

  return (
    <div className="space-y-6">
      {busy ? (
        <section className="bg-card space-y-4 rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <Loader2 className="text-muted-foreground size-5 animate-spin" aria-hidden />
            <p className="text-sm font-medium" aria-live="polite">
              {t("run.progress", { done: state.imported, total })}
            </p>
          </div>
          <div className="bg-muted h-2 overflow-hidden rounded-full" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <div className="bg-primary h-full rounded-full transition-[width] duration-300" style={{ width: `${percent}%` }} />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={stop} disabled={state.phase !== "running"}>
            {state.phase === "stopping" ? t("run.stopping") : t("run.stop")}
          </Button>
        </section>
      ) : null}

      {state.phase === "failed" ? (
        <div className="space-y-4">
          <Notice tone="red">
            <p className="font-medium">{t("run.failed", { done: state.imported, total })}</p>
            <p>{state.error}</p>
          </Notice>
          <div className="flex flex-wrap gap-2">
            {state.limitReached ? (
              <Button asChild>
                <Link href="/pricing">
                  {t("review.upgrade", { count: total - state.imported })} <ArrowRight />
                </Link>
              </Button>
            ) : state.importId ? (
              <Button type="button" onClick={retry}>
                <RotateCcw /> {t("run.retry")}
              </Button>
            ) : null}
            {notImported.length > 0 ? (
              <Button type="button" variant="outline" onClick={downloadNotImported}>
                <Download /> {t("done.downloadSkipped")}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {state.phase === "done" || state.phase === "stopped" ? (
        <section className="bg-card space-y-5 rounded-xl border p-5">
          <div className="flex items-start gap-3">
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", TONE_BG.green, TONE_INK.green)}>
              <Check className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-medium">
                {state.phase === "stopped"
                  ? t("run.stopped", { done: state.imported, total })
                  : t("done.title", { imported: state.imported, skipped: outcomes.length - state.imported })}
              </h3>
              {side === "buyer" && state.imported > 5 ? (
                <p className="text-muted-foreground text-sm">{t("done.digest")}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={clientsPath(side)}>
                {t("done.view", { side })} <ArrowRight />
              </Link>
            </Button>
            {notImported.length > 0 ? (
              <Button type="button" variant="outline" onClick={downloadNotImported}>
                <Download /> {t("done.downloadSkipped")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onAnother}>
              <Upload /> {t("done.another")}
            </Button>
            {state.importId && state.imported > 0 && !undone ? (
              <Button type="button" variant="ghost" onClick={() => setUndoOpen(true)}>
                <Undo2 /> {t("done.undo")}
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {state.importId ? (
        <UndoDialog
          importId={state.importId}
          fileName={fileName}
          actions={actions}
          open={undoOpen}
          onOpenChange={setUndoOpen}
          onUndone={() => setUndone(true)}
        />
      ) : null}
    </div>
  );
}
