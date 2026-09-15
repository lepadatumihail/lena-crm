import { cache } from "react";

import { createClient as createSupabase } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";
import { resolveTimeZone } from "@/lib/time-zones";

/** Who is signed in, as their verified session token states it. */
type SessionUser = { id: string; email: string | undefined };

/**
 * The signed-in user for this request, read from the session token.
 * getClaims() verifies the token's signature locally instead of asking
 * Supabase Auth, so page renders make no Auth round-trip; the layout and
 * several page sections still share one check per request. A session ended on
 * another device reads as signed in until its token expires (an hour by
 * default), so the actions behind the agent's own edits keep calling getUser().
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabase();
  const { data } = await supabase.auth.getClaims();
  if (!data) return null;
  return { id: data.claims.sub, email: data.claims.email };
});

/**
 * The signed-in agent's profile row, read once per request and shared by the
 * layout and the pages under it. It selects every column rather than a list,
 * so a deploy that lands before a profile migration still reads the columns
 * that exist.
 */
export const getSessionProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data;
});

/** The IANA zone the agent's day runs in: their setting, else the default. */
export async function getAgentTimeZone(): Promise<string> {
  return resolveTimeZone((await getSessionProfile())?.time_zone);
}
