import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { intlTag } from "@/i18n/config";
import { planState } from "@/lib/access";
import { AppSidebar, type SidebarPlan } from "@/components/app-sidebar";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function shortDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(intlTag(locale), {
    day: "numeric",
    month: "short",
  });
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabase, locale] = await Promise.all([createClient(), getLocale()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // The app is always open. The only gate is the Free plan's client cap,
  // enforced where a client is added; the sidebar just shows where they stand.
  const [{ data: profile }, { count }] = await Promise.all([
    supabase
      .from("profiles")
      .select("is_admin, founding_number, subscription_status, pro_until")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("clients").select("id", { count: "exact", head: true }),
  ]);

  let plan: SidebarPlan | null = null;
  if (profile) {
    const state = planState(profile);
    plan = {
      tier: state.tier,
      source: state.source,
      proUntilLabel: state.proUntil ? shortDate(state.proUntil, locale) : null,
      limit: state.limit,
      clientCount: count ?? 0,
    };
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        email={user.email ?? ""}
        isAdmin={profile?.is_admin ?? false}
        foundingNumber={profile?.founding_number ?? null}
        plan={plan}
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
