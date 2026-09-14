import { cache } from "react";

import { createClient as createSupabase } from "@/lib/supabase/server";

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
