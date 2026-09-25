-- ============================================================
-- Client activity: what happened with a client, and when the agent last
-- reached them.
--
-- A logged contact (a WhatsApp, a call, an email, a meeting) moves
-- clients.last_contacted_at, which is what "quiet for N days" reads from now
-- on. Before this a buyer only stopped being quiet when their row was
-- edited, so contacting them never cleared them from Needs attention or
-- the bell.
--
-- Notes and stage moves land in the same log, which the client page shows
-- as its Activity panel. Stage moves are written by a trigger, so every
-- path that changes a stage (list, board, bulk, the record) is covered.
-- An entry is written once and can be deleted (Undo), never edited, so
-- there is no updated_at.
-- ============================================================

create type public.activity_kind as enum ('contact', 'note', 'stage');
create type public.contact_channel as enum ('whatsapp', 'call', 'email', 'meeting', 'other');

-- null until the first logged contact; the quiet rule then falls back to updated_at
alter table public.clients add column last_contacted_at timestamptz;

create table public.client_activities (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  kind public.activity_kind not null,
  -- contacts only: how the agent reached the client
  channel public.contact_channel,
  -- a note's text, or what a contact was about
  body text,
  -- stage moves only
  stage_from text,
  stage_to text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  -- mirrors ACTIVITY_BODY_MAX in src/lib/validation/activity.ts
  constraint client_activities_body_len check (char_length(body) <= 2000),
  -- a note has at least one non-whitespace character, like task notes
  constraint client_activities_note_body check (
    kind <> 'note' or (body is not null and body ~ '[^[:space:]]')
  ),
  constraint client_activities_contact_channel check ((kind = 'contact') = (channel is not null)),
  constraint client_activities_stage_to check ((kind = 'stage') = (stage_to is not null))
);

-- the client page reads one client's log, newest first
create index client_activities_client_occurred_idx
  on public.client_activities (client_id, occurred_at desc);
create index client_activities_agent_id_idx on public.client_activities (agent_id);

alter table public.client_activities enable row level security;

-- Same shape as the task_notes policy: a foreign-key check runs as the table
-- owner and ignores RLS, so without the client test below any signed-in
-- agent could write an entry onto another agent's client id.
create policy "agent owns client activities" on public.client_activities
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (
    agent_id = (select auth.uid())
    and exists (
      select 1 from public.clients c
      where c.id = client_activities.client_id
        and c.agent_id = (select auth.uid())
    )
  );

-- last_contacted_at is always the newest logged contact, so logging one
-- moves it forward and undoing one moves it back.
create function public.client_activities_sync_last_contact()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
  entry_kind public.activity_kind;
begin
  if tg_op = 'DELETE' then
    target := old.client_id;
    entry_kind := old.kind;
  else
    target := new.client_id;
    entry_kind := new.kind;
  end if;
  if entry_kind <> 'contact' then
    return null;
  end if;
  update public.clients c
     set last_contacted_at = (
       select max(a.occurred_at)
         from public.client_activities a
        where a.client_id = target
          and a.kind = 'contact'
     )
   where c.id = target;
  return null;
end;
$$;

create trigger client_activities_sync_last_contact
  after insert or delete on public.client_activities
  for each row execute function public.client_activities_sync_last_contact();

-- Every stage move lands in the log, whichever screen made it.
create function public.clients_log_stage_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.stage is distinct from old.stage then
    insert into public.client_activities (agent_id, client_id, kind, stage_from, stage_to)
    values (new.agent_id, new.id, 'stage', old.stage, new.stage);
  end if;
  return null;
end;
$$;

create trigger clients_log_stage_change
  after update of stage on public.clients
  for each row execute function public.clients_log_stage_change();
