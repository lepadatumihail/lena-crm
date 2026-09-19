import { getMyReferralOverview } from "@/lib/data/referrals";
import { ReferralsView } from "@/components/referrals/referrals-view";

export default async function ReferralsPage() {
  const overview = await getMyReferralOverview();
  return <ReferralsView overview={overview} />;
}
