import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  INDEXNOW_KEY,
  INDEXNOW_ORIGIN,
  indexNowBody,
  parseSitemap,
  urlsToSubmit,
} from "@/lib/indexnow";

// The shape Next writes for app/sitemap.ts: hreflang alternates inside each <url>.
const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
<url>
<loc>https://www.leadwing.app</loc>
<xhtml:link rel="alternate" hreflang="es" href="https://www.leadwing.app/es" />
<lastmod>2026-10-20T19:12:40.000Z</lastmod>
<changefreq>weekly</changefreq>
</url>
<url>
<loc>https://www.leadwing.app/guides/free-real-estate-crm-spain</loc>
<lastmod>2026-10-20</lastmod>
</url>
<url>
<loc>https://www.leadwing.app/privacy?a=1&amp;b=2</loc>
<lastmod>2026-09-07</lastmod>
</url>
<url>
<loc>https://www.leadwing.app/undated</loc>
</url>
</urlset>`;

describe("the IndexNow key", () => {
  it("is a key IndexNow accepts", () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-zA-Z0-9-]{8,128}$/);
  });

  it("is served as public/<key>.txt holding exactly the key", () => {
    const file = readFileSync(join(process.cwd(), "public", `${INDEXNOW_KEY}.txt`), "utf8");
    expect(file).toBe(INDEXNOW_KEY);
  });
});

describe("parseSitemap", () => {
  const entries = parseSitemap(SITEMAP);

  it("reads every <url>, ignoring the hreflang alternates", () => {
    expect(entries.map((entry) => entry.url)).toEqual([
      "https://www.leadwing.app",
      "https://www.leadwing.app/guides/free-real-estate-crm-spain",
      "https://www.leadwing.app/privacy?a=1&b=2",
      "https://www.leadwing.app/undated",
    ]);
  });

  it("reads full timestamps and bare dates", () => {
    expect(entries[0].lastModified?.toISOString()).toBe("2026-10-20T19:12:40.000Z");
    expect(entries[1].lastModified?.toISOString()).toBe("2026-10-20T00:00:00.000Z");
    expect(entries[3].lastModified).toBeNull();
  });
});

describe("urlsToSubmit", () => {
  const entries = parseSitemap(SITEMAP);

  it("sends every page when asked for all of them", () => {
    expect(urlsToSubmit(entries)).toHaveLength(4);
  });

  it("sends only pages dated since the cut-off, and the undated ones", () => {
    expect(urlsToSubmit(entries, new Date("2026-10-17T19:00:00Z"))).toEqual([
      "https://www.leadwing.app",
      "https://www.leadwing.app/guides/free-real-estate-crm-spain",
      "https://www.leadwing.app/undated",
    ]);
  });

  it("never sends another host, which IndexNow would reject", () => {
    const foreign = [{ url: "https://lena-crm.vercel.app/pricing", lastModified: null }];
    expect(urlsToSubmit(foreign)).toEqual([]);
  });
});

describe("indexNowBody", () => {
  it("names the host and where the key file lives", () => {
    expect(indexNowBody(["https://www.leadwing.app/es"])).toEqual({
      host: "www.leadwing.app",
      key: INDEXNOW_KEY,
      keyLocation: `${INDEXNOW_ORIGIN}/${INDEXNOW_KEY}.txt`,
      urlList: ["https://www.leadwing.app/es"],
    });
  });
});
