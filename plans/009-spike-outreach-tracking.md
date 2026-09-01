# Plan 009 (design spike): Specify outreach tracking so follow-up nudges reflect real contact

> **Executor instructions**: This is a **design spike, not a build plan**. The
> deliverable is a design document — you must not modify any source code or
> schema. Follow the steps and STOP where instructed. When done, update the
> status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 4286cc9..HEAD -- src/lib/actions/notifications.ts src/lib/data/dashboard.ts src/components/clients/whatsapp-button.tsx src/components/clients/message-composer.tsx supabase/migrations/`
> Material drift → compare excerpts before proceeding; on a mismatch, STOP and
> report. Plan 002 deliberately restructures the first two files (shared
> `src/lib/data/attention.ts`) — that drift is expected; anchor on wherever
> the stale-buyer rule lives now.

## Status

- **Priority**: P3
- **Effort**: S (the spike; the build it specifies is roughly M — coarse)
- **Risk**: LOW (no code changes)
- **Depends on**: none (reads better after plan 002 lands, since the nudge logic will have moved to `src/lib/data/attention.ts`)
- **Category**: direction
- **Planned at**: commit `4286cc9`, 2026-06-12

## Why this matters

The app's re-engagement loop is half-closed. It *detects* quiet buyers — "Follow up with X · no update in N days" — and even deep-links into the composer. But "quiet" is keyed to `clients.updated_at`, which only moves when the agent **edits the record**. Actually contacting the client through the app's own outreach surfaces (the WhatsApp button, the AI composer's wa.me/mailto actions) records nothing. So an agent who messaged a buyer yesterday still gets nagged "quiet 8 days", and the only way to silence the nudge is to fake-edit the record. The fix is a small, honest signal: record when outreach happened, and key the nudge to it.

## Current state (all verified at `4286cc9`)

- **The nudge rule** (duplicated in two places at the planned-at commit; plan 002 merges them into `src/lib/data/attention.ts`):
  - `src/lib/actions/notifications.ts:197-230` — buyers `side='buyer'`, `is_active=true`, `stage != 'reserved'`, `updated_at <= now-7d` → weekly-deduped `follow_up` notification (`dedupe_key: followup:${id}:${weekKey}`).
  - `src/lib/data/dashboard.ts:105-130` — the same query for the Home "needs attention" list, `href: /clients/${id}?compose=check_in`.
- **`updated_at` semantics**: bumped by the `set_updated_at()` trigger on every row UPDATE (`supabase/migrations/20260529120000_init.sql:19-29,63-65`) — i.e. it means "record edited", not "client contacted".
- **Outreach surfaces that record nothing**:
  - `src/components/clients/whatsapp-button.tsx` — a plain `<a href={wa.me…} target="_blank">`; no handler, not a client component (no `"use client"` pragma; it renders inside a server page).
  - `src/components/clients/message-composer.tsx` — `"use client"`; send actions at `:144-151`: WhatsApp → `window.open(whatsappLink(client.phone, text))`, email → `mailto:` link. (Wa.me/mailto are fire-and-forget: the app can know "the agent launched a message", never "it was delivered" — the doc must be honest about this.)
  - One-tap reminder links on calendar events (`src/lib/event-reminder.ts` → used by calendar components) — same wa.me pattern.
- **Schema headroom**: `clients` has no `last_contacted_at`; there is no contact-log table. Any addition is a new migration in `supabase/migrations/` (timestamped `yyyyMMddHHmmss_name.sql`, RLS pattern per existing tables).
- **Adjacent intent**: the deferred email automation (plan 007) will eventually *send* email for real — its `sent_at` is a true contact event; the design should slot into whatever this spike defines.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Recon | `grep -rn "updated_at" src/lib/actions/notifications.ts src/lib/data/dashboard.ts src/lib/data/attention.ts 2>/dev/null` | the stale-buyer rule site(s) |
| Verify no code touched | `git status` | only `docs/design/outreach-tracking.md` + `plans/README.md` |

## Scope

**In scope** (the only files you may create/modify):
- `docs/design/outreach-tracking.md` (create — the deliverable)
- `plans/README.md` (status row)

**Out of scope**: ALL source code and migrations. The build is a future plan.

## Steps

### Step 1: Choose the data model

Compare, with a recommendation:

1. **`clients.last_contacted_at timestamptz`** — one column, trivially queryable (`greatest(last_contacted_at, updated_at)` or just `last_contacted_at` once backfilled = `updated_at`); loses history.
2. **`contact_log` table** (`client_id`, `agent_id`, `channel enum('whatsapp','email','call','other')`, `note`, `created_at`) — history + future analytics ("last 5 touches"), powers a timeline UI later; one more table + RLS + a derived "latest touch" query (or a denormalized column maintained by trigger — flag the complexity).

Ground the recommendation in this product's reality: solo agent, the immediate consumer is one boolean-ish rule. (A defensible answer is "column now, log later if a timeline feature earns it" — argue it rather than asserting it.)

### Step 2: Define the write paths

For each outreach surface, specify exactly how the touch gets recorded, including the component-boundary consequences:

- `whatsapp-button.tsx`: needs an `onClick` → must become a `"use client"` component (it currently isn't); it calls a new server action `markContacted(clientId, channel)`.
- `message-composer.tsx` WhatsApp/email actions (`:144-151`): call the same action when the agent fires `window.open`/mailto. Decide: before or after opening (popup blockers punish async-then-open — recommend open-then-record).
- Calendar one-tap reminders: same treatment; name the component(s) that render `eventReminderHref` (find them: `grep -rn "eventReminderHref" src/`).
- Manual escape hatch: a "log a contact" affordance for calls/in-person — where it lives on the client page (recommend: small action in the Contact card) — and whether `channel`/`note` are worth capturing on day one.
- The action itself: shape per repo convention (`"use server"`, zod-validate `channel`, RLS-scoped update/insert, `revalidatePath(/clients/${id})`).

### Step 3: Redefine "quiet" and the dedupe story

Specify the new rule: quiet = no touch AND no record activity for 7 days — i.e. `greatest(last_contacted_at, updated_at) <= now-7d` (or the log-table equivalent) — and where it changes (after plan 002: one place, `src/lib/data/attention.ts`; quote the constant `STALE_AFTER_DAYS`). Address: does recording a touch *immediately* clear an existing unread `follow_up` notification, or just stop next week's? (The weekly `dedupe_key` means the row persists until read — recommend whether `markContacted` should also mark matching unread `follow_up` notifications read, and what that costs.) Backfill semantics for existing tenants (NULL `last_contacted_at` = fall back to `updated_at` — no migration backfill needed if the rule uses `greatest`/`coalesce`; show the expression).

### Step 4: Write the doc

`docs/design/outreach-tracking.md`: Problem (with the `updated_at` evidence), Data model decision (Step 1, with the rejected option's tradeoffs), Write paths (Step 2, per surface, with component-boundary notes), Nudge rule change (Step 3, exact expression), Migration sketch (SQL in a fenced block, following the repo's RLS pattern — to be executed only by a future build plan), Open questions (≤ 4, each with a recommended answer), and a build-plan outline with effort.

**Verify**: file exists; `git status` clean except the two in-scope files.

## Test plan

Not applicable (no code). Quality bar: every surface in Step 2 names the exact file and line-area it would change, and the popup-blocker ordering question is answered, not deferred.

## Done criteria

- [ ] `docs/design/outreach-tracking.md` exists with all seven sections
- [ ] The "quiet" expression is written out exactly (SQL/PostgREST-level, NULL-safe)
- [ ] Every outreach surface in the app is enumerated with its write path (WhatsApp button, composer ×2 channels, calendar reminder links, manual log)
- [ ] `git status` shows no source/schema changes
- [ ] `plans/README.md` status row updated

## STOP conditions

- A `last_contacted_at` column or contact-log table already exists (drift) — report what's there.
- The nudge logic can't be located in either `notifications.ts`/`dashboard.ts` (pre-002) or `src/lib/data/attention.ts` (post-002) — the refactor went elsewhere; report rather than guess.

## Maintenance notes

- Plan 007's email automation, if built, must write the same touch signal on successful send — the doc should name the exact integration point so the two designs stay compatible.
- The composer's `react-hooks/incompatible-library` lint warning (`message-composer.tsx:319`) predates this work — a build plan touching that file must not try to "fix" it as a drive-by.
