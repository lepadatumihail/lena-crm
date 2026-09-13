// @vitest-environment node
import { describe, expect, it } from "vitest";

import { PROTECTED_PREFIXES } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";
import { GET } from "./route";

async function robots() {
  const response = GET();
  return {
    type: response.headers.get("content-type"),
    lines: (await response.text()).split("\n"),
  };
}

describe("robots.txt", () => {
  it("is served as plain text", async () => {
    expect((await robots()).type).toBe("text/plain; charset=utf-8");
  });

  it("keeps the app, the API and invite landings out, and names the sitemap", async () => {
    const { lines } = await robots();
    for (const path of ["/api/", ...PROTECTED_PREFIXES, "/join/"]) {
      expect(lines).toContain(`Disallow: ${path}`);
    }
    expect(lines).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });

  // Content-Signal is a group rule, so it only counts inside a User-Agent group.
  it("declares every content signal, yes or no, inside the * group", async () => {
    const { lines } = await robots();
    const start = lines.indexOf("User-Agent: *");
    const group = lines.slice(start, lines.indexOf("", start));
    const signals = group.filter((line) => line.startsWith("Content-Signal: "));
    expect(signals).toHaveLength(1);

    const pairs = signals[0]
      .slice("Content-Signal: ".length)
      .split(", ")
      .map((pair) => pair.split("="));
    expect(pairs.map(([label]) => label).sort()).toEqual(["ai-input", "ai-train", "search"]);
    for (const [, value] of pairs) expect(["yes", "no"]).toContain(value);
  });
});
