-- ============================================================
-- Calendar (appointments) + notification center
--
-- appointments: scheduled future events (meetings & viewings).
--   Distinct from buyer "viewings", which are historical records
--   of properties a buyer has already seen.
-- notifications: in-app notification feed. Rows are generated
--   lazily on app load by syncNotifications(); dedupe_key keeps
--   them idempotent. read_at tracks dismissal.
-- ============================================================

create type public.appointment_type as enum ('meeting', 'viewing');
create type public.notification_type as enum (
  'appointment_reminder',
  'appointment_today',
  'follow_up',
  'reservation_date',
  'stalled_offer'
);

-- ---------- appointments ----------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type public.appointment_type not null,
  title text,
  -- meeting: the client; viewing: the buyer
  client_id uuid references public.clients (id) on delete set null,
  -- viewing: a saved listing (optional)…
  property_id uuid references public.properties (id) on delete set null,
  -- …or a free-text address when it isn't one of the agent's listings
  property_label text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  notes text,
  reminder_minutes integer, -- null = no reminder; else minutes before starts_at
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index appointments_agent_id_idx on public.appointments (agent_id);
create index appointments_agent_starts_idx on public.appointments (agent_id, starts_at);
create index appointments_client_id_idx on public.appointments (client_id);
create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- ---------- notifications ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  client_id uuid references public.clients (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete cascade,
  -- stable key per logical notification so re-sync is idempotent
  dedupe_key text not null,
  due_at timestamptz not null default now(),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index notifications_agent_dedupe_idx
  on public.notifications (agent_id, dedupe_key);
create index notifications_agent_due_idx
  on public.notifications (agent_id, due_at desc);
create index notifications_agent_unread_idx
  on public.notifications (agent_id) where read_at is null;

-- ---------- RLS ----------
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;

create policy "agent owns appointments" on public.appointments
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));

create policy "agent owns notifications" on public.notifications
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));
