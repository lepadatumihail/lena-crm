-- ============================================================
-- Property attachments — PDFs and photos on a seller's listing.
--
-- The seller side's twin of viewing_attachments: a brochure, the floor
-- plans or the nota simple as PDFs, and photos of the property. Files sit
-- in the private `attachments` bucket under
-- {agent_id}/{client_id}/properties/{uuid}-{filename}; a row records one.
--
-- Rows go when their property goes (on delete cascade), and the property
-- goes when its client or the agent's account does. Bucket objects do not
-- cascade, so deleteProperty and deleteClient remove them first.
-- ============================================================

create type public.property_attachment_kind as enum ('pdf', 'image');

create table public.property_attachments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size bigint,
  kind public.property_attachment_kind not null,
  created_at timestamptz not null default now(),
  -- the file sits in the agent's own folder, the only one the storage policies allow
  constraint property_attachments_path_owned check (storage_path like (agent_id::text || '/%')),
  -- mirrors the file name check in addPropertyAttachment (src/lib/actions/seller.ts)
  constraint property_attachments_file_name_len check (char_length(file_name) <= 200)
);

-- the client page reads the attachments of all a seller's properties at once
create index property_attachments_property_id_idx on public.property_attachments (property_id);
create index property_attachments_agent_id_idx on public.property_attachments (agent_id);

alter table public.property_attachments enable row level security;

-- Same shape as the task notes policy: a foreign-key check runs as the table
-- owner and ignores RLS, so without the property test below any signed-in
-- agent could hang a file row on another agent's property id through PostgREST.
create policy "agent owns property attachments" on public.property_attachments
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (
    agent_id = (select auth.uid())
    and exists (
      select 1 from public.properties p
      where p.id = property_attachments.property_id
        and p.agent_id = (select auth.uid())
    )
  );
