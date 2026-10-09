import Papa from "papaparse";

import type { AppLocale } from "@/i18n/config";

import type { Cell, Table } from "./format";

/** Excel reads a UTF-8 CSV's accents only when the file starts with this mark. */
export const CSV_BOM = "﻿";

/** Spanish and Russian Excel split columns on semicolons and read "," as the decimal mark. */
export function csvDialect(locale: AppLocale): { delimiter: string; decimal: string } {
  return locale === "en" ? { delimiter: ",", decimal: "." } : { delimiter: ";", decimal: "," };
}

/*
  Notes and lead texts are pasted from portal emails, so a cell is never
  allowed to start a formula. A leading "'" goes on anything that opens with
  "=", "@", a tab or a CR, and on a leading "+" or "-" unless the rest reads as
  a phone or a number ("+34 600 123 456", "-5", "-5,5").
*/
const FORMULA_START = /^[=@\t\r]|^[+-](?![\d\s().,\/-]*$)/;

function csvValue(cell: Cell, decimal: string): string {
  if (cell == null) return "";
  if (cell.type === "number" || cell.type === "integer") {
    // No thousands mark: "250000.5" in English, "250000,5" in Spanish.
    return String(cell.value).replace(".", decimal);
  }
  return cell.value;
}

export function buildCsv({ headers, rows, locale }: Table & { locale: AppLocale }): string {
  const { delimiter, decimal } = csvDialect(locale);
  const body = Papa.unparse(
    {
      fields: headers,
      data: rows.map((row) => row.map((cell) => csvValue(cell, decimal))),
    },
    { delimiter, newline: "\r\n", escapeFormulae: FORMULA_START }
  );
  // Papa ends a header-only file with a line break and any other without one.
  return CSV_BOM + body.replace(/\r\n$/, "");
}
