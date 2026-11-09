import { describe, expect, it } from "vitest";

import { buildInstructions, buildPrompt, todayContext, uiLanguageFor } from "./prompt";

describe("todayContext", () => {
  it("uses the agent's own day, not the server's", () => {
    // 23:30 UTC on Saturday 7 Nov is already Sunday 8 Nov in Madrid
    const now = new Date("2026-11-07T23:30:00Z");
    expect(todayContext(now, "Europe/Madrid")).toEqual({ today: "2026-11-08", weekday: "Sunday" });
    expect(todayContext(now, "America/New_York")).toEqual({ today: "2026-11-07", weekday: "Saturday" });
  });
});

describe("buildInstructions", () => {
  const base = { today: "2026-11-08", weekday: "Sunday", timeZone: "Europe/Madrid", uiLanguage: "Spanish" };

  it("names the date, zone and the language notes are written in", () => {
    const text = buildInstructions(base);
    expect(text).toContain("Today is Sunday 2026-11-08 (time zone Europe/Madrid)");
    expect(text).toContain("in Spanish");
    expect(text).toContain("Never invent");
    expect(text).toContain("fill viewing");
    expect(text).toContain('"meeting"');
    expect(text).not.toContain("recorded on");
  });

  it("ties a note recorded on a client's page to that client", () => {
    const text = buildInstructions({ ...base, boundClient: { first_name: "Anna", last_name: "Svensson", side: "buyer" } });
    expect(text).toContain("recorded on Anna Svensson's page (a buyer)");
  });
});

describe("helpers", () => {
  it("maps UI locales to languages, English by default", () => {
    expect(uiLanguageFor("es")).toBe("Spanish");
    expect(uiLanguageFor("ru")).toBe("Russian");
    expect(uiLanguageFor("de")).toBe("English");
    expect(uiLanguageFor(null)).toBe("English");
  });

  it("fences the transcript and neutralises triple quotes inside it", () => {
    const prompt = buildPrompt('She said """hi""" twice');
    expect(prompt.startsWith('Voice note transcript:\n"""\n')).toBe(true);
    expect(prompt).toContain('She said "hi" twice');
    expect(prompt.match(/"""/g)).toHaveLength(2);
  });
});
