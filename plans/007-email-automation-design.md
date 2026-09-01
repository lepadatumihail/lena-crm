# Design: Email follow-up automation (v2)

> **Status: design spike (plan 007).** This document is a specification and a
> go/no-go recommendation. No source code, schema, migration, dependency, or
> `.env.example` was changed in producing it. Every claim about the current
> system cites `file:line`; every recommendation names its runner-up and why it
> lost. The eventual build is split into future plans (see
> [Recommendation](#recommendation--build-estimate)).
>
> **Deliverable-path note.** The plan body (`plans/007-spike-email-automation.md:48`)
> names `docs/design/email-automation.md`; the spike's orchestrator overrode
> this to `plans/007-email-automation-design.md`. This file honours the
> orchestrator path. A future build plan that wants the doc under `docs/design/`
> can `git mv` it — no content depends on the location.

---

## 1. Context

### What the maintainer said

`README.md:73-77` ("Deferred" section):

> Email follow-up automation (send-as-agent via Gmail API / Microsoft Graph with a
> Resend fallback) is designed into the schema (`email_accounts`,
> `email_templates`, `scheduled_emails`) but not built in v1.

### What already exists (verified at the current working tree)

The schema is **live in the init migration**, not aspirational:

- **`email_accounts`** (`supabase/migrations/20260529120000_init.sql:188-198`):
  `provider public.email_provider not null` (enum `google|microsoft|resend`,
  `init.sql:14`), `from_address text not null`, `reply_to text`,
  `token_ref text` with the comment `-- reference to an encrypted secret in
  Supabase Vault` (`init.sql:194`), `status public.email_account_status not
  null default 'connected'` (enum `connected|disconnected|error`, `init.sql:15`).
- **`email_templates`** (`init.sql:204-212`): `name`, `subject`, `body`.
  **This table is already in active use as the messaging template store** — not
  dormant. `getTemplates()` reads it (`src/lib/data/templates.ts:5-13`),
  `saveTemplate`/`deleteTemplate` write it (`src/lib/actions/templates.ts:13-60`),
  and the client-detail composer consumes the rows as `customTemplates`
  (`src/components/clients/message-composer.tsx:51-67`, fed from
  `src/app/(app)/clients/[id]/page.tsx:96,228`). **Any v2 change to this table
  is a change to a live messaging surface** — treat it as shared, per
  `plans/007-spike-email-automation.md:100`.
- **`scheduled_emails`** (`init.sql:218-230`): `client_id` (cascade FK),
  `template_id` (set-null FK), `email_account_id` (set-null FK),
  `send_at timestamptz not null`, `status public.scheduled_email_status not null
  default 'pending'` (enum `pending|sent|failed|cancelled`, `init.sql:16`),
  `sent_at timestamptz`, `error text`. Crucially it has a **due-scan index**:
  `scheduled_emails_due_idx (status, send_at)` (`init.sql:232`).
- **RLS**: `agent_id = (select auth.uid())` for-all on all three tables
  (`init.sql:286-299`). The `agent_id` defaults to `auth.uid()` on insert
  (`init.sql:190,206,220`).

What is **not** built (verified — `grep -rn "scheduled_emails\|email_accounts"
src/ supabase/` returns only the migration and the generated
`src/lib/supabase/types.ts:319-393`):

- **No send pipeline.** No route handler, no edge function, no cron. The only
  route handlers in the app are `src/app/auth/callback/route.ts` and the
  calendar feed (`src/app/api/calendar/[token]/route.ts`). There is **no
  `vercel.json`** and **no `supabase/functions/` directory**.
- **No provider integration.** `package.json` has **no** `googleapis`,
  `google-auth-library`, `@microsoft/*`, `resend`, or `nodemailer` dependency.
  Installing any of these is a **build action and out of scope for this spike**
  (`plans/007-spike-email-automation.md:95`).
- **No background scheduler of any kind.** The only "sync loop" in the app is
  **client-side and lazy**: `NotificationsBell` calls `loadNotifications` on
  mount and every 5 minutes *while the bell is mounted in the browser*
  (`src/components/notifications/notifications-bell.tsx:89-98`). Nothing runs
  when the agent's tab is closed. This is the single most important constraint
  for the architecture decision (Section 2).

### Email "sending" today

The composer's email channel is a **`mailto:` link** — the agent's own mail
client opens with subject + body prefilled, and the app sends nothing
(`src/components/clients/message-composer.tsx:151-154`). WhatsApp is the same
fire-and-forget pattern (`:149`). So today the app can know "the agent launched
a message", never "an email was delivered".

### Adjacent capability the design should reuse

- **AI drafting already produces email-shaped output.** `draftMessage`
  (`src/lib/actions/messages.ts:9-138`) returns `{subject, body}` and, for the
  email channel, is prompted for "a short subject line and 2 to 4 sentences"
  (`messages.ts:101`). This is the natural authoring path for a scheduled send —
  the compose-to-schedule flow does not need new AI plumbing.
- **There is a working precedent for "service-role + token-auth + scan a
  tenant's rows from an unauthenticated context"**: the calendar feed route uses
  `createAdminClient()` and scopes **every** query by `.eq("agent_id", agentId)`
  itself (`src/app/api/calendar/[token]/route.ts:21,49,55`). The admin client's
  documented contract is exactly this: "Use ONLY in trusted server contexts that
  scope every query by agent_id themselves" (`src/lib/supabase/admin.ts:6-10`).
  The send loop is the same shape and should follow the same discipline.

### Cross-spike compatibility (007 ↔ 009)

`plans/README.md:30` and `plans/009-spike-outreach-tracking.md` require that **a
real email send is a contact event**. Spike 009 designs outreach tracking
(`last_contacted_at` column vs a `contact_log` table) and explicitly says
(`009:Maintenance notes`): *"Plan 007's email automation, if built, must write
the same touch signal on successful send."* This document specifies the exact
integration point in Section 4 so the two builds stay compatible regardless of
which lands first.

---

## 2. Decision — send-pipeline architecture (the core fork)

**Constraints that drive this:** one solo-agent tenant per account; **tens of
emails/day per agent at most**; the app is Next.js on Vercel (`.gitignore:42-43`
tracks `.vercel`) + Supabase Postgres 17 with the Edge runtime enabled
(`supabase/config.toml:36,369-378`); a single maintainer who works in a
Next-centric repo and has **never deployed an edge function or a cron** (none
exist). Latency is irrelevant — a follow-up that goes out 3 minutes late is
fine; a follow-up that goes out **twice** is a real embarrassment to the agent.

### Option A — Vercel Cron → Next route handler (RECOMMENDED)

A `GET /api/cron/send-scheduled-emails` route handler, triggered by Vercel Cron
(declared in a new `vercel.json`), authenticated by a shared `CRON_SECRET`
bearer header (Vercel's documented pattern — no `CRON_SECRET` exists today;
verified by grep). The handler:

1. Uses `createAdminClient()` (`src/lib/supabase/admin.ts:11-17`) — the cron has
   no user session, so it must bypass RLS and scope by `agent_id` itself, exactly
   like the calendar feed does (`route.ts:49`).
2. Scans due rows via the **existing** index:
   `from("scheduled_emails").select(...).eq("status","pending").lte("send_at", now)`
   hits `scheduled_emails_due_idx (status, send_at)` (`init.sql:232`) directly.
3. Claims each row idempotently (see *Idempotent claiming* below), sends via the
   provider adapter, then transitions to `sent` (set `sent_at`) or `failed` (set
   `error`).

**Why it wins:** it lives entirely in the runtime the maintainer already ships
(TypeScript, Next route handlers, the existing admin client, the existing
provider-SDK story all in one repo + one deploy). It reuses a pattern already
proven in this codebase (token/secret-authed handler + admin client scoping by
`agent_id`). Provider SDKs (`googleapis`, `resend`) are npm packages that belong
in the Next runtime anyway. Operational surface added: one route + one
`vercel.json` cron entry + one env var.

**Costs / caveats:** Vercel Cron minimum granularity on the Hobby plan is **once
per day**; sub-daily (e.g. every 5–15 min) needs Pro, **or** an external pinger
(cron-job.org / GitHub Actions) hitting the same secured route. With a daily
cron, `send_at` is effectively "send on/after this date", not "at this minute" —
acceptable for follow-ups, but the UI must not promise minute precision (Section
4). OAuth refresh tokens live in env/Vault and are read by Vercel's runtime
(addressed in Section 3). **Flag:** confirm the maintainer's Vercel plan — it
decides cron granularity and whether an external pinger is needed (Open
question 1).

### Option B — Supabase `pg_cron` → Edge Function

`pg_cron` schedules a call to a Deno Edge Function (the runtime is enabled,
`config.toml:369`) that runs the same scan-claim-send loop inside Supabase.

**Why it loses:** it introduces a **second runtime (Deno), a second deploy
surface (`supabase functions deploy`), and a second secrets store** to a repo
that currently has zero edge functions and zero functions directory. The
provider SDKs would need Deno-compatible imports. The maintainer has never
operated this surface. The *only* genuine advantage — "tokens never leave
Supabase" — is real but modest: in Option A the token is fetched from Vault into
a short-lived server process and used immediately; it is not persisted or
shipped to the browser. The marginal security gain does not justify doubling the
operational footprint for a solo developer.

**When B would win:** if email volume grew to the point that a long-running,
queue-backed worker mattered, or if a compliance requirement demanded secrets
never transit the Vercel runtime. Neither holds for "tens of emails/day, one
developer".

### Idempotent claiming — the critical detail

The natural lock is a **conditional status transition** used as a compare-and-set:

```
update scheduled_emails
  set status = 'sending'
  where id = $1 and status = 'pending'
  returning *;
```

If the update returns the row, this worker owns it; if it returns zero rows,
another concurrent run already claimed it — skip. This is robust against
overlapping cron invocations (which Vercel can produce if a run overruns).

**Schema flag (migration required):** `'sending'` is **not** a value of
`scheduled_email_status` — the enum is `pending|sent|failed|cancelled`
(`init.sql:16`). Using a transient claim state needs `ALTER TYPE ... ADD VALUE
'sending'`. See Section 5; this is listed as a required migration.

**Alternative claim mechanism that avoids the enum change** (runner-up): claim
with a nullable `claimed_at timestamptz` column instead of a new enum value —
`update ... set claimed_at = now() where id=$1 and status='pending' and
claimed_at is null returning *`, and treat a stale `claimed_at` (older than, say,
10 min, with status still `pending`) as reclaimable after a crash. This trades
one enum addition for one column addition; the enum value is cleaner to read in
the UI and reuses the existing `status` filter on the due index, so **`'sending'`
is recommended**, but either is defensible (Open question 2).

### At-most-once vs at-least-once

**Recommendation: at-most-once, biased to never double-send.** For a real-estate
agent, a duplicate follow-up to a client looks careless and damages trust; a send
that silently failed can be retried *manually* by the agent (the failure is
surfaced — see observability). Concretely: claim → send → **on a provider
success response, mark `sent`**; **if the provider call throws or times out
ambiguously, mark `failed` with the error text and do NOT auto-retry that row.**
An ambiguous timeout *might* have sent; auto-retrying it is the one path that
produces a duplicate, so we don't. The agent decides whether to re-send from the
failure surface. This is the conservative choice the plan asks us to argue for
(`plans/007-spike-email-automation.md:61`).

**Runner-up (at-least-once with idempotency keys):** pass a provider-side
idempotency key (Resend supports an `Idempotency-Key`; Gmail does not natively)
so retries are safe. Rejected for v1 because it only half-works across providers
and adds complexity for a volume that doesn't need it.

### Retry policy for `failed`

**v1: no automatic retry.** A `failed` row stays `failed`; the agent sees it
(below) and can re-schedule/re-send manually. This keeps the at-most-once
guarantee airtight and the loop trivial. A bounded auto-retry (e.g. `attempts`
column, max 3, exponential backoff, only for *transient* errors like HTTP 429/503)
is a clean v2-of-v2 addition but needs an `attempts` column and careful
classification of "transient vs permanent" errors — deferred (Open question 3).

### Observability — where `error` goes and how the agent sees failures

- The provider error string is written to `scheduled_emails.error`
  (`init.sql:227`) on the failing row, plus a `console.error` in the route for
  Vercel logs (server-side only — note finding **F7** in `plans/README.md:36`:
  raw provider/Supabase error strings should not be echoed verbatim to the UI;
  show the agent a friendly "Couldn't send — try again", keep the raw `error`
  for the logs/diagnostics).
- **In-app:** a send failure must raise an attention signal. The notification
  feed is the right surface, and **plan 002's shared attention module
  (`src/lib/data/attention.ts`) is where it belongs** (per
  `plans/007-spike-email-automation.md:101`). Add a `failedEmails` signal to
  `getAttentionSignals(...)` (`attention.ts:77-164`) that selects
  `scheduled_emails where status='failed'`, and have `syncNotifications`
  (`src/lib/actions/notifications.ts:236-271`) emit a notification row of a new
  `email_failed` type (Section 4 + Section 5 flag the enum addition).

---

## 3. Decision — provider scope for v1 of the feature

The README names Gmail / Microsoft Graph (send-as-agent) with a Resend fallback.
These differ enormously in *who has to do verification work*.

### Recommendation: **Resend-only for v1**, from a shared app domain, `reply_to` = the agent.

- One API key (`RESEND_API_KEY` — the slot already exists, commented, in
  `.env.example` under "Deferred (email automation)"). No per-agent OAuth, no
  token refresh, no consent screen.
- Emails go **from a single app-owned, domain-verified address** (e.g.
  `follow-ups@mail.lena.app`) with **`reply_to` set to the agent's own address**
  so client replies land in the agent's inbox. This is honest and functional:
  the client sees "Lena on behalf of <agent>" semantics; replies work.
- **Maps cleanly onto `email_accounts` as it exists, with zero schema change:**
  - `provider = 'resend'` (enum value already exists, `init.sql:14`).
  - `from_address` = the shared app address (or, later, a verified custom domain).
  - `reply_to` = the agent's email.
  - `status` starts `connected`; flips to `error` if Resend reports the key/domain
    is bad.
  - `token_ref` = **null/unused for Resend** (the API key is a single app-level
    env var, not a per-agent secret). The Vault story (Section 3-token) only
    becomes load-bearing when OAuth providers land.

### Why Gmail / Microsoft Graph lose for v1

- **Gmail `gmail.send` is a restricted scope.** Sending email on a user's behalf
  requires Google's **OAuth verification / security assessment** for restricted
  scopes — weeks of review, a privacy policy, possibly a CASA third-party
  security audit, for a single-developer app. That is a launch blocker the spike
  must not pretend away (`plans/007-spike-email-automation.md:64`).
- **Microsoft Graph `Mail.Send`** is lighter than Google but still needs an Entra
  app registration, admin-consent handling for some tenants, and per-agent token
  storage + refresh.
- Both require the **token storage machinery** of Section 3 and a working
  per-agent OAuth callback. That is a lot of surface for v1.

The genuine downside of Resend-only — emails don't come *from* the agent's real
mailbox and aren't threaded in their Sent folder — is acceptable for *automated
follow-ups* (a distinct, lower-stakes channel from the agent's hand-written 1:1
mail, which still goes via `mailto:`). When an agent specifically wants
true send-as-self, that's the trigger to build the Google/Microsoft path as a
*later* plan, at which point `provider='google'|'microsoft'`, `token_ref`, and
the OAuth callback all activate. **No part of the existing schema needs to change
to start Resend-only** — the design deliberately uses dormant columns/enum values
rather than adding new ones (Open question 4 asks the maintainer to confirm
they're happy launching from a shared domain).

---

## 4 (token). Token storage

`token_ref` is commented "reference to an encrypted secret in Supabase Vault"
(`init.sql:194`). For the **recommended Resend-only v1, `token_ref` is unused**
(the API key is a single `RESEND_API_KEY` env var, not a per-agent secret) — so
Vault is not on the v1 critical path. The following specifies it for the *later*
OAuth providers, so the schema comment is honoured when the time comes.

### What Vault is, and the fit

Supabase Vault is an extension that stores secrets encrypted at rest in Postgres
and exposes them via a decrypting view (`vault.decrypted_secrets`); each secret
has a UUID. **What `token_ref` should contain: the Vault secret's UUID** (a
reference, exactly as the comment says), never the token itself. Read/write
discipline:

- **Who writes secrets:** a `"use server"` action invoked during the agent's
  OAuth-connect flow, running with the **service role** (admin client,
  `src/lib/supabase/admin.ts`) because writing to Vault and reading
  `vault.decrypted_secrets` are privileged operations. It stores the
  refresh/access token in Vault and writes the returned UUID to
  `email_accounts.token_ref` for that agent's row.
- **Who reads secrets:** **only the send loop** (the cron route), via the admin
  client, decrypting the secret by UUID immediately before a send and never
  persisting or returning it. The token never reaches the browser and never
  appears in any RLS-readable table (RLS tables expose only the *reference*).

### Flag — tier/availability is the one thing to confirm before relying on Vault

I did **not** make a live Vercel/Supabase API call to confirm Vault availability
on this project's specific plan (read-only spike; web research was permitted but
the recommendation does not hinge on it because v1 is Resend-only). Vault is a
documented Supabase capability, but **before the OAuth-provider build plan
starts, confirm Vault is enabled/available on the project's tier** (Open question
5). If Vault turns out to be unsuitable or unavailable:

- **Fallback:** store tokens in a dedicated, RLS-protected `email_secrets` table
  with the value encrypted application-side (e.g. AES-GCM with a key from a
  Vercel env var) — `token_ref` then holds that row's id. This **contradicts the
  `init.sql:194` comment** ("Supabase Vault"); the contradiction would need to be
  recorded in the build plan and the comment updated. Calling this out is
  explicitly required (`plans/007-spike-email-automation.md:69`).

Either way, **no schema change to `email_accounts` is needed for token storage**
— `token_ref text` is a provider-agnostic reference that works for a Vault UUID
or a fallback-table id.

---

## 4. Decision — UX surface

All placements map to existing components; nothing here invents a new page.

### 4.1 Schedule a send — extend the existing composer

The composer (`src/components/clients/message-composer.tsx`) already has the
exact authoring surface needed: channel toggle, template picker, AI draft, a
subject field shown only for email (`:286-296`), and a send footer (`:342-350`).
Add **one** affordance:

- When `channel === "email"` and the client has an email (`hasEmail`, `:71`),
  show a **"Schedule"** secondary button next to the existing "Open in email"
  button (`:346-349`). It opens a small inline date/time picker (the app already
  ships `react-day-picker`, used by the calendar dialogs) defaulting to a sensible
  follow-up offset (e.g. +3 days, 9:00 local).
- On confirm, call a new `"use server"` action
  `scheduleEmail({ clientId, subject, body, sendAt, templateId? })` that inserts
  into `scheduled_emails` (RLS sets `agent_id` from `auth.uid()`; `email_account_id`
  resolves to the agent's single connected account, or — for Resend-only v1 — a
  row created on first use). The action shape follows repo convention: auth gate +
  zod validation + ownership scoping + `revalidatePath` (the pattern hardened by
  plan 003; e.g. `src/lib/actions/templates.ts`).
- **The `mailto:` "Open in email" path stays** — scheduling is *additive*, a
  second button, not a replacement. The agent keeps the instant-send option.
- **Honesty about precision:** if v1 runs a daily Vercel cron (Section 2), the
  picker should let the agent pick a *date* (and optionally a coarse time) and
  the UI copy should say "sends on the morning of …", not promise a specific
  minute. Revisit if sub-daily cron is available (Open question 1).

### 4.2 Where scheduled / pending sends appear

- **Client detail page** (`src/app/(app)/clients/[id]/page.tsx`): add a small
  **"Scheduled emails"** card in the right-hand column near the Contact card
  (`:207-269`), listing this client's `pending` rows (subject + send date) each
  with a **Cancel** control. This is a focused query
  (`scheduled_emails where client_id=$1 and status='pending' order by send_at`)
  and a natural home — the agent is already here when composing.
- **Calendar** (`src/app/(app)/calendar`): out of scope for v1 to keep the cut
  small; a scheduled email is not an appointment. If wanted later, pending sends
  could appear as lightweight day markers, but that's a follow-on.

### 4.3 Cancellation

`scheduled_email_status` already has `cancelled` (`init.sql:16`) — no schema
change. Cancel = a `cancelExpectedEmail(id)` server action that does
`update scheduled_emails set status='cancelled' where id=$1 and status='pending'`
(the `status='pending'` guard means you cannot cancel one that's already mid-send
or sent — the same compare-and-set discipline as the claim). The send loop only
scans `status='pending'`, so a cancelled row is simply never picked up.

### 4.4 Failure surfacing (ties to plan 002's attention module)

On a `failed` send, the agent must find out **in-app**, not by checking logs:

- Add a `failedEmails` signal to `getAttentionSignals(...)`
  (`src/lib/data/attention.ts:77-164`) — selecting `scheduled_emails` where
  `status='failed'`, joined to the client name (the module already does this
  embed pattern for offers/reservations, `attention.ts:89-108`).
- `syncNotifications` (`src/lib/actions/notifications.ts:236-271`) emits a
  notification row with a **new `email_failed` type**, `client_id` set, deep-link
  to the client page. The `NotificationsBell` icon map
  (`src/components/notifications/notifications-bell.tsx:45-51`) and
  `NOTIFICATION_TYPE_LABELS` (`src/lib/calendar`) each need the new key added.
- **Migration flag:** `notification_type` is a fixed enum
  (`appointment_reminder|appointment_today|follow_up|reservation_date|stalled_offer`,
  `supabase/migrations/20260601130000_calendar_notifications.sql:13-19`). Adding
  `email_failed` is an `ALTER TYPE` migration (Section 5).

### 4.5 Successful send is a contact event (007 ↔ 009)

Per `plans/README.md:30` and `plans/009-spike-outreach-tracking.md`, a successful
send must record outreach. **Exact integration point:** in the send loop, in the
same step that sets `status='sent', sent_at=now()`, also write the touch that
spike 009 defines:

- If 009 lands as **`clients.last_contacted_at`** (its Option 1): the loop sets
  `clients.last_contacted_at = greatest(coalesce(last_contacted_at, …),
  sent_at)` for the row's `client_id`.
- If 009 lands as a **`contact_log` table** (its Option 2): the loop inserts a
  `contact_log` row `{ client_id, agent_id, channel:'email', note:'automated
  follow-up', created_at: sent_at }`.

This keeps 009's "quiet = no touch in 7 days" rule honest — an automated send
counts as contact and won't trigger a spurious follow-up nudge the next day.
**Both designs reference this same hook**, so whichever spike builds first, the
other slots in without rework. The send loop runs with the admin client and must
scope this write by `agent_id` itself, like every other admin-client write
(`src/lib/supabase/admin.ts:6-10`).

---

## 5. Migration needs (each flagged)

Listed for the **future build plan to execute** — this spike writes none of them.
Migrations follow the repo's `yyyyMMddHHmmss_name.sql` + RLS convention.

For the **recommended v1 (Resend-only, daily-or-pinged Vercel cron):**

1. **`ALTER TYPE public.scheduled_email_status ADD VALUE 'sending'`** — required
   *iff* the recommended enum-based claim lock (Section 2) is used. Avoidable by
   the `claimed_at`-column alternative (then the migration is instead `ALTER TABLE
   scheduled_emails ADD COLUMN claimed_at timestamptz`). One or the other; not both.
2. **`ALTER TYPE public.notification_type ADD VALUE 'email_failed'`** — required
   for the in-app failure surface (Section 4.4). Postgres `ALTER TYPE ... ADD
   VALUE` cannot run inside a transaction block with concurrent use of the type in
   the same statement; the build plan should run it as its own migration step.

**Not required for v1:** no change to `email_accounts`, `email_templates`,
`scheduled_emails` columns, RLS, or the `email_provider` enum. `provider='resend'`,
`status`, `from_address`, `reply_to`, `cancelled`, and `scheduled_emails_due_idx`
all exist and are used as-is.

**Deferred to the OAuth-provider build (later plan), if pursued:**

3. Possibly an `attempts integer` column on `scheduled_emails` for bounded
   auto-retry (Section 2, Open question 3). Not needed for the no-retry v1.
4. Token storage needs **no** `email_accounts` change (`token_ref` already fits a
   Vault UUID or fallback-table id); only the *fallback* path (if Vault is
   unusable) would add an `email_secrets` table — flagged in Section 3-token.

---

## 6. Open questions for the maintainer (each with a recommended answer)

1. **Vercel plan / cron granularity?** Hobby = daily cron only; sub-daily needs
   Pro or an external pinger (cron-job.org / GitHub Actions) hitting the secured
   route. *Recommendation:* start with whatever the current plan gives; design the
   UI to promise *date-level* precision so a daily cron is honest. Confirm the
   plan before the build plan estimates infra.
2. **Claim lock — `'sending'` enum value vs `claimed_at` column?**
   *Recommendation:* the `'sending'` enum value — it reads clearly in the UI and
   reuses the existing `(status, send_at)` due index. Either is correct.
3. **Auto-retry failed sends in v1?** *Recommendation:* **no.** No retry keeps the
   at-most-once guarantee airtight; the agent re-sends manually from the failure
   notification. Add bounded transient-only retry later if failures prove common.
4. **OK to launch sending from a shared app domain (`reply_to` = agent), not the
   agent's own mailbox?** *Recommendation:* **yes** for automated follow-ups — it
   avoids the Google restricted-scope verification gauntlet entirely. Build the
   true send-as-self (Gmail/Graph) path only when an agent explicitly needs it.
5. **Is Supabase Vault available on the project's tier (for the *later* OAuth
   path)?** *Recommendation:* confirm before the OAuth build; irrelevant to the
   Resend-only v1 since `token_ref` is unused there. Fallback is an encrypted
   `email_secrets` table (which would contradict the `init.sql:194` comment and
   require updating it).

---

## Recommendation — build estimate

### Verdict: **CONDITIONAL-GO.**

**Go** on building the feature, **conditioned on** (a) confirming the Vercel plan
/ cron granularity (Open question 1 — it changes the infra step and the UI's
precision promise), and (b) accepting the **Resend-only, shared-domain v1 cut**
(Open question 4). With those two answered, the design sits almost entirely on
the *existing* schema: the dormant tables and enum values were designed for this,
and the only DB changes for v1 are two `ALTER TYPE ... ADD VALUE` migrations
(claim state + failure notification). The runtime is the one the maintainer
already ships (Next route handler + the existing admin client + an existing
proven token-authed-handler pattern). The full Gmail/Microsoft "send-as-agent"
ambition is **deferred** — not rejected — because its OAuth-verification cost is
disproportionate to v1, and the schema already accommodates it later with no
rework.

**Why not an unconditional Go:** the cron-granularity question genuinely changes
the build (daily cron vs Pro/pinger) and the UX promise, so it should be settled
before estimating; and the shared-domain trade-off, while the right call, is a
product decision the maintainer should own.

**Why not No-Go / Defer-entirely:** this is the maintainer's own stated v2, the
schema is already paid for, and the recommended cut is small and low-risk. There
is no architectural blocker — only a plan-tier confirmation and a product
acceptance.

### Coarse build outline (future plans — this spike builds none of them)

- **Plan A — Send pipeline + Resend adapter (M).** Add `resend` dep; the
  `/api/cron/send-scheduled-emails` route + `vercel.json` cron + `CRON_SECRET`;
  scan-claim-send loop on the existing due index using the admin client; the
  `'sending'` enum migration; write `sent`/`failed`/`sent_at`/`error`. No UI.
  Verifiable with a manually-inserted `pending` row and a curl to the secured
  route.
- **Plan B — Compose-to-schedule UI + cancellation (S–M).** The "Schedule"
  button + date picker in the composer; `scheduleEmail` / `cancelExpectedEmail`
  server actions (plan-003-style contracts); the "Scheduled emails" card on the
  client detail page.
- **Plan C — Failure observability + contact-event hook (S).** The `email_failed`
  notification-type migration; `failedEmails` signal in
  `src/lib/data/attention.ts`; emit + render the notification; and the
  successful-send → outreach-touch write that keeps **007 compatible with 009**
  (Section 4.5). Should land *after* or *with* whichever of 009 defines the touch
  signal.
- **Plan D (deferred, optional) — Google/Microsoft send-as-agent (L).** OAuth
  callbacks, Vault (or fallback) token storage, per-provider send adapters,
  bounded retry. Only if an agent needs true send-from-own-mailbox; built on the
  already-present `provider`/`token_ref`/`status` columns with no further schema
  churn beyond an optional `attempts` column.

### Verification of spike constraints

- `git status` shows **no** changes to any source file, migration, dependency, or
  `.env.example`. The only spike output is this markdown design doc (plus the
  orchestrator's separate status-row update to `plans/README.md`).
- No STOP condition was triggered: no existing send-pipeline code was found
  (`grep` for `scheduled_emails`/`email_accounts` returns only the migration and
  generated types), and no build action (SDK install, OAuth registration) was
  performed — both were documented as future work instead.
