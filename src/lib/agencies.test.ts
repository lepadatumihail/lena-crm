import { describe, it, expect } from "vitest";
import {
  ALL_AGENCIES,
  NO_AGENCY,
  agencyKey,
  agencyOptionValue,
  agencyOptions,
  cleanAgencyName,
  parseAgencyParam,
  pickSpelling,
} from "./agencies";

describe("cleanAgencyName / agencyKey", () => {
  it("gives every spacing and casing of a name one key", () => {
    const keys = [
      "Solvilla",
      " solvilla ",
      "SOLVILLA",
      "\tSolvilla\n",
      "Solvilla ",
    ].map(agencyKey);
    expect(new Set(keys)).toEqual(new Set(["solvilla"]));
  });

  it("removes a byte-order mark inside a name", () => {
    expect(cleanAgencyName("Sol﻿villa")).toBe("Solvilla");
  });

  it("composes accents and collapses inner whitespace", () => {
    expect(agencyKey("Engel  &  Völkers")).toBe("engel & völkers");
    expect(cleanAgencyName("Engel  &  Völkers")).toBe("Engel & Völkers");
  });

  it("caps at 120 characters and leaves no trailing space", () => {
    const name = "a".repeat(119);
    const cleaned = cleanAgencyName(`${name} b`);
    expect(cleaned).toBe(name);
    expect(cleaned).toHaveLength(119);
  });

  it("counts an emoji as one character", () => {
    const cleaned = cleanAgencyName(`${"a".repeat(119)}🏡b`);
    expect(Array.from(cleaned)).toHaveLength(120);
    expect(cleaned.endsWith("🏡")).toBe(true);
  });

  it("returns an empty string for empty, blank and missing values", () => {
    expect(cleanAgencyName("")).toBe("");
    expect(cleanAgencyName(" \t\n")).toBe("");
    expect(cleanAgencyName(null)).toBe("");
    expect(cleanAgencyName(undefined)).toBe("");
  });
});

describe("pickSpelling", () => {
  it("returns null for an empty input", () => {
    expect(pickSpelling(["Solvilla"], "   ")).toBeNull();
    expect(pickSpelling(["Solvilla"], null)).toBeNull();
  });

  it("snaps to the spelling already in use", () => {
    expect(pickSpelling(["Solvilla"], " solvilla ")).toBe("Solvilla");
  });

  it("keeps the input when nothing else uses the agency", () => {
    expect(pickSpelling([], "solvilla")).toBe("solvilla");
    expect(pickSpelling([], "Solvilla")).toBe("Solvilla");
    expect(pickSpelling(["Drumelia", null], " Solvilla")).toBe("Solvilla");
  });

  it("prefers the most-used spelling", () => {
    expect(
      pickSpelling(["solvilla", "Solvilla", "Solvilla ", "SOLVILLA"], "sOLVILLA")
    ).toBe("Solvilla");
  });

  it("breaks ties the same way whatever the order", () => {
    const a = pickSpelling(["Solvilla", "SOLVILLA"], "solvilla");
    const b = pickSpelling(["SOLVILLA", "Solvilla"], "solvilla");
    expect(a).toBe(b);
    expect(["Solvilla", "SOLVILLA"]).toContain(a);
  });
});

describe("agencyOptions", () => {
  it("groups spellings, skips empty values and counts each agency", () => {
    expect(
      agencyOptions(["Solvilla", "solvilla ", "Solvilla", null, "", "  ", undefined, "Drumelia"])
    ).toEqual([
      { key: "solvilla", name: "Solvilla", count: 3 },
      { key: "drumelia", name: "Drumelia", count: 1 },
    ]);
  });

  it("sorts by count, then by name without regard to case", () => {
    const names = agencyOptions([
      "zeta",
      "Alpha",
      "beta",
      "Panorama",
      "Panorama",
    ]).map((o) => o.name);
    expect(names).toEqual(["Panorama", "Alpha", "beta", "zeta"]);
  });
});

describe("filter values", () => {
  it("keeps an agency named like a sentinel apart from it", () => {
    const [all] = agencyOptions(["All"]);
    expect(agencyOptionValue(all.key)).toBe("k:all");
    expect(parseAgencyParam("k:all")).toEqual({ kind: "key", key: "all" });
    expect(parseAgencyParam("k:none")).toEqual({ kind: "key", key: "none" });
  });

  it("reads the sentinels", () => {
    expect(parseAgencyParam(ALL_AGENCIES)).toEqual({ kind: "all" });
    expect(parseAgencyParam(NO_AGENCY)).toEqual({ kind: "none" });
  });

  it("reads a key and a uuid", () => {
    expect(parseAgencyParam("k:engel & völkers")).toEqual({
      kind: "key",
      key: "engel & völkers",
    });
    expect(parseAgencyParam("3F2504E0-4F89-41D3-9A0C-0305E82C3301")).toEqual({
      kind: "id",
      id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    });
  });

  it("treats anything else as all", () => {
    for (const value of [undefined, null, "", "k:", "k:  ", "solvilla", "not-a-uuid"]) {
      expect(parseAgencyParam(value)).toEqual({ kind: "all" });
    }
  });
});
