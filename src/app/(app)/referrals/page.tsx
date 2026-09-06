import { getMyReferralOverview } from "@/lib/data/referrals";
import { ReferralsView } from "@/components/referrals/referrals-view";

export default async function ReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string }>;
}) {
  const [{ claimed }, overview] = await Promise.all([searchParams, getMyReferralOverview()]);
  return <ReferralsView overview={overview} claimed={claimed} />;
}
