/**
 * The column model for client files: what a buyers or sellers spreadsheet
 * holds, in which order, and how each value is written. Export writes these
 * columns and import reads them back, so keys and headers are a contract:
 * when a header is renamed, import keeps the old wording as a synonym.
 *
 * Headers live in the `transfer` message namespace under `columns.<key>` and
 * reuse the labels the client form and detail page show.
 */
import type { ClientSide } from "@/lib/crm";

export type TransferKind =
  | "text"
  /** Money: a number that may carry cents. */
  | "number"
  | "integer"
  /** A calendar day, stored as `YYYY-MM-DD`. */
  | "date"
  /** A timestamp, written in the agent's time zone. */
  | "instant"
  | "boolean"
  | "enum:stage"
  | "enum:deal_type"
  | "enum:seller_role"
  | "language"
  | "nationality"
  | "property_types"
  | "property_type";

type Sides = "both" | ClientSide;

/* File order is this order, filtered by side. */
const COLUMNS = [
  { key: "first_name", kind: "text", sides: "both" },
  { key: "last_name", kind: "text", sides: "both" },
  { key: "email", kind: "text", sides: "both" },
  { key: "phone", kind: "text", sides: "both" },
  { key: "language", kind: "language", sides: "both" },
  { key: "nationality", kind: "nationality", sides: "both" },
  { key: "agency", kind: "text", sides: "both" },
  { key: "stage", kind: "enum:stage", sides: "both" },
  { key: "deal_type", kind: "enum:deal_type", sides: "buyer" },
  { key: "seller_role", kind: "enum:seller_role", sides: "seller" },
  { key: "priority", kind: "boolean", sides: "both" },
  { key: "is_active", kind: "boolean", sides: "both" },
  { key: "budget_min", kind: "number", sides: "buyer" },
  { key: "budget_max", kind: "number", sides: "buyer" },
  { key: "property_types", kind: "property_types", sides: "buyer" },
  { key: "bedrooms", kind: "integer", sides: "buyer" },
  { key: "bathrooms", kind: "integer", sides: "buyer" },
  { key: "area_notes", kind: "text", sides: "buyer" },
  { key: "property_type", kind: "property_type", sides: "seller" },
  { key: "price", kind: "number", sides: "seller" },
  // Shares the "Bedrooms" header with the buyer's column on purpose: the
  // file's side says which one it is.
  { key: "property_bedrooms", kind: "integer", sides: "seller" },
  { key: "address", kind: "text", sides: "seller" },
  { key: "city", kind: "text", sides: "seller" },
  { key: "property_notes", kind: "text", sides: "seller" },
  { key: "notes", kind: "text", sides: "both" },
  { key: "down_payment", kind: "number", sides: "buyer" },
  { key: "down_payment_date", kind: "date", sides: "buyer" },
  { key: "ppc", kind: "number", sides: "buyer" },
  { key: "ppc_date", kind: "date", sides: "buyer" },
  { key: "notary_date", kind: "date", sides: "buyer" },
  { key: "notary_notes", kind: "text", sides: "buyer" },
  { key: "commission", kind: "number", sides: "buyer" },
  { key: "closed_at", kind: "date", sides: "buyer" },
  { key: "viewing_count", kind: "integer", sides: "buyer" },
  { key: "created_at", kind: "instant", sides: "both" },
  { key: "updated_at", kind: "instant", sides: "both" },
  { key: "id", kind: "text", sides: "both" },
] as const satisfies readonly { key: string; kind: TransferKind; sides: Sides }[];

export type TransferColumnKey = (typeof COLUMNS)[number]["key"];
export type TransferColumn = { key: TransferColumnKey; kind: TransferKind };

function columnsOn(side: ClientSide): readonly TransferColumn[] {
  return COLUMNS.filter((c) => c.sides === "both" || c.sides === side).map(
    ({ key, kind }) => ({ key, kind })
  );
}

export const BUYER_COLUMNS = columnsOn("buyer");
export const SELLER_COLUMNS = columnsOn("seller");

export function columnsForSide(side: ClientSide): readonly TransferColumn[] {
  return side === "buyer" ? BUYER_COLUMNS : SELLER_COLUMNS;
}

/**
 * One file row before formatting: raw database values by column key. A seller
 * with several properties gives several records.
 */
export type ClientRecord = Partial<Record<TransferColumnKey, unknown>>;
