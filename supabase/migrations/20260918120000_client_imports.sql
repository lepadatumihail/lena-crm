-- ============================================================
-- Client imports — every spreadsheet import is recorded, so it can be
-- reviewed and undone.
--
-- import_clients() writes one batch (at most 200 rows) with the caller's
-- rights: RLS on clients, buyer_preferences and properties, and the
-- Free-plan trigger clients_enforce_free_limit, apply exactly as they do to a
-- client added by hand. One call is one transaction, so a batch lands whole
-- or not at all.
--
-- clients.import_id ties a client to its import; undo deletes by it. A
-- foreign-key check ignores RLS, so an agent could tag their own client with
-- another agent's import id through PostgREST. That is harmless: undo
-- deletes under RLS and only ever reaches the caller's own rows, and
-- import_clients() checks ownership itself.
--
-- Undo is the app's one bulk delete of clients. notifications and
-- scheduled_emails cascade from clients and had no index on client_id, so
-- every deleted client scanned both tables; the two indexes below fix that.
-- ============================================================

create table public.client_imports (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  side public.client_side not null,
  file_name text not null,
  row_count integer not null default 0,
  imported_count integer not null default 0,
  skipped_count integer not null default 0,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  undone_at timestamptz,
  constraint client_imports_file_name_len check (char_length(file_name) <= 200),
  constraint client_imports_counts_valid
    check (row_count >= 0 and imported_count >= 0 and skipped_count >= 0)
);

-- the import page lists an agent's recent imports, newest first
create index client_imports_agent_created_idx
  on public.client_imports (agent_id, created_at desc);

alter table public.client_imports enable row level security;

create policy "agent owns client_imports" on public.client_imports
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));

alter table public.clients
  add column if not exists import_id uuid
    references public.client_imports (id) on delete set null;

-- undo reads and deletes an import's clients
create index if not exists clients_import_id_idx
  on public.clients (import_id)
  where import_id is not null;

-- both cascade from clients; see the header
create index if not exists notifications_client_id_idx
  on public.notifications (client_id)
  where client_id is not null;
create index if not exists scheduled_emails_client_id_idx
  on public.scheduled_emails (client_id);

create or replace function public.import_clients(p_import_id uuid, p_rows jsonb)
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_side public.client_side;
  v_row jsonb;
  v_prefs jsonb;
  v_client_id uuid;
  v_count integer := 0;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 200 then
    raise exception 'invalid_batch' using errcode = '22023';
  end if;

  select side into v_side
  from public.client_imports
  where id = p_import_id
    and agent_id = (select auth.uid())
    and undone_at is null;
  if not found then
    raise exception 'import_not_found' using errcode = 'P0002';
  end if;

  for v_row in select value from jsonb_array_elements(p_rows) loop
    insert into public.clients (
      side, first_name, last_name, email, phone, language, nationality,
      agency, notes, priority, is_active, stage, deal_type, seller_role, import_id
    ) values (
      v_side,
      v_row ->> 'first_name',
      coalesce(v_row ->> 'last_name', ''),
      v_row ->> 'email',
      v_row ->> 'phone',
      v_row ->> 'language',
      v_row ->> 'nationality',
      v_row ->> 'agency',
      v_row ->> 'notes',
      coalesce((v_row ->> 'priority')::boolean, false),
      coalesce((v_row ->> 'is_active')::boolean, true),
      coalesce(v_row ->> 'stage', case when v_side = 'buyer' then 'new' else 'pending' end),
      case when v_side = 'buyer' then (v_row ->> 'deal_type')::public.deal_type end,
      case when v_side = 'seller' then (v_row ->> 'seller_role')::public.seller_role end,
      p_import_id
    )
    returning id into v_client_id;

    v_prefs := v_row -> 'preferences';
    if v_side = 'buyer' and jsonb_typeof(v_prefs) = 'object' then
      insert into public.buyer_preferences (
        client_id, property_types, budget_min, budget_max, bedrooms, bathrooms, area_notes
      ) values (
        v_client_id,
        array(select jsonb_array_elements_text(coalesce(v_prefs -> 'property_types', '[]'::jsonb))),
        (v_prefs ->> 'budget_min')::numeric,
        (v_prefs ->> 'budget_max')::numeric,
        (v_prefs ->> 'bedrooms')::integer,
        (v_prefs ->> 'bathrooms')::integer,
        v_prefs ->> 'area_notes'
      );
    end if;

    if v_side = 'seller' and jsonb_typeof(v_row -> 'properties') = 'array' then
      insert into public.properties (
        client_id, price, bedrooms, property_type, address, city, notes
      )
      select
        v_client_id,
        (p.value ->> 'price')::numeric,
        (p.value ->> 'bedrooms')::integer,
        p.value ->> 'property_type',
        p.value ->> 'address',
        p.value ->> 'city',
        p.value ->> 'notes'
      from jsonb_array_elements(v_row -> 'properties') as p(value);
    end if;

    v_count := v_count + 1;
  end loop;

  update public.client_imports
     set imported_count = imported_count + v_count
   where id = p_import_id;

  return v_count;
end;
$$;

revoke all on function public.import_clients(uuid, jsonb) from public, anon;
grant execute on function public.import_clients(uuid, jsonb) to authenticated;
