import { describe, expect, it } from "vitest";

import { toBatches } from "./batch";

describe("toBatches", () => {
  it("splits by rows", () => {
    const rows = Array.from({ length: 450 }, (_, i) => ({ i }));
    expect(toBatches(rows).map((b) => b.length)).toEqual([200, 200, 50]);
    expect(toBatches([])).toEqual([]);
  });

  it("splits by bytes before it reaches the row cap", () => {
    const rows = Array.from({ length: 150 }, () => ({ notes: "ñ".repeat(2500) }));
    const batches = toBatches(rows);
    expect(batches.length).toBeGreaterThan(1);
    for (const batch of batches) {
      expect(new TextEncoder().encode(JSON.stringify(batch)).length).toBeLessThan(520_000);
    }
    expect(batches.flat()).toHaveLength(150);
  });

  it("never drops a row that is over the byte cap by itself", () => {
    expect(toBatches([{ notes: "x".repeat(100) }], { maxBytes: 10 })).toHaveLength(1);
  });
});
