import writeExcelFile, { type Cell as XlsxCell } from "write-excel-file/node";

import type { Cell, Table } from "./format";

export type WorkbookSheet = Table & {
  /** The sheet's tab name, in the UI language. */
  name: string;
};

const MAX_WIDTH = 60;

/** Excel allows 31 characters in a sheet name and none of : \ / ? * [ ] */
export function sheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31) || "Sheet";
}

/*
  Cells are typed, so nothing here needs formula escaping: a note that starts
  with "=" is written as text and never evaluated, and a phone stays "+34 …".
*/
function xlsxCell(cell: Cell): XlsxCell {
  if (cell == null) return null;
  switch (cell.type) {
    case "number":
      // Excel shows the thousands mark of the reader's own locale.
      return {
        value: cell.value,
        type: Number,
        format: Number.isInteger(cell.value) ? "#,##0" : "#,##0.00",
      };
    case "integer":
      return { value: cell.value, type: Number };
    case "date": {
      const [year, month, day] = cell.value.split("-").map(Number);
      return {
        value: new Date(Date.UTC(year, month - 1, day)),
        type: Date,
        format: "yyyy-mm-dd",
      };
    }
    case "text":
      return { value: cell.value, type: String };
  }
}

/** Characters a cell shows; a date's value is already its "yyyy-mm-dd" text. */
function cellLength(cell: Cell): number {
  return cell == null ? 0 : String(cell.value).length;
}

function columnWidths({ headers, rows }: Table): { width: number }[] {
  return headers.map((header, index) => {
    let longest = header.length;
    for (const row of rows) longest = Math.max(longest, cellLength(row[index] ?? null));
    return { width: Math.min(MAX_WIDTH, longest + 2) };
  });
}

/** An `.xlsx` workbook with a bold, frozen header row on every sheet. */
export async function buildWorkbook(sheets: WorkbookSheet[]): Promise<Buffer> {
  return writeExcelFile(
    sheets.map((sheet) => ({
      sheet: sheetName(sheet.name),
      data: [
        sheet.headers.map((header) => ({
          value: header,
          type: String,
          fontWeight: "bold" as const,
        })),
        ...sheet.rows.map((row) => row.map(xlsxCell)),
      ],
      columns: columnWidths(sheet),
      stickyRowsCount: 1,
    }))
  ).toBuffer();
}
