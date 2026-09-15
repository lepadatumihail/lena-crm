"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Bell,
  Building2,
  Calculator,
  CalendarDays,
  CircleQuestionMark,
  CreditCard,
  FileText,
  Home,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { stageLabel } from "@/i18n/labels";
import { clientRecordId, clientsPath, STAGE_TONES, type Stage } from "@/lib/crm";
import { TONE_SOLID } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { useShellCrumb } from "@/components/shell/shell-context";
import { SupportDialog } from "@/components/support-dialog";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

/** Where the agent stands on the Free/Pro line, pre-formatted by the layout. */
export type SidebarPlan = {
  tier: "free" | "pro";
  source: "subscription" | "comp" | "admin" | null;
  proUntilLabel: string | null;
  limit: number | null;
  clientCount: number;
};

/** Live figures shown as badges next to the main destinations. */
export type SidebarCounts = {
  buyers: number;
  sellers: number;
  /** Appointments starting today. */
  today: number;
  /** Open tasks due today or overdue; null while tasks aren't available. */
  tasks: number | null;
};

export type StageCount = { stage: Stage; count: number };

/** A route to highlight instead of the live one; for previews and tests. */
export type RouteOverride = { pathname: string; search?: string };

/* Inactive items sit back in muted ink; the current one comes forward. */
const ITEM_CLASSES =
  "text-muted-foreground hover:text-foreground data-[active=true]:text-foreground font-medium";

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  badge,
  onNavigate,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  badge?: number | null;
  onNavigate: () => void;
}) {
  const showBadge = badge != null && badge > 0;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={label}
        className={cn(ITEM_CLASSES, showBadge && "pr-10")}
      >
        <Link href={href} onClick={onNavigate}>
          <Icon strokeWidth={1.75} />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
      {showBadge ? <SidebarMenuBadge>{badge}</SidebarMenuBadge> : null}
    </SidebarMenuItem>
  );
}

export function AppSidebar({
  email,
  isAdmin = false,
  foundingNumber = null,
  plan = null,
  counts,
  stages,
  route,
}: {
  email: string;
  isAdmin?: boolean;
  foundingNumber?: number | null;
  plan?: SidebarPlan | null;
  counts: SidebarCounts;
  /** The buyer pipeline, one entry per stage in order. */
  stages: StageCount[];
  route?: RouteOverride;
}) {
  const t = useTranslations("nav");
  const tCrm = useTranslations("crm");
  const tSupport = useTranslations("support");
  const livePathname = usePathname();
  const liveSearchParams = useSearchParams();
  const pathname = route?.pathname ?? livePathname;
  const searchParams = route
    ? new URLSearchParams(route.search ?? "")
    : liveSearchParams;
  const { setOpenMobile } = useSidebar();
  const [supportOpen, setSupportOpen] = useState(false);
  // Close the mobile drawer (a Sheet) whenever a nav item is tapped — including
  // re-tapping the current page, which wouldn't trigger a route change.
  const closeMobile = () => setOpenMobile(false);

  const within = (prefix: string) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`);
  // A client record (and the new-client form) belongs to its side's list.
  const crumb = useShellCrumb();
  const recordSide =
    clientRecordId(pathname) != null
      ? (crumb?.side ?? null)
      : pathname === "/clients/new"
        ? searchParams.get("side") === "seller"
          ? "seller"
          : "buyer"
        : null;
  const onBuyers =
    pathname.startsWith("/clients/buyers") || recordSide === "buyer";
  const onSellers =
    pathname.startsWith("/clients/sellers") || recordSide === "seller";
  const activeStage = pathname.startsWith("/clients/buyers")
    ? searchParams.get("stage")
    : null;
  const buyersHref = clientsPath("buyer");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b px-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <Link
          href="/home"
          onClick={closeMobile}
          className="focus-visible:ring-ring/50 flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-[3px]"
        >
          <LogoMark className="size-8" />
          <span className="flex min-w-0 flex-col leading-none group-data-[collapsible=icon]:hidden">
            <Wordmark className="text-[15px]" />
            <span className="text-muted-foreground mt-1 truncate text-[11px]">
              {t("tagline")}
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 py-1">
        <SidebarGroup className="py-1">
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem
                href="/home"
                icon={Home}
                label={t("home")}
                active={pathname === "/home"}
                onNavigate={closeMobile}
              />
              <NavItem
                href={buyersHref}
                icon={Users}
                label={t("buyers")}
                active={onBuyers}
                badge={counts.buyers}
                onNavigate={closeMobile}
              />
              <NavItem
                href={clientsPath("seller")}
                icon={Building2}
                label={t("sellers")}
                active={onSellers}
                badge={counts.sellers}
                onNavigate={closeMobile}
              />
              <NavItem
                href="/calendar"
                icon={CalendarDays}
                label={t("calendar")}
                active={within("/calendar")}
                badge={counts.today}
                onNavigate={closeMobile}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {stages.length > 0 ? (
          <SidebarGroup className="py-1 group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>{t("pipeline")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {stages.map((s) => (
                  <SidebarMenuItem key={s.stage}>
                    <SidebarMenuButton
                      asChild
                      isActive={onBuyers && activeStage === s.stage}
                      className={cn(ITEM_CLASSES, "pr-10")}
                    >
                      <Link
                        href={`${buyersHref}?stage=${s.stage}`}
                        onClick={closeMobile}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "mx-1 size-2 shrink-0 rounded-full",
                            TONE_SOLID[STAGE_TONES[s.stage]]
                          )}
                        />
                        <span>{stageLabel(tCrm, s.stage)}</span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuBadge
                      className={s.count === 0 ? "opacity-50" : undefined}
                    >
                      {s.count}
                    </SidebarMenuBadge>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        <SidebarGroup className="py-1">
          <SidebarGroupLabel>{t("workspace")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem
                href="/templates"
                icon={FileText}
                label={t("templates")}
                active={within("/templates")}
                onNavigate={closeMobile}
              />
              <NavItem
                href="/calculator"
                icon={Calculator}
                label={t("calculator")}
                active={within("/calculator")}
                onNavigate={closeMobile}
              />
              <NavItem
                href="/notifications"
                icon={Bell}
                label={t("notifications")}
                active={within("/notifications")}
                onNavigate={closeMobile}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-1">
          <SidebarGroupLabel>{t("account")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem
                href="/billing"
                icon={CreditCard}
                label={t("billing")}
                active={within("/billing")}
                onNavigate={closeMobile}
              />
              {isAdmin ? (
                <NavItem
                  href="/admin"
                  icon={ShieldCheck}
                  label={t("admin")}
                  active={within("/admin")}
                  onNavigate={closeMobile}
                />
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t p-2">
        <SidebarMenu>
          <NavItem
            href="/referrals"
            icon={UserPlus}
            label={t("inviteTeammates")}
            active={within("/referrals")}
            onNavigate={closeMobile}
          />
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              tooltip={tSupport("trigger")}
              className={ITEM_CLASSES}
              onClick={() => {
                closeMobile();
                setSupportOpen(true);
              }}
            >
              <CircleQuestionMark strokeWidth={1.75} />
              <span>{t("help")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {plan ? (
          <PlanCard
            plan={plan}
            foundingNumber={foundingNumber}
            onNavigate={closeMobile}
          />
        ) : null}
      </SidebarFooter>

      <SidebarRail />

      <SupportDialog
        open={supportOpen}
        onOpenChange={setSupportOpen}
        email={email}
      />
    </Sidebar>
  );
}

/**
 * The plan at a glance, pinned under the navigation. Free: "2 of 3 clients"
 * with a meter and an Upgrade button. Pro: the tier and what it grants, with
 * a way to the billing page.
 */
function PlanCard({
  plan,
  foundingNumber,
  onNavigate,
}: {
  plan: SidebarPlan;
  foundingNumber: number | null;
  onNavigate: () => void;
}) {
  const t = useTranslations("nav.plan");
  const tNav = useTranslations("nav");
  const isPro = plan.tier === "pro";
  const limit = plan.limit ?? 0;
  const used = Math.min(plan.clientCount, limit);
  const atCap = !isPro && plan.clientCount >= limit;

  const title = isPro
    ? [
        t("pro"),
        plan.source === "comp"
          ? t("comped")
          : plan.source === "admin"
            ? t("admin")
            : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : t("free");
  const detail = isPro
    ? plan.source === "comp" && plan.proUntilLabel
      ? t("until", { date: plan.proUntilLabel })
      : t("unlimited")
    : t("usage", { used, limit });

  return (
    <div className="bg-card rounded-lg border p-3 shadow-xs group-data-[collapsible=icon]:hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm leading-tight font-medium">{title}</p>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {detail}
          </p>
        </div>
        <Button
          asChild
          size="xs"
          variant={atCap ? "default" : "secondary"}
          className="shrink-0"
        >
          <Link href={isPro ? "/billing" : "/pricing"} onClick={onNavigate}>
            {isPro ? t("manage") : t("upgradeCta")}
          </Link>
        </Button>
      </div>
      {!isPro ? (
        <div
          className="bg-muted mt-2.5 h-1.5 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={used}
          aria-label={detail}
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300 ease-(--ease-standard)",
              TONE_SOLID[atCap ? "amber" : "brand"]
            )}
            style={{ width: `${limit ? (used / limit) * 100 : 0}%` }}
          />
        </div>
      ) : null}
      {foundingNumber != null ? (
        <p className="text-primary mt-2 truncate text-[11px] font-medium">
          {tNav("foundingAgent", { number: foundingNumber })}
        </p>
      ) : null}
    </div>
  );
}
