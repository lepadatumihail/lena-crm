# Plan 026: Voice notes — talk after a call or viewing, LeadWing updates the client

> **Executor instructions**: Follow this plan phase by phase and step by step.
> Run every verification command and confirm the expected result before moving
> on. If a "STOP conditions" item occurs, stop and report; do not improvise.
> Phase 0 is a gate: never start Phase 1 until Phase 0's done criteria pass.
> When a phase is done, update this plan's row in `plans/README.md`.
>
> **Read first (AGENTS.md rule, Next 16 differs from older versions):**
> - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`
> - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md`
> - `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md`
>
> **Drift check (run first)**:
> `git diff --stat 65bff26..HEAD -- src/lib/openrouter.ts src/lib/actions/activity.ts src/lib/actions/tasks.ts src/lib/actions/buyer.ts src/lib/actions/clients.ts src/lib/actions/calendar.ts src/lib/actions/messages.ts src/lib/actions/search.ts src/components/shell src/components/clients/contact-log.tsx src/components/file-upload.tsx src/i18n/messages.ts src/lib/supabase/types.ts src/content/legal src/lib/legal.ts package.json`
> Anything listed is drift: compare it with "Current state" before using a
> line or signature from this plan. A mismatch you can't reconcile is a STOP
> condition.
>
> **Shared working tree**: other Claude sessions may be editing this checkout.
> Stage only the files this plan names, never `git add -A`, and read
> `git diff <path>` before staging. If another session's hunks are in a file,
> stage only yours with a patch (`git diff <path> > <scratchpad>/x.patch`,
> delete their hunks, `git apply --cached <scratchpad>/x.patch`). If one hunk
> mixes your lines with someone else's, STOP.

## Status

- **Priority**: P1. The founder chose it on 2026-11-08 ("yeah okay lets plan it").
- **Effort**: L, about 7–8 dev days.
  - Phase 0 spike: 0.5 day (gate)
  - Phase 1 data and flag: 0.5 day
  - Phase 2 server pipeline: 2 days
  - Phase 3 recording UI: 2 days
  - Phase 4 review and save: 1.5 days
  - Phase 5 legal, checks, rollout: 1 day
- **Depends on**: nothing unbuilt. It reuses the existing client, activity, task,
  viewing, preference, appointment and drafting actions.
- **Rollout**: behind `VOICE_NOTES_ENABLED` (off → admins → pilot → all).
  On Vercel production it has been `admins` since 2026-11-09.

## Why this matters

- **CRMs fail on upkeep, not features.** The 7 Nov 2026 Reddit readout
  (https://claude.ai/artifact/QTsySqiJMpy9Vbs4MD3c3u) found agents agree they
  need a CRM but stop updating it: too many clicks, typing after every call
  or viewing.
- **LeadWing's own data agrees.** On 7 Nov 2026 the nine non-founder accounts
  had added two clients between them, and nobody added one after day 1.
- **Agents already talk instead of typing.** On the coast, WhatsApp voice
  notes are the normal way agents and clients communicate.
- **Nobody local does it.** A quick check on 8 Nov 2026 found no Spanish CRM
  offering voice notes for the agent. Spanish "voice AI" products are bots
  that answer an agency's phone calls. The closest analogue is US-only
  (EchoPilot: record showings, approve the notes and follow-ups).
- **It feeds what comes next.** Voice notes keep client records current
  without typing. That is what a future "who to message today" list and
  owner reports need.

## What the agent sees

1. **Phone, anywhere in the app**:
   - Hold the round **+** in the bottom tab bar to record, and let go to finish.
   - A short tap still opens the "New" menu.
   - The menu gains **Voice note** as its first item. It records hands-free
     (tap to start, tap to stop) for long end-of-day notes, and it is the
     keyboard and screen-reader route.
2. **On a client's page**: a **Voice note** button next to "Log contact". The
   note belongs to that client unless the agent clearly names someone else.
3. **After recording**:
   - The sheet shows "Listening…" and then "Sorting it into your clients…".
   - Then one card per person mentioned, each with checkboxes:
     - a note for the timeline
     - "spoke to them" (logs a contact)
     - a viewing with feedback
     - budget and preference changes, shown as old → new
     - a stage change
     - tasks with dates
     - an appointment
   - If a name could be two clients, the card asks which one. If nobody
     matches, it offers a new client, pre-filled.
   - "What I heard" shows the transcript.
   - **Nothing is saved until the agent taps Save.**
4. **After Save**:
   - The sheet confirms what was saved, for example "Saved for 2 clients:
     3 tasks, 1 viewing".
   - Each client gets a **Draft WhatsApp** button (the existing
     `draftMessage`, in the client's language) and an **Open** link.
5. **Unfinished notes are kept**: a note the agent didn't review (app closed,
   lost signal) is listed at the top of the voice-note sheet until it is
   saved or discarded.

**Worked example.** The agent holds +, says: "Just showed the Benahavís villa to
the Johnsons. They loved the view but it's over budget, they'd go to one and a
half million. Call them Friday. Oh, and Anna Svensson is flying in on the 20th,
book a viewing day for her." The sheet shows:

- **Mark Johnson**, matched to an existing client:
  - Viewing: "Villa in Benahavís", feedback "Loved the view; over budget".
  - Budget max: €1,200,000 → €1,500,000.
  - Task "Call the Johnsons", due Fri 13 Nov.
  - Note on the timeline.
- **Anna Svensson**, two matches, so the card asks the agent to pick one:
  - Appointment "Viewing day", 20 Nov.
  - Note on the timeline.

## Decisions (defaults chosen by Claude on 2026-11-08; founder to confirm)

| # | Question | Default |
|---|---|---|
| D1 | Which plans get it | **Free and Pro.** It is the activation hook, and fair-use limits (D3) cap the cost. |
| D2 | Longest note | **5 minutes.** Warn at 4:30, stop at 5:00. |
| D3 | Fair use | **30 notes per agent per rolling 24 hours.** Beyond that, a friendly error. |
| D4 | Audio retention | **Deleted straight after a successful transcription.** A failed note keeps its audio up to 24 hours for a retry, then it is removed. Never played back, never logged. |
| D5 | Transcript retention | Kept on the `voice_notes` row ("What I heard") and, through the saved note, on the client's timeline, until the agent deletes it or closes the account. |
| D6 | Models | Transcription `openai/gpt-4o-mini-transcribe`. Extraction `openai/gpt-4o-mini` (the app's current default). Both OpenAI-served, matching the privacy page's "OpenRouter, Inc. and OpenAI". Env overrides: `VOICE_TRANSCRIBE_MODEL`, `VOICE_EXTRACT_MODEL`. |
| D7 | Who matches names to clients | **The server, not the model.** The model returns the names as spoken, and `src/lib/voice/match.ts` matches them against the agent's clients. The agent's client list is never sent to the model. |
| D8 | Auto-save or auto-send | **Never.** Every change waits for Save. Messages are drafted and sent by the agent. |
| D9 | Hold-to-talk on + | **Only when the microphone permission is already granted.** Otherwise holding + opens the sheet in tap mode with a short explainer and a Start button. This keeps the browser's permission prompt from appearing mid-press. |
| D10 | Language | Any spoken language; transcription auto-detects it. Notes, tasks and the summary are written in the agent's UI language (en/es/ru), the same rule as `extractLead`. Drafted messages use the client's language through the existing `draftMessage`. |
| D11 | Seller clients | Notes, contacts, tasks, appointments and stage. Viewings and preferences are buyer-only, as they are in the app today. |
| D12 | Marketing copy | **None until the pilot works.** Overclaiming hurt before. The candidate headline (EN: "Talk, don't type…", ES: "Habla, no escribas…") waits for the founder after Phase 5. |

## Current state (verified 2026-11-08 at `65bff26`, working tree clean)

**AI**
- `src/lib/openrouter.ts` has `openrouterChat(messages, opts)`: plain `fetch` to
  `https://openrouter.ai/api/v1/chat/completions`, model
  `process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini"`, key `OPENROUTER_API_KEY`.
  No AI SDK and no audio code anywhere in `src`.
- `src/lib/actions/leads.ts` has `extractLead(text)`: a server action that
  parses JSON by hand. The notes are written in the UI language through
  `NOTES_LANGUAGE = { en: "English", es: "Spanish", ru: "Russian" }`. Copy this
  rule.
- `src/lib/actions/messages.ts` has `draftMessage({ clientId, channel, draft?,
  language?, instruction?, property? })`, which drafts in the client's language.
- `src/lib/whatsapp.ts` has `whatsappLink(phone, text)` and `normalizePhone`
  (plain wa.me links, no API).
- `zod` `^4.4.3` is already a dependency.

**Storage**
- Bucket `attachments`: private, 15 MB per file
  (`20260601120000_attachments_size_limit.sql`).
- The policies allow select, insert, update and delete only when the first
  folder is `auth.uid()` (`20260529120000_init.sql:309-335`).
- The browser uploads directly in `src/components/file-upload.tsx`
  (`createClient()` → `.storage.from(STORAGE_BUCKET).upload(path, file, { upsert:
  false, contentType })`).
- The removal helpers are in `src/lib/storage/client-files.ts`.

**Actions to reuse.** Each one checks auth, validates with zod and revalidates
paths.
- `src/lib/actions/activity.ts`: `logContact(input)`, which inserts kind
  `contact` with a channel; a trigger moves `clients.last_contacted_at` and
  clears follow-up nudges. Also `addClientNote({ clientId, body })`.
- `src/lib/actions/tasks.ts`: `createTask(input: TaskInput)` (title,
  description, status, priority, client_id, due_on). The schema is in
  `src/lib/validation/task.ts`.
- `src/lib/actions/buyer.ts`: `upsertPreferences(clientId, values)`, with
  property_types, budget_min/max, bedrooms, bathrooms and area_notes, and
  `saveViewing(clientId, viewingId, values, schedule)`. The schemas are in
  `src/lib/validation/buyer.ts`.
- `src/lib/actions/clients.ts`: `createClient`, `updateClientStage`. The
  Free cap of 10 clients is enforced by a DB trigger
  (`20260916120000_free_client_limit_ten.sql`).
- `src/lib/actions/calendar.ts`: `saveAppointment`. The schema is in
  `src/lib/validation/calendar.ts`.
- `src/lib/actions/search.ts`: `searchIndex()` returns active clients (id,
  first_name, last_name, side, stage, email, phone, agency).

**Stages** (`src/lib/crm.ts`)
- `BUYER_STAGES`: new, contacted, qualified, viewing, reserved.
- `SELLER_STAGES`: pending, qualified.
- `stagesForSide(side)`.

**Shell**
- `src/components/shell/mobile-tab-bar.tsx`: the grid is Home, Clients, the +
  button (`onClick={() => setOpen(true)}`, which opens a bottom `Sheet` listing
  `NEW_ACTIONS`), Calendar, Tasks. It is hidden from `md` up.
- `src/components/shell/new-actions.ts`: ids new-buyer, new-seller, paste-lead,
  new-task, new-appointment, plus `openNewInPlace(id)`.
- `src/components/shell/shell-context.tsx`: `ShellProvider` (crumb, agentId,
  agentFirstName, timeZone). The hooks are `useAgentId`, `useAgentTimeZone`.

**Client page**
- `src/app/(app)/clients/[id]/page.tsx` renders `ClientDetailView`.
- The contact logging UI is in `src/components/clients/contact-log.tsx`.

**i18n**
- `messages/{en,es,ru}/*.json`, imported statically in `src/i18n/messages.ts`.
  English is the type reference, and the other languages are deep-merged over
  it.
- Server error strings live under `server.json`.

**Database types**
- `src/lib/supabase/types.ts` is hand-written; add new tables by hand.

**Session**
- `src/lib/data/session.ts`: `getSessionProfile()` (includes `is_admin`,
  `locale`, `time_zone`), `getAgentTimeZone()`.

**Routing**
- The proxy guards only `PROTECTED_PREFIXES`.
- An API route under `src/app/api/` must check auth itself and return 401.
- The existing `src/app/api/site-event/route.ts` is a public beacon, so don't
  copy its auth.

**Legal**
- `src/content/legal/privacy.{en,es,ru}.tsx`:
  - section 5 names exactly two AI features (lead capture, drafting)
  - the section 6 table row reads "OpenRouter, Inc. and OpenAI | AI drafting and
    lead capture (section 5)"
- `src/content/legal/terms.en.tsx:131` reads "Lead capture and message drafting
  use third-party language models…" (and the same line in es/ru).
- `LEGAL_UPDATED` in `src/lib/legal.ts` is `privacy: "2026-10-18"`,
  `terms: "2026-09-17"`.

**Runtime**
- Node 24 (`engines.node`). Locally, run tests with nvm's v24.15.0, because
  the default local node is 22.
- Vercel region fra1.
- Server Actions accept 1 MB bodies by default. That is why audio goes
  straight to Storage and never through an action.

## External facts (checked 2026-11-08)

**OpenRouter speech-to-text**

Sources: https://openrouter.ai/docs/guides/overview/multimodal/stt and
https://openrouter.ai/docs/api/api-reference/stt/create-transcription.

- **Request**: `POST https://openrouter.ai/api/v1/audio/transcriptions`. The
  JSON body is
  `{ model, input_audio: { data: <raw base64, no data: prefix>, format }, language?, temperature?, response_format?, provider? }`.
  Multipart with `file` also works.
- **Formats**: wav, mp3, flac, `m4a` (MIME audio/mp4), ogg, `webm` (MIME
  audio/webm), aac. Support "varies by provider", and the docs never mention
  the Opus codec. Phase 0 tests real files.
- **Limits**:
  - 25 MB per request
  - upstream providers time out after 60 seconds
  - rate limits aren't documented (a 429 means back off)
- **Response**: `{ text, usage: { seconds, total_tokens, input_tokens,
  output_tokens, cost } }`, plus an `X-Generation-Id` header.
  `gpt-4o-transcribe` rejects `verbose_json`; keep the default `json`.
- **Language**: auto-detected when omitted; the optional hint is ISO-639-1.
- **Privacy**:
  - `provider: { zdr: true }` routes only to zero-data-retention endpoints.
  - `provider.data_collection: "deny"` is available.
  - The guide says `order`/`only`/`ignore` routing is **not** applied to
    transcription, so choose a model id served only by OpenAI.
    `openai/gpt-4o-mini-transcribe` and `openai/gpt-4o-transcribe` list
    OpenAI as their only provider.
- **Prices shown**:
  - `openai/gpt-4o-mini-transcribe`: $1.25/M input tokens, $5/M output tokens
  - `openai/gpt-4o-transcribe`: $2.50/M input, $10/M output
  - `openai/whisper-1`: $0.0001 per second
  - Read `usage.cost` for the real figure.

**Vercel AI SDK v7**

Sources: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data and
https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0.

- Typed output:
  `generateText({ model, output: Output.object({ schema }), instructions, prompt })`,
  then read `result.output`.
- Failures throw `NoObjectGeneratedError` (`NoObjectGeneratedError.isInstance(e)`).
- v7 names: `instructions`, not `system`. System messages inside `messages`
  are rejected by default.
- v7 requires Node ≥ 22 and is ESM-only.
- Zod 4 is not stated explicitly in the docs. The peer range below says it
  works; Phase 0 confirms it.
- `transcribe` exists in `ai`, but **the OpenRouter provider doesn't support
  transcription**. That is why transcription uses our own `fetch` (Step 2.2).

**`@openrouter/ai-sdk-provider` 3.1.0**

Sources: README at https://github.com/OpenRouterTeam/ai-sdk-provider and npm,
published 2026-09-19.

- Peers: `ai ^7.0.0`, `zod ^3.25.76 || ^4.1.8`. Engines: node ≥ 22.
- `createOpenRouter({ apiKey })`, `openrouter.chat("<model id>")`.
- Optional response healing:
  `openrouter.chat(id, { plugins: [{ id: "response-healing" }] })`, non-streaming
  only.

**Versions to pin**
- `ai@7.0.153` (published 2026-10-24) and `@openrouter/ai-sdk-provider@3.1.0`.
- A newer patch is fine if it is at least two weeks old on the day you install.

**Browser recording**
- MediaRecorder gives `audio/webm;codecs=opus` in Chrome and Android, and
  `audio/mp4` in iOS Safari.
- Always pick a format with `MediaRecorder.isTypeSupported`, and send the
  OpenRouter `format` that matches the container: webm → `webm`,
  mp4 → `m4a`.

## Scope

**In**
- Recording on phone and desktop.
- Upload to Storage.
- Transcription, extraction and name matching.
- The review cards and Save.
- The list of unfinished notes.
- The rollout flag.
- Privacy and terms text in en/es/ru.
- UI strings in en/es/ru.
- Tests and a pilot.

**Out**
- Voice notes over WhatsApp (needs Meta verification; plan 017 territory).
- A chat assistant (a later plan should reuse `schema.ts` and `apply-map.ts`
  from this one as its tools).
- Recording phone calls.
- Audio playback.
- Creating seller properties from voice.
- The "who to message today" list.
- Marketing copy (D12).

## Commands you will need

```bash
nvm use 24.15.0
npm run typecheck
npm run lint
npm test
npm run build
```

Run each one on its own line and read its exit code. Never chain checks with
pipes or `&&` into `git push` (see `feedback_verify_before_push` in memory: a
pipe once hid a red typecheck).

## Steps

### Phase 0 — Spike (gate)

**0.1 Sample audio.** In the session scratchpad (never the repo):
1. Write two scripts, one English and one Spanish, each naming two clients,
   a budget, a weekday and a date.
2. Make AIFF files with macOS `say`.
3. Convert them with ffmpeg:
   - `-c:a libopus -b:a 32k note.webm`
   - `-c:a aac -b:a 64k note.m4a`

**0.2 Transcription check.** A scratch Node script (`node --env-file=<repo>/.env.local`)
posts each file to `/api/v1/audio/transcriptions` with
`model: "openai/gpt-4o-mini-transcribe"` and
`provider: { zdr: true, data_collection: "deny" }`. For each file, record:
- the HTTP status
- the text
- `usage.cost`
- the latency

If `zdr: true` is refused, retry without it and record that as well (see
STOP 2). Also try `format: "mp4"` for the m4a file, and note which values work.

**0.3 SDK check.**
1. `npm install --save-exact ai@7.0.153 @openrouter/ai-sdk-provider@3.1.0`.
2. Write a scratch script that runs `generateText` + `Output.object` with a
   small zod 4 schema over one transcript from 0.2.
3. Confirm `result.output` matches the schema.
4. If zod 4 is rejected, try the fallback: `z.toJSONSchema(schema)` wrapped
   in `jsonSchema()` from `ai`. If that also fails, STOP 3.

**0.4 Build check.** `npm run typecheck` and `npm run build` pass with the new
packages installed (they are ESM-only).

**Done when:**
- Both formats transcribe through an OpenAI-served model.
- The SDK returns a schema-valid object.
- The costs and working `format` values are written into "As built" at the
  bottom of this plan.

### Phase 1 — Data and flag

**1.1 Migration** `supabase/migrations/20261108120000_voice_notes.sql`:

```sql
create table public.voice_notes (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null, -- set when recorded on a client page
  status text not null default 'uploaded'
    check (status in ('uploaded', 'ready', 'applied', 'discarded', 'failed')),
  audio_path text,            -- attachments bucket; null once deleted
  mime_type text,
  duration_ms integer check (duration_ms between 0 and 300000),
  size_bytes integer,
  transcript text,
  proposal jsonb,             -- extraction + match candidates, shown on the review cards
  applied jsonb,              -- what Save created (ids per item), for support and undo later
  error text,                 -- short code, never the transcript
  cost_usd numeric(10, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  applied_at timestamptz
);
create index voice_notes_agent_created_idx on public.voice_notes (agent_id, created_at desc);
create index voice_notes_open_idx on public.voice_notes (agent_id)
  where status in ('uploaded', 'ready', 'failed');
create trigger voice_notes_set_updated_at
  before update on public.voice_notes
  for each row execute function public.set_updated_at();
alter table public.voice_notes enable row level security;
create policy "agent manages own voice notes" on public.voice_notes
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));
```

Before you write the file, check how the existing migrations write their RLS
policies. If they use one policy per command, follow them rather than this
`for all` sketch.

**1.2 Apply it to the live DB yourself.**
- Follow `feedback_run_db_migrations` in memory: use `SUPABASE_DB_URL` with
  `pg` from the scratchpad, run the file in a transaction, and insert the
  history row
  `('20261108120000', 'voice_notes')` into `supabase_migrations.schema_migrations`.
- Then probe: `select count(*) from public.voice_notes` returns 0, and
  `relrowsecurity` is true.

**1.3 Types.** Add `voice_notes` Row/Insert/Update to `src/lib/supabase/types.ts`,
following the hand-written pattern.

**1.4 Flag.** Add `src/lib/flags.ts` and `src/lib/flags.test.ts`:
- `voiceNotesEnabled(profile)` reads `VOICE_NOTES_ENABLED`. Its values are
  `off` (the default), `admins` (`profile.is_admin`), `pilot` (admins plus
  the emails in `VOICE_NOTES_PILOT_EMAILS`, comma-separated and
  case-insensitive) and `all`.
- Pass the result into `ShellProvider` as `voiceNotes: boolean`, alongside
  `timeZone`, and add a `useVoiceNotes()` hook to `shell-context.tsx`.
- Tests cover each value and an unknown value (which means off).

### Phase 2 — Server pipeline

**2.1 `src/lib/voice/formats.ts` (+ test).**
- `RECORDER_MIME_ORDER = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"]`.
- `pickRecorderMime(isTypeSupported)`.
- `toUpload(mime)` returns `{ ext: "webm" | "m4a", format }`, with `format`
  taken from the values Phase 0 proved.

**2.2 `openrouterTranscribe()` in `src/lib/openrouter.ts`.**
- Input: `{ audio: Uint8Array, format: string, language?: string }`.
- Output: `{ text, seconds, cost }`.
- Use `fetch` with `AbortSignal.timeout(60_000)`.
- Model: `process.env.VOICE_TRANSCRIBE_MODEL ?? "openai/gpt-4o-mini-transcribe"`.
- `provider` is set as Phase 0 settled it.
- Errors: throw `Error("transcribe:<status>")` and never include the body text.
  An OpenRouter error body can echo input.
- Unit test with a mocked `fetch`: the request shape, base64 without a
  `data:` prefix, and error mapping.

**2.3 `src/lib/ai/openrouter.ts`.**
- A lazily created `createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })`.
- `extractionModel()` returns
  `openrouter.chat(process.env.VOICE_EXTRACT_MODEL ?? process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini")`.
- Server-only: import `"server-only"` if the repo already uses it, otherwise
  follow how `openrouter.ts` stays server-side.

**2.4 `src/lib/voice/schema.ts` (+ test).** Two zod schemas.

- **`VoiceExtraction`** (what the model returns).
  - Use `.nullable()`, not `.optional()`: strict JSON-schema mode needs every
    key present.
  - Add `.describe()` to every field, so the model sees the intent.
  - Fields:
    - `summary`: string ≤ 200, in the agent's UI language.
    - `groups[]`: ≤ 12. Each group has:
      - `person`: `{ spoken ≤ 120, first_name|null, last_name|null, side: "buyer"|"seller"|null }`
      - `note`: ≤ 2000, factual, in the UI language
      - `spoke_with_them`: `{ channel: "call"|"whatsapp"|"email"|"meeting"|"other" }|null`
      - `viewing`: `{ property ≤ 200, feedback ≤ 1000, date: ISO date|null, had_offer, offer_price|null, property_price|null }|null`
      - `preferences`: `{ budget_min, budget_max, bedrooms, bathrooms, property_types, area_notes }`, each nullable; property_types use the values `preferencesFormSchema` allows
      - `stage`: one of `BUYER_STAGES` or `SELLER_STAGES` (or null)
      - `tasks[]`: ≤ 10, each `{ title ≤ 200, due_on: ISO date|null }`
      - `appointment`: `{ title ≤ 200, starts_at: "YYYY-MM-DDTHH:mm" in the agent's zone, duration_minutes 15–480, location|null }|null`
      - `follow_up`: ≤ 300, the agent's instruction for a message, or null
      - `contact_details`: `{ phone|null, email|null, language|null, nationality|null }`, only what was said aloud
    - `unassigned[]`: ≤ 10, each ≤ 500. These are things that belong to no
      client, for example "renew my idealista plan".
  - Amounts are whole euros, as numbers.
- **`VoiceApply`** (what the review sheet sends back). For each group:
  - `include`
  - `client`: `{ kind: "existing", id }` or `{ kind: "new", first_name, last_name, side, phone?, email?, language? }`
  - each item with its own `include` flag and the values as the agent edited
    them
  - `unassigned` items the agent turned into client-less tasks
- Tests: one valid and two invalid fixtures for each schema.

**2.5 `src/lib/voice/prompt.ts` (+ test).** `buildInstructions({ today, weekday,
timeZone, uiLanguage, boundClient })` returns the instructions string:
- Your role: sort an estate agent's voice note into client updates.
- Today is `<weekday> <YYYY-MM-DD>` in `<timeZone>`. Turn relative dates
  ("Friday", "next week", "the 20th") into ISO dates in that zone. The
  next-occurrence rule applies: "Friday" on a Friday means today.
- Write `summary`, `note` and task titles in `<uiLanguage>`. Keep names and
  property names as spoken.
- Never invent phone numbers, emails, prices or dates that weren't said. If
  unsure, use null.
- One group per person or couple ("the Johnsons" is one group).
- If `boundClient` is set: "This note was recorded on <first last>'s page.
  Unless another person is clearly named, everything is about them."
- Don't decide which existing client is meant. Return names as spoken.

The user message is the transcript in triple quotes. Tests: the date,
weekday, language and bound-client sentence are present.

**2.6 `src/lib/voice/match.ts` (+ test).** A pure function
`matchPerson(person, clients)` returns `{ kind: "one" | "many" | "none",
candidates: ClientLite[] }`.

How names are normalised:
- Use `fold()` from `src/lib/utils.ts` (accents, case).
- Strip a leading "the ", "los ", "las " or "la ".
- Strip honorifics: Mr, Mrs, Ms, Sr, Sra, Srta, Don, Doña, Herr, Frau.
- Strip a trailing family "s" ("Johnsons" → "johnson") when the singular
  matches a client's last name.

How a match is decided:
- full name exact → `one`
- last name only → every client with that last name
- first name only → every client with that first name
- several hits → `many`, at most 5, the most recently updated first
- nothing → `none`

Fixtures:
- "the Johnsons"
- "Müller" vs "Muller"
- two clients called Anna
- "Mark and Sarah Johnson"
- a name with no match

The input comes from one query in the route: active clients with id,
first_name, last_name, side, stage, phone and language. Match server-side
only (D7).

**2.7 `src/lib/voice/dates.ts` (+ test).** Guards:
- `due_on` must be between yesterday and 2 years ahead.
- `starts_at` must parse and fall within the next 2 years.
- Anything outside becomes null, and the card shows "no date".

**2.8 Server actions in `src/lib/actions/voice.ts`.** Error strings live under
`server.voice.errors` in `messages/*/server.json`.
- **`createVoiceNote({ path, mimeType, durationMs, sizeBytes, clientId? })`**:
  - Check auth and the flag.
  - Require `path` to start with `${uid}/voice-notes/` and end in `.webm` or
    `.m4a`.
  - Require `durationMs ≤ 300000` and `sizeBytes ≤ 15 MB`.
  - Enforce D3 (count the agent's `voice_notes` created in the last 24 h).
  - Insert the row and return the id.
- **`discardVoiceNote(id)`**: delete the audio if present and set status
  `discarded`.
- **`listOpenVoiceNotes()`**: return notes in `uploaded`, `ready` or
  `failed`, newest first, at most 10.

**2.9 Route `src/app/api/voice-notes/[id]/process/route.ts`.**
- `export const maxDuration = 60`; `POST` only; Node runtime (the default).
- The handler:
  1. Use the same server Supabase client the actions use, and return 401
     without a user.
  2. Check the flag (403 when off).
  3. Load the note (RLS ensures it is the agent's). Its status must be
     `uploaded` or `failed`, otherwise 409.
  4. Download `audio_path`, then transcribe with the `format` from `toUpload`
     (no language hint).
  5. On success: save the transcript and cost, remove the audio file, and
     set `audio_path = null`.
  6. Run `generateText` + `Output.object(VoiceExtraction)` with
     `buildInstructions(...)`. Get `today` and `weekday` from the agent's
     time zone (`getAgentTimeZone()`) and `uiLanguage` from the locale.
  7. Apply the `dates.ts` guards.
  8. Match each group (`match.ts`); if the note is bound, apply the
     bound-client rule.
  9. Save `proposal` = extraction + candidates; status `ready`.
  10. Return `{ id, status, transcript, proposal }`.
- On failure: status `failed` and `error` set to a short code
  (`transcribe_failed`, `extract_failed`, `audio_missing`). The audio is kept
  only if transcription failed, so a retry has something to work with.
- On every call, also remove this agent's audio for notes older than 24 hours
  that still have an `audio_path` (D4), and null those paths.
- Never log the transcript or the proposal.
- Test the handler's pure helpers. Mocking Supabase end to end isn't worth it
  here, because Phase 5 checks it for real.

### Phase 3 — Recording UI

**3.1 `src/components/voice/use-voice-recorder.ts`.**
- Returns `start()`, `stop()` (resolves to `{ blob, mime, durationMs }`),
  `cancel()`, `elapsedMs`, `state` (idle/recording/stopping) and `error`
  (`denied` | `unsupported` | `no_input`).
- Uses `getUserMedia({ audio: true })` and `pickRecorderMime`, with
  `audioBitsPerSecond: 32000` as a hint.
- Auto-stops at 5:00, and sets a warning flag at 4:30.
- Always stops the tracks when it finishes.
- After the first successful grant it sets a localStorage flag
  `lw.voice.micGranted`, wrapped in try/catch. Where it exists, it prefers
  `navigator.permissions.query({ name: "microphone" })`.

**3.2 `src/components/voice/voice-note-sheet.tsx`.**
- A bottom sheet on phones and a dialog from `md` up (reuse `ui/sheet` and
  `ui/dialog`).
- Modes:
  - `hold`: recording starts at once; letting go of + stops it. A recording
    under 1 second is discarded with a hint.
  - `tap`: a big Start/Stop button and a Cancel button.
- States: idle (with the open notes from `listOpenVoiceNotes()` at the top),
  recording (timer, plus a warning at 4:30), uploading, processing (the two
  messages), review (Phase 4), saved, error (with a retry where it makes
  sense).
- Upload goes straight from the browser:
  1. `createClient()`, then `.storage.from("attachments").upload("${agentId}/voice-notes/${crypto.randomUUID()}.${ext}", blob, { upsert: false, contentType: mime })`.
  2. Then call `createVoiceNote`.
  3. Then `fetch("/api/voice-notes/<id>/process", { method: "POST" })`.

**3.3 Provider.** Add `src/components/voice/voice-note-provider.tsx` with
`openVoiceNote({ mode, clientId?, clientName? })`.
- Mount it once in the signed-in shell, next to `MobileTabBar`. Find where
  `ShellProvider` and `MobileTabBar` are rendered under `src/app/(app)`.
- When the flag is off, render nothing.

**3.4 Hold-to-talk on + (`mobile-tab-bar.tsx`).**
- On `pointerdown`, start a 350 ms timer.
- Released before the timer ends: the normal click opens the menu, as today.
- At 350 ms, with `useVoiceNotes()` true:
  - If the mic is already granted (D9): `openVoiceNote({ mode: "hold" })`,
    then `navigator.vibrate?.(15)`. Swallow the click that follows the
    release, and stop on `pointerup` or `pointercancel`.
  - Otherwise: `openVoiceNote({ mode: "tap" })`.
- On the button: `touch-action: none`, `-webkit-touch-callout: none`,
  `select-none`, and `onContextMenu={e => e.preventDefault()}`.
- Keyboard and screen-reader behaviour stays the same, because the menu item
  covers them.

**3.5 Menu item.** Add `{ id: "voice-note", labelKey: "mobile.voiceNote", icon: Mic }`
as the first entry of `NEW_ACTIONS`.
- It opens the sheet in tap mode, not a URL. Extend `NewAction` or `pick()`
  so this id calls `openVoiceNote`.
- Hide the item when the flag is off.
- Check every other place that renders `NEW_ACTIONS` (desktop "New" menu,
  ⌘K) and make each one handle this id.

**3.6 Client page button.** In `contact-log.tsx`, next to the "Log contact"
control, add **Voice note**, which calls
`openVoiceNote({ mode: "tap", clientId, clientName })`. Show it only when
the flag is on.

**3.7 Strings.** Add `messages/en/voice.json` with these keys:
- `sheetTitle`, `start`, `stop`, `cancel`, `holdHint`, `tooShort`, `warning`
  ("30 seconds left")
- `uploading`, `listening`, `sorting`
- `micExplainer`, `micDenied` (how to allow it in Safari or Chrome),
  `unsupported`
- `openNotes`, `review.*`, `saved.*`, `errors.*`

Also add `nav.mobile.voiceNote`. Translate everything into `es` and `ru`
(Claude's translation; native review pending, as with plan 022), and
register `voice.json` in `src/i18n/messages.ts` for all three languages.

### Phase 4 — Review and save

**4.1 `src/components/voice/voice-review.tsx`.** One card per group.

The card header:
- `one` → the client's name with a "Change" link
- `many` → radio buttons for the candidates, plus "Someone else" (search
  using `searchIndex()` data, already loaded by ⌘K; reuse whatever the
  quick search uses)
- `none` → "New client", pre-filled with first and last name, side
  (buyer by default) and any spoken phone or email

The rows, each with a checkbox (all checked by default) and editable:
- note
- spoke to them, with channel chips
- viewing (buyers only)
- preferences (buyers only), each changed field shown as current → new
- stage, shown as current → new; only offered when valid for the side and
  different from today
- tasks, with title and date (reuse the tasks date picker)
- appointment, with title, date and time

Below the cards:
- `unassigned` lines, each with "Make it a task" or "Add to a client".
- "What I heard": the transcript, collapsed.
- Buttons: **Save** (disabled until every included card has a client) and
  **Discard**.

**4.2 `src/lib/voice/apply-map.ts` (+ test).** Pure functions that turn one
`VoiceApply` group into inputs for the existing actions:
- `toContactInput`, `toNoteInput`, `toViewingInput`, `toTaskInputs`,
  `toAppointmentInput` and `toStageChange`.
- `mergePreferences(current, proposed)`: only the fields the note set
  overwrite the current values; everything else stays.

Read each target schema at execution time (`validation/activity.ts`, `task.ts`,
`buyer.ts`, `calendar.ts`) and fill the required defaults the way the existing
forms do (for example task status and priority), rather than guessing. The tests
run the produced inputs through those same zod schemas.

**4.3 `applyVoiceNote(input)` in `src/lib/actions/voice.ts`.**
1. Validate with `VoiceApply`. The note must be the agent's and in `ready`.
2. Process each included group in order:
   1. Resolve the client. For a new one, call `createClient`; if the Free
      cap blocks it, return that error for this card with an upgrade link,
      and keep going with the other cards.
   2. Log a contact (`logContact`, body = note) if "spoke to them" is checked;
      otherwise add a note (`addClientNote`).
   3. Then the viewing (`saveViewing`), the preferences (load the current
      ones, then `upsertPreferences` with the merge), the stage
      (`updateClientStage`), the tasks (`createTask`) and the appointment
      (`saveAppointment`).
3. Create the unassigned items as client-less tasks.
4. Record the created ids in `applied`, then set status `applied` and
   `applied_at`.
5. Return per-card results. If nothing at all was saved, the note stays
   `ready` with an error.

Call the existing actions directly, so their validation, revalidation and
notification side effects stay the same.

**4.4 Saved state.**
- A summary line ("Saved for 2 clients: 3 tasks, 1 viewing").
- Per client: **Draft WhatsApp**, which calls `draftMessage({ clientId,
  channel: "whatsapp", instruction: follow_up ?? note })` and opens
  `whatsappLink(phone, text)`, and **Open**, which goes to `/clients/<id>`.
- Hide Draft WhatsApp when the client has no phone; offer email instead if
  they have one.

### Phase 5 — Legal, checks, rollout

**5.1 Privacy (en/es/ru).**
- Section 5 lists three features. Add voice notes.
  - What is sent: the recording, for transcription. Then the transcript,
    plus, when recorded on a client's page, that client's name and side,
    for sorting.
  - The agent's client list is never sent; matching happens on our servers.
  - Who receives it: OpenRouter → OpenAI, as today.
  - The recording is deleted right after transcription, and within 24 hours
    if processing fails.
  - The transcript is kept with the agent's records.
  - Nothing is saved to a client until the agent taps Save.
- Change "do not use these two features" to "these features".
- Section 6 row: "AI drafting, lead capture and voice notes (section 5)".
- Set `LEGAL_UPDATED.privacy` to the ship date.

**5.2 Terms (en/es/ru).** The line at `terms.en.tsx:131` (and the same line
in es/ru) becomes "Lead capture, message drafting and voice notes use…". Set
`LEGAL_UPDATED.terms` to the ship date.

**5.3 Checks.**
- `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` all
  green, on Node 24.
- A visual check through a mock route in its own subfolder of
  `src/app/preview-tmp/` (see `project_visual_verification` in memory: never
  `__preview`, never `rm -rf` the folder, delete the route after). It
  renders the sheet in every state and the review cards with the worked
  example, at 375 px in light and dark.
- Screenshots through the chrome-devtools MCP, because the Browser pane has
  known paint issues.

**5.4 Commit and deploy.**
- Commit on main (the founder wants work on main, not worktrees), staging
  only this plan's files.
- Push once all the checks are green, then confirm the pushed sha has a
  Vercel deployment.
- Set `VOICE_NOTES_ENABLED=admins` on Vercel production and redeploy.

**5.5 Founder's device check.** These need a real device, which Claude can't
use:
- iPhone Safari, the installed PWA if it is installed, and Android or
  desktop Chrome.
- Hold to talk, tap mode, a 3-minute note, a client-page note, an ambiguous
  name, a new client at the Free cap, and Save.

Afterwards Claude checks:
- `voice_notes` rows reached `applied`
- `audio_path` is null
- `storage.objects` has nothing left under `voice-notes/`
- Vercel shows no runtime errors

**5.6 Pilot.**
1. `VOICE_NOTES_ENABLED=pilot`, with 3–5 agents in `VOICE_NOTES_PILOT_EMAILS`.
2. After two weeks, read from `voice_notes`:
   - notes per agent per week
   - the share that reached `applied`
   - how often cards were edited before Save (compare `proposal` with
     `applied`)
   - cost per note
3. Report to the founder before switching to `all` and writing any marketing
   copy (D12).

## Test plan

**Unit tests**
- `flags`
- `formats`
- `schema` (both)
- `prompt`
- `match`
- `dates`
- `apply-map`, including `mergePreferences` and the produced inputs passing
  the real zod schemas
- `openrouterTranscribe` with a mocked fetch

**Real calls (Phase 0 and 5.5)**
- both containers
- English and Spanish
- a bound-client note
- an end-of-day note about several clients

**Manual**
- Permission denied, then the explainer.
- Leaving the app mid-processing: the note appears as open and can be
  finished.
- Offline upload fails cleanly.
- Free cap blocks a new client but not the other cards.

## Done criteria

- An agent on the flag can hold + or tap Voice note, speak, review the cards
  and save. The client timeline, tasks, viewing, preferences, stage and
  appointment all show the saved changes.
- Unfinished notes can be resumed or discarded.
- After processing, no audio remains in Storage, and no transcript appears in
  logs.
- Privacy and terms describe voice notes in all three languages, with new
  effective dates.
- All checks are green, the pushed sha is deployed, and the founder's device
  check has passed.
- "As built" below is filled in: versions, working formats, measured cost
  per minute and anything that differed from this plan.

## STOP conditions

1. **Transcription.** In Phase 0, no OpenAI-served transcription model
   accepts both a webm (Opus) and an m4a (AAC) file. Choosing another
   provider changes the privacy page, so the founder decides.
2. **Data retention.** `zdr: true` is refused for the chosen model, and the
   only way to make it work is to drop zero data retention. Report it and
   let the founder decide; the privacy wording depends on it.
3. **AI SDK.** It can't produce schema-valid output with zod 4 or the
   JSON-schema fallback, or it breaks `next build`.
4. **Client list.** The design would need to send the agent's client list to
   the model. That breaks D7.
5. **Live database.** The live DB has no `set_updated_at()`, or a
   `voice_notes` table already exists, or the Free-cap trigger behaves
   differently from "Current state".
6. **Drift.** The drift check shows changes to `mobile-tab-bar.tsx`,
   `new-actions.ts` or the reused actions that you can't reconcile.

## Maintenance notes

- Model ids and prices move. Check `usage.cost` per note, and recheck the
  OpenRouter STT page every quarter.
- iOS Safari's MediaRecorder output has changed between releases. When a
  founder device check fails, start at `formats.ts`.
- `VoiceExtraction`, `apply-map.ts` and `match.ts` are meant to become the
  first tools of a later chat assistant. Keep them free of UI code.
- Voice notes sent over WhatsApp would reuse everything after "upload". It
  needs Meta business verification, which needs the legal-entity details
  still missing from `src/lib/legal.ts`.

## Sources (checked 2026-11-08)

- OpenRouter STT guide: https://openrouter.ai/docs/guides/overview/multimodal/stt
- OpenRouter STT API reference: https://openrouter.ai/docs/api/api-reference/stt/create-transcription
- OpenRouter audio APIs announcement (2026-05-01, updated 2026-07-07): https://openrouter.ai/blog/announcements/announcing-audio-apis/
- OpenRouter zero data retention: https://openrouter.ai/docs/guides/features/zdr.md
- AI SDK structured data: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
- AI SDK v7 migration guide: https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0
- AI SDK transcription: https://ai-sdk.dev/docs/ai-sdk-core/transcription
- OpenRouter AI SDK provider: https://github.com/OpenRouterTeam/ai-sdk-provider
- Reddit readout (internal): https://claude.ai/artifact/QTsySqiJMpy9Vbs4MD3c3u

## As built

### Phase 0 (2026-11-08)

Phase 0 ran on the founder's "Start Phase 0", on Node 24.15.0. Everything
passed except zero data retention (STOP 2). That needs the founder's decision
before Phase 2. Nothing is committed yet.

**Samples.** Made with macOS `say` (Daniel en_GB, Eddy es_ES) and ffmpeg. Each
is about 18 s, with two clients, a budget, a weekday and a date:
- `webm`/Opus at 32k (76 KB), like Chrome and Android
- `mp4`/AAC at 64k (164 KB), like iOS Safari

**Transcription** (`POST /api/v1/audio/transcriptions`, JSON base64):
- `openai/gpt-4o-mini-transcribe`:
  - 5 of 5 cases returned 200 in 1.1–1.5 s.
  - English and Spanish were near-perfect, including "1.5 million",
    "800.000 euros", "Nueva Andalucía" and "Svensson".
  - Cost $0.00059–0.00061 per 18 s note, about **$0.002 per minute**.
  - Formats: `webm` works for the webm file. For the iOS-style mp4 file,
    **both `m4a` and `mp4` work**; use `m4a` (the documented value).
- **Zero data retention is not available for any OpenAI transcription model.**
  `provider: { zdr: true }` returned 404 ("No endpoints found matching your
  data policy (Zero data retention)") for:
  - `openai/gpt-4o-mini-transcribe`
  - `openai/gpt-4o-transcribe`
  - `openai/whisper-1`
  - `openai/gpt-transcribe`

  All four work with `provider: { data_collection: "deny" }`. Costs per
  18 s: gpt-4o-mini-transcribe $0.00059, gpt-transcribe $0.00135,
  gpt-4o-transcribe $0.0012, whisper-1 $0.0018.
- **Zero-retention alternative**: `openai/whisper-large-v3` with
  `provider: { zdr: true }`.
  - Works for webm and mp4/m4a, in English and Spanish.
  - Cost $0.000134–0.000139 per 18 s, about $0.00045 per minute.
  - OpenRouter's generation lookup showed **DeepInfra** served it. Routing
    can't be pinned for transcription, so Together or Groq may also serve it.
  - Its punctuation and spacing are slightly rougher.
- `openai/whisper-large-v3-turbo` (zero retention) mis-detected the Spanish
  note as Russian. Don't use it without a language hint.

**Extraction.**
- Installed `ai@7.0.153` and `@openrouter/ai-sdk-provider@3.1.0`
  (`--save-exact`; zod stays at 4.4.3).
- `generateText({ model: openrouter.chat("openai/gpt-4o-mini", { usage: { include: true } }), instructions, prompt, output: Output.object({ schema }) })`
  returned **schema-valid objects** for both transcripts.
  - The schema was a trimmed `VoiceExtraction`, using zod 4 `.nullable()`
    and `.describe()`. Zod 4 works directly; no JSON-schema fallback needed.
  - 4.4–5.0 s and $0.00027–0.00029 per note
    (`providerMetadata.openrouter.usage.cost`).
- What it got right:
  - Every relative date (today Sun 2026-11-08, Europe/Madrid): Friday →
    2026-11-13, Tuesday → 2026-11-10, Thursday at 11 → 2026-11-12T11:00,
    "the 20th" → 2026-11-20.
  - The budgets came out as numbers (1500000, 800000).
  - A seller who called was spotted (`side: seller`, channel `call`).
  - A Spanish note came back with English notes (the UI language).
- **Prompt rules to add in Step 2.5**:
  1. When the agent says they showed or visited a property with someone,
     fill `viewing`. The English note's villa viewing went only into `note`.
  2. An in-person viewing means `spoke_with_them.channel = "meeting"`. It
     returned `other`.
  3. "X is flying in on <date>, book a viewing day" may come back as a task
     due that date or as an appointment. Both are fine because the agent
     edits the card; say which one we prefer.

**Total running cost** is about $0.0009 per 18 s note, which is roughly
$0.003 per minute of audio, all in.

**Build.**
- `npm run typecheck`: 0.
- `npm run build`: 0, with a throwaway route under
  `src/app/preview-tmp/voice-sdk-check/` that imported `ai`, the provider
  and zod. It compiled as a dynamic route.
- The route and folder were then deleted, `npx next typegen` ran, and
  typecheck was 0 again.
- The spike scripts lived in the session scratchpad and
  `node_modules/.cache/` (deleted).

**Lockfile.**
- The install added @ai-sdk/gateway, @ai-sdk/provider,
  @ai-sdk/provider-utils, @openrouter/ai-sdk-provider, @vercel/oidc,
  @workflow/serde, ai, eventsource-parser and json-schema.
- It removed a nested `next-intl/node_modules/@swc/helpers` copy and moved
  `undici` from 7.28.0 to 7.30.2.
- None of the new packages has an advisory.

**Already in the dependency tree** (npm audit on 2026-11-08: 21 advisories):
- critical: `next` 16.2.6 (proxy bypass; Server Actions denial of service),
  fixed in 16.4.5
- high: `zod` <4.6.6 (memory exhaustion validating oversized collections)
- high: postcss and sharp, both through next
- high: vite, plus dev-only tooling

This work doesn't cause them. Fix them separately, and do the zod bump
before Phase 2's validation lands.

**Open decision for the founder (STOP 2):**
- (a) **OpenAI `gpt-4o-mini-transcribe` with `data_collection: "deny"`.**
  - Best accuracy.
  - The same terms as LeadWing's two existing AI features: OpenAI may keep
    the data briefly for abuse monitoring and doesn't train on it.
  - The privacy page names the same companies as today.
- (b) **`whisper-large-v3` with zero data retention.**
  - About a quarter of the cost.
  - No provider keeps the audio.
  - The privacy page has to add DeepInfra, and possibly Together or Groq,
    as recipients.
  - Slightly rougher text.

Claude recommends **(a)**: same providers as today, best accuracy, and the
audio is deleted on our side straight after transcription.

**Decided 2026-11-08: the founder chose (a).** Transcription uses
`openai/gpt-4o-mini-transcribe` with `provider: { data_collection: "deny" }`
and no `zdr`. STOP 2 is closed. The privacy text keeps "OpenRouter, Inc. and
OpenAI" and the existing sentence about OpenAI's business terms.

### Phases 1–4 and 5.1–5.3 (2026-11-08)

The founder answered "OpenAI (a)" and Claude carried on. Nothing was
committed or deployed that day. Every check was green on Node 24:
- `npm run typecheck`: 0
- `npm run lint`: 0 (no warnings in voice files)
- `npm test`: 87 files, 1,295 tests
- `npm run build`: 0, with `ƒ /api/voice-notes/[id]/process`

**Data**
- `20261108120000_voice_notes.sql` is **applied to the live DB** with its
  history row. The probe showed RLS on, 1 policy, the index, the trigger and
  7 checks.
- A rolled-back RLS test ran as two real agents:
  - an agent can add a note on their own client;
  - they're refused on another agent's client and as another agent;
  - a bad status is refused;
  - agent B sees and updates 0 of A's notes.
- `voice_notes` was added to `types.ts`, after `site_events`.

**Server**
- `openrouterTranscribe()` (`data_collection: "deny"`, no zdr).
- `src/lib/ai/openrouter.ts`.
- `src/lib/voice/` with tests: `formats`, `dates`, `schema`, `prompt`,
  `match`, `proposal`, `apply-map`.
- `src/lib/actions/voice.ts`: `createVoiceNote`, `discardVoiceNote`,
  `listOpenVoiceNotes`, `getReadyVoiceNote`, `applyVoiceNote`.
- The route `src/app/api/voice-notes/[id]/process/route.ts`.

**UI**
- `src/components/voice/`: the recorder hook, provider, review, saved, button
  and menu item.
- The phone's + records on a 350 ms hold.
- "Voice note" is the first New action.
- A Voice note button sits on the client's activity panel.
- Strings live in `messages/{en,es,ru}/voice.json` plus
  `nav.mobile.voiceNote` and `server.voice.errors`. ES and RU are Claude's
  translations; no native review yet.

**Differences from the plan**
- **The client-page button is in `activity-panel.tsx`, not
  `contact-log.tsx`.** The Log contact button lives in
  `client-detail-view.tsx`, which the parallel agent-pages session was editing.
- **"Voice note" goes through `openNewInPlace()`.** It dispatches the
  `lw:voice-note` event; ⌘K and the phone's + sheet already call it.
  `newActionsFor({ voiceNotes })` hides it while the flag is off. Home's
  server-rendered New menu uses the small client `VoiceNoteMenuItem`.
- **While + is held, a non-modal floating bar shows instead of the sheet.**
  Radix's modal sets `pointer-events: none` and would swallow the release, so
  the release is listened for on `window`.
- **`discardVoiceNote` also clears the transcript and proposal.** The privacy
  text promises that.
- **Live runs found two problems, both fixed with tests:**
  - The model sometimes writes the word "null" for unknown names. The clean-up
    step now treats placeholder words as empty, and the instructions ask for a
    JSON null.
  - The transcription spelled "Svensson" as "Svenson". Surname matching now
    forgives 1 letter from 5 letters (2 from 9). It's sure only when the first
    name also matches; otherwise the card asks.
- **Instruction rules added:**
  - budget_max is "up to", "max" or a single figure; budget_min only for
    "from" or "at least";
  - task titles name the person;
  - JSON null, never the word.

**Live pipeline check** (throwaway test, deleted; real OpenRouter calls,
English and Spanish samples)
- English: 4 of the last 5 runs passed every assertion. The failing run was
  the "Svenson" spelling, now handled, and the 2 runs after the fix passed.
- Spanish: passed (Carlos's viewing, €800,000 budget max, María as a seller,
  appointment Thursday 11:00).
- Per 18 s note: transcription 1.5 s and $0.00059; extraction 6–7 s and
  $0.00044. About $0.0035 per minute of audio, all in.

**Visual check**
- A throwaway `src/app/preview-tmp/voice-notes` page (deleted, types
  regenerated), shot with the cached headless Chrome at 390 px, light and dark.
- It showed the review cards with the worked example, the Saved screen and the
  bottom sheet.
- Fixed after the first shot: to-do titles were squeezed by the date button
  (the date now sits below), and the old budget now shows as "Was €1,200,000".

**Legal**
- `privacy.{en,es,ru}` section 5 (third feature, what's sent, recording
  deletion, discard deletes the text, nothing saved before Save) and the
  section 6 row.
- `terms.{en,es,ru}` §9.
- `LEGAL_UPDATED` privacy and terms set to 2026-11-09, the ship day.

### 5.4 Shipped to admins (2026-11-09)

The founder said "Commit and push" to "commit and push it, switched on for
admins only?".
- One commit on main with only this plan's files and hunks. The agent-pages
  commit `2cc4a0d` and the security fix `b07d4e6` were already on origin.
- typecheck, lint, tests and build re-ran on that exact commit in a
  throwaway checkout, on Node 24.
- `VOICE_NOTES_ENABLED=admins` was set on Vercel production before the push,
  so the push's deployment picks it up.
- The founder's account is the only admin, so nobody else sees voice notes.
- The `attachments` bucket accepts any file type up to 15 MB (checked live),
  so `audio/webm` and `audio/mp4` uploads need no bucket change.

**Still to do**
- 5.5: the founder's device check (iPhone Safari and Android Chrome).
- 5.6: the pilot.
