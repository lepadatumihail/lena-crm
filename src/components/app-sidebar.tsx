"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Building2, LogOut, Users } from "lucide-react";

import { signOut } from "@/lib/actions/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const NAV = [
  { side: "buyer", label: "Buyers", icon: Users },
  { side: "seller", label: "Sellers", icon: Building2 },
] as const;

export function AppSidebar({ email }: { email: string }) {
  const params = useSearchParams();
  const active = params.get("side") === "seller" ? "seller" : "buyer";

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
          <SidebarGroupLabel>Pipeline</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.side}>
                  <SidebarMenuButton
                    asChild
                    isActive={active === item.side}
                    tooltip={item.label}
                  >
                    <Link href={`/clients?side=${item.side}`}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
