// @vitest-environment node
import readExcelFile from "read-excel-file/node";
import { describe, expect, it } from "vitest";

import type { AppLocale } from "@/i18n/config";
import type { ClientSide } from "@/lib/crm";
import type { ClientRecord } from "@/lib/transfer/columns";
import { buildCsv } from "@/lib/transfer/csv";
import { clientTable } from "@/lib/transfer/format";
import { contextFor } from "@/lib/transfer/testing";
import { buildWorkbook } from "@/lib/transfer/xlsx";

import { autoMap } from "./auto-map";
import { buildImport } from "./build";
import { findHeaderRow } from "./header-row";
import { readImportFile, type XlsxReader } from "./read";

const readXlsx: XlsxReader = async (input, options) =>
  readExcelFile(Buffer.from(await input.arrayBuffer()), options) as ReturnType<XlsxReader>;

const buyer: ClientRecord = {
  first_name: "Anna",
  last_name: "Karlsson",
  email: "anna@example.com",
  phone: "+46 701234567",
  language: "Swedish",
  nationality: "Swedish",
  agency: "Nordic Homes",
  stage: "viewing",
  deal_type: "collab",
  priority: true,
  is_active: false,
  budget_min: 300000,
  budget_max: 450000.5,
  property_types: ["villa", "new_development"],
  bedrooms: 3,
  bathrooms: 2,
  area_notes: "Nueva Andalucía; cerca del golf",
  notes: "-5% si cierra en octubre\n=SUM(1,2)",
  viewing_count: 4,
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-10T10:00:00Z",
  id: "0b0c5a9e-0000-4000-8000-000000000001",
};

const seller = (property: Partial<ClientRecord>): ClientRecord => ({
  first_name: "Carmen",
  last_name: "Ruiz Peña",
  email: "carmen@example.com",
  phone: "+34 600123456",
  language: "Spanish",
  nationality: "Spanish",
  agency: "Solvilla",
  stage: "qualified",
  seller_role: "representative",
  priority: false,
  is_active: true,
  notes: "Hereda con su hermano",
  ...property,
});
const sellers: ClientRecord[] = [
  seller({ property_type: "villa", price: 1250000, property_bedrooms: 4, address: "Calle Uno 1", city: "Marbella", property_notes: "Vistas al mar" }),
  seller({ property_type: "plot", price: 400000, city: "Benahavís" }),
];

async function reimport(side: ClientSide, locale: AppLocale, format: "csv" | "xlsx", records: ClientRecord[]) {
  const table = clientTable(side, records, contextFor(locale));
  const file =
    format === "csv"
      ? new File([buildCsv({ ...table, locale })], "export.csv")
      : new File([new Uint8Array(await buildWorkbook([{ ...table, name: "Clients" }]))], "export.xlsx");

  const result = await readImportFile(file, { readXlsx });
  if (!result.ok) throw new Error(result.reason);
  const [sheet] = result.sheets;
  const headerRow = findHeaderRow(sheet.grid);
  const mapping = autoMap(sheet.grid[headerRow], sheet.grid.slice(headerRow + 1), side);
  return buildImport(
    sheet,
    mapping,
    { side, headerRow, agency: null, defaultDial: "+34", stage: side === "buyer" ? "new" : "pending", filter: null },
    { agencies: [], labels: { unreadable: "?", column: (n) => `Column ${n}` } }
  );
}

const cases = (["en", "es"] as const).flatMap((locale) =>
  (["csv", "xlsx"] as const).map((format) => ({ locale, format }))
);

describe("a LeadWing export imports back unchanged", () => {
  it.each(cases)("buyers, $locale $format", async ({ locale, format }) => {
    const outcomes = await reimport("buyer", locale, format, [buyer]);
    expect(outcomes).toHaveLength(1);
    const [outcome] = outcomes;
    if (outcome.status !== "ready") throw new Error(outcome.reason);
    expect(outcome.warnings).toEqual([]);
    expect(outcome.row).toEqual({
      first_name: "Anna",
      last_name: "Karlsson",
      email: "anna@example.com",
      phone: "+46 701234567",
      language: "Swedish",
      nationality: "Swedish",
      agency: "Nordic Homes",
      notes: "-5% si cierra en octubre\n=SUM(1,2)",
      priority: true,
      is_active: false,
      stage: "viewing",
      deal_type: "collab",
      seller_role: null,
      preferences: {
        property_types: ["villa", "new_development"],
        budget_min: 300000,
        budget_max: 450000.5,
        bedrooms: 3,
        bathrooms: 2,
        area_notes: "Nueva Andalucía; cerca del golf",
      },
      properties: [],
    });
  });

  it.each(cases)("sellers with two properties, $locale $format", async ({ locale, format }) => {
    const outcomes = await reimport("seller", locale, format, sellers);
    expect(outcomes).toHaveLength(1);
    const [outcome] = outcomes;
    if (outcome.status !== "ready") throw new Error(outcome.reason);
    expect(outcome.warnings).toEqual([]);
    expect(outcome.row).toMatchObject({
      first_name: "Carmen",
      last_name: "Ruiz Peña",
      phone: "+34 600123456",
      language: "Spanish",
      nationality: "Spanish",
      stage: "qualified",
      seller_role: "representative",
      deal_type: null,
      notes: "Hereda con su hermano",
      preferences: null,
      properties: [
        { property_type: "villa", price: 1250000, bedrooms: 4, address: "Calle Uno 1", city: "Marbella", notes: "Vistas al mar" },
        { property_type: "plot", price: 400000, bedrooms: null, address: null, city: "Benahavís", notes: null },
      ],
    });
  });
});
