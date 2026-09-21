"use client";

import { openConsentNotice } from "@/lib/consent";

/** The footer's "Cookies" entry: shows the cookie notice again so a visitor can change their answer. */
export function CookieChoiceButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <button type="button" onClick={openConsentNotice} className={className}>
      {label}
    </button>
  );
}
