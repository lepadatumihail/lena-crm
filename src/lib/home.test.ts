import { describe, it, expect } from "vitest";

import {
  buyersBeforeViewing,
  countViewingsWithin,
  firstNameFrom,
  greetingPeriod,
  hourInTimeZone,
  onboardingSteps,
  pipelineSegments,
  relativeAgo,
  showOnboarding,
} from "./home";

describe("greetingPeriod", () => {
  it("splits the day into morning, afternoon and evening", () => {
    expect(greetingPeriod(5)).toBe("morning");
    expect(greetingPeriod(11)).toBe("morning");
    expect(greetingPeriod(12)).toBe("afternoon");
    expect(greetingPeriod(17)).toBe("afternoon");
    expect(greetingPeriod(18)).toBe("evening");
    expect(greetingPeriod(0)).toBe("evening");
    expect(greetingPeriod(4)).toBe("evening");
  });
});

describe("hourInTimeZone", () => {
  it("renders the wall-clock hour in Madrid (UTC+2 in September)", () => {
    expect(hourInTimeZone("2026-09-07T07:30:00.000Z", "Europe/Madrid")).toBe(9);
  });
  it("wraps midnight to 0 rather than 24", () => {
    expect(hourInTimeZone("2026-09-07T22:10:00.000Z", "Europe/Madrid")).toBe(0);
  });
  it("falls back to UTC on an unknown zone", () => {
    expect(hourInTimeZone("2026-09-07T07:30:00.000Z", "Mars/Olympus")).toBe(7);
  });
});

describe("firstNameFrom", () => {
  it("takes the first word of a full name", () => {
    expect(firstNameFrom("Maria García López", "x@y.com")).toBe("Maria");
  });
  it("falls back to the mailbox name, capitalised", () => {
    expect(firstNameFrom(null, "lepadatu.dev@gmail.com")).toBe("Lepadatu");
    expect(firstNameFrom("  ", "anna_k@x.com")).toBe("Anna");
  });
  it("returns null with nothing to go on", () => {
    expect(firstNameFrom(null, null)).toBeNull();
    expect(firstNameFrom("", "@x.com")).toBeNull();
  });
});

describe("relativeAgo", () => {
  const now = "2026-09-07T12:00:00.000Z";
  it("buckets by the largest sensible unit", () => {
    expect(relativeAgo("2026-09-07T11:59:40.000Z", now)).toEqual({ unit: "now", value: 0 });
    expect(relativeAgo("2026-09-07T11:15:00.000Z", now)).toEqual({ unit: "minute", value: 45 });
    expect(relativeAgo("2026-09-07T09:00:00.000Z", now)).toEqual({ unit: "hour", value: 3 });
    expect(relativeAgo("2026-09-04T12:00:00.000Z", now)).toEqual({ unit: "day", value: 3 });
    expect(relativeAgo("2026-08-17T12:00:00.000Z", now)).toEqual({ unit: "week", value: 3 });
    expect(relativeAgo("2026-05-01T12:00:00.000Z", now)).toEqual({ unit: "month", value: 4 });
  });
  it("never goes negative for a future timestamp", () => {
    expect(relativeAgo("2026-09-08T12:00:00.000Z", now)).toEqual({ unit: "now", value: 0 });
  });
});

describe("pipelineSegments", () => {
  it("gives proportional widths and keeps empty stages", () => {
    const segs = pipelineSegments([
      { stage: "new", count: 3 },
      { stage: "contacted", count: 0 },
      { stage: "qualified", count: 1 },
    ]);
    expect(segs.map((s) => s.percent)).toEqual([75, 0, 25]);
    expect(segs).toHaveLength(3);
  });
  it("is all zeros for an empty side", () => {
    expect(
      pipelineSegments([
        { stage: "pending", count: 0 },
        { stage: "qualified", count: 0 },
      ]).map((s) => s.percent)
    ).toEqual([0, 0]);
  });
});

describe("buyersBeforeViewing", () => {
  it("counts new, contacted and qualified buyers only", () => {
    expect(
      buyersBeforeViewing([
        { stage: "new", count: 3 },
        { stage: "contacted", count: 2 },
        { stage: "qualified", count: 1 },
        { stage: "viewing", count: 4 },
        { stage: "reserved", count: 5 },
      ])
    ).toBe(6);
  });
});

describe("onboarding", () => {
  const fresh = { clientCount: 0, appointmentCount: 0, templateCount: 0, referralCount: 0 };
  it("marks each step from its count", () => {
    expect(onboardingSteps({ ...fresh, clientCount: 2, templateCount: 1 }).map((s) => s.done)).toEqual([
      true,
      false,
      true,
      false,
    ]);
  });
  it("shows while young and incomplete, hides once done or once the book is full", () => {
    expect(showOnboarding(fresh)).toBe(true);
    expect(showOnboarding({ ...fresh, clientCount: 3 })).toBe(true);
    expect(
      showOnboarding({ clientCount: 3, appointmentCount: 1, templateCount: 1, referralCount: 1 })
    ).toBe(false);
    expect(showOnboarding({ ...fresh, clientCount: 10 })).toBe(false);
  });
});

describe("countViewingsWithin", () => {
  const now = "2026-09-07T12:00:00.000Z";
  it("counts dated viewings and viewing-type appointments inside the window", () => {
    expect(
      countViewingsWithin(
        [
          { kind: "viewing", starts_at: "2026-09-08T10:00:00.000Z" },
          { kind: "meeting", starts_at: "2026-09-09T10:00:00.000Z", appointment: { type: "viewing" } },
          { kind: "meeting", starts_at: "2026-09-09T11:00:00.000Z", appointment: { type: "meeting" } },
          { kind: "viewing", starts_at: "2026-09-20T10:00:00.000Z" },
          { kind: "viewing", starts_at: "2026-09-06T10:00:00.000Z" },
        ],
        now,
        7
      )
    ).toBe(2);
  });
});
