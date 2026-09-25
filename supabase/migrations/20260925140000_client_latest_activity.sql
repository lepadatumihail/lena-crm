-- ============================================================
-- The newest contact or note per client, for the client lists.
--
-- Each list row shows its client's latest contact or note under the name
-- ("WhatsApp · Hi Sofia, I found two villas… · 2 days ago"). The list reads
-- this view with one query next to the clients query, filtered by side, so
-- it needs no lookup per client.
--
-- security_invoker: the view runs with the caller's rights, so the RLS on
-- client_activities and clients keeps each agent to their own rows. A plain
-- view would run as its owner and skip RLS.
-- ============================================================

-- A client has one side, so keying on it as well changes no row; it lets
-- Postgres apply the list's side filter before sorting instead of after.
create view public.client_latest_activity
with (security_invoker = true)
as
select distinct on (c.side, a.client_id)
  a.client_id,
  c.side,
  a.kind,
  a.channel,
  -- all a list row shows: the first line of the text, capped; null when empty
  nullif(
    left(btrim(split_part(btrim(a.body, E' \t\r\n'), E'\n', 1), E' \t\r'), 200),
    ''
  ) as preview,
  a.occurred_at
from public.client_activities a
join public.clients c on c.id = a.client_id
where a.kind in ('contact', 'note')
order by c.side, a.client_id, a.occurred_at desc, a.created_at desc;

-- Read-only, and only for signed-in agents.
revoke all on public.client_latest_activity from anon, authenticated;
grant select on public.client_latest_activity to authenticated;
