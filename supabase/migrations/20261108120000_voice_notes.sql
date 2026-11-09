-- ============================================================
-- Voice notes (plan 026). An agent records a note, LeadWing transcribes it
-- and proposes client updates, and the agent approves them on review cards.
-- Nothing is written to a client until the agent taps Save.
--
-- The audio sits in the private attachments bucket under
-- <agent id>/voice-notes/, a folder the existing storage policies already
-- scope to its owner. It is removed straight after a successful
-- transcription (audio_path becomes null). A failed note keeps its audio for
-- up to 24 hours so it can be retried. proposal holds what the review cards
-- show; applied records what Save created.
--
-- client_id is set when the note was recorded on a client's page. As with
-- client_activities, a foreign-key check runs as the table owner and ignores
-- RLS, so the policy also checks that the client belongs to the agent.
-- ============================================================

create table public.voice_notes (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  status text not null default 'uploaded',
  audio_path text,
  mime_type text,
  duration_ms integer,
  size_bytes integer,
  transcript text,
  proposal jsonb,
  applied jsonb,
  error text,
  cost_usd numeric(10, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  applied_at timestamptz,
  constraint voice_notes_status_valid
    check (status in ('uploaded', 'ready', 'applied', 'discarded', 'failed')),
  constraint voice_notes_audio_path_len check (char_length(audio_path) <= 300),
  constraint voice_notes_mime_len check (char_length(mime_type) <= 100),
  constraint voice_notes_duration_valid check (duration_ms between 0 and 300000),
  constraint voice_notes_size_valid check (size_bytes between 0 and 15728640),
  constraint voice_notes_transcript_len check (char_length(transcript) <= 20000),
  constraint voice_notes_error_len check (char_length(error) <= 60)
);

-- the voice-note sheet lists an agent's open notes, newest first, and the
-- fair-use limit counts their notes from the last 24 hours
create index voice_notes_agent_created_idx
  on public.voice_notes (agent_id, created_at desc);

create trigger voice_notes_set_updated_at
  before update on public.voice_notes
  for each row execute function public.set_updated_at();

alter table public.voice_notes enable row level security;

create policy "agent owns voice notes" on public.voice_notes
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (
    agent_id = (select auth.uid())
    and (
      client_id is null
      or exists (
        select 1 from public.clients c
        where c.id = voice_notes.client_id
          and c.agent_id = (select auth.uid())
      )
    )
  );
