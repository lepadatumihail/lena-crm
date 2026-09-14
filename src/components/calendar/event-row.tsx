"use client";

import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { MessageCircle } from "lucide-react";

import { intlTag } from "@/i18n/config";
import { appointmentTypeLabel } from "@/i18n/labels";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/crm";
import { eventReminderHref } from "@/lib/event-reminder";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/data/calendar";
import { TONE_SOLID } from "@/lib/tones";
import { EVENT_TONES } from "@/lib/calendar";

function eventDescription(e: CalendarEvent): string | null {
  if (e.kind === "viewing") return e.viewing.description?.trim() || null;
  return e.appointment.notes?.trim() || null;
}

/**
 * One event in a list: the time down the left, what it is, and a one-tap
 * WhatsApp reminder. Shared by the week agenda and the month view's day list.
 */
export function EventRow({
  event: e,
  past = false,
  onOpen,
}: {
  event: CalendarEvent;
  /** Already happened: drawn quieter so what's next stands out. */
  past?: boolean;
  onOpen: () => void;
}) {
  const t = useTranslations("calendar");
  const tCrm = useTranslations("crm");
  const tag = intlTag(useLocale());

  const remind = eventReminderHref(e);
  const desc = eventDescription(e);
  const start = new Date(e.starts_at);
  // `e.title` is derived and translated server-side, so it already follows
  // the agent's language; only the type label is resolved here.
  const meta = [
    appointmentTypeLabel(tCrm, e.kind === "viewing" ? "viewing" : "meeting"),
    e.kind === "viewing" ? e.buyerName : null,
    e.location,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "hover:bg-accent flex items-center gap-2 rounded-lg border p-3 transition-colors",
        past && "opacity-60"
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <span className="w-11 shrink-0 pt-0.5 text-sm leading-tight tabular-nums">
          <span className="block font-medium">{format(start, "HH:mm")}</span>
          {e.ends_at && (
            <span className="text-muted-foreground block text-xs">
              {format(new Date(e.ends_at), "HH:mm")}
            </span>
          )}
        </span>
        <span
          className={cn(
            "mt-1.5 size-2 shrink-0 rounded-full",
            TONE_SOLID[EVENT_TONES[e.kind]]
          )}
        />
        <span className="min-w-0">
          <span className="block font-medium">{e.title}</span>
          <span className="text-muted-foreground block text-sm">{meta}</span>
          {desc && (
            <span className="text-muted-foreground mt-1 line-clamp-2 block text-sm whitespace-pre-wrap">
              {desc}
            </span>
          )}
          {e.kind === "viewing" &&
            (e.viewing.property_price != null || e.viewing.had_offer) && (
              <span className="text-muted-foreground mt-1 block text-xs">
                {e.viewing.property_price != null &&
                  t("day.asking", {
                    price: formatCurrency(e.viewing.property_price, tag),
                  })}
                {e.viewing.had_offer &&
                  `${e.viewing.property_price != null ? " · " : ""}${t(
                    "day.offer",
                    { price: formatCurrency(e.viewing.offer_price, tag) }
                  )}`}
              </span>
            )}
        </span>
      </button>
      {remind && (
        <a
          href={remind}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "shrink-0"
          )}
          title={t("day.remind")}
          aria-label={t("day.remindAria")}
        >
          <MessageCircle className="size-4 text-[#25D366]" />
        </a>
      )}
    </div>
  );
}
