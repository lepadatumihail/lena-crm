import { createAdminClient } from "@/lib/supabase/admin";
import { isSiteEvent } from "@/lib/site-events";

const text = (value: unknown, max: number): string | null =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

/**
 * Stores one anonymous funnel step (see SITE_EVENTS) with the service role;
 * server code only. Unknown events are dropped and strings capped to the
 * table's limits. A failed insert is logged, never thrown: a lost statistic
 * must not break a page or a sign-in.
 */
export async function recordSiteEvent(input: Record<string, unknown>): Promise<boolean> {
  if (!isSiteEvent(input.event)) return false;
  const row = {
    event: input.event,
    path: text(input.path, 200),
    utm_source: text(input.utm_source, 100),
    utm_medium: text(input.utm_medium, 100),
    utm_campaign: text(input.utm_campaign, 100),
    utm_content: text(input.utm_content, 100),
    in_app: input.in_app === true,
    mobile: input.mobile === true,
  };
  const { error } = await createAdminClient().from("site_events").insert(row);
  if (error) {
    console.error("site_events insert failed:", error.message);
    return false;
  }
  return true;
}
