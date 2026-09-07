import type { Notification } from "@/lib/supabase/types";

type Routable = Pick<Notification, "type" | "client_id">;

/**
 * Where a notification takes you when tapped. Appointment rows land on the
 * calendar; client-bound rows open the client, pre-opening the composer for
 * the two nudges that exist to make you write something.
 */
export function notificationHref(n: Routable): string {
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
