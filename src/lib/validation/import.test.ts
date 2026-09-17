import { describe, expect, it } from "vitest";

import { checkRowForSide, importBatchSchema, importRowSchema, startImportSchema, type ImportRow } from "./import";

const buyer: ImportRow = {
  first_name: "Ana",
  last_name: "",
  email: null,
  phone: null,
  language: null,
  nationality: null,
  agency: null,
  notes: null,
  priority: false,
  is_active: true,
  stage: "new",
  deal_type: null,
  seller_role: null,
  preferences: null,
  properties: [],
};

describe("importRowSchema", () => {
  it("accepts a one-word name and nothing else", () => {
    expect(importRowSchema.safeParse(buyer).success).toBe(true);
  });

  it.each([
    ["no first name", { first_name: "  " }],
    ["a bad email", { email: "ana(at)example" }],
    ["long notes", { notes: "x".repeat(5001) }],
    ["an unknown stage", { stage: "hot" }],
    ["a negative budget", { preferences: { property_types: [], budget_min: -1, budget_max: null, bedrooms: null, bathrooms: null, area_notes: null } }],
    ["an unknown property type", { properties: [{ property_type: "castle", price: null, bedrooms: null, address: null, city: null, notes: null }] }],
  ])("refuses %s", (_, change) => {
    expect(importRowSchema.safeParse({ ...buyer, ...change }).success).toBe(false);
  });

  it("caps a batch at 200 rows and refuses an empty one", () => {
    expect(importBatchSchema.safeParse(Array(200).fill(buyer)).success).toBe(true);
    expect(importBatchSchema.safeParse(Array(201).fill(buyer)).success).toBe(false);
    expect(importBatchSchema.safeParse([]).success).toBe(false);
  });
});

describe("checkRowForSide", () => {
  const property = { property_type: null, price: 1, bedrooms: null, address: null, city: null, notes: null };

  it("keeps each side's details on its own side", () => {
    expect(checkRowForSide(buyer, "buyer")).toBe(true);
    expect(checkRowForSide(buyer, "seller")).toBe(false); // "new" is a buyer's stage
    expect(checkRowForSide({ ...buyer, properties: [property] }, "buyer")).toBe(false);
    expect(checkRowForSide({ ...buyer, seller_role: "owner" }, "buyer")).toBe(false);

    const seller: ImportRow = { ...buyer, stage: "pending", properties: [property] };
    expect(checkRowForSide(seller, "seller")).toBe(true);
    expect(checkRowForSide({ ...seller, deal_type: "direct" }, "seller")).toBe(false);
  });
});

describe("startImportSchema", () => {
  it("bounds the file name and the row count", () => {
    expect(startImportSchema.safeParse({ side: "buyer", fileName: " clientes.xlsx ", rowCount: 240 }).success).toBe(true);
    expect(startImportSchema.safeParse({ side: "buyer", fileName: "", rowCount: 1 }).success).toBe(false);
    expect(startImportSchema.safeParse({ side: "buyer", fileName: "x.csv", rowCount: 5001 }).success).toBe(false);
  });
});
