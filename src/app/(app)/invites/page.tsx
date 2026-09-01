import { getMyReferralOverview } from "@/lib/data/referrals";
import { InvitesView } from "@/components/invites/invites-view";

export default async function InvitesPage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string }>;
}) {
  const [{ claimed }, overview] = await Promise.all([searchParams, getMyReferralOverview()]);
  return <InvitesView overview={overview} claimed={claimed} />;
}
