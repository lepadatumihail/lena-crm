"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";

import { clientRecordId, clientsPath } from "@/lib/crm";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import type { SidebarCounts } from "@/components/shell/app-sidebar";
import { QuickSearch } from "@/components/shell/quick-search";
import { useShellCrumb } from "@/components/shell/shell-context";
import { UserMenu } from "@/components/shell/user-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TONE_TAG, type Tone } from "@/lib/tones";

type Pill = { text: string; tone: Tone };

/** A route to describe instead of the live one; for previews and tests. */
export type RouteOverride = { pathname: string; search?: string };

/**
 * The bar above every app page: which section this is, a live figure for
 * it, then search, the bell and the agent's menu. On a client record the
 * title becomes a breadcrumb back to that client's list.
 */
export function AppBar({
  email,
  name,
  counts,
  route,
}: {
  email: string;
  name: string | null;
  counts: SidebarCounts;
  route?: RouteOverride;
}) {
  const t = useTranslations("nav");
  const livePathname = usePathname();
  const liveSearchParams = useSearchParams();
  const pathname = route?.pathname ?? livePathname;
  const searchParams = route
    ? new URLSearchParams(route.search ?? "")
    : liveSearchParams;
  const crumb = useShellCrumb();
  const onRecord = clientRecordId(pathname) != null;

  let title = SITE_NAME;
  let pill: Pill | null = null;
  if (pathname === "/home") {
    // Home's greeting already says the date; no pill repeating it.
    title = t("home");
  } else if (pathname.startsWith("/clients/buyers")) {
    title = t("buyers");
    pill = { text: t("active", { count: counts.buyers }), tone: "neutral" };
  } else if (pathname.startsWith("/clients/sellers")) {
    title = t("sellers");
    pill = { text: t("active", { count: counts.sellers }), tone: "neutral" };
  } else if (pathname.startsWith("/clients/new") || pathname.startsWith("/clients/import")) {
    title = searchParams.get("side") === "seller" ? t("sellers") : t("buyers");
  } else if (onRecord) {
    title = t("clients");
  } else if (pathname.startsWith("/calendar")) {
    title = t("calendar");
    pill = { text: t("today", { count: counts.today }), tone: "neutral" };
  } else if (pathname.startsWith("/tasks")) {
    title = t("tasks");
    if (counts.tasks != null) {
      pill = { text: t("due", { count: counts.tasks }), tone: counts.tasks > 0 ? "amber" : "neutral" };
    }
  } else if (pathname.startsWith("/notifications")) {
    title = t("notifications");
  } else if (pathname.startsWith("/templates")) {
    title = t("templates");
  } else if (pathname.startsWith("/calculator")) {
    title = t("calculator");
  } else if (pathname.startsWith("/referrals")) {
    title = t("referrals");
  } else if (pathname.startsWith("/billing")) {
    title = t("billing");
  } else if (pathname.startsWith("/settings")) {
    title = t("settings");
  } else if (pathname.startsWith("/admin")) {
    title = t("admin");
  }

  return (
    <header className="bg-background/85 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur md:px-4">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground size-8 shrink-0" />
      {onRecord && crumb ? (
        <nav
          aria-label={t("breadcrumb")}
          className="flex min-w-0 items-center gap-1.5 text-[15px]"
        >
          <h1 className="shrink-0">
            <Link
              href={clientsPath(crumb.side)}
              className="text-muted-foreground hover:text-foreground rounded-sm transition-colors duration-150"
            >
              {crumb.side === "seller" ? t("sellers") : t("buyers")}
            </Link>
          </h1>
          <ChevronRight aria-hidden className="text-muted-foreground/60 size-4 shrink-0" />
          <span aria-current="page" className="truncate font-medium">
            {crumb.label}
          </span>
        </nav>
      ) : (
        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="truncate text-[15px] font-medium">
            {title}
          </h1>
          {pill ? (
            <span
              className={cn(
                "hidden h-6 shrink-0 items-center rounded-full border px-2.5 text-xs whitespace-nowrap sm:inline-flex",
                pill.tone === "neutral"
                  ? "bg-card text-muted-foreground"
                  : TONE_TAG[pill.tone]
              )}
            >
              {pill.text}
            </span>
          ) : null}
        </div>
      )}
      <div className="ml-auto flex items-center gap-2">
        <QuickSearch />
        <NotificationsBell />
        <div className="ml-1.5">
          <UserMenu email={email} name={name} />
        </div>
      </div>
    </header>
  );
}
