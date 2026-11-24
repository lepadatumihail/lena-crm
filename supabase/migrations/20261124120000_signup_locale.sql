-- ============================================================
-- A new account keeps the language of the page it signed up on.
-- Until now every profile started on the column default ('en'), and signing
-- in copies the profile's language into the NEXT_LOCALE cookie, so someone
-- who signed up from /es or /ru landed in an English app (and got English
-- voice-note summaries and calendar entries).
--
-- An email-code sign-up sends the page's language in its user metadata,
-- which Supabase keeps only when the call creates the user; this trigger
-- copies it onto the profile. A Google sign-up can't carry metadata: the auth
-- callback sets it instead (src/app/auth/callback/route.ts).
--
-- Unchanged otherwise from 20260924120000_signup_source_site_events.sql.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  source jsonb := new.raw_user_meta_data -> 'signup_source';
  wanted text := new.raw_user_meta_data ->> 'locale';
begin
  insert into public.profiles (id, email, full_name, signup_source, locale)
  values (
    new.id,
    new.email,
    nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), ''),
    -- Metadata is client-supplied: keep it only if it is a small object.
    case
      when jsonb_typeof(source) = 'object' and pg_column_size(source) <= 2048 then source
    end,
    -- Also client-supplied. Anything profiles_locale_check would reject falls
    -- back to English rather than failing the sign-up; keep this list in step
    -- with that constraint and LOCALES in src/i18n/config.ts.
    case when wanted in ('en', 'es', 'ru') then wanted else 'en' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
