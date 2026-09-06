import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { PROTECTED_PREFIXES, isProtectedPath } from "./routes";

const APP_DIR = join(process.cwd(), "src/app");

/** Route segments in a directory: real folders, not groups, slots or private dirs. */
function routeSegments(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !/^[(@_[]/.test(entry.name))
    .map((entry) => entry.name);
}

describe("isProtectedPath", () => {
  it.each([
    "/home",
    "/clients",
    "/clients/abc/edit",
    "/calendar",
    "/billing",
    "/pricing",
    "/admin",
  ])("guards %s", (pathname) => {
    expect(isProtectedPath(pathname)).toBe(true);
  });

  it.each([
    "/",
    "/login",
    "/auth/callback",
    "/join/abc",
    "/api/calendar/token",
    "/api/stripe/webhook",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
    "/does-not-exist",
    "/clientsx",
    "/homepage",
  ])("lets %s through", (pathname) => {
    expect(isProtectedPath(pathname)).toBe(false);
  });
});

describe("PROTECTED_PREFIXES", () => {
  it("covers every route in the (app) group", () => {
    const missing = routeSegments(join(APP_DIR, "(app)"))
      .map((segment) => `/${segment}`)
      .filter((prefix) => !isProtectedPath(prefix));
    expect(missing).toEqual([]);
  });

  it("names only routes that exist", () => {
    const stale = PROTECTED_PREFIXES.filter(
      (prefix) =>
        !existsSync(join(APP_DIR, "(app)", prefix)) &&
        !existsSync(join(APP_DIR, prefix))
    );
    expect(stale).toEqual([]);
  });
});
