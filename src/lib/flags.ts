/**
 * Rollout switches read from the environment. Each one is off unless set,
 * so a missing variable never exposes an unfinished feature.
 */

type FlagProfile = { is_admin?: boolean | null; email?: string | null } | null | undefined;
type Env = Record<string, string | undefined>;

/**
 * Voice notes (plan 026). VOICE_NOTES_ENABLED is one of:
 * - `off` (default): nobody
 * - `admins`: admin accounts only
 * - `pilot`: admins plus the sign-in emails in VOICE_NOTES_PILOT_EMAILS
 *   (comma-separated, case-insensitive)
 * - `all`: everyone
 * Any other value counts as `off`.
 */
export function voiceNotesEnabled(profile: FlagProfile, env: Env = process.env): boolean {
  const mode = (env.VOICE_NOTES_ENABLED ?? "off").trim().toLowerCase();
  if (mode === "all") return true;
  if (!profile) return false;
  const isAdmin = profile.is_admin === true;
  if (mode === "admins") return isAdmin;
  if (mode === "pilot") {
    if (isAdmin) return true;
    const email = profile.email?.trim().toLowerCase();
    if (!email) return false;
    const pilots = (env.VOICE_NOTES_PILOT_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    return pilots.includes(email);
  }
  return false;
}
