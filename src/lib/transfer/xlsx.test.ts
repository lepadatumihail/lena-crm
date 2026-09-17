// @vitest-environment node
import readExcelFile from "read-excel-file/node";
import { describe, expect, it } from "vitest";

import type { Cell } from "./format";
import { buildWorkbook, sheetName } from "./xlsx";

const text = (value: string): Cell => ({ type: "text", value });

describe("sheetName", () => {
  it("fits Excel's rules", () => {
    expect(sheetName("Buyers")).toBe("Buyers");
    expect(sheetName("Q3/Q4: [draft]?*")).toBe("Q3 Q4   draft");
    expect(sheetName("x".repeat(40))).toHaveLength(31);
    expect(sheetName("")).toBe("Sheet");
  });
});

describe("buildWorkbook", () => {
  it("writes a workbook that opens, a sheet per table", async () => {
    const buffer = await buildWorkbook([
      {
        name: "Compradores",
        headers: ["Nombre", "Teléfono", "Presupuesto máx. (€)", "Dormitorios", "Fecha de notaría", "Notas"],
        rows: [
          [
            text("José Peña"),
            text("+34 600 123 456"),
            { type: "number", value: 1250000 },
            { type: "integer", value: 3 },
            { type: "date", value: "2026-10-01" },
            text("=HYPERLINK(\"x\")"),
          ],
          [text("Anna Berg"), null, { type: "number", value: 900000.5 }, null, null, null],
        ],
      },
      { name: "Vendedores", headers: ["Nombre"], rows: [] },
    ]);

    const sheets = await readExcelFile(buffer);
    expect(sheets.map((s) => s.sheet)).toEqual(["Compradores", "Vendedores"]);

    const buyers = sheets[0].data;
    expect(buyers[0]).toEqual([
      "Nombre",
      "Teléfono",
      "Presupuesto máx. (€)",
      "Dormitorios",
      "Fecha de notaría",
      "Notas",
    ]);

    const [name, phone, budget, bedrooms, notary, notes] = buyers[1];
    expect(name).toBe("José Peña");
    // A phone stays text and a formula-looking note is never evaluated.
    expect(phone).toBe("+34 600 123 456");
    expect(notes).toBe('=HYPERLINK("x")');
    expect(budget).toBe(1250000);
    expect(bedrooms).toBe(3);
    expect(notary instanceof Date && notary.toISOString().slice(0, 10)).toBe("2026-10-01");

    expect(buyers[2][1]).toBeNull();
    expect(buyers[2][2]).toBe(900000.5);

    expect(sheets[1].data).toEqual([["Nombre"]]);
  });
});
