/**
 * Markdown for agents: a marketing page requested with `Accept: text/markdown`
 * answers with a markdown rendering of itself instead of HTML. The proxy
 * decides with these helpers and rewrites to the route that converts the
 * page (src/app/markdown). The converter lives in html-to-markdown.ts so its
 * HTML parser never loads into the proxy, which runs on every request.
 */

/** The internal route that serves a marketing page's path as markdown. */
export function markdownRoute(path: string): string {
  return path === "/" ? "/markdown" : `/markdown${path}`;
}

/**
 * Whether an Accept header prefers markdown to HTML: text/markdown must be
 * named, with a weight at least that of the most specific range covering
 * text/html. Wildcards never select it, so browsers, which list text/html
 * first, and clients that accept any type keep getting HTML.
 */
export function prefersMarkdown(accept: string | null | undefined): boolean {
  if (!accept) return false;
  const weights = new Map<string, number>();
  for (const part of accept.split(",")) {
    const [range, ...params] = part.split(";").map((s) => s.trim().toLowerCase());
    const q = params.find((p) => p.startsWith("q="));
    const weight = q ? Number.parseFloat(q.slice(2)) : 1;
    if (range) weights.set(range, Number.isNaN(weight) ? 0 : weight);
  }
  const markdown = weights.get("text/markdown") ?? 0;
  const html = weights.get("text/html") ?? weights.get("text/*") ?? weights.get("*/*") ?? 0;
  return markdown > 0 && markdown >= html;
}
