/**
 * Ping IndexNow with the pages that changed, read from the live sitemap so it
 * sends exactly what is deployed (see src/lib/indexnow.ts for the why).
 *
 *   npm run indexnow                  # pages dated in the last RECENT_DAYS days
 *   npm run indexnow -- --all         # every page in the sitemap
 *   npm run indexnow -- --dry-run     # list the URLs, send nothing
 *
 * .github/workflows/indexnow.yml runs it after each production deploy, and on
 * demand (with "all" for a full resubmission).
 */
import {
  INDEXNOW_ENDPOINT,
  INDEXNOW_ORIGIN,
  RECENT_DAYS,
  indexNowBody,
  parseSitemap,
  urlsToSubmit,
} from "../src/lib/indexnow.ts";

const args = new Set(process.argv.slice(2));
const all = args.has("--all");
const dryRun = args.has("--dry-run");

const sitemap = await fetch(`${INDEXNOW_ORIGIN}/sitemap.xml`);
if (!sitemap.ok) throw new Error(`sitemap.xml answered HTTP ${sitemap.status}`);
const entries = parseSitemap(await sitemap.text());
if (entries.length === 0) throw new Error("sitemap.xml lists no pages");

const since = all ? undefined : new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);
const urls = urlsToSubmit(entries, since);
const scope = all ? "every page" : `pages dated since ${since?.toISOString().slice(0, 10)}`;
console.log(`${urls.length} of ${entries.length} sitemap URLs (${scope}):`);
for (const url of urls) console.log(`  ${url}`);

if (urls.length > 0 && !dryRun) {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(indexNowBody(urls)),
  });
  // 200: received. 202: received, the key file is still being checked.
  // 403 means the key file didn't match, 422 a URL outside the host.
  console.log(`IndexNow answered HTTP ${response.status}`);
  if (response.status !== 200 && response.status !== 202) {
    console.error(await response.text());
    process.exitCode = 1;
  }
}
