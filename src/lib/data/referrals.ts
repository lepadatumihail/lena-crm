import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFounderCount } from "@/lib/referrals/engine";
import { referralState, referralUrl, type ReferralState } from "@/lib/referrals/links";
import type { Profile, Referral, ReferralCredit } from "@/lib/supabase/types";

export type ReferredAgent = {
  id: string;
  name: string | null;
  email: string | null;
  state: ReferralState;
  paidInvoices: number;
  joinedAt: string;
};

export type ReferralOverview = {
  userId: string;
  email: string;
  profile: Profile | null;
  referralUrl: string | null;
  referred: ReferredAgent[];
  credits: ReferralCredit[];
  /** Free months earned so far, however they were delivered. */
  monthsEarned: number;
  /** Balance credits not yet pushed to Stripe (no customer yet, or Stripe not configured). */
  unappliedCreditEur: number;
  referredBy: { email: string | null; name: string | null } | null;
  founderCount: number;
};

/** Everything the signed-in agent's referrals page needs, scoped to that agent. */
export async function getMyReferralOverview(): Promise<ReferralOverview> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const [profileRes, referralsRes, creditsRes, founderCount, myReferralRes] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    admin.from("referrals").select("*").eq("inviter_id", user.id).order("created_at"),
    admin.from("referral_credits").select("*").eq("agent_id", user.id).order("created_at"),
    getFounderCount(admin),
    admin.from("referrals").select("inviter_id").eq("invitee_id", user.id).maybeSingle(),
  ]);

  const profile = profileRes.data ?? null;
  const referrals: Referral[] = referralsRes.data ?? [];
  const peopleIds = [
    ...referrals.map((r) => r.invitee_id),
    myReferralRes.data?.inviter_id ?? null,
  ].filter((id): id is string => Boolean(id));
  const people = peopleIds.length
    ? ((await admin.from("profiles").select("id, email, full_name").in("id", peopleIds)).data ?? [])
    : [];
  const person = (id: string | null) => {
    const p = id ? people.find((x) => x.id === id) : null;
    return p ? { email: p.email, name: p.full_name } : null;
  };

  const referred: ReferredAgent[] = referrals.map((r) => {
    const who = person(r.invitee_id);
    return {
      id: r.id,
      name: who?.name ?? null,
      email: who?.email ?? null,
      state: referralState(r),
      paidInvoices: r.paid_invoice_count,
      joinedAt: r.created_at,
    };
  });

  const credits = creditsRes.data ?? [];
  const unappliedCreditEur = credits
    .filter((c) => c.kind === "stripe_balance" && !c.applied_to_stripe)
    .reduce((acc, c) => acc + Number(c.amount_eur), 0);

  return {
    userId: user.id,
    email: user.email ?? "",
    profile,
    referralUrl: profile ? referralUrl(profile.referral_code) : null,
    referred,
    credits,
    monthsEarned: credits.reduce((acc, c) => acc + c.months, 0),
    unappliedCreditEur,
    referredBy: person(myReferralRes.data?.inviter_id ?? null),
    founderCount,
  };
}

export type AdminOverview = {
  founderCount: number;
  profiles: (Profile & { clientCount: number })[];
  referrals: (Referral & { inviterEmail: string | null; inviteeEmail: string | null })[];
  credits: (ReferralCredit & { agentEmail: string | null })[];
};

/** Whole-system view for the founder. Caller must have verified is_admin. */
export async function getAdminOverview(): Promise<AdminOverview> {
  const admin = createAdminClient();
  const [profilesRes, referralsRes, creditsRes, clientsRes, founderCount] = await Promise.all([
    admin.from("profiles").select("*").order("created_at"),
    admin.from("referrals").select("*").order("created_at", { ascending: false }),
    admin.from("referral_credits").select("*").order("created_at", { ascending: false }),
    admin.from("clients").select("agent_id"),
    getFounderCount(admin),
  ]);
  const profiles = profilesRes.data ?? [];
  const email = (id: string | null) => profiles.find((p) => p.id === id)?.email ?? null;
  const clientCounts = new Map<string, number>();
  for (const row of clientsRes.data ?? []) {
    clientCounts.set(row.agent_id, (clientCounts.get(row.agent_id) ?? 0) + 1);
  }
  return {
    founderCount,
    profiles: profiles.map((p) => ({ ...p, clientCount: clientCounts.get(p.id) ?? 0 })),
    referrals: (referralsRes.data ?? []).map((r) => ({
      ...r,
      inviterEmail: email(r.inviter_id),
      inviteeEmail: email(r.invitee_id),
    })),
    credits: (creditsRes.data ?? []).map((c) => ({ ...c, agentEmail: email(c.agent_id) })),
  };
}
