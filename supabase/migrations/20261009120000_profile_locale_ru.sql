-- ============================================================
-- Russian joins English and Spanish as a UI language. The column and the
-- set_locale function stay as 20260906140000_profile_locale.sql made them;
-- only the check widens. Existing rows ('en' / 'es') all still pass.
-- ============================================================
alter table public.profiles
  drop constraint if exists profiles_locale_check;
alter table public.profiles
  add constraint profiles_locale_check check (locale in ('en', 'es', 'ru'));
