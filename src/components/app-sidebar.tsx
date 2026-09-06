"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Building2,
  Calculator,
  CalendarDays,
  CreditCard,
  FileText,
  Gift,
  Home,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";

import { signOut } from "@/lib/actions/auth";
import { clientsPath, type ClientSide } from "@/lib/crm";
import { cn } from "@/lib/utils";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { LocaleSelect } from "@/components/locale-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const PIPELINE = [
  { side: "buyer", labelKey: "buyers", icon: Users },
  { side: "seller", labelKey: "sellers", icon: Building2 },
] as const;

const ACTIVE_CLASSES =
  "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:hover:bg-primary/15 data-[active=true]:[&>svg]:text-primary";

/** Where the agent stands on the Free/Pro line, pre-formatted by the layout. */
export type SidebarPlan = {
  tier: "free" | "pro";
  source: "subscription" | "comp" | "admin" | null;
  proUntilLabel: string | null;
  limit: number | null;
  clientCount: number;
};

export function AppSidebar({
  email,
  isAdmin = false,
  foundingNumber = null,
  plan = null,
}: {
  email: string;
  isAdmin?: boolean;
  foundingNumber?: number | null;
  plan?: SidebarPlan | null;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  // Close the mobile drawer (a Sheet) whenever a nav item is tapped — including
  // re-tapping the current page, which wouldn't trigger a route change.
  const closeMobile = () => setOpenMobile(false);
  const onHome = pathname === "/home";
  const onCalculator = pathname.startsWith("/calculator");
  const onCalendar = pathname.startsWith("/calendar");
  const onTemplates = pathname.startsWith("/templates");
  const onReferrals = pathname.startsWith("/referrals");
  const onBilling = pathname.startsWith("/billing");
  const onAdmin = pathname.startsWith("/admin");
  const activeSide: ClientSide | null = pathname.startsWith("/clients/sellers")
    ? "seller"
    : pathname.startsWith("/clients")
      ? "buyer"
      : null;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/home"
          onClick={closeMobile}
          className="flex items-center gap-2 px-1 py-1.5"
        >
          <LogoMark />
          <Wordmark className="group-data-[collapsible=icon]:hidden" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={onHome}
                  tooltip={t("home")}
                  className={ACTIVE_CLASSES}
                >
                  <Link href="/home" onClick={closeMobile}>
                    <Home />
                    <span>{t("home")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {PIPELINE.map((item) => (
                <SidebarMenuItem key={item.side}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeSide === item.side}
                    tooltip={t(item.labelKey)}
                    className={ACTIVE_CLASSES}
                  >
                    <Link href={clientsPath(item.side)} onClick={closeMobile}>
                      <item.icon />
                      <span>{t(item.labelKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={onCalendar}
                  tooltip={t("calendar")}
                  className={ACTIVE_CLASSES}
                >
                  <Link href="/calendar" onClick={closeMobile}>
                    <CalendarDays />
                    <span>{t("calendar")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={onTemplates}
                  tooltip={t("templates")}
                  className={ACTIVE_CLASSES}
                >
                  <Link href="/templates" onClick={closeMobile}>
                    <FileText />
                    <span>{t("templates")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={onCalculator}
                  tooltip={t("calculator")}
                  className={ACTIVE_CLASSES}
                >
                  <Link href="/calculator" onClick={closeMobile}>
                    <Calculator />
                    <span>{t("calculator")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={onReferrals}
                  tooltip={t("referrals")}
                  className={ACTIVE_CLASSES}
                >
                  <Link href="/referrals" onClick={closeMobile}>
                    <Gift />
                    <span>{t("referrals")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={onBilling}
                  tooltip={t("billing")}
                  className={ACTIVE_CLASSES}
                >
                  <Link href="/billing" onClick={closeMobile}>
                    <CreditCard />
                    <span>{t("billing")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={onAdmin}
                    tooltip={t("admin")}
                    className={ACTIVE_CLASSES}
                  >
                    <Link href="/admin" onClick={closeMobile}>
                      <ShieldCheck />
                      <span>{t("admin")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {plan ? <PlanMeter plan={plan} onNavigate={closeMobile} /> : null}
        {foundingNumber != null ? (
          <div className="text-primary truncate px-2 text-xs font-medium group-data-[collapsible=icon]:hidden">
            {t("foundingAgent", { number: foundingNumber })}
          </div>
        ) : null}
        <div className="text-muted-foreground truncate px-2 text-xs group-data-[collapsible=icon]:hidden">
          {email}
        </div>
        <div className="px-1 group-data-[collapsible=icon]:hidden">
          <LocaleSelect />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={signOut}>
              <SidebarMenuButton type="submit" tooltip={t("signOut")}>
                <LogOut />
                <span>{t("signOut")}</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

/** Free: a "2 of 3 clients" bar linking to the plans page. Pro: a quiet badge linking to billing. */
function PlanMeter({ plan, onNavigate }: { plan: SidebarPlan; onNavigate: () => void }) {
  const t = useTranslations("nav.plan");
  const limit = plan.limit ?? 0;
  const used = Math.min(plan.clientCount, limit);
  const atCap = plan.tier === "free" && plan.clientCount >= limit;
  return (
    <Link
      href={plan.tier === "pro" ? "/billing" : "/pricing"}
      onClick={onNavigate}
      className="hover:bg-sidebar-accent mb-1 block rounded-md border px-2 py-1.5 text-xs group-data-[collapsible=icon]:hidden"
    >
      {plan.tier === "pro" ? (
        <>
          <div className="text-primary font-medium">
            {t("pro")}
            {plan.source === "comp"
              ? ` · ${t("comped")}`
              : plan.source === "admin"
                ? ` · ${t("admin")}`
                : ""}
          </div>
          <div className="text-muted-foreground">
            {plan.source === "comp" && plan.proUntilLabel
              ? t("until", { date: plan.proUntilLabel })
              : t("unlimited")}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="font-medium">{t("free")}</span>
            <span className="text-muted-foreground tabular-nums">
              {t("usage", { used, limit })}
            </span>
          </div>
          <div className="bg-sidebar-border mt-1.5 h-1.5 overflow-hidden rounded-full">
            <div
              className={cn("h-full rounded-full", atCap ? "bg-warning" : "bg-primary")}
              style={{ width: `${limit ? (used / limit) * 100 : 0}%` }}
            />
          </div>
          {atCap ? (
            <div className="text-muted-foreground mt-1">{t("upgrade")}</div>
          ) : null}
        </>
      )}
    </Link>
  );
}
