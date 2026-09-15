import { describe, expect, it } from "vitest";

import {
  DEFAULT_TIME_ZONE,
  isValidTimeZone,
  listTimeZones,
  resolveTimeZone,
  timeZoneCity,
  timeZoneRegion,
  utcOffsetLabel,
  utcOffsetMinutes,
} from "@/lib/time-zones";

const WINTER = new Date("2026-01-15T12:00:00Z");
const SUMMER = new Date("2026-07-15T12:00:00Z");

describe("time zones", () => {
  it("accepts IANA names and rejects anything else", () => {
    expect(isValidTimeZone("Europe/Madrid")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone(null)).toBe(false);
  });

  it("falls back to Spain when the agent never chose a zone", () => {
    expect(resolveTimeZone(null)).toBe(DEFAULT_TIME_ZONE);
    expect(resolveTimeZone("Not/AZone")).toBe(DEFAULT_TIME_ZONE);
    expect(resolveTimeZone("Europe/London")).toBe("Europe/London");
  });

  it("labels the offset at the instant, daylight saving included", () => {
    expect(utcOffsetLabel("Europe/Madrid", WINTER)).toBe("GMT+1");
    expect(utcOffsetLabel("Europe/Madrid", SUMMER)).toBe("GMT+2");
    expect(utcOffsetLabel("UTC", SUMMER)).toBe("GMT");
    expect(utcOffsetLabel("Europe/London", WINTER)).toBe("GMT");
    expect(utcOffsetMinutes("Asia/Kolkata", SUMMER)).toBe(330);
    expect(utcOffsetMinutes("America/New_York", WINTER)).toBe(-300);
    expect(utcOffsetMinutes("UTC", WINTER)).toBe(0);
  });

  it("reads the place and the region out of the name", () => {
    expect(timeZoneCity("America/Argentina/Buenos_Aires")).toBe("Buenos Aires");
    expect(timeZoneRegion("America/Argentina/Buenos_Aires")).toBe("America");
    expect(timeZoneRegion("UTC")).toBe("UTC");
  });

  it("lists the zones this runtime knows, UTC included", () => {
    const zones = listTimeZones();
    expect(zones).toContain("Europe/Madrid");
    expect(zones).toContain("UTC");
  });
});
