import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { eventReminderHref, reminderWhen } from "./event-reminder";
import type { CalendarEvent, EventContact } from "./data/calendar";

// 12:52 UTC on Sunday 27 Sep 2026: 14:52 in Madrid (CEST), 13:52 in London
// (BST), 05:52 in Los Angeles (PDT), and already Monday 02:52 in Kiritimati.
const STARTS_AT = "2026-09-27T12:52:00.000Z";

function meeting(contact: EventContact | null, reminderWhat = ""): CalendarEvent {
  return {
    kind: "meeting",
    id: "e1",
    starts_at: STARTS_AT,
    ends_at: null,
    title: "Meeting",
    location: null,
    contact,
    reminderWhat,
    appointment: {} as Extract<CalendarEvent, { kind: "meeting" }>["appointment"],
  };
}

/** The message a wa.me link would prefill. */
function messageOf(href: string | null): string {
  expect(href).not.toBeNull();
  return new URL(href!).searchParams.get("text") ?? "";
}

describe("eventReminderHref", () => {
  it("writes the whole message, date and time included, in Spanish", () => {
    const href = eventReminderHref(
      meeting({ firstName: "Sofia", phone: "+34 612 345 678", language: "Spanish" }),
      "Europe/Madrid"
    );
    expect(href!.startsWith("https://wa.me/34612345678?text=")).toBe(true);
    expect(messageOf(href)).toBe(
      "Hola Sofia, un recordatorio sobre nuestra cita el domingo 27 de septiembre a las 14:52. ¡Nos vemos!"
    );
  });

  it("keeps the English wording for an English contact", () => {
    const href = eventReminderHref(
      meeting(
        { firstName: "James", phone: "+44 7700 900123", language: "English" },
        "the viewing at Villa Sol"
      ),
      "Europe/London"
    );
    expect(messageOf(href)).toBe(
      "Hi James, just a reminder about the viewing at Villa Sol on Sun 27 Sep at 13:52. See you then!"
    );
  });

  it("falls back to English wording for a language without its own", () => {
    const href = eventReminderHref(
      meeting({ firstName: "Anna", phone: "+34612345678", language: "Klingon" }),
      "Europe/Madrid"
    );
    expect(messageOf(href)).toContain("on Sun 27 Sep at 14:52");
  });

  it("returns null without a phone", () => {
    expect(
      eventReminderHref(
        meeting({ firstName: "Anna", phone: null, language: "Spanish" }),
        "Europe/Madrid"
      )
    ).toBeNull();
    expect(eventReminderHref(meeting(null), "Europe/Madrid")).toBeNull();
  });
});

describe("reminderWhen in a zone other than the runtime's", () => {
  // Pin the process far east of the agent, where it is already the next day,
  // the way the server's UTC clock sits two hours behind a Spanish agent.
  const originalTZ = process.env.TZ;
  beforeEach(() => {
    process.env.TZ = "Pacific/Kiritimati";
  });
  afterEach(() => {
    if (originalTZ === undefined) delete process.env.TZ;
    else process.env.TZ = originalTZ;
  });

  it("reads the day and time on the agent's clock, not the process's", () => {
    // The runtime really is on Monday 02:52 here.
    const runtime = new Date(STARTS_AT);
    expect([runtime.getDate(), runtime.getHours()]).toEqual([28, 2]);

    expect(reminderWhen(STARTS_AT, "English", "America/Los_Angeles")).toBe(
      "Sun 27 Sep at 05:52"
    );
    expect(reminderWhen(STARTS_AT, "Spanish", "Europe/Madrid")).toBe(
      "domingo 27 de septiembre a las 14:52"
    );
    expect(reminderWhen(STARTS_AT, "Russian", "Europe/Moscow")).toBe(
      "воскресенье, 27 сентября в 15:52"
    );
  });
});
