import { Suspense } from "react";

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

/**
 * Home streams. The header paints with the first byte; each section fills in
 * as its own data arrives, behind a skeleton of its own shape. loading.tsx
 * shows the same skeletons the instant Home is navigated to.
 */
export default async function HomePage() {
  const now = new Date();
  return (
    <HomeLayout
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
