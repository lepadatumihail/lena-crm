-- ============================================================
-- UI language per agent.
-- The NEXT_LOCALE cookie is the fast path for rendering; this column is the
-- durable copy: it restores the cookie on sign-in from a new device and feeds
-- server jobs that run without a request (the calendar feed).
-- ============================================================
alter table public.profiles
  add column if not exists locale text not null default 'en';

alter table public.profiles
  drop constraint if exists profiles_locale_check;
alter table public.profiles
  add constraint profiles_locale_check check (locale in ('en', 'es'));

-- Agents cannot update their own profile row (only "read own profile" exists,
-- and a blanket update policy would expose plan/admin columns), so the switch
-- goes through a definer function that touches this one column.
create or replace function public.set_locale(p_locale text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.profiles set locale = p_locale where id = auth.uid();
$$;

revoke all on function public.set_locale(text) from public, anon;
grant execute on function public.set_locale(text) to authenticated;
