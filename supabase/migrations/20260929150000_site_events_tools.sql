-- Free tools (plans 018–019) report three anonymous steps: the page was
-- seen, the tool produced a result (or a file was downloaded), and a result
-- was copied to share. Same rules as the ad-landing steps: no user id, IP
-- or cookie.
alter table public.site_events drop constraint site_events_event_check;
alter table public.site_events add constraint site_events_event_check check (
  event in ('landing_view', 'signup_open', 'google_start', 'code_sent',
            'signed_in', 'whatsapp_click', 'tool_view', 'tool_use', 'tool_share')
);
comment on table public.site_events is
  'Anonymous funnel steps on the ad landings and the free tools. No user id, IP or cookie; service role only.';
