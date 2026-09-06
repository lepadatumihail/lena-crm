import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

// Only the marketing site is for crawlers. Everything behind sign-in, plus
// the plans page and API routes, stays out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/home",
          "/clients",
          "/calendar",
          "/calculator",
          "/templates",
          "/pricing",
          "/referrals",
          "/admin",
          "/join/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
