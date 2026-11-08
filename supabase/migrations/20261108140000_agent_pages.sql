-- ============================================================
-- Public agent pages, phase 1: leadwing.app/agent/<slug>, one page per
-- agent, in each language the agent offers, with a short buy/sell form whose
-- enquiries become clients of the page's owner.
--
-- Pages and enquiries are read and written by the server with the service
-- role: the public site serves published pages only, and the form's server
-- action files each enquiry. Agents can read their own rows; nobody can
-- write them through the API yet (the page editor comes with phase 2, and
-- until then a published page must not be something anyone can post).
-- ============================================================

-- ---------- clients.source ----------
-- Where a client came from. 'page' is the agent's public page; plan 014's
-- forwarded portal emails will add their own value.
alter table public.clients add column source text;
alter table public.clients add constraint clients_source_shape
  check (source is null or source ~ '^[a-z_]{1,20}$');

comment on column public.clients.source is
  'Where the client came from: ''page'' = the agent''s public page form; null = added in the app.';

-- Only the server may file a page client. The Free cap below lets 'page'
-- rows through, so an agent must not be able to label their own inserts so.
create policy "page clients come from the server" on public.clients
  as restrictive
  for insert to authenticated
  with check (source is distinct from 'page');

-- ---------- Free cap: page enquiries always land ----------
-- Same body as 20260916120000_free_client_limit_ten.sql plus the first
-- branch: a buyer who wrote in from the agent's page is never turned away
-- because the agent is at 10 clients. Such rows still count towards the cap
-- for clients the agent adds by hand.
create or replace function public.enforce_free_client_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if new.source = 'page' then
    return new;
  end if;

  -- Serialise per agent so two concurrent inserts can't both squeeze under the cap.
  perform 1 from public.profiles where id = new.agent_id for update;

  if public.is_pro(new.agent_id) then
    return new;
  end if;

  select count(*) into v_count from public.clients where agent_id = new.agent_id;
  if v_count >= 10 then
    raise exception 'client_limit_reached'
      using hint = 'The Free plan allows 10 clients. Pro is unlimited.';
  end if;
  return new;
end;
$$;

-- ---------- agent_pages ----------
create table public.agent_pages (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null unique references auth.users (id) on delete cascade,
  slug text not null unique,
  -- Earlier slugs; they forward to the current one. No two pages may share
  -- a slug, current or earlier (agent_pages_slugs_free below).
  previous_slugs text[] not null default '{}',
  published boolean not null default false,
  -- The made-up example shown to agents: it says so, and is never indexed.
  is_example boolean not null default false,
  display_name text not null,
  -- Object path in the public agent-photos bucket.
  photo_path text,
  -- /agent/<slug> opens in this language; the others are /agent/<slug>/<lang>.
  default_lang text not null,
  -- What the agent speaks, ISO 639-1 codes in display order.
  spoken_languages text[] not null default '{}',
  native_language text,
  areas text[] not null default '{}',
  helps text[] not null default '{}',
  since_year integer,
  works text not null default 'independent',
  agency_name text,
  -- E.164, shown as a WhatsApp button when set.
  whatsapp text,
  -- Per page language: {"<lang>": {"title", "headline", "bio"}}. The page
  -- languages are its keys.
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_pages_slug_shape check (
    char_length(slug) between 3 and 60 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  constraint agent_pages_default_lang check (default_lang ~ '^[a-z]{2}$'),
  constraint agent_pages_name_len check (char_length(btrim(display_name)) between 1 and 80),
  constraint agent_pages_works check (works in ('independent', 'agency')),
  constraint agent_pages_helps check (
    helps <@ array['buying', 'selling', 'new_builds', 'rentals']::text[]
  ),
  constraint agent_pages_since check (since_year is null or since_year between 1950 and 2100),
  constraint agent_pages_areas check (cardinality(areas) <= 12),
  constraint agent_pages_whatsapp check (whatsapp is null or whatsapp ~ '^\+[0-9]{7,15}$'),
  constraint agent_pages_content_object check (jsonb_typeof(content) = 'object')
);

create index agent_pages_previous_slugs_idx on public.agent_pages using gin (previous_slugs);

create trigger agent_pages_set_updated_at
  before update on public.agent_pages
  for each row execute function public.set_updated_at();

-- An old link must forward to exactly one page, so no slug, current or
-- earlier, may belong to two pages.
create function public.agent_pages_slugs_free()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
      from public.agent_pages p
     where p.id <> new.id
       and (p.slug = any (new.previous_slugs)
            or new.slug = any (p.previous_slugs)
            or p.previous_slugs && new.previous_slugs)
  ) then
    raise exception 'agent_page_slug_taken';
  end if;
  return new;
end;
$$;

create trigger agent_pages_slugs_free
  before insert or update of slug, previous_slugs on public.agent_pages
  for each row execute function public.agent_pages_slugs_free();

alter table public.agent_pages enable row level security;

create policy "agent reads their page" on public.agent_pages
  for select to authenticated
  using (agent_id = (select auth.uid()));

comment on table public.agent_pages is
  'Public agent pages (/agent/<slug>). Served and written by the server with the service role; agents read their own.';

-- ---------- page_enquiries ----------
create table public.page_enquiries (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references auth.users (id) on delete cascade,
  page_id uuid not null references public.agent_pages (id) on delete cascade,
  -- The client it became. Deleting the client deletes the enquiry too, so
  -- nothing the buyer sent outlives the agent's own record of them.
  client_id uuid references public.clients (id) on delete cascade,
  kind text not null,
  lang text not null,
  name text not null,
  contact text not null,
  -- The form's answers: budget, bedrooms, areas, timing (buying) or place,
  -- type, timing (selling).
  details jsonb not null default '{}'::jsonb,
  message text,
  -- HMAC of the sender's IP and the day, for the rate limit. Never the IP.
  sender_key text,
  received_at timestamptz not null default now(),
  -- When the agent first logged a contact with the client afterwards: the
  -- page's reply-time line is built from these.
  first_reply_at timestamptz,
  constraint page_enquiries_kind check (kind in ('buy', 'sell')),
  constraint page_enquiries_lang check (lang ~ '^[a-z]{2}$'),
  constraint page_enquiries_name_len check (char_length(name) between 1 and 120),
  constraint page_enquiries_contact_len check (char_length(contact) between 3 and 200),
  constraint page_enquiries_message_len check (message is null or char_length(message) <= 2000),
  constraint page_enquiries_details_object check (jsonb_typeof(details) = 'object')
);

create index page_enquiries_page_received_idx on public.page_enquiries (page_id, received_at desc);
create index page_enquiries_client_idx on public.page_enquiries (client_id);
create index page_enquiries_sender_idx on public.page_enquiries (sender_key, received_at);

alter table public.page_enquiries enable row level security;

create policy "agent reads own page enquiries" on public.page_enquiries
  for select to authenticated
  using (agent_id = (select auth.uid()));

comment on table public.page_enquiries is
  'Enquiries sent from public agent pages. Written by the server with the service role; agents read their own.';

-- The first contact logged with a client stamps the enquiry that brought
-- them in. The composer, the WhatsApp button and Call log contacts by
-- themselves (20260925120000), so replying from LeadWing needs no extra tap.
create function public.page_enquiry_mark_replied()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'contact' then
    update public.page_enquiries
       set first_reply_at = new.created_at
     where client_id = new.client_id
       and first_reply_at is null
       and received_at <= new.created_at;
  end if;
  return null;
end;
$$;

create trigger client_activities_mark_page_reply
  after insert on public.client_activities
  for each row execute function public.page_enquiry_mark_replied();

-- ---------- notifications ----------
alter type public.notification_type add value if not exists 'page_enquiry';

-- ---------- site_events: the page's own funnel ----------
-- Same anonymous rules: page seen, form started, enquiry sent.
alter table public.site_events drop constraint site_events_event_check;
alter table public.site_events add constraint site_events_event_check check (
  event in ('landing_view', 'signup_open', 'google_start', 'code_sent',
            'signed_in', 'whatsapp_click', 'tool_view', 'tool_use', 'tool_share',
            'agent_page_view', 'agent_enquiry_start', 'agent_enquiry_sent')
);

-- ---------- agent photos ----------
-- Public bucket: a page's photo is public by definition. Uploads go through
-- the server for now, so no write policies yet.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('agent-photos', 'agent-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
