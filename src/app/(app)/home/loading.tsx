import { IfOnboardingExpected } from "@/components/home/getting-started-strip";
import { HomeHeader } from "@/components/home/home-header";
import { HomeLayout } from "@/components/home/home-layout";
import {
  AttentionSkeleton,
  DueTasksSkeleton,
  OnboardingStripSkeleton,
  RecentSkeleton,
  StatTilesSkeleton,
  UpcomingSkeleton,
} from "@/components/home/home-skeletons";

/**
 * What Home looks like the moment it is navigated to: the real header and a
 * skeleton for every section, identical to the page's own fallbacks, so the
 * page swapping in changes nothing until data does. The getting-started
 * strip's place is held only while this device still expects the strip.
 */
export default async function Loading() {
  return (
    <HomeLayout
      header={<HomeHeader now={new Date()} />}
      onboarding={
        <IfOnboardingExpected>
          <OnboardingStripSkeleton />
        </IfOnboardingExpected>
      }
      summary={<StatTilesSkeleton />}
      attention={<AttentionSkeleton />}
      tasks={<DueTasksSkeleton />}
      upcoming={<UpcomingSkeleton />}
      recent={<RecentSkeleton />}
    />
  );
}
