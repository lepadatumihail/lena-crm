// @vitest-environment node
import readExcelFile from "read-excel-file/node";
import { describe, expect, it } from "vitest";
import writeExcelFile from "write-excel-file/node";

import { findHeaderRow } from "./header-row";
import { MAX_FILE_BYTES, readImportFile, type XlsxReader } from "./read";

/* The browser entry needs a Web Worker; the node entry reads the same files. */
const readXlsx: XlsxReader = async (input, options) =>
  readExcelFile(Buffer.from(await input.arrayBuffer()), options) as ReturnType<XlsxReader>;

const textFile = (text: string, name = "clients.csv") => new File([text], name);
const byteFile = (bytes: number[], name = "clients.csv") => new File([new Uint8Array(bytes)], name);

async function gridOf(file: File) {
  const result = await readImportFile(file, { readXlsx });
  if (!result.ok) throw new Error(`not read: ${result.reason}`);
  return result.sheets[0];
}

describe("readImportFile: text", () => {
  it("reads UTF-8, with or without a BOM", async () => {
    for (const bom of ["", "﻿"]) {
      const sheet = await gridOf(textFile(`${bom}Nombre,Apellidos\nMaría,Peña`));
      expect(sheet.grid).toEqual([
        ["Nombre", "Apellidos"],
        ["María", "Peña"],
      ]);
    }
  });

  it("falls back to windows-1252 for a Spanish Excel CSV", async () => {
    // "Peña;José;250€": ñ = F1, é = E9, € = 80
    const bytes = [0x50, 0x65, 0xf1, 0x61, 0x3b, 0x4a, 0x6f, 0x73, 0xe9, 0x3b, 0x32, 0x35, 0x30, 0x80];
    const sheet = await gridOf(byteFile([...Buffer.from("a;b;c\n"), ...bytes]));
    expect(sheet.grid[1]).toEqual(["Peña", "José", "250€"]);
  });

  it("reads UTF-16 by its mark", async () => {
    const body = Buffer.from("Name\tPhone\nAna\t600", "utf16le");
    const sheet = await gridOf(byteFile([0xff, 0xfe, ...body], "clients.txt"));
    expect(sheet.grid[1]).toEqual(["Ana", "600"]);
  });

  it("guesses semicolons and tabs", async () => {
    expect((await gridOf(textFile("a;b\n1;2"))).grid[1]).toEqual(["1", "2"]);
    expect((await gridOf(textFile("a\tb\n1\t2", "clients.tsv"))).grid[1]).toEqual(["1", "2"]);
  });

  it("keeps a line break inside quotes, and the file's own row numbers", async () => {
    const sheet = await gridOf(textFile('Name,Notes\n\n"Ana","line one\nline two"\n,\nLuis,ok\n'));
    expect(sheet.grid).toEqual([
      ["Name", "Notes"],
      ["Ana", "line one\nline two"],
      ["Luis", "ok"],
    ]);
    expect(sheet.rowNumbers).toEqual([1, 3, 5]);
  });

  it("names the sheet after the file, and drops empty columns", async () => {
    const sheet = await gridOf(textFile("a,,b\n1,,2", "Mis clientes.csv"));
    expect(sheet.name).toBe("Mis clientes");
    expect(sheet.grid).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("readImportFile: files it refuses", () => {
  it("says so for a legacy or password-protected workbook", async () => {
    const ole = byteFile([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0], "clients.xls");
    expect(await readImportFile(ole, { readXlsx })).toEqual({ ok: false, reason: "legacyOrProtected" });
  });

  it("calls binary data unreadable", async () => {
    expect(await readImportFile(byteFile([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 13]), { readXlsx })).toEqual({
      ok: false,
      reason: "unreadable",
    });
    // A zip that isn't a workbook.
    expect(await readImportFile(byteFile([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]), { readXlsx })).toEqual({
      ok: false,
      reason: "unreadable",
    });
  });

  it("knows empty and oversized files", async () => {
    expect(await readImportFile(textFile(""), { readXlsx })).toEqual({ ok: false, reason: "empty" });
    expect(await readImportFile(textFile("\n\n , \n"), { readXlsx })).toEqual({ ok: false, reason: "empty" });
    const big = new File([new Uint8Array(MAX_FILE_BYTES + 1)], "big.csv");
    expect(await readImportFile(big, { readXlsx })).toEqual({ ok: false, reason: "tooBig" });
  });
});

describe("readImportFile: workbooks", () => {
  it("keeps numbers as their exact text, dates as days, and every sheet", async () => {
    const buffer = await writeExcelFile([
      {
        sheet: "Compradores",
        data: [
          [{ value: "Clientes 2025", type: String }],
          [],
          [
            { value: "Nombre", type: String },
            { value: "Teléfono", type: String },
            { value: "Alta", type: String },
            { value: "Presupuesto", type: String },
          ],
          [
            { value: "Ana", type: String },
            { value: 34600123456, type: Number },
            { value: new Date(Date.UTC(2026, 8, 16)), type: Date, format: "yyyy-mm-dd" },
            { value: 250000.5, type: Number },
          ],
        ],
      },
      { sheet: "Vendedores", data: [[{ value: "Nombre", type: String }], [{ value: "Luis", type: String }]] },
    ]).toBuffer();

    const result = await readImportFile(new File([new Uint8Array(buffer)], "clientes.xlsx"), { readXlsx });
    if (!result.ok) throw new Error(result.reason);
    expect(result.kind).toBe("xlsx");
    expect(result.sheets.map((s) => s.name)).toEqual(["Compradores", "Vendedores"]);

    const [buyers] = result.sheets;
    expect(buyers.grid[2]).toEqual(["Ana", "34600123456", "2026-09-16", "250000.5"]);
    // The title and the blank row above the headers keep their place in the numbering.
    expect(buyers.rowNumbers).toEqual([1, 3, 4]);
    expect(findHeaderRow(buyers.grid)).toBe(1);
  });
});
