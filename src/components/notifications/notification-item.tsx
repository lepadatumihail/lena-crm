"use client";

import type { ComponentType } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import {
  CalendarClock,
  CalendarDays,
  Clock,
  Coins,
  ListChecks,
  UserPlus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { dateFnsLocale } from "@/i18n/dates";
import type { Enums, Notification } from "@/lib/supabase/types";
import { TONE_BG, TONE_INK, type Tone } from "@/lib/tones";

type NotificationType = Enums<"notification_type">;

const ICONS: Record<NotificationType, ComponentType<{ className?: string }>> = {
  appointment_reminder: Clock,
  appointment_today: CalendarDays,
  follow_up: UserPlus,
  reservation_date: CalendarClock,
  stalled_offer: Coins,
  task_due: ListChecks,
};

/* The icon tells the types apart; the discs stay neutral, like an inbox. */
const TONES: Record<NotificationType, Tone> = {
  appointment_reminder: "neutral",
  appointment_today: "neutral",
  follow_up: "neutral",
  reservation_date: "neutral",
  stalled_offer: "neutral",
  task_due: "neutral",
};

/**
 * One row of the feed, shared by the bell popover and the notifications page.
 * `compact` is the popover's cut: tighter padding, and a title clipped to one
 * line because there are only ~320px to give it.
 */
export function NotificationItem({
  notification: n,
  onSelect,
  compact = false,
  className,
}: {
  notification: Notification;
  onSelect: (n: Notification) => void;
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("notifications.types");
  const locale = useLocale();
  const Icon = ICONS[n.type];
  const tone = TONES[n.type];
  const isUnread = !n.read_at;

  return (
    <button
      type="button"
      onClick={() => onSelect(n)}
      className={cn(
        "hover:bg-muted/50 focus-visible:bg-muted/50 flex w-full items-start gap-3 text-left outline-none transition-colors duration-150",
        compact ? "px-3 py-2.5" : "px-4 py-3",
        isUnread && "bg-primary/[0.04]",
        className
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
          TONE_BG[tone],
          TONE_INK[tone]
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            compact && "truncate",
            isUnread ? "font-semibold" : "font-medium"
          )}
        >
          {n.title}
        </p>
        {n.body && (
          <p className="text-muted-foreground mt-0.5 text-xs whitespace-pre-line">
            {n.body}
          </p>
        )}
        <p className="text-muted-foreground/80 mt-1 text-[11px]">
          {t(n.type)} ·{" "}
          {formatDistanceToNow(new Date(n.due_at), {
            addSuffix: true,
            locale: dateFnsLocale(locale),
          })}
        </p>
      </div>
      {isUnread && (
        <span aria-hidden className="bg-primary mt-2 size-2 shrink-0 rounded-full" />
      )}
    </button>
  );
}
