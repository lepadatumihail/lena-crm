"use client";

import { useSyncExternalStore } from "react";

import { openConsentNotice } from "@/lib/consent";
import { metaPixelIdHere, noPixelOnServer, subscribeToNothing } from "@/lib/meta-pixel";

/**
 * The footer's "Cookies" entry: shows the cookie notice again so a visitor
 * can change their answer. It appears only where a pixel exists (after
 * hydration, since that depends on the host), so there is never a link to a
 * notice that cannot open.
 */
export function CookieChoiceButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const pixelId = useSyncExternalStore(subscribeToNothing, metaPixelIdHere, noPixelOnServer);
  if (!pixelId) return null;
  return (
    <button type="button" onClick={openConsentNotice} className={className}>
      {label}
    </button>
  );
}
