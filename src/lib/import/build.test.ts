import { describe, expect, it } from "vitest";

import { importRowSchema, checkRowForSide } from "@/lib/validation/import";

import { autoMap } from "./auto-map";
import { buildImport, type BuildOptions, type ImportSettings, type RowOutcome } from "./build";
import type { ImportSheet } from "./read";

const options: BuildOptions = {
  agencies: ["Solvilla", "Solvilla", "SOLVILLA"],
  labels: { unreadable: "not recognised", column: (n) => `Column ${n}` },
};

function sheetOf(rows: string[][], firstRowNumber = 1): ImportSheet {
  return { name: "test", grid: rows, rowNumbers: rows.map((_, i) => firstRowNumber + i) };
}

function build(rows: string[][], settings: Partial<ImportSettings> = {}, sheet = sheetOf(rows)) {
  const side = settings.side ?? "buyer";
  const headerRow = settings.headerRow ?? 0;
  const full: ImportSettings = {
    side,
    headerRow,
    agency: null,
    defaultDial: "+34",
    stage: side === "buyer" ? "new" : "pending",
    filter: null,
    ...settings,
  };
  const mapping = autoMap(sheet.grid[headerRow], sheet.grid.slice(headerRow + 1), side);
  return buildImport(sheet, mapping, full, options);
}

function ready(outcome: RowOutcome) {
  if (outcome.status !== "ready") throw new Error(`skipped: ${outcome.reason}`);
  return outcome;
}

describe("buildImport: a buyers file", () => {
  it("fills the contact, the search and the notes, in order", () => {
    const [outcome] = build([
      ["Nombre", "Apellidos", "Email", "Móvil", "Teléfono", "Idioma", "Nacionalidad", "Notas", "Procedencia", "Estado", "Presupuesto", "Tipo", "Dormitorios", "Zona"],
      ["ANA MARÍA", "ruiz", "ana@example.com", "600 123 456", "952 111 222", "Inglés", "Británica", "Busca vistas al mar", "Idealista", "Caliente", "300.000 - 450.000", "Villa, Castillo", "3+", "Nueva Andalucía"],
    ]).map(ready);

    expect(outcome.row).toMatchObject({
      first_name: "Ana María",
      last_name: "ruiz",
      email: "ana@example.com",
      phone: "+34 600123456",
      language: "English",
      nationality: "British",
      stage: "new",
      priority: false,
      is_active: true,
      preferences: {
        property_types: ["villa"],
        budget_min: 300000,
        budget_max: 450000,
        bedrooms: 3,
        bathrooms: null,
        area_notes: "Nueva Andalucía",
      },
      properties: [],
    });
    expect(outcome.row.notes).toBe(
      [
        "Busca vistas al mar",
        "Procedencia: Idealista",
        "Estado: Caliente",
        "Teléfono: 952 111 222",
        "Tipo (not recognised): Castillo",
      ].join("\n")
    );
    expect(outcome.warnings).toEqual(["valueToNotes"]);
    expect(outcome.lines).toEqual([2]);
  });

  it("lets an explicit bound win over a range, and falls back to the second phone", () => {
    const [outcome] = build([
      ["Name", "Mobile", "Phone", "Budget", "Budget max"],
      ["Hans", "", "+49 170 1234567", "300k-450k", "500000"],
    ]).map(ready);
    expect(outcome.row.first_name).toBe("Hans");
    expect(outcome.row.last_name).toBe("");
    expect(outcome.row.phone).toBe("+49 1701234567");
    expect(outcome.row.preferences).toMatchObject({ budget_min: 300000, budget_max: 500000 });
  });

  it("flags what it can't read and keeps it in the notes", () => {
    const [outcome] = build([
      ["Name", "Email", "Phone"],
      ["Ana Ruiz", "ana(at)example", "3.46E+10"],
    ]).map(ready);
    expect(outcome.row.email).toBeNull();
    expect(outcome.row.phone).toBeNull();
    expect(outcome.row.notes).toBe("Email (not recognised): ana(at)example\nPhone (not recognised): 3.46E+10");
    expect(outcome.warnings.sort()).toEqual(["emailUnreadable", "phoneUnreadable"]);
  });

  it("uses the wizard's agency and stage, and one spelling per agency", () => {
    const outcomes = build(
      [
        ["Name", "Agency", "Stage"],
        ["Ana Ruiz", "solvilla ", "Visita"],
        ["Luis Gil", "", ""],
        ["Eva Sanz", "Nordic Homes", "Pendiente"],
        ["Tom Berg", "NORDIC HOMES", ""],
      ],
      { agency: "Mar Casa", stage: "contacted" }
    ).map(ready);
    expect(outcomes.map((o) => o.row.agency)).toEqual(["Solvilla", "Mar Casa", "Nordic Homes", "Nordic Homes"]);
    expect(outcomes.map((o) => o.row.stage)).toEqual(["viewing", "contacted", "contacted", "contacted"]);
    // A seller's stage on a buyers file is kept as a note.
    expect(outcomes[2].row.notes).toBe("Stage (not recognised): Pendiente");
  });

  it("skips rows with no name or outside the filter, with the file's own row numbers", () => {
    const rows = [
      ["Clientes 2025", "", ""],
      ["Nombre completo", "Tipo de contacto", "Email"],
      ["Ana Ruiz", "Comprador", ""],
      ["Luis Gil", "Vendedor", ""],
      ["", "Comprador", "sin@nombre.es"],
    ];
    const sheet: ImportSheet = { name: "t", grid: rows, rowNumbers: [1, 3, 4, 5, 6] };
    const outcomes = build(rows, { headerRow: 1, filter: { column: 1, values: ["Comprador"] } }, sheet);
    expect(outcomes.map((o) => (o.status === "ready" ? "ready" : o.reason))).toEqual(["ready", "filteredOut", "noName"]);
    expect(outcomes.map((o) => o.lines)).toEqual([[4], [5], [6]]);
  });

  it("cuts long notes and says so", () => {
    const [outcome] = build([
      ["Name", "Notes"],
      ["Ana Ruiz", "x".repeat(6000)],
    ]).map(ready);
    expect(Array.from(outcome.row.notes ?? "")).toHaveLength(5000);
    expect(outcome.row.notes?.endsWith("…")).toBe(true);
    expect(outcome.warnings).toContain("notesTruncated");
  });

  it("removes the export's formula guard", () => {
    const [outcome] = build([
      ["Name", "Notes"],
      ["Ana Ruiz", "'=SUM(1,2) was pasted"],
    ]).map(ready);
    expect(outcome.row.notes).toBe("=SUM(1,2) was pasted");
  });
});

describe("buildImport: a sellers file", () => {
  it("groups one person's rows into one seller with several properties", () => {
    const outcomes = build(
      [
        ["First name", "Last name", "Email", "Phone", "Role", "Property type", "Price (€)", "Bedrooms", "Address", "City / area", "Property notes"],
        ["Carmen", "Ruiz", "carmen@example.com", "", "Propietaria", "Villa", "1.250.000", "4", "Calle Uno 1", "Marbella", "Vistas al mar"],
        ["Carmen", "Ruiz", "carmen@example.com", "600123456", "", "Parcela", "400000", "", "", "Benahavís", ""],
        ["Pedro", "Sanz", "", "", "", "", "", "", "", "", ""],
        ["Pedro", "Sanz", "", "", "", "Piso", "250000", "2", "", "Estepona", ""],
      ],
      { side: "seller" }
    ).map(ready);

    expect(outcomes).toHaveLength(2);
    const [carmen, pedro] = outcomes;
    expect(carmen.lines).toEqual([2, 3]);
    expect(carmen.row.phone).toBe("+34 600123456");
    expect(carmen.row.seller_role).toBe("owner");
    expect(carmen.row.preferences).toBeNull();
    expect(carmen.row.properties).toEqual([
      { property_type: "villa", price: 1250000, bedrooms: 4, address: "Calle Uno 1", city: "Marbella", notes: "Vistas al mar" },
      { property_type: "plot", price: 400000, bedrooms: null, address: null, city: "Benahavís", notes: null },
    ]);
    expect(pedro.row.properties).toHaveLength(1);
  });

  it("caps a seller at twenty properties", () => {
    const rows = [["Name", "Email", "City"], ...Array.from({ length: 23 }, (_, i) => ["Ana Ruiz", "ana@example.com", `Town ${i}`])];
    const [seller] = build(rows, { side: "seller" }).map(ready);
    expect(seller.row.properties).toHaveLength(20);
    expect(seller.warnings).toContain("propertiesCapped");
    expect(seller.lines).toHaveLength(23);
  });
});

describe("buildImport: the row contract", () => {
  it("only produces rows the server accepts", () => {
    const buyers = build([
      ["Name", "Email", "Phone", "Budget", "Type", "Notes"],
      ["Ana Ruiz", "ana@example.com", "600123456", "450k", "Villa", "x".repeat(7000)],
      ["Z".repeat(300), "bad", "07700 900123", "consultar", "Castillo", ""],
    ]).map(ready);
    const sellers = build([["Name", "Price", "City"], ["Luis Gil", "1,5M", "Y".repeat(500)]], { side: "seller" }).map(ready);

    for (const { row } of buyers) {
      expect(importRowSchema.safeParse(row).success).toBe(true);
      expect(checkRowForSide(row, "buyer")).toBe(true);
    }
    for (const { row } of sellers) {
      expect(importRowSchema.safeParse(row).success).toBe(true);
      expect(checkRowForSide(row, "seller")).toBe(true);
      expect(checkRowForSide(row, "buyer")).toBe(false);
    }
    expect(buyers[1].warnings).toContain("textTruncated");
  });
});
