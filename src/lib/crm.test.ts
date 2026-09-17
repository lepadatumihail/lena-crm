import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  clientsPath,
  buyerStageAtLeast,
  defaultStageForSide,
  stageIndex,
  clientRecordId,
} from "./crm";

describe("formatCurrency", () => {
  it("formats a number as EUR with grouping", () => {
    const out = formatCurrency(1_500_000);
    expect(out).toContain("€");
    // grouping separator present (en-GB uses commas)
    expect(out).toMatch(/1[.,\s]?500[.,\s]?000/);
  });

  it("returns the em dash for null", () => {
    expect(formatCurrency(null)).toBe("—");
  });

  it("returns the em dash for undefined", () => {
    expect(formatCurrency(undefined)).toBe("—");
  });
});

describe("clientsPath", () => {
  it("pluralizes the side", () => {
    expect(clientsPath("buyer")).toBe("/clients/buyers");
    expect(clientsPath("seller")).toBe("/clients/sellers");
  });
});

describe("defaultStageForSide", () => {
  it("returns the first stage for each side", () => {
    expect(defaultStageForSide("buyer")).toBe("new");
    expect(defaultStageForSide("seller")).toBe("pending");
  });
});

describe("stageIndex", () => {
  it("returns the ordinal of a stage within its side", () => {
    expect(stageIndex("buyer", "new")).toBe(0);
    expect(stageIndex("buyer", "viewing")).toBe(3);
    expect(stageIndex("seller", "qualified")).toBe(1);
  });

  it("returns -1 for an unknown stage", () => {
    expect(stageIndex("buyer", "nope")).toBe(-1);
  });
});

describe("buyerStageAtLeast", () => {
  it("is true when the stage has reached the minimum or later", () => {
    expect(buyerStageAtLeast("viewing", "qualified")).toBe(true);
    expect(buyerStageAtLeast("qualified", "qualified")).toBe(true);
  });

  it("is false when the stage is earlier than the minimum", () => {
    expect(buyerStageAtLeast("new", "qualified")).toBe(false);
  });

  it("is false for an unknown stage (indexOf -1)", () => {
    expect(buyerStageAtLeast("bogus", "qualified")).toBe(false);
  });
});

describe("clientRecordId", () => {
  it("reads the id from a record or edit path", () => {
    expect(clientRecordId("/clients/54b43552-1994")).toBe("54b43552-1994");
    expect(clientRecordId("/clients/abc/edit")).toBe("abc");
  });
  it("ignores the list and new-client paths", () => {
    expect(clientRecordId("/clients/buyers")).toBeNull();
    expect(clientRecordId("/clients/sellers")).toBeNull();
    expect(clientRecordId("/clients/new")).toBeNull();
    expect(clientRecordId("/clients/import")).toBeNull();
    expect(clientRecordId("/clients/import/template")).toBeNull();
    expect(clientRecordId("/clients/export")).toBeNull();
    expect(clientRecordId("/clients")).toBeNull();
    expect(clientRecordId("/home")).toBeNull();
  });
});
