import { describe, expect, it } from "vitest";

import { SITE_EVENTS, isSiteEvent } from "./site-events";

describe("isSiteEvent", () => {
  it.each(["tool_view", "tool_use", "tool_share"])("accepts the free-tool step %s", (event) => {
    expect(isSiteEvent(event)).toBe(true);
  });

  it.each([...SITE_EVENTS])("accepts %s", (event) => {
    expect(isSiteEvent(event)).toBe(true);
  });

  it.each(["", "tool", "tool_download", "TOOL_VIEW", "tool_view ", "page_view", null, undefined, 1, {}])(
    "rejects %j",
    (value) => {
      expect(isSiteEvent(value)).toBe(false);
    }
  );
});
