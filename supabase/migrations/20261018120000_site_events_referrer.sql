-- Where a visitor came from when the link carried no utm tags: the hostname
-- of the other site that linked to the page (document.referrer), such as
-- google.com or perplexity.ai. Search engines and most AI assistants add no
-- tags, so until now they all read as "no source". Only the hostname, never
-- the path or query (a search or a mail client's address can carry personal
-- data), and nothing when the link came from our own pages. Same rules as
-- the rest of the table: no user id, IP or cookie.
--
-- profiles.signup_source carries the same value under "referrer". Its shape
-- check already allows the key and handle_new_user copies the object as it
-- is, so only its comment changes.
alter table public.site_events
  add column referrer text check (char_length(referrer) <= 100);

comment on column public.site_events.referrer is
  'Hostname of the other site that linked to the page (no path or query); null when none or our own.';

comment on column public.profiles.signup_source is
  'utm_* tags, landing path and referring hostname of the page the agent signed up on; set once at account creation.';
