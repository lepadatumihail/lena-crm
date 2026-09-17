/**
 * The wizard's data, kept apart from its screens: what a loaded file is,
 * what the agent chose for it, and the pure steps between a sheet and the
 * rows the review shows.
 */
import type { AppLocale } from "@/i18n/config";
import { autoMap, mappingSignature } from "@/lib/import/auto-map";
import { buildImport, type BuildOptions, type RowOutcome, type SkipCode } from "@/lib/import/build";
import { applyCapacity, markDuplicates } from "@/lib/import/dedupe";
import type { Mapping } from "@/lib/import/fields";
import { findHeaderRow } from "@/lib/import/header-row";
import type { ImportSheet, ReadResult } from "@/lib/import/read";
import { DEFAULT_DIAL } from "@/lib/countries";
import { defaultStageForSide, type ClientSide, type Stage } from "@/lib/crm";
import { buildCsv } from "@/lib/transfer/csv";
import type { Cell } from "@/lib/transfer/format";
import { IMPORT_MAX_ROWS } from "@/lib/validation/import";

export type Loaded = Extract<ReadResult, { ok: true }>;

/** Choices that apply to every row; `side` and the header row live beside them. */
export type RowSettings = {
  agency: string;
  defaultDial: string;
  stage: Stage;
  filter: { column: number; values: string[] } | null;
};

export type Choices = {
  headerRow: number;
  mapping: Mapping;
  settings: RowSettings;
};

export function defaultSettings(side: ClientSide): RowSettings {
  return { agency: "", defaultDial: DEFAULT_DIAL, stage: defaultStageForSide(side), filter: null };
}

export function dataRows(sheet: ImportSheet, headerRow: number): string[][] {
  return sheet.grid.slice(headerRow + 1);
}

export function tooManyRows(sheet: ImportSheet, headerRow: number): number | null {
  const count = sheet.grid.length - headerRow - 1;
  return count > IMPORT_MAX_ROWS ? count : null;
}

/** A first pass over a sheet: where its headers are and what its columns hold. */
export function firstChoices(sheet: ImportSheet, side: ClientSide): Choices {
  const headerRow = findHeaderRow(sheet.grid);
  const headers = sheet.grid[headerRow] ?? [];
  return {
    headerRow,
    mapping: autoMap(headers, dataRows(sheet, headerRow), side),
    settings: defaultSettings(side),
  };
}

/* ---------------------------------------------------------------- memory */

const MEMORY_PREFIX = "leadwing:import-mapping";

function memoryKey(side: ClientSide, headers: string[]): string {
  return `${MEMORY_PREFIX}:${side}:${mappingSignature(headers)}`;
}

/** The choices made last time for a file with these headers, if any. */
export function rememberedChoices(side: ClientSide, headers: string[]): Choices | null {
  try {
    const raw = window.localStorage.getItem(memoryKey(side, headers));
    if (!raw) return null;
    const saved = JSON.parse(raw) as Choices;
    return saved.mapping?.length === headers.length ? saved : null;
  } catch {
    return null;
  }
}

/** Only headers and choices are stored, never client data. */
export function rememberChoices(side: ClientSide, headers: string[], choices: Choices): void {
  try {
    window.localStorage.setItem(memoryKey(side, headers), JSON.stringify(choices));
  } catch {
    // Private mode or a full store: the agent just chooses again next time.
  }
}

/* --------------------------------------------------------------- outcomes */

export function buildOutcomes(
  sheet: ImportSheet,
  side: ClientSide,
  { headerRow, mapping, settings }: Choices,
  options: BuildOptions
): RowOutcome[] {
  return buildImport(
    sheet,
    mapping,
    {
      side,
      headerRow,
      agency: settings.agency.trim() || null,
      defaultDial: settings.defaultDial,
      stage: settings.stage,
      filter: settings.filter,
    },
    options
  );
}

/** Duplicates and the plan's cap, applied to a fresh build. */
export function finalOutcomes(
  built: RowOutcome[],
  existingKeys: ReadonlySet<string>,
  skipExisting: boolean,
  capacity: number | null
): RowOutcome[] {
  return applyCapacity(markDuplicates(built, existingKeys, skipExisting), capacity);
}

export type Counts = {
  ready: number;
  withNotes: number;
  skipped: Record<SkipCode, number>;
};

export function countOutcomes(outcomes: RowOutcome[]): Counts {
  const counts: Counts = {
    ready: 0,
    withNotes: 0,
    skipped: { noName: 0, filteredOut: 0, duplicateInFile: 0, duplicateExisting: 0, overCap: 0 },
  };
  for (const outcome of outcomes) {
    if (outcome.status === "ready") {
      counts.ready++;
      if (outcome.warnings.length) counts.withNotes++;
    } else {
      counts.skipped[outcome.reason]++;
    }
  }
  return counts;
}

export const readyRows = (outcomes: RowOutcome[]) =>
  outcomes.filter((o): o is Extract<RowOutcome, { status: "ready" }> => o.status === "ready");

/* --------------------------------------------------- rows not imported */

export type NotImported = { reason: SkipCode | "notImported"; lines: number[]; source: string[][] };

/**
 * A CSV of the file's own rows that were not saved, with why, in the
 * agent's language. Built in the browser from what the wizard already holds.
 */
export function notImportedCsv(
  rows: NotImported[],
  headers: string[],
  labels: { line: string; reason: string; reasonOf: (reason: NotImported["reason"]) => string },
  locale: AppLocale
): string {
  const text = (value: string): Cell => (value ? { type: "text", value } : null);
  const out: Cell[][] = [];
  for (const row of rows) {
    row.source.forEach((cells, i) => {
      out.push([
        { type: "integer", value: row.lines[i] ?? row.lines[0] },
        text(labels.reasonOf(row.reason)),
        ...headers.map((_, c) => text(cells[c] ?? "")),
      ]);
    });
  }
  return buildCsv({ headers: [labels.line, labels.reason, ...headers], rows: out, locale });
}
