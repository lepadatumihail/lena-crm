import type { NextRequest } from "next/server";

import { estimateTokens, htmlToMarkdown } from "@/lib/html-to-markdown";
import { prefersMarkdown } from "@/lib/markdown";
import { marketingRouteAt } from "@/lib/routes";

/**
 * The markdown version of a marketing page. The proxy rewrites a page request
 * here when its Accept header prefers text/markdown; this fetches the page's
 * own HTML from the same deployment and converts it, so the markdown never
 * drifts from what a browser gets. Asked for directly, without that
 * preference, the URL doesn't exist: it is plumbing, not a page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  const pathname = `/${path.join("/")}`;
  if (!marketingRouteAt(pathname) || !prefersMarkdown(request.headers.get("accept"))) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(pathname, request.nextUrl.origin);
  const page = await fetch(url, { headers: { accept: "text/html" } });
  if (!page.ok) return new Response(null, { status: page.status });

  const markdown = htmlToMarkdown(await page.text(), url.href);
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": page.headers.get("cache-control") ?? "no-store",
      // The HTML page answers at the same URL: caches must never hand this to a browser.
      Vary: "Accept",
      "x-markdown-tokens": String(estimateTokens(markdown)),
    },
  });
}
