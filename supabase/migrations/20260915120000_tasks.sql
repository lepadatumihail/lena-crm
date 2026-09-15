-- ============================================================
-- Tasks — free-form to-dos, optionally pinned to one client.
--
-- A task is a note-to-self ("send the floor plans", "chase the bank"):
-- nothing creates one automatically. Statuses follow the Linear shape
-- (todo → in_progress → waiting → done) and a done task keeps its row
-- forever, so the Done tab is a history, not a bin.
--
-- due_on is a calendar day, not an instant: "Thursday" means Thursday in
-- the agent's own time zone (profiles.time_zone, resolved per request),
-- which is why the column carries no clock time.
--
-- task_priority is declared in rank order so `order by priority desc`
-- puts urgent first without a lookup table.
--
-- Overdue and due-today tasks reach the bell as `task_due` notifications,
-- one row per task per due date (src/lib/actions/notifications.ts);
-- notifications.task_id ties them to the task so completing it clears its
-- unread pings and deleting it takes them all along.
-- ============================================================

create type public.task_status as enum ('todo', 'in_progress', 'waiting', 'done');
create type public.task_priority as enum ('none', 'low', 'medium', 'high', 'urgent');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- the client this is about, if any; goes when the client goes
  client_id uuid references public.clients (id) on delete cascade,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'none',
  -- a calendar day in the agent's zone; null = no deadline
  due_on date,
  -- stamped by tasks_sync_completed_at when status becomes 'done'
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- at least one non-whitespace character: btrim() alone strips only spaces,
  -- so a tab- or newline-only title would slip past it
  constraint tasks_title_not_blank check (title ~ '[^[:space:]]'),
  -- mirror TASK_TITLE_MAX / TASK_DESCRIPTION_MAX in src/lib/validation/task.ts,
  -- so a direct PostgREST write cannot store more than the app allows
  constraint tasks_title_len check (char_length(title) <= 160),
  constraint tasks_description_len check (description is null or char_length(description) <= 2000)
);

-- completed_at follows status: stamped once on the way into 'done', kept
-- while it stays done (re-saving a done task must not move it in the Done
-- list), cleared when the task is reopened.
create or replace function public.tasks_sync_completed_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'done' then
    if new.completed_at is null then
      new.completed_at = now();
    end if;
  else
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger tasks_sync_completed_at
  before insert or update on public.tasks
  for each row execute function public.tasks_sync_completed_at();
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create index tasks_agent_id_idx on public.tasks (agent_id);
create index tasks_client_id_idx on public.tasks (client_id);
-- the open list, the Home panel and the sidebar count all filter/sort on due_on
create index tasks_agent_open_due_idx
  on public.tasks (agent_id, due_on)
  where status <> 'done';
-- the Done tab: newest completed first. Declared exactly like getDoneTasks'
-- order (completed_at desc nulls last, id desc) so the index supplies it;
-- a plain `desc` means nulls first and could not.
create index tasks_agent_done_idx
  on public.tasks (agent_id, completed_at desc nulls last, id desc)
  where status = 'done';

alter table public.tasks enable row level security;

-- A foreign-key check runs as the table owner and ignores RLS, so without
-- the client test below any signed-in agent could pin a task to another
-- agent's client id through PostgREST. The policy itself confirms the
-- client is the agent's own; the server action only turns a refusal into a
-- friendly message. Reads and deletes stay agent-only.
create policy "agent owns tasks" on public.tasks
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (
    agent_id = (select auth.uid())
    and (
      tasks.client_id is null
      or exists (
        select 1 from public.clients c
        where c.id = tasks.client_id
          and c.agent_id = (select auth.uid())
      )
    )
  );

-- ---------- notifications: the task_due type ----------
-- A new enum value cannot be used in the transaction that adds it; nothing
-- in this file uses it. The first task_due row is written by the app long
-- after the commit.
alter type public.notification_type add value if not exists 'task_due';

alter table public.notifications
  add column if not exists task_id uuid references public.tasks (id) on delete cascade;
create index if not exists notifications_task_id_idx
  on public.notifications (task_id)
  where task_id is not null;
