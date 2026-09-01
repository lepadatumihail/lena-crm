# Plan 002: Fix notification times (UTC bug + day math) and deduplicate the attention signals

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 4286cc9..HEAD -- src/lib/actions/notifications.ts src/lib/data/dashboard.ts src/components/notifications/notifications-bell.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-verification-baseline.md (test runner)
- **Category**: bug
- **Planned at**: commit `4286cc9`, 2026-06-12

## Why this matters

Lena is a CRM for agents on the Costa del Sol (Europe/Madrid, UTC+1/+2). Notification **bodies are formatted on the server**, which is UTC in production — so a 10:00 viewing reminder reads "08:00". Reservation key-date math mixes a server-TZ midnight with a browser-supplied "now", so "PPC payment today" can say "tomorrow" (or be silently dropped) during the 00:00–02:00 local window. Five Supabase query errors in the sync are silently swallowed (a transient failure looks like an empty feed), two queries are unbounded over time, and the whole signal block is duplicated — already divergently — in the Home dashboard. These are daily-visible defects in the product's core "never miss a follow-up" promise.

Note: on a localhost dev server the host TZ equals the agent's TZ, so the UTC formatting bug does **not** reproduce locally. To see it, run dev with `TZ=UTC npm run dev`.

## Current state

- `src/lib/actions/notifications.ts` — `"use server"`; `syncNotifications(ctx)` lazily generates the notification rows on every bell load; `loadNotifications` = sync + read. Browser supplies `SyncContext`:

  ```ts
  // notifications.ts:26-31
  export type SyncContext = {
    nowISO: string;
    dayStartISO: string;
    dayEndISO: string;
    todayKey: string; // yyyy-MM-dd (local)
  };
  ```

  The bugs, with excerpts as of `4286cc9`:

  1. **UTC-formatted bodies** — `notifications.ts:164` (reminder body) and `:181` (today-digest lines):

     ```ts
     body: `${format(start, "EEE d MMM, HH:mm")}${ e.location ? ` · ${e.location}` : "" }`,
     ...
     .map((e) => `${format(new Date(e.starts_at), "HH:mm")} · ${e.title}`);
     ```

     `format` from `date-fns` renders in the **process TZ** (UTC on Vercel). The bell (`notifications-bell.tsx`) renders `n.body` verbatim.

  2. **Day off-by-one** — `notifications.ts:256-259`:

     ```ts
     const d = new Date(`${dateStr}T00:00:00`);          // server-local midnight
     const diff = differenceInCalendarDays(d, now);       // now = browser instant
     if (diff < 0 || diff > 5) continue;
     const when = diff === 0 ? "today" : diff === 1 ? "tomorrow" : `in ${diff} days`;
     ```

     `differenceInCalendarDays` evaluates calendar days in the server TZ.

  3. **Swallowed errors** — `apptRes`/`viewRes` (`:93-108`), `staleRes` (`:208-214`), `resRes` (`:240-244`), `offerRes` (`:284-289`) never check `.error`; each falls back to `data ?? []`. `loadNotifications` (`:335-340`) discards `syncNotifications`' returned `{ error }` entirely:

     ```ts
     export async function loadNotifications(ctx: SyncContext): Promise<NotificationFeed> {
       await syncNotifications(ctx);
       return getNotificationFeed();
     }
     ```

  4. **Unbounded queries** — appointments `.gte("starts_at", ctx.dayStartISO)` with no upper bound (`:99`); viewings likewise (`:107`). The largest reminder preset is 1 day (1440 min, see `REMINDER_PRESETS` in `src/lib/calendar.ts`), so nothing beyond `dayEnd + 2 days` can ever produce a row.

  5. **Sequential queries** — `staleRes` (`:208`), `resRes` (`:240`), `offerRes` (`:284`) are three independent awaits in series.

- `src/lib/data/dashboard.ts` — `getNeedsAttention()` (`:58-160`) is a near-verbatim copy of sections 3–5 of `syncNotifications` (stalled offers, stale buyers, reservation dates), with the same `new Date(\`${dateStr}T00:00:00\`)` pattern at `:139`, but using server `new Date()` for "now" and also three sequential awaits. The comment on it says: *"Read-only mirror of the notification signals."* The copies have already diverged on time handling.

- `src/components/notifications/notifications-bell.tsx` — client component. `buildContext()` (`:47-55`) builds the `SyncContext` from the browser clock. `refresh` (`:64-73`) calls `loadNotifications(buildContext())`; a `setInterval` polls every 5 minutes (`:79`) and the popover open also refreshes (`:88`). There is no in-flight guard, so open-during-poll runs two full syncs concurrently (harmless for data — the upsert is idempotent via the `notifications_agent_dedupe_idx` unique index — but wasteful).

- Conventions: server actions return `{ error: string | null }`; data modules in `src/lib/data/*` throw on error (see `src/lib/data/clients.ts`). `date-fns` v4 is the date library; `@date-fns/tz` is NOT installed — this plan deliberately uses `Intl.DateTimeFormat` instead of adding a dependency.

## Commands you will need

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Typecheck | `npm run typecheck` | exit 0              |
| Tests     | `npm test`          | exit 0, all pass    |
| Lint      | `npm run lint`      | exit 0 (4 pre-existing warnings OK) |

## Scope

**In scope** (the only files you should modify/create):
- `src/lib/attention.ts` (create — pure, testable helpers)
- `src/lib/attention.test.ts` (create)
- `src/lib/data/attention.ts` (create — the shared Supabase queries)
- `src/lib/actions/notifications.ts`
- `src/lib/data/dashboard.ts`
- `src/components/notifications/notifications-bell.tsx`
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- `src/lib/data/notifications.ts` (`getNotificationFeed`) — read path is correct.
- `src/lib/event-reminder.ts`, `src/lib/calendar.ts`, `src/components/calendar/*` — those format in the browser, which is correct.
- The notifications DB schema/migrations — `dedupe_key` shapes must stay exactly as they are (existing rows depend on them).
- Plan 003 owns zod-validating `SyncContext` — here you only ADD the `timeZone` field, no validation.

## Git workflow

- Branch: `advisor/002-notification-time-correctness`
- Commit style: `fix: timezone-correct notification times + shared attention signals`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Pure helpers in `src/lib/attention.ts`

Create with, at minimum:

```ts
/** Days from todayKey (yyyy-MM-dd) to dateStr (yyyy-MM-dd), TZ-proof. */
export function calendarDaysFromToday(dateStr: string, todayKey: string): number {
  return Math.round((Date.UTC(...parse(dateStr)) - Date.UTC(...parse(todayKey))) / 86_400_000);
}

/** "today" | "tomorrow" | "in N days" — phrasing used by notifications + Home. */
export function relativeDayLabel(diff: number): string

/** "Sat 14 Jun, 10:00" in the given IANA timeZone (en-GB, 24h). */
export function formatInTimeZone(isoInstant: string, timeZone: string): string

/** "10:00" in the given IANA timeZone. */
export function formatTimeInTimeZone(isoInstant: string, timeZone: string): string
```

Implement the formatters with `Intl.DateTimeFormat("en-GB", { timeZone, ... })` (use `formatToParts` to assemble `"EEE d MMM, HH:mm"`-equivalent output; `hour12: false`). Guard invalid `timeZone` with a try/catch falling back to UTC — `Intl` throws `RangeError` on bad zone names. Date string parsing must be strict (`/^\d{4}-\d{2}-\d{2}$/`).

The shared stale-threshold constant also lives here: `export const STALE_AFTER_DAYS = 7;` and `export const RESERVATION_LOOKAHEAD_DAYS = 5;`.

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Tests for the helpers

`src/lib/attention.test.ts` (pattern: plan 001's colocated vitest files):

- `calendarDaysFromToday("2026-06-14", "2026-06-14")` → 0; `("2026-06-15", "2026-06-14")` → 1; `("2026-06-13", "2026-06-14")` → -1; across a month boundary `("2026-07-01", "2026-06-30")` → 1; across a DST change `("2026-03-30", "2026-03-28")` → 2 (pure UTC math is immune).
- `formatInTimeZone("2026-06-14T08:00:00.000Z", "Europe/Madrid")` contains `"10:00"`; with `"UTC"` contains `"08:00"`; invalid zone `"Not/AZone"` does not throw.
- `relativeDayLabel(0)` → "today", `(1)` → "tomorrow", `(3)` → "in 3 days".

**Verify**: `npm test` → exit 0, new tests pass.

### Step 3: Shared signal queries in `src/lib/data/attention.ts`

Move the three duplicated query+filter blocks into one module. Shape:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type AttentionContext = { nowISO: string; todayKey: string };
export type StalledOffer = { clientId: string; name: string };
export type StaleBuyer = { clientId: string; name: string; stage: string; quietDays: number };
export type ReservationDate = { clientId: string; name: string; field: "ppc" | "notary" | "downpayment"; label: string; dateStr: string; diff: number };

export async function getAttentionSignals(
  supabase: SupabaseClient<Database>,
  ctx: AttentionContext
): Promise<{ stalledOffers: StalledOffer[]; staleBuyers: StaleBuyer[]; reservationDates: ReservationDate[] }>
```

Implementation notes:
- Run the three queries (viewings `had_offer=true` + embedded client; stale buyers; reservations + embedded client) in **one `Promise.all`**.
- **Throw `new Error(res.error.message)` on any query error** (data-module convention, matches `src/lib/data/clients.ts`).
- Stale cutoff: `new Date(new Date(ctx.nowISO).getTime() - STALE_AFTER_DAYS * 86_400_000).toISOString()`.
- Reservation day diff: `calendarDaysFromToday(dateStr, ctx.todayKey)`; keep `0 <= diff <= RESERVATION_LOOKAHEAD_DAYS`.
- Quiet days: `Math.max(1, -calendarDaysFromToday(updatedAt.slice(0, 10), ctx.todayKey))` — or keep `differenceInCalendarDays` here if you prefer, but it must take `ctx.nowISO`, never `new Date()`.
- Skip-rules carried over exactly: stalled offers exclude non-buyers, inactive, `stage === "reserved"`, and dedupe per client; stale buyers exclude `stage === "reserved"`, inactive; a client with a stalled offer must not also appear as a stale buyer (the caller in notifications.ts currently filters this — move the rule into this module so both callers get it).
- Copy the `Embedded<T>` / `one()` helpers (they exist identically in both current files).

**Verify**: `npm run typecheck` → exit 0.

### Step 4: Rewire `syncNotifications`

In `src/lib/actions/notifications.ts`:

1. Add `timeZone: string` to `SyncContext`.
2. Replace sections 3–5 (stale buyers `:197-230`, reservation dates `:232-271`, stalled offers `:273-306` and the post-filter `:308-315`) with one `getAttentionSignals(supabase, ctx)` call (wrap in try/catch → `return { error: e.message }`). Map signals to `NotificationInsert` rows **keeping every `dedupe_key` format byte-identical**: `followup:${clientId}:${weekKey}`, `resdate:${clientId}:${field}:${dateStr}`, `stalled:${clientId}:${weekKey}`. For `due_at` of a reservation date use `${dateStr}T00:00:00Z` (the exact instant is cosmetic; the feed orders by it).
3. Reminder + digest bodies: replace `format(start, "EEE d MMM, HH:mm")` with `formatInTimeZone(e.starts_at, ctx.timeZone)` and `format(new Date(e.starts_at), "HH:mm")` with `formatTimeInTimeZone(e.starts_at, ctx.timeZone)`.
4. Bound the two schedule queries: appointments add `.lte("starts_at", upperISO)`, viewings add `.lte("scheduled_at", upperISO)`, where `upperISO = new Date(new Date(ctx.dayEndISO).getTime() + 2 * 86_400_000).toISOString()`.
5. Check `.error` on `apptRes` and `viewRes`: `if (apptRes.error) return { error: apptRes.error.message };` (same for viewRes).
6. `loadNotifications`: surface the sync failure — `const { error } = await syncNotifications(ctx); if (error) throw new Error(error);`. (The bell's existing `catch` keeps the previous items on screen — verified at `notifications-bell.tsx:70-72`.)
7. Delete the now-unused imports (`differenceInCalendarDays` if unused, `STAGE_LABELS` stays — it's used in the row mapping).

**Verify**: `npm run typecheck` → exit 0; `npm test` → exit 0.

### Step 5: Rewire `getNeedsAttention` in `src/lib/data/dashboard.ts`

Replace its three blocks with the same `getAttentionSignals` call, mapping to the existing `AttentionItem` shape (`id`/`kind`/`title`/`detail`/`href` strings unchanged, including the `?compose=` hrefs). Build the context from the server clock — this is a Server Component path with no browser context:

```ts
const now = new Date();
const ctx = { nowISO: now.toISOString(), todayKey: now.toISOString().slice(0, 10) };
```

Document the accepted limitation with this comment: `// Server-clock day boundary (UTC in prod). The bell uses the browser's; near-midnight drift here is accepted.`

**Verify**: `npm run typecheck` → exit 0; `grep -c "had_offer" src/lib/data/dashboard.ts` → 0 (the query moved out).

### Step 6: Bell — supply `timeZone` and add the in-flight guard

In `notifications-bell.tsx`:
- `buildContext()` adds `timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone`.
- In-flight guard: `const inFlight = useRef(false);` — `refresh` returns early if `inFlight.current`, sets it true in a `try`, false in `finally`.

**Verify**: `npm run typecheck` → exit 0; `npm run lint` → exit 0, no new warnings.

## Test plan

- `src/lib/attention.test.ts` — see Step 2 (day math incl. month/DST boundaries, TZ formatting incl. invalid zone, labels).
- Existing plan-001 tests keep passing: `npm test` → exit 0.
- `getAttentionSignals` itself needs a Supabase client; do NOT mock it in this plan — its logic is covered via the pure helpers plus manual verification below.
- Manual smoke (optional but recommended, requires `.env.local`): `TZ=UTC npm run dev`, create an appointment ~1h out with a 3h reminder, open the bell → body shows the **local** wall-clock time, not UTC−2.

## Done criteria

- [ ] `npm run typecheck` exits 0
- [ ] `npm test` exits 0, including new `attention.test.ts`
- [ ] `grep -rn "EEE d MMM, HH:mm" src/lib/actions/notifications.ts` → no matches (UTC formatting gone)
- [ ] `grep -rn 'T00:00:00`' src/lib/actions/notifications.ts src/lib/data/dashboard.ts` → no matches (server-TZ midnight parsing gone)
- [ ] Stalled-offer / stale-buyer / reservation-date query logic exists in exactly one module (`src/lib/data/attention.ts`)
- [ ] `dedupe_key` formats unchanged (grep `followup:`, `resdate:`, `stalled:` — same templates as the excerpts)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `dedupe_key` templates in the live code differ from the excerpts (`followup:${id}:${weekKey}` etc.) — changing key shapes orphans existing rows.
- Plan 001 has not landed (no `npm test`) — this plan's verification depends on it.
- You find additional callers of the duplicated blocks beyond `notifications.ts` and `dashboard.ts` (`grep -rn "had_offer" src/` showing other query sites).
- `Intl.DateTimeFormat` with `timeZone` is unavailable in the runtime (it is in Node 20 — if typecheck disagrees, report).

## Maintenance notes

- Any new "attention" signal (e.g. a future `last_contacted_at`-based nudge — see plans/009) should be added to `src/lib/data/attention.ts` so the bell and Home stay in lockstep automatically.
- Reviewer: scrutinize the dedupe-key mapping (byte-identical) and that `loadNotifications` now throws on sync failure rather than silently returning a feed.
- Deferred: persisting the agent's timezone server-side so `getNeedsAttention` can use it too (today it accepts server-day boundaries); moving sync off the request path to a cron — not worth it at current scale.
