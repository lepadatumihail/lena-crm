/**
 * The error codes the app recognises on a Supabase `error`. PostgREST and
 * Postgres both arrive as `{ code, message }`, so one predicate covers the
 * usual path (PostgREST's schema cache) and the stale-cache case (Postgres).
 */
type CodedError = { code?: string | null } | null | undefined;

/**
 * The table is not there: PGRST205 (not in PostgREST's schema cache) or
 * 42P01 (undefined_table). Readers that must survive a deploy landing before
 * its migration treat this as "not ready" rather than a failure.
 */
export function isMissingTableError(error: CodedError): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01";
}
