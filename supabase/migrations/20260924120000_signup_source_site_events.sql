-- ============================================================
-- Where sign-ups come from, and an anonymous step log for the ad landings.
--
-- profiles.signup_source: the utm_* tags and landing path of the page an
-- agent signed up on, set once when the account is created. An email-code
-- sign-up passes it as user metadata (copied by handle_new_user below); a
-- Google sign-up through the auth callback, which fills it on a brand-new
-- profile only.
--
-- site_events: one row per funnel step on /start and /quiet (page seen,
-- sign-up opened, Google or a code tried, signed in, WhatsApp chosen). No
-- user id, no IP, no cookie. Written by /api/site-event and the auth
-- callback with the service role; RLS on and no policies, so nothing else
-- can read or write it.
-- ============================================================

alter table public.profiles
  add column signup_source jsonb
  constraint profiles_signup_source_shape check (
    signup_source is null
    or (jsonb_typeof(signup_source) = 'object' and pg_column_size(signup_source) <= 2048)
  );

comment on column public.profiles.signup_source is
  'utm_* tags and landing path of the page the agent signed up on; set once at account creation.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  source jsonb := new.raw_user_meta_data -> 'signup_source';
begin
  insert into public.profiles (id, email, full_name, signup_source)
  values (
    new.id,
    new.email,
    nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), ''),
    -- Metadata is client-supplied: keep it only if it is a small object.
    case
      when jsonb_typeof(source) = 'object' and pg_column_size(source) <= 2048 then source
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create table public.site_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event text not null check (
    event in ('landing_view', 'signup_open', 'google_start', 'code_sent', 'signed_in', 'whatsapp_click')
  ),
  path text check (char_length(path) <= 200),
  utm_source text check (char_length(utm_source) <= 100),
  utm_medium text check (char_length(utm_medium) <= 100),
  utm_campaign text check (char_length(utm_campaign) <= 100),
  utm_content text check (char_length(utm_content) <= 100),
  in_app boolean not null default false,
  mobile boolean not null default false
);

create index site_events_created_at_idx on public.site_events (created_at);

comment on table public.site_events is
  'Anonymous funnel steps on the ad landings. No user id, IP or cookie; service role only.';

alter table public.site_events enable row level security;
-- No policies on purpose: only the service role (which bypasses RLS) touches this table.
