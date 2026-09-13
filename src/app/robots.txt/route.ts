import { PROTECTED_PREFIXES } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";

// robots.txt, written out by hand: the object robots.ts returns has no room
// for a Content-Signal line. Prerendered at build time, like llms.txt.
export const dynamic = "force-static";

/**
 * How crawled content may be used (https://contentsignals.org). Search and
 * AI answers are what the public site is for, so both are allowed. Training
 * stays reserved: a "no" can be relaxed later, while a "yes" can't be taken
 * back from a model already trained on the site.
 */
const CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=yes";

export function GET() {
  // Only the marketing site is for crawlers. Everything behind sign-in (the
  // same prefixes the proxy guards), API routes and invite landings stay out.
  const disallow = ["/api/", ...PROTECTED_PREFIXES, "/join/"];
  const body = [
    "# Content signals (https://contentsignals.org) say how content may be used",
    "# once crawled: search = a search index with links and excerpts, ai-input =",
    "# real-time use in AI answers (retrieval, grounding), ai-train = training or",
    "# fine-tuning AI models. A \"no\" is an express reservation of rights under",
    "# Article 4 of EU Directive 2019/790.",
    "",
    "User-Agent: *",
    "Allow: /",
    ...disallow.map((path) => `Disallow: ${path}`),
    `Content-Signal: ${CONTENT_SIGNAL}`,
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
