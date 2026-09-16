-- ============================================================
-- Free tier: 10 clients (was 3), every row counts (inactive too).
-- Mirrors FREE_CLIENT_LIMIT in src/lib/access.ts. The app checks first and
-- shows the upgrade prompt; this is the backstop. Same body as
-- 20260906120000_billing_referrals.sql apart from the number.
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
  if v_count >= 10 then
    raise exception 'client_limit_reached'
      using hint = 'The Free plan allows 10 clients. Pro is unlimited.';
  end if;
  return new;
end;
$$;
