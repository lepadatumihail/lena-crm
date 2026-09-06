"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

// Supabase returns auth errors appended to the redirect URL (often in the
// hash fragment), e.g. #error=access_denied&error_code=otp_expired&...
// These can't be read on the server, so we surface them client-side.
const MESSAGE_KEYS = {
  otp_expired: "otpExpired",
  access_denied: "accessDenied",
} as const;

type ErrorCode = keyof typeof MESSAGE_KEYS;

function isErrorCode(value: string | null): value is ErrorCode {
  return value != null && value in MESSAGE_KEYS;
}

export function AuthErrorListener() {
  const t = useTranslations("auth.errors");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const code = search.get("error_code") ?? hash.get("error_code");
    const error = search.get("error") ?? hash.get("error");
    if (!code && !error) return;

    const key = isErrorCode(code)
      ? MESSAGE_KEYS[code]
      : isErrorCode(error)
        ? MESSAGE_KEYS[error]
        : "failed";
    toast.error(t(key));

    // Strip the error params so a refresh doesn't re-trigger the toast.
    window.history.replaceState(null, "", window.location.pathname);

    if (pathname !== "/login") router.replace("/login");
  }, [pathname, router, t]);

  return null;
}
