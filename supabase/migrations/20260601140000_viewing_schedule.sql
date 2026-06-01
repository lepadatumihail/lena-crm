-- ============================================================
-- Schedule buyer viewings on the calendar
--
-- A "viewing" is a single concept: the buyer-side record (title,
-- offer, attachments) now also carries an optional date + reminder.
-- When scheduled_at is set, the viewing appears on the calendar and
-- can fire a reminder, exactly like a meeting appointment.
-- ============================================================

alter table public.viewings
  add column scheduled_at timestamptz,
  add column reminder_minutes integer;

create index viewings_agent_scheduled_idx
  on public.viewings (agent_id, scheduled_at)
  where scheduled_at is not null;
