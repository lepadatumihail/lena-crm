-- ============================================================
-- Lena CRM — initial schema
--
-- Tenancy model: one tenant = one independent agent.
-- Every row is owned by agent_id (defaults to auth.uid()).
-- RLS on every table enforces agent_id = auth.uid().
-- ============================================================

-- ---------- Enums ----------
create type public.client_side as enum ('buyer', 'seller');
create type public.deal_type as enum ('direct', 'collab');
create type public.seller_role as enum ('owner', 'representative');
create type public.viewing_attachment_kind as enum ('window_card', 'image');
create type public.email_provider as enum ('google', 'microsoft', 'resend');
create type public.email_account_status as enum ('connected', 'disconnected', 'error');
create type public.scheduled_email_status as enum ('pending', 'sent', 'failed', 'cancelled');

-- ---------- updated_at trigger helper ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- clients (buyers + sellers share contact fields)
-- ============================================================
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  side public.client_side not null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  language text,
  nationality text,
  notes text,
  priority boolean not null default false,
  is_active boolean not null default true,
  agency text,
  stage text not null,
  deal_type public.deal_type,
  seller_role public.seller_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_stage_valid check (
    (side = 'buyer'
      and stage = any (array['new', 'contacted', 'qualified', 'viewing', 'reserved']))
    or (side = 'seller'
      and stage = any (array['pending', 'qualified']))
  )
);
create index clients_agent_id_idx on public.clients (agent_id);
create index clients_agent_side_idx on public.clients (agent_id, side);
create index clients_agent_stage_idx on public.clients (agent_id, stage);
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ============================================================
-- buyer_preferences (1:1 with a buyer client, unlocked at "qualified")
-- ============================================================
create table public.buyer_preferences (
  client_id uuid primary key references public.clients (id) on delete cascade,
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  property_types text[] not null default '{}',
  budget_min numeric,
  budget_max numeric,
  bedrooms integer,
  bathrooms integer,
  area_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index buyer_preferences_agent_id_idx on public.buyer_preferences (agent_id);
create trigger buyer_preferences_set_updated_at
  before update on public.buyer_preferences
  for each row execute function public.set_updated_at();

-- ============================================================
-- viewings (many per buyer, unlocked at "viewing")
-- ============================================================
create table public.viewings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text,
  description text,
  had_offer boolean not null default false,
  offer_price numeric,
  property_price numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index viewings_client_id_idx on public.viewings (client_id);
create index viewings_agent_id_idx on public.viewings (agent_id);
create index viewings_agent_offer_idx on public.viewings (agent_id, had_offer);
create trigger viewings_set_updated_at
  before update on public.viewings
  for each row execute function public.set_updated_at();

-- ============================================================
-- viewing_attachments (window-card PDFs and/or images per viewing)
-- ============================================================
create table public.viewing_attachments (
  id uuid primary key default gen_random_uuid(),
  viewing_id uuid not null references public.viewings (id) on delete cascade,
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size bigint,
  kind public.viewing_attachment_kind not null,
  created_at timestamptz not null default now()
);
create index viewing_attachments_viewing_id_idx on public.viewing_attachments (viewing_id);
create index viewing_attachments_agent_id_idx on public.viewing_attachments (agent_id);

-- ============================================================
-- reservations (1:1 with a buyer client, unlocked at "reserved")
-- ============================================================
create table public.reservations (
  client_id uuid primary key references public.clients (id) on delete cascade,
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  down_payment numeric,
  down_payment_date date,
  ppc numeric,
  ppc_date date,
  notary_date date,
  notary_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reservations_agent_id_idx on public.reservations (agent_id);
create trigger reservations_set_updated_at
  before update on public.reservations
  for each row execute function public.set_updated_at();

-- ============================================================
-- properties (many per seller client, unlocked at seller "qualified")
-- ============================================================
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  price numeric,
  bedrooms integer,
  property_type text,
  address text,
  city text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index properties_client_id_idx on public.properties (client_id);
create index properties_agent_id_idx on public.properties (agent_id);
create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- ============================================================
-- documents (per client, any side — "upload anything")
-- ============================================================
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size bigint,
  created_at timestamptz not null default now()
);
create index documents_client_id_idx on public.documents (client_id);
create index documents_agent_id_idx on public.documents (agent_id);

-- ============================================================
-- email_accounts / email_templates / scheduled_emails
-- (deferred feature — schema only, no sending in v1)
-- ============================================================
create table public.email_accounts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  provider public.email_provider not null,
  from_address text not null,
  reply_to text,
  token_ref text, -- reference to an encrypted secret in Supabase Vault
  status public.email_account_status not null default 'connected',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index email_accounts_agent_id_idx on public.email_accounts (agent_id);
create trigger email_accounts_set_updated_at
  before update on public.email_accounts
  for each row execute function public.set_updated_at();

create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index email_templates_agent_id_idx on public.email_templates (agent_id);
create trigger email_templates_set_updated_at
  before update on public.email_templates
  for each row execute function public.set_updated_at();

create table public.scheduled_emails (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  template_id uuid references public.email_templates (id) on delete set null,
  email_account_id uuid references public.email_accounts (id) on delete set null,
  send_at timestamptz not null,
  status public.scheduled_email_status not null default 'pending',
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index scheduled_emails_agent_id_idx on public.scheduled_emails (agent_id);
create index scheduled_emails_due_idx on public.scheduled_emails (status, send_at);
create trigger scheduled_emails_set_updated_at
  before update on public.scheduled_emails
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security — agent owns their rows
-- ============================================================
alter table public.clients enable row level security;
alter table public.buyer_preferences enable row level security;
alter table public.viewings enable row level security;
alter table public.viewing_attachments enable row level security;
alter table public.reservations enable row level security;
alter table public.properties enable row level security;
alter table public.documents enable row level security;
alter table public.email_accounts enable row level security;
alter table public.email_templates enable row level security;
alter table public.scheduled_emails enable row level security;

create policy "agent owns clients" on public.clients
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));

create policy "agent owns buyer_preferences" on public.buyer_preferences
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));

create policy "agent owns viewings" on public.viewings
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));

create policy "agent owns viewing_attachments" on public.viewing_attachments
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));

create policy "agent owns reservations" on public.reservations
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));

create policy "agent owns properties" on public.properties
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));

create policy "agent owns documents" on public.documents
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));

create policy "agent owns email_accounts" on public.email_accounts
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));

create policy "agent owns email_templates" on public.email_templates
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));

create policy "agent owns scheduled_emails" on public.scheduled_emails
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));

-- ============================================================
-- Storage — single private bucket, files keyed by agent_id prefix
-- Path convention: {agent_id}/{client_id}/{kind}/{uuid}-{filename}
-- ============================================================
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "agent reads own files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "agent uploads own files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "agent updates own files" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "agent deletes own files" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
