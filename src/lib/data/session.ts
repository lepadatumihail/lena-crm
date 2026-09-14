import { cache } from "react";

import { createClient as createSupabase } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";
import { resolveTimeZone } from "@/lib/time-zones";

/**
 * The signed-in user for this request. Asking Supabase Auth is a network
 * round-trip and the layout and several page sections all need the answer,
 * so it is asked once per request and shared.
 */
export const getSessionUser = cache(async () => {
  const supabase = await createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
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
