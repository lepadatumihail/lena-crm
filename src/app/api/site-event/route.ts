import { NextResponse } from "next/server";

import { recordSiteEvent } from "@/lib/site-events-server";

/**
 * Anonymous funnel steps from the ad landings and the free tools
 * (src/lib/site-events.ts), sent with sendBeacon. Nothing here identifies a visitor: no cookie is read and no
 * IP or user agent is stored, only the step, the page and its utm tags.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 2000) return new NextResponse(null, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return new NextResponse(null, { status: 400 });
  }
  const ok = await recordSiteEvent(body as Record<string, unknown>);
  return new NextResponse(null, { status: ok ? 204 : 400 });
}
