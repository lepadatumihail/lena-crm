import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import { SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Service-role Supabase client — bypasses RLS. Use ONLY in trusted
 * server contexts that scope every query by agent_id themselves
 * (e.g. the token-authenticated calendar feed). Never import client-side.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient<Database>(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
