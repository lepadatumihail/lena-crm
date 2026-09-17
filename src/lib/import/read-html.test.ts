import { describe, expect, it } from "vitest";

import { readImportFile } from "./read";

describe("readImportFile: an HTML table saved as .xls", () => {
  it("reads the first table", async () => {
    const html = `﻿
      <html><head><meta charset="utf-8"></head><body>
        <table>
          <tr><th>Nombre</th><th>Email</th></tr>
          <tr><td> María Peña </td><td>maria@example.com</td></tr>
          <tr><td></td><td></td></tr>
        </table>
      </body></html>`;
    const result = await readImportFile(new File([html], "contactos.xls"));
    expect(result).toEqual({
      ok: true,
      kind: "html",
      sheets: [
        {
          name: "contactos",
          grid: [
            ["Nombre", "Email"],
            ["María Peña", "maria@example.com"],
          ],
          rowNumbers: [1, 2],
        },
      ],
    });
  });

  it("calls a page with no table unreadable", async () => {
    const result = await readImportFile(new File(["<html><body><p>Hola</p></body></html>"], "x.xls"));
    expect(result).toEqual({ ok: false, reason: "unreadable" });
  });
});
