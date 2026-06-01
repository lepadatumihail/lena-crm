import { createClient as createSupabase } from "@/lib/supabase/server";
import type { Notification } from "@/lib/supabase/types";

export type NotificationFeed = {
  items: Notification[];
  unread: number;
  hasMore: boolean;
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
  const items = listRes.data ?? [];
  return {
    items,
    unread: countRes.count ?? 0,
    hasMore: items.length >= limit,
  };
}
