import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFounderCount, inviteQuota } from "@/lib/referrals/engine";
import { inviteState, type InviteState, type ReferralStatus } from "@/lib/invites";
import type { Invite, Profile, Referral, ReferralCredit } from "@/lib/supabase/types";

export type InviteRow = Invite & {
  state: InviteState;
  redeemedBy: { email: string | null; name: string | null } | null;
  referralStatus: ReferralStatus | null;
  paidInvoices: number;
};

export type ReferralOverview = {
  userId: string;
  email: string;
  profile: Profile | null;
  invites: InviteRow[];
  credits: ReferralCredit[];
  totalCreditEur: number;
  unappliedCreditEur: number;
  quota: { quota: number; used: number; remaining: number };
  referredBy: { email: string | null; name: string | null } | null;
  founderCount: number;
};

/** Everything the signed-in agent's invites page needs, scoped to that agent. */
export async function getMyReferralOverview(): Promise<ReferralOverview> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const [profileRes, invitesRes, referralsRes, creditsRes, quota, founderCount, myReferralRes] =
    await Promise.all([
      admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      admin.from("invites").select("*").eq("inviter_id", user.id).order("created_at"),
      admin.from("referrals").select("*").eq("inviter_id", user.id),
      admin.from("referral_credits").select("*").eq("agent_id", user.id).order("created_at"),
      inviteQuota(user.id, admin),
      getFounderCount(admin),
      admin.from("referrals").select("inviter_id").eq("invitee_id", user.id).maybeSingle(),
    ]);

  const invites = invitesRes.data ?? [];
  const referrals = referralsRes.data ?? [];
  const peopleIds = [
    ...invites.map((i) => i.redeemed_by),
    myReferralRes.data?.inviter_id ?? null,
  ].filter((id): id is string => Boolean(id));
  const people = peopleIds.length
    ? (await admin.from("profiles").select("id, email, full_name").in("id", peopleIds)).data ?? []
    : [];
  const person = (id: string | null) => {
    const p = id ? people.find((x) => x.id === id) : null;
    return p ? { email: p.email, name: p.full_name } : null;
  };
  const referralFor = (invite: Invite): Referral | null =>
    referrals.find((r) => r.invite_id === invite.id) ??
    referrals.find((r) => r.invitee_id === invite.redeemed_by) ??
    null;

  const rows: InviteRow[] = invites.map((invite) => {
    const referral = referralFor(invite);
    return {
      ...invite,
      state: inviteState(invite, referral?.status ?? null),
      redeemedBy: person(invite.redeemed_by),
      referralStatus: referral?.status ?? null,
      paidInvoices: referral?.paid_invoice_count ?? 0,
    };
  });

  const credits = creditsRes.data ?? [];
  const sum = (list: ReferralCredit[]) => list.reduce((acc, c) => acc + Number(c.amount_eur), 0);

  return {
    userId: user.id,
    email: user.email ?? "",
    profile: profileRes.data ?? null,
    invites: rows,
    credits,
    totalCreditEur: sum(credits),
    unappliedCreditEur: sum(credits.filter((c) => !c.applied_to_stripe)),
    quota,
    referredBy: person(myReferralRes.data?.inviter_id ?? null),
    founderCount,
  };
}

export type AdminOverview = {
  founderCount: number;
  profiles: Profile[];
  invites: (Invite & { inviterEmail: string | null; redeemedEmail: string | null })[];
  referrals: (Referral & { inviterEmail: string | null; inviteeEmail: string | null })[];
  credits: (ReferralCredit & { agentEmail: string | null })[];
};

/** Whole-system view for the founder. Caller must have verified is_admin. */
export async function getAdminOverview(): Promise<AdminOverview> {
  const admin = createAdminClient();
  const [profilesRes, invitesRes, referralsRes, creditsRes, founderCount] = await Promise.all([
    admin.from("profiles").select("*").order("created_at"),
    admin.from("invites").select("*").order("created_at", { ascending: false }),
    admin.from("referrals").select("*").order("created_at", { ascending: false }),
    admin.from("referral_credits").select("*").order("created_at", { ascending: false }),
    getFounderCount(admin),
  ]);
  const profiles = profilesRes.data ?? [];
  const email = (id: string | null) => profiles.find((p) => p.id === id)?.email ?? null;
  return {
    founderCount,
    profiles,
    invites: (invitesRes.data ?? []).map((i) => ({
      ...i,
      inviterEmail: email(i.inviter_id),
      redeemedEmail: email(i.redeemed_by),
    })),
    referrals: (referralsRes.data ?? []).map((r) => ({
      ...r,
      inviterEmail: email(r.inviter_id),
      inviteeEmail: email(r.invitee_id),
    })),
    credits: (creditsRes.data ?? []).map((c) => ({ ...c, agentEmail: email(c.agent_id) })),
  };
}
