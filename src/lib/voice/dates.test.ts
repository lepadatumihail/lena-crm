import { describe, expect, it } from "vitest";

import { dueDateOrNull, localDateTimeOrNull } from "./dates";

const today = "2026-11-08";

describe("dueDateOrNull", () => {
  it("keeps real days from yesterday to two years ahead", () => {
    expect(dueDateOrNull("2026-11-13", today)).toBe("2026-11-13");
    expect(dueDateOrNull("2026-11-07", today)).toBe("2026-11-07");
    expect(dueDateOrNull("2028-11-07", today)).toBe("2028-11-07");
  });

  it("drops impossible, malformed, old or far-off dates", () => {
    expect(dueDateOrNull("2026-02-30", today)).toBeNull();
    expect(dueDateOrNull("13/11/2026", today)).toBeNull();
    expect(dueDateOrNull("2026-11-06", today)).toBeNull();
    expect(dueDateOrNull("2029-01-01", today)).toBeNull();
    expect(dueDateOrNull(null, today)).toBeNull();
    expect(dueDateOrNull("", today)).toBeNull();
  });
});

describe("localDateTimeOrNull", () => {
  it("keeps a local time from today on", () => {
    expect(localDateTimeOrNull("2026-11-12T11:00", today)).toBe("2026-11-12T11:00");
    expect(localDateTimeOrNull("2026-11-08T09:30", today)).toBe("2026-11-08T09:30");
  });

  it("drops past days, bad times and other shapes", () => {
    expect(localDateTimeOrNull("2026-11-07T11:00", today)).toBeNull();
    expect(localDateTimeOrNull("2026-11-12T24:00", today)).toBeNull();
    expect(localDateTimeOrNull("2026-11-12T11:60", today)).toBeNull();
    expect(localDateTimeOrNull("2026-11-12 11:00", today)).toBeNull();
    expect(localDateTimeOrNull("2026-11-12T11:00:00Z", today)).toBeNull();
    expect(localDateTimeOrNull(undefined, today)).toBeNull();
  });
});
