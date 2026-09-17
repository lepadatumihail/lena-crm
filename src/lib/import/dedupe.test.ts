import { describe, expect, it } from "vitest";

import type { ImportRow } from "@/lib/validation/import";

import type { RowOutcome } from "./build";
import { applyCapacity, contactKeys, markDuplicates, phoneKey } from "./dedupe";

function row(email: string | null, phone: string | null = null): RowOutcome {
  return {
    status: "ready",
    lines: [1],
    source: [[]],
    warnings: [],
    row: { email, phone } as ImportRow,
  };
}
const statuses = (outcomes: RowOutcome[]) => outcomes.map((o) => (o.status === "ready" ? "ready" : o.reason));

describe("contactKeys", () => {
  it("ignores case in emails and formatting in phones", () => {
    expect(contactKeys({ email: " Ana@Example.com ", phone: "+34 600 123 456" })).toEqual([
      "e:ana@example.com",
      "p:34600123456",
    ]);
    expect(phoneKey("0034 600-123-456")).toBe("34600123456");
    expect(contactKeys({ email: null, phone: null })).toEqual([]);
  });
});

describe("markDuplicates", () => {
  const outcomes = [row("ana@example.com"), row("luis@example.com", "+34 600123456"), row("ANA@example.com"), row(null, "+34 600 123 456"), row(null)];
  const existing = new Set(["e:luis@example.com"]);

  it("skips repeats always, and saved clients while the switch is on", () => {
    expect(statuses(markDuplicates(outcomes, existing, true))).toEqual([
      "ready", "duplicateExisting", "duplicateInFile", "duplicateInFile", "ready",
    ]);
  });

  it("keeps saved clients with a warning when the switch is off", () => {
    const marked = markDuplicates(outcomes, existing, false);
    expect(statuses(marked)).toEqual(["ready", "ready", "duplicateInFile", "duplicateInFile", "ready"]);
    expect(marked[1].status === "ready" && marked[1].warnings).toEqual(["mayDuplicate"]);
    // The input is left as it was, so the switch can flip back.
    expect(outcomes[1].status === "ready" && outcomes[1].warnings).toEqual([]);
  });
});

describe("applyCapacity", () => {
  const outcomes: RowOutcome[] = [row("a@x.es"), { status: "skipped", reason: "noName", lines: [2], source: [[]] }, row("b@x.es"), row("c@x.es")];

  it.each([
    [0, ["overCap", "noName", "overCap", "overCap"]],
    [2, ["ready", "noName", "ready", "overCap"]],
    [3, ["ready", "noName", "ready", "ready"]],
    [null, ["ready", "noName", "ready", "ready"]],
  ])("with room for %s", (capacity, expected) => {
    expect(statuses(applyCapacity(outcomes, capacity))).toEqual(expected);
  });
});
