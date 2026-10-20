/**
 * IndexNow (https://www.indexnow.org): one POST tells Bing, and the other
 * engines that share the protocol (Yandex, Seznam, Naver, Yep), which pages
 * changed, so they recrawl them within hours instead of at their next visit.
 * ChatGPT's web search leans on Bing's index, which is the reason to bother.
 *
 * The key is public on purpose: public/<key>.txt holds it, and an engine
 * fetches that file to check a ping really comes from the site's owner.
 * scripts/indexnow.ts sends the ping; .github/workflows/indexnow.yml runs it
 * after every production deploy.
 *
 * No imports and no `@/` paths: the script runs this file under plain
 * `node --experimental-strip-types`, outside Next.
 */

export const INDEXNOW_KEY = "65d16ac28e2eb50d3eb38dd8460d3f76";

/** The canonical origin, the one the sitemap lists (never a *.vercel.app alias). */
export const INDEXNOW_ORIGIN = "https://www.leadwing.app";

/** The shared endpoint: it forwards each ping to every participating engine. */
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * After a deploy, pages whose sitemap date is this recent count as changed.
 * Written pages date from their PUBLISHED or CHECKED day and the home and
 * pricing pages from the deploy, so a new or re-checked guide is sent on every
 * deploy for three days, and an untouched one never.
 */
export const RECENT_DAYS = 3;

export type SitemapEntry = { url: string; lastModified: Date | null };

const XML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

/** Each `<url>` of a sitemap: its `<loc>`, and its `<lastmod>` when it has one. */
export function parseSitemap(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  for (const [, block] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = /<loc>\s*([^<]+?)\s*<\/loc>/.exec(block)?.[1];
    if (!loc) continue;
    const lastmod = /<lastmod>\s*([^<]+?)\s*<\/lastmod>/.exec(block)?.[1];
    const date = lastmod ? new Date(lastmod) : null;
    entries.push({
      url: loc.replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => XML_ENTITIES[entity] ?? entity),
      lastModified: date && !Number.isNaN(date.getTime()) ? date : null,
    });
  }
  return entries;
}

/**
 * The URLs to send: every page on the canonical host, or (with `since`) only
 * those changed since then. A page without a usable date counts as changed:
 * sending one page too many costs nothing, missing a new one costs a crawl.
 */
export function urlsToSubmit(entries: SitemapEntry[], since?: Date): string[] {
  const { host } = new URL(INDEXNOW_ORIGIN);
  return entries
    .filter((entry) => new URL(entry.url).host === host)
    .filter((entry) => !since || !entry.lastModified || entry.lastModified >= since)
    .map((entry) => entry.url);
}

/** The JSON body IndexNow expects for a batch (up to 10,000 URLs). */
export function indexNowBody(urls: string[]) {
  return {
    host: new URL(INDEXNOW_ORIGIN).host,
    key: INDEXNOW_KEY,
    keyLocation: `${INDEXNOW_ORIGIN}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };
}
