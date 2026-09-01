# Design: Outreach tracking so follow-up nudges reflect real contact

> **Status**: design spike (plan 009). No source code or schema was modified.
> Deliverable + go/no-go recommendation only. The build is a future plan.
>
> **Recommendation**: **GO** — single-column model (`clients.last_contacted_at`),
> NULL-safe `greatest()` quiet rule, open-then-record write paths. Roughly **M**
> effort across one migration + one server action + four call-site edits.
>
> Verified against the current working tree (plans 001–003 landed). Drift check
> at the bottom; no STOP condition tripped.

---

## 1. Problem

The re-engagement loop is half-closed. The app **detects** quiet buyers and even
deep-links into the composer to fix them, but the act of contacting a client
through the app's own outreach surfaces records nothing, so the "quiet" signal
is keyed to the wrong timestamp.

**The nudge rule today** (post-002, single source of truth in
`src/lib/data/attention.ts:85-102`):

```ts
const staleBefore = new Date(
  new Date(ctx.nowISO).getTime() - STALE_AFTER_DAYS * 86_400_000
).toISOString();
// ...
supabase
  .from("clients")
  .select("id, first_name, last_name, stage, updated_at")
  .eq("side", "buyer")
  .eq("is_active", true)
  .neq("stage", "reserved")
  .lte("updated_at", staleBefore),   // <-- "quiet" keyed to updated_at
```

`STALE_AFTER_DAYS = 7` (`src/lib/attention.ts:13`). Both consumers read from this
one function: the notification sync (`src/lib/actions/notifications.ts:248-259`,
weekly-deduped `follow_up` rows, `dedupe_key: followup:${id}:${weekKey}`) and the
Home cockpit (`src/lib/data/dashboard.ts:80-88`, `href: /clients/${id}?compose=check_in`).

**Why `updated_at` is the wrong signal.** It is bumped by the `set_updated_at()`
trigger on *every* row UPDATE (`supabase/migrations/20260529120000_init.sql:19-29`,
`clients_set_updated_at` at `:63-65`). It means **"record edited"**, not
**"client contacted"**. So:

- An agent who WhatsApped a buyer yesterday still gets "Follow up · quiet 8 days",
  because messaging doesn't touch the row.
- The only way to silence the nudge is to *fake-edit the record* (toggle priority,
  re-save notes) — training the agent to corrupt their own data to quiet a false alarm.

**The outreach surfaces that record nothing** (every one enumerated in §4):

| Surface | File | What it does today |
|---|---|---|
| WhatsApp button (Contact card) | `src/components/clients/whatsapp-button.tsx:27-39` | plain `<a href={wa.me…} target="_blank">`, **server component** (no `"use client"`) |
| Composer → WhatsApp | `src/components/clients/message-composer.tsx:143-149` | `window.open(whatsappLink(...))` |
| Composer → email | `src/components/clients/message-composer.tsx:150-154` | `window.location.href = mailto:` |
| Calendar reminders (Home) | `src/components/home/upcoming-panel.tsx:39,58-` | `<a href={eventReminderHref(e)}>` |
| Calendar reminders (month grid) | `src/components/calendar/calendar-view.tsx:240` | same `eventReminderHref` pattern |

**Honesty constraint (carried through the whole design).** `wa.me` and `mailto:`
are fire-and-forget hand-offs to another app. The app can know **"the agent
launched a message"**, never **"it was delivered / read / replied to"**. So the
recorded signal is *"agent initiated outreach"*, and the nudge text should not
over-claim. This is acceptable — initiating contact is exactly the human action
the nudge is trying to provoke. (Plan 007's email automation is the one path that
*will* produce a true send event; see §7.)

---

## 2. Data model decision

**Recommendation: a single column, `clients.last_contacted_at timestamptz` (nullable).**
Defer a `contact_log` table until a timeline/analytics feature actually earns it.

### Option A — `clients.last_contacted_at timestamptz` (RECOMMENDED)

One nullable column on the existing `clients` table. The write is a one-row
UPDATE; the read is already in the query above (just swap the predicate column,
§5). NULL means "never recorded a touch" and falls back to `updated_at` via
`greatest(coalesce(...))` — so **no backfill migration** is needed and existing
tenants behave exactly as today until their first recorded touch.

- **Pros**: trivial to write and query; zero new RLS surface (the column inherits
  the existing `"agent owns clients"` policy at `init.sql:251-254`); fits the
  single consumer (one boolean-ish staleness rule); NULL-safe backfill is free.
- **Cons**: no history — overwrites the previous touch; cannot answer "last 5
  touches" or "which channel". **Cannot store the channel or a note.** If a
  timeline UI is wanted later, this column is forward-compatible: a `contact_log`
  can be added then, and `last_contacted_at` becomes a denormalized cache (or is
  replaced by `max(contact_log.created_at)`).
- **One sharp edge**: the `set_updated_at()` trigger fires on *any* UPDATE,
  so writing `last_contacted_at` also bumps `updated_at`. That is harmless here
  because the quiet rule takes `greatest(last_contacted_at, updated_at)` — both
  move forward together. But it means `updated_at` quietly stops being a pure
  "edited" signal once touches are recorded. Documented, not a blocker. (If a
  future feature needs a pure edited-timestamp, exclude `last_contacted_at`-only
  updates from the trigger — out of scope here.)

### Option B — `contact_log` table (REJECTED for now)

```
contact_log(id, client_id FK, agent_id default auth.uid(), channel enum, note text, created_at)
```

- **Pros**: full history; powers a "recent touches" timeline on the client page;
  channel breakdown for future analytics; the email-automation send loop (007)
  appends a row instead of clobbering a column.
- **Cons**: a new table + new RLS policy + a new enum; **and** the consumer needs
  "latest touch per client", which is either (a) a correlated `max(created_at)`
  subquery / join on every attention scan — more expensive than reading a column —
  or (b) a denormalized `clients.last_contacted_at` *maintained by a trigger on
  insert* — i.e. you build Option A anyway **plus** the table **plus** the trigger.
  That is a lot of machinery for a product whose only current consumer is a single
  staleness boolean, for a solo agent.

### Why A wins for *this* product

This is a solo-agent CRM (one tenant = one agent, `init.sql:4-7`). The immediate
and only consumer of the signal is the quiet-buyer rule — a date comparison.
There is no timeline UI, no analytics surface, no per-channel reporting in the
product or on any near roadmap. "Column now, log later if a timeline feature
earns it" is the honest call: Option A delivers the entire value of this spike
(honest nudges) at a fraction of the cost, and does not paint us into a corner —
the migration to a log is additive and the column survives as a cache.

**Channel/note on day one?** No. The single consumer ignores channel, and the
manual-log affordance (§4.5) can capture a free-text note *into the existing
`clients.notes`* if the agent wants. Adding `channel`/`note` columns to `clients`
to support a feature nothing reads yet is premature. If the manual log proves it
wants structure, that is the trigger to graduate to Option B.

---

## 3. The action: `markContacted`

One new server action, shaped per repo convention (auth gate as in
`buyer.ts:132-135`, RLS-scoped update as in `clients.ts:50-80`, `revalidatePath`).
Proposed home: `src/lib/actions/contact.ts` (new) or appended to
`src/lib/actions/clients.ts`.

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient as createSupabase } from "@/lib/supabase/server";

const CHANNELS = ["whatsapp", "email", "call", "other"] as const;
const channelSchema = z.enum(CHANNELS);

type ActionResult = { error: string | null };

export async function markContacted(
  clientId: string,
  channel: string,          // validated below; callers pass a literal
): Promise<ActionResult> {
  const parsed = channelSchema.safeParse(channel);
  if (!parsed.success) return { error: "Invalid channel" };

  const supabase = await createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // RLS ("agent owns clients") already scopes this to the caller's rows;
  // the .eq("id") + the policy together make a cross-tenant write impossible.
  const { error } = await supabase
    .from("clients")
    .update({ last_contacted_at: new Date().toISOString() })
    .eq("id", clientId);
  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  // Home cockpit reads the same signal; revalidate it too so the nudge clears.
  revalidatePath("/");
  return { error: null };
}
```

Notes:
- `channel` is **validated and accepted but not yet stored** under Option A (no
  column for it). It is in the signature from day one so call sites are written
  correctly and a future Option B (or a `channel` column) is a non-breaking add.
  Alternatively drop the param until it's stored — see Open Question Q3.
- Set `last_contacted_at` in JS (`new Date().toISOString()`), not `now()` in SQL,
  to match how the rest of the actions layer writes timestamps and to keep it a
  plain PostgREST update. The trigger will also bump `updated_at`; that's fine (§2).
- Clearing the existing notification row is handled separately — see §6.

---

## 4. Write paths, per surface

The recurring decision is **ordering**: record-then-open vs open-then-record.
**Recommendation: open first, then fire-and-forget `markContacted`.** `window.open`
and `mailto` navigation must happen *synchronously inside the user gesture* or the
browser's popup blocker eats them; an `await markContacted(...)` *before* opening
would break that gesture chain. So open synchronously, then call the action
without awaiting (or `.then` it for an error toast). A failed record is a silent
no-op that just leaves the old nudge — strictly better than a blocked WhatsApp tab.

### 4.1 WhatsApp button — `whatsapp-button.tsx:27-39`

**Component-boundary consequence (the one real cost here).** This is currently a
plain server component — no `"use client"`, no handler, just an `<a>`. To record
a touch it needs an `onClick`, which forces it to **become a client component**.

Two ways:
- **(a) Add `"use client"` + an `onClick` to the existing `<a>`** that calls
  `markContacted(clientId, "whatsapp")` (don't `preventDefault` — let the anchor
  navigate normally, fire the action alongside). The component already receives
  everything except `clientId`; the call site at `clients/[id]/page.tsx:213-218`
  passes `phone/firstName/language` and would add `clientId`.
- **(b) Keep the icon/markup server-rendered, wrap the click in a tiny client
  child.** More files, marginal benefit.

Recommend **(a)** — smallest diff, and the button is leaf-level so the
client-boundary cost is negligible.

### 4.2 Composer → WhatsApp — `message-composer.tsx:143-149`

Already `"use client"` and already has `client.id`. In `send()`, after the
existing `window.open(url, ...)` succeeds:

```ts
if (channel === "whatsapp") {
  const url = whatsappLink(client.phone, text);
  if (!url) { toast.error("No usable phone number for this client"); return; }
  window.open(url, "_blank", "noopener,noreferrer");   // open FIRST
  markContacted(client.id, "whatsapp");                 // then record (no await)
}
```

### 4.3 Composer → email — `message-composer.tsx:150-154`

Same pattern; the email branch sets `window.location.href = mailto:` — set it,
then call `markContacted(client.id, "email")`. (With a full navigation away,
`markContacted` is best dispatched right before assigning `location.href`; for
`mailto:` the page usually does **not** navigate away, so a fire-and-forget call
just after is fine. Either way it's open-then-record.)

### 4.4 Calendar reminders — `upcoming-panel.tsx:58-` and `calendar-view.tsx:240`

`eventReminderHref` (`src/lib/event-reminder.ts:7`) builds a `wa.me` link from a
`CalendarEvent`. **Good news: both render sites are already `"use client"`**
(`upcoming-panel.tsx:1`, `calendar-view.tsx:1`), so no boundary change is needed —
add an `onClick` to the reminder `<a>` that calls
`markContacted(e.contact.clientId, "whatsapp")`.

**Caveat to verify at build time**: `CalendarEvent.contact` currently exposes
`firstName/language/phone` (see `event-reminder.ts:8-14`). It must also carry the
**client id** for `markContacted`. Check `src/lib/data/calendar.ts`'s
`CalendarEvent` shape; if `contact` lacks an id, the build plan threads it through
the calendar data layer (a small read-side change, not in scope here). Flag this
as the one place the calendar path costs more than "add an onClick".

### 4.5 Manual escape hatch — calls / in-person

`wa.me`/`mailto` only cover messaging. An agent who *phones* or meets a buyer has
no way to record it and will still be nagged. Add a small **"Log a contact"**
affordance in the **Contact card** (`clients/[id]/page.tsx:208-268`), beside the
WhatsApp button and composer. Minimal v1: a single button → `markContacted(id, "call")`
(or a tiny menu: Call / In person / Other). Because the card is a server component,
this affordance is its own small client component (a button with the action).

**Channel/note on day one?** Keep it to a one-tap "Logged a call" under Option A
(no channel column to store into). If the agent wants to annotate, they already
have `clients.notes`. Capturing structured channel/note is the trigger to graduate
to Option B, not day-one scope (Q3).

---

## 5. Redefining "quiet" (the nudge rule)

**New definition**: a buyer is quiet when there has been **no touch AND no record
activity for `STALE_AFTER_DAYS`**, i.e. the *most recent of* `last_contacted_at`
and `updated_at` is older than the threshold.

Exactly one place changes: `src/lib/data/attention.ts:97-102`
(`STALE_AFTER_DAYS` constant quoted from `src/lib/attention.ts:13`). The Home
cockpit and notification sync both read this, so both fix in lockstep.

### NULL-safe expression

The signal is `greatest(coalesce(last_contacted_at, updated_at), updated_at)`,
which (since `updated_at` is `NOT NULL`, `init.sql:52`) simplifies to:

```sql
greatest(last_contacted_at, updated_at)   -- greatest() ignores a NULL arg in Postgres
```

> Postgres `greatest()` skips NULL inputs and returns NULL only if *all* args are
> NULL. Since `updated_at` is `NOT NULL`, `greatest(last_contacted_at, updated_at)`
> is always non-NULL and equals `updated_at` when no touch was ever recorded —
> giving the exact backward-compatible behavior with no backfill.

**PostgREST reality (the part the build plan must get right).** The current code
uses the query builder: `.lte("updated_at", staleBefore)`. PostgREST cannot
express `greatest(...)` as a column filter. Two ways to apply the new predicate:

1. **A generated/derived column or a view** exposing `last_touch` =
   `greatest(last_contacted_at, updated_at)`, then `.lte("last_touch", staleBefore)`.
   Generated `STORED` columns can't reference `now()` but *can* reference other
   columns, so `last_touch generated always as (greatest(last_contacted_at, updated_at)) stored`
   is valid and indexable. Cleanest; the build plan's call.
2. **Filter in JS after the fetch**: select both columns, keep the `updated_at`
   pre-filter as a cheap upper bound is *not* safe (a recent touch with an old
   `updated_at`… can't happen, since touches bump `updated_at` too — §2). Actually,
   because every recorded touch *also* bumps `updated_at` via the trigger,
   `greatest(last_contacted_at, updated_at)` **equals `updated_at` in every case
   where a touch was recorded through `markContacted`**. So under Option A the
   existing `.lte("updated_at", staleBefore)` predicate **already produces the
   correct result** once `markContacted` writes the column — because the trigger
   moves `updated_at` forward on the same write.

> **Key simplification**: under Option A, recording a touch bumps `updated_at`
> (trigger), so the *existing* `.lte("updated_at", staleBefore)` filter is already
> correct — no SQL change to the query is strictly required. The `last_contacted_at`
> column is then primarily a *semantic/audit* signal ("when, specifically, was the
> last outreach" vs "when was the row last edited") and the safety net if the
> trigger is ever scoped to exclude touch-only writes. The build plan should still
> switch the *displayed* "quiet N days" math (`attention.ts:130-132`) to count from
> `greatest(last_contacted_at, updated_at)` so the number the agent sees reflects
> the touch, not an unrelated edit.

This is a genuinely nice property: the minimal honest fix is "write the column on
every outreach; the trigger does the rest." See Q1 for the trade-off (whether to
rely on the trigger or make the predicate explicit).

### Quiet-days display

`attention.ts:130-132` currently computes `quietDays` from `c.updated_at`. Switch
to `greatest(last_contacted_at, updated_at)` (compute in JS from both selected
columns) so "quiet 3 days" counts from the last *touch or edit*, not just edit.

---

## 6. Dedupe & clearing an already-fired nudge

The `follow_up` notification uses a **weekly** dedupe key
(`followup:${clientId}:${weekKey}`, `notifications.ts:256`). The upsert refreshes
title/body but **leaves `read_at` untouched** (`notifications.ts:276-280`), so an
already-inserted unread `follow_up` row **persists until the agent reads it** —
recording a touch only stops *next* week's row, it does not clear *this* week's.

**Two behaviors are possible:**

- **Passive (cheap, recommended for v1)**: `markContacted` writes the column and
  revalidates. The unread `follow_up` stays in the bell until the next sync, when
  `getAttentionSignals` no longer returns that buyer, so the upsert stops
  refreshing the row — but the stale unread row lingers until manually read or
  pruned. Slightly unsatisfying (the bell still shows "follow up" right after you
  messaged) but zero added coupling.
- **Active (recommended if the passive lag annoys)**: in `markContacted`, after
  the column write, also mark matching unread `follow_up` notifications read:

  ```ts
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("client_id", clientId)
    .eq("type", "follow_up")
    .is("read_at", null);
  ```

  **Cost**: one extra UPDATE per touch (cheap; RLS-scoped; indexed by `agent_id`).
  **Benefit**: messaging a buyer immediately clears their follow-up badge — the
  intuitive behavior. It also correctly clears the `stalled_offer` nudge? No —
  scope it to `type = 'follow_up'` only; a stalled *offer* is a different signal
  (offer made, not reserved) that a single message doesn't resolve. Leave
  `stalled_offer` alone.

**Recommendation**: ship **Active** — the one extra UPDATE is trivial and the
passive lag ("I just messaged them, why is it still nagging?") undercuts the whole
point of the feature. Marking only `follow_up` rows read is correct and bounded.

### Backfill semantics

None needed. `last_contacted_at` defaults to NULL; the `greatest`/`coalesce` (or
the trigger-driven `updated_at`) handles NULL as "never touched → fall back to
edited timestamp". Existing tenants see **identical** behavior to today until
their first recorded touch. The migration is a pure additive column with a default
of NULL — no data migration, no downtime.

---

## 7. Compatibility with plan 007 (email automation)

**This is the cross-spike contract the README mandates (007 ↔ 009): a real email
send is a contact event.**

Plan 007 designs the deferred send pipeline: a loop scans `scheduled_emails`
where `status='pending' and send_at <= now()`, sends, and writes
`scheduled_emails.sent_at` + `status='sent'`
(`init.sql:218-230`, `scheduled_emails_due_idx` at `:232`). That `sent_at` is the
**one true contact event in the whole system** (delivered by the app, not a
hand-off to wa.me/mailto).

**Exact integration point**: in 007's send loop, at the moment it marks a row
`sent` (sets `sent_at`), it must **also** record the touch for that client — i.e.
the same write `markContacted` performs:

```sql
update public.clients
set last_contacted_at = now()      -- or scheduled_emails.sent_at, same instant
where id = <scheduled_email.client_id>;
```

Under **Option A** this is a one-line addition to 007's send loop (and naturally
runs under the admin client the loop already uses, scoped by the row's
`agent_id` — note: the loop runs with elevated rights, so it must scope the
update by `client_id`, which is FK-bound to that agent's client anyway).

Under **Option B** (if ever adopted) it would instead `insert into contact_log`
with `channel='email'`. Either way the integration point is identical: **"on
successful send, write the touch signal."** 007's doc should name
`markContacted` (or the column write) as the post-send side effect; this doc names
007's send-success transition as the producer. The two stay compatible because
both funnel through the same `last_contacted_at` signal.

(007's UX section also wants "scheduled email failed" to surface as an attention
signal in `attention.ts` — orthogonal to this design, but both live in the same
module, so the build plans should land in a sensible order.)

---

## 8. Migration sketch (for a FUTURE build plan only — not executed here)

Following the repo's RLS-per-table pattern; but note this is a column add to an
**existing** table, so it inherits `clients`' policy and trigger — no new policy
needed.

```sql
-- supabase/migrations/<yyyyMMddHHmmss>_client_last_contacted_at.sql
-- Honest outreach signal: when the agent last *contacted* this client
-- (messaged / called / emailed), as distinct from updated_at = "row edited".
-- NULL = never recorded; the quiet rule falls back to updated_at via greatest().

alter table public.clients
  add column last_contacted_at timestamptz;

-- The follow-up scan filters quiet buyers; once touches are recorded the existing
-- (agent_id, updated_at) access pattern still applies, but add an index if the
-- build plan switches the predicate to a derived/generated column:
-- create index clients_agent_last_contacted_idx
--   on public.clients (agent_id, last_contacted_at desc);

-- OPTIONAL (only if the build plan chooses the explicit-predicate route, §5.1):
-- a generated column makes greatest(...) filterable + indexable via PostgREST.
-- alter table public.clients
--   add column last_touch timestamptz
--   generated always as (greatest(last_contacted_at, updated_at)) stored;
-- create index clients_agent_last_touch_idx on public.clients (agent_id, last_touch desc);
```

No new RLS policy (inherits `"agent owns clients"`, `init.sql:251-254`). No enum
add under Option A (channel isn't stored). If Option B were chosen instead, that
migration would add a `contact_channel` enum + `contact_log` table + its own
`"agent owns contact_log"` policy + a denormalizing trigger — materially larger,
which is part of why A wins.

---

## 9. Open questions (each with a recommended answer)

1. **Rely on the `updated_at` trigger, or make the quiet predicate explicit?**
   Because `markContacted` writes a `clients` row, the `set_updated_at()` trigger
   bumps `updated_at` too, so the *existing* `.lte("updated_at", …)` filter is
   already correct (§5). The `last_contacted_at` column is then a semantic/audit
   value + display source. **Recommended**: ship the simple version (rely on the
   trigger for the *filter*; use `greatest()` only for the *displayed* quiet-days
   count). Add the generated `last_touch` column only if a future change scopes
   the trigger to exclude touch-only writes. Lowest-risk, fewest moving parts.

2. **Clear the existing unread `follow_up` on contact (Active) or let it linger
   (Passive)?** **Recommended: Active** — one extra RLS-scoped UPDATE in
   `markContacted` (§6). The passive lag directly contradicts the feature's intent.

3. **Capture `channel`/`note` on day one?** **Recommended: no.** Keep
   `markContacted(channel)` validated-but-unstored under Option A; the manual log
   is one-tap; free-text goes in `clients.notes`. Graduate to a `channel` column
   or Option B only when a timeline/analytics feature is actually planned.

4. **Does logging a touch reset stage timers or only the follow-up nudge?**
   **Recommended: only the `follow_up` nudge.** `stalled_offer` (offer made, not
   reserved) is a distinct signal that a single message doesn't resolve — leave it
   untouched (§6). Stage stays a manual, deliberate field.

---

## 10. Build-plan outline (future work; not this spike)

Coarse estimate: **M** total. Read-only spike confirmed every touchpoint exists
and is reachable.

1. **Migration + read-rule** (S): add `clients.last_contacted_at` (§8); switch the
   displayed quiet-days math in `attention.ts:130-132` to `greatest(...)`; decide
   Q1 (likely keep the `updated_at` filter). Tests live in 002's `attention.test.ts`
   (002 owns that file) — extend, don't fork.
2. **`markContacted` action + dedupe-clear** (S): new `src/lib/actions/contact.ts`
   per §3; Active clear per §6; zod-validate `channel`; auth gate + `revalidatePath`.
3. **Wire the surfaces** (S–M): WhatsApp button → `"use client"` + onClick (§4.1,
   the only boundary change); composer ×2 (§4.2–4.3); both calendar reminder sites
   (§4.4, plus thread the client id through `CalendarEvent.contact` if missing);
   manual "Log a contact" affordance in the Contact card (§4.5).
4. **(Cross-plan, with 007)** when email automation is built, add the post-send
   touch write to 007's send loop (§7) — one line, but it's the contract that
   keeps the two designs honest.

**Done when**: messaging/calling a buyer through any app surface advances
`last_contacted_at`; the Home + bell "follow up" nudge counts from real contact;
an in-flight unread `follow_up` clears on contact; existing tenants are unaffected
until their first touch.

---

## Appendix: drift check (run at design time)

```
git diff --stat 4286cc9..HEAD -- src/lib/actions/notifications.ts \
  src/lib/data/dashboard.ts src/components/clients/whatsapp-button.tsx \
  src/components/clients/message-composer.tsx supabase/migrations/
```

Result: only `supabase/migrations/20260614120000_deal_analyses.sql` (+52) — the
unrelated profit-calculator table. The four outreach files are unchanged since the
planned-at commit. Plans 001–003 have landed: the stale-buyer rule lives in
`src/lib/data/attention.ts` (plan 002's shared module), exactly as the plan
anticipated.

**STOP conditions checked, none tripped**:
- No `last_contacted_at` column or `contact_log` table exists
  (`grep -rn "last_contacted_at\|contact_log" src/ supabase/` → only the `contacted`
  *stage* enum, landing copy, and an unrelated lead prompt).
- The nudge logic is locatable — `src/lib/data/attention.ts:97-102` (post-002).
```
