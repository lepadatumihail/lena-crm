-- The founder is never capped in their own product: is_admin counts as Pro.
-- Mirrors isPro() in src/lib/access.ts.
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
      and (is_admin
           or subscription_status in ('active', 'past_due')
           or (pro_until is not null and pro_until > now()))
  );
$$;
