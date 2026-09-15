import { describe, expect, it } from "vitest";

import { isMissingTableError } from "./errors";

describe("isMissingTableError", () => {
  it.each(["PGRST205", "42P01"])("is true for %s", (code) => {
    expect(isMissingTableError({ code })).toBe(true);
  });

  it.each(["PGRST204", "42501", ""])("is false for code %j", (code) => {
    expect(isMissingTableError({ code })).toBe(false);
  });

  it("is false for an error without a code, null and undefined", () => {
    expect(isMissingTableError({})).toBe(false);
    expect(isMissingTableError(null)).toBe(false);
    expect(isMissingTableError(undefined)).toBe(false);
  });
});
