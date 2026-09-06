"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Right after checkout the webhook may still be on its way. Re-render the
 * page every few seconds for a short while so the plan flips without a
 * manual reload. The parent only mounts this while the profile is not Pro yet.
 */
export function RefreshWhilePending({
  everyMs = 3000,
  times = 10,
}: {
  everyMs?: number;
  times?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    let left = times;
    const id = setInterval(() => {
      router.refresh();
      left -= 1;
      if (left <= 0) clearInterval(id);
    }, everyMs);
    return () => clearInterval(id);
  }, [router, everyMs, times]);

  return null;
}
