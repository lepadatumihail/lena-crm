import { describe, expect, it } from "vitest";
import { enGB, es } from "date-fns/locale";

import {
  calendarHref,
  dayKey,
  eventEndMs,
  layoutOverlaps,
  minutesLabel,
  rangeLabel,
  resolveCalendarRequest,
  shiftAnchor,
  visibleRange,
} from "./calendar-view";

// Wednesday 9 September 2026, mid-afternoon, in the test machine's zone.
const today = new Date(2026, 8, 9, 15, 30);

describe("resolveCalendarRequest", () => {
  it("opens this week by default", () => {
    const { view, anchor } = resolveCalendarRequest({}, undefined, today);
    expect(view).toBe("week");
    expect(anchor).toBe(today);
  });

  it("remembers the last view", () => {
    expect(resolveCalendarRequest({}, "month", today).view).toBe("month");
  });

  it("lets the URL override what was remembered", () => {
    expect(resolveCalendarRequest({ view: "week" }, "month", today).view).toBe(
      "week"
    );
  });

  it("anchors on the date in the URL", () => {
    const { anchor } = resolveCalendarRequest({ date: "2026-10-05" }, undefined, today);
    expect(dayKey(anchor)).toBe("2026-10-05");
  });

  it("keeps old ?month= links opening that month", () => {
    const { view, anchor } = resolveCalendarRequest({ month: "2026-10" }, "week", today);
    expect(view).toBe("month");
    expect(dayKey(anchor)).toBe("2026-10-01");
  });

  it("ignores values it doesn't understand", () => {
    const { view, anchor } = resolveCalendarRequest(
      { view: "day", date: "next-tuesday", month: "2026-13" },
      "agenda",
      today
    );
    expect(view).toBe("week");
    expect(anchor).toBe(today);
  });

  it("ignores well-formed dates that don't exist", () => {
    const { anchor } = resolveCalendarRequest({ date: "2026-02-30" }, undefined, today);
    expect(anchor).toBe(today);
  });
});

describe("visibleRange", () => {
  it("shows Monday to Sunday around the anchor", () => {
    const { start, end } = visibleRange("week", today);
    expect(dayKey(start)).toBe("2026-09-07");
    expect(start.getHours()).toBe(0);
    expect(dayKey(end)).toBe("2026-09-13");
    expect(end.getHours()).toBe(23);
  });

  it("pads the month out to whole weeks", () => {
    const { start, end } = visibleRange("month", today);
    expect(dayKey(start)).toBe("2026-08-31");
    expect(dayKey(end)).toBe("2026-10-04");
  });
});

describe("shiftAnchor", () => {
  it("moves a week at a time in week view", () => {
    expect(dayKey(shiftAnchor("week", today, 1))).toBe("2026-09-16");
    expect(dayKey(shiftAnchor("week", today, -1))).toBe("2026-09-02");
  });

  it("moves a month at a time in month view", () => {
    expect(dayKey(shiftAnchor("month", today, 1))).toBe("2026-10-09");
    expect(dayKey(shiftAnchor("month", today, -1))).toBe("2026-08-09");
  });
});

describe("calendarHref", () => {
  it("names the view and the day", () => {
    expect(calendarHref("week", today)).toBe("/calendar?view=week&date=2026-09-09");
    expect(calendarHref("month", "2026-10-01")).toBe(
      "/calendar?view=month&date=2026-10-01"
    );
  });

  it("leaves the day out so the page opens on today", () => {
    expect(calendarHref("week")).toBe("/calendar?view=week");
  });
});

describe("rangeLabel", () => {
  it("names the month", () => {
    expect(rangeLabel("month", today, enGB)).toBe("September 2026");
    expect(rangeLabel("month", today, es)).toBe("septiembre 2026");
  });

  it("names a week inside one month", () => {
    expect(rangeLabel("week", today, enGB)).toBe("7 – 13 September 2026");
    expect(rangeLabel("week", today, es)).toBe("7 – 13 septiembre 2026");
  });

  it("names a week straddling two months", () => {
    const monday = new Date(2026, 7, 31);
    expect(rangeLabel("week", monday, enGB)).toBe("31 Aug – 6 Sep 2026");
    expect(rangeLabel("week", monday, es)).toBe("31 ago – 6 sep 2026");
  });

  it("names a week straddling two years", () => {
    const newYear = new Date(2026, 11, 30);
    expect(rangeLabel("week", newYear, enGB)).toBe("28 Dec 2026 – 3 Jan 2027");
  });
});

describe("eventEndMs", () => {
  const start = "2026-09-09T10:00:00.000Z";
  const startMs = Date.parse(start);

  it("uses the stored end", () => {
    expect(eventEndMs(start, "2026-09-09T10:45:00.000Z")).toBe(
      startMs + 45 * 60_000
    );
  });

  it("gives events without an end an hour", () => {
    expect(eventEndMs(start, null)).toBe(startMs + 60 * 60_000);
  });

  it("treats an end before the start as missing", () => {
    expect(eventEndMs(start, "2026-09-09T09:00:00.000Z")).toBe(
      startMs + 60 * 60_000
    );
  });
});

describe("minutesLabel", () => {
  it("pads to 24h time", () => {
    expect(minutesLabel(0)).toBe("00:00");
    expect(minutesLabel(9 * 60 + 5)).toBe("09:05");
    expect(minutesLabel(21 * 60 + 30)).toBe("21:30");
  });
});

describe("layoutOverlaps", () => {
  const at = (id: string, start: string, end: string) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return { id, startMin: sh * 60 + sm, endMin: eh * 60 + em };
  };

  it("gives events that don't overlap the full width", () => {
    const out = layoutOverlaps([at("a", "09:00", "10:00"), at("b", "10:00", "11:00")]);
    expect(out.get("a")).toEqual({ column: 0, columns: 1 });
    expect(out.get("b")).toEqual({ column: 0, columns: 1 });
  });

  it("puts overlapping events side by side", () => {
    const out = layoutOverlaps([at("a", "09:00", "10:00"), at("b", "09:30", "10:30")]);
    expect(out.get("a")).toEqual({ column: 0, columns: 2 });
    expect(out.get("b")).toEqual({ column: 1, columns: 2 });
  });

  it("shares columns across a chain of overlaps", () => {
    const out = layoutOverlaps([
      at("c", "10:00", "11:00"),
      at("a", "09:00", "10:00"),
      at("b", "09:30", "10:30"),
    ]);
    expect(out.get("a")).toEqual({ column: 0, columns: 2 });
    expect(out.get("b")).toEqual({ column: 1, columns: 2 });
    expect(out.get("c")).toEqual({ column: 0, columns: 2 });
  });

  it("starts a fresh run once the overlaps end", () => {
    const out = layoutOverlaps([
      at("a", "09:00", "10:00"),
      at("b", "09:00", "10:00"),
      at("c", "12:00", "13:00"),
    ]);
    expect(out.get("c")).toEqual({ column: 0, columns: 1 });
  });

  it("handles an empty day", () => {
    expect(layoutOverlaps([]).size).toBe(0);
  });
});
