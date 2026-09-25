import { describe, expect, it } from "vitest";

import {
  addDaysToKey,
  lastTouchedAt,
  needsFollowUp,
  nextStepDueOn,
  stageAfterContact,
} from "@/lib/activity";

describe("addDaysToKey", () => {
  it("adds days across month and year ends", () => {
    expect(addDaysToKey("2026-09-25", 1)).toBe("2026-09-26");
    expect(addDaysToKey("2026-09-29", 3)).toBe("2026-10-02");
    expect(addDaysToKey("2026-12-28", 7)).toBe("2027-01-04");
  });

  it("handles a leap day and the DST weekend", () => {
    expect(addDaysToKey("2028-02-28", 1)).toBe("2028-02-29");
    // Europe/Madrid springs forward on 29 Mar 2026; keys don't care.
    expect(addDaysToKey("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDaysToKey("2026-03-28", 2)).toBe("2026-03-30");
  });
});

describe("nextStepDueOn", () => {
  it("turns presets into due dates from the agent's today", () => {
    expect(nextStepDueOn("tomorrow", "2026-09-25")).toBe("2026-09-26");
    expect(nextStepDueOn("three_days", "2026-09-25")).toBe("2026-09-28");
    expect(nextStepDueOn("week", "2026-09-25")).toBe("2026-10-02");
    expect(nextStepDueOn("none", "2026-09-25")).toBeNull();
  });
});

describe("stageAfterContact", () => {
  it("moves only a new buyer to contacted", () => {
    expect(stageAfterContact("buyer", "new")).toBe("contacted");
    expect(stageAfterContact("buyer", "contacted")).toBeNull();
    expect(stageAfterContact("buyer", "viewing")).toBeNull();
    expect(stageAfterContact("seller", "pending")).toBeNull();
  });
});

describe("lastTouchedAt", () => {
  it("prefers the last logged contact over the last edit", () => {
    expect(
      lastTouchedAt({ last_contacted_at: "2026-09-20T10:00:00Z", updated_at: "2026-09-24T10:00:00Z" })
    ).toBe("2026-09-20T10:00:00Z");
    expect(lastTouchedAt({ last_contacted_at: null, updated_at: "2026-09-24T10:00:00Z" })).toBe(
      "2026-09-24T10:00:00Z"
    );
  });
});

describe("needsFollowUp", () => {
  const now = Date.parse("2026-09-25T12:00:00Z");
  const ago = (days: number) => new Date(now - days * 86_400_000).toISOString();
  const buyer = (
    changes: Partial<Parameters<typeof needsFollowUp>[0]> = {}
  ): Parameters<typeof needsFollowUp>[0] => ({
    side: "buyer",
    stage: "qualified",
    is_active: true,
    last_contacted_at: ago(1),
    updated_at: ago(1),
    ...changes,
  });

  it("holds new leads nobody has contacted, however fresh", () => {
    expect(needsFollowUp(buyer({ stage: "new", last_contacted_at: null, updated_at: ago(0) }), now)).toBe(true);
    expect(
      needsFollowUp(buyer({ side: "seller", stage: "pending", last_contacted_at: null, updated_at: ago(0) }), now)
    ).toBe(true);
    expect(needsFollowUp(buyer({ stage: "new", last_contacted_at: ago(0) }), now)).toBe(false);
    expect(needsFollowUp(buyer({ side: "seller", stage: "pending", last_contacted_at: ago(0) }), now)).toBe(false);
  });

  it("holds buyers quiet for a week, counted from the last contact", () => {
    expect(needsFollowUp(buyer({ last_contacted_at: ago(7) }), now)).toBe(true);
    expect(needsFollowUp(buyer({ last_contacted_at: ago(6.9) }), now)).toBe(false);
    // An edit since then doesn't count as reaching them.
    expect(needsFollowUp(buyer({ last_contacted_at: ago(9), updated_at: ago(0) }), now)).toBe(true);
    // Nobody logged a contact: the last edit stands in, as on Home.
    expect(needsFollowUp(buyer({ stage: "contacted", last_contacted_at: null, updated_at: ago(8) }), now)).toBe(true);
    expect(needsFollowUp(buyer({ stage: "contacted", last_contacted_at: null, updated_at: ago(2) }), now)).toBe(false);
  });

  it("leaves out reserved buyers, quiet sellers and hidden clients", () => {
    expect(needsFollowUp(buyer({ stage: "reserved", last_contacted_at: ago(30) }), now)).toBe(false);
    expect(needsFollowUp(buyer({ side: "seller", last_contacted_at: ago(30) }), now)).toBe(false);
    expect(needsFollowUp(buyer({ is_active: false, stage: "new", last_contacted_at: null }), now)).toBe(false);
    expect(needsFollowUp(buyer({ is_active: false, last_contacted_at: ago(30) }), now)).toBe(false);
  });
});
