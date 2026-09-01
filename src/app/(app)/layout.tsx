import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { hasAccess } from "@/lib/access";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Hard paywall: expired trial / no active subscription → /upgrade.
  // (/upgrade lives outside this group so the gate can't loop on itself.)
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, trial_ends_at, is_admin, founding_number")
    .eq("id", user.id)
    .maybeSingle();
  if (profile && !hasAccess(profile)) redirect("/upgrade");

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        email={user.email ?? ""}
        isAdmin={profile?.is_admin ?? false}
        foundingNumber={profile?.founding_number ?? null}
      />
      <SidebarInset>
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto">
            <NotificationsBell />
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
