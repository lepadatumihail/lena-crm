"use client";

import type { ComponentType } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import {
  CalendarClock,
  CalendarDays,
  Clock,
  Coins,
  UserPlus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { dateFnsLocale } from "@/i18n/dates";
import type { Enums, Notification } from "@/lib/supabase/types";

type NotificationType = Enums<"notification_type">;

const ICONS: Record<NotificationType, ComponentType<{ className?: string }>> = {
  appointment_reminder: Clock,
  appointment_today: CalendarDays,
  follow_up: UserPlus,
  reservation_date: CalendarClock,
  stalled_offer: Coins,
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
  const isUnread = !n.read_at;

  return (
    <button
      type="button"
      onClick={() => onSelect(n)}
      className={cn(
        "hover:bg-accent flex w-full items-start gap-3 text-left transition-colors",
        compact ? "px-3 py-2.5" : "px-3 py-3 sm:px-4",
        isUnread && "bg-primary/5",
        className
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
          isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
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
        <p className="text-muted-foreground/70 mt-1 text-[11px]">
          {t(n.type)} ·{" "}
          {formatDistanceToNow(new Date(n.due_at), {
            addSuffix: true,
            locale: dateFnsLocale(locale),
          })}
        </p>
      </div>
      {isUnread && (
        <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
      )}
    </button>
  );
}
