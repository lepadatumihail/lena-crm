"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { format, parseISO, subDays } from "date-fns";
import { CheckCheck, Loader2 } from "lucide-react";

import { NotificationItem } from "@/components/notifications/notification-item";
import { Panel, PanelEmpty } from "@/components/shell/panel";
import { useAgentTimeZone } from "@/components/shell/shell-context";
import { ToolbarTabs } from "@/components/shell/toolbar";
import { Button } from "@/components/ui/button";
import { dateFnsLocale } from "@/i18n/dates";
import { dateKeyInTimeZone } from "@/lib/home";
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

type Filter = "all" | "unread";

type DayGroup = { key: string; items: Notification[] };

/** The list arrives newest-first, so consecutive rows share a day: the agent's day. */
function groupByDay(items: Notification[], timeZone: string): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const n of items) {
    const key = dateKeyInTimeZone(n.due_at, timeZone);
    const last = groups.at(-1);
    if (last?.key === key) last.items.push(n);
    else groups.push({ key, items: [n] });
  }
  return groups;
}

/**
 * Every reminder and nudge, newest first: filter tabs over one panel per
 * day, the same rows as the bell.
 */
export function NotificationsView({ initial }: { initial: NotificationHistory }) {
  const t = useTranslations("notifications.page");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const timeZone = useAgentTimeZone();
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState(initial.items);
  const [unread, setUnread] = useState(initial.unread);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [busy, setBusy] = useState(false);
  const [openedAt] = useState(() => new Date());

  const todayKey = dateKeyInTimeZone(openedAt.toISOString(), timeZone);
  const yesterdayKey = format(subDays(parseISO(todayKey), 1), "yyyy-MM-dd");

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

  function dayLabel(key: string) {
    if (key === todayKey) return tCommon("today");
    if (key === yesterdayKey) return t("yesterday");
    return format(parseISO(key), "EEEE d MMMM", { locale: dateFnsLocale(locale) });
  }

  const groups = groupByDay(items, timeZone);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <ToolbarTabs
        label={t("filters.label")}
        value={filter}
        onChange={(next) => handleFilter(next === "unread" ? "unread" : "all")}
        tabs={[
          { value: "all", label: t("filters.all") },
          { value: "unread", label: t("filters.unread"), count: unread },
        ]}
      >
        {busy ? <Loader2 className="text-muted-foreground size-4 animate-spin" /> : null}
        {unread > 0 ? (
          <Button variant="outline" size="xs" className="rounded-lg" onClick={handleMarkAll}>
            <CheckCheck /> {t("markAllRead")}
          </Button>
        ) : null}
      </ToolbarTabs>

      {groups.length === 0 ? (
        <Panel>
          <PanelEmpty className="py-16">
            {filter === "unread" ? t("emptyUnread") : t("empty")}
          </PanelEmpty>
        </Panel>
      ) : (
        groups.map((group) => (
          <Panel key={group.key} title={dayLabel(group.key)} count={group.items.length}>
            <div className="divide-y">
              {group.items.map((n) => (
                <NotificationItem key={n.id} notification={n} onSelect={handleSelect} />
              ))}
            </div>
          </Panel>
        ))
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={handleLoadMore}
            disabled={busy}
          >
            {busy ? <Loader2 className="animate-spin" /> : null}
            {t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
