/**
 * What a file column can be imported as. A target is a place on a client, a
 * buyer's search or a seller's property, or one of the two fall-backs.
 */
import type { ClientSide } from "@/lib/crm";

export const CONTACT_TARGETS = [
  "first_name",
  /** Appended to the first name. */
  "middle_name",
  "last_name",
  /** Appended to the last name: Spanish "Segundo apellido". */
  "second_last_name",
  "full_name",
  "email",
  "phone",
  "language",
  "nationality",
  "agency",
  "notes",
  "stage",
  "priority",
  "is_active",
  /** "Archived", "Oculto": the inverse of `is_active`. */
  "is_inactive",
] as const;

export const BUYER_TARGETS = [
  "deal_type",
  "budget_min",
  "budget_max",
  /** One value or a range: "300.000 - 450.000". */
  "budget",
  "property_types",
  "bedrooms",
  "bathrooms",
  "area_notes",
] as const;

export const SELLER_TARGETS = [
  "seller_role",
  "property_type",
  "price",
  "property_bedrooms",
  "address",
  "city",
  "property_notes",
] as const;

/** Kept as a "Header: value" line in the notes, or left out. */
export const OTHER_TARGETS = ["add_to_notes", "ignore"] as const;

export type ImportTarget =
  | (typeof CONTACT_TARGETS)[number]
  | (typeof BUYER_TARGETS)[number]
  | (typeof SELLER_TARGETS)[number]
  | (typeof OTHER_TARGETS)[number];

/**
 * One column's choice. `rank` orders several email or phone columns: in each
 * row the first one with a usable value wins, lowest rank first, then leftmost.
 */
export type ColumnChoice = { target: ImportTarget; rank?: number };
export type Mapping = ColumnChoice[];

export type TargetGroup = "contact" | "details" | "other";

/** The "Import as" options for a side, in menu order. */
export function targetGroups(
  side: ClientSide
): { group: TargetGroup; targets: readonly ImportTarget[] }[] {
  return [
    { group: "contact", targets: CONTACT_TARGETS },
    { group: "details", targets: side === "buyer" ? BUYER_TARGETS : SELLER_TARGETS },
    { group: "other", targets: OTHER_TARGETS },
  ];
}

export function isTargetOnSide(target: ImportTarget, side: ClientSide): boolean {
  return targetGroups(side).some((g) => g.targets.includes(target));
}

/** Targets many columns may share; every other target belongs to one column. */
export const SHARED_TARGETS: readonly ImportTarget[] = [
  "email",
  "phone",
  "notes",
  "add_to_notes",
  "ignore",
];

/** A row needs a name, so the wizard waits for one of these. */
export const NAME_TARGETS: readonly ImportTarget[] = ["first_name", "last_name", "full_name"];
