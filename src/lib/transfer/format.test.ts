import { describe, expect, it } from "vitest";

import type { TransferKind } from "./columns";
import { cellFor, clientTable, instantInTimeZone } from "./format";
import { contextFor } from "./testing";

const en = contextFor("en");
const es = contextFor("es");

const KINDS: TransferKind[] = [
  "text",
  "number",
  "integer",
  "date",
  "instant",
  "boolean",
  "enum:stage",
  "enum:deal_type",
  "enum:seller_role",
  "language",
  "nationality",
  "property_types",
  "property_type",
];

describe("cellFor", () => {
  it.each(KINDS)("leaves a missing %s empty", (kind) => {
    expect(cellFor(kind, null, en)).toBeNull();
    expect(cellFor(kind, undefined, es)).toBeNull();
  });

  it("trims text and drops blanks", () => {
    expect(cellFor("text", "  Marbella Homes ", en)).toEqual({
      type: "text",
      value: "Marbella Homes",
    });
    expect(cellFor("text", "   ", en)).toBeNull();
  });

  it("keeps money and whole numbers as numbers", () => {
    expect(cellFor("number", 250000.5, es)).toEqual({ type: "number", value: 250000.5 });
    expect(cellFor("number", "1200", en)).toEqual({ type: "number", value: 1200 });
    expect(cellFor("integer", 3, en)).toEqual({ type: "integer", value: 3 });
    expect(cellFor("number", "n/a", en)).toBeNull();
  });

  it("writes a calendar day as it is stored", () => {
    expect(cellFor("date", "2026-10-01", en)).toEqual({ type: "date", value: "2026-10-01" });
    expect(cellFor("date", "2026-10-01T00:00:00+00:00", es)).toEqual({
      type: "date",
      value: "2026-10-01",
    });
    expect(cellFor("date", "soon", en)).toBeNull();
  });

  it("writes an instant in the agent's time zone", () => {
    const iso = "2026-09-16T22:30:00Z";
    expect(cellFor("instant", iso, en)).toEqual({ type: "text", value: "2026-09-17 00:30" });
    expect(cellFor("instant", iso, contextFor("es", "Atlantic/Canary"))).toEqual({
      type: "text",
      value: "2026-09-16 23:30",
    });
    expect(cellFor("instant", "not a date", en)).toBeNull();
  });

  it("falls back to UTC for a zone the runtime doesn't know", () => {
    expect(instantInTimeZone("2026-01-05T09:15:00Z", "Mars/Olympus")).toBe("2026-01-05 09:15");
  });

  it("writes yes and no in the UI language", () => {
    expect(cellFor("boolean", true, en)).toEqual({ type: "text", value: "Yes" });
    expect(cellFor("boolean", false, en)).toEqual({ type: "text", value: "No" });
    expect(cellFor("boolean", true, es)).toEqual({ type: "text", value: "Sí" });
  });

  it("labels enums the way the app does", () => {
    expect(cellFor("enum:stage", "viewing", en)).toEqual({ type: "text", value: "Viewing" });
    expect(cellFor("enum:stage", "viewing", es)).toEqual({ type: "text", value: "Visita" });
    expect(cellFor("enum:deal_type", "collab", en)).toEqual({
      type: "text",
      value: "Collaboration",
    });
    expect(cellFor("enum:deal_type", "collab", es)).toEqual({
      type: "text",
      value: "Colaboración",
    });
    expect(cellFor("enum:seller_role", "owner", en)).toEqual({ type: "text", value: "Owner" });
    expect(cellFor("enum:seller_role", "owner", es)).toEqual({
      type: "text",
      value: "Propietario",
    });
    expect(cellFor("property_type", "villa", en)).toEqual({ type: "text", value: "Villa" });
    expect(cellFor("property_type", "plot", es)).toEqual({ type: "text", value: "Parcela" });
  });

  it("keeps a value outside the known lists as it was typed", () => {
    expect(cellFor("enum:stage", "archived", en)).toEqual({ type: "text", value: "archived" });
    expect(cellFor("language", "Klingon", es)).toEqual({ type: "text", value: "Klingon" });
    expect(cellFor("nationality", "Martian", es)).toEqual({ type: "text", value: "Martian" });
  });

  it("translates languages and nationalities", () => {
    expect(cellFor("language", "English", en)).toEqual({ type: "text", value: "English" });
    expect(cellFor("language", "English", es)).toEqual({ type: "text", value: "Inglés" });
    expect(cellFor("nationality", "British", en)).toEqual({ type: "text", value: "British" });
    expect(cellFor("nationality", "British", es)).toEqual({
      type: "text",
      value: "Británica",
    });
  });

  it("joins a buyer's property types", () => {
    expect(cellFor("property_types", ["villa", "apartment"], en)).toEqual({
      type: "text",
      value: "Villa, Apartment",
    });
    expect(cellFor("property_types", ["villa", "apartment"], es)).toEqual({
      type: "text",
      value: "Villa, Apartamento",
    });
    expect(cellFor("property_types", [], en)).toBeNull();
  });
});

describe("clientTable", () => {
  it("lays a buyer out under the buyer headers", () => {
    const table = clientTable(
      "buyer",
      [{ first_name: "Anna", last_name: "Berg", budget_max: 900000, priority: true }],
      en
    );
    expect(table.headers.slice(0, 4)).toEqual(["First name", "Last name", "Email", "Phone"]);
    expect(table.headers).toHaveLength(30);
    const row = table.rows[0];
    expect(row).toHaveLength(30);
    expect(row[0]).toEqual({ type: "text", value: "Anna" });
    expect(row[table.headers.indexOf("Budget max (€)")]).toEqual({
      type: "number",
      value: 900000,
    });
    expect(row[table.headers.indexOf("Priority")]).toEqual({ type: "text", value: "Yes" });
    expect(row[table.headers.indexOf("Email")]).toBeNull();
  });

  it("uses the Spanish headers for a seller", () => {
    const table = clientTable("seller", [], es);
    expect(table.headers).toContain("Precio (€)");
    expect(table.headers).toContain("ID de LeadWing");
    expect(table.headers).not.toContain("Presupuesto máx. (€)");
  });
});
