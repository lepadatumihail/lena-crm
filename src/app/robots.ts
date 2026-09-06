import type { MetadataRoute } from "next";

import { PROTECTED_PREFIXES } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";

// Only the marketing site is for crawlers. Everything behind sign-in (the same
// prefixes the proxy guards), API routes and invite landings stay out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", ...PROTECTED_PREFIXES, "/join/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
