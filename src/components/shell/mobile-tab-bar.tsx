"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Building2,
  CalendarDays,
  CalendarPlus,
  ClipboardPaste,
  Home,
  ListChecks,
  ListPlus,
  Plus,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { RouteOverride } from "@/components/shell/app-sidebar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { clientsPath } from "@/lib/crm";
import { tasksHref } from "@/lib/tasks-view";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  badge?: number | null;
};

type Action = { id: string; href: string; label: string; icon: LucideIcon };

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
  const tNew = useTranslations("nav.quickSearch");
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

  const actions: Action[] = [
    { id: "new-buyer", href: "/clients/new?side=buyer", label: tNew("newBuyer"), icon: UserPlus },
    { id: "new-seller", href: "/clients/new?side=seller", label: tNew("newSeller"), icon: Building2 },
    { id: "paste-lead", href: "/clients/new?side=buyer&paste=1", label: t("mobile.pasteLead"), icon: ClipboardPaste },
    { id: "new-task", href: tasksHref({ openNew: true }), label: tNew("newTask"), icon: ListPlus },
    { id: "new-appointment", href: "/calendar", label: tNew("newAppointment"), icon: CalendarPlus },
  ];

  function pick(action: Action) {
    setOpen(false);
    if (action.id === "new-task" && window.location.pathname === "/tasks") {
      // Already on /tasks: add the intent in place, the way quick search does,
      // so the tab and filters survive. TasksView opens the dialog.
      const url = new URL(window.location.href);
      url.searchParams.set("new", "1");
      window.history.replaceState(null, "", url.toString());
      return;
    }
    router.push(action.href);
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
              className="bg-primary text-primary-foreground focus-visible:ring-ring/50 flex size-12 items-center justify-center rounded-full shadow-[0_6px_16px_-6px_color-mix(in_oklab,var(--primary)_70%,transparent)] transition-transform duration-150 outline-none focus-visible:ring-[3px] active:scale-[0.94]"
            >
              <Plus className="size-6" strokeWidth={2.25} />
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
            {actions.map((action) => (
              <li key={action.id}>
                <button
                  type="button"
                  onClick={() => pick(action)}
                  className="hover:bg-accent focus-visible:bg-accent flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium outline-none transition-colors duration-150"
                >
                  <span className="bg-muted text-foreground/80 flex size-9 shrink-0 items-center justify-center rounded-full">
                    <action.icon className="size-4" />
                  </span>
                  {action.label}
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
          "focus-visible:bg-accent flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium outline-none transition-colors duration-150",
          tab.active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span className="relative">
          <Icon className="size-5" strokeWidth={tab.active ? 2.1 : 1.75} />
          {tab.badge ? (
            <span className="bg-primary text-primary-foreground ring-background absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold tabular-nums ring-2">
              {tab.badge}
            </span>
          ) : null}
        </span>
        {tab.label}
      </Link>
    </li>
  );
}
