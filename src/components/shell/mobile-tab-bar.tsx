"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  Home,
  ListChecks,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { RouteOverride } from "@/components/shell/app-sidebar";
import {
  NEW_ACTIONS,
  openNewInPlace,
  type NewAction,
} from "@/components/shell/new-actions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { clientsPath } from "@/lib/crm";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  badge?: number | null;
};

/**
 * The phone's main navigation: the four places an agent goes all day, with a
 * + in the middle for anything new. Everything else stays behind the ☰ in the
 * app bar. From md up the sidebar is always there, so this hides.
 */
export function MobileTabBar({
  counts,
  route,
}: {
  counts: { today: number; tasks: number | null };
  /** A route to highlight instead of the live one; for previews and tests. */
  route?: RouteOverride;
}) {
  const t = useTranslations("nav");
  const router = useRouter();
  const livePathname = usePathname();
  const pathname = route?.pathname ?? livePathname;
  const [open, setOpen] = useState(false);

  const left: Tab[] = [
    { href: "/home", label: t("home"), icon: Home, active: pathname === "/home" },
    {
      href: clientsPath("buyer"),
      label: t("clients"),
      icon: Users,
      active: pathname.startsWith("/clients"),
    },
  ];
  const right: Tab[] = [
    {
      href: "/calendar",
      label: t("calendar"),
      icon: CalendarDays,
      active: pathname.startsWith("/calendar"),
      badge: counts.today,
    },
    {
      href: "/tasks",
      label: t("tasks"),
      icon: ListChecks,
      active: pathname.startsWith("/tasks"),
      badge: counts.tasks,
    },
  ];

  function pick(action: NewAction) {
    setOpen(false);
    if (!openNewInPlace(action.id)) router.push(action.href);
  }

  return (
    <>
      <nav
        data-mobile-tab-bar
        aria-label={t("mobile.label")}
        className="bg-background/90 fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
          {left.map((tab) => (
            <TabLink key={tab.href} tab={tab} />
          ))}
          <li className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t("mobile.new")}
              aria-haspopup="dialog"
              className="bg-primary text-primary-foreground focus-visible:ring-ring/50 flex size-12 items-center justify-center rounded-full shadow-md transition-transform duration-150 outline-none focus-visible:ring-[3px] active:scale-[0.94]"
            >
              <Plus className="size-6" strokeWidth={2} />
            </button>
          </li>
          {right.map((tab) => (
            <TabLink key={tab.href} tab={tab} />
          ))}
        </ul>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85svh] gap-0 rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
        >
          <SheetHeader className="pb-2">
            <SheetTitle>{t("mobile.newTitle")}</SheetTitle>
            <SheetDescription className="sr-only">{t("mobile.newDescription")}</SheetDescription>
          </SheetHeader>
          <ul className="grid gap-0.5 px-2">
            {NEW_ACTIONS.map((action) => (
              <li key={action.id}>
                <button
                  type="button"
                  onClick={() => pick(action)}
                  className="hover:bg-accent focus-visible:bg-accent flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] outline-none transition-colors duration-150"
                >
                  <span className="bg-muted text-foreground/80 flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <action.icon className="size-4" strokeWidth={1.75} />
                  </span>
                  {t(action.labelKey)}
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}

function TabLink({ tab }: { tab: Tab }) {
  const Icon = tab.icon;
  return (
    <li>
      <Link
        href={tab.href}
        aria-current={tab.active ? "page" : undefined}
        className={cn(
          "focus-visible:bg-accent flex h-16 flex-col items-center justify-center gap-1 text-[11px] outline-none transition-colors duration-150",
          tab.active ? "text-foreground font-medium" : "text-muted-foreground"
        )}
      >
        <span className="relative">
          <Icon className="size-5" strokeWidth={tab.active ? 2.1 : 1.75} />
          {tab.badge ? (
            <span className="bg-muted text-foreground ring-background absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full border px-1 text-[10px] leading-none font-normal tabular-nums ring-2">
              {tab.badge}
            </span>
          ) : null}
        </span>
        {tab.label}
      </Link>
    </li>
  );
}
