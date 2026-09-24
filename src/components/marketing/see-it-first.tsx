"use client";

import { MessageCircle } from "lucide-react";

import { trackSiteEvent } from "@/lib/site-events";
import { cn } from "@/lib/utils";

/**
 * The second door on the ad landings: someone not ready to create an account
 * can message the founder on WhatsApp instead, with the opening line already
 * typed. The tap is counted as a funnel step.
 */
export function SeeItFirst({
  href,
  question,
  action,
  className,
}: {
  href: string;
  question: string;
  action: string;
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-pretty", className)}>
      {question}{" "}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackSiteEvent("whatsapp_click")}
        className="inline-flex items-center gap-1 font-medium whitespace-nowrap underline decoration-current/30 underline-offset-4 transition-colors hover:decoration-current"
      >
        <MessageCircle className="size-4" aria-hidden />
        {action}
      </a>
    </p>
  );
}
