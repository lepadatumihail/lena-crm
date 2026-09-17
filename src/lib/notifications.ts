import type { Notification } from "@/lib/supabase/types";

type Routable = Pick<Notification, "type" | "client_id" | "task_id">;

/**
 * Where a notification takes you when tapped. Task rows open the task on the
 * tasks page; appointment rows land on the calendar; client-bound rows open
 * the client, pre-opening the composer for the two nudges that exist to make
 * you write something. The quiet-buyer digest has no client and opens the
 * buyers list.
 */
export function notificationHref(n: Routable): string {
  // Task rows carry client_id too, so they are routed first.
  if (n.type === "task_due") return n.task_id ? `/tasks?task=${n.task_id}` : "/tasks";
  // The quiet-buyer digest names no one client: it opens the buyers list.
  if (n.type === "follow_up" && !n.client_id) return "/clients/buyers";
  if (n.type.startsWith("appointment") || !n.client_id) return "/calendar";
  const compose =
    n.type === "follow_up"
      ? "?compose=check_in"
      : n.type === "stalled_offer"
        ? "?compose=offer_followup"
        : "";
  return `/clients/${n.client_id}${compose}`;
}

/**
 * The bell and the notifications page each keep their own copy of the feed.
 * Whichever one changes read state announces it so the other catches up
 * instead of waiting for the next five-minute poll.
 */
export const NOTIFICATIONS_CHANGED = "notifications:changed";

export function announceNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}
