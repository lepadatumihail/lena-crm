// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { estimateTokens } from "@/lib/html-to-markdown";
import { GET } from "./route";

const PAGE = `<html><head><meta property="og:title" content="Privacy Policy"></head>
<body><main><h1>Privacy Policy</h1><p>Plain language.</p></main></body></html>`;

function get(path: string[], accept: string) {
  const request = new NextRequest(`https://www.leadwing.app/markdown/${path.join("/")}`, {
    headers: { accept },
  });
  return GET(request, { params: Promise.resolve({ path }) });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("markdown route", () => {
  it("converts the page's own HTML, fetched from this deployment", async () => {
    const fetchPage = vi.fn<typeof fetch>(
      async () =>
        new Response(PAGE, {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "private, no-store",
          },
        })
    );
    vi.stubGlobal("fetch", fetchPage);

    const response = await get(["privacy"], "text/markdown");
    const body = await response.text();

    const [url, init] = fetchPage.mock.calls[0];
    expect(String(url)).toBe("https://www.leadwing.app/privacy");
    expect(init).toEqual({ headers: { accept: "text/html" } });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toBe("Accept");
    expect(response.headers.get("x-markdown-tokens")).toBe(String(estimateTokens(body)));
    expect(body).toBe('---\ntitle: "Privacy Policy"\n---\n\n# Privacy Policy\n\nPlain language.\n');
  });

  it.each([
    [["login"], "text/markdown"],
    [["privacy"], "text/html"],
  ])("is not a page for /markdown/%s with Accept %s", async (path, accept) => {
    const fetchPage = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchPage);
    expect((await get(path, accept)).status).toBe(404);
    expect(fetchPage).not.toHaveBeenCalled();
  });
});
