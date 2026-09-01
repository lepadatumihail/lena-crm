-- ============================================================
-- Lena CRM — profiles, invites, referrals, billing scaffold
--
-- Adds the account layer the CRM never had:
--   * profiles      — one row per agent (= auth.uid()); holds cohort,
--                     founding number, trial/subscription status.
--   * invites        — founder/founder-agent codes that grant Founding
--                     status + record a referral.
--   * referrals      — inviter→invitee link + reward state.
--   * referral_credits — ledger of free-month credits (the payout primitive).
--
-- Access model: open signup at €29 standard; an invite is a
-- "Founding upgrade + referral" token, NOT an access gate.
-- Trial = 7 days (DB flag), then a hard paywall. Mutations on these
-- tables go through the service-role client; authenticated users get
-- SELECT-only on their own rows.
-- ============================================================

-- ---------- Enums ----------
create type public.cohort as enum ('founding', 'standard');
create type public.invite_status as enum ('active', 'redeemed', 'revoked', 'expired');
create type public.referral_status as enum ('pending', 'qualified', 'rewarded', 'void');
create type public.sub_status as enum ('none', 'trialing', 'active', 'past_due', 'canceled');

-- ---------- Founding number allocator (only advanced for paying founders) ----------
create sequence public.founding_number_seq;

-- ============================================================
-- profiles — one row per agent. Existence is assumed for every
-- authenticated user (auto-created by the trigger below).
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade, -- = agent_id
  email text,
  full_name text,
  is_admin boolean not null default false,            -- the founder
  cohort public.cohort not null default 'standard',
  founding_intent boolean not null default false,     -- invited & claimed, not yet a paying founder
  founding_number integer unique,                     -- "Founding Agent #N", set at first payment
  invite_quota integer not null default 0,            -- becomes 3 once a founder; 0 for standard
  referred_by uuid references auth.users (id) on delete set null,
  stripe_customer_id text,
  subscription_status public.sub_status not null default 'none', -- THE status that gates access
  trial_ends_at timestamptz,                          -- now()+7d at signup; drives the paywall
  price_locked_eur numeric,                           -- 19 for founders
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- (founding_number is `unique`, which already provides its index)
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile + start the 7-day trial when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, subscription_status, trial_ends_at)
  values (new.id, new.email, 'trialing', now() + interval '7 days')
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- invites — codes a founder (or founding agent) hands out
-- ============================================================
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                          -- Crockford base32, generated app-side
  inviter_id uuid references auth.users (id) on delete set null, -- null = founder seed
  note text,
  status public.invite_status not null default 'active',
  redeemed_by uuid references auth.users (id) on delete set null,
  redeemed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);
create index invites_inviter_id_idx on public.invites (inviter_id);
create index invites_code_idx on public.invites (code);

-- ============================================================
-- referrals — inviter→invitee relationship + reward state
-- ============================================================
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users (id) on delete cascade,
  invitee_id uuid not null references auth.users (id) on delete cascade,
  invite_id uuid references public.invites (id) on delete set null,
  status public.referral_status not null default 'pending',
  paid_invoice_count integer not null default 0,      -- >=2 paid invoices = sustained payer
  qualified_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (invitee_id)                                 -- an agent can be referred once
);
create index referrals_inviter_id_idx on public.referrals (inviter_id);

-- ============================================================
-- referral_credits — ledger of free-month credits (payout primitive)
-- ============================================================
create table public.referral_credits (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references auth.users (id) on delete cascade,
  amount_eur numeric not null,                        -- 19.00 = one month
  reason text not null,                               -- 'referral_inviter' | 'referral_invitee' | 'manual_comp'
  referral_id uuid references public.referrals (id) on delete set null,
  applied_to_stripe boolean not null default false,
  stripe_balance_txn_id text,
  created_at timestamptz not null default now()
);
create index referral_credits_agent_id_idx on public.referral_credits (agent_id);
create index referral_credits_unapplied_idx
  on public.referral_credits (agent_id) where not applied_to_stripe;

-- ============================================================
-- RPCs — privileged, atomic. Called ONLY by the service-role client.
-- ============================================================

-- Redeem an invite for a just-signed-up user: grant founding intent +
-- record the referral. Idempotent. Returns a status string.
create or replace function public.claim_founding_invite(p_code text, p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.invites%rowtype;
begin
  select * into v_invite
  from public.invites
  where code = p_code
  for update;

  if not found
     or v_invite.status <> 'active'
     or v_invite.expires_at < now() then
    return 'invalid';
  end if;

  if v_invite.inviter_id is not null and v_invite.inviter_id = p_user_id then
    return 'self_referral';
  end if;

  -- idempotent: already claimed an invite, or already a founder-in-waiting
  if exists (select 1 from public.referrals where invitee_id = p_user_id)
     or exists (select 1 from public.profiles where id = p_user_id and founding_intent) then
    return 'already_claimed';
  end if;

  update public.invites
  set status = 'redeemed', redeemed_by = p_user_id, redeemed_at = now()
  where id = v_invite.id;

  update public.profiles
  set founding_intent = true,
      price_locked_eur = 19,
      referred_by = v_invite.inviter_id
  where id = p_user_id;

  if v_invite.inviter_id is not null then
    insert into public.referrals (inviter_id, invitee_id, invite_id, status)
    values (v_invite.inviter_id, p_user_id, v_invite.id, 'pending');
  end if;

  return 'claimed';
end;
$$;

-- Allocate the next Founding number to a paying agent, if the cohort of
-- 20 is not yet full. Serialized via advisory lock. Returns the number,
-- or null if the cohort is full / already allocated.
create or replace function public.allocate_founding_number(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_num integer;
begin
  perform pg_advisory_xact_lock(hashtext('lena_founding_alloc')::bigint);

  if (select count(*) from public.profiles where founding_number is not null) >= 20 then
    return null;
  end if;

  if not exists (
    select 1 from public.profiles
    where id = p_user_id and founding_intent and founding_number is null
  ) then
    return null;
  end if;

  v_num := nextval('public.founding_number_seq');

  update public.profiles
  set cohort = 'founding', founding_number = v_num, invite_quota = 3
  where id = p_user_id;

  return v_num;
end;
$$;

revoke all on function public.claim_founding_invite(text, uuid) from public, anon, authenticated;
revoke all on function public.allocate_founding_number(uuid) from public, anon, authenticated;
grant execute on function public.claim_founding_invite(text, uuid) to service_role;
grant execute on function public.allocate_founding_number(uuid) to service_role;

-- ============================================================
-- Row Level Security — read-own only; all writes via service role.
-- ============================================================
alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_credits enable row level security;

create policy "read own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "read own invites" on public.invites
  for select to authenticated
  using (inviter_id = (select auth.uid()));

create policy "read own referrals" on public.referrals
  for select to authenticated
  using (inviter_id = (select auth.uid()));

create policy "read own credits" on public.referral_credits
  for select to authenticated
  using (agent_id = (select auth.uid()));

-- ============================================================
-- Backfill: give existing users a profile (idempotent).
-- Flip the founder to admin manually after running, e.g.:
--   update public.profiles set is_admin = true where email = 'you@example.com';
-- ============================================================
insert into public.profiles (id, email, subscription_status, trial_ends_at)
select id, email, 'trialing', now() + interval '7 days'
from auth.users
on conflict (id) do nothing;
