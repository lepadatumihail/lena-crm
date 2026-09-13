// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { GET as llmsTxt } from "@/app/llms.txt/route";
import { LOCALES } from "@/i18n/config";
import { MARKETING_ROUTES, marketingPath } from "@/lib/routes";
import { proxy } from "./proxy";

// The session refresh calls Supabase, and nothing about a public page's
// headers depends on it: stand in the pass-through an anonymous visitor gets.
vi.mock("@/lib/supabase/middleware", async () => {
  const { NextResponse } = await import("next/server");
  return { updateSession: async () => NextResponse.next() };
});

const BROWSER = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
const AGENT = "text/markdown";

const MARKETING_PATHS = Object.values(MARKETING_ROUTES).flatMap((paths) =>
  LOCALES.map((locale) => paths[locale])
);

function request(pathname: string, accept?: string) {
  const init = accept ? { headers: { accept } } : undefined;
  return proxy(new NextRequest(`https://www.leadwing.app${pathname}`, init));
}

describe("agent discovery Link header", () => {
  it.each(LOCALES)("points agents at llms.txt from the %s home page", async (locale) => {
    for (const accept of [BROWSER, AGENT]) {
      const response = await request(marketingPath("home", locale), accept);
      expect(response.headers.get("link")).toBe(
        '</llms.txt>; rel="describedby"; type="text/plain"'
      );
    }
  });

  it.each(["/privacy", "/es/privacidad", "/login", "/does-not-exist"])(
    "stays off %s",
    async (pathname) => {
      expect((await request(pathname)).headers.get("link")).toBeNull();
    }
  );

  it("promises the media type llms.txt really serves", () => {
    expect(llmsTxt().headers.get("content-type")).toMatch(/^text\/plain;/);
  });
});

describe("markdown for agents", () => {
  it.each([
    ["/", "/markdown"],
    ["/es", "/markdown/es"],
    ["/privacy", "/markdown/privacy"],
    ["/es/aviso-legal", "/markdown/es/aviso-legal"],
  ])("rewrites %s to %s when Accept prefers markdown", async (pathname, route) => {
    const response = await request(pathname, AGENT);
    expect(response.headers.get("x-middleware-rewrite")).toBe(`https://www.leadwing.app${route}`);
  });

  it("offers every marketing page in both representations", async () => {
    for (const pathname of MARKETING_PATHS) {
      const asMarkdown = await request(pathname, AGENT);
      const asHtml = await request(pathname, BROWSER);
      expect(asMarkdown.headers.get("x-middleware-rewrite"), pathname).not.toBeNull();
      expect(asHtml.headers.get("x-middleware-rewrite"), pathname).toBeNull();
    }
  });

  it.each(["/login", "/join/abc", "/does-not-exist"])(
    "leaves %s alone even when markdown is asked for",
    async (pathname) => {
      expect((await request(pathname, AGENT)).headers.get("x-middleware-rewrite")).toBeNull();
    }
  );
});
