"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { format, isToday, isYesterday } from "date-fns";
import { CheckCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NotificationItem } from "@/components/notifications/notification-item";
import { cn } from "@/lib/utils";
import { dateFnsLocale } from "@/i18n/dates";
import {
  announceNotificationsChanged,
  NOTIFICATIONS_CHANGED,
  notificationHref,
} from "@/lib/notifications";
import {
  loadNotificationHistory,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import type { NotificationHistory } from "@/lib/data/notifications";
import type { Notification } from "@/lib/supabase/types";

const FILTERS = ["all", "unread"] as const;
type Filter = (typeof FILTERS)[number];

type DayGroup = { key: string; date: Date; items: Notification[] };

/** The list arrives newest-first, so consecutive rows share a day heading. */
function groupByDay(items: Notification[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const n of items) {
    const date = new Date(n.due_at);
    const key = format(date, "yyyy-MM-dd");
    const last = groups.at(-1);
    if (last?.key === key) last.items.push(n);
    else groups.push({ key, date, items: [n] });
  }
  return groups;
}

export function NotificationsView({ initial }: { initial: NotificationHistory }) {
  const t = useTranslations("notifications.page");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState(initial.items);
  const [unread, setUnread] = useState(initial.unread);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async (next: Filter) => {
    setBusy(true);
    try {
      const page = await loadNotificationHistory(0, next === "unread");
      setItems(page.items);
      setUnread(page.unread);
      setHasMore(page.hasMore);
    } catch {
      // keep whatever we already have
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    // The bell can mark things read while this page is open. Reloading the
    // first page is enough: the only cross-surface change is read state.
    const onChanged = () => void reload(filter);
    window.addEventListener(NOTIFICATIONS_CHANGED, onChanged);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, onChanged);
  }, [filter, reload]);

  function handleFilter(next: Filter) {
    if (next === filter) return;
    setFilter(next);
    void reload(next);
  }

  async function handleLoadMore() {
    setBusy(true);
    try {
      const page = await loadNotificationHistory(items.length, filter === "unread");
      setItems((prev) => [...prev, ...page.items]);
      setUnread(page.unread);
      setHasMore(page.hasMore);
    } catch {
      // leave the existing page in place; the button stays available
    } finally {
      setBusy(false);
    }
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
    router.push(notificationHref(n));
  }

  function handleMarkAll() {
    if (unread === 0) return;
    const now = new Date().toISOString();
    setItems((prev) =>
      filter === "unread"
        ? []
        : prev.map((i) => ({ ...i, read_at: i.read_at ?? now }))
    );
    setUnread(0);
    void markAllNotificationsRead().then(announceNotificationsChanged);
  }

  function dayLabel(date: Date) {
    if (isToday(date)) return tCommon("today");
    if (isYesterday(date)) return t("yesterday");
    return format(date, "EEEE d MMMM", { locale: dateFnsLocale(locale) });
  }

  const groups = groupByDay(items);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground max-w-2xl text-sm">{t("subtitle")}</p>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAll}>
            <CheckCheck /> {t("markAllRead")}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <nav
          aria-label={t("filters.label")}
          className="bg-muted flex items-center rounded-md p-0.5 text-xs font-medium"
        >
          {FILTERS.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => handleFilter(kind)}
              aria-current={kind === filter ? "true" : undefined}
              className={cn(
                "rounded-sm px-2.5 py-1 transition-colors",
                kind === filter
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {kind === "unread"
                ? t("filters.unread", { count: unread })
                : t("filters.all")}
            </button>
          ))}
        </nav>
        {busy && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
      </div>

      {groups.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed py-16 text-center text-sm">
          {filter === "unread" ? t("emptyUnread") : t("empty")}
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="text-muted-foreground px-1 text-xs font-semibold tracking-wide uppercase first-letter:uppercase">
                {dayLabel(group.date)}
              </h2>
              <div className="bg-card mt-2 divide-y overflow-hidden rounded-xl border">
                {group.items.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : null}
            {t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
