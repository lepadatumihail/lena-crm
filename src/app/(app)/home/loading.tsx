import { HomeHeader } from "@/components/home/home-header";
import { HomeLayout } from "@/components/home/home-layout";
import {
  AttentionSkeleton,
  RecentSkeleton,
  StatTilesSkeleton,
  UpcomingSkeleton,
} from "@/components/home/home-skeletons";

/**
 * What Home looks like the moment it is navigated to: the real header and a
 * skeleton for every section, identical to the page's own fallbacks, so the
 * page swapping in changes nothing until data does.
 */
export default async function Loading() {
  return (
    <HomeLayout
      header={<HomeHeader now={new Date()} />}
      summary={<StatTilesSkeleton />}
      attention={<AttentionSkeleton />}
      upcoming={<UpcomingSkeleton />}
      recent={<RecentSkeleton />}
    />
  );
}
