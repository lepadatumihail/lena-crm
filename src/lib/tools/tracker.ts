/**
 * The free client tracker (plan 019): an Excel workbook built from the import
 * template's own headers, so a filled-in copy comes into LeadWing with every
 * column matched and nothing to map by hand. Buyers first, then Sellers, then
 * a How-to sheet, all in one language; src/app/downloads/[file]/route.ts
 * builds one per language at build time.
 *
 * Each client sheet ends with three columns of its own: Last contact and Next
 * follow-up (dates the importer keeps as note lines) and Days since contact (a
 * formula it ignores). A row turns amber when its follow-up is due and grey
 * once the client has been quiet for STALE_AFTER_DAYS, the app's own
 * threshold. Export files stay formula-free (lib/transfer/xlsx.ts), so this
 * workbook calls write-excel-file directly.
 *
 * No dropdowns: @onparallel/write-excel-file-data-validation 1.0.0 put its
 * <dataValidations> between the two colour rules' <conditionalFormatting>
 * elements, an order Excel rejects, so the How-to sheet lists the words
 * LeadWing reads instead (plan 019's documented fallback).
 */
import { createTranslator } from "next-intl";
import writeExcelFile, { type CellObject, type Row } from "write-excel-file/node";

import type { AppLocale } from "@/i18n/config";
import { dealTypeLabel, propertyTypeLabel, sellerRoleLabel, stageLabel } from "@/i18n/labels";
import { messagesFor } from "@/i18n/messages";
import { STALE_AFTER_DAYS } from "@/lib/attention";
import { PROPERTY_TYPES, stagesForSide, type ClientSide } from "@/lib/crm";
import { templateTable } from "@/lib/import/template";
import type { TransferColumnKey } from "@/lib/transfer/columns";
import type { TransferContext } from "@/lib/transfer/format";
import { sheetName } from "@/lib/transfer/xlsx";

/* The multi-sheet call's own types. */
type WriteArgs = Parameters<typeof writeExcelFile>;
type TrackerSheet = WriteArgs[0][number];
type TrackerFeature = NonNullable<NonNullable<WriteArgs[1]>["features"]>[number];
type ConditionalRule = NonNullable<TrackerSheet["conditionalFormatting"]>[number];

/** Rows 2–501 come ready to fill: date formats, the formula and the colours. */
export const TRACKER_ROWS = 500;
const FIRST_ROW = 2;
const LAST_ROW = FIRST_ROW + TRACKER_ROWS - 1;

const DATE_FORMAT = "yyyy-mm-dd";
const MIN_WIDTH = 10;
const MAX_WIDTH = 60;

/* Soft fills that sit with the app's mono look; the amber is the app's amber pill. */
const DUE_FILL = "#FFF7C9";
const QUIET_FILL = "#EBEBEB";
const RULE_COLOR = "#D4D4D4";

/** Starting widths for what agents type at length; other columns fit their header. */
const WIDTHS: Partial<Record<TransferColumnKey, number>> = {
  email: 28,
  phone: 16,
  agency: 16,
  area_notes: 28,
  address: 28,
  property_notes: 32,
  notes: 40,
};

function translators(locale: AppLocale) {
  const messages = messagesFor(locale);
  const ctx: TransferContext = {
    locale,
    // A template holds no instants, so the zone never shows.
    timeZone: "Europe/Madrid",
    t: createTranslator({ locale, messages, namespace: "crm" }),
    tt: createTranslator({ locale, messages, namespace: "transfer" }),
  };
  return {
    ctx,
    t: createTranslator({ locale, messages, namespace: "tools.tracker" }),
    nav: createTranslator({ locale, messages, namespace: "nav" }),
    clients: createTranslator({ locale, messages, namespace: "clients.list" }),
  };
}

type Translators = ReturnType<typeof translators>;

/** "A" for the first column, "Z" for the 26th, "AA" after it. */
function letter(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    out = String.fromCharCode(65 + ((n - 1) % 26)) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/*
  write-excel-file writes a formula as it is given, and a file stores it
  without the "=" a spreadsheet shows in front of it. Spreadsheet apps (and
  openpyxl or xlsxwriter, which strip it) expect exactly that, so none of the
  formulas below start with "=".
*/
const daysSince = (lastContact: string) => `IF(${lastContact}="","",TODAY()-${lastContact})`;
const isDue = (nextFollowUp: string) => `AND(${nextFollowUp}<>"",${nextFollowUp}<=TODAY())`;
const isQuiet = (days: string) => `AND(ISNUMBER(${days}),${days}>=${STALE_AFTER_DAYS})`;

/**
 * The two colours over a block of rows, from the columns that drive them.
 * References are relative to the block's first row, with the column pinned,
 * so each row reads its own cells. Where both match, the first rule wins: a
 * follow-up that is due matters more than a quiet week.
 */
function highlights(
  rows: { first: number; last: number },
  width: number,
  columns: { nextFollowUp: number; daysSince: number }
): ConditionalRule[] {
  const cellRange = { from: { row: rows.first, column: 1 }, to: { row: rows.last, column: width } };
  const pinned = (column: number) => `$${letter(column)}${rows.first}`;
  return [
    {
      cellRange,
      condition: { formula: isDue(pinned(columns.nextFollowUp)) },
      style: { backgroundColor: DUE_FILL },
    },
    {
      cellRange,
      condition: { formula: isQuiet(pinned(columns.daysSince)) },
      style: { backgroundColor: QUIET_FILL },
    },
  ];
}

function headerRow(headers: string[]): Row {
  return headers.map((value): CellObject => ({
    value,
    type: String,
    fontWeight: "bold",
    bottomBorderStyle: "thin",
    bottomBorderColor: RULE_COLOR,
  }));
}

const dateCell = (): CellObject => ({ type: Date, format: DATE_FORMAT });

/**
 * The columns that take set words, with the exact words the importer reads
 * back. The How-to sheet lists them, and each column is made wide enough for
 * its longest word.
 */
export function trackerWords(side: ClientSide, ctx: TransferContext): [TransferColumnKey, string[]][] {
  const yesNo = [ctx.tt("values.yes"), ctx.tt("values.no")];
  const stages: [TransferColumnKey, string[]] = [
    "stage",
    stagesForSide(side).map((stage) => stageLabel(ctx.t, stage)),
  ];
  if (side === "buyer") {
    return [
      stages,
      ["deal_type", (["direct", "collab"] as const).map((type) => dealTypeLabel(ctx.t, type))],
      ["priority", yesNo],
      ["is_active", yesNo],
    ];
  }
  return [
    stages,
    ["seller_role", (["owner", "representative"] as const).map((role) => sellerRoleLabel(ctx.t, role))],
    ["priority", yesNo],
    ["is_active", yesNo],
    // A buyer's "Property types" holds several at once, so only a seller's gets a list.
    ["property_type", PROPERTY_TYPES.map((type) => propertyTypeLabel(ctx.t, type))],
  ];
}

function clientSheet(side: ClientSide, { ctx, t }: Translators): TrackerSheet {
  const template = templateTable(side, ctx).headers;
  const headers = [
    ...template,
    t("columns.lastContact"),
    t("columns.nextFollowUp"),
    t("columns.daysSince"),
  ];
  const columns = {
    lastContact: template.length,
    nextFollowUp: template.length + 1,
    daysSince: template.length + 2,
  };
  const at = (key: TransferColumnKey) => {
    const index = template.indexOf(ctx.tt(`columns.${key}`));
    if (index < 0) throw new Error(`tracker: the ${side} template has no ${key} column`);
    return index;
  };

  const data: Row[] = [headerRow(headers)];
  for (let row = FIRST_ROW; row <= LAST_ROW; row++) {
    data.push([
      ...template.map(() => null),
      dateCell(),
      dateCell(),
      {
        type: "Formula",
        value: daysSince(`${letter(columns.lastContact)}${row}`),
        format: "0",
      },
    ]);
  }

  const widths = headers.map((header) => header.length + 2);
  for (const [key, width] of Object.entries(WIDTHS) as [TransferColumnKey, number][]) {
    if (template.includes(ctx.tt(`columns.${key}`))) widths[at(key)] = width;
  }
  for (const [key, words] of trackerWords(side, ctx)) {
    widths[at(key)] = Math.max(widths[at(key)], ...words.map((word) => word.length + 2));
  }

  return {
    sheet: sheetName(ctx.tt(side === "buyer" ? "sheets.buyers" : "sheets.sellers")),
    data,
    columns: widths.map((width) => ({ width: Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width)) })),
    stickyRowsCount: 1,
    stickyColumnsCount: 1,
    conditionalFormatting: highlights({ first: FIRST_ROW, last: LAST_ROW }, headers.length, columns),
  };
}

/** One line of text across the How-to sheet's columns. */
function line(value: string, width: number, style: Partial<CellObject> = {}): Row {
  // Excel doesn't grow a merged row to fit, so a long line gets two lines' height,
  // read from the top.
  const long = value.length > 110;
  return [
    {
      value,
      type: String,
      columnSpan: width,
      wrap: long,
      height: long ? 30 : undefined,
      alignVertical: long ? "top" : undefined,
      ...style,
    },
    ...Array.from({ length: width - 1 }, () => null),
  ];
}

function howToSheet({ ctx, t, nav, clients }: Translators): TrackerSheet {
  const column = (key: TransferColumnKey) => ctx.tt(`columns.${key}`);
  const buyers = ctx.tt("sheets.buyers");
  const sellers = ctx.tt("sheets.sellers");
  const lastContact = t("columns.lastContact");
  const nextFollowUp = t("columns.nextFollowUp");

  const headers = [
    column("first_name"),
    column("last_name"),
    column("stage"),
    lastContact,
    nextFollowUp,
    t("columns.daysSince"),
    t("howTo.exampleMeaning"),
  ];
  const width = headers.length;
  const steps = [
    t("howTo.steps.rows", { buyers, sellers }),
    t("howTo.steps.lists", {
      stage: column("stage"),
      priority: column("priority"),
      active: column("is_active"),
    }),
    t("howTo.steps.lastContact", { column: lastContact }),
    t("howTo.steps.nextFollowUp", { column: nextFollowUp }),
    t("howTo.steps.colours", { column: nextFollowUp, days: STALE_AFTER_DAYS }),
    t("howTo.steps.columns"),
  ];

  const data: Row[] = [
    line(t("howTo.title"), width, { fontWeight: "bold", fontSize: 14 }),
    line(t("howTo.intro"), width),
    [],
    line(t("howTo.stepsHeading"), width, { fontWeight: "bold" }),
    ...steps.map((step, i) => line(`${i + 1}. ${step}`, width)),
    [],
    line(t("howTo.exampleHeading"), width, { fontWeight: "bold" }),
    headerRow(headers),
  ];

  // The example rows date from today, so their colours stay true whenever the file is opened.
  const firstExample = data.length + 1;
  const example = (
    first: string,
    last: string,
    stage: string,
    since: number,
    due: boolean,
    meaning: string
  ): Row => {
    const row = data.length + 1;
    return [
      { value: first, type: String },
      { value: last, type: String },
      { value: stageLabel(ctx.t, stage), type: String },
      { value: `TODAY()-${since}`, type: "Formula", format: DATE_FORMAT },
      due ? { value: "TODAY()", type: "Formula", format: DATE_FORMAT } : dateCell(),
      { value: daysSince(`D${row}`), type: "Formula", format: "0" },
      { value: meaning, type: String },
    ];
  };
  // The same made-up people as the import template's samples.
  data.push(example("Anna", "Karlsson", "viewing", 2, true, t("howTo.exampleDue")));
  data.push(example("James", "Holt", "qualified", STALE_AFTER_DAYS + 5, false, t("howTo.exampleQuiet")));
  const lastExample = data.length;

  // The words a column takes, once per column: both sides share all but three.
  const buyerWords = new Map(trackerWords("buyer", ctx));
  const sellerWords = new Map(trackerWords("seller", ctx));
  const list = (words: string[] | undefined) => (words ?? []).join(", ");
  data.push(
    [],
    line(t("howTo.wordsHeading"), width, { fontWeight: "bold" }),
    ...[
      t("howTo.wordsStage", { column: column("stage"), sheet: buyers, words: list(buyerWords.get("stage")) }),
      t("howTo.wordsStage", { column: column("stage"), sheet: sellers, words: list(sellerWords.get("stage")) }),
      t("howTo.wordsColumn", { column: column("deal_type"), words: list(buyerWords.get("deal_type")) }),
      t("howTo.wordsColumn", { column: column("seller_role"), words: list(sellerWords.get("seller_role")) }),
      t("howTo.wordsPair", {
        first: column("priority"),
        second: column("is_active"),
        words: list(buyerWords.get("priority")),
      }),
      t("howTo.wordsTypes", {
        buyers: column("property_types"),
        sellers: column("property_type"),
        words: list(sellerWords.get("property_type")),
      }),
    ].map((text) => line(text, width))
  );

  data.push(
    [],
    line(
      t("howTo.import", {
        buyersPage: nav("buyers"),
        buyersSheet: buyers,
        sellersPage: nav("sellers"),
        sellersSheet: sellers,
        action: clients("import"),
      }),
      width,
      { fontWeight: "bold" }
    )
  );

  return {
    sheet: sheetName(t("howToSheet")),
    data,
    columns: headers.map((header, i) => ({
      width: i === width - 1 ? 34 : Math.max(12, header.length + 2),
    })),
    conditionalFormatting: highlights({ first: firstExample, last: lastExample }, width, {
      nextFollowUp: 4,
      daysSince: 5,
    }),
  };
}

/**
 * Formula cells carry no cached result (write-excel-file doesn't compute
 * them), so the workbook asks the app to calculate everything as it opens.
 */
const calculateOnOpen: TrackerFeature = {
  files: {
    transform: {
      "xl/workbook.xml": {
        transform: (xml) => xml.replace("<calcPr/>", '<calcPr fullCalcOnLoad="1"/>'),
      },
    },
  },
};

/** The client tracker in one language, as `.xlsx` bytes. */
export async function buildTracker(locale: AppLocale): Promise<Buffer> {
  const tr = translators(locale);
  const sheets = [clientSheet("buyer", tr), clientSheet("seller", tr), howToSheet(tr)];
  return writeExcelFile(sheets, { features: [calculateOnOpen] }).toBuffer();
}
