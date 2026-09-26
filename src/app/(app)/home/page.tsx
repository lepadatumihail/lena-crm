import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";

import { FirstSession } from "@/components/home/first-session";
import { RememberOnboarding } from "@/components/home/getting-started-strip";
import { HomeHeader } from "@/components/home/home-header";
import { HomeLayout } from "@/components/home/home-layout";
import {
  AttentionSection,
  DueTasksSection,
  OnboardingSection,
  RecentSection,
  SummarySection,
  UpcomingSection,
} from "@/components/home/home-sections";
import {
  AttentionSkeleton,
  DueTasksSkeleton,
  OnboardingStripSkeleton,
  RecentSkeleton,
  StatTilesSkeleton,
  UpcomingSkeleton,
} from "@/components/home/home-skeletons";
import { ClaimNotice } from "@/components/referrals/claim-notice";
import { getPipelineCounts } from "@/lib/data/dashboard";
import { getSessionUser } from "@/lib/data/session";
import {
  HOME_ONBOARDING_COOKIE,
  isFirstSession,
  ONBOARDING_CLIENT_CAP,
  onboardingState,
} from "@/lib/home";

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
  const [{ claimed }, counts, cookieStore, user] = await Promise.all([
    searchParams,
    getPipelineCounts(),
    cookies(),
    getSessionUser(),
  ]);
  const notice = <ClaimNotice claimed={claimed} />;
  const clientCount = counts.buyerTotal + counts.sellerTotal;

  // Getting started is a one-line strip for young books. The cookie says
  // whether this agent closed it on this device or saw it finished; the
  // client count is known already. Only a strip that will show gets its
  // place held while the checklist's counts load, so nothing below it moves.
  // A book that has outgrown it is remembered as done, even after a close,
  // so loading.tsx stops drawing its skeleton and the account menu stops
  // offering it back. A closed strip is still checked quietly, for the same
  // reason, once its steps are finished.
  const onboarding = onboardingState(cookieStore.get(HOME_ONBOARDING_COOKIE)?.value, user?.id);
  let onboardingSlot: ReactNode = null;
  if (clientCount >= ONBOARDING_CLIENT_CAP) {
    if (onboarding !== "done") onboardingSlot = <RememberOnboarding value="done" />;
  } else if (onboarding === undefined) {
    onboardingSlot = (
      <Suspense fallback={<OnboardingStripSkeleton />}>
        <OnboardingSection />
      </Suspense>
    );
  } else if (onboarding === "hidden") {
    onboardingSlot = (
      <Suspense fallback={null}>
        <OnboardingSection hidden />
      </Suspense>
    );
  }

  if (isFirstSession(clientCount)) {
    return <FirstSession notice={notice} onboarding={onboardingSlot} now={now} />;
  }

  return (
    <HomeLayout
      notice={notice}
      header={<HomeHeader now={now} />}
      onboarding={onboardingSlot}
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
