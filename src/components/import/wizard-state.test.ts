import { describe, expect, it } from "vitest";

import type { RowOutcome, WarningCode } from "@/lib/import/build";
import type { ImportRow } from "@/lib/validation/import";

import { countOutcomes, notImportedCsv } from "./wizard-state";

const ready = (line: number, warnings: WarningCode[] = []): RowOutcome => ({
  status: "ready",
  lines: [line],
  source: [[`row ${line}`]],
  warnings,
  row: {} as ImportRow,
});
const skipped = (line: number, reason: "noName" | "overCap"): RowOutcome => ({
  status: "skipped",
  lines: [line],
  source: [[`row ${line}`]],
  reason,
});

describe("countOutcomes", () => {
  it("counts ready rows, warned rows and each skip reason", () => {
    const counts = countOutcomes([ready(2), ready(3, ["phoneNoCountry"]), skipped(4, "noName"), skipped(5, "overCap")]);
    expect(counts.ready).toBe(2);
    expect(counts.withNotes).toBe(1);
    expect(counts.skipped).toMatchObject({ noName: 1, overCap: 1, duplicateInFile: 0 });
  });
});

describe("notImportedCsv", () => {
  it("writes one line per source row with its reason, in the file's own columns", () => {
    const csv = notImportedCsv(
      [
        { reason: "noName", lines: [4], source: [["", "ana@example.com"]] },
        { reason: "notImported", lines: [8, 9], source: [["Carmen", "c@example.com"], ["Carmen", ""]] },
      ],
      ["Nombre", "Email"],
      { line: "Fila", reason: "Motivo", reasonOf: (r) => (r === "noName" ? "Sin nombre" : "No importado") },
      "es"
    );
    expect(csv.replace(/^﻿/, "").split("\r\n")).toEqual([
      "Fila;Motivo;Nombre;Email",
      "4;Sin nombre;;ana@example.com",
      "8;No importado;Carmen;c@example.com",
      "9;No importado;Carmen;",
    ]);
  });
});
