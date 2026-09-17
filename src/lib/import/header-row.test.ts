import { describe, expect, it } from "vitest";

import { findHeaderRow } from "./header-row";

describe("findHeaderRow", () => {
  it("is the first row of a plain file", () => {
    expect(findHeaderRow([["Name", "Email"], ["Ana", "ana@example.com"]])).toBe(0);
  });

  it("skips a title row", () => {
    expect(
      findHeaderRow([
        ["Clientes 2025", "", ""],
        ["Nombre", "Apellidos", "Teléfono"],
        ["Ana", "Ruiz", "600123456"],
      ])
    ).toBe(1);
  });

  it("skips a row of numbers or dates, and a row narrower than the next", () => {
    expect(
      findHeaderRow([
        ["2025", "16/09/2026", ""],
        ["Exportado", "por Ana", ""],
        ["Nombre", "Email", "Teléfono"],
        ["Ana", "ana@example.com", "600123456"],
      ])
    ).toBe(2);
  });

  it("accepts a header-only file, and falls back to the first row", () => {
    expect(findHeaderRow([["Name", "Email"]])).toBe(0);
    expect(findHeaderRow([["1", "2"], ["3", "4"]])).toBe(0);
    expect(findHeaderRow([])).toBe(0);
  });
});
