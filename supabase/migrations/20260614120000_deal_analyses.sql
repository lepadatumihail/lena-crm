-- ============================================================
-- Profit calculator — saved deal analyses
--
-- A "deal analysis" is an agent's underwriting of a single
-- buy-renovate-sell deal: acquisition costs, the renovation
-- project budget and the expected exit. Every row is owned by
-- agent_id (= auth.uid()) and RLS keeps it private to that agent,
-- exactly like every other table.
--
-- Only the raw inputs are stored; profit / ROI / IRR are recomputed
-- deterministically from them (see src/lib/calculator/deal.ts), so
-- there is no derived state to keep in sync.
-- ============================================================

create type public.deal_property_type as enum ('resale', 'new_build');

create table public.deal_analyses (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  analysis_date date not null default current_date,
  property_type public.deal_property_type not null default 'resale',
  -- acquisition (all percentages are of the asking price)
  asking_price numeric not null default 0,
  transfer_tax_pct numeric not null default 7,
  lawyer_pct numeric not null default 1,
  notary_pct numeric not null default 0.5,
  -- renovation / project
  renovation_price_per_sqm numeric not null default 0,
  surface_sqm numeric not null default 0,
  contingency_pct numeric not null default 0,
  duration_months integer not null default 12,
  -- exit
  expected_sale_price numeric not null default 0,
  agency_fee_pct numeric not null default 5,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index deal_analyses_agent_id_idx on public.deal_analyses (agent_id);
create index deal_analyses_agent_updated_idx
  on public.deal_analyses (agent_id, updated_at desc);
create trigger deal_analyses_set_updated_at
  before update on public.deal_analyses
  for each row execute function public.set_updated_at();

alter table public.deal_analyses enable row level security;

create policy "agent owns deal_analyses" on public.deal_analyses
  for all
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));
