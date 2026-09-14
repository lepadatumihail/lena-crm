-- ============================================================
-- Agent settings: the name the app greets them by and the time zone their
-- day runs in.
-- `time_zone` is an IANA name ("Europe/Madrid"). Null means the agent never
-- chose one and the app uses its default (Europe/Madrid), so existing rows
-- need no backfill.
-- ============================================================
alter table public.profiles
  add column if not exists time_zone text;

-- Agents cannot update their own profile row directly (see
-- 20260906140000_profile_locale.sql), so the settings page writes through a
-- definer function that touches exactly these two columns.
create or replace function public.update_my_settings(
  p_full_name text,
  p_time_zone text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_time_zone is not null and not exists (
    select 1 from pg_catalog.pg_timezone_names where name = p_time_zone
  ) then
    raise exception 'unknown time zone %', p_time_zone using errcode = '22023';
  end if;

  update public.profiles
     set full_name = nullif(left(btrim(coalesce(p_full_name, '')), 80), ''),
         time_zone = p_time_zone
   where id = auth.uid();
end;
$$;

revoke all on function public.update_my_settings(text, text) from public, anon;
grant execute on function public.update_my_settings(text, text) to authenticated;
