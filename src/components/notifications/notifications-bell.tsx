"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { useRouter } from "next/navigation";
import {
  endOfDay,
  format,
  formatDistanceToNow,
  startOfDay,
} from "date-fns";
import {
  Bell,
  CalendarClock,
  CalendarDays,
  CheckCheck,
  Clock,
  Coins,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type SyncContext,
} from "@/lib/actions/notifications";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/calendar";
import type { Enums, Notification } from "@/lib/supabase/types";

type NotificationType = Enums<"notification_type">;

const ICONS: Record<NotificationType, ComponentType<{ className?: string }>> = {
  appointment_reminder: Clock,
  appointment_today: CalendarDays,
  follow_up: UserPlus,
  reservation_date: CalendarClock,
  stalled_offer: Coins,
};

function buildContext(): SyncContext {
  const now = new Date();
  return {
    nowISO: now.toISOString(),
    dayStartISO: startOfDay(now).toISOString(),
    dayEndISO: endOfDay(now).toISOString(),
    todayKey: format(now, "yyyy-MM-dd"),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    // A poll and a popover-open can fire together; one sync at a time is enough
    // (the upsert is idempotent — this just avoids wasted round-trips).
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const feed = await loadNotifications(buildContext());
      setItems(feed.items);
      setUnread(feed.unread);
      setHasMore(feed.hasMore);
    } catch {
      // keep whatever we already have
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    // Defer the initial load into a callback so we don't setState
    // synchronously inside the effect body; then poll every 5 minutes.
    const initial = setTimeout(refresh, 0);
    const id = setInterval(refresh, 5 * 60 * 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [refresh]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) refresh();
  }

  function handleClick(n: Notification) {
    if (!n.read_at) {
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((i) => (i.id === n.id ? { ...i, read_at: now } : i))
      );
      setUnread((u) => Math.max(0, u - 1));
      void markNotificationRead(n.id);
    }
    setOpen(false);
    const compose =
      n.type === "follow_up"
        ? "?compose=check_in"
        : n.type === "stalled_offer"
          ? "?compose=offer_followup"
          : "";
    const href = n.type.startsWith("appointment")
      ? "/calendar"
      : n.client_id
        ? `/clients/${n.client_id}${compose}`
        : "/calendar";
    router.push(href);
  }

  function handleMarkAll() {
    if (unread === 0) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((i) => ({ ...i, read_at: i.read_at ?? now })));
    setUnread(0);
    void markAllNotificationsRead();
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        >
          <Bell />
          {unread > 0 && (
            <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex size-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-muted-foreground px-3 py-8 text-center text-sm">
              You&apos;re all caught up.
            </p>
          ) : (
            items.map((n) => {
              const Icon = ICONS[n.type];
              const isUnread = !n.read_at;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={cn(
                    "hover:bg-accent flex w-full items-start gap-3 border-b px-3 py-2.5 text-left transition-colors last:border-b-0",
                    isUnread && "bg-primary/5"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                      isUnread
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm",
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
                      {NOTIFICATION_TYPE_LABELS[n.type]} ·{" "}
                      {formatDistanceToNow(new Date(n.due_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {isUnread && (
                    <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
                  )}
                </button>
              );
            })
          )}
        </div>
        {hasMore && (
          <p className="text-muted-foreground border-t px-3 py-2 text-center text-xs">
            Showing your most recent notifications
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
