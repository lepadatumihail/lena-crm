import { createClient as createSupabase } from "@/lib/supabase/server";
import type { Notification } from "@/lib/supabase/types";

export type NotificationFeed = {
  items: Notification[];
  unread: number;
};

export async function getNotificationFeed(
  limit = 30
): Promise<NotificationFeed> {
  const supabase = await createSupabase();
  const [listRes, countRes] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .order("read_at", { ascending: true, nullsFirst: true })
      .order("due_at", { ascending: false })
      .limit(limit),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .is("read_at", null),
  ]);
  if (listRes.error) throw new Error(listRes.error.message);
  return {
    items: listRes.data ?? [],
    unread: countRes.count ?? 0,
  };
}

/** How many rows the notifications page shows per "Load more". */
export const NOTIFICATION_PAGE_SIZE = 40;

export type NotificationHistory = {
  items: Notification[];
  unread: number;
  hasMore: boolean;
};

/**
 * The full feed for the notifications page: strictly newest-first (the bell
 * floats unread to the top, which would make a paged list jump around), one
 * page at a time.
 */
export async function getNotificationHistory({
  offset = 0,
  unreadOnly = false,
}: { offset?: number; unreadOnly?: boolean } = {}): Promise<NotificationHistory> {
  const supabase = await createSupabase();
  const from = Math.max(0, Math.trunc(offset));
  let query = supabase
    .from("notifications")
    .select("*")
    .order("due_at", { ascending: false })
    .order("id", { ascending: false })
    // one row past the page, purely to know whether a "Load more" is warranted
    .range(from, from + NOTIFICATION_PAGE_SIZE);
  if (unreadOnly) query = query.is("read_at", null);

  const [listRes, countRes] = await Promise.all([
    query,
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .is("read_at", null),
  ]);
  if (listRes.error) throw new Error(listRes.error.message);

  const rows = listRes.data ?? [];
  const hasMore = rows.length > NOTIFICATION_PAGE_SIZE;
  return {
    items: hasMore ? rows.slice(0, NOTIFICATION_PAGE_SIZE) : rows,
    unread: countRes.count ?? 0,
    hasMore,
  };
}
