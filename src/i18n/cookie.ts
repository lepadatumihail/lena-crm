import { LOCALE_COOKIE_MAX_AGE } from "./config";

/** Shared cookie attributes so every writer (action, auth callback) agrees. */
export function localeCookieOptions() {
  return {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
