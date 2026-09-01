import { describe, it, expect } from "vitest";
import {
  preferencesFormSchema,
  toNumberOrNull,
  emptyToNull,
  viewingScheduleSchema,
} from "./buyer";

// Minimal valid base for the schema; we override one numeric field per case.
const base = {
  property_types: [] as string[],
  budget_min: "",
  budget_max: "",
  bedrooms: "",
  bathrooms: "",
  area_notes: "",
};

function parseField(field: keyof typeof base, value: string) {
  return preferencesFormSchema.safeParse({ ...base, [field]: value });
}

describe("numericString (via preferencesFormSchema.budget_min)", () => {
  it.each([
    ["", true],
    ["250000", true],
    ["-1", false],
    ["abc", false],
  ])("budget_min %j -> success=%s", (value, ok) => {
    expect(parseField("budget_min", value as string).success).toBe(ok);
  });

  it("trims before the refine: whitespace-only passes and parses to ''", () => {
    const res = parseField("budget_min", "  ");
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.budget_min).toBe("");
  });
});

describe("numericString({ int: true }) (via preferencesFormSchema.bedrooms)", () => {
  it("accepts an integer string", () => {
    expect(parseField("bedrooms", "3").success).toBe(true);
  });

  it("rejects a non-integer string", () => {
    expect(parseField("bedrooms", "2.5").success).toBe(false);
  });
});

describe("toNumberOrNull", () => {
  it("returns null for empty/whitespace/nullish", () => {
    expect(toNumberOrNull("")).toBeNull();
    expect(toNumberOrNull("   ")).toBeNull();
    expect(toNumberOrNull(null)).toBeNull();
    expect(toNumberOrNull(undefined)).toBeNull();
  });

  it("parses a numeric string", () => {
    expect(toNumberOrNull("12.5")).toBe(12.5);
  });

  it("returns null for a non-numeric string", () => {
    expect(toNumberOrNull("abc")).toBeNull();
  });

  it("returns null for non-finite input (1e999 -> Infinity)", () => {
    expect(toNumberOrNull("1e999")).toBeNull();
  });
});

describe("numericString rejects non-finite numbers", () => {
  it("rejects 1e999 (Infinity) on budget_min", () => {
    expect(parseField("budget_min", "1e999").success).toBe(false);
  });

  it("still accepts a large but finite 1e10 on budget_min", () => {
    expect(parseField("budget_min", "1e10").success).toBe(true);
  });
});

describe("viewingScheduleSchema", () => {
  it("accepts a valid ISO datetime with a reminder", () => {
    expect(
      viewingScheduleSchema.safeParse({
        scheduled_at: "2026-06-18T10:00:00Z",
        reminder_minutes: 60,
      }).success
    ).toBe(true);
  });

  it("accepts both fields null", () => {
    expect(
      viewingScheduleSchema.safeParse({
        scheduled_at: null,
        reminder_minutes: null,
      }).success
    ).toBe(true);
  });

  it("rejects a non-ISO scheduled_at", () => {
    expect(
      viewingScheduleSchema.safeParse({
        scheduled_at: "yesterday",
        reminder_minutes: null,
      }).success
    ).toBe(false);
  });

  it("rejects a negative reminder_minutes", () => {
    expect(
      viewingScheduleSchema.safeParse({
        scheduled_at: null,
        reminder_minutes: -5,
      }).success
    ).toBe(false);
  });
});

describe("emptyToNull", () => {
  it("returns null for empty/whitespace/nullish", () => {
    expect(emptyToNull("  ")).toBeNull();
    expect(emptyToNull("")).toBeNull();
    expect(emptyToNull(null)).toBeNull();
    expect(emptyToNull(undefined)).toBeNull();
  });

  it("returns the trimmed string when non-empty", () => {
    expect(emptyToNull("  hello  ")).toBe("hello");
  });
});
