"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import * as realActions from "@/lib/actions/import";
import type { ImportActions, ImportContext } from "@/lib/actions/import";
import type { ClientSide } from "@/lib/crm";
import type { RowOutcome } from "@/lib/import/build";
import { cn } from "@/lib/utils";

import { ColumnsStep } from "./columns-step";
import { FileStep } from "./file-step";
import { RecentImports } from "./recent-imports";
import { ReviewStep } from "./review-step";
import { RunStep } from "./run-step";
import {
  buildOutcomes,
  finalOutcomes,
  firstChoices,
  rememberChoices,
  rememberedChoices,
  tooManyRows,
  type Choices,
  type Loaded,
} from "./wizard-state";

type Step = "file" | "columns" | "review" | "run";
const STEPS: Step[] = ["file", "columns", "review", "run"];

type LoadedFile = { file: File; result: Loaded };

const DEFAULT_ACTIONS: ImportActions = {
  startClientImport: realActions.startClientImport,
  importClientBatch: realActions.importClientBatch,
  finishClientImport: realActions.finishClientImport,
  previewUndo: realActions.previewUndo,
  undoClientImport: realActions.undoClientImport,
};

/**
 * File → columns → review → import. The file is read in the browser and
 * only the rows the agent has seen are sent, in batches; nothing is saved
 * before the review.
 */
export function ImportWizard({
  side,
  context,
  actions = DEFAULT_ACTIONS,
}: {
  side: ClientSide;
  context: ImportContext;
  /** Server actions; a preview page passes stubs. */
  actions?: ImportActions;
}) {
  const t = useTranslations("imports");
  const [step, setStep] = useState<Step>("file");
  const [loaded, setLoaded] = useState<LoadedFile | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [choices, setChoices] = useState<Choices | null>(null);
  const [skipExisting, setSkipExisting] = useState(true);
  const [recent, setRecent] = useState(context.recent);

  const sheet = loaded?.result.sheets[sheetIndex] ?? null;
  const existingKeys = useMemo(() => new Set(context.existingKeys), [context.existingKeys]);
  const buildOptions = useMemo(
    () => ({
      agencies: context.agencies,
      labels: {
        unreadable: t("notesLabels.unreadable"),
        column: (n: number) => t("notesLabels.column", { n }),
      },
    }),
    [context.agencies, t]
  );

  /** The agent's last choices for this layout, else a first guess. */
  const choicesFor = useCallback(
    (nextSheet: NonNullable<typeof sheet>): Choices => {
      const guess = firstChoices(nextSheet, side);
      const headers = nextSheet.grid[guess.headerRow] ?? [];
      return rememberedChoices(side, headers) ?? guess;
    },
    [side]
  );

  function onLoaded(file: File, result: Loaded) {
    setLoaded({ file, result });
    setSheetIndex(0);
    setChoices(choicesFor(result.sheets[0]));
    setStep("columns");
  }

  function onSheetChange(index: number) {
    if (!loaded) return;
    setSheetIndex(index);
    setChoices(choicesFor(loaded.result.sheets[index]));
  }

  // Built once per set of choices; the review only re-marks duplicates and the cap.
  const [built, setBuilt] = useState<RowOutcome[] | null>(null);
  function onColumnsDone(next: Choices) {
    if (!sheet) return;
    rememberChoices(side, sheet.grid[next.headerRow] ?? [], next);
    setChoices(next);
    setBuilt(buildOutcomes(sheet, side, next, buildOptions));
    setStep("review");
  }

  const outcomes = useMemo(
    () => (built ? finalOutcomes(built, existingKeys, skipExisting, context.capacity) : []),
    [built, existingKeys, skipExisting, context.capacity]
  );

  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);

  function reset() {
    setLoaded(null);
    setChoices(null);
    setBuilt(null);
    setRunning(false);
    setStep("file");
  }

  const rowsOver = sheet && choices ? tooManyRows(sheet, choices.headerRow) : null;

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm" aria-label={t("meta.title")}>
        {STEPS.map((name, i) => {
          const index = STEPS.indexOf(step);
          const state = i < index ? "done" : i === index ? "current" : "todo";
          return (
            <li key={name} className="flex items-center gap-1">
              {i > 0 ? <span className="text-muted-foreground/60 px-1">›</span> : null}
              <span
                aria-current={state === "current" ? "step" : undefined}
                className={cn(
                  "rounded-full px-2.5 py-0.5",
                  state === "current" && "bg-primary/10 text-primary font-medium",
                  state === "done" && "text-foreground",
                  state === "todo" && "text-muted-foreground"
                )}
              >
                {t(`steps.${name}`)}
              </span>
            </li>
          );
        })}
      </ol>

      {step === "file" ? (
        <>
          <FileStep side={side} onLoaded={onLoaded} />
          {recent.length > 0 ? (
            <RecentImports
              imports={recent}
              actions={actions}
              onUndone={(id) => setRecent((list) => list.filter((r) => r.id !== id))}
            />
          ) : null}
        </>
      ) : null}

      {step === "columns" && loaded && sheet && choices ? (
        <ColumnsStep
          side={side}
          sheets={loaded.result.sheets}
          sheetIndex={sheetIndex}
          onSheetChange={onSheetChange}
          choices={choices}
          agencies={context.agencies}
          rowsOver={rowsOver}
          onBack={reset}
          onContinue={onColumnsDone}
        />
      ) : null}

      {step === "review" && sheet && choices ? (
        <ReviewStep
          side={side}
          outcomes={outcomes}
          skipExisting={skipExisting}
          onSkipExistingChange={setSkipExisting}
          capacity={context.capacity}
          limit={context.limit}
          clientCount={context.clientCount}
          onBack={() => setStep("columns")}
          onImport={() => setStep("run")}
        />
      ) : null}

      {step === "run" && loaded && sheet && choices ? (
        <RunStep
          side={side}
          fileName={loaded.file.name}
          headers={sheet.grid[choices.headerRow] ?? []}
          outcomes={outcomes}
          actions={actions}
          onRunningChange={setRunning}
          onAnother={reset}
        />
      ) : null}
    </div>
  );
}
