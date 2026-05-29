-- Commission + closing tracking on buyer reservations.
alter table public.reservations
  add column if not exists commission numeric,
  add column if not exists closed_at date;
