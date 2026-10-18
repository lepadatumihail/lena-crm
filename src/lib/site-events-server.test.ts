import { afterEach, describe, expect, it, vi } from "vitest";

const insert = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => ({ insert }) }),
}));

import { recordSiteEvent } from "@/lib/site-events-server";

afterEach(() => {
  vi.clearAllMocks();
});

describe("recordSiteEvent", () => {
  it("stores the referring site's hostname with the step", async () => {
    insert.mockResolvedValue({ error: null });
    await expect(
      recordSiteEvent({ event: "tool_view", path: "/tools/client-spreadsheet", referrer: "www.Perplexity.ai" })
    ).resolves.toBe(true);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ event: "tool_view", path: "/tools/client-spreadsheet", referrer: "perplexity.ai" })
    );
  });

  it("drops a referrer that carries more than a hostname", async () => {
    insert.mockResolvedValue({ error: null });
    await recordSiteEvent({ event: "tool_view", referrer: "https://www.google.com/search?q=leadwing" });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ referrer: null }));
  });

  it("stores no referrer when none was sent", async () => {
    insert.mockResolvedValue({ error: null });
    await recordSiteEvent({ event: "landing_view", path: "/quiet", utm_source: "facebook" });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ utm_source: "facebook", referrer: null }));
  });

  it("stores nothing for an unknown step", async () => {
    await expect(recordSiteEvent({ event: "page_view", referrer: "google.com" })).resolves.toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });
});
