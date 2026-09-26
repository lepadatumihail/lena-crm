import { DueTasksPanel } from "@/components/home/due-tasks-panel";
import {
  GettingStartedStrip,
  RememberOnboarding,
} from "@/components/home/getting-started-strip";
import {
  AttentionPanel,
  RecentClientsPanel,
  SummaryPanel,
  UpcomingEventsPanel,
} from "@/components/home/home-panels";
import { getCommissionSummary } from "@/lib/data/buyer";
import {
  getHomeEvents,
  getNeedsAttention,
  getOnboardingInput,
  getPipelineCounts,
  getRecentClients,
} from "@/lib/data/dashboard";
import { getAgentTimeZone } from "@/lib/data/session";
import { countDueTasks, getDueTasks } from "@/lib/data/tasks";
import { buyersBeforeViewing, dateKeyInTimeZone, showOnboarding } from "@/lib/home";
import { DUE_TASKS_LIMIT } from "@/lib/tasks";

/*
  Home's sections with their data. home/page.tsx renders each inside its own
  <Suspense>, so a slow query holds back only the section that needs it.
  Shared loads (the client scan, the events) are deduplicated by `cache`.
*/

/**
 * The getting-started strip. The page renders this only while the book is
 * young and the agent hasn't finished it on this device; when every required
 * step turns out to be done, it says so to the cookie instead, so the next
 * visit holds no place for it. `hidden`: the agent closed the strip, so it
 * only checks, and draws nothing.
 */
export async function OnboardingSection({ hidden = false }: { hidden?: boolean }) {
  const onboarding = await getOnboardingInput();
  if (!showOnboarding(onboarding)) return <RememberOnboarding value="done" />;
  return hidden ? null : <GettingStartedStrip onboarding={onboarding} />;
}

export async function SummarySection({ now }: { now: Date }) {
  const [counts, events, commission] = await Promise.all([
    getPipelineCounts(),
    getHomeEvents(now.toISOString()),
    getCommissionSummary(),
  ]);
  return <SummaryPanel counts={counts} events={events} commission={commission} now={now} />;
}

export async function AttentionSection() {
  return <AttentionPanel items={await getNeedsAttention()} />;
}

export async function DueTasksSection({ now }: { now: Date }) {
  const todayKey = dateKeyInTimeZone(now.toISOString(), await getAgentTimeZone());
  const [tasks, total] = await Promise.all([
    getDueTasks(todayKey, DUE_TASKS_LIMIT),
    countDueTasks(todayKey),
  ]);
  if (tasks === null) return null; // no table yet: the slot stays empty
  return <DueTasksPanel tasks={tasks} total={total ?? tasks.length} todayKey={todayKey} />;
}

export async function UpcomingSection({ now }: { now: Date }) {
  const events = await getHomeEvents(now.toISOString());
  // Only the empty state mentions waiting buyers; don't wait for counts otherwise.
  const waitingBuyers = events.length
    ? 0
    : buyersBeforeViewing((await getPipelineCounts()).buyer);
  return (
    <UpcomingEventsPanel events={events} waitingBuyers={waitingBuyers} now={now} />
  );
}

export async function RecentSection({ now }: { now: Date }) {
  return <RecentClientsPanel clients={await getRecentClients()} now={now} />;
}
