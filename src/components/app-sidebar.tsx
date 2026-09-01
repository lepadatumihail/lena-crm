"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calculator,
  CalendarDays,
  FileText,
  Gift,
  Home,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";

import { signOut } from "@/lib/actions/auth";
import { clientsPath, type ClientSide } from "@/lib/crm";
import { LogoMark, Wordmark } from "@/components/brand/logo";
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
  { side: "buyer", label: "Buyers", icon: Users },
  { side: "seller", label: "Sellers", icon: Building2 },
] as const;

const ACTIVE_CLASSES =
  "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:hover:bg-primary/15 data-[active=true]:[&>svg]:text-primary";

export function AppSidebar({
  email,
  isAdmin = false,
  foundingNumber = null,
}: {
  email: string;
  isAdmin?: boolean;
  foundingNumber?: number | null;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  // Close the mobile drawer (a Sheet) whenever a nav item is tapped — including
  // re-tapping the current page, which wouldn't trigger a route change.
  const closeMobile = () => setOpenMobile(false);
  const onHome = pathname === "/home";
  const onCalculator = pathname.startsWith("/calculator");
  const onCalendar = pathname.startsWith("/calendar");
  const onTemplates = pathname.startsWith("/templates");
  const onInvites = pathname.startsWith("/invites");
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
                  tooltip="Home"
                  className={ACTIVE_CLASSES}
                >
                  <Link href="/home" onClick={closeMobile}>
                    <Home />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {PIPELINE.map((item) => (
                <SidebarMenuItem key={item.side}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeSide === item.side}
                    tooltip={item.label}
                    className={ACTIVE_CLASSES}
                  >
                    <Link href={clientsPath(item.side)} onClick={closeMobile}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={onCalendar}
                  tooltip="Calendar"
                  className={ACTIVE_CLASSES}
                >
                  <Link href="/calendar" onClick={closeMobile}>
                    <CalendarDays />
                    <span>Calendar</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={onTemplates}
                  tooltip="Templates"
                  className={ACTIVE_CLASSES}
                >
                  <Link href="/templates" onClick={closeMobile}>
                    <FileText />
                    <span>Templates</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={onCalculator}
                  tooltip="Calculator"
                  className={ACTIVE_CLASSES}
                >
                  <Link href="/calculator" onClick={closeMobile}>
                    <Calculator />
                    <span>Calculator</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={onInvites}
                  tooltip="Invites"
                  className={ACTIVE_CLASSES}
                >
                  <Link href="/invites" onClick={closeMobile}>
                    <Gift />
                    <span>Invites</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={onAdmin}
                    tooltip="Admin"
                    className={ACTIVE_CLASSES}
                  >
                    <Link href="/admin" onClick={closeMobile}>
                      <ShieldCheck />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {foundingNumber != null ? (
          <div className="text-primary truncate px-2 text-xs font-medium group-data-[collapsible=icon]:hidden">
            Founding Agent #{foundingNumber}
          </div>
        ) : null}
        <div className="text-muted-foreground truncate px-2 text-xs group-data-[collapsible=icon]:hidden">
          {email}
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={signOut}>
              <SidebarMenuButton type="submit" tooltip="Sign out">
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
