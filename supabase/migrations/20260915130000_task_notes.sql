-- ============================================================
-- Task notes — a running log on a task, one entry at a time.
--
-- The description says what a task is; notes say what happened since
-- ("called the bank, they answer Monday"). The task drawer lists them
-- newest first. A note is written once and can be deleted, never edited,
-- so there is no updated_at.
--
-- Notes go when their task goes (on delete cascade), and the task goes
-- when its client or the agent's account does.
-- ============================================================

create table public.task_notes (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  -- at least one non-whitespace character, the same test as tasks_title_not_blank
  constraint task_notes_body_not_blank check (body ~ '[^[:space:]]'),
  -- mirrors TASK_NOTE_MAX in src/lib/validation/task.ts
  constraint task_notes_body_len check (char_length(body) <= 2000)
);

-- the drawer reads one task's notes, newest first
create index task_notes_task_created_idx on public.task_notes (task_id, created_at desc);
create index task_notes_agent_id_idx on public.task_notes (agent_id);

alter table public.task_notes enable row level security;

-- Same shape as the tasks policy: a foreign-key check runs as the table
-- owner and ignores RLS, so without the task test below any signed-in agent
-- could write a note onto another agent's task id through PostgREST.
create policy "agent owns task notes" on public.task_notes
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (
    agent_id = (select auth.uid())
    and exists (
      select 1 from public.tasks t
      where t.id = task_notes.task_id
        and t.agent_id = (select auth.uid())
    )
  );
