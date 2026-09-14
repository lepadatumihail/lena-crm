"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { endOfDay, format, startOfDay } from "date-fns";
import { ArrowRight, Bell, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationItem } from "@/components/notifications/notification-item";
import {
  announceNotificationsChanged,
  NOTIFICATIONS_CHANGED,
  notificationHref,
} from "@/lib/notifications";
import {
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type SyncContext,
} from "@/lib/actions/notifications";
import type { Notification } from "@/lib/supabase/types";

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
  const t = useTranslations("notifications.bell");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
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
    // The notifications page can mark things read behind the popover's back.
    const onChanged = () => void refresh();
    window.addEventListener(NOTIFICATIONS_CHANGED, onChanged);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
      window.removeEventListener(NOTIFICATIONS_CHANGED, onChanged);
    };
  }, [refresh]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) refresh();
  }

  function handleSelect(n: Notification) {
    if (!n.read_at) {
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((i) => (i.id === n.id ? { ...i, read_at: now } : i))
      );
      setUnread((u) => Math.max(0, u - 1));
      void markNotificationRead(n.id).then(announceNotificationsChanged);
    }
    setOpen(false);
    router.push(notificationHref(n));
  }

  function handleMarkAll() {
    if (unread === 0) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((i) => ({ ...i, read_at: i.read_at ?? now })));
    setUnread(0);
    void markAllNotificationsRead().then(announceNotificationsChanged);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground relative"
          aria-label={
            unread > 0 ? t("ariaUnread", { count: unread }) : t("aria")
          }
        >
          <Bell />
          {unread > 0 && (
            <span className="bg-primary text-primary-foreground ring-background absolute -top-0.5 -right-0.5 flex size-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ring-2">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-semibold">{t("title")}</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
            >
              <CheckCheck className="size-3.5" /> {t("markAllRead")}
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-muted-foreground px-3 py-8 text-center text-sm">
              {t("empty")}
            </p>
          ) : (
            items.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onSelect={handleSelect}
                compact
                className="border-b last:border-b-0"
              />
            ))
          )}
        </div>
        <div className="border-t">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors"
          >
            {t("viewAll")} <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
