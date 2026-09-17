/**
 * Packs a whole account into one ZIP: a CSV per table, the same tables as one
 * Excel workbook, and a README. File names stay English so scripts and other
 * CRMs can rely on them; headers and the README follow the UI language.
 *
 * A new table goes in four places: `loadAccountExport`, `accountTables` here,
 * the `transfer` messages (sheet, headers, README line) and the test.
 */
import { strToU8, zipSync } from "fflate";

import type enTransfer from "../../../messages/en/transfer.json";
import { LOCALE_LABELS, isLocale } from "@/i18n/config";
import { appointmentTypeLabel, taskPriorityLabel, taskStatusLabel } from "@/i18n/labels";
import { planState } from "@/lib/access";
import { clientFullName } from "@/lib/crm";
import { dateKeyInTimeZone } from "@/lib/home";
import { SUPPORT_EMAIL } from "@/lib/site";
import type { TransferKind } from "@/lib/transfer/columns";
import { CSV_BOM, buildCsv, csvDialect } from "@/lib/transfer/csv";
import {
  cellFor,
  clientTable,
  type Table,
  type TransferContext,
  type TransferKey,
} from "@/lib/transfer/format";
import { buildWorkbook } from "@/lib/transfer/xlsx";

import type { AccountExport } from "./load";

type TableHeaders = (typeof enTransfer)["tables"];
type TableName = keyof TableHeaders;
type SheetKey = keyof (typeof enTransfer)["sheets"];

type Column<Row, Name extends TableName> = {
  key: keyof TableHeaders[Name] & string;
  kind: TransferKind;
  value: (row: Row) => unknown;
};

function tableOf<Row, Name extends TableName>(
  name: Name,
  columns: Column<Row, Name>[],
  rows: Row[],
  ctx: TransferContext
): Table {
  return {
    headers: columns.map((c) => ctx.tt(`tables.${name}.${c.key}` as TransferKey)),
    rows: rows.map((row) => columns.map((c) => cellFor(c.kind, c.value(row), ctx))),
  };
}

export const WORKBOOK_FILE = "leadwing-export.xlsx";
export const README_FILE = "README.txt";

/** The tables in file order: the sheet key, the CSV's name, the table. */
export function accountTables(
  data: AccountExport,
  ctx: TransferContext,
  now: Date = new Date()
): { sheet: SheetKey; file: string; table: Table }[] {
  const { t, tt } = ctx;
  const clientName = new Map(data.clients.map((c) => [c.id, clientFullName(c)]));
  const nameOf = (id: string | null) => (id ? clientName.get(id) : null);
  const taskTitle = new Map(data.tasks.map((task) => [task.id, task.title]));
  const propertyById = new Map(data.properties.map((p) => [p.id, p]));
  const profile = data.profile;
  const plan = planState(profile, now);

  return [
    { sheet: "buyers", file: "buyers.csv", table: clientTable("buyer", data.buyers, ctx) },
    { sheet: "sellers", file: "sellers.csv", table: clientTable("seller", data.sellers, ctx) },
    {
      sheet: "viewings",
      file: "viewings.csv",
      table: tableOf(
        "viewings",
        [
          { key: "client_name", kind: "text", value: (v) => nameOf(v.client_id) },
          { key: "client_id", kind: "text", value: (v) => v.client_id },
          { key: "title", kind: "text", value: (v) => v.title },
          { key: "description", kind: "text", value: (v) => v.description },
          { key: "scheduled_at", kind: "instant", value: (v) => v.scheduled_at },
          { key: "had_offer", kind: "boolean", value: (v) => v.had_offer },
          { key: "offer_price", kind: "number", value: (v) => v.offer_price },
          { key: "property_price", kind: "number", value: (v) => v.property_price },
          { key: "created_at", kind: "instant", value: (v) => v.created_at },
          { key: "id", kind: "text", value: (v) => v.id },
        ],
        data.viewings,
        ctx
      ),
    },
    {
      sheet: "appointments",
      file: "appointments.csv",
      table: tableOf(
        "appointments",
        [
          { key: "type", kind: "text", value: (a) => appointmentTypeLabel(t, a.type) },
          { key: "title", kind: "text", value: (a) => a.title },
          { key: "client_name", kind: "text", value: (a) => nameOf(a.client_id) },
          { key: "client_id", kind: "text", value: (a) => a.client_id },
          {
            key: "property",
            kind: "text",
            value: (a) => {
              const property = a.property_id ? propertyById.get(a.property_id) : null;
              return property?.address || property?.city || a.property_label;
            },
          },
          { key: "starts_at", kind: "instant", value: (a) => a.starts_at },
          { key: "ends_at", kind: "instant", value: (a) => a.ends_at },
          { key: "location", kind: "text", value: (a) => a.location },
          { key: "notes", kind: "text", value: (a) => a.notes },
          { key: "reminder_minutes", kind: "integer", value: (a) => a.reminder_minutes },
          { key: "created_at", kind: "instant", value: (a) => a.created_at },
          { key: "id", kind: "text", value: (a) => a.id },
        ],
        data.appointments,
        ctx
      ),
    },
    {
      sheet: "tasks",
      file: "tasks.csv",
      table: tableOf(
        "tasks",
        [
          { key: "title", kind: "text", value: (task) => task.title },
          { key: "description", kind: "text", value: (task) => task.description },
          { key: "status", kind: "text", value: (task) => taskStatusLabel(t, task.status) },
          { key: "priority", kind: "text", value: (task) => taskPriorityLabel(t, task.priority) },
          { key: "due_on", kind: "date", value: (task) => task.due_on },
          { key: "completed_at", kind: "instant", value: (task) => task.completed_at },
          { key: "client_name", kind: "text", value: (task) => nameOf(task.client_id) },
          { key: "client_id", kind: "text", value: (task) => task.client_id },
          { key: "created_at", kind: "instant", value: (task) => task.created_at },
          { key: "id", kind: "text", value: (task) => task.id },
        ],
        data.tasks,
        ctx
      ),
    },
    {
      sheet: "taskNotes",
      file: "task-notes.csv",
      table: tableOf(
        "taskNotes",
        [
          { key: "task_title", kind: "text", value: (n) => taskTitle.get(n.task_id) },
          { key: "task_id", kind: "text", value: (n) => n.task_id },
          { key: "body", kind: "text", value: (n) => n.body },
          { key: "created_at", kind: "instant", value: (n) => n.created_at },
          { key: "id", kind: "text", value: (n) => n.id },
        ],
        data.taskNotes,
        ctx
      ),
    },
    {
      sheet: "templates",
      file: "templates.csv",
      table: tableOf(
        "templates",
        [
          { key: "name", kind: "text", value: (e) => e.name },
          { key: "subject", kind: "text", value: (e) => e.subject },
          { key: "body", kind: "text", value: (e) => e.body },
          { key: "created_at", kind: "instant", value: (e) => e.created_at },
          { key: "updated_at", kind: "instant", value: (e) => e.updated_at },
          { key: "id", kind: "text", value: (e) => e.id },
        ],
        data.templates,
        ctx
      ),
    },
    {
      sheet: "dealAnalyses",
      file: "deal-analyses.csv",
      table: tableOf(
        "dealAnalyses",
        [
          { key: "title", kind: "text", value: (d) => d.title },
          { key: "analysis_date", kind: "date", value: (d) => d.analysis_date },
          {
            key: "property_type",
            kind: "text",
            value: (d) => tt(`dealPropertyTypes.${d.property_type}`),
          },
          { key: "asking_price", kind: "number", value: (d) => d.asking_price },
          { key: "transfer_tax_pct", kind: "number", value: (d) => d.transfer_tax_pct },
          { key: "lawyer_pct", kind: "number", value: (d) => d.lawyer_pct },
          { key: "notary_pct", kind: "number", value: (d) => d.notary_pct },
          {
            key: "renovation_price_per_sqm",
            kind: "number",
            value: (d) => d.renovation_price_per_sqm,
          },
          { key: "surface_sqm", kind: "number", value: (d) => d.surface_sqm },
          { key: "contingency_pct", kind: "number", value: (d) => d.contingency_pct },
          { key: "duration_months", kind: "number", value: (d) => d.duration_months },
          { key: "expected_sale_price", kind: "number", value: (d) => d.expected_sale_price },
          { key: "agency_fee_pct", kind: "number", value: (d) => d.agency_fee_pct },
          { key: "notes", kind: "text", value: (d) => d.notes },
          { key: "created_at", kind: "instant", value: (d) => d.created_at },
          { key: "id", kind: "text", value: (d) => d.id },
        ],
        data.dealAnalyses,
        ctx
      ),
    },
    {
      sheet: "files",
      file: "files.csv",
      table: tableOf(
        "files",
        [
          { key: "client_name", kind: "text", value: (f) => nameOf(f.client_id) },
          { key: "client_id", kind: "text", value: (f) => f.client_id },
          { key: "attached_to", kind: "text", value: (f) => tt(`attachedTo.${f.attached_to}`) },
          { key: "parent_id", kind: "text", value: (f) => f.parent_id },
          { key: "file_name", kind: "text", value: (f) => f.file_name },
          { key: "mime_type", kind: "text", value: (f) => f.mime_type },
          { key: "size", kind: "integer", value: (f) => f.size },
          { key: "created_at", kind: "instant", value: (f) => f.created_at },
          { key: "id", kind: "text", value: (f) => f.id },
        ],
        data.files,
        ctx
      ),
    },
    {
      sheet: "account",
      file: "account.csv",
      table: tableOf(
        "account",
        [
          { key: "full_name", kind: "text", value: (p) => p?.full_name },
          { key: "email", kind: "text", value: (p) => data.email ?? p?.email },
          {
            key: "language",
            kind: "text",
            value: (p) => (isLocale(p?.locale) ? LOCALE_LABELS[p.locale] : p?.locale),
          },
          { key: "time_zone", kind: "text", value: () => ctx.timeZone },
          { key: "plan", kind: "text", value: () => tt(`plans.${plan.tier}`) },
          { key: "pro_until", kind: "instant", value: () => plan.proUntil },
          { key: "founding_number", kind: "integer", value: (p) => p?.founding_number },
          { key: "created_at", kind: "instant", value: (p) => p?.created_at },
        ],
        [profile],
        ctx
      ),
    },
  ];
}

function readme(
  tables: { sheet: SheetKey; file: string }[],
  data: AccountExport,
  ctx: TransferContext,
  now: Date
): string {
  const { tt } = ctx;
  const { delimiter, decimal } = csvDialect(ctx.locale);
  const lines = [
    tt("readme.title"),
    tt("readme.generated", {
      date: dateKeyInTimeZone(now.toISOString(), ctx.timeZone),
      email: data.email ?? data.profile?.email ?? "",
    }),
    "",
    tt("readme.filesHeading"),
    `- ${WORKBOOK_FILE}: ${tt("readme.workbook")}`,
    ...tables.map(({ sheet, file }) => `- ${file}: ${tt(`readme.${sheet}`)}`),
    "",
    tt("readme.formatHeading"),
    `- ${tt("readme.timeZone", { timeZone: ctx.timeZone })}`,
    `- ${tt("readme.csv", { delimiter, decimal })}`,
    `- ${tt("readme.ids")}`,
    `- ${tt("readme.uploads", { email: SUPPORT_EMAIL })}`,
    "",
  ];
  // The mark and CRLF keep accents and line breaks right in Windows Notepad.
  return CSV_BOM + lines.join("\r\n");
}

export async function buildAccountZip(
  data: AccountExport,
  ctx: TransferContext,
  now: Date = new Date()
): Promise<Uint8Array> {
  const tables = accountTables(data, ctx, now);
  const workbook = await buildWorkbook(
    tables.map(({ sheet, table }) => ({ name: ctx.tt(`sheets.${sheet}`), ...table }))
  );

  const files: Record<string, Uint8Array> = {
    [README_FILE]: strToU8(readme(tables, data, ctx, now)),
    [WORKBOOK_FILE]: new Uint8Array(workbook),
  };
  for (const { file, table } of tables) {
    files[file] = strToU8(buildCsv({ ...table, locale: ctx.locale }));
  }
  return zipSync(files, { level: 6 });
}
