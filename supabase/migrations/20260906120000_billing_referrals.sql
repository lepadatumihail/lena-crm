-- ============================================================
-- LeadWing — accounts, billing (Free + Pro), founding cohort, referrals
--
-- Replaces the never-applied 20260625 invites_referrals and 20260902
-- referral_engine migrations. Decision record: plans/free-pro-pricing.md.
--
--   * profiles         — one row per agent (= auth.uid()): Stripe mirror,
--                        plan, founding number, referral code, comped Pro.
--   * Free tier        — 3 clients max (every row counts), enforced by a
--                        trigger on clients. Nothing is ever deleted; only
--                        adding a client is blocked over the cap.
--   * referrals        — who referred whom + reward state.
--   * referral_credits — reward ledger. A subscriber's free month is a
--                        Stripe balance credit; anyone else's is Pro time
--                        granted from the backend (pro_until).
--   * stripe_events    — webhook idempotency.
--
-- Every mutation on these tables goes through the service-role client;
-- authenticated users get SELECT on their own rows only.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- Enums ----------
create type public.cohort as enum ('founding', 'standard');
create type public.referral_status as enum ('pending', 'qualified', 'rewarded', 'void');
create type public.sub_status as enum ('none', 'active', 'past_due', 'canceled');
create type public.billing_plan as enum (
  'founding_monthly', 'founding_yearly', 'standard_monthly', 'standard_yearly'
);
create type public.credit_kind as enum ('stripe_balance', 'pro_time');

-- Founding numbers: only ever advanced for a paying agent.
create sequence public.founding_number_seq;

-- ---------- Referral code: 8 chars of Crockford base32 (no I, L, O, U) ----------
create or replace function public.generate_referral_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  bytes bytea := extensions.gen_random_bytes(8);
  code text := '';
  i integer;
begin
  for i in 0..7 loop
    code := code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return code;
end;
$$;

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
  founding_number integer unique,                     -- "Founding Agent #N", set at first payment
  referral_code text not null unique default public.generate_referral_code(),
  referred_by uuid references auth.users (id) on delete set null,
  stripe_customer_id text,
  subscription_status public.sub_status not null default 'none',
  plan public.billing_plan,                           -- null on Free
  plan_monthly_eur numeric,                           -- 19 / 15 / 29 / 23: what "one free month" is worth
  pro_until timestamptz,                              -- comped Pro (referral reward or admin comp)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_stripe_customer_idx on public.profiles (stripe_customer_id);
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile when a user signs up. No trial: everyone starts on Free.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Pro = a live subscription (dunning included) or comped time still running.
-- ============================================================
create or replace function public.is_pro(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id
      and (subscription_status in ('active', 'past_due')
           or (pro_until is not null and pro_until > now()))
  );
$$;

-- ============================================================
-- Free tier: 3 clients, every row counts (inactive too). The app checks
-- first and shows the upgrade prompt; this is the backstop.
-- ============================================================
create or replace function public.enforce_free_client_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  -- Serialise per agent so two concurrent inserts can't both squeeze under the cap.
  perform 1 from public.profiles where id = new.agent_id for update;

  if public.is_pro(new.agent_id) then
    return new;
  end if;

  select count(*) into v_count from public.clients where agent_id = new.agent_id;
  if v_count >= 3 then
    raise exception 'client_limit_reached'
      using hint = 'The Free plan allows 3 clients. Pro is unlimited.';
  end if;
  return new;
end;
$$;
create trigger clients_enforce_free_limit
  before insert on public.clients
  for each row execute function public.enforce_free_client_limit();

-- ============================================================
-- referrals — inviter→invitee relationship + reward state
-- ============================================================
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users (id) on delete cascade,
  invitee_id uuid not null references auth.users (id) on delete cascade,
  status public.referral_status not null default 'pending',
  paid_invoice_count integer not null default 0,      -- >= 2 paid invoices = sustained payer
  qualified_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (invitee_id)                                 -- an agent can be referred once
);
create index referrals_inviter_id_idx on public.referrals (inviter_id);

-- ============================================================
-- referral_credits — the reward ledger
--   stripe_balance: amount_eur is pushed to the Stripe customer balance by
--                   the app (applied_to_stripe flips once it is).
--   pro_time:       months of Pro already added to profiles.pro_until.
-- ============================================================
create table public.referral_credits (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references auth.users (id) on delete cascade,
  kind public.credit_kind not null,
  amount_eur numeric not null default 0,
  months integer not null default 1,
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
-- stripe_events — webhook idempotency: Stripe retries deliveries, so every
-- handled event id is recorded first and duplicates are skipped.
-- ============================================================
create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

-- ============================================================
-- RPCs — privileged, atomic. Called ONLY by the service-role client.
-- ============================================================

-- Record who referred a just-signed-up agent. Idempotent. Returns a status.
create or replace function public.claim_referral(p_code text, p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inviter uuid;
  v_me public.profiles%rowtype;
begin
  select id into v_inviter from public.profiles where referral_code = p_code;
  if v_inviter is null then
    return 'invalid';
  end if;
  if v_inviter = p_user_id then
    return 'self_referral';
  end if;
  if exists (select 1 from public.referrals where invitee_id = p_user_id) then
    return 'already_claimed';
  end if;

  -- Referral links are for new accounts: no Stripe customer yet, signed up today.
  select * into v_me from public.profiles where id = p_user_id;
  if not found
     or v_me.stripe_customer_id is not null
     or v_me.created_at < now() - interval '1 day' then
    return 'not_eligible';
  end if;

  update public.profiles set referred_by = v_inviter where id = p_user_id;
  insert into public.referrals (inviter_id, invitee_id) values (v_inviter, p_user_id);
  return 'claimed';
end;
$$;

-- Allocate the next Founding number to a paying agent while the cohort of
-- 20 has room. Serialised via advisory lock. Returns the number (existing
-- one if already allocated), or null when the cohort is full.
create or replace function public.allocate_founding_number(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_num integer;
begin
  perform pg_advisory_xact_lock(hashtext('leadwing_founding_alloc')::bigint);

  if not exists (select 1 from public.profiles where id = p_user_id) then
    return null;
  end if;

  select founding_number into v_num from public.profiles where id = p_user_id;
  if v_num is not null then
    return v_num;
  end if;

  if (select count(*) from public.profiles where founding_number is not null) >= 20 then
    return null;
  end if;

  v_num := nextval('public.founding_number_seq');
  update public.profiles
  set cohort = 'founding', founding_number = v_num
  where id = p_user_id;
  return v_num;
end;
$$;

-- Comp Pro time from the backend: extends pro_until and writes a ledger row.
-- Returns the new pro_until.
create or replace function public.grant_pro_time(
  p_user_id uuid,
  p_months integer,
  p_reason text,
  p_referral_id uuid default null
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_until timestamptz;
begin
  if p_months is null or p_months < 1 or p_months > 24 then
    raise exception 'invalid_months';
  end if;

  update public.profiles
  set pro_until = greatest(coalesce(pro_until, now()), now()) + make_interval(months => p_months)
  where id = p_user_id
  returning pro_until into v_until;
  if not found then
    raise exception 'profile_not_found';
  end if;

  insert into public.referral_credits
    (agent_id, kind, amount_eur, months, reason, referral_id, applied_to_stripe)
  values
    (p_user_id, 'pro_time', 0, p_months, p_reason, p_referral_id, true);

  return v_until;
end;
$$;

-- One free month, delivered the right way for this agent:
--   subscriber with a Stripe customer → balance credit worth a month of their plan
--   everyone else                     → a month of Pro from the backend
create or replace function public.grant_free_month(
  p_user_id uuid,
  p_reason text,
  p_referral_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
begin
  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    return;
  end if;

  if v_profile.subscription_status in ('active', 'past_due')
     and v_profile.stripe_customer_id is not null then
    insert into public.referral_credits (agent_id, kind, amount_eur, months, reason, referral_id)
    values (p_user_id, 'stripe_balance', coalesce(v_profile.plan_monthly_eur, 29), 1, p_reason, p_referral_id);
  else
    perform public.grant_pro_time(p_user_id, 1, p_reason, p_referral_id);
  end if;
end;
$$;

-- Count a paid invoice for a referred agent. At the 2nd one the referral
-- qualifies and both sides get a free month, exactly once.
create or replace function public.record_paid_invoice(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ref public.referrals%rowtype;
  v_rewarded boolean := false;
begin
  select * into v_ref
  from public.referrals
  where invitee_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('status', 'none', 'paid_invoice_count', 0, 'rewarded', false);
  end if;

  if v_ref.status in ('rewarded', 'void') then
    return jsonb_build_object(
      'status', v_ref.status, 'paid_invoice_count', v_ref.paid_invoice_count, 'rewarded', false);
  end if;

  update public.referrals
  set paid_invoice_count = paid_invoice_count + 1
  where id = v_ref.id
  returning * into v_ref;

  -- Renewed once = a sustained payer. Reward both sides exactly once.
  if v_ref.paid_invoice_count >= 2 then
    update public.referrals
    set status = 'qualified', qualified_at = coalesce(qualified_at, now())
    where id = v_ref.id;

    perform public.grant_free_month(v_ref.inviter_id, 'referral_inviter', v_ref.id);
    perform public.grant_free_month(v_ref.invitee_id, 'referral_invitee', v_ref.id);

    update public.referrals
    set status = 'rewarded', rewarded_at = now()
    where id = v_ref.id
    returning * into v_ref;

    v_rewarded := true;
  end if;

  return jsonb_build_object(
    'status', v_ref.status, 'paid_invoice_count', v_ref.paid_invoice_count, 'rewarded', v_rewarded);
end;
$$;

-- The referred agent cancelled before qualifying: the referral is void.
create or replace function public.void_referral(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.referrals
  set status = 'void'
  where invitee_id = p_user_id
    and status in ('pending', 'qualified');
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.is_pro(uuid) from public, anon, authenticated;
revoke all on function public.claim_referral(text, uuid) from public, anon, authenticated;
revoke all on function public.allocate_founding_number(uuid) from public, anon, authenticated;
revoke all on function public.grant_pro_time(uuid, integer, text, uuid) from public, anon, authenticated;
revoke all on function public.grant_free_month(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.record_paid_invoice(uuid) from public, anon, authenticated;
revoke all on function public.void_referral(uuid) from public, anon, authenticated;
grant execute on function public.is_pro(uuid) to service_role;
grant execute on function public.claim_referral(text, uuid) to service_role;
grant execute on function public.allocate_founding_number(uuid) to service_role;
grant execute on function public.grant_pro_time(uuid, integer, text, uuid) to service_role;
grant execute on function public.grant_free_month(uuid, text, uuid) to service_role;
grant execute on function public.record_paid_invoice(uuid) to service_role;
grant execute on function public.void_referral(uuid) to service_role;

-- ============================================================
-- Row Level Security — read-own only; all writes via service role.
-- ============================================================
alter table public.profiles enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_credits enable row level security;
alter table public.stripe_events enable row level security; -- no policies on purpose

create policy "read own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "read own referrals" on public.referrals
  for select to authenticated
  using (inviter_id = (select auth.uid()) or invitee_id = (select auth.uid()));

create policy "read own credits" on public.referral_credits
  for select to authenticated
  using (agent_id = (select auth.uid()));

-- ============================================================
-- Backfill: give existing users a profile (idempotent). They start on Free.
-- Flip the founder to admin by hand afterwards, e.g.:
--   update public.profiles set is_admin = true where email = 'you@example.com';
-- ============================================================
insert into public.profiles (id, email, full_name)
select
  id,
  email,
  nullif(coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'), '')
from auth.users
on conflict (id) do nothing;
