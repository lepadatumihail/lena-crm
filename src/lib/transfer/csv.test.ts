import Papa from "papaparse";
import { describe, expect, it } from "vitest";

import { CSV_BOM, buildCsv } from "./csv";
import type { Cell } from "./format";

const text = (value: string): Cell => ({ type: "text", value });

function parse(csv: string, delimiter: string): string[][] {
  return Papa.parse<string[]>(csv.slice(CSV_BOM.length), { delimiter }).data;
}

describe("buildCsv", () => {
  it("starts with a BOM and splits on a comma in English", () => {
    const csv = buildCsv({
      headers: ["Name", "City"],
      rows: [[text("José Peña"), text("Málaga")]],
      locale: "en",
    });
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    expect(csv.slice(CSV_BOM.length)).toBe("Name,City\r\nJosé Peña,Málaga");
  });

  it("splits on a semicolon in Spanish, as Spanish Excel does", () => {
    const csv = buildCsv({
      headers: ["Nombre", "Ciudad"],
      rows: [[text("José Peña"), text("Málaga")]],
      locale: "es",
    });
    expect(csv.slice(CSV_BOM.length)).toBe("Nombre;Ciudad\r\nJosé Peña;Málaga");
  });

  it("writes numbers without a thousands mark, decimals by language", () => {
    const rows: Cell[][] = [
      [
        { type: "number", value: 250000.5 },
        { type: "integer", value: 3 },
        { type: "number", value: -5.5 },
      ],
    ];
    const headers = ["Price", "Bedrooms", "Change"];
    expect(parse(buildCsv({ headers, rows, locale: "en" }), ",")[1]).toEqual([
      "250000.5",
      "3",
      "-5.5",
    ]);
    expect(parse(buildCsv({ headers, rows, locale: "es" }), ";")[1]).toEqual([
      "250000,5",
      "3",
      "-5,5",
    ]);
  });

  it("writes dates as stored and leaves empty cells empty", () => {
    const csv = buildCsv({
      headers: ["Notary date", "Notes"],
      rows: [[{ type: "date", value: "2026-10-01" }, null]],
      locale: "en",
    });
    expect(parse(csv, ",")[1]).toEqual(["2026-10-01", ""]);
  });

  it.each(['=HYPERLINK("x")', "@SUM(1)", "-foo", "+cmd|' /C calc'!A0", "\tTab", "=1+1"])(
    "stops %j from running as a formula",
    (value) => {
      const csv = buildCsv({ headers: ["Notes"], rows: [[text(value)]], locale: "en" });
      expect(parse(csv, ",")[1]).toEqual([`'${value}`]);
    }
  );

  it.each(["+34 600 123 456", "-5", "+44 (0)20 7946 0958", "-", "Call back = Friday"])(
    "leaves %j as it is",
    (value) => {
      const csv = buildCsv({ headers: ["Phone"], rows: [[text(value)]], locale: "es" });
      expect(parse(csv, ";")[1]).toEqual([value]);
    }
  );

  it("keeps quoted newlines, quotes and delimiters through a round trip", () => {
    const note = 'Wants a "sea view".\nBudget; flexible, call after 6';
    for (const [locale, delimiter] of [
      ["en", ","],
      ["es", ";"],
    ] as const) {
      const csv = buildCsv({ headers: ["Notes", "City"], rows: [[text(note), text("Mijas")]], locale });
      expect(parse(csv, delimiter)).toEqual([
        ["Notes", "City"],
        [note, "Mijas"],
      ]);
    }
  });
});
