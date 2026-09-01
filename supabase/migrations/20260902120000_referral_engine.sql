-- ============================================================
-- LeadWing — referral engine
--
--   * record_paid_invoice(user)  — counts a paid invoice for an invitee;
--                                  at the 2nd one the referral qualifies and
--                                  both sides get a 19 EUR credit (one free
--                                  month). Atomic, idempotent per invoice
--                                  when paired with stripe_events.
--   * void_referral(user)        — invitee cancelled before qualifying.
--   * stripe_events              — webhook idempotency ledger (event ids).
--
-- All three are service-role only, like the RPCs in the invites migration.
-- ============================================================

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

    insert into public.referral_credits (agent_id, amount_eur, reason, referral_id)
    values (v_ref.inviter_id, 19, 'referral_inviter', v_ref.id),
           (v_ref.invitee_id, 19, 'referral_invitee', v_ref.id);

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

revoke all on function public.record_paid_invoice(uuid) from public, anon, authenticated;
revoke all on function public.void_referral(uuid) from public, anon, authenticated;
grant execute on function public.record_paid_invoice(uuid) to service_role;
grant execute on function public.void_referral(uuid) to service_role;

-- Webhook idempotency: Stripe retries deliveries, so every handled event id
-- is recorded first and duplicates are skipped.
create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;
-- No policies on purpose: only the service role reads or writes this table.
