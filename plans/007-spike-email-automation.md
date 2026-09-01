# Plan 007 (design spike): Specify the deferred email follow-up automation (v2)

> **Executor instructions**: This is a **design spike, not a build plan**. The
> deliverable is a design document plus a go/no-go recommendation — you must
> not modify any source code, schema, or dependencies. Follow the steps, run
> the verification commands, and STOP where instructed. When done, update the
> status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 4286cc9..HEAD -- supabase/migrations/ src/lib/actions/templates.ts src/lib/data/templates.ts src/components/clients/message-composer.tsx README.md`
> Material drift in the schema or composer → compare excerpts before
> proceeding; on a mismatch, STOP and report.

## Status

- **Priority**: P3
- **Effort**: M (the spike; the build it specifies is L — estimate is coarse, as direction work is)
- **Risk**: LOW (no code changes)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `4286cc9`, 2026-06-12

## Why this matters

This is the maintainer's own stated v2. `README.md` ("Deferred" section): *"Email follow-up automation (send-as-agent via Gmail API / Microsoft Graph with a Resend fallback) is designed into the schema (`email_accounts`, `email_templates`, `scheduled_emails`) but not built in v1."* The schema already exists in production migrations; the templates UI already manages `email_templates`. What's missing is everything that makes scheduled email real: provider OAuth + token storage, a send loop with a scheduler, status/retry semantics, and the compose-to-schedule UI. Those have real architectural forks (where does the cron live? how are tokens stored?) that are much cheaper to decide on paper first.

## Current state (all verified at `4286cc9`)

- **Schema, live since the init migration** (`supabase/migrations/20260529120000_init.sql:184-235`):
  - `email_accounts`: `provider` enum (`google|microsoft|resend`), `from_address`, `reply_to`, `token_ref text -- reference to an encrypted secret in Supabase Vault`, `status` enum (`connected|disconnected|error`).
  - `email_templates`: `name`, `subject`, `body` — **already in active use**: `src/lib/data/templates.ts` reads it; `src/lib/actions/templates.ts` writes it; the Templates page + message composer consume them as message templates today (i.e. this table is shared between current messaging and future email).
  - `scheduled_emails`: `client_id`, `template_id` (set-null FK), `email_account_id` (set-null FK), `send_at timestamptz`, `status` enum (`pending|sent|failed|cancelled`), `sent_at`, `error`, and a due-scan index `scheduled_emails_due_idx (status, send_at)`. RLS `agent_id = auth.uid()` on all three (`init.sql:286-299`).
- **Email today**: the composer's email channel is a `mailto:` link (`src/components/clients/message-composer.tsx:151`) — nothing is sent by the app.
- **Env scaffolding**: `.env.example` ends with `# --- Deferred (email automation) ---` / `# RESEND_API_KEY=`.
- **Infra context**: Supabase project (Postgres 17, Edge Functions runtime enabled in `supabase/config.toml`), Next.js app presumably on Vercel (`.vercel` in `.gitignore`). Both platforms offer cron (Supabase `pg_cron` + Edge Functions; Vercel Cron hitting a route handler). The service-role admin client exists at `src/lib/supabase/admin.ts` with the documented rule: only for trusted server contexts that scope by `agent_id` themselves.
- **AI context**: `src/lib/openrouter.ts` + `draftMessage` in `src/lib/actions/messages.ts` already generate email-shaped drafts (`{subject, body}`) — the natural authoring path for scheduled sends.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Read-only recon | `grep -rn "scheduled_emails\|email_accounts" src/ supabase/` | only the migration + (for email_templates) the templates code |
| Verify no code touched | `git status` | only `docs/design/email-automation.md` + `plans/README.md` modified/added |

## Scope

**In scope** (the only files you may create/modify):
- `docs/design/email-automation.md` (create — the deliverable)
- `plans/README.md` (status row)

**Out of scope**: ALL source code, migrations, dependencies, `.env.example`. If the spike concludes "build it", the build gets its own plans later.

## Steps

### Step 1: Decide the send-pipeline architecture (the core fork)

Compare, in writing, with a recommendation and rationale grounded in this repo's actual constraints (single developer, Supabase + Vercel, low volume — tens of emails/day per agent):

1. **Vercel Cron → Next route handler** using the admin client: scan `scheduled_emails` where `status='pending' and send_at <= now()` via the existing due index, claim rows, send, update status.
2. **Supabase pg_cron → Edge Function**: same scan inside Supabase; tokens never leave Supabase; but a second runtime/deploy surface for a Next-centric repo.

Address explicitly: idempotent claiming (the `status` transition as the lock — e.g. `update ... set status='sending' where id=... and status='pending'` returning the row; note `'sending'` would require extending the enum — flag it), retry policy for `failed`, at-most-once vs at-least-once choice (duplicate follow-up emails to a client are worse than a missed-and-retried one — argue it), and observability (where does `error` text go; how does the agent see failures in-app).

### Step 2: Decide provider scope for v1 of the feature

The README names Gmail / Microsoft Graph send-as-agent with Resend fallback. Evaluate: Google OAuth verification burden (restricted `gmail.send` scope review) vs starting Resend-only (custom from-address requires domain verification the agent likely can't do → emails come from a shared/app domain with `reply_to` = agent). Recommend a v1 cut. Map each option onto `email_accounts` as it exists (which columns/enum values are used, which stay dormant) — schema changes are a red flag worth calling out, since the schema is deployed.

### Step 3: Token storage

`token_ref` says Vault. Verify what Supabase Vault offers for this project tier (web research allowed) and specify: who writes secrets (server action with admin rights?), who reads them (only the send loop), and what `token_ref` actually contains (vault secret UUID). If Vault is unsuitable, propose the alternative and call out the schema-comment mismatch explicitly.

### Step 4: UX surface

Specify, in wireframe-level prose mapped to existing components: where "schedule an email" lives (message composer already drafts subject+body — `message-composer.tsx`; a "Schedule" affordance next to its existing send actions), how scheduled/pending emails appear on the client detail page and/or calendar, cancellation, and what the notification feed shows on send failure (the `notification_type` enum would need a new value — flag as a migration).

### Step 5: Write the design doc and recommendation

`docs/design/email-automation.md` with sections: Context (quote the README + schema), Decisions (Steps 1–3 with rationale), UX (Step 4), Migration needs (enum additions etc., each flagged), Open questions for the maintainer (≤ 5, each with your recommended answer), and a Go/No-Go recommendation with a coarse build estimate broken into 2–4 future plans.

**Verify**: file exists; `git status` shows only the two in-scope files.

## Test plan

Not applicable (no code). Quality bar instead: every claim about the existing system cites a `file:line`; every recommendation names its runner-up and why it lost.

## Done criteria

- [ ] `docs/design/email-automation.md` exists with all six sections
- [ ] Every architectural claim about current code cites `file:line` and matches reality
- [ ] Each required migration (enum values, columns) is explicitly listed — or the doc states none are needed
- [ ] `git status` shows no source/schema/dependency changes
- [ ] `plans/README.md` status row updated

## STOP conditions

- Any step seems to require actually building something (OAuth app registration, installing an SDK) — the spike documents it, never does it.
- You find existing send-pipeline code (drift — someone started building v2); report what exists instead of speculating around it.

## Maintenance notes

- The `email_templates` table is shared with live messaging — any v2 schema change to it must consider the Templates page (`src/components/templates/templates-view.tsx`) and composer.
- Plans 002's `src/lib/data/attention.ts` (if landed) is where "scheduled email failed" should surface as an attention signal — note it in the doc's UX section.
