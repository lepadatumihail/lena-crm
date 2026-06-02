"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays, FileText, LogOut, Users } from "lucide-react";

import { signOut } from "@/lib/actions/auth";
import { clientsPath, type ClientSide } from "@/lib/crm";
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
} from "@/components/ui/sidebar";

const PIPELINE = [
  { side: "buyer", label: "Buyers", icon: Users },
  { side: "seller", label: "Sellers", icon: Building2 },
] as const;

const ACTIVE_CLASSES =
  "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:hover:bg-primary/15 data-[active=true]:[&>svg]:text-primary";

export function AppSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const onCalendar = pathname.startsWith("/calendar");
  const onTemplates = pathname.startsWith("/templates");
  const activeSide: ClientSide | null = pathname.startsWith("/clients/sellers")
    ? "seller"
    : pathname.startsWith("/clients")
      ? "buyer"
      : null;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/clients"
          className="flex items-center gap-2 px-1 py-1.5"
        >
          <span className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-md text-sm font-bold">
            L
          </span>
          <span className="font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Lena
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {PIPELINE.map((item) => (
                <SidebarMenuItem key={item.side}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeSide === item.side}
                    tooltip={item.label}
                    className={ACTIVE_CLASSES}
                  >
                    <Link href={clientsPath(item.side)}>
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
                  <Link href="/calendar">
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
                  <Link href="/templates">
                    <FileText />
                    <span>Templates</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
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
