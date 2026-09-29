"use client";

import { useEffect } from "react";

import { trackSiteEvent } from "@/lib/site-events";

const sent = new Set<string>();

/**
 * Counts one tool_view per tool page and page load (not per re-render or
 * strict-mode double effect). Keyed by path: the hub and the related cards
 * move between tools without a new load, and each tool still counts its view.
 */
export function ToolViewBeacon() {
  useEffect(() => {
    const path = window.location.pathname;
    if (sent.has(path)) return;
    sent.add(path);
    trackSiteEvent("tool_view");
  }, []);
  return null;
}
