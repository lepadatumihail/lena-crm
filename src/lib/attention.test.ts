import { describe, it, expect } from "vitest";

import {
  calendarDaysFromToday,
  formatInTimeZone,
  formatTimeInTimeZone,
  formatDateKey,
} from "./attention";

describe("calendarDaysFromToday", () => {
  it("returns 0 for the same day", () => {
    expect(calendarDaysFromToday("2026-06-14", "2026-06-14")).toBe(0);
  });

  it("returns 1 for the next day", () => {
    expect(calendarDaysFromToday("2026-06-15", "2026-06-14")).toBe(1);
  });

  it("returns -1 for the previous day", () => {
    expect(calendarDaysFromToday("2026-06-13", "2026-06-14")).toBe(-1);
  });

  it("crosses a month boundary correctly", () => {
    expect(calendarDaysFromToday("2026-07-01", "2026-06-30")).toBe(1);
  });

  it("is immune to a DST transition (pure UTC math)", () => {
    // Europe/Madrid springs forward on 2026-03-29; the day span is still 2.
    expect(calendarDaysFromToday("2026-03-30", "2026-03-28")).toBe(2);
  });

  it("rejects a malformed date key", () => {
    expect(() => calendarDaysFromToday("2026-6-14", "2026-06-14")).toThrow();
  });
});

describe("formatInTimeZone", () => {
  it("renders the instant in Europe/Madrid wall-clock time (UTC+2 in June)", () => {
    expect(
      formatInTimeZone("2026-06-14T08:00:00.000Z", "Europe/Madrid")
    ).toContain("10:00");
  });

  it("renders the instant in UTC unchanged", () => {
    expect(formatInTimeZone("2026-06-14T08:00:00.000Z", "UTC")).toContain(
      "08:00"
    );
  });

  it("falls back to UTC for an invalid zone rather than throwing", () => {
    expect(() =>
      formatInTimeZone("2026-06-14T08:00:00.000Z", "Not/AZone")
    ).not.toThrow();
    expect(
      formatInTimeZone("2026-06-14T08:00:00.000Z", "Not/AZone")
    ).toContain("08:00");
  });
});

describe("formatTimeInTimeZone", () => {
  it("renders only the wall-clock time in the zone", () => {
    expect(
      formatTimeInTimeZone("2026-06-14T08:00:00.000Z", "Europe/Madrid")
    ).toBe("10:00");
  });
});

describe("formatDateKey", () => {
  it("renders a yyyy-MM-dd key as a stable date label", () => {
    expect(formatDateKey("2026-06-14")).toBe("Sun 14 Jun");
  });
});
