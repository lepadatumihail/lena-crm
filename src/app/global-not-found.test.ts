import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { LOCALES } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

/**
 * The contract for URLs that don't exist: a real 404, and a body short enough
 * to be useful, naming the places a crawler or an AI agent should go instead.
 *
 * Two things quietly break that, which is why they are pinned here:
 *
 * 1. Without `experimental.globalNotFound`, a 404 renders through the layout
 *    tree. The moment anything in that tree streams, the status line is
 *    already sent and Next can only answer 200 — a "soft 404" that tells
 *    agents every path on the site exists.
 * 2. A catch-all route at the app root would match every unclaimed URL and
 *    answer 200 before the 404 machinery ever runs.
 */

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "src/app");

/** The entry points the 404 body hands to agents; each must be a real route. */
const SIGNPOSTS = {
  "/": "page.tsx",
  "/sitemap.xml": "sitemap.ts",
  "/llms.txt": "llms.txt/route.ts",
} as const;

const globalNotFound = readFileSync(join(APP_DIR, "global-not-found.tsx"), "utf-8");

describe("404 responses", () => {
  it("serves unmatched URLs from global-not-found, above the layout tree", () => {
    expect(existsSync(join(APP_DIR, "global-not-found.tsx"))).toBe(true);
    expect(readFileSync(join(ROOT, "next.config.ts"), "utf-8")).toMatch(
      /globalNotFound:\s*true/
    );
  });

  it("has no root catch-all to swallow unmatched URLs with a 200", () => {
    const catchAll = readdirSync(APP_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("[..."))
      .map((entry) => entry.name);
    expect(catchAll).toEqual([]);
  });

  it("keeps the root shell out of the 404 so nothing can stream it into a 200", () => {
    expect(existsSync(join(APP_DIR, "loading.tsx"))).toBe(false);
    expect(globalNotFound).not.toMatch(/\bSuspense\b/);
  });

  it("points agents at entry points that exist", () => {
    for (const [href, file] of Object.entries(SIGNPOSTS)) {
      expect(globalNotFound).toContain(`"${href}"`);
      expect(existsSync(join(APP_DIR, file))).toBe(true);
    }
  });

  it("is translated in every language", () => {
    for (const locale of LOCALES) {
      const copy = messagesFor(locale).landing.notFound;
      for (const key of ["title", "body", "links", "home", "sitemap", "llms"]) {
        expect(copy, `${locale}.landing.notFound.${key}`).toHaveProperty(key);
      }
    }
  });
});
