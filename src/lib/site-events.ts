import { isInAppBrowser } from "@/lib/in-app-browser";
import { readReferrer, readUtm } from "@/lib/signup-source";

/**
 * The funnels on the ad landings and the free tools, one step at a time. On
 * an ad landing: the page was seen, the sign-up dialog opened, Google or an
 * email code was tried, the visitor got in, or chose WhatsApp instead. On a
 * free tool: the page was seen, the tool produced a result, and a result was
 * copied to share (a tool page's sign-up dialog logs the same sign-up steps).
 * Each step is stored anonymously in site_events (no cookie, no identifier,
 * no IP) with the page, its utm tags and the hostname of the site that
 * linked to it, so the drop between two steps, and where the visitors came
 * from, shows without Vercel's dashboard and without a consent prompt.
 */
export const SITE_EVENTS = [
  "landing_view",
  "signup_open",
  "google_start",
  "code_sent",
  "signed_in",
  "whatsapp_click",
  "tool_view",
  "tool_use",
  "tool_share",
  // Public agent pages (/agent/<slug>): seen, form started, enquiry sent.
  "agent_page_view",
  "agent_enquiry_start",
  "agent_enquiry_sent",
] as const;

export type SiteEvent = (typeof SITE_EVENTS)[number];

export const SITE_EVENT_ENDPOINT = "/api/site-event";

export function isSiteEvent(value: unknown): value is SiteEvent {
  return (SITE_EVENTS as readonly unknown[]).includes(value);
}

/** Fire and forget from the browser; survives the page navigating away. */
export function trackSiteEvent(event: SiteEvent): void {
  if (typeof window === "undefined") return;
  const ua = navigator.userAgent;
  const body = JSON.stringify({
    event,
    path: window.location.pathname,
    ...readUtm(window.location.search),
    referrer: readReferrer(document.referrer, window.location.hostname),
    in_app: isInAppBrowser(ua),
    mobile: /Mobi|Android/i.test(ua),
  });
  try {
    if (navigator.sendBeacon?.(SITE_EVENT_ENDPOINT, new Blob([body], { type: "application/json" }))) return;
  } catch {
    // Fall through to fetch.
  }
  void fetch(SITE_EVENT_ENDPOINT, {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
    keepalive: true,
  }).catch(() => null);
}
