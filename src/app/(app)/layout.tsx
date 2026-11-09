import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { getSessionProfile, getSessionUser } from "@/lib/data/session";
import { countDueTasks } from "@/lib/data/tasks";
import { intlTag } from "@/i18n/config";
import { planState } from "@/lib/access";
import { voiceNotesEnabled } from "@/lib/flags";
import { BUYER_STAGES } from "@/lib/crm";
import { dateKeyInTimeZone, dayRangeInTimeZone, firstNameFrom } from "@/lib/home";
import { resolveTimeZone } from "@/lib/time-zones";
import { AppBar } from "@/components/shell/app-bar";
import { MobileTabBar } from "@/components/shell/mobile-tab-bar";
import {
  AppSidebar,
  type SidebarPlan,
  type StageCount,
} from "@/components/shell/app-sidebar";
import { ShellProvider } from "@/components/shell/shell-context";
import { VoiceNoteProvider } from "@/components/voice/voice-note-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

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
  const [supabase, locale, user] = await Promise.all([
    createClient(),
    getLocale(),
    getSessionUser(),
  ]);

  if (!user) redirect("/login");

  // The app is always open. The only gate is the Free plan's client cap,
  // enforced where a client is added; the sidebar just shows where they stand.
  // One light scan of the book feeds the cap, the nav badges and the pipeline
  // group; today's appointments and due tasks are head counts. "Today" starts
  // at the agent's own midnight, so those counts wait for the profile; the
  // scan does not.
  const now = new Date();
  const [profile, clientsRes, todayRes, dueTasks] = await Promise.all([
    getSessionProfile(),
    supabase.from("clients").select("side, stage, is_active"),
    getSessionProfile().then((p) => {
      const today = dayRangeInTimeZone(
        now.toISOString(),
        resolveTimeZone(p?.time_zone)
      );
      return supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .gte("starts_at", today.start)
        .lt("starts_at", today.end);
    }),
    // Due tasks turn over at the agent's own midnight too; null keeps the badge off.
    getSessionProfile().then((p) =>
      countDueTasks(dateKeyInTimeZone(now.toISOString(), resolveTimeZone(p?.time_zone)))
    ),
  ]);
  const timeZone = resolveTimeZone(profile?.time_zone);

  const rows = clientsRes.data ?? [];
  const active = rows.filter((r) => r.is_active);
  const counts = {
    buyers: active.filter((r) => r.side === "buyer").length,
    sellers: active.filter((r) => r.side === "seller").length,
    today: todayRes.count ?? 0,
    tasks: dueTasks,
  };
  const stages: StageCount[] = BUYER_STAGES.map((stage) => ({
    stage,
    count: active.filter((r) => r.side === "buyer" && r.stage === stage).length,
  }));

  let plan: SidebarPlan | null = null;
  if (profile) {
    const state = planState(profile);
    plan = {
      tier: state.tier,
      source: state.source,
      proUntilLabel: state.proUntil ? shortDate(state.proUntil, locale) : null,
      limit: state.limit,
      // Every row counts against the cap, inactive ones too.
      clientCount: rows.length,
    };
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <ShellProvider
      agentId={user.id}
      agentFirstName={firstNameFrom(profile?.full_name, user.email)}
      timeZone={timeZone}
      voiceNotes={voiceNotesEnabled(profile)}
    >
    <VoiceNoteProvider>
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        email={user.email ?? ""}
        isAdmin={profile?.is_admin ?? false}
        foundingNumber={profile?.founding_number ?? null}
        plan={plan}
        counts={counts}
        stages={stages}
      />
      <SidebarInset className="min-w-0">
        <AppBar
          email={user.email ?? ""}
          name={profile?.full_name ?? null}
          counts={counts}
        />
        {/* On a phone the tab bar covers the last 4rem, so the page ends above it. */}
        <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 pt-5 pb-24 md:px-6 md:pb-5">
          {children}
        </div>
        <MobileTabBar counts={{ today: counts.today, tasks: counts.tasks }} />
      </SidebarInset>
    </SidebarProvider>
    </VoiceNoteProvider>
    </ShellProvider>
  );
}
