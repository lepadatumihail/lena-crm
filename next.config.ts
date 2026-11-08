import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Agent photos on public agent pages come from Supabase Storage's public
// bucket; next/image may resize those and nothing else from that host.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");

const nextConfig: NextConfig = {
  images: supabaseUrl
    ? { remotePatterns: [new URL(`${supabaseUrl}/storage/v1/object/public/agent-photos/**`)] }
    : undefined,
  experimental: {
    // Serves src/app/global-not-found.tsx for URLs that match no route, at the
    // routing level. Next skips rendering the layout tree, so the 404 body is
    // small and — because nothing streams — the status is always a real 404.
    globalNotFound: true,
  },
};

export default withNextIntl(nextConfig);
