"use client";

import { useEffect, type ComponentProps } from "react";

import { trackSiteEvent } from "@/lib/site-events";

/** Counts one anonymous page view (site_events), like the ad landings do. */
export function AgentPageBeacon() {
  useEffect(() => {
    trackSiteEvent("agent_page_view");
  }, []);
  return null;
}

/** A WhatsApp link that records the tap before the app opens. */
export function WhatsAppLink(props: ComponentProps<"a">) {
  return (
    <a
      {...props}
      onClick={(event) => {
        trackSiteEvent("whatsapp_click");
        props.onClick?.(event);
      }}
    />
  );
}
