import { Suspense } from "react";

import { FirstSession } from "@/components/home/first-session";
import { HomeHeader } from "@/components/home/home-header";
import { HomeLayout } from "@/components/home/home-layout";
import {
  AttentionSection,
  DueTasksSection,
  RecentSection,
  SummarySection,
  UpcomingSection,
} from "@/components/home/home-sections";
import {
  AttentionSkeleton,
  DueTasksSkeleton,
  RecentSkeleton,
  StatTilesSkeleton,
  UpcomingSkeleton,
} from "@/components/home/home-skeletons";
import { ClaimNotice } from "@/components/referrals/claim-notice";
import { getOnboardingInput, getPipelineCounts } from "@/lib/data/dashboard";
import { isFirstSession } from "@/lib/home";

/**
 * Home streams. The header paints once the book has been counted; each
 * section fills in as its own data arrives, behind a skeleton of its own
 * shape. loading.tsx shows the same skeletons the instant Home is navigated
 * to. An account with no clients yet gets the first-session view instead:
 * the ways to bring clients in, not five panels of nothing.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string }>;
}) {
  const now = new Date();
  const [{ claimed }, counts] = await Promise.all([searchParams, getPipelineCounts()]);
  const notice = <ClaimNotice claimed={claimed} />;

  if (isFirstSession(counts.buyerTotal + counts.sellerTotal)) {
    return (
      <FirstSession notice={notice} onboarding={await getOnboardingInput()} now={now} />
    );
  }

  return (
    <HomeLayout
      notice={notice}
      header={<HomeHeader now={now} />}
      summary={
        <Suspense fallback={<StatTilesSkeleton />}>
          <SummarySection now={now} />
        </Suspense>
      }
      attention={
        <Suspense fallback={<AttentionSkeleton />}>
          <AttentionSection />
        </Suspense>
      }
      tasks={
        <Suspense fallback={<DueTasksSkeleton />}>
          <DueTasksSection now={now} />
        </Suspense>
      }
      upcoming={
        <Suspense fallback={<UpcomingSkeleton />}>
          <UpcomingSection now={now} />
        </Suspense>
      }
      recent={
        <Suspense fallback={<RecentSkeleton />}>
          <RecentSection now={now} />
        </Suspense>
      }
    />
  );
}
