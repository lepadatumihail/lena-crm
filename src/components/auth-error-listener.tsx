"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

// Supabase returns auth errors appended to the redirect URL (often in the
// hash fragment), e.g. #error=access_denied&error_code=otp_expired&...
// These can't be read on the server, so we surface them client-side.
const MESSAGES: Record<string, string> = {
  otp_expired:
    "That sign-in link has expired or was already used. Request a new one below.",
  access_denied: "Sign-in didn't complete. Please try again.",
};

export function AuthErrorListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const code = search.get("error_code") ?? hash.get("error_code");
    const error = search.get("error") ?? hash.get("error");
    if (!code && !error) return;

    const message =
      (code ? MESSAGES[code] : undefined) ??
      (error ? MESSAGES[error] : undefined) ??
      "Sign-in failed. Please try again.";
    toast.error(message);

    // Strip the error params so a refresh doesn't re-trigger the toast.
    window.history.replaceState(null, "", window.location.pathname);

    if (pathname !== "/login") router.replace("/login");
  }, [pathname, router]);

  return null;
}
