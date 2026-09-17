# Plan 017: WhatsApp conversations on the client card (official coexistence)

> **Executor instructions**: Follow this plan phase by phase. Run every
> verification command and confirm the expected result before moving on. If a
> "STOP conditions" item occurs, stop and report; do not improvise. When done
> (or when a phase ends), update this plan's row in `plans/README.md`. **The
> row does not exist yet** (rows 013–016 are missing too; add only this one):
> `| 017 | WhatsApp conversations on the client card (official coexistence) | P2 | L–XL | 016 Phase 1 (see Depends on), 011 (soft) | TODO (gated) — [plan](017-whatsapp-coexistence.md) |`
>
> **This plan is gated.** Before the 9 Oct 2026 checkpoint, only these parts
> may run:
> 1. "Until this ships" (copy fix, interview questions, animation decision),
>    **due Sun 20 Sep 2026**, the day before outreach starts.
> 2. Phase 0 (paperwork; its only code is the `src/lib/legal.ts` fill).
> 3. Phase 3 (App Review), if the founder picks D16's recommended answer and
>    business verification is approved. It needs no LeadWing code.
>
> Phases 2 and 4–8 start only after Phase 1 passes, unless the founder says
> otherwise in chat.
>
> **Drift check (run first)**:
> `git diff --stat 9bad570..HEAD -- src/lib/whatsapp.ts src/components/phone-input.tsx src/lib/countries.ts src/lib/crm.ts src/components/clients/whatsapp-button.tsx src/components/clients/message-composer.tsx src/components/clients/client-detail-view.tsx src/components/clients/client-sheet.tsx src/components/clients/client-form.tsx 'src/app/(app)/clients/[id]/page.tsx' 'src/app/(app)/clients/new/page.tsx' src/lib/actions/clients.ts src/components/settings/settings-view.tsx 'src/app/(app)/settings/page.tsx' 'src/app/(app)/admin/page.tsx' src/lib/actions/notifications.ts src/lib/notifications.ts src/components/notifications/notification-item.tsx 'messages/en/notifications.json' 'messages/es/notifications.json' src/lib/data/attention.ts src/lib/routes.ts src/proxy.ts src/lib/supabase/middleware.ts src/lib/supabase/admin.ts src/lib/access.ts src/lib/openrouter.ts src/lib/supabase/types.ts src/i18n/messages.ts src/app/api/stripe/webhook/route.ts src/lib/legal.ts src/content/legal src/content/pages src/components/landing/one-place.tsx src/components/landing/app-preview.tsx src/app/llms.txt/route.ts messages/en/landing.json messages/es/landing.json vercel.json .env.example package.json supabase/migrations`
> then `git status --short -- <the same paths>`, because other sessions leave
> uncommitted edits in this checkout that `git diff 9bad570..HEAD` can't see.
> Plans 009, 011–016 may land before this plan's build phases, so their files
> will show up. For anything else that changed, compare it with "Current
> state" first. A mismatch you can't reconcile is a STOP condition.
>
> **Shared working tree**: other Claude sessions may be editing this checkout at
> the same time. Stage only the files this plan names (`git add <path>`), never
> `git add -A`, and don't touch changes you didn't make. When a file carries
> another session's uncommitted hunks (today `plans/validation-interview-script.md`
> and `plans/README.md` do), stage only your hunks (`git add -p`, or a temporary
> index: `GIT_INDEX_FILE` + `git add` + `write-tree` + `commit-tree`). In
> `src/app/preview-tmp/` use your own subfolder and delete only that.

## Status

- **Priority**: P2. "Until this ships" is P0 and due Sun 20 Sep 2026.
- **Effort**: L–XL, about **18–25 dev days** plus Meta's waiting time:

  | Part | Estimate |
  |---|---|
  | Until this ships | 0.5 day |
  | Phase 0 (founder paperwork; Step 0.1 code) | 0.25 dev day + about half a day of founder time |
  | Phase 1 (interviews) | no dev time |
  | Phase 2 (spike, 11 event kinds, offboard/reconnect cycles) | 3–4 days |
  | Phase 3 (App Review with cURL/WhatsApp Manager) | 0.5 day + Meta's review |
  | Phase 4 (migration, RPCs, merge, relink hooks, sealing, plan changes, retries) | 7–9 days |
  | Phase 5 (settings in 7 states, connect page, pending list, prefilled new-client flow, EN/ES) | 4–5 days |
  | Phase 6 (send inside the window) | 1.5–2 days |
  | Phase 8a + 8b (legal and copy) | about 1 day |
  | Phase 7 (optional) | +2–3 days, not counted |

- **Earliest availability**: gate on 9 Oct + about 4–5 weeks of build + Meta
  review + lawyer review. The first design partner can't connect before the
  second half of November 2026. **Don't promise a date on outreach calls.**
- **Risk**: HIGH. A new public webhook that uses the service-role client, a
  third-party token per agent, personal message content (including the
  agent's family chats during history import), a live-DB migration on
  `clients`, and legal copy that must flip on the same deploy.
- **Depends on**:
  - **Plan 016** (`plans/016-real-contact-and-reminders.md`; untracked in the
    working tree since 16 Sep 2026, no README row yet) is the owner of:
    - Phase 1: the `client_contacts` log, `clients.last_contacted_at` (a
      cache that its trigger keeps equal to `max(client_contacts.occurred_at)`),
      the `clients_touch_updated_at` trigger (created only by 016 Phase 1 or
      015 B1; this plan never creates it and only merges `wa_contact_id` into
      its live skip array, D-E), and the quiet-buyer rule that reads
      `coalesce(last_contacted_at, created_at)`;
    - Phase 2: the first Vercel cron, and (D-C) `CRON_SECRET` with
      `src/lib/integrations/cron-auth.ts`, which whichever of plans 013, 014,
      016 or 017 lands first creates (expected: 016 Phase 2); and
      `src/lib/notify/generate.ts`, home of every time-based notification
      producer, this plan's time-based rows included (D-F; until then they
      run from this plan's cron or from `syncNotifications`). Event rows (this
      plan's connection and message events) are written by this plan at
      event time, respecting `notifications_agent_dedupe_idx`;
    - Step 8: `WhatsAppButton` recording taps.

    This plan **never writes `clients.last_contacted_at` directly** (016's
    trigger would overwrite it on the next log insert or delete). It inserts
    `client_contacts` rows instead. Phase 4 starts only when 016 Phase 1 is
    live: a hard dependency with no fallback (D15).
  - **Plan 009** is a finished design spike, not a build. 016 is its build
    and deliberately stops the quiet rule from relying on `updated_at`
    (016 "Overlaps").
  - **Plan 011** (export), soft: its "Your data" Settings panel sits above
    this plan's panel, and its export must learn the new tables (Step 4.10).
  - **Plan 012** (import), soft: the pre-connect prompt links to import, and
    an import re-runs matching (Step 4.10).
  - **Plan 013** (calendar sync), shared: the legal-entity fill (its P1),
    the cron auth helper `src/lib/integrations/cron-auth.ts` (`authorizeCron`,
    spec in 013 D22; created by whichever of 013, 014, 016 or 017 lands
    first, D-C), and the token module `src/lib/integrations/token-crypto.ts`
    with `INTEGRATION_TOKEN_KEY` (013 D9 = this plan's D9; plan 007 shares it
    too; one text blob per token, D-A).
  - **Plan 014** (portal lead inbox), soft: if it ships first, Step 5.3 is
    re-planned (see there).
  - **Plan 015** (agencies), soft: its B1 migration also writes the shared
    `clients_touch_updated_at()` skip array (adding `agency`, `agency_id`);
    whichever of 015 B1 or 016 Phase 1 lands first creates that function
    (never this plan), and every later plan merges its keys into the live array, never
    overwriting it (D-E); its `agencies.phone` becomes a second match target
    (D13).
- **Gated by**: the interview gate (Phase 1, decided at the 9 Oct 2026
  checkpoint); the legal-entity fill and Meta business verification
  (Phase 0); App Review and Access Verification (Phase 3, before any agent
  other than the founder can connect); 016 Phase 1 (Phase 4); lawyer review
  (Phase 8a).
- **Category**: feature
- **Planned at**: commit `9bad570`, 2026-09-16 (revised the same day after
  review)

## Why this matters

- **The landing page claims it today.**
  - `messages/en/landing.json:29`, key `landing.onePlace.body`: "…and the real
    conversation on WhatsApp. LeadWing pulls all of it onto one card per
    client…". The Spanish twin is `messages/es/landing.json:29` ("LeadWing lo
    reúne todo en una sola ficha").
  - `landing.onePlace.srSummary` (`:31` in both files) says email and WhatsApp
    "all flow into LeadWing".
  - The hero demo toast `landing.preview.toasts.reminderSent` (`:15`,
    "WhatsApp reminder sent to {name}", rendered at
    `src/components/landing/app-preview.tsx:200` and `:224-225`) says LeadWing
    sends WhatsApp messages by itself.
  - The code does not back any of it: WhatsApp is a `wa.me` link that records
    nothing. This plan makes the chat claim true for agents on the WhatsApp
    Business app; "Until this ships" makes the copy honest in the meantime.
- **WhatsApp is where the ICP's real client conversation lives.** HubSpot and
  Pipedrive offer official coexistence with 180 days of history, Clientify
  offers the official API with coexistence, Mobilia uses the official API
  directly with Meta, and Inmovilla sells an unofficial QR inbox (memory note
  of 16 Sep 2026, not re-checked here).
- **It gives the nudges a true signal.** Plan 016 counts contact the agent
  starts from LeadWing. Echoes of messages typed on the phone are the contact
  LeadWing can't see today.
- **Scope guard.** The competitive brief (16 Sep 2026) advises against a
  WhatsApp API *inbox*. This plan builds a read-mostly conversation panel on
  the client card, behind an evidence gate, not an inbox.

## Options considered (research 2026-09-16)

| Option | Cost per agent/month | Verdict |
|---|---|---|
| A. Honest copy + plan 016's contact logging, no integration | €0 | Do the copy part now regardless. Alone it leaves the consolidation pitch weaker than rivals'. |
| **B. Official coexistence, LeadWing as a direct Meta Tech Provider (Cloud API + Embedded Signup v4)** | about €0.10–0.30 for LeadWing, plus a share of a Supabase tier step (see Costs); Meta bills the agent's own card only for API sends and templates | **Recommended, if the gate passes.** Same number, same phone, 180 days of 1:1 history, live echoes, sanctioned by Meta. |
| C. Coexistence through a BSP partner plan (360dialog) | Growth plan: €500/mo with 10 numbers, then €25 each; at 20 agents €750/mo = **€37.50 per agent** (Starter would be €985) | Rejected: above the €29 Pro price per agent. |
| D. Manual chat-export upload on the client card | €0 | Fallback only if the gate fails but agents still want history (about 2 days; fragile parsing; no Web Share Target on iOS). Not in this plan. |
| E. Unofficial QR-linked device (Unipile, Whapi, Green API, Baileys, whatsmeow) | about €5–40 (not re-verified) plus ban risk | **Excluded.** Conflicts with WhatsApp's EEA Terms (reverse engineering, unauthorised access), a ban ends a solo agent's business, QR pairing has been broken in Baileys since 30 Jul 2026, and LeadWing would hold a live full-account session. |

## Decisions (open — founder to confirm)

Each row shows the recommended answer. Record the founder's answer in this
table (and in `plans/README.md`) before the phase in "Needed by".

**Batch decisions (17 Sep 2026, shared by plans 013–017; settled, not open)**,
cited in this file as D-A … D-I:
- **D-A** tokens: one text blob from 013's `token-crypto.ts`
  (`encryptSecret`/`decryptSecret`/`needsReencrypt`); no `bytea` parts,
  no `key_version` column, no parts helpers.
- **D-B** no integration token uses Vault; the one exception is 016 Step
  21b's optional `pg_cron` + `pg_net` fallback storing `CRON_SECRET`.
- **D-C** `cron-auth.ts` (`authorizeCron`) and `CRON_SECRET` come from
  whichever of 013, 014, 016, 017 lands first (expected: 016 Phase 2); an
  unset or wrong secret → 401 (`cron_secret_missing` /
  `cron_secret_mismatch`), no work; `vercel.json` crons are appended; the
  `pg_cron` fallback schedules every listed route at the same cadence.
  Before adding a cron route, check whether that fallback is active (016
  Step 21b's check); if it is, add a `cron.schedule` migration with 016
  Step 21b's recipe instead of a `vercel.json` entry (Step 4.7).
- **D-D** score letters at the 9 Oct checkpoint: J = WhatsApp (this plan,
  at least 3 of the first 8 solo agents).
- **D-E** the shared `clients_touch_updated_at` skip array: merge into the
  live one, never overwrite.
- **D-F** event notification rows are written by the owning plan at event
  time; time-based rows are producers in 016's `generate.ts`. Amended
  (third pass): before 016 Phase 2, a time-based producer runs from this
  plan's cron route or from the existing request-time `syncNotifications`,
  and moves into `generate.ts` when 016 Phase 2 lands (Step 4.5, retention
  step 9).
- **D-G** 016 Step 0.1 applies all five plans' interim copy in one commit.
- **D-H** 016 Phase 1 = 3–4 days.
- **D-I** Claude generates `INTEGRATION_TOKEN_KEY` and
  `WHATSAPP_NUMBER_HMAC_KEY` after the founder's OK, as Sensitive Vercel
  variables, with each value saved to the founder's password manager at
  creation; no runbook relies on `vercel env pull` for them. Custody steps:
  Step 2.1 ("Key custody").

| # | Question | Recommended answer | Alternatives | Needed by |
|---|---|---|---|---|
| D1 | What evidence opens the build gate? | Build only if **at least 3 of the first 8 solo agents** interviewed (the script's feature-bet denominator) meet **all three**: **(a) seen, not told**: in the script's §2 "show me" step the WhatsApp Business icon is on screen, the number is the agent's own (not an agency line), and they don't rely on creating new broadcast lists to send listings; **(b) a commitment after the interview**: in the design-partner ask, the full catch list (Step 5.1) is read out, and the agent books a dated connect session with their real number **and** has paid for or agreed to founding Pro; **(c) a past-tense cost story**: the last time they couldn't find what a client said, or missed a follow-up, and what it cost. Scored as **J (WhatsApp)** in the script (U2). Decide at the 9 Oct 2026 checkpoint. | Build regardless because rivals have it (not advised); ship option D only. | 9 Oct |
| D2 | Which plan gets it? | **Pro only** (admins count as Pro). Free sees a locked Settings row with one sentence on what it does. Reasons: support load per connection, and Meta's setup friction (Facebook sign-in, business portfolio, payment method), which only an agent who pays is likely to push through. | Free gets read-only sync for its 10 clients; a paid add-on. | Phase 4 |
| D3 | What is stored for chats with clients (and kept contacts, D13)? | Full text + metadata (direction, type, time, `wamid`, status) in Frankfurt. Media: type, file name and caption only, **never the bytes**. Rolling retention by daily cron, agent setting 3 / 6 / **12** months (default 12). Trade-off: a commission dispute can outlast 12 months; the agent exports first (plan 011) or attaches the proof to a registration (plan 015). | Summaries only (every thread goes to a US model); metadata only (nudges work, no conversation shown); a 24-month option. | Phase 4 |
| D4 | Chats that match no client (friends, family, new leads)? | **Pending contacts, short-lived and sealed.** Only messages from the **last 14 days** are stored, bodies, captions and file names **sealed** (AES-256-GCM); each message is deleted **14 days after it arrives**; the pending contact row (WhatsApp name, number or BSUID, count, times) is deleted **14 days after its last message**. "Ignore" deletes the contact at once and keeps only an **HMAC** of the number so it is never stored again. History older than 14 days is not stored for unmatched chats, so the agent is prompted to import clients **before** connecting (Step 5.1). | Keep pending rows forever and disclose it; never store unmatched bodies (new leads lose their first messages). | Phase 4 |
| D5 | Can the agent send through the API? | Phase 6: inside the 24 h window only, a **"Send from LeadWing"** button next to "Open in WhatsApp", which stays the default. Outside the window, only `wa.me`. Templates only in Phase 7 and only if agents ask. **Nothing is ever sent automatically.** | Templates from day one; no API sending at all. | Phase 6 |
| D6 | What counts as contact for plan 016's log? | **Outbound only** (phone echoes, API sends, outbound history) of a **linked** contact. One `client_contacts` row (`channel 'whatsapp'`, source `whatsapp_phone` or `whatsapp_api`) at the message time, only when it is more than 1 hour after the client's current `last_contacted_at` (so a burst or a tap + echo is one row). Inbound only moves `wa_contacts.last_inbound_at` (a later "awaiting your reply" signal). | Count inbound too (hides unanswered clients); a row per message (thousands of rows per history import). | Phase 4 |
| D7 | Legal entity for Meta verification (also fills `src/lib/legal.ts`) | The founder's **autónomo** registration, if it exists (name, NIF, fiscal address), with a visible "LeadWing is a trading name of <legal name>" line; start Meta business verification with a recent AEAT *certificado de situación censal*. Re-verify with Meta if an SL is formed later. **If there is no registration yet, registration comes first** (STOP). | Incorporate an SL first (weeks). | Phase 0 |
| D8 | How is Meta described in the privacy documents? | Meta is the **agent's own processor** under the WhatsApp Business terms the agent accepts in Embedded Signup, not a LeadWing sub-processor. Privacy §6 lists it as "a service you connect"; DPA annex A gains WhatsApp data, subjects and purpose; agents are told to inform their own clients. About an hour of lawyer review before launch, **including a DPIA screen** (whether the AEPD art. 35.4 list applies was not verified). If the lawyer says sub-processor, send the 30-day notice required by Terms annex D. | List Meta as a sub-processor and send the 30-day notice to all agents. | Phase 8a |
| D9 | Where do per-agent Meta tokens live? | **AES-256-GCM in the app, through the shared module `src/lib/integrations/token-crypto.ts`** (plan 013 D9: one decision for plans 007, 013 and 017; whichever plan ships first creates the module and the key). Key: `INTEGRATION_TOKEN_KEY` (32 random bytes, base64, only in Vercel) with `INTEGRATION_TOKEN_KEY_VERSION` (default `k1`); the Meta token's AAD is `whatsapp:<agentId>`. `wa_connection_secrets` (RLS on, no policies, no `anon`/`authenticated` privileges, so service_role only) stores the token as ONE text column, `token_blob`, exactly as the module's `encryptSecret` returns it (`"<keyVersion>.<iv>.<ciphertext>.<tag>"`), plus created/rotated times: no `bytea` parts, no `key_version` column, no parts helpers; rotation finds stale rows with the module's `needsReencrypt` (D-A). No integration token uses Vault; the batch's one Vault use is plan 016 Step 21b's optional `CRON_SECRET` (D-B). Claude generates `INTEGRATION_TOKEN_KEY` and `WHATSAPP_NUMBER_HMAC_KEY` after the founder's OK, piped into Vercel as Sensitive variables, with each value also saved to the founder's password manager at creation (D-I). Why: one mechanism across 007, 013 and 017; one rotation runbook and plain unit tests instead of a secret store bound to the database; the key (Vercel) and the ciphertext (Supabase) sit with different providers; Vault's role privileges and plan availability are undocumented, and the 16 Sep probe showed any `postgres` session (including Claude's routine `SUPABASE_DB_URL` probes) can read `vault.decrypted_secrets`. **Message content uses the same module and key** with its own AAD labels (`whatsapp-body:<agentId>`, `whatsapp-payload:<sha256>`), sealed as UTF-8 text through `encryptSecret` (the module exports only `encryptSecret`, `decryptSecret` and `needsReencrypt`; no byte helpers), so there is no `WHATSAPP_DATA_KEY`. The one separate key is `WHATSAPP_NUMBER_HMAC_KEY` for number HMACs (D4), for a distinct reason: marks can't be recomputed (numbers aren't stored), so that key must never rotate along with `INTEGRATION_TOKEN_KEY`. | Supabase Vault 0.3.1 (installed on the live DB) behind security-definer RPCs, following the `email_accounts.token_ref` precedent: rejected for the reasons given. A separate `WHATSAPP_DATA_KEY` for message content: rejected (same threat model and key custody as the tokens). | Phase 4 |
| D10 | Cloud API Local Storage (`data_localization_region`)? | **Not in v1.** Meta keeps messages at most 30 days under the agent's own terms, LeadWing's copy is in Frankfurt, and it is untested with coexistence. Revisit if an agency asks. | Enable at registration for every agent. | Phase 4 |
| D11 | AI summaries? | **Leave out of v1.** If added (Phase 7): opt-in per agent, on demand per client, via OpenRouter with `data_collection: "deny"` and `zdr: true`, **which routes `openai/gpt-4o-mini` to Microsoft Azure** (OpenRouter's ZDR list on 16 Sep 2026 showed only `azure` and `azure/swedencentral`). That makes Azure a new or replaced sub-processor: Terms annex D's 30-day notice first. | Keep OpenAI as the processor and drop `zdr` (then Meta's no-training term rests on OpenAI's business terms only). | Phase 7 |
| D12 | What happens when a connected agent drops to Free (Stripe cancellation, or comped Pro time running out)? | **Pause**: store no new message content (account events still handled), keep existing WhatsApp data read-only for **30 days**, then delete it all, delete the token and call `DELETE /<waba_id>/subscribed_apps`. Resume on its own if the agent is Pro again within 30 days (messages from the pause are not recovered). Bell rows at pause, at day 23 and at deletion. Privacy §10's "Downgrading from Pro to Free deletes nothing" gains this exception. | Delete at once; keep syncing for Free (contradicts D2). | Phase 4 |
| D13 | Chats with agencies, other agents and developers (not clients)? | A **"Keep"** action on the pending list (status `kept`): the chat is unsealed and kept under D3's retention, because these chats carry buyer registrations, split agreements and commission chasing. When plan 015 B1 is live, `agencies.phone` becomes a second match target (auto-`kept`, linked to the agency). Attaching a message to a registration record waits for plan 015 B2. | Leave them pending (bodies deleted after 14 days); out of scope entirely. | Phase 4 |
| D14 | The onePlace animation (WhatsApp and Mail icons fly into the wing) | **Match the new words**: the WhatsApp and Mail tiles stay in the cloud and dim at `CARD_STEP` instead of flying in, with no change to the stage height. Decide by 20 Sep. | Leave it (the words set the claim; sighted and screen-reader visitors then get different claims). | 20 Sep |
| D15 | Where do plan 016's pieces come from if 016 Phase 1 isn't live when Phase 4 starts? | **Build 016 Phase 1 first** (3–4 days). Decided 17 Sep 2026 (third pass): 016 Phase 1 is a hard dependency; this plan never creates `clients_touch_updated_at` (only 015 B1 or 016 Phase 1 can, D-E) and only merges `wa_contact_id` into its live skip array. | None: the earlier fallback (build without contact writes, self-create the trigger) was dropped. | Phase 4 |
| D16 | Submit App Review before the gate? | **Yes, with Meta's own tools**: record the two videos with the API Setup cURL script and WhatsApp Manager (Meta accepts both), right after business verification. No LeadWing code, no system-user token in our env. If the gate fails, nothing is lost but an hour. | Wait for the gate and record inside LeadWing (needs an admin send form, a template form and a `WHATSAPP_SPIKE_TOKEN`). | Phase 3 |

## Current state (verified 2026-09-16 at `9bad570`)

1. **Working tree**: HEAD is `9bad570`. Uncommitted changes are plan files
   only: `plans/README.md` and `plans/validation-interview-script.md`
   (another session added §5b), and untracked `011`–`017`. No source change
   touches WhatsApp.
2. **WhatsApp today is a link.**
   - `src/lib/whatsapp.ts:1`: "Agent-initiated WhatsApp via free wa.me deep
     links — no API/key needed".
   - `normalizePhone` (`:17-23`) trims, strips a leading `00`, keeps digits,
     needs ≥ 6 digits. It never adds a country code: `600123456` stays 9
     digits.
   - `whatsappLink` (`:68-76`) builds `https://wa.me/<digits>?text=…`.
   - Plan 012 adds a *different* `normalizePhone(raw, defaultDial)` in
     `src/lib/import/normalize.ts`. Don't confuse the two; this plan uses
     neither for matching (see `wa_phone_digits`, Step 4.1).
   - The form's `PhoneInput` stores `"<dial> <number>"`, e.g. `+34 600123456`
     (`src/components/phone-input.tsx:58-60`, `parsePhone` in
     `src/lib/countries.ts:112`). Lead-paste and older rows may lack a
     country code.
3. **`WhatsAppButton`** (`src/components/clients/whatsapp-button.tsx:15-45`)
   has no `"use client"`. It renders a plain `<a href={wa.me} target="_blank">`
   and records nothing. Used on the client card
   (`src/components/clients/client-detail-view.tsx:450`, block `:448-459`)
   and in the quick-view sheet (`src/components/clients/client-sheet.tsx:199`).
   Plan 016 Step 8 turns it into a recording client component.
4. **Composer**, `src/components/clients/message-composer.tsx`:
   - `type Channel = "whatsapp" | "email"` (`:48`).
   - `send()` (`:185-202`) only `window.open`s `wa.me` (`:194`) or sets
     `location` to `mailto:` (`:196`), then closes. Nothing is stored.
   - AI drafting (`:165-183`) calls `draftMessage`
     (`src/lib/actions/messages.ts`) → `src/lib/openrouter.ts`.
5. **Client card and client writes.**
   - `client-detail-view.tsx`: header primary action = `MessageComposer`
     (`:388-401`); Contact panel `:413-463`; main column starts `:494` with
     `TasksSection` (`:495-503`); Notes `:526-544`; `DocumentsSection`
     `:545-549`. The loader `src/app/(app)/clients/[id]/page.tsx:31-51` is one
     `Promise.all` with nothing WhatsApp-related. Task loaders return `null`
     when their table is missing, so a deploy can precede its migration.
   - `src/lib/actions/clients.ts`: `createClient(values)` `:54` (returns the
     new id), `updateClient` `:104` (writes `phone` at `:120`), `deleteClient`
     `:137` (the delete itself at `:183`). No other action deletes clients
     today (plan 012's import undo will).
   - `src/app/(app)/clients/new/page.tsx` reads only `side` and `compose`
     from `searchParams` (`:15`) and renders
     `<ClientForm side mode="create" compose>` (`:61`).
   - `src/components/clients/client-form.tsx` is `"use client"` (`:1`) and
     already accepts `defaultValues` (`:56`, `:62`); after a create it routes
     to the new client (`:117-118`).
6. **Schema and the live database.**
   - `clients.phone` is free text (`supabase/migrations/20260529120000_init.sql:41`);
     no normalised column, no index, no uniqueness. Buyers and sellers are
     separate rows (`side`), so one person can be two clients with one phone.
   - `clients_set_updated_at` (`init.sql:63-65`) runs `public.set_updated_at()`
     (`:19-29`, shared by many tables) and bumps `updated_at` on **any**
     update. Plans 015 (B1, skipping `agency`/`agency_id`) and 016 (Phase 1,
     skipping `last_contacted_at`) both replace it with one shared function,
     `clients_touch_updated_at()` (no-op updates skipped too). Whichever
     lands first creates its skip array; every later plan, this one included,
     reads the live function and merges its keys in, never overwrites (D-E).
   - RLS pattern: policy "agent owns clients" (`:251-254`).
   - Free cap: trigger function `public.enforce_free_client_limit()`
     (latest body in `20260916120000_free_client_limit_ten.sql`) raises
     `client_limit_reached` at 10 unless `public.is_pro(agent_id)`.
     `is_pro()` was first defined in `20260906120000_billing_referrals.sql:107-120`
     and redefined in `20260906130000_admins_are_pro.sql` to count
     `is_admin` as Pro, matching `isPro()` in `src/lib/access.ts:36-41`.
     `is_pro(uuid)` is granted to `service_role` (`billing_referrals.sql:424`).
   - No WhatsApp table, no `last_contacted_at`, no `client_contacts` exists.
     Latest migration file: `20260916120000_free_client_limit_ten.sql`.
   - Credential precedent: `email_accounts.token_ref` "reference to an
     encrypted secret in Supabase Vault" (`init.sql:188-199`); no code uses
     Vault yet, and D9 deliberately doesn't follow this precedent (app-level
     encryption, shared with plans 007 and 013). No integration token will
     use Vault; the batch's one planned Vault use is plan 016 Step 21b's
     optional `CRON_SECRET` (D-B).
   - Service-role-only precedent: the billing tables ("Every mutation … goes
     through the service-role client; authenticated users get SELECT on their
     own rows only", `20260906120000_billing_referrals.sql:16-19`).
   - **Read-only live probe (16 Sep 2026)**: Postgres 17.6; `supabase_vault`
     0.3.1 installed; `postgres` can select `vault.decrypted_secrets` and
     execute `vault.create_secret` (one reason D9 doesn't use Vault);
     database size 13 MB; 10 profiles; 14
     clients, 8 of them with no phone (the 6 with a phone all start with `+`
     or `00`); `wa_connections` and `client_contacts` absent; no
     `last_contacted_at` column; `clients` triggers are
     `clients_enforce_free_limit` and `clients_set_updated_at`
     (→ `set_updated_at`); newest history row `20260916120000`; role
     settings: `authenticated` `statement_timeout=8s`, `anon` `3s`,
     `service_role` none. The Supabase plan tier is not visible from the
     database.
7. **Quiet-client rule**: `src/lib/data/attention.ts:96-102` selects
   `updated_at` and filters `.lte("updated_at", staleBefore)` (`:102`);
   `:130-133` computes `quietDays` from `updated_at`;
   `STALE_AFTER_DAYS = 7` (`src/lib/attention.ts:13`). Plan 016 Step 10
   replaces the filter with `quietBuyersFilter` on
   `coalesce(last_contacted_at, created_at)`.
8. **Notifications.**
   - Written only by `syncNotifications` (`src/lib/actions/notifications.ts:90`)
     while the app is open; generic prune at `:387-396`. Plan 016 Step 13
     moves generation to `src/lib/notify/generate.ts` and Step 14 adds
     `/api/cron/notifications` (hourly).
   - Table columns: `type, title, body, client_id, appointment_id, dedupe_key,
     due_at, read_at` (+ `task_id`) — `20260601130000_calendar_notifications.sql:49-62`.
     Unique `(agent_id, dedupe_key)` (`:63-64`). Enum `notification_type`
     `:13-19`; `20260915120000_tasks.sql:116` adds `task_due` (and notes a new
     enum value can't be used in the transaction that adds it).
   - `src/components/notifications/notification-item.tsx:22` has
     `ICONS: Record<NotificationType, …>` (and `TONES`), so a new enum value
     fails typecheck until mapped. Labels: `messages/*/notifications.json`
     `types.*`. Routing: `notificationHref` (`src/lib/notifications.ts:11-22`).
   - Profiles carry `locale` (`en`/`es`, `20260906140000_profile_locale.sql:8`)
     and `time_zone` (`20260914120000_profile_settings.sql:9`), so server-side
     writers can localise.
9. **Webhook precedent**: `src/app/api/stripe/webhook/route.ts:31-57` reads
   `request.text()`, verifies the signature, records the event id first
   (`claimStripeEvent`), answers 503 when unconfigured. A cancellation sets the
   agent to `canceled` (`:131-135`); comped `pro_until` time expires with no
   event at all. Service-role client: `src/lib/supabase/admin.ts:11-17`
   ("scope every query by agent_id"). Token-authenticated precedent:
   `src/app/api/calendar/[token]/route.ts:21-24`, `:62`.
10. **Routing.**
    - `src/proxy.ts:67-77` matcher still runs `updateSession` on `/api/*`;
      `src/lib/supabase/middleware.ts:44-53` redirects only
      `PROTECTED_PREFIXES` (`src/lib/routes.ts:14-26`). A new
      `/api/whatsapp/webhook` and `/api/cron/whatsapp` pass through
      unauthenticated, as intended. No proxy change is needed.
    - `routes.test.ts` keeps `PROTECTED_PREFIXES` in step with the folders
      under `src/app/(app)`; `src/app/robots.txt/route.ts` disallows the same
      prefixes (and has its own test).
    - The apex 308-redirects to www. Meta's callback URL must be
      `https://www.leadwing.app/api/whatsapp/webhook`.
    - Vercel calls a cron on the production deployment URL (its docs show
      `https://*.vercel.app/api/cron`), and this project has Vercel
      Authentication on generated URLs (scope `all_except_custom_domains`,
      memory note). Whether cron calls pass it is not documented
      (**unverified**); plan 016 D5 has the same check and a `pg_cron` +
      `pg_net` fallback (016 Step 21b), the batch's one Vault use: it keeps
      `CRON_SECRET` in Vault because `pg_net` needs it inside the database
      (D-B; see Step 4.7).
    - `clientRecordId`'s regex (`src/lib/crm.ts:44`) excludes only
      `buyers|sellers|new`; this plan adds no route under `/clients/`.
11. **No background jobs**: `vercel.json` is only `regions: ["fra1"]`; no
    `/api/cron` exists. Functions run in fra1, next to Supabase eu-central-1.
    The repo has no `.vercel/` link (`.vercel` is in `.gitignore:43`).
12. **AI**: `src/lib/openrouter.ts:2` defaults to `openai/gpt-4o-mini`; the
    body (`:24-29`) sends no `provider` preferences.
13. **Legal and SEO copy that is true today and must flip only when this
    ships** (Phase 8):
    - `src/content/pages/crm-spain.en.tsx:108-113` (callout "does not connect
      to your WhatsApp account and does not read your conversations") and
      `:258-259` (FAQ "no WhatsApp inbox … never read");
      `crm-spain.es.tsx:112-114` and `:262-263` ("No hay bandeja de WhatsApp
      … no se leen nunca").
    - `src/content/pages/crm-marbella.en.tsx:136-139` ("There is no WhatsApp
      inbox either … conversations are not pulled into the app") and
      `:186-187` (FAQ "There is no WhatsApp inbox inside the app");
      `crm-marbella.es.tsx:137-139` ("Tampoco hay bandeja de entrada de
      WhatsApp … no entran en la aplicación") and `:187-188`.
    - Terms §10 (`src/content/legal/terms.en.tsx:138-144`): line `:140` and
      the start of `:141` are the ownership sentence ("Sign in with Google,
      Google Calendar, WhatsApp, Stripe and the property portals belong to
      their owners…"); the WhatsApp sentence runs from "{SITE_NAME} opens
      WhatsApp" (`:141`) to `:143`. Spanish (`terms.es.tsx:142-148`): the
      ownership sentence is `:144-145`; the WhatsApp sentence is `:146-147`;
      `:148` is `</p>`.
    - Terms DPA annex A (`terms.en.tsx:217-234`): nature and purpose
      `:224-226`, data `:228-232`, data subjects `:233` ("your buyers,
      sellers, prospects and their contacts"). Spanish: `:230-233`,
      `:235-239`, `:240`. Annex D (`terms.en.tsx:270-278`, `terms.es.tsx:282`)
      sets a 30-day sub-processor notice.
    - Privacy (`privacy.en.tsx`): §4 client data `:148`, §5 AI features
      `:180`, §6 sharing `:208` with the sub-processor table `:213-256` (no
      Meta row; "OpenRouter, Inc. and OpenAI" `:246`), §8 cookies `:272-318`
      ("only the cookies it needs … Nothing on this site tracks you across
      other websites" `:274-275`; the stale "keeps a copy of recently opened
      pages … offline" sentence `:309-311`, stale because 40ddb52 retired the
      service worker and `public/sw.js` is now a kill switch), §10 retention
      `:340-352` ("Downgrading from Pro to Free deletes nothing" `:344`;
      backups `:351`). Spanish: §4 `:151`, §5 `:186`, §6 `:214`, §8 `:282-333`
      (offline sentence `:323-326`), §10 `:355` ("Pasar de Pro a Gratis no
      borra nada" `:359`; backups `:367`).
    - `src/lib/legal.ts:10-23` still has `[Legal name]`, `[NIF]`, the address
      and `hostingRegion` placeholders (`:12-22`), so the legal pages show a
      draft banner; `LEGAL_UPDATED` `:26-30`. The legal notice renders the
      entity in `src/content/legal/legal-notice.{en,es}.tsx`.
    - `src/app/llms.txt/route.ts:48` and `:52` and the landing FAQ
      (`landing.faq.items.whatsapp`, `messages/en/landing.json:259-262`) are
      true today (draft + open in WhatsApp) and need no interim change.
      `src/app/layout.tsx:49-56` keywords don't mention WhatsApp.
14. **Plan gating**: `FREE_CLIENT_LIMIT = 10` (`src/lib/access.ts:16`),
    `isPro` (`:36`), `planState` (`:69`).
15. **Settings**: `src/components/settings/settings-view.tsx` is
    `"use client"` (`:1`), so it can't read env vars, `isPro` or the database.
    `src/app/(app)/settings/page.tsx:19-27` loads the user and profile and
    passes `email`, `fullName`, `timeZone` as props. `SettingsView` renders
    `<PreferencesPanel />` at `:170` (defined `:225`). Plan 011 inserts "Your
    data" after `:170`; the WhatsApp panel goes after that.
16. **Other `wa.me` surfaces** (unchanged by this plan):
    `src/lib/event-reminder.ts:7-16`, used by
    `src/components/home/upcoming-panel.tsx:73` and
    `src/components/calendar/event-row.tsx:40`.
17. **Dependencies**: no Meta SDK in `package.json`, and none is needed (plain
    `fetch` to `graph.facebook.com`; the Facebook JS SDK is injected by the
    connect page only, after a click). No `server-only` package is installed
    (Next's data-security guide recommends it:
    `node_modules/next/dist/docs/01-app/02-guides/data-security.md:238-243`).
    `.env.example` has no Meta variables. Node `24.x`, Next `16.2.6`.
18. **Next 16 docs checked**:
    - Webhooks in route handlers read the raw body
      (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md:559-590`).
    - `after()` works in Server Components, Server Functions, Route Handlers
      and Proxy (`…/04-functions/after.md:8`), runs within the route's
      `maxDuration` and runs even if the response errored (`:48-50`, `:54`).
    - `maxDuration` segment config:
      `…/03-file-conventions/02-route-segment-config/maxDuration.md`.
    - `next dev --experimental-https` exists (`…/06-cli/next.md:72`), but
      Meta can't reach localhost, so webhooks are tested on production behind
      a rollout flag (Step 2.1).
    - Cron is a Vercel feature, not in the Next docs (see Sources).
19. **Landing demos**: `src/components/landing/one-place.tsx:54-62` lists the
    seven tiles (`whatsapp` … `mail`) that fly into the wing; the result slot
    has a fixed min-height (memory note: looping demos must not change
    height). The hero toast text is one `truncate` line
    (`app-preview.tsx:502`), so a slightly longer string can't change height.
20. **Other plans in this batch** (all untracked, 16 Sep 2026; checked by
    grep): none of 013, 014, 015 or 016 edits `landing.onePlace.*` or
    `preview.toasts.reminderSent`, so this plan owns them; the toast reword
    is a required U1 row owned here. Plan 016 Step 0.1 applies U1 and the
    D14 animation change (`one-place.tsx`) in its one consolidated
    interim-copy commit (D-G). `src/lib/integrations/cron-auth.ts` and
    `CRON_SECRET` are created by whichever of 013, 014, 016 or 017 lands
    first (expected: 016 Phase 2; D-C). 014 plans a `lead_received` inbox and
    names a future `'whatsapp'` channel.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 |
| Lint | `npm run lint` | exit 0 (existing warnings OK) |
| Tests | `npm test` | exit 0, all pass |
| Build | `npm run build` | exit 0 |
| Probe the live DB | `node --env-file=<repo>/.env.local <scratchpad>/probe.mjs` with `pg` installed in the scratchpad; wrap the script in `begin read only` … `rollback` | prints only what you query; never print `SUPABASE_DB_URL` |
| Link the Vercel CLI (once) | `vercel link --project lena-crm --scope lepadatumihails-projects --yes` (writes `.vercel/`, which is gitignored) | "Linked" |
| Vercel env names | `vercel env ls production --scope lepadatumihails-projects` (after linking), or the Vercel MCP project tools | the Step 2.1 names are listed |
| Runtime logs | the Vercel MCP `get_runtime_logs` for project `lena-crm` (filter by path) | log lines, kept only 1 day on Pro |
| Webhook verify handshake (prod) | `curl -s "https://www.leadwing.app/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=$WHATSAPP_VERIFY_TOKEN&hub.challenge=42"` | `42` |
| Unsigned POST is refused (prod) | `curl -si -X POST https://www.leadwing.app/api/whatsapp/webhook -d '{}' \| head -1` | `HTTP/2 401` (or `503` while unconfigured) |
| Cron without secret (prod) | `curl -si https://www.leadwing.app/api/cron/whatsapp \| head -1` | `HTTP/2 401` |

The two secret-bearing curls need `WHATSAPP_VERIFY_TOKEN` and `CRON_SECRET`,
which live only in Vercel. **The founder runs them**, or, with the founder's
OK in chat, Claude pulls the values into the scratchpad
(`vercel env pull <scratchpad>/.env.prod --environment=production`), uses
them, and deletes the file straight after. A variable marked Sensitive in
Vercel can't be pulled (not re-verified); then the founder runs the curl.

## Suggested executor toolkit

- Read before Phase 2: `route.md` (webhooks), `after.md`, `maxDuration.md`
  (paths in Current state 18), Vercel's "Cron Jobs" and "Managing Cron Jobs"
  pages (`CRON_SECRET` arrives as `Authorization: Bearer <secret>`; the
  `x-vercel-cron-schedule` header tells two schedules on one path apart; the
  user agent is `vercel-cron/1.0`; delivery is best effort and can repeat, so
  jobs must be idempotent; no retries; redirects are final), and plan 016
  Steps 13–14 (the cron and producer shapes this plan reuses).
- Meta pages to keep open: Embedded Signup overview and implementation (v4),
  onboarding WhatsApp Business app users (coexistence), webhooks overview,
  the `account_update` reference, BSUIDs, pricing (URLs in Sources). Sample
  code there uses Graph API `v25.0`.
- Webhook field shapes: **capture them in the Phase 2 spike** with the
  shape-preserving redactor (Step 2.3) and build the zod schemas and fixtures
  from the captures. Meta's field-reference pages rendered little on 16 Sep
  2026 (the `account_update` reference did render); 360dialog's
  coexistence-webhooks page is the only secondary description (Sources).
- **Seeing signed-in UI without signing in**: render components from
  `src/app/preview-tmp/<your-own-folder>/page.tsx` with mock props (never a
  `_`-prefixed folder), delete only your folder afterwards, and grep
  `.next/types` and `.next/dev/types` for it. Radix overlays can freeze in the
  in-app browser pane; the chrome-devtools MCP works.
- Migration rehearsal and apply: plan 016 Step 3's script is the closest
  harness (`pg` in the scratchpad, `begin` … `rollback`, `as(id)` via
  `request.jwt.claims` + `set local role authenticated`, `ok`/`FAIL` lines,
  `expectError` with savepoints).

## Scope

**In scope** (the only files to create or modify, by phase):
- **Until this ships**: `messages/en/landing.json`, `messages/es/landing.json`
  (keys `landing.onePlace.body`, `landing.onePlace.srSummary`,
  `landing.preview.toasts.reminderSent`) and
  `src/components/landing/one-place.tsx` (only if D14 = "match"), all
  applied by plan 016 Step 0.1 (D-G), so this plan touches them only if it
  ships before 016 Step 0.1; `plans/validation-interview-script.md` (added
  blocks only).
- **Phase 0**: `src/lib/legal.ts`, `src/content/legal/legal-notice.{en,es}.tsx`
  (the trading-name line). Skip if plan 013 already filled them; then verify
  only.
- **Phase 2 (spike)**: `src/lib/wa-cloud/config.ts`, `graph.ts`,
  `signature.ts`, `redact.ts` (+ a test each);
  `src/app/api/whatsapp/webhook/route.ts`;
  `src/app/(app)/admin/whatsapp/page.tsx`,
  `src/components/whatsapp/embedded-signup-button.tsx`,
  `src/lib/actions/whatsapp-connect.ts`; `.env.example`; redacted fixtures in
  `src/lib/wa-cloud/__fixtures__/`.
- **Phase 4 (build)**:
  - `supabase/migrations/<timestamp>_whatsapp_coexistence.sql`
  - `src/lib/supabase/types.ts`
  - `src/lib/integrations/token-crypto.ts` (+ test; create only if plan 013
    or 007 hasn't; it exports only `encryptSecret`, `decryptSecret` and
    `needsReencrypt`: no `encryptBytes`/`decryptBytes`, no parts helpers,
    Step 4.5, D-A)
  - `src/lib/wa-cloud/tokens.ts`, `seal.ts`, `marks.ts` (number HMAC),
    `payload.ts` (zod), `match.ts`, `process.ts`, `relink.ts`, `retention.ts`,
    `sweep.ts`, `notify.ts` (+ a test each)
  - `src/app/api/whatsapp/webhook/route.ts` (final),
    `src/app/api/cron/whatsapp/route.ts` (+ test), `vercel.json` (or,
    if plan 016's `pg_cron` fallback is active, a `cron.schedule` migration
    instead; Step 4.7),
    `src/lib/integrations/cron-auth.ts` (create only if none of plans 013,
    014 or 016 has; D-C)
  - `src/lib/actions/whatsapp-connect.ts` (final, + test)
  - `src/lib/actions/clients.ts` (relink/release hooks, optional
    `waContactId` on create) + `src/lib/actions/clients.test.ts` (new)
  - `src/components/notifications/notification-item.tsx`,
    `src/lib/notifications.ts` (+ test), `messages/{en,es}/notifications.json`
  - `src/lib/notify/generate.ts` (the time-based producers: pending digest,
    "deleted in 7 days", `wa-idle`, `wa-history-late`), only if plan 016
    Phase 2 has landed; otherwise they run from this plan's cron or from
    `syncNotifications` (Step 4.5, retention step 9)
  - If plan 011/012 have landed: `src/lib/export/load.ts`,
    `src/lib/export/archive.ts`, `src/lib/actions/import.ts` (relink after a
    batch; release after an undo)
- **Phase 5 (UI)**:
  - `src/app/(app)/settings/page.tsx` (loads the panel state, passes props),
    `src/components/settings/settings-view.tsx`,
    `src/components/settings/whatsapp-panel.tsx`
  - `src/app/(app)/settings/whatsapp/page.tsx`,
    `src/components/whatsapp/embedded-signup-button.tsx` (final)
  - `src/lib/data/whatsapp.ts`, `src/lib/actions/whatsapp.ts` (+ test)
  - `src/components/clients/whatsapp-thread.tsx`,
    `client-detail-view.tsx`, `client-sheet.tsx`,
    `src/app/(app)/clients/[id]/page.tsx`
  - `src/app/(app)/clients/new/page.tsx`,
    `src/components/clients/client-form.tsx` (the `?wa=` prefill-and-link flow)
  - `src/app/(app)/whatsapp/page.tsx`,
    `src/components/whatsapp/pending-contacts.tsx`
  - `src/lib/routes.ts`, `src/lib/routes.test.ts`,
    `src/app/robots.txt/route.test.ts` (if it lists prefixes)
  - `messages/{en,es}/whatsapp.json` (new), `src/i18n/messages.ts`
- **Phase 6**: `message-composer.tsx`, `client-detail-view.tsx` and
  `src/app/(app)/clients/[id]/page.tsx` (the window-open flag),
  `src/lib/actions/whatsapp.ts`. `whatsapp-button.tsx` belongs to plan 016.
- **Phase 7 (optional)**: `src/lib/wa-cloud/templates.ts`,
  `src/lib/actions/whatsapp-summary.ts`, `src/lib/openrouter.ts`
  (an optional `provider` argument), a `wa_summaries` migration,
  `src/content/legal/privacy.{en,es}.tsx` (§5, §6).
- **Phase 8a / 8b**: `src/content/legal/{privacy,terms}.{en,es}.tsx`,
  `src/lib/legal.ts` (`LEGAL_UPDATED`),
  `src/content/pages/crm-{spain,marbella}.{en,es}.tsx`,
  `messages/{en,es}/landing.json`, `src/app/llms.txt/route.ts`,
  `src/lib/seo.ts` (`PUBLISHED` dates), `src/lib/faq.ts` (only if a new FAQ
  entry is added).
- `plans/README.md` (this plan's row) and this file (spike findings,
  decisions).

**Out of scope**:
- Group chats (never synced by Meta), media download or storage, voice-note
  transcription.
- A full inbox: assignment, unread counts per thread, read receipts sent by
  LeadWing, typing indicators, bulk or automatic sends, chatbots.
- Personal WhatsApp or any QR-linked session (option E).
- The quiet-client rule, `syncNotifications`, `WhatsAppButton` and the
  `client_contacts` table itself (plan 016 owns them); calendar reminder
  surfaces.
- Plan 008's match outreach via templates (keep `wa.me`).
- Chat-export upload (option D).
- More than one WhatsApp number per agent.
- Cloud API Local Storage (D10).
- Calling `POST /<phone_number_id>/register` for any number: Meta says to
  skip registration for Business-app numbers ("the number is already
  registered").

## Git workflow

- Commit on `main` (the founder ships from `main`; Vercel auto-deploys).
  Push only when the founder asks in chat.
- Commit style: `docs(landing): …` for the copy fix (only if this plan ships
  before plan 016 Step 0.1, which otherwise applies it; D-G); `docs(plans): …` for the
  script questions; `feat(whatsapp): …`, `feat(db): …`, `docs(legal): …`; one
  commit per step group.
- Every deploy before Phase 8a must keep the feature invisible to agents:
  `WHATSAPP_ROLLOUT` unset, `off` or `admin` (Step 2.1).
- End commit messages with the attribution line the session gives you.

## Until this ships (do now, due Sun 20 Sep 2026)

No gate. Three parts, all before the first interview on Mon 21 Sep 2026.
**Don't promise WhatsApp sync on outreach calls**: the earliest possible date
is the second half of November, and the gate may say no.

### U1: Copy fix

Applied by 016 Step 0.1; only if this plan ships before 016 Step 0.1, apply
your own rows alone in a `docs(landing)` commit (D-G). Replace exactly these
values:

| File | Key | New value |
|---|---|---|
| `messages/en/landing.json:29` | `landing.onePlace.body` | "Details in Notes, follow-ups in Reminders, viewings in Calendar, documents in Drive, and the real conversation on WhatsApp. LeadWing gives each client one card for their details, viewings, follow-ups and documents, with their WhatsApp chat one tap away, so “where did I put that?” stops being a question." |
| `messages/en/landing.json:31` | `landing.onePlace.srSummary` | "Instead of spreading a client across Notes, Reminders, Calendar, Google Drive, spreadsheets and email, you keep them on one LeadWing client card, with WhatsApp and email one tap away." |
| `messages/en/landing.json:15` | `landing.preview.toasts.reminderSent` | "WhatsApp reminder ready for {name}" |
| `messages/es/landing.json:29` | `landing.onePlace.body` | "Los datos en Notas, los seguimientos en Recordatorios, las visitas en Calendario, los documentos en Drive y la conversación real en WhatsApp. LeadWing da a cada cliente una sola ficha para sus datos, visitas, seguimientos y documentos, con su chat de WhatsApp a un toque, y «¿dónde lo apunté?» deja de ser una pregunta." |
| `messages/es/landing.json:31` | `landing.onePlace.srSummary` | "En vez de repartir a cada cliente entre Notas, Recordatorios, Calendario, Google Drive, hojas de cálculo y correo, lo tienes en una sola ficha de LeadWing, con WhatsApp y el correo a un toque." |
| `messages/es/landing.json:15` | `landing.preview.toasts.reminderSent` | "Recordatorio de WhatsApp listo para {name}" |

The toast is one truncated line (`app-preview.tsx:502`), so the new length
can't change the demo's height. The toast reword is a required row, owned by
this plan (Current state 20); 016 Step 0.1 applies it with the rest of U1.

Leave alone (true today):
- `src/app/llms.txt/route.ts` (lines 29, 48, 52 describe drafting and opening
  WhatsApp) and `src/app/layout.tsx:49-56` keywords (no WhatsApp term).
- `landing.faq.items.whatsapp` and `landing.deepDives.items.whatsapp`
  (drafts that open in WhatsApp).
- The SEO pages' "does not connect / does not read" statements and Terms §10.

All five plans in this batch (013, 014, 015, 016, 017) have "Until this
ships" copy on the same JSON files, `llms.txt` and layout keywords before
21 Sep, so plan 016 Step 0.1 applies all five tables in ONE commit (D-G). Its
file scope includes `messages/{en,es}/settings.json` (013's `languageHint`
row) and `src/components/landing/one-place.tsx` (this plan's U3).

### U2: Interview questions (the Phase 1 instrument)

Add these blocks to `plans/validation-interview-script.md`. Keep every
existing line, including the other session's §5b. All questions stay in the
past tense or ask the agent to show something; nothing describes the feature
before the interview ends (rules 1 and 2).

1. **In §2, after "pull up whatever you use to track clients"**, add:
   - "While your phone's out: which WhatsApp is that — can I see the icon?
     Is it the number your clients have, or an agency line?" *[Business app
     icon (the B) = yes for D1(a). Note personal vs Business, own vs agency.]*
   - "Scroll your chat list for me: of the last 20 chats, roughly how many
     are family or friends?" *[Privacy load of a history import.]*
   - "Show me the last message you sent to several buyers at once. How did
     you send it?" *[A broadcast list used for new listings = the connection
     would stop them creating new lists. Note it; it counts against D1(a)
     unless they accept the loss in the design-partner ask.]*
   - "Do you ever answer clients from a computer? Which app was it last
     time?" *[WhatsApp Web / Mac is fine after re-linking; WhatsApp for
     Windows can't be re-linked.]*
2. **In §3, after the forgotten follow-up question**, add: "Tell me about the
   last time you couldn't find what a client had said on WhatsApp. What did
   it cost you?" *[D1(c): a real past-tense cost.]*
3. **Scoring**, after the last existing score, add (letters across plans:
   A–E are the script's, F money and G registrations are plan 015's, H
   calendar is 013's, I portal enquiries is 014's, J is this plan's, K phone
   alerts is 016's): "**J. WhatsApp sync fit** — 🟢 only if §2
   showed the Business app on the agent's own number with no dependence on new
   broadcast lists, §3 gave a real cost story, **and** the design-partner ask
   ended in a dated connect session plus founding Pro (paid or agreed). Solo
   agents only."
4. **Decision rule, feature bets at 9 Oct, first 8 solo agents**, add: "**J
   green in ≥ 3** → build plan 017 (WhatsApp coexistence). **≤ 2** → keep
   the honest copy; revisit in spring 2027."
5. **After the interview**, below the design-partner ask, add: "*If they fit
   and WhatsApp came up:* read the catch list from plan 017 Step 5.1 word for
   word, then ask for a concrete step: *'If I had it ready, would you book 20
   minutes on [date] to connect your real number with me?'* and whether
   they've taken, or will take, the founding Pro offer. A booked date and Pro
   = commitment; 'sounds great' = no. Never promise a ship date."
6. **Cheat sheet**, add: "13. *(solo agents)* Show me the WhatsApp icon; own
   number? Family share of chats? Last group send, how? Computer app? Last
   lost WhatsApp detail, cost?"

The §3 addition adds about one minute; the §2 additions replace time already
spent looking at the phone, so the 25–35 min length holds.

**Verify**: `git diff plans/validation-interview-script.md` shows only added
lines from this step plus the other session's §5b hunk; stage only your hunks.
Commit: `docs(plans): add the WhatsApp sync questions to the interview script`.

### U3: The animation decision (D14)

Ask the founder before 016 Step 0.1's commit. If they pick "match", 016
Step 0.1 makes this change in that same commit (D-G; only if this plan ships
first, make it here with U1): in
`src/components/landing/one-place.tsx`, keep the `whatsapp` and `mail` tiles
out of the absorbed sequence (they stay at their rest position and fade to
about 60% opacity at `CARD_STEP`); don't change `REST_STEPS`, `CARD_STEP`
timing for the others, or any size.
**Verify** (only if changed): sample the next section's `offsetTop` and
`document.scrollingElement.scrollHeight` across one full loop at 375 px and
desktop, in `/` and `/es`; both stay constant (memory note on landing demos).

### U verification and commit

- `node -e "JSON.parse(require('fs').readFileSync('messages/en/landing.json'))"`
  and the same for `es` succeed; `npm test` passes.
- `/` and `/es` show the new paragraph at 375 px with no overflow.
- The rendered HTML of `/` and `/es` contains none of: "pulls all of it",
  "lo reúne todo", "flow into LeadWing", "entran en LeadWing",
  "reminder sent to", "enviado a".
- Commit: 016 Step 0.1's single commit carries U1 and U3 (D-G). Only if this
  plan ships before 016 Step 0.1, commit your own rows alone:
  `docs(landing): stop claiming WhatsApp chats flow into the card`.

## Steps

### Phase 0: Meta and legal paperwork (start this week)

Owner: the founder, with Claude preparing text and making the one code edit.
Effort: about half a day of founder time, then Meta's review (days to
weeks). **Order matters**: 0.1 must be live before 0.4 and 0.5, because
Meta compares the business name on documents with the portfolio and the
website (secondary sources, **unverified**), and the app needs a privacy
policy URL (Meta's Tech Provider page).

**Step 0.1: Legal entity (D7), a hard predecessor of 0.4 and 0.5.**
- Ask the founder whether an autónomo (or company) registration exists.
  **If not: STOP.** Registration comes first; it has its own monthly social
  security cost and lead time, which is the founder's call.
- The founder supplies legal name, NIF, fiscal address and the contact
  mailbox (never paste identity documents into chat).
- Plan 013's P1 needs the same fill. If it's already done, verify only.
- Edit `src/lib/legal.ts:10-23`: the values; `hostingRegion` =
  "EU (Frankfurt, eu-central-1)" (memory note of 15 Sep 2026); bump
  `LEGAL_UPDATED` (`:26-30`) for all three documents.
- In `legal-notice.{en,es}.tsx`, add one visible line: "LeadWing is a trading
  name of {legal name}." / "LeadWing es el nombre comercial de {legal name}."
- **Verify**: `npm run typecheck && npm test`; after the founder pushes,
  `/legal`, `/privacy`, `/terms` and the Spanish twins show the real name, NIF
  and address, the trading-name line, and no draft banner.
  Commit: `docs(legal): fill in the legal entity`.

**Step 0.2: Meta Business portfolio** at business.facebook.com, owned by that
entity, with two-factor authentication on the founder's Facebook account
(commonly required for admins; not re-verified).

**Step 0.3: Domain verification.** Business Settings → Brand safety → Domains
→ add `leadwing.app` → DNS TXT. With the founder's go-ahead in chat (it is a
persistent DNS change), run:
`vercel dns add leadwing.app @ TXT "facebook-domain-verification=<value>" --scope lepadatumihails-projects`.
**Verify**: `dig +short TXT leadwing.app` lists the value; Meta shows
"Verified".

**Step 0.4: Business verification** (Security Center → Start verification),
only after 0.1 is live: name, address, phone, website
`https://www.leadwing.app`, and a recent document showing name plus address
(try the AEAT *certificado de situación censal* first; which Spanish
documents Meta accepts for an autónomo is unverified). The founder uploads it;
Claude never handles the documents.
**Verify**: status reads "In review", later "Verified".

**Step 0.5: Meta app**, only after 0.1 is live. developers.facebook.com →
Create app → type Business, use case "Connect with customers through
WhatsApp", linked to the portfolio. Fill: icon, category (Business), privacy
URL `https://www.leadwing.app/privacy`, terms URL
`https://www.leadwing.app/terms`, data-deletion instructions URL
`https://www.leadwing.app/privacy` (§9 rights; Phase 8a adds
`#whatsapp`). Add **Facebook Login for Business** and create an Embedded
Signup configuration (WhatsApp, v4) with the coexistence (Business app
onboarding) option; Allowed domains and Valid OAuth redirect URIs:
`https://www.leadwing.app`. Note the App ID, App Secret and configuration ID
for Step 2.1 (the founder pastes the secret into Vercel; never into chat).

**Step 0.6: Phones.** The founder's own WhatsApp Business app, version
2.24.17 or later, on a number they can afford to experiment with (connecting
turns off broadcast-list creation, disappearing messages, view-once and live
location on it, and unlinks all linked devices). Plus a second phone with
WhatsApp for the App Review videos and the Phase 5 test data.

**Step 0.7: App Review text.** Claude drafts the two use-case descriptions
for Phase 3 (a message sent through the Cloud API and received in WhatsApp; a
template created in WhatsApp Manager), requesting **only**
`whatsapp_business_messaging` and `whatsapp_business_management`.

**Done when**: legal entity live, domain verified, business verification
submitted, app created with the Embedded Signup configuration.

### Phase 1: Interview gate (21 Sep – 9 Oct 2026)

The instrument is U2 (in the script by 20 Sep). Don't describe the feature
before the interview ends, and don't promise a ship date.

**Step 1.1.** After each interview with a solo agent, log one row in the
interview notes: Business app seen (y/n), own number (y/n), sends new
listings by broadcast list (y/n), family share of chats, computer app used,
cost story (quote), catch list read (y/n), connect session booked (date or
no), founding Pro (paid / agreed / no), score J (WhatsApp).

**Step 1.2 (Fri 9 Oct 2026).** Apply D1 to the first 8 solo agents. Record
GO / NO-GO with the counts in `plans/README.md` row 017 and in this file.
NO-GO: set the row to `REJECTED (gate failed: x/8)` and stop; the interim
copy stays. Fewer than 8 solo agents by 9 Oct: report the count and let the
founder decide (don't lower the bar silently).

### Phase 2: Sandbox spike (admin-only, 3–4 days)

Gated by: Phase 0 app + phones; Phase 1 GO (or the founder asks in chat).

**Step 2.1: Configuration.** `src/lib/wa-cloud/config.ts` exports
`waConfig()`. It returns `null` unless **exactly these** are set:
`WHATSAPP_APP_ID`, `NEXT_PUBLIC_WHATSAPP_APP_ID`, `WHATSAPP_APP_SECRET`,
`WHATSAPP_VERIFY_TOKEN`, `NEXT_PUBLIC_WHATSAPP_ES_CONFIG_ID`,
`WHATSAPP_GRAPH_VERSION`, and `WHATSAPP_ROLLOUT` set to `admin` or `pro`.
So every WhatsApp route answers 503 and every UI entry hides when those are
missing. It never checks the other rows of the table:
`INTEGRATION_TOKEN_KEY_VERSION` defaults to `k1` and never nulls the
config; `INTEGRATION_TOKEN_KEY` and `WHATSAPP_NUMBER_HMAC_KEY` are validated
by `token-crypto.ts` and `marks.ts` themselves when first used (Step 4.5);
`CRON_SECRET` is `authorizeCron`'s concern (Step 4.7). That way the Phase 2
spike webhook doesn't answer 503 before the Phase 4 keys exist. The
module starts with
`if (typeof window !== "undefined") throw new Error("wa-cloud/config is server-only");`
(no new dependency; adding the `server-only` package is the alternative the
Next docs recommend).

| Variable | Where | Value |
|---|---|---|
| `WHATSAPP_APP_ID` | server | Meta App ID |
| `NEXT_PUBLIC_WHATSAPP_APP_ID` | client | same (public) |
| `WHATSAPP_APP_SECRET` | server | App Secret (signature key + code exchange) |
| `WHATSAPP_VERIFY_TOKEN` | server | random 32+ chars |
| `NEXT_PUBLIC_WHATSAPP_ES_CONFIG_ID` | client | Embedded Signup configuration ID |
| `WHATSAPP_GRAPH_VERSION` | server | `v25.0` (Meta samples, 16 Sep 2026); passed to the client component as a prop |
| `WHATSAPP_ROLLOUT` | server | `off` (default) \| `admin` \| `pro` |
| `INTEGRATION_TOKEN_KEY` | server | shared with plans 007 and 013 (D9): 32 random bytes, base64, used by `token-crypto.ts` for the Meta token and sealed content; only if 007 or 013 hasn't created it: after the founder's OK, Claude creates it with the key custody steps below (a **Sensitive** variable; the founder keeps the only other copy in their password manager, because Sensitive variables can't be pulled back; D-I); never in `.env.local` |
| `INTEGRATION_TOKEN_KEY_VERSION` | server | `k1` (shared; D9); optional, defaults to `k1` |
| `WHATSAPP_NUMBER_HMAC_KEY` | server | 32 random bytes, base64, used only for number HMACs (D4); separate because it must never rotate with `INTEGRATION_TOKEN_KEY` (D9); created by Claude with the same key custody steps below (Sensitive, founder's OK first; D-I) |
| `CRON_SECRET` | server | created with `src/lib/integrations/cron-auth.ts` by whichever of plans 013, 014, 016 or 017 lands first (expected: 016 Phase 2, P7: `openssl rand -hex 32`); reuse it, create it here only if none has (D-C) |

`NEXT_PUBLIC_*` values are inlined at build time: changing one needs a
redeploy. With D16's recommended answer there is **no**
`WHATSAPP_SPIKE_TOKEN`; if the founder picks the alternative, add it to this
table and `.env.example`, and see Done criteria.

Add commented entries to `.env.example` (no values). Adding them to Vercel
production is a persistent configuration change: the founder approves in
chat and pastes the Meta secrets themselves; the random keys
(`INTEGRATION_TOKEN_KEY` if missing, `WHATSAPP_NUMBER_HMAC_KEY`) are
created by Claude after that approval, one at a time (D-I).

**Key custody** (both keys; `<NAME>` is the variable):
1. `(umask 077; openssl rand -base64 32 > <scratchpad>/<NAME>.key)` in one
   command (shell state doesn't persist between calls), giving a 0600 file
   in the session scratchpad; check the mode with `ls -l`.
2. `vercel env add <NAME> production --sensitive < <scratchpad>/<NAME>.key`.
3. Tell the founder the file path; the founder copies the value into their
   password manager.
4. Once the founder confirms, `rm -P <scratchpad>/<NAME>.key`.

The value is never printed in chat, logs or commits (no `cat`, no `echo`).
Runbooks never rely on `vercel env pull` for these two keys, and no plan
uses a local script holding them: re-encryption during rotation runs inside
a deployed server-side job (plan 013's runbook; Maintenance notes).

**Verify**: `npm run typecheck`; `config.test.ts` returns `null` when any of
the six required variables is missing and when `WHATSAPP_ROLLOUT` is unset
or `off`; returns a config when `INTEGRATION_TOKEN_KEY`,
`INTEGRATION_TOKEN_KEY_VERSION`, `WHATSAPP_NUMBER_HMAC_KEY` and
`CRON_SECRET` are all unset; and throws when `window` is defined.

**Step 2.2: Signature check.** `src/lib/wa-cloud/signature.ts`:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

/** Meta signs the exact request bytes: X-Hub-Signature-256 = "sha256=" + hex HMAC. */
export function validMetaSignature(raw: Buffer, header: string | null, secret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const given = Buffer.from(header.slice(7), "hex");
  const expected = createHmac("sha256", secret).update(raw).digest();
  return given.length === expected.length && timingSafeEqual(given, expected);
}
```

Read the body as bytes (`Buffer.from(await request.arrayBuffer())`), never
re-serialised JSON. **Verify**: `signature.test.ts` (node environment):
valid, wrong secret, missing prefix, odd-length hex, empty header.

**Step 2.3: Shape-preserving redactor and the spike webhook route.**

`src/lib/wa-cloud/redact.ts` exports `redactShape(value: unknown): unknown`:
- Objects: every key kept, values redacted recursively.
- Arrays: `{ "__array": <length>, "items": [<distinct item shapes>] }`, at
  most 5 distinct shapes (compare by `JSON.stringify` of the redacted item),
  so a 1,000-message history chunk stays small but keeps its nesting.
- Leaves kept **verbatim** only under these keys (enum-like): `object`,
  `field`, `messaging_product`, `type`, `status`, `event`, `reason`,
  `initiated_by`, `phase`, `progress`, `chunk_order`, `sync_type`, `action`,
  `code`, `error_subcode`, `category`, `pricing_model`, `billable`,
  `mime_type`, `recipient_type`, `platform_type`. (Error `message`,
  `title` and `details` strings are redacted like any other string.)
- Everything else: a string becomes `"<digits:N>"` when it is all digits
  (N = length), `"<str:N>"` otherwise; a number becomes `0` (integers) or
  `0.5` (non-integers); booleans and `null` stay.

The spike route `src/app/api/whatsapp/webhook/route.ts`,
`export const maxDuration = 60`:
- `GET`: if `hub.mode === "subscribe"` and `hub.verify_token` equals
  `WHATSAPP_VERIFY_TOKEN` (constant-time), return `hub.challenge` as
  `text/plain` 200; otherwise 403.
- `POST`: 503 if unconfigured; 401 on a bad signature; otherwise parse JSON,
  `console.log("WA_SHAPE " + JSON.stringify(redactShape(json)))` plus the
  body size in bytes, and return 200. Nothing else is logged.

Vercel keeps runtime logs 1 day on Pro and accepts up to 256 KB per line
(docs, updated 28 Aug 2026): copy the `WA_SHAPE` lines into
`<scratchpad>/shapes/` within the day (Vercel MCP `get_runtime_logs`). The
lines hold no names, numbers or text by construction.

In Meta's app dashboard (WhatsApp → Configuration) set the callback to
`https://www.leadwing.app/api/whatsapp/webhook` and subscribe `messages`,
`history`, `smb_message_echoes`, `smb_app_state_sync`, `account_update`, plus
any offboarding/reconnect field the dashboard lists.

**Verify**: `redact.test.ts`: a message payload with a name, a phone
number, a BSUID and text comes out with the same keys and nesting, none of
the original strings (assert by searching the output for each), `type` and
`status` kept, and a 1,000-item array reduced to `__array: 1000` with one
shape. Then the "Commands" curl checks (challenge echoed, unsigned POST 401);
Meta's "Test" button produces a `WA_SHAPE` line in runtime logs.

**Step 2.4: Connect page (admin-only).**
- `src/app/(app)/admin/whatsapp/page.tsx`: same `is_admin` redirect as
  `src/app/(app)/admin/page.tsx:12-18`. It passes `appId`, `configId` and
  `graphVersion` as props.
- `src/components/whatsapp/embedded-signup-button.tsx` (`"use client"`), in
  two clicks so Meta's script loads only after the agent asks for it:
  1. **"Continue"** shows the line "Meta's sign-in window opens next. Meta
     may set its own cookies." and injects
     `https://connect.facebook.net/en_US/sdk.js` (a `<script>` added in the
     click handler; never `next/script` on page load). When it has loaded,
     `FB.init({ appId, version: graphVersion, xfbml: false })`.
  2. **"Connect with Facebook"** (enabled once `FB` exists) calls `FB.login`
     synchronously inside its own click handler, so the popup isn't blocked:
     `FB.login(cb, { config_id, response_type: "code",
     override_default_response_type: true, extras: { setup: {}, featureType:
     "whatsapp_business_app_onboarding" } })`. The `featureType` value comes
     from a third-party guide; confirm it in this spike (the coexistence
     screen must appear).
  - `message` listener: accept only when `new URL(event.origin).hostname` is
    `facebook.com` or ends with `.facebook.com` (a bare `endsWith("facebook.com")`
    also accepts `evilfacebook.com`); parse `data.type === "WA_EMBEDDED_SIGNUP"`;
    on `event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING"` keep
    `{ phone_number_id, waba_id, business_id }`; on `CANCEL` show the
    `current_step`.
  - When both the code and the ids are in, call the server action at once:
    **the code lives 30 seconds**.
- `src/lib/actions/whatsapp-connect.ts` → `completeWhatsAppSignup(input)`:
  1. `supabase.auth.getUser()`; admin only in this phase.
  2. zod: `code` string ≤ 1024, ids `/^\d{5,25}$/`.
  3. Exchange: `GET https://graph.facebook.com/<v>/oauth/access_token?client_id=…&client_secret=…&code=…`
     (the standard code exchange; the implementation page doesn't show it, so
     confirm here). The URL carries the secret: never log it.
  4. Check the token really controls the ids: `GET /<waba_id>/phone_numbers`
     must list `phone_number_id`; otherwise refuse.
  5. `POST /<waba_id>/subscribed_apps`.
  6. `POST /<phone_number_id>/smb_app_data` with
     `{ messaging_product: "whatsapp", sync_type: "smb_app_state_sync" }`, then
     with `sync_type: "history"`. **Must happen within 24 h of onboarding.**
  7. **Never** `POST /<phone_number_id>/register`.
  8. Spike only: keep nothing but a redacted log (Graph error codes only);
     the token is dropped.
- `src/lib/wa-cloud/graph.ts`: `graph(path, { token, method, body, query })`,
  10 s timeout (`AbortSignal.timeout`), returns
  `{ ok, status, data, error: { code, subcode, message } }`, and never logs
  the token, the URL, the query or any body.

**Verify**: `graph.test.ts` (stubbed `fetch`, a `console` spy on every
method): timeout → `{ ok: false }`; a Graph error body is mapped; nothing
logged contains the token, `client_secret` or the URL.

**Step 2.5: Run it with the founder's phone** (production deploy with
`WHATSAPP_ROLLOUT=admin`). Record answers in the "Spike findings" section at
the end of this file:
1. Coexistence screen shown? Which events and fields arrive?
2. History: phases, chunk sizes, time to finish, `progress` values, shape of
   `threads[]`, `history_context.status` values, the declined-history error
   (2593109).
3. Echoes (`smb_message_echoes`): shape, `to` vs `to_user_id`.
4. Inbound `messages`: `contacts[].wa_id`, `user_id`, `from_user_id`,
   `from_parent_user_id` (BSUIDs); `statuses[]` (send one test message from
   API Setup to the second phone).
5. State sync: `state_sync[]` add/remove shape.
6. Edits and revokes: how they arrive.
7. Companion apps: after connecting, re-link WhatsApp Web; does a message
   typed there produce an echo? (Meta and 360dialog disagree.)
8. **Phone activity**: which events arrive only when the phone app is used
   (echoes, state sync, anything else)? These drive
   `last_phone_activity_at` (Step 4.1).
9. **Offboarding and reconnect**: disconnect in the app (Settings → Account →
   Business Platform): which `account_update` event arrives
   (`PARTNER_REMOVED` with `disconnection_info`, `ACCOUNT_OFFBOARDED`)? Is
   `entry[].id` the WABA id, and is `metadata.phone_number_id` absent (Meta's
   reference shows only `entry.id`, `waba_info` and `disconnection_info`)?
   Reconnect: which event (`ACCOUNT_RECONNECTED`)? Can history be requested
   again after a fresh onboarding?
10. Does receiving and replying in-window work **without a payment method**
    on the WABA? (Meta's overview says Tech Provider customers "must add a
    payment method".)
11. Largest payload size seen (payloads are stored sealed but uncompressed),
    and how many POSTs arrive in
    parallel.
12. Does the code exchange in Step 2.4.3 work as written?

**Step 2.6: Fixtures.** From the captured shapes, write one JSON per event
kind to `src/lib/wa-cloud/__fixtures__/` (`history-chunk.json`, `echo.json`,
`inbound-text.json`, `inbound-image.json`, `inbound-bsuid-only.json`,
`status.json`, `state-sync.json`, `offboarded.json` (WABA id in `entry[].id`,
no `metadata`), `reconnected.json`, `edit.json`, `revoke.json`), filling the
placeholders with synthetic values (`34600000001`, `ES.TEST0001`,
"Test message", WABA `100000000000001`, phone number id `200000000000001`).

**Verify**: `grep -rE '\+?34[67][0-9]{8}' src/lib/wa-cloud/__fixtures__` finds
only the synthetic `346000000xx` numbers; the founder confirms nothing real
remains.

**Step 2.7: Leave a clean state.** The spike's connection has used its
one-time history request. Before Phase 5's verification (Step 5.8), the
founder offboards the number in the app, and Phase 5 onboards it again.

### Phase 3: App Review and Access Verification (0.5 day + Meta's review)

Gated by: business verification approved (Meta: "Your business must be
verified before you can start the app review process"). With D16's
recommended answer this may run before 9 Oct; it needs no LeadWing code.

**Step 3.1.** The founder records two separate screen recordings, each with
the written description from Step 0.7, using Meta's own tools (Meta's Tech
Provider page accepts both):
(a) the **API Setup** cURL script sending a message to the second phone, and
the message arriving there;
(b) **WhatsApp Manager** creating a template.
The temporary access token shown in API Setup stays in Meta's dashboard;
never paste it into chat or env.
**Step 3.2.** App Review → request Advanced access for
`whatsapp_business_messaging` and `whatsapp_business_management` only.
**Step 3.3.** After approval, complete Access Verification (App Settings →
Basic), if the dashboard asks for it (Meta's Tech Provider page doesn't name
it as a separate step; the Twilio guide does).
**Verify**: App Review shows both permissions "Advanced"; the onboarding
limit shown in the dashboard rises from 10 to 200 per 7 days (Meta's
overview). If rejected, fix exactly what the reviewer names and resubmit;
don't add permissions.

### Phase 4: Ingestion and matching (7–9 days)

Gated by: Phase 1 GO; Phase 2 findings recorded; D2–D13 answered; plan 016
Phase 1 live (D15, hard dependency); Step 4.0 passes.

**Step 4.0: Pre-flight (read-only; any failure is a STOP unless a branch is
given).** Write `<scratchpad>/probe-017.mjs` (`begin read only` … `rollback`)
and print:
1. `to_regclass('public.client_contacts')`, and whether
   `clients.last_contacted_at` exists. **Both present** = plan 016 Phase 1 is
   live. **Absent**: STOP. 016 Phase 1 is a hard dependency (D15): build it
   first; there is no fallback that builds this plan without it.
2. **The quiet rule reads the contact column.** In `src/lib/data/attention.ts`
   the quiet-buyer query must filter on `last_contacted_at` explicitly (016's
   `quietBuyersFilter` on `coalesce(last_contacted_at, created_at)`, or
   009's `greatest(last_contacted_at, updated_at)`), and `quietDays` must
   count from the same value. **If it still filters only on `updated_at`,
   STOP**: this plan's writes don't bump `updated_at`, so a WhatsApp reply
   would never clear the nudge.
3. The live trigger on `clients`:
   `select tgname, tgfoid::regproc, pg_get_triggerdef(oid) from pg_trigger where tgrelid = 'public.clients'::regclass and not tgisinternal`
   and `pg_get_functiondef` of the function behind `clients_set_updated_at`.
   Look for the **shared skip array** (`skip constant text[] := array[…]` in
   `clients_touch_updated_at`), created by whichever of 015 B1 or 016
   Phase 1 landed first (D-E). Write the migration's trigger block (below)
   as that same function with `wa_contact_id` **merged** into the live array:
   keep every key already there (016: `last_contacted_at`; 015: `agency`,
   `agency_id`; anything else), never overwrite it with this file's literal.
   This plan never creates the function or binds the trigger (D15; only
   015 B1 or 016 Phase 1 can, D-E). STOP if `clients_set_updated_at` doesn't
   run `clients_touch_updated_at`, or if it does but you can't read its
   skip array.
4. `to_regclass` for `wa_connections`, `wa_contacts`, `wa_messages`,
   `wa_webhook_inbox`, `wa_number_marks`, `wa_connection_secrets` (all
   null), `select 1 from pg_proc where proname like 'wa\_%'` (no rows), and
   `supabase_migrations.schema_migrations` rows with `name like '%whatsapp%'`
   (none). **If any exists: STOP**, compare it with this file and report;
   never re-run the migration over it.
5. `show server_version` is 15 or later (else STOP). Token storage needs
   no extension (D9: app-level AES-256-GCM, no Vault). With
   `vercel env ls production` (names only), note whether
   `INTEGRATION_TOKEN_KEY`, `INTEGRATION_TOKEN_KEY_VERSION` and
   `WHATSAPP_NUMBER_HMAC_KEY` exist; create any missing one per Step 2.1
   (Claude, after the founder's OK, Sensitive, value saved to the founder's
   password manager; D-I) before Step 4.6 ships. `waConfig()` doesn't
   require them, so their absence never 503s the webhook; `token-crypto.ts`
   and `marks.ts` throw when they're used without them.
6. The newest `version` in `supabase_migrations.schema_migrations` and the
   newest file in `supabase/migrations/`. The filename in Step 4.1 is a
   placeholder: **pick a fresh migration timestamp** on the build day, later
   than the live version and than **every** file in `supabase/migrations/`
   at build time (plans 013–016 may have added files since this plan was
   written; for example `20261012120000` only if nothing newer exists), and run
   `grep -rhn "20261" plans/` so it doesn't collide with a timestamp another
   plan names.
7. `select pg_size_pretty(pg_database_size(current_database()))`. The
   founder confirms the Supabase plan (Prerequisite 12). **On the Free plan
   (500 MB cap), STOP** until the founder decides on the Pro plan ($25/mo):
   a handful of history imports can reach the cap.
8. `src/lib/integrations/cron-auth.ts` (from whichever of 013, 014 or 016
   landed first; D-C), `src/lib/integrations/token-crypto.ts` (013 or 007),
   plan 016's `src/app/api/cron/notifications/route.ts` and
   `src/lib/notify/generate.ts`, and the current `crons` block of
   `vercel.json`: note which exist, and that `token-crypto.ts` exports only
   `encryptSecret`, `decryptSecret` and `needsReencrypt` (this plan adds
   nothing to it); Steps 4.5 and 4.7 branch on which files exist. Also run
   plan 016 Step 21b's check for an active `pg_cron` fallback: if
   `to_regclass('cron.job')` is non-null,
   `select jobname, schedule from cron.job where jobname like 'leadwing_%'`;
   any row means the fallback is active, and Step 4.7 schedules this plan's
   cron with `cron.schedule` instead of `vercel.json` (D-C).
9. **Full PGlite pass (before build day).** The last full run of the
   migration (16 Sep) used the earlier Vault token block, and the 17 Sep
   check covered only the `bytea` token parts; neither covers the
   `token_blob` version (D-A). Apply the whole Step 4.1 file, as edited for
   this build (fresh timestamp, merged skip array), to PGlite (Postgres 17)
   in the scratchpad in one pass, on the same stubs (`auth.users`,
   `clients`, `notification_type`, plan 016's objects, the live
   `clients_touch_updated_at` body), then run the Step 4.2 checks PGlite
   can run (2, 5–8, 10–15; the role and grant checks 3–4 need Supabase).
   Any error or `FAIL` is a STOP. Record the date and result under "Notes
   for the executor".

**Step 4.1: The migration.** File:
`supabase/migrations/<timestamp>_whatsapp_coexistence.sql`.

```sql
-- ============================================================
-- WhatsApp coexistence (plan 017).
-- Every write to the wa_* tables goes through the service-role client and
-- the RPCs below (webhook, cron, server actions after getUser());
-- authenticated users get SELECT on their own rows only, like the billing
-- tables. Meta tokens are encrypted in the app (AES-256-GCM,
-- src/lib/integrations/token-crypto.ts, INTEGRATION_TOKEN_KEY; plan 013 D9)
-- and stored as the module's ONE text blob
-- "<keyVersion>.<iv>.<ciphertext>.<tag>" (base64url), readable only by
-- service_role. The same module, in the same blob format, seals raw webhook
-- payloads and pending contacts' message content.
-- Blocks marked [016] need plan 016 Phase 1 (client_contacts), a hard
-- dependency (D15): Step 4.0.1 stops if it isn't live.
-- ============================================================

-- ---------- phone matching without rewriting clients ----------
-- Mirrors normalizePhone() in src/lib/whatsapp.ts: trim, drop a leading 00,
-- keep digits. "+34 600123456" -> "34600123456".
create or replace function public.wa_phone_digits(p text)
returns text
language sql immutable parallel safe
set search_path = ''
as $$
  select nullif(pg_catalog.regexp_replace(pg_catalog.regexp_replace(coalesce(p, ''), '^\s*00', ''), '\D', '', 'g'), '')
$$;

create index clients_agent_phone_tail_idx
  on public.clients (agent_id, right(public.wa_phone_digits(phone), 9))
  where phone is not null;

-- ---------- clients.updated_at: linking is not an edit ----------
-- Step 4.0.3 (D-E): read the live function first and MERGE wa_contact_id
-- into its skip array; never overwrite it. The literal below is the
-- 016-only case: add every other live key (015 B1: 'agency', 'agency_id').
-- The shared function and its trigger are already live (created by 015 B1
-- or 016 Phase 1, whichever landed first; 016 Phase 1 is a hard dependency,
-- D15). This block only replaces the body with the merged array; it never
-- creates or rebinds the trigger.
create or replace function public.clients_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  skip constant text[] := array['updated_at', 'last_contacted_at', 'wa_contact_id'];
begin
  if (to_jsonb(new) - skip) = (to_jsonb(old) - skip) then
    new.updated_at := old.updated_at;
  else
    new.updated_at := now();
  end if;
  return new;
end;
$$;

-- ---------- [016] contact sources ----------
-- Widen plan 016's check (read its live list first and keep every value).
alter table public.client_contacts drop constraint client_contacts_source_valid;
alter table public.client_contacts add constraint client_contacts_source_valid
  check (source in ('app_link', 'manual', 'stage', 'email_send', 'import',
                    'whatsapp_phone', 'whatsapp_api'));

-- ---------- connections ----------
create type public.wa_connection_status as enum ('connected', 'paused', 'offboarded', 'error');

create table public.wa_connections (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null unique references auth.users (id) on delete cascade,
  business_id text not null check (business_id ~ '^\d{5,25}$'),
  waba_id text not null unique check (waba_id ~ '^\d{5,25}$'),
  phone_number_id text not null unique check (phone_number_id ~ '^\d{5,25}$'),
  display_phone text check (char_length(display_phone) <= 40),
  status public.wa_connection_status not null default 'connected',
  status_reason text check (char_length(status_reason) <= 80),  -- e.g. PRIMARY_INACTIVITY, token_invalid, plan_free
  retention_months smallint not null default 12 check (retention_months in (3, 6, 12)),
  connected_at timestamptz not null default now(),
  paused_at timestamptz,                -- D12: set when the agent is no longer Pro
  history_requested_at timestamptz,
  history_status text check (history_status in
    ('requested', 'request_failed', 'importing', 'done', 'declined', 'failed')),
  history_progress smallint check (history_progress between 0 and 100),
  history_retry_at timestamptz,         -- next retry of a failed smb_app_data call
  history_retry_count smallint not null default 0,
  last_event_at timestamptz,            -- any webhook for this number
  last_phone_activity_at timestamptz,   -- only events that prove the phone app was used (Step 2.5.8)
  pending_digest_at timestamptz,        -- last pending-contacts bell row
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger wa_connections_set_updated_at
  before update on public.wa_connections
  for each row execute function public.set_updated_at();

-- ---------- token ciphertext (service role only, D9) ----------
-- The app encrypts the Meta token with src/lib/integrations/token-crypto.ts
-- (AES-256-GCM, INTEGRATION_TOKEN_KEY, AAD "whatsapp:<agentId>"); the key
-- never reaches the database. RLS on, no policies, no anon/authenticated
-- privileges (see grants): only service_role reads or writes this table.
-- Deleting the connection (or the auth user) deletes the row, and the row
-- is the whole secret: there is nothing else to purge.
-- One text column (D-A): the blob exactly as encryptSecret() returns it. No
-- bytea parts and no key_version column: the version is the blob's prefix,
-- and rotation finds stale rows with needsReencrypt(token_blob).
create table public.wa_connection_secrets (
  connection_id uuid primary key references public.wa_connections (id) on delete cascade,
  agent_id uuid not null references auth.users (id) on delete cascade,
  token_blob text not null check (
    token_blob ~ '^k[0-9]{1,3}(\.[A-Za-z0-9_-]+){3}$' and char_length(token_blob) <= 12000),
  created_at timestamptz not null default now(),
  rotated_at timestamptz   -- last re-encryption or token replacement
);

create or replace function public.wa_store_token(p_connection_id uuid, p_token_blob text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_agent uuid;
begin
  select agent_id into v_agent from public.wa_connections where id = p_connection_id;
  if v_agent is null then raise exception 'connection_not_found'; end if;
  insert into public.wa_connection_secrets (connection_id, agent_id, token_blob)
  values (p_connection_id, v_agent, p_token_blob)
  on conflict (connection_id) do update
    set token_blob = excluded.token_blob,
        rotated_at = now();
end;
$$;

-- Returns the blob; the app calls decryptSecret(token_blob, "whatsapp:<agent_id>").
create or replace function public.wa_read_token(p_connection_id uuid)
returns table (agent_id uuid, token_blob text)
language sql stable security definer set search_path = '' as $$
  select s.agent_id, s.token_blob
  from public.wa_connection_secrets s
  where s.connection_id = p_connection_id;
$$;

-- ---------- contacts ----------
-- pending: no client yet; content sealed and short-lived (D4).
-- linked:  at least one client row points here.
-- kept:    an agency, agent or developer the agent chose to keep (D13).
create type public.wa_contact_status as enum ('pending', 'linked', 'kept');

create table public.wa_contacts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references auth.users (id) on delete cascade,
  wa_id text check (wa_id ~ '^\d{6,20}$'),       -- null for BSUID-only senders
  bsuid text check (char_length(bsuid) <= 140),  -- e.g. ES.1349…
  parent_bsuid text check (char_length(parent_bsuid) <= 140),
  profile_name text check (char_length(profile_name) <= 200),
  contact_book_name text check (char_length(contact_book_name) <= 200),
  status public.wa_contact_status not null default 'pending',
  message_count integer not null default 0,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wa_contacts_has_id check (wa_id is not null or bsuid is not null),
  constraint wa_contacts_agent_wa_id_key unique (agent_id, wa_id),   -- nulls are distinct
  constraint wa_contacts_agent_bsuid_key unique (agent_id, bsuid),
  constraint wa_contacts_agent_id_id_key unique (agent_id, id)       -- composite FK target
);
create index wa_contacts_agent_status_idx
  on public.wa_contacts (agent_id, status, last_inbound_at desc);
create index wa_contacts_agent_wa_tail_idx
  on public.wa_contacts (agent_id, right(wa_id, 9)) where wa_id is not null;
create trigger wa_contacts_set_updated_at
  before update on public.wa_contacts
  for each row execute function public.set_updated_at();

-- One contact can back several clients (a buyer and a seller record of the
-- same person). The composite key keeps the link inside one agent, because
-- FK checks ignore RLS. NOT VALID + VALIDATE keeps the strong lock short.
alter table public.clients add column wa_contact_id uuid;
alter table public.clients
  add constraint clients_wa_contact_fkey
  foreign key (agent_id, wa_contact_id)
  references public.wa_contacts (agent_id, id)
  on delete set null (wa_contact_id)
  not valid;
alter table public.clients validate constraint clients_wa_contact_fkey;
create index clients_wa_contact_idx on public.clients (wa_contact_id) where wa_contact_id is not null;

-- Numbers the agent ignored, or already saw in a digest, kept only as an
-- HMAC (key WHATSAPP_NUMBER_HMAC_KEY, never rotated; D9), never as the number (D4).
create table public.wa_number_marks (
  agent_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('ignored', 'digested')),
  number_hmac text not null check (number_hmac ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (agent_id, kind, number_hmac)
);

-- ---------- messages ----------
create type public.wa_direction as enum ('in', 'out');
create type public.wa_source as enum ('history', 'echo', 'inbound', 'api');

create table public.wa_messages (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references auth.users (id) on delete cascade,
  contact_id uuid not null,
  wamid text not null check (char_length(wamid) <= 200),
  direction public.wa_direction not null,
  source public.wa_source not null,
  type text not null check (char_length(type) <= 40),
  body text check (char_length(body) <= 20000),
  caption text check (char_length(caption) <= 2000),
  media jsonb,                        -- { mime_type, filename }: never bytes or URLs
  -- Pending contacts: body, caption and file name live only in here, as
  -- sealJson(agentId, { body, caption, filename }): token-crypto's text blob.
  body_sealed text check (body_sealed ~ '^k[0-9]{1,3}(\.[A-Za-z0-9_-]+){3}$' and char_length(body_sealed) <= 200000),
  expires_at timestamptz,             -- set for every message of a pending contact (D4)
  sent_at timestamptz not null,
  status text check (char_length(status) <= 40),
  edited_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint wa_messages_agent_wamid_key unique (agent_id, wamid),
  constraint wa_messages_sealed_shape check (
    body_sealed is null
    or (expires_at is not null and body is null and caption is null
        and (media is null or not media ? 'filename'))
  ),
  foreign key (agent_id, contact_id) references public.wa_contacts (agent_id, id) on delete cascade
);
create index wa_messages_thread_idx on public.wa_messages (agent_id, contact_id, sent_at desc);
create index wa_messages_agent_sent_idx on public.wa_messages (agent_id, sent_at);
create index wa_messages_expires_idx on public.wa_messages (expires_at) where expires_at is not null;

-- ---------- webhook inbox (service role only) ----------
create table public.wa_webhook_inbox (
  id bigint generated always as identity primary key,
  payload_sha256 text not null unique,
  payload_sealed text,                -- sealPayload(raw, payload_sha256): the raw JSON as UTF-8 text, no gzip; nulled once processed
  byte_size integer not null,
  kind text check (kind in ('history', 'message', 'status', 'state', 'account', 'mixed', 'unknown')),
  agent_id uuid references auth.users (id) on delete cascade,  -- set once known
  received_at timestamptz not null default now(),
  claims smallint not null default 0,    -- counted at claim: catches timeouts and crashes
  attempts smallint not null default 0,  -- counted on a caught failure
  locked_until timestamptz,
  processed_at timestamptz,
  dropped_at timestamptz,
  error text check (char_length(error) <= 80)
);
create index wa_webhook_inbox_open_idx
  on public.wa_webhook_inbox (id) where processed_at is null and dropped_at is null;

-- Claims ONE open row (or the given row). The lock outlives the cron's
-- 300 s maxDuration, so a row is never processed twice at once.
create or replace function public.wa_claim_inbox(p_id bigint default null)
returns table (id bigint, claims smallint, attempts smallint)
language sql security definer set search_path = '' as $$
  with next as (
    select i.id
    from public.wa_webhook_inbox i
    where i.processed_at is null
      and i.dropped_at is null
      and i.claims < 10
      and i.attempts < 5
      and (i.locked_until is null or i.locked_until < now())
      and (p_id is null or i.id = p_id)
    order by i.id
    limit 1
    for update skip locked
  )
  update public.wa_webhook_inbox w
     set locked_until = now() + interval '6 minutes',
         claims = w.claims + 1
    from next
   where w.id = next.id
  returning w.id, w.claims, w.attempts;
$$;

create or replace function public.wa_finish_inbox(p_id bigint, p_ok boolean, p_error text default null)
returns void language sql security definer set search_path = '' as $$
  update public.wa_webhook_inbox
     set processed_at = case when p_ok then now() end,
         payload_sealed = case when p_ok then null else payload_sealed end,
         attempts = case when p_ok then attempts else attempts + 1 end,
         error = case when p_ok then null else left(p_error, 80) end,
         -- a failed row waits 1, 4, 9, 16 minutes before the next claim
         locked_until = case when p_ok then null
                             else now() + make_interval(mins => (attempts + 1) * (attempts + 1)) end
   where id = p_id;
$$;

-- Rows past either cap: mark dropped and return them (Step 4.7 alerts).
create or replace function public.wa_drop_exhausted_inbox()
returns table (id bigint, kind text, agent_id uuid)
language sql security definer set search_path = '' as $$
  update public.wa_webhook_inbox w
     set dropped_at = now()
   where w.processed_at is null and w.dropped_at is null
     and (w.claims >= 10 or w.attempts >= 5)
     and (w.locked_until is null or w.locked_until < now())
  returning w.id, w.kind, w.agent_id;
$$;

-- ---------- contact RPCs ----------
-- Finds or creates the contact for (wa_id, bsuid). other_id is set when the
-- two ids point at two different rows: the caller merges them.
create or replace function public.wa_upsert_contact(
  p_agent uuid, p_wa_id text, p_bsuid text, p_parent_bsuid text, p_profile_name text)
returns table (contact_id uuid, contact_status public.wa_contact_status, created boolean, other_id uuid)
language plpgsql security definer set search_path = '' as $$
declare
  v_a uuid;
  v_b uuid;
  v_created boolean := false;
begin
  if p_wa_id is null and p_bsuid is null then raise exception 'no_contact_id'; end if;
  -- Parallel POSTs for the same person wait for each other.
  perform pg_advisory_xact_lock(hashtextextended(p_agent::text || ':' || coalesce(p_wa_id, p_bsuid), 0));
  if p_wa_id is not null then
    select c.id into v_a from public.wa_contacts c where c.agent_id = p_agent and c.wa_id = p_wa_id;
  end if;
  if p_bsuid is not null then
    select c.id into v_b from public.wa_contacts c where c.agent_id = p_agent and c.bsuid = p_bsuid;
  end if;
  if v_a is null and v_b is null then
    insert into public.wa_contacts (agent_id, wa_id, bsuid, parent_bsuid, profile_name)
    values (p_agent, p_wa_id, p_bsuid, p_parent_bsuid, left(p_profile_name, 200))
    returning id into v_a;
    v_created := true;
  elsif v_a is null or v_a = v_b then
    v_a := coalesce(v_a, v_b);
    v_b := null;
  end if;
  update public.wa_contacts c
     set wa_id = coalesce(c.wa_id, case when v_b is null then p_wa_id end),
         bsuid = coalesce(c.bsuid, case when v_b is null then p_bsuid end),
         parent_bsuid = coalesce(p_parent_bsuid, c.parent_bsuid),
         profile_name = coalesce(left(p_profile_name, 200), c.profile_name)
   where c.id = v_a and not v_created;
  return query
    select c.id, c.status, v_created, v_b from public.wa_contacts c where c.id = v_a;
end;
$$;

-- Moves everything from p_drop into p_keep and deletes p_drop. Both must
-- have the same status (the caller unseals or reseals first).
create or replace function public.wa_merge_contacts(p_agent uuid, p_keep uuid, p_drop uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_keep public.wa_contacts;
  v_drop public.wa_contacts;
begin
  if p_keep = p_drop then return; end if;
  perform 1 from public.wa_contacts
   where agent_id = p_agent and id in (p_keep, p_drop) order by id for update;
  select * into v_keep from public.wa_contacts where agent_id = p_agent and id = p_keep;
  select * into v_drop from public.wa_contacts where agent_id = p_agent and id = p_drop;
  if v_keep.id is null or v_drop.id is null then raise exception 'contact_not_found'; end if;
  if v_keep.status <> v_drop.status then raise exception 'status_mismatch'; end if;
  -- (agent_id, wamid) is unique across the agent, so no message collides.
  update public.wa_messages set contact_id = p_keep where agent_id = p_agent and contact_id = p_drop;
  update public.clients set wa_contact_id = p_keep where agent_id = p_agent and wa_contact_id = p_drop;
  delete from public.wa_contacts where id = p_drop;   -- frees its unique ids first
  update public.wa_contacts
     set wa_id = coalesce(wa_id, v_drop.wa_id),
         bsuid = coalesce(bsuid, v_drop.bsuid),
         parent_bsuid = coalesce(parent_bsuid, v_drop.parent_bsuid),
         profile_name = coalesce(profile_name, v_drop.profile_name),
         contact_book_name = coalesce(contact_book_name, v_drop.contact_book_name),
         message_count = message_count + v_drop.message_count,
         last_inbound_at = greatest(last_inbound_at, v_drop.last_inbound_at),
         last_outbound_at = greatest(last_outbound_at, v_drop.last_outbound_at)
   where id = p_keep;
end;
$$;

-- Clients whose phone ends like the WhatsApp number (match.ts decides).
create or replace function public.wa_find_candidates(p_agent uuid, p_wa_id text)
returns table (client_id uuid, phone_digits text, first_name text, last_name text, wa_contact_id uuid)
language sql stable security definer set search_path = '' as $$
  select c.id, public.wa_phone_digits(c.phone), c.first_name, c.last_name, c.wa_contact_id
  from public.clients c
  where c.agent_id = p_agent
    and c.phone is not null
    and right(public.wa_phone_digits(c.phone), 9) = right(p_wa_id, 9);
$$;

-- The reverse: contacts whose number ends like a client's phone (relink.ts).
create or replace function public.wa_find_contacts_for_phone(p_agent uuid, p_phone text)
returns table (contact_id uuid, wa_id text, contact_status public.wa_contact_status)
language sql stable security definer set search_path = '' as $$
  select w.id, w.wa_id, w.status
  from public.wa_contacts w
  where w.agent_id = p_agent
    and w.wa_id is not null
    and right(w.wa_id, 9) = right(public.wa_phone_digits(p_phone), 9);
$$;

-- Links clients to a contact after checking every id belongs to p_agent,
-- sets the contact's status, and [016] records the latest outbound message
-- as contact. The caller unseals afterwards (wa_set_bodies).
create or replace function public.wa_link_clients(p_agent uuid, p_contact uuid, p_client_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_last_out timestamptz;
begin
  select last_outbound_at into v_last_out from public.wa_contacts
   where agent_id = p_agent and id = p_contact for update;
  if not found then raise exception 'contact_not_found'; end if;
  if (select count(*) from public.clients where agent_id = p_agent and id = any (p_client_ids))
     <> cardinality(p_client_ids) then
    raise exception 'client_not_found';
  end if;
  update public.clients set wa_contact_id = p_contact
   where agent_id = p_agent and id = any (p_client_ids);
  update public.wa_contacts set status = 'linked' where id = p_contact;
  -- [016]
  insert into public.client_contacts (agent_id, client_id, channel, source, occurred_at)
  select p_agent, c.id, 'whatsapp', 'whatsapp_phone', v_last_out
    from public.clients c
   where v_last_out is not null
     and c.agent_id = p_agent and c.id = any (p_client_ids)
     and v_last_out > coalesce(c.last_contacted_at, '-infinity'::timestamptz) + interval '1 hour';
end;
$$;

-- Compare-and-set a contact's status (pending <-> kept, linked -> pending
-- when its last client went away). Returns false when the status moved.
create or replace function public.wa_set_contact_status(
  p_agent uuid, p_contact uuid, p_from public.wa_contact_status, p_to public.wa_contact_status)
returns boolean language sql security definer set search_path = '' as $$
  with u as (
    update public.wa_contacts set status = p_to
     where agent_id = p_agent and id = p_contact and status = p_from
       and (p_to <> 'pending' or not exists (
             select 1 from public.clients c where c.agent_id = p_agent and c.wa_contact_id = p_contact))
    returning 1)
  select exists (select 1 from u);
$$;

-- Unseal or reseal a batch of a contact's messages (at most 200 rows):
-- p_rows = [{ id, body, caption, filename, body_sealed }]. Refuses when the
-- contact's status isn't p_status, so a concurrent link or release wins.
create or replace function public.wa_set_bodies(
  p_agent uuid, p_contact uuid, p_status public.wa_contact_status, p_rows jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_n integer;
begin
  perform 1 from public.wa_contacts
   where agent_id = p_agent and id = p_contact and status = p_status for share;
  if not found then raise exception 'contact_status_changed'; end if;
  if jsonb_array_length(p_rows) > 200 then raise exception 'batch_too_large'; end if;
  update public.wa_messages m
     set body = r.body,
         caption = r.caption,
         media = case when m.media is null then null
                      when r.filename is null then m.media - 'filename'
                      else m.media || jsonb_build_object('filename', r.filename) end,
         body_sealed = r.body_sealed,
         expires_at = case when p_status = 'pending' then coalesce(m.expires_at, now() + interval '14 days') end
    from jsonb_to_recordset(p_rows) as r(id uuid, body text, caption text, filename text, body_sealed text)
   where m.id = r.id and m.agent_id = p_agent and m.contact_id = p_contact;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- ---------- message ingest ----------
-- Inserts a batch (at most 500 rows) for one contact, idempotently, bumps
-- counters by the rows actually inserted, moves last_* forward only, and
-- [016] logs one client_contacts row for linked clients when the newest
-- new outbound message is more than an hour after their last contact (D6).
-- p_rows = [{ wamid, direction, source, type, body, caption, media,
--             body_sealed, sent_at, status }]; the app has already sealed
-- pending content and dropped rows older than the cutoffs.
create or replace function public.wa_ingest_messages(
  p_agent uuid, p_contact uuid, p_expected_status public.wa_contact_status, p_rows jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_status public.wa_contact_status;
  v_inserted integer;
  v_last_out timestamptz;
  v_last_in timestamptz;
  v_out_source public.wa_source;
begin
  if jsonb_array_length(p_rows) > 500 then raise exception 'batch_too_large'; end if;
  select status into v_status from public.wa_contacts
   where agent_id = p_agent and id = p_contact for update;
  if v_status is null then raise exception 'contact_not_found'; end if;
  if v_status <> p_expected_status then raise exception 'contact_status_changed'; end if;

  with ins as (
    insert into public.wa_messages as m
      (agent_id, contact_id, wamid, direction, source, type, body, caption, media,
       body_sealed, expires_at, sent_at, status)
    select p_agent, p_contact, r.wamid, r.direction, r.source, r.type,
           r.body, r.caption, r.media, r.body_sealed,
           case when v_status = 'pending' then now() + interval '14 days' end,
           r.sent_at, r.status
      from jsonb_to_recordset(p_rows) as r(
        wamid text, direction public.wa_direction, source public.wa_source, type text,
        body text, caption text, media jsonb, body_sealed text, sent_at timestamptz, status text)
    on conflict (agent_id, wamid) do nothing
    returning m.direction, m.source, m.sent_at
  )
  select count(*)::integer,
         max(sent_at) filter (where direction = 'out'),
         max(sent_at) filter (where direction = 'in'),
         (array_agg(source order by sent_at desc) filter (where direction = 'out'))[1]
    into v_inserted, v_last_out, v_last_in, v_out_source
    from ins;

  if v_inserted = 0 then return 0; end if;

  update public.wa_contacts
     set message_count = message_count + v_inserted,
         last_outbound_at = greatest(last_outbound_at, v_last_out),  -- greatest() ignores nulls
         last_inbound_at = greatest(last_inbound_at, v_last_in)
   where id = p_contact;

  -- [016]
  if v_status = 'linked' and v_last_out is not null and v_last_out <= now() + interval '5 minutes' then
    insert into public.client_contacts (agent_id, client_id, channel, source, occurred_at)
    select p_agent, c.id, 'whatsapp',
           case when v_out_source = 'api' then 'whatsapp_api' else 'whatsapp_phone' end,
           v_last_out
      from public.clients c
     where c.agent_id = p_agent and c.wa_contact_id = p_contact
       and v_last_out > coalesce(c.last_contacted_at, '-infinity'::timestamptz) + interval '1 hour';
  end if;
  return v_inserted;
end;
$$;

-- Statuses move forward only (sent < delivered < read; failed is final).
-- p_rows = [{ wamid, status }].
create or replace function public.wa_apply_statuses(p_agent uuid, p_rows jsonb)
returns void language sql security definer set search_path = '' as $$
  update public.wa_messages m
     set status = r.status
    from jsonb_to_recordset(p_rows) as r(wamid text, status text)
   where m.agent_id = p_agent and m.wamid = r.wamid
     and m.status is distinct from 'failed'
     and array_position(array['sent', 'delivered', 'read', 'failed'], r.status)
         > coalesce(array_position(array['sent', 'delivered', 'read', 'failed'], m.status), 0);
$$;

-- An edit replaces the content the same way ingest stores it.
create or replace function public.wa_edit_message(
  p_agent uuid, p_wamid text, p_expected_status public.wa_contact_status,
  p_body text, p_body_sealed text, p_edited_at timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.wa_messages m
    join public.wa_contacts c on c.id = m.contact_id
   where m.agent_id = p_agent and m.wamid = p_wamid and c.status = p_expected_status
   for update of c;
  if not found then raise exception 'contact_status_changed'; end if;  -- or unknown wamid: caller re-reads
  update public.wa_messages
     set body = p_body, body_sealed = p_body_sealed, edited_at = p_edited_at
   where agent_id = p_agent and wamid = p_wamid and revoked_at is null;
end;
$$;

create or replace function public.wa_revoke_message(p_agent uuid, p_wamid text, p_revoked_at timestamptz)
returns void language sql security definer set search_path = '' as $$
  update public.wa_messages
     set body = null, caption = null, body_sealed = null,
         media = case when media is null then null else media - 'filename' end,
         revoked_at = p_revoked_at
   where agent_id = p_agent and wamid = p_wamid;
$$;

-- History progress moves forward only; a final state is never undone.
create or replace function public.wa_set_history(p_connection uuid, p_status text, p_progress smallint)
returns void language sql security definer set search_path = '' as $$
  update public.wa_connections
     set history_status = case
           when history_status in ('done', 'declined', 'failed') then history_status
           else p_status end,
         history_progress = greatest(history_progress, p_progress)
   where id = p_connection;
$$;

-- Claims failed history requests that are due, once each (a cron may run twice).
create or replace function public.wa_claim_history_retries()
returns table (connection_id uuid, agent_id uuid, phone_number_id text, retry_count smallint)
language sql security definer set search_path = '' as $$
  update public.wa_connections w
     set history_retry_at = null,
         history_retry_count = w.history_retry_count + 1
   where w.history_status = 'request_failed'
     and w.history_retry_at <= now()
     and w.history_retry_count < 3
     and w.connected_at > now() - interval '23 hours'
  returning w.id, w.agent_id, w.phone_number_id, w.history_retry_count;
$$;

-- ---------- RLS and grants ----------
alter table public.wa_connections enable row level security;
alter table public.wa_connection_secrets enable row level security;
alter table public.wa_contacts enable row level security;
alter table public.wa_messages enable row level security;
alter table public.wa_number_marks enable row level security;
alter table public.wa_webhook_inbox enable row level security;

create policy "agent reads own wa_connections" on public.wa_connections
  for select to authenticated using (agent_id = (select auth.uid()));
create policy "agent reads own wa_contacts" on public.wa_contacts
  for select to authenticated using (agent_id = (select auth.uid()));
create policy "agent reads own wa_messages" on public.wa_messages
  for select to authenticated using (agent_id = (select auth.uid()));
-- wa_connection_secrets, wa_number_marks and wa_webhook_inbox: no policies.

revoke insert, update, delete on public.wa_connections, public.wa_contacts, public.wa_messages
  from anon, authenticated;
revoke all on public.wa_connection_secrets, public.wa_number_marks, public.wa_webhook_inbox
  from anon, authenticated;

-- Supabase grants EXECUTE on new public functions to anon and authenticated
-- by default: take it back from every wa_ function, then grant service_role.
do $$
declare f regprocedure;
begin
  for f in select p.oid::regprocedure from pg_proc p
            where p.pronamespace = 'public'::regnamespace
              and p.proname like 'wa\_%'
              and p.proname <> 'wa_phone_digits'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
-- wa_phone_digits() stays executable: it sits in an index expression on
-- clients, and an agent's own insert or update evaluates it (a revoke would
-- risk "permission denied" on every client save; rehearsal item 1 checks).
-- It is a pure function of its argument.
grant execute on function public.wa_phone_digits(text) to authenticated, service_role;

-- ---------- notifications ----------
-- New enum values can't be used in this transaction; the app writes the
-- first rows long after the commit.
alter type public.notification_type add value if not exists 'wa_connection';
alter type public.notification_type add value if not exists 'wa_pending_digest';
```

Notes for the executor:
- **Pre-checked, not rehearsed.** On 16 Sep 2026 this SQL was applied to
  PGlite (Postgres 17, in the session scratchpad) on top of stub `auth`,
  `clients`, `notification_type` and plan 016 objects, and the
  RPCs were exercised (upsert, merge, link, ingest idempotency, the
  one-hour contact collapse, status order, inbox claims, history retries,
  the sealed-shape check, grants, the FK set-null). That run used the
  earlier Vault version of the token block; on 17 Sep 2026 a `bytea`-parts
  replacement and the new `body_sealed` pattern were checked on their own in
  PGlite. The token block has changed again since (second pass, D-A: one
  `token_blob` column, two-argument `wa_store_token`) and **has not been run
  at all**: Step 4.0.9's full PGlite pass is required before build day.
  Supabase's real roles and RLS differ, so Step 4.2 is still required.
- `clients.wa_contact_id` is written only through `wa_link_clients` (after an
  ownership check inside it) and `wa_merge_contacts`, or set to null by the
  FK and by `releaseClient` (Step 4.5). Don't add it to any form schema.
- If plan 015 B1 is live, D13's `agencies.phone` target is a follow-up
  migration (`wa_contacts.agency_id` + a candidates RPC over
  `agencies.phone`); don't fold it into this file.

**Step 4.2: Rehearse (nothing kept).** Save
`<scratchpad>/rehearse-whatsapp.mjs` on plan 016 Step 3's harness. Right
after `begin`, run `set local lock_timeout = '3s'` and
`set local statement_timeout = '60s'`; then run the file; then the checks;
always `rollback`. Run it at a quiet hour (22:00–07:00 Europe/Madrid): the
migration takes short strong locks on `clients`, and while the rehearsal
transaction is open, agents' writes to `clients` wait. Keep the script fast
(seconds). It must print only `ok` lines for:
1. `wa_phone_digits`: `+34 600123456` → `34600123456`; `0044 7700 900123` →
   `447700900123`; `600-123-456` → `600123456`; `null` → `null`. **As the
   founder** (`as(founder)`), inserting and updating one of their clients
   with a phone succeeds (the index expression runs as the caller), and
   `explain select … where agent_id = $1 and right(public.wa_phone_digits(phone), 9) = '600123456'`
   can use `clients_agent_phone_tail_idx` (print the plan once; with 14 rows
   a seq scan is fine, so this line is informational).
2. As `service_role` (`reset role; set local role service_role`): insert a
   connection for the founder, `wa_store_token` with a fixed synthetic blob
   (`k1.AAAAAAAAAAAAAAAA.QUJDRA.AAAAAAAAAAAAAAAAAAAAAA`), then
   `wa_read_token` returns the same blob and the founder's `agent_id`, and
   `rotated_at` is null; a second `wa_store_token` with a `k2.` blob
   replaces it and sets `rotated_at`; a blob with only three parts, or with
   the prefix `v1.`, fails the `token_blob` check.
   No plaintext token is involved: the rehearsal never needs
   `INTEGRATION_TOKEN_KEY`.
3. As the founder: `select * from wa_connection_secrets` returns 0 rows;
   `select public.wa_read_token(…)` fails with permission denied;
   `select public.wa_ingest_messages(…)` fails with permission denied;
   `insert into wa_messages …` fails (permission denied).
4. `has_function_privilege('authenticated', f, 'execute')` is false for every
   `wa_%` function except `wa_phone_digits`, and true for `service_role`.
5. Contacts: `wa_upsert_contact` twice with the same `wa_id` returns the same
   id with `created` true then false; with only a BSUID creates a second row;
   with both ids returns the first row and `other_id` = the second;
   `wa_merge_contacts` then leaves one row carrying both ids, summed counts,
   and every message and client link moved; merging a `pending` into a
   `linked` contact fails with `status_mismatch`.
6. Ingest: `wa_ingest_messages` with 3 rows returns 3 and
   `message_count = 3`; the same call again returns 0 and the count stays 3;
   an older outbound row doesn't move `last_outbound_at` back; a call with
   the wrong expected status fails with `contact_status_changed`; a pending
   contact's rows get `expires_at`; a row with `body` and `body_sealed` both
   set fails `wa_messages_sealed_shape`.
7. **[016] Contact log and the quiet rule.** Take a founder buyer (or insert
   one) with `created_at` 30 days ago, no contact rows, and
   `updated_at = now() - interval '8 days'`. Link it to a contact with
   `wa_link_clients`; ingest one outbound message at `now() - interval '1 minute'`:
   exactly one `client_contacts` row appears (`whatsapp_phone`),
   `clients.last_contacted_at` equals that time, `updated_at` is unchanged,
   and the buyer is **not** matched by the live quiet predicate (016's
   `coalesce(last_contacted_at, created_at) <= now() - interval '7 days'`).
   A second outbound message 10 minutes later adds no row; one 2 hours later
   adds one. An inbound message adds none.
8. Trigger: an update that changes only `wa_contact_id` (and, if 016/015 are
   live, only `last_contacted_at` or only `agency`) leaves `updated_at`
   unchanged; `update clients set notes = 'x'` changes it; an update that
   sets `notes` to its current value leaves it unchanged (016's no-op rule).
9. Composite FK: as `other`, `update clients set wa_contact_id = <founder's
   contact>` on one of `other`'s clients fails with a foreign-key error;
   `wa_link_clients(founder, contact, [other's client])` fails with
   `client_not_found`.
10. Deleting the founder's contact nulls `clients.wa_contact_id` and deletes
    its messages; `wa_set_contact_status(…, 'linked', 'pending')` returns
    false while a client still points at the contact, true after.
11. `wa_set_bodies`: reseal 2 rows (status pending) sets `expires_at`;
    unseal (status linked) clears it; 201 rows fails `batch_too_large`.
12. Deleting the connection removes its `wa_connection_secrets` row (the
    FK cascade; no other store holds the token); deleting the auth user does
    the same.
13. Inbox: two rows; `wa_claim_inbox()` twice in two savepoints returns the
    two different rows; a third call returns nothing (both locked);
    `wa_finish_inbox(id, false, 'x')` bumps `attempts` and pushes
    `locked_until` out; `wa_finish_inbox(id, true)` nulls `payload_sealed`;
    a row with `claims = 10` is returned once by `wa_drop_exhausted_inbox()`.
14. `wa_apply_statuses`: `delivered` then `sent` leaves `delivered`;
    `failed` is final. `wa_set_history`: progress 50 then 30 stays 50;
    `done` then `importing` stays `done`.
15. `wa_claim_history_retries()` returns a due `request_failed` connection
    once; a second call returns nothing.
16. `select count(*) from pg_locks where relation = 'public.clients'::regclass`
    from a second connection while the rehearsal is open, printed as info.

**Step 4.3: Apply live** (the founder expects Claude to do this, per memory
note), only after the rehearsal prints only `ok` lines, at a quiet hour. One
transaction: `set local lock_timeout = '3s'`,
`set local statement_timeout = '60s'`, run the file, insert the history row
into `supabase_migrations.schema_migrations` (read its columns first; today
`version`, `name`, `statements`), commit. On a lock timeout: roll back, wait,
retry once; a second timeout is a STOP. **Check afterwards**: `to_regclass`
is non-null for all six tables; `pg_class.relrowsecurity` is true for each;
`pg_policies` shows exactly three `wa_%` policies;
`select unnest(enum_range(null::public.notification_type))` includes both new
values; the `clients_set_updated_at` trigger points at
`clients_touch_updated_at`; the history row exists. Report what ran; never
print the connection string.

**Step 4.4: Types.** Hand-edit `src/lib/supabase/types.ts`: the six tables
(Row/Insert/Update), `clients.wa_contact_id`, the four new enums, the two
`notification_type` values, the `client_contacts` source values if typed,
and `Functions` for every RPC in the migration.
**Verify**: `npm run typecheck` fails only in `notification-item.tsx`
(`ICONS`/`TONES` missing keys); fix in Step 4.9.

**Step 4.5: Library** (`src/lib/wa-cloud/`, all server-only: each file
imports `config.ts` or starts with the same `typeof window` guard).
- First, the shared `src/lib/integrations/token-crypto.ts` (D9). Plan 013
  Step 2.2 is its spec (`encryptSecret` / `decryptSecret`, text blob
  `"<ver>.<iv>.<ct>.<tag>"` in base64url, `INTEGRATION_TOKEN_KEY` +
  `INTEGRATION_TOKEN_KEY_VERSION`, optional `_PREVIOUS` pair,
  `needsReencrypt`). If plan 013 or 007 already created it, reuse it; if
  not, create it to that spec, with its test. Its API is exactly
  `encryptSecret`, `decryptSecret` and `needsReencrypt`; this plan adds
  nothing to it (never a second module, key or export). Everything this
  plan seals is text: message bodies, and raw webhook payloads as their
  UTF-8 JSON text. No `encryptBytes`/`decryptBytes`, no
  `encryptParts`/`decryptParts`: every blob is stored whole (D-A). AAD
  contexts across the batch: `calendar:<agentId>` (013), `mail:<agentId>`
  (007), `whatsapp:<agentId>` (this plan's token),
  `whatsapp-body:<agentId>` (bodies), `whatsapp-payload:<sha256>` (raw
  payloads).
- `tokens.ts`: `storeToken(admin, agentId, connectionId, token)` =
  `encryptSecret(token, "whatsapp:" + agentId)` →
  `wa_store_token(connectionId, blob)`; `readToken(admin, connectionId)` =
  `wa_read_token` → `decryptSecret(row.token_blob, "whatsapp:" + row.agent_id)`,
  so a blob copied onto another agent's row fails to decrypt. A
  `TokenKeyError` (unknown version, wrong key, tampering or a wrong
  context) is logged as `wa_token_undecryptable` (connection id only, no
  values) and treated like a revoked token. Tokens and blobs are never
  logged. The key rotation runbook (Maintenance notes) re-encrypts rows
  where `needsReencrypt(token_blob)` is true.
- `seal.ts`: a thin wrapper over `token-crypto.ts`, no key of its own.
  Sealed text is the module's blob, so its version label (`k1.`, …) comes
  from `INTEGRATION_TOKEN_KEY_VERSION` (base64url text, not `bytea`, so
  nothing depends on PostgREST's `bytea` encoding). Helpers:
  `sealJson(agentId, obj)` = `encryptSecret(JSON.stringify(obj),
  "whatsapp-body:" + agentId)` / `unsealJson(agentId, text)`;
  `sealPayload(raw, sha256)` = `encryptSecret(raw, "whatsapp-payload:" +
  sha256)`, where `raw` is the request body string (UTF-8 JSON, no gzip),
  and `unsealPayload(text, sha256)` = `decryptSecret` with the same context
  (the inbox row's `payload_sha256`; the agent isn't known when the webhook
  stores the payload).
- `marks.ts`: `numberHmac(id)` = hex HMAC-SHA256 keyed with
  `WHATSAPP_NUMBER_HMAC_KEY` (decoded; exactly 32 bytes, else throw; D9
  says why it's separate and never rotated);
  `isIgnored(admin, agentId, id)`, `markIgnored`, `markDigested`,
  `wasDigested`.
- `payload.ts`: zod schemas built from the Phase 2 fixtures, `.passthrough()`
  on unknown fields, and `parseChanges(json)` that yields typed events:
  `inbound`, `status`, `echo`, `history`, `stateSync`, `account`, `unknown`.
  Each event carries its **route**: `{ by: "phone", phoneNumberId }` from
  `value.metadata.phone_number_id`, or, for `account_update` (and any field
  the spike shows without `metadata`), `{ by: "waba", wabaId }` from
  `entry[].id`. Skip anything carrying a group id.
- `match.ts`: `matchClients(candidates, { waId, bsuid })` (pure) over the
  rows from `wa_find_candidates`. Rules, in order:
  1. `phone_digits === waId` → match.
  2. Client stored without country code: `phone_digits` minus one leading
     `0` is at least 9 digits and `waId.endsWith(it)` → candidate.
  3. Trunk zero after the country code (`+44 07700…` → `4407700…`):
     `phone_digits.length === waId.length + 1` and removing the first `0` at
     index 1–3 gives `waId` → candidate.
  4. Accept rule 2/3 candidates only when they all belong to **one person**
     (same `first_name` + `last_name`, case-insensitive). Otherwise the
     contact stays `pending` and the pending page shows them as suggestions.
  5. BSUID-only contact (no `waId`): never auto-matched.
  6. A client already linked to another contact is only a suggestion.
  `matchContactsForClient(phone, rows)` applies the same rules in reverse
  over `wa_find_contacts_for_phone`.
- `process.ts`: `processInboxRow(admin, id)`:
  1. Read the row's `payload_sealed` and `payload_sha256` (admin client),
     `unsealPayload(payload_sealed, payload_sha256)`,
     `JSON.parse`, `parseChanges`. Set the row's `kind` and, once known,
     `agent_id`.
  2. **Route each change.** `by: "phone"` → `wa_connections.phone_number_id`;
     `by: "waba"` → `wa_connections.waba_id`. **These two signed fields are
     the only sources of `agent_id`**; no other body field is ever used.
     Unknown → `error = 'unknown_number'`, drop the content.
  3. **Plan check (D12)**, once per connection per invocation, with
     `admin.rpc("is_pro", { p_user_id })`: `connected` and not Pro → set
     `paused` + `paused_at` + `status_reason = 'plan_free'` + bell row, drop
     the content; `paused` and Pro → `connected`, clear `paused_at`, bell
     row, continue; `paused` and not Pro → drop the content.
  4. Connection `offboarded` or `error` → drop message content; still handle
     `account` events.
  5. `echo` and `stateSync` events (or whatever Step 2.5.8 confirmed) set
     `last_phone_activity_at = greatest(…, event time)`.
  6. **Message events**, grouped by counterpart:
     - `numberHmac`; ignored → drop.
     - `wa_upsert_contact`. `other_id` set → bring both to the same status
       (unseal the pending one if the other is linked or kept), then
       `wa_merge_contacts`.
     - `created` → `wa_find_candidates` + `matchClients`; matches →
       `wa_link_clients`.
     - Drop messages older than the connection's retention cutoff; for a
       pending contact also drop messages older than 14 days (D4).
     - Build rows: linked/kept → `body`, `caption`, `media`
       `{ mime_type, filename }`; pending → `body_sealed = sealJson(agentId,
       { body, caption, filename })`, `caption` null, `media` `{ mime_type }` only.
       Truncate bodies over 20,000 characters.
     - `wa_ingest_messages` in batches of ≤ 500. On `contact_status_changed`,
       re-read the status once and rebuild the rows; a second failure throws.
  7. `status` events → `wa_apply_statuses`. Edits → `wa_edit_message` with
     content built by the same seal-by-status helper as step 6; revokes →
     `wa_revoke_message`.
  8. `history`: `wa_set_history` from the metadata (`importing` with
     progress; `done` at 100); error 2593109 → `declined`. Chunk order
     doesn't matter: every write is idempotent and forward-only.
  9. `stateSync`: set or clear `contact_book_name` through
     `wa_upsert_contact`'s row (never create a client). A contact-book add
     for a number with no chat doesn't create a contact.
  10. `account`: offboarding (`PARTNER_REMOVED` with `disconnection_info`,
      or `ACCOUNT_OFFBOARDED`) → `status = 'offboarded'`, `status_reason` =
      the reason, bell row; `ACCOUNT_RECONNECTED` → `connected`, bell row.
  11. Always set `wa_connections.last_event_at = now()`.
  12. `wa_finish_inbox(id, true)`; on an exception
      `wa_finish_inbox(id, false, <error code only>)` and rethrow nothing.
- `relink.ts` (called from the client actions and the import hooks; every
  function returns quietly when WhatsApp is unconfigured or the agent has no
  connection, and never throws into the caller):
  - `linkContact(agentId, contactId, clientIds)`: `wa_link_clients`
    (it checks that the contact and every client belong to `agentId`), then
    unseal the contact's sealed rows in batches (`wa_set_bodies`, status
    `linked`). The pending page and the `?wa=` flow both end here.
  - `relinkForClient(agentId, clientId, phone)`:
    `wa_find_contacts_for_phone` + `matchContactsForClient`; for each
    `pending` or `kept` match: `linkContact`.
  - `releaseClient(agentId, clientId, oldContactId)` (phone changed): set
    the client's `wa_contact_id` to null, then `releaseContact`.
  - `releaseContact(agentId, contactId)`: `wa_set_contact_status(linked →
    pending)`; when true, reseal its plaintext rows in batches
    (`wa_set_bodies`, status `pending`), so the rows expire 14 days later.
  - `relinkPendingContacts(agentId)`: `matchClients` over every pending
    contact (after an import).
- `retention.ts`: `runRetention(admin, now)`, one pass per connection:
  1. Delete `wa_messages` of linked/kept contacts older than the
     connection's `retention_months`.
  2. Delete messages past `expires_at`.
  3. Delete pending contacts whose `greatest(last_inbound_at,
     last_outbound_at, created_at)` is more than 14 days ago (D4).
  4. Delete `digested` marks older than 90 days.
  5. Linked contacts with no client pointing at them → `releaseContact`
     (the safety net for deletes, import undo and crashes); linked or kept
     contacts that still hold sealed rows → unseal them.
  6. D12: connections `connected` whose agent isn't Pro → pause (as in
     process step 3); `paused` and Pro again → resume; `paused` for 23 days →
     bell row "WhatsApp data is deleted in 7 days" (time-based, step 9);
     `paused` for 30 days →
     `deleteWhatsAppData` for that agent (Step 4.8) + bell row.
  7. `last_phone_activity_at` (or `connected_at`, if null) older than 10
     days and status `connected` → bell row, `dedupe_key =
     wa-idle:<connection id>:<date of last_phone_activity_at>` (time-based,
     step 9).
  8. Inbox: delete rows processed more than 24 h ago and dropped rows older
     than 7 days.
  9. Pending digest (Step 5.4). **Time-based rows** (D-F as amended in the
     third pass): the pending digest, step 6's "deleted in 7 days" warning,
     step 7's `wa-idle` row and the sweep's `wa-history-late` row (sweep
     step 4). Each producer belongs in plan 016's
     `src/lib/notify/generate.ts` (016's maintenance note "New notification
     producer"). Until 016 Phase 2 lands, each runs either from this plan's
     cron route (here and in `runSweep`) or from the existing request-time
     `syncNotifications`; either way it moves into `generate.ts` when 016
     Phase 2 lands, and its step here is deleted. Event rows
     (connection changes, dropped rows, history failures, message events)
     stay with this plan, written at event time through `notify.ts` and
     respecting `notifications_agent_dedupe_idx`.
- `sweep.ts`: `runSweep(admin, budgetMs)`:
  1. Loop: `wa_claim_inbox()` → `processInboxRow`, one row at a time, until
     none is left or the budget is spent.
  2. `wa_drop_exhausted_inbox()`: for each dropped row, `console.error`
     with the row id and kind only; a `history` row → that connection's
     `history_status = 'failed'` + bell row.
  3. `wa_claim_history_retries()` → `POST /<phone_number_id>/smb_app_data`
     (history). Success → `requested`; failure → `request_failed`,
     `history_retry_at = now() + 20 min`; after the 3rd failure → `failed`
     + bell row ("Disconnect and connect again within the day").
  4. Connections with `history_status = 'requested'` and no history webhook
     6 hours after `connected_at` → one bell row
     (`wa-history-late:<connection id>`; time-based, retention step 9).
- `notify.ts`: `writeAgentNotification(admin, { agentId, type, key,
  clientId? })`: reads `profiles.locale`, localises title/body with
  `getTranslations({ locale, namespace: "whatsapp.notifications" })`,
  upserts on `(agent_id, dedupe_key)` with `ignoreDuplicates`. Event rows
  always carry the event in the key:
  `wa-conn:<connection id>:<event>:<event unix time>`, so a second
  offboarding writes a new row even after the first was read.

**Verify**: unit tests (node environment) with the fixtures and a fake admin
client that records `rpc`/`from` calls:
- `match.test.ts`: `+34 600123456` vs `34600123456` (match), `600123456` vs
  `34600123456` (match), `+44 07700 900123` vs `447700900123` (match),
  buyer + seller of one person both linked, two different people sharing a
  tail → pending, BSUID-only → pending, the reverse direction for a new
  client.
- `process.test.ts`:
  - duplicate delivery → the second ingest returns 0 and no counter moves;
  - unknown `phone_number_id` stores nothing;
  - **`offboarded.json` (WABA id only) maps by `waba_id`** and flips the
    connection to `offboarded` with one bell row; a body field that names
    another agent's number is ignored;
  - a family chat (no client) → pending, `body_sealed` set, and the
    recorded calls contain **no plaintext** of the fixture's body, caption
    or file name (search every recorded argument);
  - an edit and a revoke for a pending contact store no plaintext either;
  - history for an unmatched contact older than 14 days stores nothing;
  - **empty CRM**: no candidates at all → every contact pending, nothing
    linked, no `client_contacts` call;
  - ignored number → nothing stored;
  - `other_id` → a merge call after the status is aligned;
  - a paused (Free) agent → no message content stored, account events still
    handled; Pro again → resumed;
  - group payload skipped.
- `relink.test.ts`: a new client with a pending contact's number links and
  unseals; a phone change releases the old contact and reseals it; release
  refuses while another client still points at the contact.
- `seal.test.ts`: round trip; tamper → throws; **wrong context** → throws
  (`sealJson` for agent A opened with `unsealJson` as agent B;
  `sealPayload(raw, shaA)` opened with `unsealPayload(…, shaB)`); payload
  round trip of a JSON body with multi-byte UTF-8 (accents, emoji) returns
  the identical string. Wrong-key and unknown-version cases belong to
  `token-crypto.test.ts`. `marks.test.ts`: stable HMAC, differs from the
  number, differs by key.
- `retention.test.ts`: cut-offs at 3/6/12 months, `expires_at`, the 14-day
  pending row rule, D12 at 23 and 30 days, the idle warning key.
- `sweep.test.ts`: rows are claimed one at a time; the loop stops at the
  budget; a dropped history row sets `failed` and writes one bell row; a
  retry claimed once is not retried by a second run.
- `tokens.test.ts`: the RPC names and arguments (`wa_store_token` gets a
  blob, never the token); a store/read round trip; **AAD binding**: a blob
  stored for agent A, returned by `wa_read_token` with `agent_id` B, fails
  as `whatsapp:<agentB>`; a `TokenKeyError` → one `wa_token_undecryptable`
  log line (no values) and the token treated as revoked; a `console` spy
  sees no token or blob.

**Step 4.6: Webhook route (final).** `POST`, `maxDuration = 60`: 503 unless
configured and `WHATSAPP_ROLLOUT !== "off"`; read bytes; 401 on a bad
signature; 413 over 4 MB; `payload_sha256 = sha256(raw)`; insert
`{ payload_sha256, payload_sealed: sealPayload(raw, payload_sha256), byte_size }` into
`wa_webhook_inbox` with `onConflict: "payload_sha256", ignoreDuplicates: true`
and `.select("id")`; if the insert errors, return 500 (Meta retries for up
to 7 days); otherwise return 200 at once, and **only when the insert
returned an id** (a duplicate returns none) schedule
`after(async () => { const [row] = await claim(admin, id); if (row) await processInboxRow(admin, row.id); })`.
Nothing from the payload is logged.

**Verify**: `route.test.ts` (mock `@/lib/supabase/admin` and `next/server`'s
`after`): bad signature 401 with no insert; valid 200 with one sealed insert
(the stored text doesn't contain the raw body); same body twice → one row
and one `after` call; insert failure 500; GET handshake 200/403.

**Step 4.7: Cron.** `src/app/api/cron/whatsapp/route.ts`, `GET`,
`maxDuration = 300`:
- Auth with the shared `authorizeCron(request)` from
  `src/lib/integrations/cron-auth.ts` (spec: plan 013 D22; timing-safe
  compare of `Authorization` with `Bearer ${CRON_SECRET}`). That helper and
  `CRON_SECRET` are created by whichever of plans 013, 014, 016 or 017
  lands first (expected: 016 Phase 2); create both here, to that spec, only
  if none has (D-C). An unset `CRON_SECRET` → 401, logged as
  `cron_secret_missing`; a missing or wrong header → 401, logged as
  `cron_secret_mismatch`; no work runs in either case.
- Outside production (`VERCEL_ENV !== "production"`), require
  `?agent=<uuid>` and touch only that agent's rows (plan 016's local-safety
  rule), else 400.
- `x-vercel-cron-schedule === "15 3 * * *"` → `runRetention`; any other
  call → `runSweep(admin, 240_000)`.
- Response: `{ processed, dropped, retried, retention }`, `Cache-Control:
  no-store`.

It keeps its own path rather than a schedule on 016's
`/api/cron/notifications`, which walks every profile on each call.

**Schedule**: every 5 minutes (`*/5 * * * *`, the sweep) plus a daily
`15 3 * * *` retention run (UTC). The batch's other cron routes: 013
`/api/cron/calendar-sync`, 014 `/api/cron/inbox`, 016
`/api/cron/notifications` (+ its Phase 3 `/api/cron/push`).

**First, check whether plan 016's `pg_cron` fallback is active** (016 Step
21b's check, as in Step 4.0.8: `select jobname from cron.job where jobname
like 'leadwing_%'`, when `cron.job` exists). **If it is**, don't touch
`vercel.json`: add a migration with 016 Step 21b's recipe (rehearse in
`begin … rollback`, then apply with a history row), one job per
route/schedule pair, each sending every header the route needs, including
`x-vercel-cron-schedule` with the exact schedule string (retention depends
on it):

```sql
select cron.schedule('leadwing-whatsapp-sweep', '*/5 * * * *', $job$
  select net.http_get(
    url := 'https://www.leadwing.app/api/cron/whatsapp',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'leadwing_cron_secret'),
      'x-vercel-cron-schedule', '*/5 * * * *'),
    timeout_milliseconds := 300000);
$job$);
select cron.schedule('leadwing-whatsapp-retention', '15 3 * * *', $job$
  select net.http_get(
    url := 'https://www.leadwing.app/api/cron/whatsapp',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'leadwing_cron_secret'),
      'x-vercel-cron-schedule', '15 3 * * *'),
    timeout_milliseconds := 300000);
$job$);
```

Follow 016 Step 21b for anything it has changed since (header set, secret
name, timeout). **If it isn't active**, `vercel.json`: always **append**
these two entries to the existing `crons`
array (plans 013, 014 and 016 may have added entries), never replace it;
one `CRON_SECRET` (D-C). The result when this plan's entries are the only
ones:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["fra1"],
  "crons": [
    { "path": "/api/cron/whatsapp", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/whatsapp", "schedule": "15 3 * * *" }
  ]
}
```

`after()` handles the fast path; the 5-minute sweep only catches leftovers
and retries.

**Verify**: `route.test.ts`: no header or a wrong one → 401; unset secret →
401 (not 500), and neither `runSweep` nor `runRetention` is called;
non-production without `agent` → 400; the schedule header picks
retention vs sweep. After deploy (fallback active): `cron.job` lists both
`leadwing-whatsapp-*` jobs with those schedules, and `net._http_response`
plus the Vercel logs show a 200 for each once. After deploy (Vercel Cron):
Vercel → Settings → Cron Jobs lists both;
then, in runtime logs (Vercel MCP), requests to `/api/cron/whatsapp` with
user agent `vercel-cron/1.0` answer **200**. **A 401, 403 or redirect there
is a STOP** (Vercel Authentication may be answering on the generated
deployment URL); report, and the founder decides on plan 016's `pg_cron` +
`pg_net` fallback (D5, Step 21b). That fallback must schedule every route in
`vercel.json`'s `crons` block, both `/api/cron/whatsapp` entries included,
at the same cadence, as the two jobs above (each carrying its own
`x-vercel-cron-schedule`, or retention never runs), before that block is
removed. It is also the batch's one Vault exception
(D-B): it keeps `CRON_SECRET` in Vault because `pg_net` needs it inside the
database; it is used only if Vercel Cron can't be; `CRON_SECRET` only
triggers idempotent scheduled jobs and grants no data access; rotate
`CRON_SECRET` after any exposure of `SUPABASE_DB_URL`. No integration token
uses Vault.

**Step 4.8: Connect action (final).** `completeWhatsAppSignup` from Step 2.4,
plus:
- Gate: `WHATSAPP_ROLLOUT` (`admin` → `is_admin` only; `pro` → `isPro()`),
  and D2.
- The agent already has a connection:
  - same `phone_number_id` → reconnect: update that row (`status =
    'connected'`, clear `status_reason`/`paused_at`, `connected_at = now()`,
    reset the history fields and `history_retry_count`);
  - a different number → refuse: "Delete your WhatsApp data in Settings
    before connecting another number." (The old number's contacts would
    otherwise mix with the new one's.)
- `phone_number_id` or `waba_id` on **another** agent's row:
  - that row `connected` or `paused` → refuse: "This number is already
    connected to another LeadWing account.";
  - that row `offboarded` or `error`, and step 4 proved the new token
    controls the WABA → take it over: delete the old connection row (its
    `wa_connection_secrets` row, the only copy of its token, goes with it
    through the FK cascade), keep the old agent's contacts and
    messages under their own retention, and write the old agent a bell row
    ("Your WhatsApp number was connected to another LeadWing account"). If
    anything here is unclear in practice: STOP.
- Otherwise insert the row. Then `storeToken`, `subscribed_apps`, both
  `smb_app_data` calls. History call OK → `history_status = 'requested'`,
  `history_requested_at = now()`. History call failed →
  `history_status = 'request_failed'`, `history_retry_at = now() + 5 min`
  (the sweep retries, Step 4.5), and the result tells the panel to show
  "History import is being retried".
- Never call `/register`.
- Return `{ ok: true, displayPhone }` or a localised error; log Graph error
  codes only.

Also `deleteWhatsAppData()` (Settings): `getUser()`; best-effort
`DELETE /<waba_id>/subscribed_apps` with the stored token; delete the
connection row (the FK cascade deletes its `wa_connection_secrets` row, the
only copy of the token; nothing else to purge), all the agent's `wa_contacts`
(cascades to messages; `clients.wa_contact_id` nulls), their
`wa_number_marks` and inbox rows. `client_contacts` rows stay (CRM data, like
a logged call). The agent still disconnects the number in the app; the panel
says so. The retention job reuses it for D12 (with the admin client and the
agent id instead of `getUser()`).

**Verify**: `whatsapp-connect.test.ts` (stubbed `graph`, fake admin):
ids not listed by `GET /<waba_id>/phone_numbers` → refused, nothing stored;
a number on another agent's connected row → refused; an offboarded row of
another agent → taken over, old agent notified; a second number for the same
agent → refused; rollout `admin` refuses a non-admin, `pro` refuses Free; a
failed history call → `request_failed` with `history_retry_at`; no call to
`/register`; a `console` spy sees no token, secret or URL.
`deleteWhatsAppData`: every table, `wa_connection_secrets` included, is
cleared for that agent only.

**Step 4.9: Bell entries.** `notification-item.tsx`: `ICONS.wa_connection`
and `wa_pending_digest` (lucide `MessageCircle`/`Inbox`), `TONES`;
`notificationHref`: `wa_connection` → `/settings/whatsapp`,
`wa_pending_digest` → `/whatsapp` (route before the `client_id` fallback);
labels in `messages/{en,es}/notifications.json` `types.*` ("WhatsApp" /
"WhatsApp").
**Verify**: `notifications.test.ts` covers both hrefs; typecheck passes.

**Step 4.10: Client, export and import hooks.**
- `src/lib/actions/clients.ts`:
  - `createClient(values, opts?: { waContactId?: string })`: after the
    insert, `after(() => opts?.waContactId ? linkContact(user.id, opts.waContactId, [id]) : relinkForClient(user.id, id, phone))`.
    `waContactId` is validated as a uuid and is never part of the form
    schema.
  - `updateClient`: when `phone` changed, `after(() => releaseClient(…)`
    then `relinkForClient(…))`.
  - `deleteClient`: read the client's `wa_contact_id` before the delete; after
    it, `after(() => releaseContact(…))`.
  - `src/lib/actions/clients.test.ts` (new; mock Supabase, `next/server`'s
    `after` and `relink.ts`): each hook fires once with the right ids, not
    at all when the phone didn't change, and a hook failure doesn't fail the
    save.
- If plan 011 has landed, `loadAccountExport` adds `whatsapp-contacts.csv`
  (name, number, BSUID, status, linked client IDs, message count, last in,
  last out) and `whatsapp-messages.csv` (client name, client ID, direction,
  source, type, text or caption, file name, sent at, status, `wamid`).
  Sealed content is exported as empty text. README and workbook sheets too.
- If plan 012 has landed: after a successful import batch,
  `relinkPendingContacts(agentId)`; after an undo, `releaseContact` for every
  contact the removed clients pointed at (the daily safety net covers a
  missed call).

**Step 4.11: Suite.** `npm run typecheck && npm run lint && npm test && npm run build`.

### Phase 5: UI — connect, conversation panel, pending list (4–5 days)

Gated by: Phase 1 GO; Phase 4 live. Any agent other than the founder also
needs Phase 3 approved (Advanced access); until then `WHATSAPP_ROLLOUT`
stays `admin`.

**Step 5.1: Settings.**
- `src/app/(app)/settings/page.tsx` calls `getWhatsAppPanelState()` from
  `src/lib/data/whatsapp.ts` (server) and passes the result to
  `SettingsView` as a serialisable `whatsapp` prop: `null` when
  `waConfig()` is null or the rollout excludes the agent; otherwise
  `{ isPro, connection (status, reason, display phone, history status and
  progress, retention, last phone activity, paused_at), pendingCount,
  matchableClients, clientsWithPhone, graphVersion, appId, configId }`.
  `matchableClients` = clients whose phone starts with `+` or `00`.
- `src/components/settings/whatsapp-panel.tsx`, rendered by `SettingsView`
  after plan 011's data panel (or after `<PreferencesPanel />` at
  `settings-view.tsx:170` if 011 hasn't landed); nothing renders when the
  prop is `null`. States:
  1. **Free**: one locked row, "Connect your WhatsApp Business number (Pro)",
     with a link to `/pricing`.
  2. **Not connected**: what it does, the catch list below, and the
     pre-connect check: "N of your clients have a phone number with a
     country code." When N < 5: a warning ("LeadWing can only match chats
     to clients it knows. History older than 14 days is kept only for
     clients who are already here.") and an "Import clients" link (plan 012)
     next to "Connect anyway" → `/settings/whatsapp`.
  3. **Connected, importing**: history progress, or "History import is
     being retried" (`request_failed`), or the failure text (`failed`,
     `declined`).
  4. **Connected**: number, status tag, "Phone last active {relative}",
     retention select (3/6/12 months → `setWhatsAppRetention`), "N contacts
     waiting" → `/whatsapp`, "Ignored numbers: N" with "Clear" (the
     numbers themselves aren't stored), "How to disconnect" (Settings →
     Account → Business Platform in the app), and "Delete WhatsApp data"
     behind `ConfirmDialog`.
  5. **Warning** (inside 4) when `last_phone_activity_at` (or
     `connected_at`) is older than 10 days: "Open WhatsApp Business on your
     phone and send a message, or the connection stops after about 14 days."
  6. **Paused (D12)**: "Your plan is Free, so WhatsApp sync is paused. Your
     WhatsApp data is deleted on {date} unless you're on Pro again."
  7. **Offboarded / error**: the reason in plain words and a "Reconnect"
     link.

**The catch list** (the same words go into the interview's design-partner
ask, U2):
- You need the WhatsApp Business app, version 2.24.17 or later. Personal
  WhatsApp can't be connected.
- You sign in with your Facebook or Meta business account and pick or create
  a business portfolio.
- Meta asks for a payment method on your WhatsApp Business account. Only
  messages sent from LeadWing can cost money; messages you type on your phone
  stay free.
- Open WhatsApp Business on your phone at least every 14 days, or the
  connection stops.
- Connecting unlinks all your linked devices. You can link WhatsApp Web and
  the Mac app again; WhatsApp for Windows and Wear OS can't be linked.
- Messages that clients send from WhatsApp for Windows don't reach LeadWing.
- Your broadcast lists become read-only, and you can't create new ones.
- Disappearing messages, view-once and live location are turned off in your
  one-to-one chats.
- All your one-to-one chats pass through LeadWing. It keeps chats with your
  clients (and contacts you choose to keep) and deletes the rest within 14
  days. Group chats never sync.

`src/app/(app)/settings/whatsapp/page.tsx` (under the existing `/settings`
protected prefix, so no route list change) shows the steps the agent will
see in Meta's window and the final `EmbeddedSignupButton` with the two-click
flow from Step 2.4 (the Meta-cookies line comes before the script loads).

**Step 5.2: Client card.** `src/lib/data/whatsapp.ts`:
`getClientWhatsApp(clientId)` → `null` when the tables are missing (PGRST205)
or the agent isn't connected; otherwise `{ connection, contact, messages
(latest 30), hasMore }` (cookie client, RLS). Add it to the `Promise.all` in
`src/app/(app)/clients/[id]/page.tsx:31-51`.

`src/components/clients/whatsapp-thread.tsx` (`"use client"`), a `Panel`
titled "WhatsApp", rendered in the main column right after `TasksSection`
(`client-detail-view.tsx:495-503`):
- Oldest-to-newest bubbles (in = left, out = right), day separators in the
  agent's time zone, "from your phone" / "sent from LeadWing" / "imported"
  markers in small text, media placeholders ("Photo · caption", "Document ·
  file.pdf"), "edited" and "deleted" states.
- "Load earlier" → server action `loadWhatsAppMessages({ clientId, before })`
  (cookie client, RLS).
- Empty states: not connected ("Connect WhatsApp in Settings", Pro only);
  connected but no contact ("No WhatsApp chat found for {phone}. Check the
  number has a country code."); history still importing; paused.
- Read-only. The composer stays in the header.

**Step 5.3: Pending list.**
**If plan 014's lead inbox has shipped before this step: STOP** and ask the
founder whether pending contacts that wrote first become inbox entries
(recommended: one triage surface; this page then keeps only Keep/Ignore
housekeeping). Re-plan this step before building.

Otherwise: `src/app/(app)/whatsapp/page.tsx` (add `"/whatsapp"` to
`PROTECTED_PREFIXES`, the `routes.test.ts` cases, and check
`robots.txt/route.test.ts`). `src/components/whatsapp/pending-contacts.tsx`
lists `pending` contacts: name (contact book, then profile), number or "no
number (username)", message count, last message time, "deleted on {date}",
suggestions from `match.ts`, and actions (all in `src/lib/actions/whatsapp.ts`,
each calling `getUser()` first and checking the contact belongs to that
agent before any admin-client call):
- **"Add as buyer" / "Add as seller"** →
  `/clients/new?side=buyer|seller&wa=<contactId>`. The page
  (`src/app/(app)/clients/new/page.tsx`) reads `wa` (uuid only), loads that
  contact with the cookie client (RLS: own rows only; ignore it unless
  `pending` or `kept`), and passes `defaultValues` (first/last name split
  from the contact-book or profile name at the first space; phone as
  `"<+dial> <rest>"`, the dial code found by longest prefix in
  `src/lib/countries.ts`) and `waContactId` to `ClientForm`, which passes it
  to `createClient(values, { waContactId })` (Step 4.10). The Free cap and
  `client_limit_reached` apply unchanged.
- **"Link to client…"**: a client picker; on confirm
  `linkWhatsAppContact({ contactId, clientIds })` → `linkContact`.
- **"Keep (agency or agent)"**: `keepWhatsAppContact` →
  `wa_set_contact_status(pending → kept)` and unseal (D13).
- **"Ignore"**: `ignoreWhatsAppContact` → `markIgnored(numberHmac)`, then
  delete the contact (its messages cascade).
No sidebar item; entry points are the Settings panel, the bell digest and
the client card empty state. Kept contacts are listed under a "Kept" tab with
"Move back to pending".

**Verify**: `whatsapp.test.ts` (actions): each action refuses a contact of
another agent (the admin client is never called), refuses without a user,
and calls the right RPCs; `new/page` ignores a `wa` that isn't a uuid or
isn't the agent's.

**Step 5.4: Digest.** A producer in plan 016's `generate.ts` (D-F); until
016 Phase 2 lands, in the daily retention run or in `syncNotifications`
(Step 4.5, retention step 9): for each connected agent, count `pending` contacts created since
`pending_digest_at` whose number HMAC isn't `digested`; if any, one row
`dedupe_key = wa-pending:<YYYY-MM-DD>` (agent zone), body "{count} new
WhatsApp contacts to sort"; then mark those numbers `digested` and set
`pending_digest_at = now()`. Never one row per contact.

**Step 5.5: Quick view.** Read how `client-sheet.tsx` gets its data first. If
one extra field is cheap, show the last message line ("You · 2 h ago: …")
under the WhatsApp button; if it costs a new round trip per open, skip it and
note that here.

**Step 5.6: Copy.** New namespace `whatsapp` in `messages/{en,es}/whatsapp.json`
(settings, catches, connect, thread, pending, notifications, errors),
registered in `src/i18n/messages.ts`. Spanish uses the UI's existing words
("Ajustes", "Compradores", "Vendedores").

**Step 5.7: Visual check.** Preview-tmp page with mock data: the thread (30
messages, both directions, media, edited/deleted), the settings panel in all
seven states (plus the N < 5 warning), the connect page before and after
"Continue", the pending list with suggestions and the Kept tab, the
prefilled new-client form; English and Spanish; 375 px and desktop; dark
mode; no horizontal scroll at 375 px (Spanish runs wider). Delete your
folder.

**Step 5.8: Production check with fresh data.**
1. **Test data** (founder's account; the founder approves in chat): a buyer
   "Prueba Uno" with the second phone's number with its country code
   (`+<dial> <number>`), and a seller "Prueba Uno" with the same number
   **without** the country code. Write down both client ids.
2. **Fresh onboarding**: the spike connection has used its one-time history
   request. The founder disconnects the number in the app (Settings →
   Account → Business Platform), waits for the offboarded bell row, then
   connects again from `/settings/whatsapp`.
3. The founder checks: history reaches "done"; "Prueba Uno" shows the chat on
   **both** records; family chats appear only as pending rows with no
   readable text (probe as service role: those rows have `body` null and
   `body_sealed` set); a message typed on the phone to the second phone
   appears on the card within a minute, and plan 016's "Last contact"
   updates while `updated_at` doesn't; a message from the second phone
   appears and doesn't move "Last contact".
4. Delete the two test clients afterwards; the next retention run releases
   the contact.

**Verify**: suite passes; Step 5.8 passes; `select count(*) from
wa_webhook_inbox where dropped_at is not null` = 0 (**any dropped row during
this check is a STOP**).

### Phase 6: Send from the composer inside the 24 h window (1.5–2 days)

Gated by: Phase 5; Phase 3 approved (Advanced access is needed for agents'
numbers); Prerequisite 13 re-checked.

**Step 6.1.** `sendWhatsAppText({ clientId, text })` in
`src/lib/actions/whatsapp.ts`: `getUser()`; Pro; connection `connected`;
contact `linked` with `last_inbound_at > now() - 24 h` (re-checked on the
server); text 1–4,096 characters (Meta's text limit as commonly documented;
re-check); `POST /<phone_number_id>/messages` with
`{ messaging_product: "whatsapp", recipient_type: "individual", to: wa_id,
type: "text", text: { body, preview_url: false } }` (BSUID recipients: use the
field the spike confirmed); on success `wa_ingest_messages` with one row
(`source = 'api'`, `status = 'sent'`, `wamid` from the response), which also
logs the contact for plan 016. Errors → localised: window closed, token
revoked (set `status = 'error'`), offboarded, paused, rate-limited.

**Step 6.2.** `getClientWhatsApp` also returns `windowOpenUntil`;
`src/app/(app)/clients/[id]/page.tsx` passes it through
`client-detail-view.tsx` to `message-composer.tsx`. When the window is open,
show "Send from LeadWing" next to "Open in WhatsApp" (which stays the default
and unchanged), with a one-line note. **The note depends on Meta's pricing
page at build time** (Prerequisite 13):
- if Meta's page shows a free monthly allowance for in-window replies:
  "Free for your first {n} replies each month; after that Meta charges your
  card.";
- otherwise: "Meta may charge your card for messages sent from LeadWing;
  messages you type on your phone stay free."
Outside the window, only "Open in WhatsApp". Never auto-send.

(`WhatsAppButton` recording taps is plan 016 Step 8, not this plan.)

**Verify**: action tests (window open/closed, not linked, Free, paused,
Graph error); the founder sends one reply from LeadWing and sees it on their
phone and as "sent from LeadWing" on the card, with `delivered`/`read`
arriving.

### Phase 7 (optional): Templates and AI summaries (2–3 days)

Gated by: usage from Phases 5–6, agents asking, and D11.
- **Templates**: `templates.ts` creates a small set on the agent's WABA
  (utility: viewing reminder and viewing confirmation, EN/ES/DE; optional
  marketing follow-up), shows approval status, and sends one outside the
  window only after showing the per-message cost and an opt-in reminder
  ("Only message clients who agreed to hear from you on WhatsApp").
- **Summaries** (D11): `summariseWhatsApp({ clientId })` sends at most the
  last 60 messages (about 4,000 tokens) to `openrouterChat` with a new
  optional `provider: { only: ["azure"], zdr: true, data_collection: "deny",
  allow_fallbacks: false }` (whether the `azure/swedencentral` tag can be
  pinned to keep it in the EU is **unverified**; check OpenRouter's
  provider-routing docs first); stores the result in
  `wa_summaries (agent_id, client_id, body, created_at)` (a small migration,
  same RLS/grants pattern); a per-agent opt-in toggle in the WhatsApp panel.
- **Legal, before enabling**: privacy §5 gains the summary paragraph, and §5
  and the §6 table (EN and ES) name "Microsoft Azure (via OpenRouter)" for
  this flow; Terms annex D's 30-day notice goes to every agent first.

### Phase 8a: Legal and copy for receiving and viewing (before any non-founder connects)

Gated by: Phase 5 live; Phase 3 approved; lawyer review (D8, with the DPIA
screen). Ships in the same deploy that sets `WHATSAPP_ROLLOUT=pro`, never
before. **Nothing in 8a mentions replying from LeadWing.**

**Step 8a.1: Privacy** (`privacy.{en,es}.tsx`), with an anchor
`id="whatsapp"` on the §4 paragraph (point Meta's data-deletion URL at
`/privacy#whatsapp`):
- §4, EN: "If you connect WhatsApp Business, all your one-to-one WhatsApp
  chats pass through {SITE_NAME}. We keep your chats with people saved as
  clients, and with contacts you choose to keep (text, times and file names;
  never photos or files). For everyone else (friends, family, new contacts)
  we keep only the last 14 days, encrypted, so you can add them as clients:
  each message is deleted 14 days after it arrives, and the contact entry 14
  days after their last message. For numbers you ignore we keep only a
  one-way code, so they aren't stored again." ES: "Si conectas WhatsApp
  Business, todos tus chats individuales de WhatsApp pasan por {SITE_NAME}.
  Conservamos tus chats con las personas guardadas como clientes y con los
  contactos que decidas conservar (texto, horas y nombres de archivo; nunca
  fotos ni archivos). Del resto (amigos, familia, contactos nuevos) solo
  guardamos los últimos 14 días, cifrados, para que puedas añadirlos como
  clientes: cada mensaje se borra 14 días después de llegar, y el contacto
  14 días después de su último mensaje. De los números que ignoras solo
  guardamos un código irreversible, para no volver a guardarlos."
- §6: Meta as "a service you connect" (or a sub-processor row if the lawyer
  says so).
- §8, EN: add "If you connect WhatsApp, the connect page loads Meta's
  sign-in script only after you choose to continue, and Meta may set its own
  cookies under its own policy." ES: "Si conectas WhatsApp, la página de
  conexión carga el script de inicio de sesión de Meta solo cuando decides
  continuar, y Meta puede instalar sus propias cookies según su política."
  In the same edit, delete the stale offline-copy sentence
  (`privacy.en.tsx:309-311`, `privacy.es.tsx:323-326`), keeping "You can
  remove all of this at any time by clearing the site's data in your
  browser." / "Puedes borrar todo esto cuando quieras eliminando los datos
  del sitio en tu navegador."
- §10: "WhatsApp messages with clients and kept contacts: 3, 6 or 12 months
  (your choice). Other contacts: 14 days, as in section 4. Everything
  WhatsApp is deleted at once when you delete your WhatsApp data, and 30
  days after your plan drops to Free." Change "Downgrading from Pro to Free
  deletes nothing." to "Downgrading from Pro to Free deletes nothing except
  connected WhatsApp data (see below)." (ES: "Pasar de Pro a Gratis no borra
  nada, salvo los datos de WhatsApp conectado (ver abajo).") The existing
  backups line (30 days) covers deleted WhatsApp data too; confirm the
  project's backup and PITR retention in Supabase before publishing
  (**unverified**).
- §5 only if Phase 7 ships.

**Step 8a.2: Terms.**
- §10: keep the ownership sentence (EN `:140`–start of `:141`; ES
  `:144-145`) and replace **only** the WhatsApp sentence (EN from
  "{SITE_NAME} opens WhatsApp" on `:141` through `:143`; ES `:146-147`):
  - EN: "{SITE_NAME} opens WhatsApp on your device with a pre-written
    message, and the message is sent by you. If you connect your WhatsApp
    Business number, {SITE_NAME} also receives copies of all your one-to-one
    chats through Meta's official WhatsApp Business Platform, keeps the ones
    with your clients and with the contacts you choose to keep, and deletes
    the rest within 14 days. Meta's WhatsApp Business terms, which you accept
    when connecting, apply to that connection, and any charges from Meta are
    billed to you by Meta. You are responsible for telling your clients how
    you use their messages."
  - ES: "{SITE_NAME} abre WhatsApp en tu dispositivo con un mensaje ya
    redactado, y el mensaje lo envías tú. Si conectas tu número de WhatsApp
    Business, {SITE_NAME} recibe además copias de todos tus chats
    individuales a través de la plataforma oficial WhatsApp Business de
    Meta, conserva los de tus clientes y los de los contactos que decidas
    conservar, y borra el resto en un plazo de 14 días. A esa conexión se
    aplican las condiciones de WhatsApp Business de Meta, que aceptas al
    conectarla, y Meta te factura directamente los cargos que correspondan.
    Informar a tus clientes de cómo usas sus mensajes es responsabilidad
    tuya."
- Annex A (EN `:224-233`, ES `:230-240`):
  - nature and purpose: add "receiving and displaying WhatsApp messages from
    a number you connect" / "recepción y visualización de mensajes de
    WhatsApp de un número que conectes";
  - data: add "WhatsApp messages from a connected number (text, times, file
    names)" / "mensajes de WhatsApp de un número conectado (texto, horas,
    nombres de archivo)";
  - data subjects: add "other people who message your connected WhatsApp
    number" / "otras personas que escriben a tu número de WhatsApp
    conectado".
- If Meta is a sub-processor, send the annex D notice 30 days before
  `WHATSAPP_ROLLOUT=pro`. Bump `LEGAL_UPDATED.privacy` and `.terms`.

**Step 8a.3: SEO pages** (receive-and-view wording only).
- `crm-spain.en.tsx:108-113` callout → "{SITE_NAME} never sends anything on
  its own. If you use WhatsApp Business, you can connect your number (Pro) so
  your chats with clients show on their cards; otherwise it writes the
  message and hands it to WhatsApp, and sending stays with you."
- `crm-spain.en.tsx:258-259` FAQ answer → "It drafts them in the client's
  language and opens WhatsApp with the message ready. On Pro you can connect
  a WhatsApp Business number, and your chats with clients appear on their
  cards. Personal WhatsApp can't be connected, and nothing is sent without
  you."
- `crm-marbella.en.tsx:136-139` and `:186-187`: same facts, the page's voice
  (the paragraph keeps "nothing is ever sent automatically on your behalf").
- Spanish twins at the lines in Current state 13, same facts.
- Bump `PUBLISHED.crmSpain` and `.crmMarbella` (`src/lib/seo.ts`).

**Step 8a.4: Landing and llms.txt.**
- `landing.onePlace.body`: keep the interim text and append, EN: " On Pro,
  you can also connect your WhatsApp Business number so your chats with
  clients show on their cards." ES: " En Pro, también puedes conectar tu
  número de WhatsApp Business para que tus chats con clientes aparezcan en su
  ficha."
- `landing.onePlace.srSummary`: append the same sentence in each language.
- `landing.faq.items.whatsapp.a` (EN/ES): add the connect sentence (Pro,
  WhatsApp Business only).
- `src/app/llms.txt/route.ts`: a feature line "WhatsApp Business (Pro,
  optional): connect your number through Meta's official platform; chats with
  clients appear on their cards".
- Nothing claims Notes, Reminders, Calendar or Drive content is imported.

**Verify (8a)**: `/`, `/es`, `/privacy`, `/es/privacidad`, `/terms`,
`/es/terminos`, the two SEO pages in both languages and `/llms.txt` render
the new text, and the ownership sentence is still in Terms §10 in both
languages;
`grep -rn "does not connect to your WhatsApp\|no se conecta a tu cuenta de WhatsApp\|no WhatsApp inbox\|not pulled into the app\|bandeja de entrada de WhatsApp\|bandeja de WhatsApp\|no entran en la aplicación\|conversations are never read\|no se leen nunca\|readable offline\|sin conexión" src/content messages`
returns nothing; `grep -rn "reply\|respond" src/app/llms.txt/route.ts` shows
no WhatsApp reply claim; sitemap `lastmod` moved for the legal and SEO
pages. Then, with the founder's go-ahead and Phase 3 approved, set
`WHATSAPP_ROLLOUT=pro`.

### Phase 8b: Copy for replying (ships with Phase 6, never before)

- Terms §10: after "keeps the ones with your clients and with the contacts you
  choose to keep," add "lets you reply to your clients from {SITE_NAME}
  within 24 hours of their last message," / "te permite responder a tus
  clientes desde {SITE_NAME} en las 24 horas siguientes a su último mensaje,".
- SEO FAQ answers: add "Within 24 hours of a client's last message you can
  also reply from LeadWing." / "En las 24 horas siguientes al último mensaje
  de un cliente también puedes responder desde LeadWing."
- llms.txt: append "; reply from the app within 24 hours of the client's last
  message".
- Bump the dates again. **Verify**: the pages render the reply sentences only
  after Phase 6 is live for Pro.

## Prerequisites outside the code

| # | Item | Owner | Lead time | Needed by |
|---|---|---|---|---|
| 1 | U1 copy fix (and U3 if "match"), applied inside plan 016 Step 0.1's one commit (D-G) | Claude (founder pushes) | 30 min | 20 Sep 2026 |
| 2 | U2 interview questions in the script | Claude | 30 min | 20 Sep 2026 |
| 3 | D14 animation decision | Founder | 5 min | 20 Sep 2026 |
| 4 | An autónomo (or company) registration exists (D7) | Founder | if missing: days to weeks, plus its monthly social-security cost | Step 0.1 |
| 5 | Legal name, NIF, fiscal address, mailbox; `legal.ts` filled and deployed (shared with plan 013 P1) | Founder supplies, Claude edits | 1 day | Steps 0.4 and 0.5 |
| 6 | Meta Business portfolio + 2FA on the founder's Facebook account | Founder | 1 h | Phase 0 |
| 7 | Domain verification TXT on Vercel DNS (team `lepadatumihails-projects`) | Claude runs it after the founder's go-ahead | 1 h + DNS propagation | Step 0.4 |
| 8 | Business verification with a recent document (accepted Spanish documents for an autónomo: unverified) | Founder | days to weeks (Meta) | Phase 3; onboarding beyond 10 per week |
| 9 | Meta app (Business type, WhatsApp use case, icon, privacy/terms/data-deletion URLs, Login for Business config with coexistence) | Founder, Claude drafts text | half a day | Phases 2 and 3 |
| 10 | Phones: the founder's WhatsApp Business app ≥ 2.24.17, plus a second phone | Founder | — | Phases 2, 3, 5 |
| 11 | App Review (two videos with API Setup cURL and WhatsApp Manager + descriptions), then Access Verification if asked | Founder records, Claude drafts | about 24 h average review (partner source, unverified), resubmissions possible | any non-founder connection; Phase 6 |
| 12 | Supabase plan confirmed; move to Pro ($25/mo) if the project is on Free (500 MB cap) | Founder | 15 min | Phase 4 (Step 4.0.7) |
| 13 | Re-check Meta's pricing page (in-window billing from 1 Oct 2026; any free allowance; Spain rates) | Claude | 30 min | Phase 6 copy |
| 14 | Plan 016 Phase 1 live (hard dependency, D15; no fallback) | Plan 016's executor | 3–4 days | Phase 4 |
| 15 | Vercel production env vars (Step 2.1 table): the founder pastes the Meta secrets; after the founder's OK, Claude creates `INTEGRATION_TOKEN_KEY` (if 007/013 haven't) and `WHATSAPP_NUMBER_HMAC_KEY` as Sensitive variables with Step 2.1's key custody steps (0600 scratchpad file → `vercel env add <NAME> production --sensitive` → founder copies it into the password manager → `rm -P`), since Sensitive variables can't be pulled back (D-I); CLI link or Vercel MCP | Founder approves and pastes the Meta secrets; Claude generates the two keys and adds the non-secret variables | 15 min | Phase 2 (the two keys: before Step 4.6) |
| 16 | Interview evidence against D1 | Founder (and Lena), Claude logs | 21 Sep – 9 Oct 2026 | Phase 2 |
| 17 | About an hour of lawyer review (Meta's role, agents informing their clients, template opt-in, DPIA screen, the retention texts) | Founder | 1–2 weeks to book | Phase 8a |
| 18 | Correct the WhatsApp memory note: Embedded Signup v2 ends **15 Oct 2026** per Meta's overview (not 8 Oct); Spain marketing rate about €0.0509 (the €0.0585 figure wasn't found); Mobilia is "official API", not coexistence | Claude (memory session) | 5 min | next memory pass |

## Costs per agent per month

| Item | Who pays | Estimate | Basis |
|---|---|---|---|
| Message storage (text only) | LeadWing (Supabase) | about 5–30 MB per agent per year for client chats; pending content lasts ≤ 14 days | text rows; no media bytes (estimate) |
| History import peak | LeadWing (Supabase) | one-off; sealed payloads (uncompressed UTF-8 JSON in base64url, about a third larger than the raw body) live ≤ 24 h in the inbox, perhaps 50–500 MB for a busy number (the earlier 10–100 MB assumed gzip, and JSON usually compresses several-fold) (**estimate; measure in Step 2.5.11**). Postgres reuses the space after vacuum but doesn't shrink the database. | Meta: payloads up to 3 MB |
| Supabase tier step | LeadWing | €0 if the project is already on Pro; otherwise $25/mo (about €23) once the 500 MB Free cap nears, i.e. about €1.15 per agent at 20 agents if all of it is charged to this feature | Free cap and Pro price: general knowledge, **not re-verified**; project tier unknown |
| Webhooks | LeadWing (Vercel Pro, fra1) | about $0.07 for an active agent (≈ 9,000 POSTs/month, ≈ 0.5 s alive each at 2 GB, ≈ 50 ms CPU each) | fra1: $0.184 per Active-CPU hour, $0.0152 per GB-hour of Provisioned Memory (**billed while waiting on I/O**), $0.60 per million invocations; 2 GB memory is an assumption |
| Sweep + retention cron | LeadWing (Vercel Pro) | about $0.03/month for the whole project (8,640 short runs) | same basis |
| AI summaries (Phase 7, opt-in) | LeadWing (OpenRouter → Azure) | about €0.001 each; 100 a month ≈ €0.10 | gpt-4o-mini $0.15 / $0.60 per M tokens, ~4k in / 300 out |
| **LeadWing total** | | **about €0.10–0.20**, plus up to about €1.15 of a Supabase tier step at 20 agents | well under the €29 Pro price |
| One-off lawyer hour | LeadWing | not priced here | Prerequisite 17 |
| Received messages, history, phone echoes | nobody | €0 | Meta pricing page |
| Messages typed in the Business app | nobody | €0 | Meta coexistence page ("will continue to be free") |
| API replies inside the 24 h window (Phase 6) | the agent's card (Meta) | free as Meta's page reads on 16 Sep 2026; from 1 Oct 2026 billable per Zendesk's 10 Aug 2026 notice; a 1,000-per-number free allowance appears only in reseller posts | **unverified on Meta's page**; Prerequisite 13 |
| Templates outside the window (Phase 7) | the agent's card (Meta) | utility about €0.0166, marketing about €0.0509 each (Spain) | third-party rate tables; **unverified** |
| Comparison: 360dialog Growth | LeadWing | €500/mo for 10 numbers, then €25 each: €750 at 20 agents (€37.50 each) | why option C is rejected |

## Risks

- **Personal chats**: history sync sends every 1:1 chat on the work number.
  A bug in matching, sealing or the 14-day purge means storing data LeadWing
  should never hold. Mitigated by sealing at the webhook, per-message
  expiry, fixture tests that search every recorded call for plaintext, and
  Step 5.8's probe.
- **An empty CRM at connect time**: nothing matches, and history older than
  14 days is lost for chats that become clients later. Mitigated by the
  pre-connect prompt (Step 5.1); accepted as the price of D4.
- **Silent disconnection** (about 14 days without the primary device, per
  Meta's `PRIMARY_INACTIVITY`; uninstall; re-registration). `last_event_at`
  stays fresh from inbound traffic even while the phone sleeps, so the
  warning reads `last_phone_activity_at` instead; the offboarded bell row is
  the backstop.
- **Companion gaps**: messages clients send from WhatsApp for Windows (and
  Wear OS) produce no webhook (Meta).
- **The 24-hour history window**: a failed request is retried from the sweep
  within the hour and alerted; after three failures, offboard and redo.
- **Best-effort matching**: BSUID-only senders, numbers without country
  codes, one person as two clients, a phone edited later (relink hooks and
  the daily safety net).
- **`updated_at` semantics**: with plan 016's trigger (extended here),
  contact, linking and **no-op updates** no longer bump `updated_at`. Saving
  an unchanged form no longer moves a client up the list (the list orders by
  `updated_at`), and the export's "Updated" column means real edits only.
  The quiet rule must read `last_contacted_at` (Step 4.0.2).
- **Three plans change one trigger** (015, 016, 017): one function, one
  shared skip array, created by whichever of 015 B1 or 016 Phase 1 lands
  first; later plans read the live function and merge, never overwrite
  (D-E, Step 4.0.3).
- **Plan changes (D12)**: a comped Pro period ends with no webhook; the
  per-row check and the daily run catch it.
- **Forgery and cross-tenant writes**: signature before parsing; `agent_id`
  only from `metadata.phone_number_id` or `entry[].id` (WABA); every RPC
  takes `p_agent` and checks ownership inside.
- **Takeover of an offboarded number**: the old agent keeps their data and is
  told.
- **Token leakage**: tokens are stored only as the AES-256-GCM text blob
  (`token_blob`) in `wa_connection_secrets` (RLS on, no policies,
  service_role only), encrypted
  by the shared `token-crypto.ts` (D9); the key `INTEGRATION_TOKEN_KEY` lives
  only in Vercel, so neither a database leak nor a leaked key alone reveals a
  token. Never in logs, URLs in logs, or RLS-readable rows. A suspected key
  leak → the shared rotation runbook (Maintenance notes).
- **Retries and bursts**: 7 days of retries, payloads up to 3 MB, parallel
  POSTs. Idempotent RPCs, one-row claims with a 6-minute lock, caps on claims
  and attempts, alerts on drops.
- **Live migration locks**: short strong locks on `clients`; lock and
  statement timeouts, a quiet hour, no table rewrite.
- **Platform churn**: v2 end 15 Oct 2026, 1 Oct 2026 pricing, usernames and
  BSUIDs, Tech Provider terms.
- **Cost surprises for agents**: say it before the first paid send.
- **Verification delays** while the legal entity is a placeholder (Step 0.1
  goes first).
- **AI summaries** change the processor to Azure (D11).
- **Scope creep** into an inbox (and a second triage list next to plan 014's).
- **Copy drift**: SEO and Terms must flip on the same deploy as
  `WHATSAPP_ROLLOUT=pro` (8a), and again with Phase 6 (8b).

## Test plan

- **Unit** (node environment): `token-crypto` (013 Step 2.2's cases; the
  module exports only `encryptSecret`, `decryptSecret` and
  `needsReencrypt`; a wrong AAD, IV or tag
  fails; a `_PREVIOUS` key still decrypts; `needsReencrypt`), `config`
  (the six required variables; the key variables never null it),
  `signature`, `redact`, `graph`, `seal` (wrong context: another agentId or
  another sha256), `marks`, `tokens` (only a blob reaches `wa_store_token`;
  a blob stored for agent A fails as `whatsapp:<agentB>`; `TokenKeyError` →
  `wa_token_undecryptable`, treated as revoked), `payload` (every fixture
  parses), `match`,
  `process` (including the WABA-id route, no-plaintext search, empty CRM,
  paused agent), `relink`, `retention`, `sweep`, the webhook route, the cron
  route (401 without a header, with a wrong one, or with `CRON_SECRET`
  unset / 400 / schedule header), `whatsapp-connect` (ownership,
  takeover, second number, rollout, history failure, no `/register`, no
  secrets logged), `whatsapp` actions (link, keep, ignore, load, send),
  `clients` action hooks, `notifications` hrefs, `routes` (`/whatsapp`
  guarded).
- **Database**: the Step 4.2 rehearsal prints only `ok` lines; the Step 4.3
  checks pass.
- **Suite**: `npm run typecheck && npm run lint && npm test && npm run build`.
- **Production, founder's number, `WHATSAPP_ROLLOUT=admin`** (Step 5.8 plus):
  1. After a fresh onboarding, the panel shows "Connected" and history
     reaches "done".
  2. "Prueba Uno" (with and without country code, buyer and seller) shows the
     chat on both records.
  3. A family chat appears only as a pending row with no readable text;
     after "Ignore" the DB has no contact or messages for it and one
     `ignored` mark.
  4. A message typed on the phone appears on the card within a minute and
     plan 016's last contact moves; `updated_at` does not.
  5. Receive a message → it appears; last contact doesn't move.
  6. Re-link WhatsApp Web and send from it → record whether it appears.
  7. Phase 6: reply from LeadWing inside the window; delivered/read arrive.
  8. Disconnect in the app → bell row within minutes; panel shows
     "Disconnected"; reconnect works and doesn't duplicate messages.
  9. "Delete WhatsApp data" → no `wa_*` rows (`wa_connection_secrets`
     included) remain for the founder.
  10. As a second test account (Free): the panel shows the locked row; no
      `wa_*` rows are readable.
  11. Cron requests with user agent `vercel-cron/1.0` answer 200 (with
      016's `pg_cron` fallback active: both `leadwing-whatsapp-*` jobs
      answer 200 in `net._http_response`).
  12. `wa_webhook_inbox` has no dropped rows.
- **Logs**: Vercel runtime logs for `/api/whatsapp/webhook` and
  `/api/cron/whatsapp` contain no phone numbers, names, message text, tokens
  or Graph URLs.

## Done criteria

- An agent on Pro with WhatsApp Business can connect, see client chats on
  client cards (with up to 180 days of history for clients already in
  LeadWing), sort, keep or ignore unmatched contacts, and (Phase 6) reply
  inside the window.
- Non-client content is stored only sealed, for at most 14 days per message;
  pending contacts are gone 14 days after their last message; ignored
  numbers exist only as HMACs; the webhook inbox stores payloads sealed;
  group chats and media bytes are never stored.
- Outbound WhatsApp messages of linked clients reach plan 016's contact log
  (one row per hour at most) and the quiet nudge clears; `updated_at` doesn't
  move on those writes.
- A client added or re-numbered later is linked; a deleted client's contact
  goes back to pending and is resealed.
- An agent who drops to Free is paused at once and deleted after 30 days.
- Webhook forgery, duplicates, offboarding by WABA id and cross-agent reads
  are covered by tests.
- Tokens exist only as the `token_blob` text in `wa_connection_secrets`
  (shared `token-crypto.ts`, `INTEGRATION_TOKEN_KEY`, D9/D-A); no plaintext
  token in any table, log or env var. No `WHATSAPP_SPIKE_TOKEN` and no admin
  send/template forms exist (D16). If the founder picked D16's alternative,
  `WHATSAPP_SPIKE_TOKEN` is removed from Vercel and `.env.example` once App
  Review passes, so no plaintext token env var remains, and the admin forms
  are removed (or kept behind admin plus a flag).
- Legal, SEO, landing and `llms.txt` copy describe receiving on the same
  deploy that sets `WHATSAPP_ROLLOUT=pro` (8a), and replying only with
  Phase 6 (8b).
- CI passes; the migration is applied live with its history row.
- `plans/README.md` row 017 is marked DONE (or the phase reached).

## STOP conditions

- The interview gate fails (D1): stop after Phase 1 and mark the row
  REJECTED. Fewer than 8 solo agents by 9 Oct: report, don't lower the bar.
- The founder has no autónomo or company registration (Step 0.1).
- Meta rejects business verification or App Review twice, or asks for
  permissions beyond the two named: report; don't widen the request.
- The spike shows the coexistence screen isn't offered for a Spanish (+34)
  Business-app number, or history/echoes don't arrive: report before
  Phase 4.
- The spike shows a WABA without a payment method can't receive: report
  (it changes the onboarding copy and possibly D2).
- The spike shows offboarding events carry neither
  `metadata.phone_number_id` nor the WABA id in `entry[].id`.
- Anything needs `agent_id` from a payload field other than
  `metadata.phone_number_id` or `entry[].id`.
- Step 4.0: plan 016 Phase 1 isn't live (hard dependency, D15); the quiet rule
  still filters only on `updated_at`; `clients_touch_updated_at` isn't live
  or you can't read its skip array (D-E); any `wa_*` object or a WhatsApp history row
  already exists; the server is below 15; the project is on Supabase Free and
  the founder hasn't decided.
- `token-crypto.ts` already exists with a blob format or key names other than
  plan 013 Step 2.2's, or `INTEGRATION_TOKEN_KEY` already exists (from plan
  007 or 013) with a different version scheme. Don't overwrite either, and
  don't add a second module or key; report.
- The rehearsal prints any `FAIL` line, or the live apply hits a lock
  timeout twice.
- A migration timestamp would collide with a file, a live history version or
  another plan's timestamp.
- Any test or check shows another agent's WhatsApp data, plaintext content
  for a pending contact (in `wa_messages` or the inbox), or a token, secret or
  Graph URL in a log or an RLS-readable row: stop at once.
- Any inbox row is dropped during the founder's checks (Step 5.8), or a
  history chunk needs more than 300 s to process, or the database grows by
  more than 100 MB during one import: report before tuning.
- Cron calls get 401, 403 or a redirect (Step 4.7).
- Plan 014's lead inbox has shipped before Step 5.3.
- Taking over an offboarded number, or a second number for one agent, behaves
  in a way Step 4.8 doesn't cover.
- Meta's terms page or the Tech Provider programme changes in a way that
  forbids this use.

## Maintenance notes

- **Every 3 months** (Meta prices change on 1 Jan/Apr/Jul/Oct): re-check the
  pricing page and rate card; update the composer note and this file's cost
  table.
- **Graph API version**: bump `WHATSAPP_GRAPH_VERSION` before Meta retires
  it (and redeploy, since the connect page receives it at render); run the
  spike checklist against the founder's number after each bump.
- **Webhook shapes**: when Meta adds fields (BSUID fields, edits, revokes),
  capture a `WA_SHAPE` line first, add a fixture, then the schema.
- **New client phone paths** (plan 012 import, plan 014 leads, lead paste):
  numbers should be stored with a country code; after bulk changes call
  `relinkPendingContacts`; any new client delete path calls
  `releaseContact` (the daily safety net catches misses).
- **New table**: add it to plan 011's export.
- **The `clients` updated_at skip list** is shared with plans 015 and 016:
  keep one function and one list. A later plan that adds a bookkeeping column
  to `clients` reads the live function first and merges its column into the
  array, never overwriting it (D-E).
- **New `client_contacts` source**: widen the check in a new migration and
  add it to 016's `CONTACT_SOURCES` and labels (016's maintenance note).
- **Plan 016 Phase 1 is a hard dependency** (D15): this plan never lands
  before it and never creates `clients_touch_updated_at`. Any later 016
  migration that rewrites the `client_contacts` source check must keep
  `whatsapp_phone` and `whatsapp_api`.
- **New cron route or schedule**: if plan 016's `pg_cron` fallback is
  active (016 Step 21b's check), add a `cron.schedule` migration with 016
  Step 21b's recipe (one job per route/schedule pair, every header the
  route needs, `x-vercel-cron-schedule` included) instead of a
  `vercel.json` entry (Step 4.7).
- **Plan 015 B1/B2**: D13's agency match and registration attachments are
  follow-up migrations.
- **Account deletion runbook**: deleting the auth user cascades to all
  `wa_*` rows, `wa_connection_secrets` included (the only copy of the
  token; there is no Vault entry or purge trigger); call
  `DELETE /<waba_id>/subscribed_apps` first if the token still works.
- **Key rotation** (`INTEGRATION_TOKEN_KEY`): follow plan 013's shared
  runbook ("Key rotation" in its Maintenance notes; one for 007, 013 and
  017) exactly. The new key is created with Step 2.1's key custody steps.
  Re-encryption runs only inside a deployed server-side job (for example a
  one-off route behind `authorizeCron`), which reads both keys from its own
  Vercel environment (`INTEGRATION_TOKEN_KEY` and the `_PREVIOUS` pair);
  never a local script holding keys, never `vercel env pull`, and never a
  key in `.env.local` or the scratchpad (D-I). For this plan, that job
  re-encrypts `wa_connection_secrets` rows where `needsReencrypt(token_blob)`
  is true (`decryptSecret`, then `encryptSecret` with the current key and
  the same `whatsapp:<agentId>` context, then `wa_store_token`, which sets
  `rotated_at`) and re-seals `wa_messages` bodies (`whatsapp-body:<agentId>`)
  and inbox payloads (`whatsapp-payload:<sha256>`) where `needsReencrypt` is
  true. Check with a `SUPABASE_DB_URL` query that no blob keeps the old
  version prefix, then remove the job and the `_PREVIOUS` pair and
  redeploy.
  `WHATSAPP_NUMBER_HMAC_KEY` is never rotated: the number HMACs can't be
  recomputed (the numbers aren't stored), so a new key would forget ignored
  and digested numbers. If it ever must change, tell agents in the panel.
- **Log hygiene**: never log payloads, tokens, Graph URLs or Graph response
  bodies.
- 17 Sep 2026: aligned token storage (D9), cron auth (401) and score letters
  with plans 013–016.
- 17 Sep 2026 (second pass): applied shared decisions D-A…D-I from the plan
  batch alignment.
- 17 Sep 2026 (third pass): key custody (0600 scratchpad file →
  `vercel env add --sensitive` → password manager → `rm -P`; rotation only in
  a deployed job, per plan 013's runbook); `pg_cron`-fallback check before
  any cron route, with a `cron.schedule` recipe for `*/5 * * * *` and
  `15 3 * * *`; D15 made a hard dependency on 016 Phase 1 (no self-created
  `clients_touch_updated_at`); D-F amended for every time-based row
  (digest, "deleted in 7 days", `wa-idle`, `wa-history-late`);
  `token-crypto.ts` limited to `encryptSecret`/`decryptSecret`/
  `needsReencrypt`, payloads sealed as UTF-8 text (no gzip, no byte
  helpers).

### Reviewer notes (16 Sep 2026 revision)

- **Plan 016 exists now.** The review found no 013–016 files; they were
  written the same evening (016's file time 20:36, untracked). So the owner
  of `last_contacted_at`, the trigger, the quiet rule, `CRON_SECRET` and the
  producers is named (016) rather than moved into this plan. This plan
  can't simply create `last_contacted_at` itself: 016 caches it as
  `max(client_contacts.occurred_at)` and its trigger would overwrite any
  direct write. (The D15 fallback that kept this plan buildable without
  016 was dropped on 17 Sep 2026, third pass: 016 Phase 1 is now a hard
  dependency.)
- **Quiet-rule gate wording.** The review asked for
  `greatest(last_contacted_at, updated_at)`. Plan 016 reads
  `coalesce(last_contacted_at, created_at)` and drops `updated_at` on
  purpose, so the gate accepts either form as long as the rule reads the
  contact column (Step 4.0.2), and the rehearsal checks 016's predicate.
- **Cron path.** A second schedule on 016's `/api/cron/notifications` was
  suggested. That route walks every profile on each call, so this plan keeps
  `/api/cron/whatsapp` and reuses the shared auth helper (D-C) and 016's
  producer model (the digest moves into `generate.ts` when 016 Phase 2
  lands; D-F).
- **No generated column.** The `phone_digits` STORED column was replaced by
  an immutable function plus an expression index: it avoids rewriting
  `clients` under an exclusive lock, which also shrinks the lock issue.
  `wa_phone_digits` stays executable by `authenticated`, because an agent's
  own client insert evaluates the index expression.
- **Base64 text, not `bytea`**, for sealed content (the minor's own
  alternative).
- **D16 (App Review with Meta's tools)** removes `WHATSAPP_SPIKE_TOKEN` and
  the admin forms instead of adding a removal step.
- **Per-message expiry** replaced the contact-level `pending_until`; the
  pending contact row itself goes 14 days after its last message (D4,
  option (a) of the metadata-retention issue).

## Sources (checked 2026-09-16 unless marked)

Meta / WhatsApp:
- Embedded Signup overview ("Embedded signup v2 will be deprecated on
  October 15, 2026"; onboarding limits 10 → 200 per rolling 7 days; business
  customers sign in with Facebook or Meta Business credentials and select or
  create a business portfolio; "Your onboarded business customers must add a
  payment method to their WhatsApp Business account"):
  https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/overview/
- Onboarding WhatsApp Business app users (coexistence: app 2.24.17+, 180
  days of history, no groups, request within 24 h via `smb_app_data` or
  offboard and redo, skip phone registration, broadcast lists read-only and
  no new ones, disappearing/view-once/live location disabled in 1:1 chats,
  all companions unlinked at onboarding, all companions supported except
  WhatsApp for Windows and WearOS, messages from unsupported companions
  trigger no webhooks, `PRIMARY_INACTIVITY` after about 14 days, app
  messages stay free):
  https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users
- Legacy coexistence page (webhooks, offboarding reasons, 20 msg/s; not
  re-checked in this revision):
  https://developers.facebook.com/docs/whatsapp/embedded-signup/custom-flows/onboarding-business-app-users
- `account_update` webhook reference (`PARTNER_REMOVED` payloads carry
  `entry.id` = WABA id, `waba_info`, `disconnection_info`; no
  `metadata.phone_number_id` shown; events include `ACCOUNT_OFFBOARDED` and
  `ACCOUNT_RECONNECTED`):
  https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/account_update
- Embedded Signup implementation v4 (`FB.login` options, `WA_EMBEDDED_SIGNUP`
  events incl. `FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING`, 30 s code TTL,
  Graph `v25.0` in samples, allowed domains):
  https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/implementation
  (the code-exchange endpoint is not on this page: **unverified**, confirm in
  Phase 2).
- `featureType: "whatsapp_business_app_onboarding"`: third-party only,
  **unverified**: https://www.unifyport.ai/blog/whatsapp-embedded-signup-v4-coexistence-migration/
- Tech Provider steps (business verification before App Review; the app
  needs an icon, privacy policy and category; App Review recordings may use
  the API Setup cURL script and WhatsApp Manager instead of your own app):
  https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/get-started-for-tech-providers
- App Review (two recordings, avoid unneeded permissions):
  https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/app-review
  and https://www.twilio.com/docs/whatsapp/isv/tech-provider-program/integration-guide
- BSUIDs (webhooks since April 2026, sending since July 2026, format,
  `user_id`/`from_user_id`/`from_parent_user_id`, mandatory for partners):
  https://developers.facebook.com/documentation/business-messaging/whatsapp/business-scoped-user-ids/
- Pricing (as fetched: "All non-template messages are free" inside an open
  customer service window; the 1 Oct 2026 section lists market rate changes
  only; no 1,000-message allowance anywhere on the page):
  https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
- Data privacy (Meta as processor, 30-day retention) and Local Storage:
  https://developers.facebook.com/documentation/business-messaging/whatsapp/data-privacy-and-security/
  and https://developers.facebook.com/documentation/business-messaging/whatsapp/local-storage
- Webhooks (verification GET, `X-Hub-Signature-256`, batches, 3 MB, retries
  up to 7 days for WhatsApp): https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview
  and https://developers.facebook.com/docs/graph-api/webhooks/getting-started
  (the 3-second timeout is third-party only: **unverified**).
- WhatsApp Business Solution Terms (updated 6 Mar 2026; no training on
  Business Solution Data): https://www.whatsapp.com/legal/business-solution-terms
- WhatsApp EEA Terms (effective 17 Aug 2026):
  https://www.whatsapp.com/legal/terms-of-service-eea

Partners and third parties:
- 360dialog coexistence (13-day keep-alive advice; companion support
  contradicting Meta: **unverified**): https://docs.360dialog.com/partner/onboarding/whatsapp-coexistence
- 360dialog coexistence webhooks (history/echo/state-sync payloads; secondary
  source): https://docs.360dialog.com/partner/onboarding/whatsapp-coexistence/coexistence-webhooks
- 360dialog partner pricing (Starter €250 with 5 channels + €49 each;
  Growth €500 with 10 + €25 each; Premium €1,000 with 20 + €15 each):
  https://docs.360dialog.com/partner/get-started/pricing
- EU/UK coexistence availability (partner source, **unverified** on Meta):
  https://chakrahq.com/article/whatsapp-coexistence-live-eu-uk-europe-whatsapp-business-for-api-live/
- In-window billing from 1 Oct 2026 (Zendesk, "Announced on August 10,
  2026"; non-template replies and in-window utility templates become
  billable; no free allowance mentioned):
  https://support.zendesk.com/hc/en-us/articles/11113277351322
- The 1,000-free-per-number figure (resellers only, **unverified** on Meta):
  https://sendpulse.com/blog/whatsapp-service-message-pricing ,
  https://chakrahq.com/article/whatsapp-api-pricing-update-service-messages-october-2026/
- Spain rates (**unverified**, third-party): https://whautomate.com/whatsapp-business-api-pricing-spain ,
  https://blueticks.co/blog/whatsapp-business-pricing-europe-2026
- Meta business verification documents (secondary, **unverified**):
  https://respond.io/help/whatsapp/meta-business-verification ,
  https://docs.360dialog.com/docs/resources/meta-business-verification
- Twilio and coexistence (competitor blogs, **unverified**):
  https://chakrahq.com/article/whatsapp-coexistence-chakra-twilio-migrate-change ,
  https://chatarmin.com/en/blog/twilio-whats-app-api
- Baileys QR pairing issue #2737 (opened 30 Jul 2026, open):
  https://github.com/WhiskeySockets/Baileys/issues/2737
- Rival WhatsApp set-ups (HubSpot, Pipedrive, Clientify, Mobilia, Inmovilla)
  and unofficial provider prices: memory note of 16 Sep 2026, **not
  re-checked**.

Platform:
- Vercel Cron Jobs (a GET to the production deployment URL, e.g.
  `https://*.vercel.app/api/cron`; user agent `vercel-cron/1.0`;
  `x-vercel-cron-schedule`; UTC; page last updated 11 Aug 2026):
  https://vercel.com/docs/cron-jobs . Whether Vercel Authentication lets
  cron calls through is not stated there (**unverified**).
- Vercel cron limits (Pro: 100 jobs, per-minute):
  https://vercel.com/docs/cron-jobs/usage-and-pricing
- Vercel "Managing Cron Jobs" (`CRON_SECRET` as `Authorization: Bearer`, no
  retries, best-effort and possibly duplicate delivery, redirects not
  followed; last updated 11 Aug 2026):
  https://vercel.com/docs/cron-jobs/manage-cron-jobs
- Vercel function limits (4.5 MB bodies, 300 s default, 800 s max):
  https://vercel.com/docs/functions/limitations
- Vercel Fluid compute pricing (Active CPU paused during I/O, Provisioned
  Memory billed through I/O; fra1 $0.184/CPU-hour, $0.0152/GB-hour; $0.60
  per million invocations; last updated 16 Jun 2026):
  https://vercel.com/docs/functions/usage-and-pricing
- Vercel runtime logs (256 KB per line, 1 MB and 256 lines per request; Pro
  keeps 1 day; last updated 28 Aug 2026): https://vercel.com/docs/logs/runtime
- Supabase Vault, D9's rejected alternative (no documented role privileges
  or plan availability; the live probe above showed `postgres` can read
  `vault.decrypted_secrets`); no integration token in this plan depends on
  it. The one exception in the batch (D-B) is plan 016 Step 21b's optional
  `pg_cron` + `pg_net` fallback, which stores `CRON_SECRET` in Vault because
  `pg_net` needs it inside the database; it is used only if Vercel Cron
  can't be, `CRON_SECRET` only triggers idempotent scheduled jobs and grants
  no data access, and `CRON_SECRET` is rotated after any exposure of
  `SUPABASE_DB_URL`:
  https://supabase.com/docs/guides/database/vault
- Token storage follows plan 013 D9 and Step 2.2 (`token-crypto.ts`,
  AES-256-GCM via Node's `crypto`): https://nodejs.org/api/crypto.html
- OpenRouter ZDR endpoints (`openai/gpt-4o-mini`: only `azure` and
  `azure/swedencentral`): https://openrouter.ai/api/v1/endpoints/zdr ; ZDR
  guide ("Removes first-party OpenAI endpoints (Azure remains available)";
  per-request `provider.zdr`): https://openrouter.ai/docs/guides/features/zdr ;
  provider routing: https://openrouter.ai/docs/features/provider-routing
- Next.js 16 docs in `node_modules/next/dist/docs/` (paths in Current state
  17–18).

## Spike findings

(Empty until Phase 2 runs. Record the Step 2.5 answers here, one numbered
item each, with the date.)
