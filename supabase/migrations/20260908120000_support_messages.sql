-- ============================================================
-- support_messages — everything filed from the in-app help dialog.
--
-- The support inbox (info@leadwing.app) is still where these get read and
-- answered; this table is the durable copy, written BEFORE the send so a
-- Resend outage costs a notification, not the message. `delivered_at` says
-- whether the email actually went out, and `delivery_error` says why not:
--
--   select created_at, kind, reply_to, delivery_error
--   from public.support_messages
--   where delivered_at is null
--   order by created_at desc;
--
-- Unlike the CRM tables this is not agent-owned data an agent reads back:
-- there is no UI for it. RLS is on with no policies, so only the service-role
-- client (src/lib/supabase/admin.ts) can touch it — the same shape as
-- stripe_events. Deleting an account takes its messages with it, which is what
-- the privacy policy promises.
-- ============================================================

create type public.support_kind as enum (
  'bug', 'feedback', 'feature', 'billing', 'question'
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references auth.users (id) on delete cascade,
  kind public.support_kind not null,
  -- Where the reply goes: prefilled from the session, but the agent can edit it.
  reply_to text not null,
  -- Snapshot of the account that was signed in, so an edited reply_to can't
  -- obscure who wrote — and it survives a later change of account email.
  account_email text,
  subject text,
  message text not null,
  -- Context captured at submit time; the first things you want on a bug report.
  page text,
  locale text,
  plan text,
  user_agent text,
  delivered_at timestamptz,
  delivery_error text,
  created_at timestamptz not null default now()
);

create index support_messages_created_idx
  on public.support_messages (created_at desc);
-- The queue that actually needs attention: filed but never emailed.
create index support_messages_undelivered_idx
  on public.support_messages (created_at desc)
  where delivered_at is null;
create index support_messages_agent_id_idx
  on public.support_messages (agent_id);

alter table public.support_messages enable row level security;
-- No policies on purpose: reads and writes go through the service role only.
