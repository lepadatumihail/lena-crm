# Plan 003: Harden server-action input contracts (auth gate, length caps, ownership checks)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 4286cc9..HEAD -- src/lib/actions/leads.ts src/lib/actions/messages.ts src/lib/actions/documents.ts src/lib/actions/buyer.ts src/lib/actions/clients.ts src/lib/actions/notifications.ts src/lib/validation/buyer.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. (Plan 002 intentionally changes
> `notifications.ts` — see Step 4 for how to handle both orders.)

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/001-verification-baseline.md; execute after plans/002 if possible (both touch `notifications.ts`)
- **Category**: security
- **Planned at**: commit `4286cc9`, 2026-06-12

## Why this matters

Next.js Server Actions are network-reachable POST endpoints. The bundled framework docs (`node_modules/next/dist/docs/01-app/02-guides/data-security.md`) are explicit: treat every action as directly callable and verify auth/authz inside it. Most of this app's actions are implicitly protected by Supabase RLS, but `extractLead` calls a paid LLM API **with no auth check and no input cap** — it is the cost-drain endpoint of the app. Several other actions accept client-constructed values (`storage_path`, foreign-table ids, free strings) without server-side contracts. None of these are tenant-data leaks (RLS holds), but they are integrity and cost holes that cost one line each to close.

## Current state

Tenancy model (context): every table has RLS `agent_id = auth.uid()` with `with check` (see `supabase/migrations/20260529120000_init.sql:240-299`). Server actions use the cookie-scoped client from `src/lib/supabase/server.ts`, so DB reads/writes are tenant-scoped automatically. The gaps below are all *around* that.

1. **`src/lib/actions/leads.ts` — no auth gate, no input cap.** The whole action as of `4286cc9` (`:19-52` abridged):

   ```ts
   export async function extractLead(
     text: string
   ): Promise<{ data: ExtractedLead | null; error: string | null }> {
     const input = text.trim();
     if (!input) return { data: null, error: "Paste a lead message first" };
     // ... builds prompt ...
     content = await openrouterChat([...], { temperature: 0.2 });
   ```

   It imports nothing from Supabase — no `auth.getUser()` anywhere — and `text` has no length limit before becoming LLM input tokens. Contrast: `draftMessage` in `messages.ts` is implicitly gated because its first query (`:21-26`) returns "Client not found" without a session.

2. **`src/lib/actions/messages.ts` — unbounded free-text into the prompt.** `draftMessage` input fields `draft`, `instruction`, `property` (`:9-18`) are interpolated into the prompt (`:106-118`) with no length caps.

3. **`src/lib/actions/documents.ts:11-32` — `addDocument(clientId, meta)`** inserts `meta.storage_path`/`file_name`/`mime_type`/`size` directly. No check that `clientId` is one of the caller's clients (the FK accepts any existing client id, including another tenant's — the row still gets the caller's `agent_id`, so the victim never sees it, but it enables client-id existence probing and own-tenant junk rows). No check that `storage_path` starts with the caller's own folder. Storage-read RLS (`init.sql:309-314`) keys on path segment 1 = `auth.uid()`, so a foreign path is unreadable — this is integrity hardening, not a data-leak fix.

4. **`src/lib/actions/buyer.ts` — same pattern in `addViewingAttachment` (`:115-137`)**: inserts client-supplied `viewing_id` + `storage_path` without ownership verification. Also **`saveViewing` (`:47-90`)** validates `values` with zod but takes a second `schedule` argument completely unvalidated:

   ```ts
   export async function saveViewing(
     clientId: string,
     viewingId: string | null,
     values: ViewingFormValues,
     schedule: { scheduled_at: string | null; reminder_minutes: number | null }
   )
   ```

5. **`src/lib/actions/clients.ts:121-134` — `updateClientStage(id, stage: string)`** passes `stage` straight to the update. The DB CHECK `clients_stage_valid` (`init.sql:53-58`) rejects bad values, but the raw constraint error is returned to the caller; a server-side allowlist is cheaper and cleaner.

6. **`src/lib/actions/notifications.ts` — `SyncContext` unvalidated** (browser-supplied `nowISO`/`dayStartISO`/`dayEndISO`/`todayKey`, plus `timeZone` once plan 002 lands). Malformed strings produce `Invalid Date` / NaN comparisons and garbage `due_at`/`dedupe_key` values (self-harm only, but it silently breaks the feed).

7. **`src/lib/validation/buyer.ts:10-17` — `numericString` accepts `"1e999"`** (`Number("1e999")` is `Infinity`, which passes `!Number.isNaN` and `>= 0`); `toNumberOrNull` then forwards `Infinity` toward a numeric column. Excerpt of the refine is in plan 001's Current state; the predicate to change is the non-int branch `!Number.isNaN(Number(v))`.

Conventions: actions are `"use server"` modules returning `{ error: string | null }`; zod schemas live in `src/lib/validation/`; exemplar action with full validation: `upsertPreferences` in `src/lib/actions/buyer.ts:21-45`.

## Commands you will need

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Typecheck | `npm run typecheck` | exit 0              |
| Tests     | `npm test`          | exit 0, all pass    |
| Lint      | `npm run lint`      | exit 0 (4 pre-existing warnings OK) |

## Suggested executor toolkit

- Read `node_modules/next/dist/docs/01-app/02-guides/data-security.md` (section on Server Actions) before Step 1 — it is the authority this plan implements.

## Scope

**In scope** (the only files you should modify/create):
- `src/lib/actions/leads.ts`
- `src/lib/actions/messages.ts`
- `src/lib/actions/documents.ts`
- `src/lib/actions/buyer.ts` (only `saveViewing`'s schedule validation and `addViewingAttachment`)
- `src/lib/actions/clients.ts` (only `updateClientStage`)
- `src/lib/actions/notifications.ts` (only the `SyncContext` validation at the top of `syncNotifications`)
- `src/lib/validation/buyer.ts` + `src/lib/validation/buyer.test.ts`
- `src/lib/validation/calendar.ts` (only if you place the schedule schema here — see Step 5)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- Error-message hygiene (raw `error.message` passthrough) — audited separately (finding F7), deliberately not in this plan.
- `deleteClient` / storage removal ordering in `clients.ts`/`buyer.ts`/`documents.ts` — owned by plan 005. Don't reorder anything; only add the checks named here.
- The UI components calling these actions — no signature changes are allowed precisely so the UI keeps working unchanged (new fields/args: none).
- `src/lib/openrouter.ts` — the per-call key handling is fine.

## Git workflow

- Branch: `advisor/003-action-input-contracts`
- Commit style: `fix: auth gate + input contracts on server actions`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Gate and cap `extractLead`

In `src/lib/actions/leads.ts`: import the server Supabase client (`import { createClient as createSupabase } from "@/lib/supabase/server";` — same alias style as `clients.ts:5`). At the top of `extractLead`, after the empty-input check:

```ts
const supabase = await createSupabase();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return { data: null, error: "Not authenticated" };
if (input.length > 4000)
  return { data: null, error: "That message is too long — paste just the inquiry text." };
```

**Verify**: `npm run typecheck` → exit 0; `grep -n "getUser" src/lib/actions/leads.ts` → 1 match.

### Step 2: Cap the composer inputs

In `src/lib/actions/messages.ts` `draftMessage`, normalize once where `draft`/`instruction` are read (`:106-107`) and where `property` is read (`:69`):

```ts
const draft = input.draft?.trim().slice(0, 4000);
const instruction = input.instruction?.trim().slice(0, 1000);
const property = input.property?.trim().slice(0, 300);
```

(Truncation, not rejection — these come from the app's own UI; the cap is a server-side backstop.)

**Verify**: `npm run typecheck` → exit 0.

### Step 3: Ownership + path checks on document/attachment writes

`src/lib/actions/documents.ts` `addDocument`: before the insert —

```ts
const { data: { user } } = await supabase.auth.getUser();
if (!user) return { error: "Not authenticated" };
if (!meta.storage_path.startsWith(`${user.id}/${clientId}/`))
  return { error: "Invalid file path" };
const { data: owned } = await supabase
  .from("clients").select("id").eq("id", clientId).maybeSingle();
if (!owned) return { error: "Client not found" };
```

(The RLS-scoped select returns null for any client the caller doesn't own — that IS the ownership check.) Also cap `meta.file_name.length > 200` → error, and `meta.size != null && meta.size > 15 * 1024 * 1024` → error (mirror of the bucket limit in `supabase/migrations/20260601120000_attachments_size_limit.sql`).

`src/lib/actions/buyer.ts` `addViewingAttachment`: same shape — verify the viewing via RLS-scoped `from("viewings").select("id, client_id").eq("id", viewingId).maybeSingle()`; require it exists and `viewing.client_id === clientId`; require `meta.storage_path.startsWith(`${user.id}/${clientId}/`)`.

**Verify**: `npm run typecheck` → exit 0.

### Step 4: Validate `SyncContext`

In `src/lib/actions/notifications.ts`, add a zod schema next to the type and parse at the top of `syncNotifications`:

```ts
const syncContextSchema = z.object({
  nowISO: z.iso.datetime(),          // zod v4 API; z.string().datetime() also works
  dayStartISO: z.iso.datetime(),
  dayEndISO: z.iso.datetime(),
  todayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeZone: z.string().max(64),      // only if plan 002 landed and the field exists
});
...
const parsed = syncContextSchema.safeParse(ctx);
if (!parsed.success) return { error: "Invalid sync context" };
```

**Ordering note**: if plan 002 has NOT landed yet, the type has no `timeZone` — omit that line and leave a `// plan 002 adds timeZone here` comment. If 002 landed, include it. Check `git log --oneline -5` and the type definition first.

**Verify**: `npm run typecheck` → exit 0.

### Step 5: Validate `saveViewing`'s `schedule` and `updateClientStage`'s `stage`

- In `src/lib/validation/buyer.ts` add:

  ```ts
  export const viewingScheduleSchema = z.object({
    scheduled_at: z.iso.datetime().nullable(),
    reminder_minutes: z.number().int().min(0).max(10080).nullable(),
  });
  ```

  In `saveViewing`, `safeParse(schedule)` right after the existing `values` parse; on failure return `{ error: "Please check the form." }` (same message convention).
- In `src/lib/actions/clients.ts` `updateClientStage`: import `BUYER_STAGES, SELLER_STAGES` from `@/lib/crm` and guard:

  ```ts
  const VALID_STAGES: readonly string[] = [...BUYER_STAGES, ...SELLER_STAGES];
  if (!VALID_STAGES.includes(stage)) return { error: "Invalid stage" };
  ```

**Verify**: `npm run typecheck` → exit 0; `npm test` → exit 0.

### Step 6: Reject non-finite numbers in `numericString`

In `src/lib/validation/buyer.ts`, change the non-int branch of the refine from `!Number.isNaN(Number(v))` to `Number.isFinite(Number(v))` (the int branch already implies finiteness via `Number.isInteger`). In `toNumberOrNull`, return null for non-finite: `return Number.isFinite(n) ? n : null;`.

Extend `src/lib/validation/buyer.test.ts` (created by plan 001): `"1e999"` now FAILS `preferencesFormSchema` on `budget_min`; `"1e10"` still passes; `toNumberOrNull("1e999")` → null.

**Verify**: `npm test` → exit 0 including the new cases.

## Test plan

- Extend `src/lib/validation/buyer.test.ts`: the Step 6 cases plus `viewingScheduleSchema` (valid ISO passes; `"yesterday"` fails; `reminder_minutes: -5` fails; both-null passes).
- The auth gate and ownership checks live in modules importing `next/headers` (not unit-testable under plain vitest without heavy mocking — deliberately out of test scope). Their verification is the greps in Done criteria plus type-checking.
- Full suite: `npm test` → exit 0.

## Done criteria

- [ ] `npm run typecheck` exits 0; `npm test` exits 0; `npm run lint` has no new warnings
- [ ] `grep -n "getUser" src/lib/actions/leads.ts` → ≥ 1 match
- [ ] `grep -n "slice(0, 4000)\|slice(0, 1000)" src/lib/actions/messages.ts` → ≥ 2 matches
- [ ] `grep -n "startsWith" src/lib/actions/documents.ts src/lib/actions/buyer.ts` → ≥ 2 matches
- [ ] `grep -n "safeParse" src/lib/actions/notifications.ts` → ≥ 1 match
- [ ] `grep -n "Number.isFinite" src/lib/validation/buyer.ts` → ≥ 2 matches
- [ ] No action's exported signature changed (`git diff` shows no caller edits needed; no UI files modified)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `extractLead` already contains an auth check (drift — the fix landed elsewhere).
- zod v4's API differs from `z.iso.datetime()` / `z.string().datetime()` in this repo's installed version (check `node_modules/zod/package.json` — expected ^4.4.3); report rather than downgrading the validation.
- Any UI component fails typecheck because of these changes — signatures must not have changed; investigate before patching UI files (they're out of scope).
- Plan 002's refactor has restructured `syncNotifications` beyond recognition vs. Step 4's assumption — re-anchor on wherever `SyncContext` is now consumed; if ambiguous, report.

## Maintenance notes

- Every NEW server action should start with either an RLS-scoped query whose absence-result is handled, or an explicit `auth.getUser()` gate — `extractLead` is the cautionary example; cite this plan in review.
- Reviewer: confirm the ownership checks use the **RLS-scoped** client (that's what makes `maybeSingle() === null` mean "not yours"), not the admin client.
- Deferred: rate limiting on the two LLM actions (per-user counters need infra — revisit if OpenRouter spend becomes visible); opaque error messages (finding F7 in `plans/README.md`).
