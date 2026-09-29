import { describe, it, expect } from "vitest";

import {
  addDaysToKey,
  buyersBeforeViewing,
  countAddedWithin,
  dateKeyInTimeZone,
  dayRangeInTimeZone,
  firstNameFrom,
  greetingPeriod,
  groupByDay,
  hourInTimeZone,
  initialsOf,
  HOME_ONBOARDING_COOKIE,
  INVITE_UNLOCK_CLIENTS,
  isFirstSession,
  nextOnboardingStep,
  onboardingCookie,
  onboardingExpected,
  onboardingProgress,
  onboardingState,
  onboardingSteps,
  pipelineSegments,
  readOnboardingCookie,
  relativeAgo,
  showOnboarding,
  viewingsByDay,
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
  const fresh = {
    hasName: false,
    clientCount: 0,
    appointmentCount: 0,
    templateCount: 0,
    referralCount: 0,
  };
  it("marks each step from its count", () => {
    expect(
      onboardingSteps({ ...fresh, hasName: true, clientCount: 2, templateCount: 1 }).map(
        (s) => s.done
      )
    ).toEqual([true, true, false, true, false]);
  });
  it("keeps the invite step locked until the book has a few clients", () => {
    const invite = (input: typeof fresh) =>
      onboardingSteps(input).find((s) => s.step === "inviteColleague")!;
    expect(invite(fresh).locked).toBe(true);
    expect(invite({ ...fresh, clientCount: INVITE_UNLOCK_CLIENTS - 1 }).locked).toBe(true);
    expect(invite({ ...fresh, clientCount: INVITE_UNLOCK_CLIENTS }).locked).toBe(false);
    // An agent who already invited someone is simply done, however few clients they hold.
    expect(invite({ ...fresh, referralCount: 1 })).toEqual({
      step: "inviteColleague",
      done: true,
      locked: false,
      optional: true,
    });
    // Nothing else ever locks.
    expect(onboardingSteps(fresh).filter((s) => s.locked).map((s) => s.step)).toEqual([
      "inviteColleague",
    ]);
  });
  it("shows while young and incomplete, hides once done or once the book is full", () => {
    expect(showOnboarding(fresh)).toBe(true);
    expect(showOnboarding({ ...fresh, clientCount: 3 })).toBe(true);
    expect(
      showOnboarding({
        hasName: true,
        clientCount: 3,
        appointmentCount: 1,
        templateCount: 1,
        referralCount: 1,
      })
    ).toBe(false);
    expect(showOnboarding({ ...fresh, clientCount: 10 })).toBe(false);
  });
  it("does not wait for the invite: it is optional", () => {
    const required = { hasName: true, clientCount: 4, appointmentCount: 1, templateCount: 1 };
    const optional = onboardingSteps({ ...required, referralCount: 0 }).filter((s) => s.optional);
    expect(optional.map((s) => s.step)).toEqual(["inviteColleague"]);
    // Every required step done, no colleague signed up: finished all the same.
    expect(showOnboarding({ ...required, referralCount: 0 })).toBe(false);
    // Only the invite done: still young.
    expect(showOnboarding({ ...fresh, referralCount: 1 })).toBe(true);
  });
  it("counts progress over the required steps only", () => {
    expect(onboardingProgress(fresh)).toEqual({ done: 0, total: 4 });
    expect(onboardingProgress({ ...fresh, hasName: true, clientCount: 2 })).toEqual({
      done: 2,
      total: 4,
    });
    // An invite that landed does not count toward the four.
    expect(onboardingProgress({ ...fresh, referralCount: 1 })).toEqual({ done: 0, total: 4 });
  });
  it("offers the first step that is neither done nor locked", () => {
    expect(nextOnboardingStep(fresh)).toBe("addName");
    expect(nextOnboardingStep({ ...fresh, hasName: true })).toBe("addClient");
    expect(nextOnboardingStep({ ...fresh, hasName: true, clientCount: 1 })).toBe(
      "scheduleAppointment"
    );
    expect(
      nextOnboardingStep({ ...fresh, hasName: true, clientCount: 1, appointmentCount: 1 })
    ).toBe("createTemplate");
    const required = { hasName: true, appointmentCount: 1, templateCount: 1, referralCount: 0 };
    // Everything left is locked: nothing to offer.
    expect(nextOnboardingStep({ ...required, clientCount: 1 })).toBeNull();
    expect(nextOnboardingStep({ ...required, clientCount: INVITE_UNLOCK_CLIENTS })).toBe(
      "inviteColleague"
    );
    expect(nextOnboardingStep({ ...required, clientCount: 1, referralCount: 1 })).toBeNull();
  });
  it("calls an account without clients a first session", () => {
    expect(isFirstSession(0)).toBe(true);
    expect(isFirstSession(1)).toBe(false);
  });
});

describe("onboarding cookie", () => {
  const me = "1b4e28ba-2fa1-11d2-883f-0016d3cca427";
  const other = "6fa459ea-ee8a-3ca4-894e-db77e160355e";
  it("holds a place for the strip unless it was closed or finished on this device", () => {
    expect(onboardingExpected(undefined)).toBe(true);
    expect(onboardingExpected("hidden")).toBe(false);
    expect(onboardingExpected("done")).toBe(false);
  });
  it("counts only this agent's value on a shared device", () => {
    expect(onboardingState(undefined, me)).toBeUndefined();
    expect(onboardingState("", me)).toBeUndefined();
    expect(onboardingState(`done.${me}`, me)).toBe("done");
    expect(onboardingState(`hidden.${me}`, me)).toBe("hidden");
    // Another account finished or closed it on this browser: not ours.
    expect(onboardingState(`done.${other}`, me)).toBeUndefined();
    // The old unnamed form, and garbage, count as nothing.
    expect(onboardingState("done", me)).toBeUndefined();
    expect(onboardingState(`maybe.${me}`, me)).toBeUndefined();
    // Outside the signed-in shell there is no agent to match.
    expect(onboardingState(`hidden.${other}`, null)).toBe("hidden");
  });
  it("reads its value out of document.cookie", () => {
    expect(readOnboardingCookie("")).toBeUndefined();
    expect(readOnboardingCookie("sidebar_state=true")).toBeUndefined();
    expect(readOnboardingCookie(`sidebar_state=true; ${HOME_ONBOARDING_COOKIE}=hidden`)).toBe(
      "hidden"
    );
    expect(readOnboardingCookie(`${HOME_ONBOARDING_COOKIE}=done;tasks_view=list`)).toBe("done");
    // A cookie whose name only starts the same is someone else's.
    expect(readOnboardingCookie(`${HOME_ONBOARDING_COOKIE}_x=hidden`)).toBeUndefined();
  });
  it("writes a year-long cookie for the whole site that names its agent, and clears it", () => {
    expect(onboardingCookie("hidden", me)).toBe(
      `home_onboarding=hidden.${me}; path=/; max-age=31536000; samesite=lax`
    );
    expect(onboardingCookie(null)).toBe("home_onboarding=; path=/; max-age=0; samesite=lax");
  });
});

describe("addDaysToKey", () => {
  it("steps over month and year ends", () => {
    expect(addDaysToKey("2026-09-26", 0)).toBe("2026-09-26");
    expect(addDaysToKey("2026-09-26", 6)).toBe("2026-10-02");
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("keeps whole days across the October clock change", () => {
    expect(addDaysToKey("2026-10-24", 2)).toBe("2026-10-26");
  });
});

describe("viewingsByDay", () => {
  const events = [
    { kind: "viewing" as const, starts_at: "2026-09-26T08:00:00.000Z" },
    { kind: "meeting" as const, starts_at: "2026-09-26T09:00:00.000Z", appointment: { type: "viewing" } },
    { kind: "meeting" as const, starts_at: "2026-09-27T09:00:00.000Z", appointment: { type: "meeting" } },
    // 00:30 on 30 September in Madrid, 29 September in UTC
    { kind: "viewing" as const, starts_at: "2026-09-29T22:30:00.000Z" },
    // the eighth day is past the week
    { kind: "viewing" as const, starts_at: "2026-10-03T10:00:00.000Z" },
  ];

  it("counts viewings and viewing appointments on each of the agent's days", () => {
    expect(viewingsByDay(events, "2026-09-26", "Europe/Madrid", 7)).toEqual([
      { key: "2026-09-26", count: 2 },
      { key: "2026-09-27", count: 0 },
      { key: "2026-09-28", count: 0 },
      { key: "2026-09-29", count: 0 },
      { key: "2026-09-30", count: 1 },
      { key: "2026-10-01", count: 0 },
      { key: "2026-10-02", count: 0 },
    ]);
  });
  it("reads the day in the agent's zone, not UTC", () => {
    const utc = viewingsByDay(events, "2026-09-26", "UTC", 7);
    expect(utc.find((d) => d.key === "2026-09-29")?.count).toBe(1);
    expect(utc.find((d) => d.key === "2026-09-30")?.count).toBe(0);
  });
});

describe("groupByDay", () => {
  it("sorts events and groups them under the agent's calendar day", () => {
    const groups = groupByDay(
      [
        { id: "b", starts_at: "2026-09-27T16:00:00.000Z" },
        { id: "a", starts_at: "2026-09-26T08:00:00.000Z" },
        { id: "c", starts_at: "2026-09-27T09:00:00.000Z" },
        { id: "d", starts_at: "2026-09-27T22:30:00.000Z" },
      ],
      "Europe/Madrid"
    );
    expect(groups.map((g) => [g.key, g.events.map((e) => e.id)])).toEqual([
      ["2026-09-26", ["a"]],
      ["2026-09-27", ["c", "b"]],
      ["2026-09-28", ["d"]],
    ]);
  });
  it("returns nothing for no events", () => {
    expect(groupByDay([], "Europe/Madrid")).toEqual([]);
  });
});

describe("countAddedWithin", () => {
  it("counts each side's clients added inside the window", () => {
    const now = "2026-09-26T12:00:00.000Z";
    expect(
      countAddedWithin(
        [
          { side: "buyer", created_at: "2026-09-25T10:00:00.000Z" },
          { side: "buyer", created_at: "2026-08-28T12:00:01.000Z" },
          { side: "buyer", created_at: "2026-08-27T12:00:00.000Z" },
          { side: "seller", created_at: "2026-09-20T10:00:00.000Z" },
          { side: "seller", created_at: "2026-09-27T10:00:00.000Z" },
        ],
        now,
        30
      )
    ).toEqual({ buyer: 2, seller: 1 });
  });
});

describe("initialsOf", () => {
  it("takes the first and last name's initials", () => {
    expect(initialsOf("Maria García")).toBe("MG");
    expect(initialsOf("Jean Paul de la Cruz")).toBe("JC");
  });
  it("falls back to the first two letters of a single word", () => {
    expect(initialsOf("Madonna")).toBe("MA");
    expect(initialsOf("")).toBe("");
  });
});

describe("dayRangeInTimeZone", () => {
  it("brackets the Madrid calendar day around a summer instant", () => {
    const { start, end } = dayRangeInTimeZone(
      "2026-09-14T10:00:00.000Z",
      "Europe/Madrid"
    );
    expect(start).toBe("2026-09-13T22:00:00.000Z");
    expect(end).toBe("2026-09-14T22:00:00.000Z");
  });
  it("moves to the next local day just after Madrid midnight", () => {
    const { start } = dayRangeInTimeZone("2026-09-14T22:30:00.000Z", "Europe/Madrid");
    expect(start).toBe("2026-09-14T22:00:00.000Z");
  });
  it("uses the winter offset in January", () => {
    const { start } = dayRangeInTimeZone("2026-01-10T12:00:00.000Z", "Europe/Madrid");
    expect(start).toBe("2026-01-09T23:00:00.000Z");
  });
});

describe("dateKeyInTimeZone", () => {
  it("names the Madrid calendar day, not the UTC one", () => {
    expect(dateKeyInTimeZone("2026-09-14T10:00:00.000Z", "Europe/Madrid")).toBe("2026-09-14");
    expect(dateKeyInTimeZone("2026-09-14T22:30:00.000Z", "Europe/Madrid")).toBe("2026-09-15");
  });
  it("falls back to UTC on an unknown zone", () => {
    expect(dateKeyInTimeZone("2026-09-14T22:30:00.000Z", "Mars/Olympus")).toBe("2026-09-14");
  });
});
