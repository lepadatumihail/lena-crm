// @vitest-environment node
import { strFromU8, unzipSync } from "fflate";
import readExcelFile from "read-excel-file/node";
import { describe, expect, it } from "vitest";

import type { AppLocale } from "@/i18n/config";
import { stageLabel } from "@/i18n/labels";
import { messagesFor } from "@/i18n/messages";
import type { ClientSide } from "@/lib/crm";
import { autoMap } from "@/lib/import/auto-map";
import { buildImport } from "@/lib/import/build";
import { findHeaderRow } from "@/lib/import/header-row";
import {
  normalizeDealType,
  normalizeSellerRole,
  normalizeStage,
  parsePropertyTypes,
  parseYesNo,
} from "@/lib/import/normalize";
import { readImportFile, type XlsxReader } from "@/lib/import/read";
import { matchHeader } from "@/lib/import/synonyms";
import { templateTable } from "@/lib/import/template";
import { columnsForSide, type TransferColumnKey } from "@/lib/transfer/columns";
import { contextFor } from "@/lib/transfer/testing";
import { buildWorkbook } from "@/lib/transfer/xlsx";

import { TRACKER_ROWS, buildTracker, trackerWords } from "./tracker";

const readXlsx: XlsxReader = async (input, options) =>
  readExcelFile(Buffer.from(await input.arrayBuffer()), options) as ReturnType<XlsxReader>;

const LANGUAGES = ["en", "es"] as const;
const SIDES = ["buyer", "seller"] as const;
const SHEET_FILE: Record<ClientSide, string> = {
  buyer: "xl/worksheets/sheet1.xml",
  seller: "xl/worksheets/sheet2.xml",
};

const workbooks = new Map<AppLocale, Promise<Buffer>>();
function tracker(locale: AppLocale): Promise<Buffer> {
  if (!workbooks.has(locale)) workbooks.set(locale, buildTracker(locale));
  return workbooks.get(locale)!;
}

async function xmlOf(locale: AppLocale): Promise<(path: string) => string> {
  const files = unzipSync(new Uint8Array(await tracker(locale)));
  return (path) => strFromU8(files[path]);
}

function words(locale: AppLocale) {
  const { tools, transfer } = messagesFor(locale);
  const { lastContact, nextFollowUp, daysSince } = tools.tracker.columns;
  return {
    sheets: [transfer.sheets.buyers, transfer.sheets.sellers, tools.tracker.howToSheet],
    columns: [lastContact, nextFollowUp, daysSince],
  };
}

/** The import template's columns for a side, as keys, in file order. */
function templateKeys(side: ClientSide, locale: AppLocale): TransferColumnKey[] {
  const ctx = contextFor(locale);
  const headers = templateTable(side, ctx).headers;
  return columnsForSide(side)
    .map((column) => column.key)
    .filter((key) => headers.includes(ctx.tt(`columns.${key}`)));
}

/**
 * The parts of a worksheet in the order the format fixes (CT_Worksheet in
 * ECMA-376). Excel offers to repair a file that breaks it, which is how the
 * dropdown plugin failed: it put <dataValidations> between two
 * <conditionalFormatting> parts.
 */
const WORKSHEET_ORDER = [
  "sheetPr", "dimension", "sheetViews", "sheetFormatPr", "cols", "sheetData", "sheetCalcPr",
  "sheetProtection", "protectedRanges", "scenarios", "autoFilter", "sortState", "dataConsolidate",
  "customSheetViews", "mergeCells", "phoneticPr", "conditionalFormatting", "dataValidations",
  "hyperlinks", "printOptions", "pageMargins", "pageSetup", "headerFooter", "rowBreaks", "colBreaks",
  "customProperties", "cellWatches", "ignoredErrors", "smartTags", "drawing", "legacyDrawing",
  "legacyDrawingHF", "picture", "oleObjects", "controls", "webPublishItems", "tableParts", "extLst",
];

/** The tag names directly inside <worksheet>, in file order. */
function worksheetParts(xml: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  for (const [, closing, name, selfClosing] of xml.matchAll(/<(\/?)([A-Za-z][\w:]*)[^>]*?(\/?)>/g)) {
    if (name === "worksheet") continue;
    if (closing) depth--;
    else {
      if (depth === 0) parts.push(name);
      if (!selfClosing) depth++;
    }
  }
  return parts;
}

/** 0 → "A", 26 → "AA". */
function columnLetters(index: number): string {
  return index < 26
    ? String.fromCharCode(65 + index)
    : columnLetters(Math.floor(index / 26) - 1) + columnLetters(index % 26);
}

describe.each(LANGUAGES)("the %s client tracker", (locale) => {
  it("has the Buyers, Sellers and How-to sheets, named in its language", async () => {
    const sheets = await readExcelFile(await tracker(locale));
    expect(sheets.map(({ sheet }) => sheet)).toEqual(words(locale).sheets);
  });

  it.each(SIDES)("%s: a header row, no data rows, every column matched", async (side) => {
    const ctx = contextFor(locale);
    const sheets = await readExcelFile(await tracker(locale));
    const raw = sheets[side === "buyer" ? 0 : 1].data;
    // Formats, formulas and lists, but not one value under the header.
    expect(raw.slice(1).flat().filter((value) => value != null && value !== "")).toEqual([]);

    const file = new File([new Uint8Array(await tracker(locale))], "tracker.xlsx");
    const result = await readImportFile(file, { readXlsx });
    if (!result.ok) throw new Error(result.reason);
    const sheet = result.sheets[side === "buyer" ? 0 : 1];
    expect(sheet.grid).toHaveLength(1);
    expect(findHeaderRow(sheet.grid)).toBe(0);

    const headers = sheet.grid[0];
    expect(headers).toEqual([...templateTable(side, ctx).headers, ...words(locale).columns]);

    const keys = templateKeys(side, locale);
    const targets = autoMap(headers, [], side).map((choice) => choice.target);
    expect(targets).toEqual([...keys, "add_to_notes", "add_to_notes", "ignore"]);
    for (const header of words(locale).columns) expect(matchHeader(header).exact).toBe(true);
  });

  it.each(SIDES)("%s: colours over every data row", async (side) => {
    const xml = (await xmlOf(locale))(SHEET_FILE[side]);
    const lastColumn = columnLetters(templateKeys(side, locale).length + words(locale).columns.length - 1);
    expect(xml.match(/<conditionalFormatting /g)).toHaveLength(2);
    expect(xml).toContain(`<conditionalFormatting sqref="A2:${lastColumn}${TRACKER_ROWS + 1}">`);
  });

  it.each(["xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml", "xl/worksheets/sheet3.xml"])(
    "%s: parts in the order Excel requires, formulas without their =",
    async (path) => {
      const xml = (await xmlOf(locale))(path);
      const positions = worksheetParts(xml).map((tag) => WORKSHEET_ORDER.indexOf(tag));
      expect(positions).not.toContain(-1);
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
      // A file stores formulas without the "=" a spreadsheet shows.
      expect(xml).not.toMatch(/<f>=|<formula>=/);
    }
  );

  it("lists the words LeadWing reads, and the importer reads every one", async () => {
    const ctx = contextFor(locale);
    const [, , howTo] = await readExcelFile(await tracker(locale));
    const text = howTo.data.flat().filter((value) => typeof value === "string").join("\n");
    for (const side of SIDES) {
      const reads: Partial<Record<TransferColumnKey, (value: string) => boolean>> = {
        stage: (value) => normalizeStage(value, side) !== null,
        deal_type: (value) => normalizeDealType(value) !== null,
        seller_role: (value) => normalizeSellerRole(value) !== null,
        priority: (value) => parseYesNo(value) !== null,
        is_active: (value) => parseYesNo(value) !== null,
        property_type: (value) => parsePropertyTypes(value).types.length === 1,
      };
      for (const [key, list] of trackerWords(side, ctx)) {
        expect(text).toContain(list.join(", "));
        for (const word of list) expect(reads[key]?.(word), `${side} ${key}: ${word}`).toBe(true);
      }
    }
  });

  it("asks the spreadsheet app to calculate as the file opens", async () => {
    const xml = await xmlOf(locale);
    expect(xml("xl/workbook.xml")).toContain('<calcPr fullCalcOnLoad="1"/>');
  });
});

describe("a filled-in tracker row", () => {
  it.each(LANGUAGES)("imports with both dates in the notes (%s)", async (locale) => {
    const ctx = contextFor(locale);
    const [lastContact, nextFollowUp, daysSince] = words(locale).columns;
    const table = {
      headers: [
        ctx.tt("columns.first_name"),
        ctx.tt("columns.last_name"),
        ctx.tt("columns.stage"),
        lastContact,
        nextFollowUp,
        daysSince,
      ],
      rows: [
        [
          { type: "text" as const, value: "Anna" },
          { type: "text" as const, value: "Karlsson" },
          { type: "text" as const, value: stageLabel(ctx.t, "viewing") },
          { type: "date" as const, value: "2026-09-20" },
          { type: "date" as const, value: "2026-10-01" },
          { type: "integer" as const, value: 9 },
        ],
      ],
    };
    const bytes = await buildWorkbook([{ ...table, name: words(locale).sheets[0] }]);
    const result = await readImportFile(new File([new Uint8Array(bytes)], "tracker.xlsx"), { readXlsx });
    if (!result.ok) throw new Error(result.reason);
    const [sheet] = result.sheets;
    const headerRow = findHeaderRow(sheet.grid);
    const mapping = autoMap(sheet.grid[headerRow], sheet.grid.slice(headerRow + 1), "buyer");
    const [outcome] = buildImport(
      sheet,
      mapping,
      { side: "buyer", headerRow, agency: null, defaultDial: "+34", stage: "new", filter: null },
      { agencies: [], labels: { unreadable: "?", column: (n) => `Column ${n}` } }
    );
    if (outcome.status !== "ready") throw new Error(outcome.reason);
    expect(outcome.row).toMatchObject({ first_name: "Anna", last_name: "Karlsson", stage: "viewing" });
    expect(outcome.row.notes).toBe(`${lastContact}: 2026-09-20\n${nextFollowUp}: 2026-10-01`);
  });
});
