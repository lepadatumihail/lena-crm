import { isMissingTableError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { ClientActivity } from "@/lib/supabase/types";

/** One line of a client's activity feed. */
export type ActivityRow = Pick<
  ClientActivity,
  "id" | "kind" | "channel" | "body" | "stage_from" | "stage_to" | "occurred_at"
>;

/** How many entries the client page shows; the newest first. */
export const ACTIVITY_LIMIT = 60;

/**
 * A client's activity, newest first. `null` means the table isn't there yet
 * (a deploy ahead of its migration), so the page can leave the feed out.
 */
export async function getClientActivities(clientId: string): Promise<ActivityRow[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_activities")
    .select("id, kind, channel, body, stage_from, stage_to, occurred_at")
    .eq("client_id", clientId)
    .order("occurred_at", { ascending: false })
    .limit(ACTIVITY_LIMIT);
  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(error.message);
  }
  return data;
}
