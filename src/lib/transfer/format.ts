/**
 * Turns raw database values into typed cells. The CSV and Excel writers both
 * read these cells, so a value means the same thing in either file.
 */
import type enTransfer from "../../../messages/en/transfer.json";
import type { AppLocale } from "@/i18n/config";
import {
  dealTypeLabel,
  languageLabel,
  nationalityLabel,
  propertyTypeLabel,
  sellerRoleLabel,
  stageLabel,
  type CrmT,
} from "@/i18n/labels";
import type { ClientSide } from "@/lib/crm";

import {
  columnsForSide,
  type ClientRecord,
  type TransferKind,
} from "./columns";

type Transfer = typeof enTransfer;
type NestedKeys<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : NestedKeys<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TransferKey = NestedKeys<Transfer>;
export type TransferT = (
  key: TransferKey,
  values?: Record<string, string | number>
) => string;

/** A typed value; `null` is an empty cell. */
export type Cell =
  | { type: "text"; value: string }
  /** Money: may carry cents. */
  | { type: "number"; value: number }
  | { type: "integer"; value: number }
  /** A calendar day as `YYYY-MM-DD`. */
  | { type: "date"; value: string }
  | null;

/** One table ready for a writer: a header row and its cells. */
export type Table = { headers: string[]; rows: Cell[][] };

export type TransferContext = {
  locale: AppLocale;
  timeZone: string;
  /** The `crm` translator, for stages, property types and languages. */
  t: CrmT;
  /** The `transfer` translator, for headers and yes/no. */
  tt: TransferT;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function text(value: unknown): Cell {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed ? { type: "text", value: trimmed } : null;
}

function numeric(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** "2026-09-16 14:05": an instant's wall clock in an IANA zone. */
export function instantInTimeZone(iso: string, timeZone: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = (zone: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
  let list: Intl.DateTimeFormatPart[];
  try {
    list = parts(timeZone);
  } catch {
    list = parts("UTC");
  }
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    list.find((p) => p.type === type)?.value ?? "";
  // Some ICU builds write midnight as "24" with hour12: false.
  const hour = String(Number(get("hour")) % 24).padStart(2, "0");
  return `${get("year")}-${get("month")}-${get("day")} ${hour}:${get("minute")}`;
}

export function cellFor(kind: TransferKind, raw: unknown, ctx: TransferContext): Cell {
  switch (kind) {
    case "text":
      return text(raw);
    case "number": {
      const value = numeric(raw);
      return value == null ? null : { type: "number", value };
    }
    case "integer": {
      const value = numeric(raw);
      return value == null ? null : { type: "integer", value: Math.round(value) };
    }
    case "date": {
      // A timestamp in a date column keeps its day.
      const day = typeof raw === "string" ? raw.slice(0, 10) : "";
      return DATE_RE.test(day) ? { type: "date", value: day } : null;
    }
    case "instant":
      return typeof raw === "string" ? text(instantInTimeZone(raw, ctx.timeZone)) : null;
    case "boolean":
      if (raw == null) return null;
      return text(ctx.tt(raw ? "values.yes" : "values.no"));
    case "enum:stage":
      return typeof raw === "string" ? text(stageLabel(ctx.t, raw)) : null;
    case "enum:deal_type":
      return raw === "direct" || raw === "collab" ? text(dealTypeLabel(ctx.t, raw)) : text(raw);
    case "enum:seller_role":
      return raw === "owner" || raw === "representative"
        ? text(sellerRoleLabel(ctx.t, raw))
        : text(raw);
    case "language":
      return typeof raw === "string" ? text(languageLabel(ctx.t, raw)) : null;
    case "nationality":
      return typeof raw === "string" ? text(nationalityLabel(ctx.t, raw)) : null;
    case "property_type":
      return typeof raw === "string" ? text(propertyTypeLabel(ctx.t, raw)) : null;
    case "property_types":
      return Array.isArray(raw)
        ? text(raw.map((type) => propertyTypeLabel(ctx.t, String(type))).join(", "))
        : null;
  }
}

/** A side's client records as a table, columns in file order. */
export function clientTable(
  side: ClientSide,
  records: ClientRecord[],
  ctx: TransferContext
): Table {
  const columns = columnsForSide(side);
  return {
    headers: columns.map((c) => ctx.tt(`columns.${c.key}`)),
    rows: records.map((record) =>
      columns.map((c) => cellFor(c.kind, record[c.key], ctx))
    ),
  };
}
