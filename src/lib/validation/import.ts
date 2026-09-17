/**
 * The contract between the import wizard and `import_clients()`: one row is a
 * client with a buyer's search or a seller's properties. The wizard builds
 * rows in the browser, so the server checks every one of them again.
 */
import { z } from "zod";

import { BUYER_STAGES, PROPERTY_TYPES, SELLER_STAGES, type ClientSide } from "@/lib/crm";

/** Rows per call: what `import_clients()` accepts. */
export const IMPORT_BATCH_ROWS = 200;
export const IMPORT_MAX_PROPERTIES = 20;
export const IMPORT_MAX_ROWS = 5000;

const money = z.number().finite().min(0).max(1e10).nullable();
const count = z.number().int().min(0).max(50).nullable();
const text = (max: number) => z.string().max(max).nullable();

export const importRowSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().max(100),
  email: z.email().max(254).nullable(),
  phone: text(50),
  language: text(50),
  nationality: text(50),
  agency: text(120),
  notes: text(5000),
  priority: z.boolean(),
  is_active: z.boolean(),
  stage: z.enum([...BUYER_STAGES, ...SELLER_STAGES]),
  deal_type: z.enum(["direct", "collab"]).nullable(),
  seller_role: z.enum(["owner", "representative"]).nullable(),
  preferences: z
    .object({
      property_types: z.array(z.enum(PROPERTY_TYPES)).max(PROPERTY_TYPES.length),
      budget_min: money,
      budget_max: money,
      bedrooms: count,
      bathrooms: count,
      area_notes: text(2000),
    })
    .nullable(),
  properties: z
    .array(
      z.object({
        property_type: z.enum(PROPERTY_TYPES).nullable(),
        price: money,
        bedrooms: count,
        address: text(300),
        city: text(120),
        notes: text(2000),
      })
    )
    .max(IMPORT_MAX_PROPERTIES),
});

export const importBatchSchema = z.array(importRowSchema).min(1).max(IMPORT_BATCH_ROWS);

export type ImportRow = z.infer<typeof importRowSchema>;
export type ImportPreferences = NonNullable<ImportRow["preferences"]>;
export type ImportProperty = ImportRow["properties"][number];

/** A buyer row carries no properties and a seller row no search; the stage is the side's own. */
export function checkRowForSide(row: ImportRow, side: ClientSide): boolean {
  const stages: readonly string[] = side === "buyer" ? BUYER_STAGES : SELLER_STAGES;
  if (!stages.includes(row.stage)) return false;
  return side === "buyer"
    ? row.properties.length === 0 && row.seller_role === null
    : row.preferences === null && row.deal_type === null;
}

export const startImportSchema = z.object({
  side: z.enum(["buyer", "seller"]),
  fileName: z.string().trim().min(1).max(200),
  rowCount: z.number().int().min(0).max(IMPORT_MAX_ROWS),
});
