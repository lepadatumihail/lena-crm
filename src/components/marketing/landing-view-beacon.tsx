"use client";

import { useEffect } from "react";

import { trackSiteEvent } from "@/lib/site-events";

let sent = false;

/** Counts one landing_view per page load (not per re-render or strict-mode double effect). */
export function LandingViewBeacon() {
  useEffect(() => {
    if (sent) return;
    sent = true;
    trackSiteEvent("landing_view");
  }, []);
  return null;
}
