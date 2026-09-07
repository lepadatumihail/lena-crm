import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    // Serves src/app/global-not-found.tsx for URLs that match no route, at the
    // routing level. Next skips rendering the layout tree, so the 404 body is
    // small and — because nothing streams — the status is always a real 404.
    globalNotFound: true,
  },
};

export default withNextIntl(nextConfig);
