"use client";

import { useEffect } from "react";

import { trackSiteEvent } from "@/lib/site-events";

let sent = false;

/** Counts one tool_view per page load (not per re-render or strict-mode double effect). */
export function ToolViewBeacon() {
  useEffect(() => {
    if (sent) return;
    sent = true;
    trackSiteEvent("tool_view");
  }, []);
  return null;
}
