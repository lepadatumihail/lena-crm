# Plan 015: Agencies as a real object, plus a buyer-registration log

> **Executor instructions**: Follow this plan one phase at a time, step by
> step. Run every verification command and confirm the expected result before
> moving on. If a "STOP conditions" item occurs, stop and report; do not
> improvise. Phases B1, B2 and C have evidence gates (D12): don't start them
> until the gate is recorded as passed in the "Gates" table of
> `plans/README.md`, or the founder says so in chat. When a phase is done, add
> or update row 015 in `plans/README.md` (the row didn't exist when this plan
> was written).
>
> **Drift check (run first)**:
> `git diff --stat 9bad570..HEAD -- src/lib/actions/clients.ts src/lib/actions/notifications.ts src/lib/actions/search.ts src/lib/actions/messages.ts src/lib/data/clients.ts src/lib/data/buyer.ts src/lib/data/seller.ts src/lib/data/attention.ts src/lib/data/dashboard.ts src/lib/data/notifications.ts src/lib/notifications.ts src/lib/home.ts src/lib/crm.ts src/lib/validation/client.ts src/lib/supabase/types.ts src/lib/routes.ts src/lib/legal.ts src/lib/seo.ts src/i18n/messages.ts src/components/clients src/components/shell src/components/home src/components/notifications/notification-item.tsx src/components/landing/feature-grid.tsx 'src/app/(app)/clients' src/app/llms.txt/route.ts src/content/pages src/content/legal messages/en messages/es supabase/migrations vercel.json`
> Plans 011, 012, 013, 014, 016 and 017 were written the same day and may
> have landed first, so their files will show up. For anything else that
> changed, compare it with "Current state" first. Two changes from that batch
> matter most here:
> - plans 016 and 017 redefine the `clients_set_updated_at` trigger function
>   (Step B1.1 reads it and merges);
> - plan 016 changes `AttentionContext` (Step B2.8 follows it).
>
> A mismatch you can't reconcile is a STOP condition.
>
> **Shared working tree**: other Claude sessions may be editing this checkout at
> the same time. Stage only the files this plan names (`git add <path>`), never
> `git add -A`, and don't touch changes you didn't make. Use your own folder
> under `src/app/preview-tmp/` and never delete the whole `preview-tmp`.
> Several batch plans edit the same content files on different lines: match
> the text to replace, never trust a line number after another edit landed.

## Status

- **Priority**:
  - A0 and A: P1, before the 21 Sep 2026 outreach.
  - B1 and B3: P2, once B1's evidence gate passes.
  - B2: P2, once its gate passes.
  - C and D: P3.
- **Effort**: about 9–10 days for A0 + A + B1 + B2 + B3:
  - A0: 0.5 d. Applied by **plan 016 Step 0.1**, the one combined
    interim-copy commit for all five batch plans (013, 014, 015, 016, 017):
    one `PUBLISHED` bump, one push (see A0.0).
  - A: 1 d
  - B1: 3–3.5 d (migration with rehearsal, rollback and live apply; picker;
    two routes; breadcrumb; en/es; visual checks)
  - B2: 3.5–4 d
  - B3: 1 d
  - C (gated): re-estimate when it is re-planned (the outline suggests 4–5 d).
    D: about 0.5 d on top of plan 016 Phase 2.
- **Risk**:
  - A0 and A: LOW. No schema change.
  - B1: MEDIUM. A live migration on `clients`, the core table. It adds a
    column and a trigger and replaces the `updated_at` trigger function,
    which plans 016 and 017 also redefine (each merges the live skip array,
    never overwrites it). The `clients` RLS policy is left
    unchanged (see B1.2's notes). It is covered by a rehearsed rollback file,
    lock timeouts and a quiet-hour apply.
  - B2: MEDIUM. A new table with four ownership checks, plus a new
    notification type.
  - B3: MEDIUM. It drops a column, so the code has to stop naming it first
    (contract order).
  - C: HIGH. Money semantics (VAT, IRPF, staged payments) and competition law.
- **Depends on**:
  - A0: the founder's P3 choice and approval of the wording.
  - A: nothing.
  - B1: A live, plus its gate. Before writing the migration, read the live
    trigger function (plans 016/017) and merge its skip keys. No ordering
    against plans 011/012 is
    required:
    - if 011 has landed, B1 adds agencies to the export;
    - if 012 or 014 has landed, their RPCs keep working through B1's trigger.
  - B2: B1 live, plus its gate.
  - B3: B1 live for at least 7 days. The import (012) and lead-inbox (014)
    RPCs write `agency_id` (or aren't built), and export (011) reads the join.
  - C: B1 (B2 preferred), plus its gate.
  - D: plan 016 Phase 2 live.
- **Gated by** (details in D12):
  - A0 and A: no evidence needed.
  - B1: score A or G.
  - B2: score G.
  - Score G keeps the earlier checkpoint (first 5 interviews, target Fri
    2 Oct 2026) as a deliberate exception to D-D (E6): B1 is cheap and
    early. Every other new score letter uses Fri 9 Oct 2026 and the first 8
    solo agents.
  - C: score F at Fri 9 Oct 2026.
  - D: plan 016 Phase 2 landing.
- **Category**: feature
- **Planned at**: commit `9bad570`, 2026-09-16 (revised the same day after
  review; re-checked on 2026-09-17 against the source and the revised plans
  012–017)

## Why this matters

- **The site makes a claim the code doesn't back.**
  - `messages/en/landing.json` → `features.items.agencies` (`:59-63`):
    "One CRM for every agency you sell for", with the body "Tag each lead with
    the agency it came through…".
  - `faq.items.agencies.a` (`:251-254`) says "That is exactly what LeadWing is
    built for". `/pricing` shows the same FAQ (`PRICING_FAQ`,
    `src/components/marketing/pricing-page.tsx:77`).
  - The same claim appears in:
    - `billing.json` → `pricingPage.features.agencies` ("Multi-agency",
      `:221-224`)
    - `src/app/llms.txt/route.ts:47` and `:67`
    - `src/content/pages/crm-marbella.{en,es}.tsx` (the "You sell for more
      than one agency" section and the FAQ)
    - the hub page `src/content/pages/crm-spain.{en,es}.tsx` ("whose listing
      it was and whose commission you are splitting", and the FAQ)
    - `src/content/pages/about.{en,es}.tsx` (the "Agency tags" bullet and "Why
      it exists")
  - In code, "multi-agency" is one free-text column, `clients.agency`. It
    can't be filtered, has no list and no page, and "Solvilla", "solvilla "
    and "SOLVILLA" are three values.
- **The founder asked to build the claims, not reword them** (16 Sep 2026).
  This plan makes the claim true in steps:
  - A: tag, reuse and filter.
  - B1: an agency list and a page per agency.
  - B2: a dated registration record.
  - C: money per agency, gated.
- **It is the one positional edge the competitive brief found**: an
  agent-owned book across agencies. Rivals sell listing machinery to agencies.
- **The registration log is the reframe from the agent-voice research.**
  Instead of "multi-agency chaos": a dated record of every buyer you introduce,
  and on what terms. What the evidence supports:
  - **One** developer-marketing agreement from Benalmádena (Rosso
    Inmobiliaria 21 S.L., 2024; Rosso markets on a developer's behalf and is
    not itself a developer) requires written confirmation, the buyer's name,
    surnames and DNI/NIE, and a one-month window. It also requires the
    collaborating agency (which signs with a CIF) to go with the client to the
    development.
  - Other agreements reportedly use 2- or 4-month windows, and about 6 months
    for resale in Estepona (agent-voice research, **not re-verified**).
  - That Resales Online viewing requests work as de facto registrations is
    **the research's reading**. Resales' own help article calls them
    appointments.
  - The pain is not proven, hence the gates.
- **Cheap to run**: under €0.01 per agent per month for A–C (see "Costs").

## Options considered

| Option | Verdict |
|---|---|
| O1 Reword only | Rejected: the founder asked to build. Reword only as the interim (A0). |
| O2 Phase A only (suggestions + filter, no migration) | **Recommended as the first step.** No migration; can land before 21 Sep. |
| O3 Agencies table + page (expand/contract), then the registration log | **Recommended** (B1–B3, then B2), each behind its evidence gate. |
| O4 Registration log on free-text counterparties | Rejected: the per-counterparty default window has nowhere to live, names drift, and it would be migrated twice. |
| O5 Many-to-many agency tags on clients | Rejected: it mixes "who I work with on this client" with "whom I registered with", and tags carry no dates. |
| O6 Money first (deals before registrations) | Kept, but as Phase C behind the hard gate. No public evidence of late splits yet. |
| O7 Shared agency directory across users | Rejected: breaks tenancy, raises GDPR questions, edges toward the conduct in CNMC S/0003/20. |
| O8 Email expiry reminders now | Deferred to D, which rides on plan 016 Phase 2's daily digest. |

## Decisions (open — founder to confirm)

Every row is **open — founder to confirm**. The executor builds the
recommended answer unless the founder says otherwise in chat.

| # | Topic | Recommended | Alternative |
|---|---|---|---|
| D1 | What does a client's agency tag mean? | **Neutral until the interviews answer it (P3).** Copy and the form hint say "the agency you're working with on this client": your own agency, or the one you co-broke with. Before B1 starts, the founder fixes the meaning from what the first interviewees say they would type (P3). Either way, the counterparty of a registration (B2) and the parties of a deal (C) are separate fields. Fix the Idealista guide sentence. `{{agency}}` in templates ("Soy {tu nombre}, de {agencia}") reads best as your side; review it when D1 is fixed. | "Your side" now (the first sketch: the agency you work the client through, with co-broking value only arriving in B2), or "listing agency". |
| D2 | Ship A before 21 Sep? | **Yes.** A0 ships with the **fallback** strings on Thu 17 Sep 2026. A and the "A live" strings ship **in one push** on Fri 18 Sep 2026. B1 waits for its gate (D12), and no live migration runs between 18 and 21 Sep. | Build B1 now: a live migration during outreach week, with no evidence. |
| D3 | Suggestion UI | **In-app chips** under the input: the 8 most-used names, narrowed as you type; a tap fills the field. No new dependency. B1 replaces them with a Popover picker that has "Create "X"" and a kind choice. | Native `<datalist>` (partial support in iOS Safari), or add `cmdk`. |
| D4 | Agency kinds | **Two: `agency`, `developer`.** No agency = direct. An existing "Direct" text value is left as-is; the agencies page shows a hint to delete or merge it. | Add `network` (Resales, PropertyList). But Resales is a channel, not a counterparty. |
| D5 | Default registration window | **No product-wide default.** Each agency has an optional "registration valid for N months" (1–36), asked on the first registration and offered as "save as default for X". Each registration keeps its own months and `expires_on`. | A global 6-month default: wrong for new builds, and an invented norm. |
| D6 | When does validity start? | **`confirmed_on` if set, otherwise `sent_on`.** `expires_on` stays editable. | Always `sent_on`. |
| D7 | Reminder timing and channel | **In-app only.** One bell row per registration per `expires_on`, from 14 days before to 7 days after, retitled on each sync; a matching Home item. Copy says "a reminder in LeadWing", never "we'll email you". | Two pings (14 and 3 days); email now (O8). |
| D8 | Statuses and methods | Statuses: **`pending`, `confirmed`, `declined`, `closed`**. Methods: **`email`, `resales_request`, `developer_form`, `viewing_sheet`, `other`**. Expired is computed, not stored. Both are `text` columns with a CHECK. | Postgres enums: values could never be removed. |
| D9 | Where proof files live | **A new table, `registration_files`**, cloned from `property_attachments`. Files go under `{agent}/{client}/registrations/…`, so bucket policies and `useFileUpload` work unchanged. | A `registration_id` + `kind` on `documents`. |
| D10 | Store the buyer's DNI/NIE on a registration? | **No field.** The agent sends it to the developer; LeadWing keeps the dated record and an optional proof file. Proof files **will often contain ID numbers** (developer forms, confirmation emails), so the privacy page and the DPA annex say so (B2.10). | An ID field: sensitive data for little gain. |
| D11 | Plan gating | **Every plan.** The Free cap stays the only difference (`src/lib/access.ts:4-16`). | Pro-only registrations. |
| D12 | Evidence gates (denominators from the consolidated scorecard, P1) | **A0 and A: none.** **B1:** ≥ 3 of the first 5 interviews green on A (consolidation) or on G (registrations), or an explicit go from the founder in chat. **B2:** ≥ 3 of the first 5 green on G. The mock-up is shown only after scoring. G's first-5 checkpoint (target Fri 2 Oct 2026) is a deliberate, stated exception to the batch's Fri 9 Oct / first-8 rule (D-D, E6), because B1 is cheap and early. **C:** ≥ 3 of the first 8 solo agents green on F at the Fri 9 Oct 2026 checkpoint, the script's feature-bet rule. | Build B1 with no gate. Once A0 and A ship, the reworded claims are backed; only the optional "After B1" sentence needs B1. |
| D13 | Agency edits don't "touch" the client | **Yes, through the batch's shared function** `public.clients_touch_updated_at()`, the form plans 016 and 017 use. Its skip array covers `updated_at`, `agency` and `agency_id`, plus every key the live function already skips. Whichever of B1 and plan 016 Phase 1 lands first creates the function with the shared skip array; every later plan (015, 016, 017) first reads the live function and **merges** its keys into the array, never overwriting it. A backfill, merge, rename or agency delete never moves `updated_at`. Until plan 016 Phase 1 lands, this protects the quiet-buyer nudges. After it, the nudges key off `last_contacted_at`, so this protects only list order and the "Updated …" labels. Side effect (the same as in 016): a no-op update no longer bumps `updated_at`. | Keep bumping. A merge would then re-sort and "touch" every client it moves. |
| D14 | B1 reads | **Keep reading the name from `clients.agency`** during B1. A trigger keeps it an **exact copy** of `agencies.name` on insert, a text write, an id write, a rename, a merge and the FK's set-null. Use `clients.agency_id` for links and filters. B3 switches reads to the join and drops the text. This keeps B1 small, and nothing breaks if a deploy lands before the migration. | Switch every read to an `agencies` embed in B1. |
| D15 | In C, what happens to `reservations.commission` / `closed_at`? | **Deals become the only source.** Copy the live row across, point `getCommissionSummary` at deals, keep the reservation columns read-only for one release, then drop them. | Keep both sources: they can disagree. |
| D16 | Deal cardinality (C) | **One deal per buyer** (`client_id` primary key, like reservations). | Several deals per buyer. |
| D17 | Money figures (C) | **Amounts before VAT, plus the amount actually received.** Never compute VAT or IRPF. Never number or generate invoices: record the reference, date and file of an invoice issued elsewhere. Percentages only as the agent's own per-agency saved terms. **Split fields start empty** unless the agent saved their own term; never a pre-filled or suggested split (50/50 included), never another agency's terms. | Compute VAT/IRPF. |
| D18 | The pre-filled 5% fee in the signed-in calculator (`calculator-screen.tsx:65`, DB default 5 in `20260614120000_deal_analyses.sql:35`) | **Out of scope here.** A separate small change should empty it or label it as the agent's own, for consistency with "no product-wide %". | Keep it. |
| D19 | When and how B3 drops `clients.agency` | **≥ 7 days after B1 is live, in contract order**: 1. code that no longer names the column is live; 2. consistency probes pass; 3. a private backup; 4. the drop. The import (012) and lead-inbox (014) RPCs must write `agency_id` first (or not be built), and export (011) must read the join. | Keep the mirror forever. With D13 that is harmless, but it is two sources. |
| D20 | Headline | **Keep "Your clients, properties, and offers. Made simple."** until C ships and passes its gate. Then consider "Every client and every commission, across all your agencies." | Switch after B2 to "A dated record of every buyer you introduce". |
| D21 | List commission cells (A) | **Sum over the rows on screen** (`filtered`). This changes the totals even with no agency filter: hidden inactive clients and the stage tab drop out. The cells say so ("Pipeline (shown)" / "Closed (shown)"). Home keeps the all-clients figure. | Compute "Closed" over every row matching the agency filter, inactive included; or hide the cells while any filter is on. |
| D22 | Is the B1/B2 Terms change "material" (Terms §16, 30-day email)? | **No.** The DPA annex gains the agency and developer contacts and the registration records the agent enters themselves. The purpose and the sub-processors don't change. Bump `LEGAL_UPDATED.terms` so the page shows the date. | Treat it as material: email every agent 30 days ahead. That needs `RESEND_API_KEY` on Vercel and the legal entity details filled. |
| D23 | Phase C table names | **`commission_deals`, `commission_payments`, `commission_deal_files`.** `deal_analyses` already owns `src/lib/{actions,data}/deals.ts` and `src/lib/validation/deal.ts`, and `deal_type` is an enum on `clients`. | Rename the calculator modules instead. |
| D24 | FK action for a registration's counterparty | **The default NO ACTION.** A direct delete of an agency that has registrations still fails with 23503. An account deletion that cascades to both tables succeeds. Both NO ACTION and RESTRICT passed that multi-path test (temp tables on the live PG 17.6, 16 Sep 2026). NO ACTION is the more forgiving of the two within a single statement. | `on delete restrict`. |

## Current state (verified 2026-09-16 at `9bad570`; claim lines and shell/attention references re-checked 2026-09-17, HEAD unchanged)

All paths are relative to the repo root.

1. **Schema.**
   - The only agency data is `clients.agency text`
     (`supabase/migrations/20260529120000_init.sql:47`): no FK, no index, no
     list.
   - The only policy on `clients` is "agent owns clients", for all commands
     (`init.sql:251-254`).
   - Triggers on `clients`:
     - `clients_set_updated_at`, BEFORE UPDATE, no WHEN, running
       `public.set_updated_at()` (`init.sql:63-65`; function at `:19-29`)
     - `clients_enforce_free_limit`, BEFORE INSERT
       (`20260906120000_billing_referrals.sql:150-151`; the function was
       replaced for the 10-client cap in `20260916120000_free_client_limit_ten.sql`).
       Admins count as Pro (`20260906130000_admins_are_pro.sql`).
   - **Plans 016 and 017 (same batch, not built)** re-point
     `clients_set_updated_at` to a new `public.clients_touch_updated_at()`
     with a `skip` array (both re-read 17 Sep 2026, after their own
     revisions):
     - 016 Phase 1 Step 2 creates it with
       `['updated_at', 'last_contacted_at', 'wa_contact_id']` and re-binds
       the trigger (the `clients_touch_updated_at` function in 016's Phase 1
       migration step, "Step 2: The migration").
     - 017 replaces only the function, merging `wa_contact_id` into the live
       array (its "clients.updated_at: linking is not an edit" block). It
       hard-depends on 016 Phase 1 and never creates the function itself
       (E4). It no longer adds a `phone_digits` column; it matches on an
       expression index instead.
     - Batch rule: whichever of B1 and 016 Phase 1 lands first creates the
       function with the shared skip array; any later plan (015, 016, 017)
       reads the live function first and merges its keys into the array,
       never overwrites it (D-E). Only B1 or 016 Phase 1 can create it
       (E4). 017's pre-flight (Step 4.0.3; Step 4.0.2 checks that the quiet
       rule reads `last_contacted_at`) looks for that skip array, not a
       `WHEN` clause. Any `WHEN` wording still found in 017 is this plan's
       first sketch; the live function is what counts.
     - Under that function, an UPDATE that sets only `updated_at` is
       reverted to the old value. An INSERT keeps an explicit `updated_at`.
   - `reservations` is 1:1 per buyer (`init.sql:129-141`) with `commission`
     and `closed_at` (`20260529130000_reservation_commission.sql:2-4`).
   - Latest migration file: `20260916120000_free_client_limit_ten.sql`. Plan
     012 reserves `20260916150000`. Plans 013, 014, 016 and 017 each pick "the
     build day at 120000, after `20260916150000`", so two of them can collide.
   - RLS precedent (an FK check ignores RLS, so the policy must check the
     parent): `20260915120000_tasks.sql:92-110` and
     `20260915140000_property_attachments.sql:38-51`.
   - **The whitespace pitfall is already documented**:
     `20260915120000_tasks.sql:40-42` (`btrim()` strips only spaces).
   - Template for a file table: `property_attachments`
     (`20260915140000_property_attachments.sql:16-51`), which uses the enum
     `property_attachment_kind ('pdf','image')`.
   - Storage: the private bucket `attachments` only allows paths whose first
     folder is `auth.uid()` (`init.sql:305-335`), with a 15 MB cap
     (`20260601120000_attachments_size_limit.sql`).
   - Notifications:
     - `notification_type` enum: `20260601130000_calendar_notifications.sql:13-19`.
     - `task_due` was added with `ADD VALUE` and not used in the same file
       (`tasks.sql:112-116`).
     - `notifications.task_id` cascades (`tasks.sql:118-122`).
     - Unique `(agent_id, dedupe_key)`: `calendar_notifications.sql:63-64`.
   - **Live DB, probed read-only 16 Sep 2026** (catalog facts and aggregates
     only):
     - PostgreSQL 17.6. Encoding UTF8, `datctype` en_US.UTF-8, locale
       provider ICU (`datlocprovider = 'i'`, `datlocale = 'en-US'`).
       `lower('VÖLKERS')` is `völkers`, and `normalize(…, NFC)` composes a
       decomposed ö.
     - Regex `\s` matches tab, newline, CR, FF, VT, NBSP (U+00A0), U+202F and
       U+3000, but **not** U+200B or U+FEFF. JavaScript's `\s` **does** match
       U+FEFF.
     - `regexp_replace(btrim(E'\tSolvilla'), '\s+', ' ', 'g')` returns
       `' Solvilla'`: the first sketch's cleaning order was wrong.
     - `normalize`, `regexp_replace`, `replace`, `btrim`, `rtrim` and `lower`
       are all IMMUTABLE.
     - Two non-internal triggers on `clients`: `clients_enforce_free_limit`
       and `clients_set_updated_at`. The latter runs `set_updated_at`, with
       no WHEN. `clients_touch_updated_at()` doesn't exist.
     - One policy on `clients`.
     - `supabase_migrations.schema_migrations` columns: `version`,
       `statements`, `name`. Newest version: `20260916120000`.
     - `notification_type`: appointment_reminder, appointment_today,
       follow_up, reservation_date, stalled_offer, task_due. There is no
       `notifications.registration_id`.
     - `clients` has none of `agency_id`, `last_contacted_at`,
       `wa_contact_id` or `phone_digits`.
     - `agencies`, `buyer_registrations`, `registration_files`,
       `client_contacts`, `client_imports` and `wa_connections` don't exist.
     - The `authenticated` role has `statement_timeout=8s`.
     - 10 profiles. One admin, who has 5 active clients.
     - 4 clients have an agency: 4 distinct (agent, name) groups, no blank
       values, no edge or double whitespace, longest 9 characters.
     - Earlier the same day (REST probe): 14 clients across 6 agents, 0
       buyers with `deal_type = 'collab'`, 2 reservations (1 with a
       commission, 1 closed).
2. **Types.** `src/lib/supabase/types.ts` is hand-written (header `:1-3`).
   `clients.agency` is at `:30/:50/:70`. The `notification_type` union is at
   `:928-934`, and `property_attachment_kind` is at `:924`.
3. **Writes.**
   - `optionalText(120)` caps the agency (`src/lib/validation/client.ts:17`).
     `optionalText` is `z.string().trim().max(n).optional().or(z.literal(""))`
     (`:5-6`), so it **rejects `null`**.
   - `createClient` (`src/lib/actions/clients.ts:54-102`) writes
     `agency: v.agency || null` at `:84`.
   - `updateClient` (`:104-135`) does the same at `:123`. It calls no
     `getUser()` and relies on RLS.
   - No trimming or matching of existing spellings.
   - `deleteClient` (`:137-187`) collects bucket paths for documents, viewing
     attachments and property attachments before the cascade.
   - Ownership-check template for files: `addPropertyAttachment`
     (`src/lib/actions/seller.ts:85-127`).
   - Every existing action returns the raw `error.message` (audit finding
     F7). New actions must not.
   - There are **no action tests** anywhere in the repo.
4. **Form.**
   - The agency field is a plain `Input` (`src/components/clients/client-form.tsx:294-307`,
     default `''` at `:84`).
   - Copy is at `messages/en/clients.json:110-112` ("Which agency is this
     client for?"), with the Spanish twin at the same lines.
   - Callers:
     - `/clients/new` (`src/app/(app)/clients/new/page.tsx`)
     - `/clients/[id]/edit` (`…/edit/page.tsx`): its `defaultValues` are at
       `:27-40`, and the agency pre-fill is at `:35`.
   - `src/components/ui` has `popover.tsx`, `tag.tsx`, `notice.tsx` and
     `select.tsx`, but no combobox or `cmdk`.
   - `DatePicker` is in `src/components/date-time-picker.tsx:29`, and
     `ConfirmDialog` in `src/components/confirm-dialog.tsx:19`.
5. **Where the agency is read** (display and search only, never a filter):
   - `clients-table.tsx:312-319`
   - `clients-kanban.tsx:61-62`
   - `client-sheet.tsx:143`, `:278-279`
   - `client-detail-view.tsx:194` (header meta), `:343` (template vars),
     `:482-486` (Details row)
   - `clients-view.tsx:143` (search haystack)
   - ⌘K search:
     - `src/lib/actions/search.ts`: `searchIndex()` **takes no query**. It
       loads up to 500 active clients once, selecting `agency` explicitly
       (`:17-41`, select at `:28`).
     - `src/components/shell/quick-search.tsx` filters in the browser
       (`:88-100` load, `:131-150` filter and hint).
   - `src/lib/message-templates.ts:193/:242` (`{{agency}}`)
   - `src/lib/actions/messages.ts:26/:58`: selects `agency` and sends
     "Agency: X" to OpenRouter. The privacy page lists "agency tag" at
     `src/content/legal/privacy.en.tsx:187-191` (§5).
6. **Client list** (`src/components/clients/clients-view.tsx`):
   - `visible` is at `:119`, `stageCounts` at `:126`, and `filtered` at
     `:133-149` (priority, stage, type, search).
   - `changeStageFilter` (`:160-168`) syncs `?stage=` with `replaceState`.
   - `toggleInactive` (`:216-218`) `router.push`es a URL that drops every
     other param.
   - `typeOptions` is at `:220-225`, and the toolbar at `:272-320` (the
     `FilterSelect` for Type is at `:292-297`).
   - `Summary` (`:424-536`) gets `rows={filtered}`, but its commission cells
     (`:521-533`, labels `summary.commission` / `summary.closed`) come from
     `getCommissionSummary()` over **all** reservations
     (`src/lib/data/buyer.ts:58-76`, called at
     `src/components/clients/clients-screen.tsx:25`).
   - `FilterSelect` is at `src/components/shell/toolbar.tsx:22-63`. It is a
     Radix Select, so no option may have the value `""`.
   - The pages pass only `view`, `inactive` and `stage`
     (`src/app/(app)/clients/buyers/page.tsx:3-16`, the sellers twin, then
     `clients-screen.tsx:7-38`).
   - `getClientRows` (`src/lib/data/clients.ts:55-76`) embeds
     `buyer_preferences`, `properties(price)` and `viewings(count)`, but
     not `reservations`. `ClientRow` and `toRow` are at `:6-48`.
7. **Attention and notifications.**
   - `getAttentionSignals` (`src/lib/data/attention.ts:77-164`) throws on
     any query error (`:110-112`). Its three queries have **no `agent_id`
     filter** and rely on RLS.
   - Its callers:
     - `syncNotifications` returns an error for the whole sync
       (`src/lib/actions/notifications.ts:287-295`).
     - `getNeedsAttention` (`src/lib/data/dashboard.ts:192-286`) throws into
       Home's Suspense.
   - **Tests**: `src/lib/data/attention.ts` has none.
     `src/lib/attention.test.ts` covers only the pure helpers, and plan 002
     owns it (`plans/README.md`). Plan 016 Step 10 creates
     `src/lib/data/attention.test.ts` with a recording fake client.
   - `isMissingTableError` is at `src/lib/supabase/errors.ts:13-15`.
   - `AttentionContext = { nowISO, todayKey }` (`attention.ts:19`). Plan 016
     Step 10 changes it to `{ agentId, nowISO, todayKey, timeZone }` and adds
     `.eq("agent_id", ctx.agentId)` to every query. Plan 016 Step 13 then
     runs it with the service-role client for every agent.
   - Date helpers:
     - `src/lib/attention.ts` exports only `calendarDaysFromToday` (`:33-40`)
       and formatters. There is no `addDays` for date keys.
     - `dateKeyInTimeZone` and `dayRangeInTimeZone` are in `src/lib/home.ts`
       (`:103`, `:63`).
   - Keys that must stay optional on upserted rows (the PGRST204 lesson):
     `notifications.ts:62-66`.
   - Task pings:
     - They use the profile zone and the server clock (`taskTodayKey`,
       `:104-111`).
     - Their `due_at` is deliberately **in the past** (`:344-348`).
     - They use separate message keys (`taskOverdue` / `taskDue`, `:360`).
   - Upsert at `:377-384`: it refreshes title, body and `due_at` and leaves
     `read_at` alone. The 30-day read prune (`:386-397`) excludes
     `task-due:%`. The stale task-ping cleanup is at `:399-427`.
   - The bell sorts by `read_at` (unread first), then by `due_at desc`
     (`src/lib/data/notifications.ts:17-18`). The notifications page files
     each row under its due day.
   - The bell syncs on mount and every 5 minutes
     (`src/components/notifications/notifications-bell.tsx:65-78`).
     `vercel.json` has no cron.
   - `notificationHref`: `src/lib/notifications.ts:11-22`, tested in
     `src/lib/notifications.test.ts`.
   - `messages/{en,es}/notifications.json` list every type under `types`
     (e.g. `types.task_due`).
   - `ICONS`/`TONES` are exhaustive Records
     (`src/components/notifications/notification-item.tsx:22-38`).
   - `AttentionItem.kind`: `dashboard.ts:176-182`. Reservation items are
     pushed first (`:225-245`).
   - `KIND_TONE`: `src/components/home/attention-list.tsx:8-13`.
     `ATTENTION_LIMIT = 8`: `src/components/home/home-panels.tsx:37`.
   - Tones: `src/lib/tones.ts:10-22`.
   - Quiet buyers are keyed to `clients.updated_at` (`attention.ts:96-102`).
8. **Buyer page** (`src/app/(app)/clients/[id]/page.tsx`):
   - It loads in one `Promise.all` (`:31-51`).
   - `client-detail-view.tsx` is a **server component** (it imports
     `next-intl/server`). The buyer block renders Preferences → Matching →
     Viewings → Reservation (`:504-518`), and Documents for both sides
     (`:545-549`).
   - `getProperties(clientId)` (`src/lib/data/seller.ts:64`) is per client.
     No loader lists all of an agent's listings.
   - `Panel` (`src/components/shell/panel.tsx:12-30`) has no `id` prop.
   - `AttachMenu`/`AttachmentChip` (`src/components/clients/attachments.tsx:33`,
     `:130`) offer PDF and image.
   - `useFileUpload` builds
     `${agentId}/${clientId}/${folder}/${uuid}-${name}`
     (`src/components/file-upload.tsx:27-58`).
   - Null-on-bad-id pattern: `getTaskById` returns `null` on
     `isMissingTableError` or code `22P02` (`src/lib/data/tasks.ts:127-132`).
9. **Routing and shell.**
   - `PROTECTED_PREFIXES` is at `src/lib/routes.ts:14-26`.
     `src/lib/routes.test.ts:63-75` fails if the list and `src/app/(app)`
     drift apart, and robots.txt reuses the list.
   - Sidebar items: `src/components/shell/app-sidebar.tsx:200-225`.
   - App-bar titles: `src/components/shell/app-bar.tsx:60-90`, namespace
     `nav`.
   - **The breadcrumb is client-only in three places**:
     - `app-bar.tsx:51` sets `onRecord = clientRecordId(pathname) != null`,
       and `:104` renders the crumb only then.
     - `app-sidebar.tsx:145-147` has the same gate.
     - `ShellCrumbValue = { side, label }`
       (`src/components/shell/shell-context.tsx:16`). `ShellCrumb`
       destructures `{ side, label }` and uses them as effect deps
       (`:70-78`).
     - `clientRecordId` is in `src/lib/crm.ts:44-49`, tested in
       `src/lib/crm.test.ts:69-79`.
   - ⌘K navigation items: `quick-search.tsx:103-118`.
   - i18n namespaces are registered in `src/i18n/messages.ts`.
10. **Marketing and legal.**
    - Claim sites are listed under "Until this ships".
    - `PUBLISHED` dates: `src/lib/seo.ts:73-79`. `LEGAL_UPDATED`:
      `src/lib/legal.ts:26-30`.
    - **Tests**: there is no test for `seo.ts` or the JSON-LD, and no test
      reads the content modules.
    - Privacy:
      - The client-data list is §4 (`privacy.en.tsx:148-154`,
        `privacy.es.tsx:151-157`).
      - The AI section is §5 (`privacy.en.tsx:180-207`).
    - Terms:
      - DPA annex §A "What is processed" is at `terms.en.tsx:217-234`
        (`terms.es.tsx:223-241`).
      - Data subjects: "your buyers, sellers, prospects and their contacts"
        (`:233` / `:240`).
      - §16 promises a 30-day email for material changes (`:188-193` /
        `:192-197`).
    - The landing tags name real agencies with no non-partnership sentence
      (`landing.json:62`, rendered by `AgencyChips`,
      `src/components/landing/feature-grid.tsx:59-83`).
11. **Meaning drift.**
    - The form asks "Which agency is this client for?"; the landing says "the
      agency it came through".
    - The Idealista guide tells agents to put "whose listing it was" there
      (`src/content/pages/guide-idealista.en.tsx:248-250`,
      `guide-idealista.es.tsx:252-254`).
    - So stored values may name either side.
12. **Next.js 16.2.6** (bundled docs):
    - Dynamic `params` is a Promise
      (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md:18-26`).
    - Server Functions are reachable by direct POST, so each must verify auth
      (`01-app/01-getting-started/07-mutating-data.md`).
    - `revalidatePath` inside a Server Function refreshes the current UI
      (`03-api-reference/04-functions/revalidatePath.md:14-17`).
    - Files with `"use server"` may export only async functions.
13. **Tooling.**
    - CI runs typecheck → lint → test → build (`.github/workflows/ci.yml`).
    - `.env.local` holds `SUPABASE_DB_URL`, `NEXT_PUBLIC_SUPABASE_URL` and
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`. They are **not** exported in the
      shell, so load them with `node --env-file=.env.local`.
    - There is no psql and no global Supabase CLI. Install `pg` in the
      session scratchpad (`npm i pg --prefix <scratchpad>`).
14. **Name clash for Phase C**: `deal_analyses` (the calculator) owns
    `src/lib/actions/deals.ts`, `src/lib/data/deals.ts` and
    `src/lib/validation/deal.ts`. The `deal_type` enum
    (`init.sql:11`, `:49`) is a column on `clients`.
15. **Other plans from the same batch** (written 16 Sep 2026, uncommitted,
    nothing built):
    - 011 export and 012 import
    - 013 Google Calendar sync
    - 014 portal lead inbox. Its intake RPC inserts `clients.agency` as text
      (`public.capture_inbound_lead` in 014's migration).
    - 016 real contact and reminders
    - 017 WhatsApp coexistence

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 |
| Lint | `npm run lint` | exit 0 (existing warnings OK) |
| Tests | `npm test` | exit 0, all pass |
| Build | `npm run build` | exit 0 |
| One test file | `npx vitest run src/lib/agencies.test.ts` | all pass |
| DB script | `node --env-file=/Users/lepadatumihail/Documents/work/personal/lena/.env.local <scratchpad>/<script>.mjs <args>` | prints only `ok` lines |
| Table probe (no DB URL) | `node --env-file=.env.local -e 'fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/agencies?select=id&limit=1", { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY } }).then(async (r) => console.log(r.status, (await r.text()).slice(0, 60)))'` | `200 []` = exists; `404 …PGRST205…` = missing |
| Apply a migration | `node --env-file=… <scratchpad>/apply-migration.mjs <file> <version> <name>` (Step B1.4) | `applied <version>` |

Never print the connection string or any client name. Report aggregates only.

## Suggested executor toolkit

- **Seeing signed-in UI without signing in**: render the component from
  `src/app/preview-tmp/<your-own-folder>/page.tsx` with mock props. Never use
  a `_`-prefixed folder. Delete only your own folder afterwards, then check
  that `.next/types` and `.next/dev/types` no longer mention it.
- Radix Popover, Select and Dialog can freeze in the in-app Browser pane. Use
  the chrome-devtools MCP against the running dev server's port.
- **Overflow checks at 375 px**: walk the elements by min-content width to find
  the one forcing the overflow. Spanish copy runs wider, so check `/es` too.
- Before Step B1.7, read the Radix Popover docs bundled in
  `node_modules/@radix-ui/react-popover`.

## Scope

**In scope** (the only files to create or modify, by phase):

- **A0**:
  - `messages/{en,es}/landing.json`, `messages/{en,es}/billing.json`
  - `src/app/llms.txt/route.ts`
  - `src/content/pages/crm-marbella.{en,es}.tsx`,
    `src/content/pages/crm-spain.{en,es}.tsx`,
    `src/content/pages/guide-idealista.{en,es}.tsx`,
    `src/content/pages/about.{en,es}.tsx`
  - `src/lib/seo.ts` (`PUBLISHED` only)
  - `src/components/landing/feature-grid.tsx` (the comment at `:59` only)
  - `messages/{en,es}/clients.json` (`form.agencyDescription` only)
- **A**:
  - `src/lib/agencies.ts` + `agencies.test.ts` (new)
  - `src/lib/data/clients.ts`, `src/lib/actions/clients.ts`
  - `src/components/clients/client-form.tsx`, `clients-view.tsx`,
    `clients-screen.tsx`
  - `src/app/(app)/clients/{buyers,sellers}/page.tsx`,
    `src/app/(app)/clients/new/page.tsx`,
    `src/app/(app)/clients/[id]/edit/page.tsx`
  - `messages/{en,es}/clients.json`
  - the A-live strings in A0's files (same push)
- **B1**:
  - `supabase/migrations/<ts>_agencies.sql` (new)
  - scratchpad only, never committed: `probe-agencies.mjs`,
    `rehearse-agencies.mjs`, `rollback-agencies.sql`,
    `apply-migration.mjs`, `pre-b1-touch-fn.sql`
  - `src/lib/supabase/types.ts`
  - `src/lib/validation/agency.ts` + `agency.test.ts` (new),
    `src/lib/validation/client.ts`
  - `src/lib/actions/agencies.ts`, `src/lib/data/agencies.ts` (new)
  - `src/lib/actions/clients.ts`, `src/lib/actions/search.ts`
  - `src/lib/agencies.ts` + test (B1 filter helpers)
  - `src/lib/crm.ts` + `src/lib/crm.test.ts` (`agencyRecordId`)
  - `src/components/agencies/*` (new: `agency-picker.tsx`,
    `agency-dialog.tsx`, `merge-agency-dialog.tsx`, `agencies-view.tsx`,
    `agency-detail-view.tsx`)
  - `src/components/clients/client-form.tsx`, `clients-view.tsx`,
    `clients-screen.tsx`, `client-detail-view.tsx`, `client-sheet.tsx`
  - `src/components/shell/app-sidebar.tsx`, `app-bar.tsx`,
    `quick-search.tsx`, `shell-context.tsx`
  - `src/app/(app)/agencies/page.tsx`, `src/app/(app)/agencies/[id]/page.tsx`
    (new), plus the client pages from A
  - `src/lib/routes.ts`
  - `messages/{en,es}/agencies.json` (new), `nav.json`, `clients.json`,
    `src/i18n/messages.ts`
  - `src/content/legal/privacy.{en,es}.tsx`,
    `src/content/legal/terms.{en,es}.tsx` (DPA annex §A only),
    `src/lib/legal.ts`
  - if plan 011 has landed: `src/lib/export/load.ts`,
    `src/lib/export/archive.ts`, `messages/{en,es}/transfer.json`
- **B2**:
  - `supabase/migrations/<ts>_buyer_registrations.sql` (new), plus a
    scratchpad `rollback-registrations.sql`
  - `src/lib/registrations.ts` + test, `src/lib/validation/registration.ts`
    + test
  - `src/lib/actions/registrations.ts`, `src/lib/data/registrations.ts`
    (new)
  - `src/lib/data/seller.ts` (a new `getListingChoices()`)
  - `src/lib/data/agencies.ts` (22P02 handling if not done in B1)
  - `src/lib/actions/clients.ts` (`deleteClient`)
  - `src/lib/actions/agencies.ts` (delete message)
  - `src/lib/data/attention.ts` and `src/lib/data/attention.test.ts` (new,
    or extend plan 016's)
  - `src/lib/actions/notifications.ts` (or plan 016's
    `src/lib/notify/generate.ts` if it has landed)
  - `src/lib/data/dashboard.ts`
  - `src/lib/notifications.ts` + `src/lib/notifications.test.ts`
  - `src/components/notifications/notification-item.tsx`
  - `src/components/home/attention-list.tsx`
  - `src/components/clients/sections/registrations-section.tsx`,
    `registration-dialog.tsx` (new)
  - `src/components/clients/sections/viewings-section.tsx`
  - `src/components/clients/client-detail-view.tsx`,
    `src/app/(app)/clients/[id]/page.tsx`
  - `src/components/agencies/agency-detail-view.tsx`, `agency-dialog.tsx`,
    `src/app/(app)/agencies/[id]/page.tsx`
  - `src/lib/supabase/types.ts`
  - `messages/{en,es}/{clientDetail,server,notifications,home,agencies}.json`
  - the privacy and terms pages + `LEGAL_UPDATED`
  - the B2 lines in "Until this ships"
  - plan 011 files if landed
- **B3**:
  - `supabase/migrations/<ts>_drop_client_agency_text.sql`
  - `src/lib/supabase/types.ts`, `src/lib/validation/client.ts`
  - every read and write site in Current state §3 and §5
  - `src/app/(app)/clients/[id]/edit/page.tsx`
  - plan 011's `src/lib/transfer/columns.ts` and `src/lib/export/load.ts`
    (if landed)
  - plan 012's and plan 014's RPC migrations (if landed; a new migration
    that redefines each function, never an edit of an applied file)
- **C**: re-scoped when its gate passes (see Phase C).
- **All phases**: `plans/README.md` (row 015; the "Gates" table rows this plan
  reads).

**Out of scope**:
- seller-side deals or registrations
- a shared or global agency directory
- invoice numbering or PDFs; VAT or IRPF computation
- default, suggested or "typical" commission percentages or splits, and
  cross-agent aggregates
- a DNI/NIE field
- email or push reminders (Phase D rides on plan 016)
- calendar or ICS items for expiries (plan 004 / plan 013)
- sending registrations by email (plan 007)
- the calculator's 5% default (D18)
- the headline change (D20)
- editing plans 011, 012, 013, 014, 016, 017 or
  `plans/validation-interview-script.md` (owners listed under Prerequisites
  and Overlaps)

## Git workflow

- Commit on `main`. The founder ships from `main`; push only when the operator
  asks.
- **Expand migrations (B1, B2)**:
  - Write, rehearse (forward + rollback) and keep the file while you code.
  - Apply it live **right before pushing** the code that needs it, at a quiet
    hour (before 08:00 Europe/Madrid), so schema fixes found while coding
    never need a second live migration.
  - New reads also tolerate a missing table, because other sessions push
    too.
- **Contract migrations (B3)** run the other way round:
  1. Push code that no longer names the column.
  2. Wait for Vercel Ready and a signed-in smoke test.
  3. Probe the DB.
  4. Back up the column.
  5. Drop it.
- Commit style, one commit per step group:
  - `docs(marketing): …` (A0, only if it ships alone before plan 016
    Step 0.1; otherwise 016's commit carries it)
  - `feat(clients): …` (A)
  - `feat(agencies): …` (B1/B3)
  - `feat(registrations): …` (B2)
  - `docs(legal): …`
- End commit messages with the attribution line the session gives you.
- Build a commit from a temporary index (`GIT_INDEX_FILE` + `write-tree` +
  `commit-tree`) if a shared file carries another session's hunks.

## Steps

### Phase A0 — Honest wording (0.5 d, before Mon 21 Sep 2026)

**Step A0.0: One copy pass for the batch (applied by plan 016 Step 0.1).**
- This plan's A0 strings are **applied by 016 Step 0.1**. That step applies
  the "Until this ships" tables of all five batch plans (013, 014, 015, 016,
  017) in **one commit and one push**, with **one** `PUBLISHED` bump. Its
  file scope covers the landing, billing and calendar JSON,
  `messages/{en,es}/settings.json` (013's `languageHint` row),
  `src/components/landing/one-place.tsx` (017's animation change),
  `llms.txt` and the layout keywords, as well as this plan's files.
- Check `git log` and `plans/README.md` for 016 Step 0.1. If it has landed,
  run A0.1's Verify only and report the result.
- **Only if this plan ships before 016 Step 0.1**, apply this plan's rows
  alone in a `docs(marketing): …` commit, leave the other plans' lines
  untouched, and say so in your report.
- The founder's P3 choice must be recorded first. The strings below follow
  the recommended D1 (neutral).

**Step A0.1: Replace the claim copy with the "fallback" strings** in "Until
this ships". A0 **always** ships the fallback strings. The "A live" strings
go out only in the same push as Phase A (Step A.8), so the copy is never
ahead of the code.
- Replace the landing tags with neutral labels.
- Rework, in both languages:
  - the crm-marbella section "You sell for more than one agency" and its
    FAQ question
  - the crm-spain hub passages and FAQ
  - the about page's "Agency tags" bullet and "Why it exists"
  - `llms.txt:47` and `:67`
  - the Idealista guide sentence
  - the form hint `clients.json` → `form.agencyDescription`
- Update the `AgencyChips` comment (`feature-grid.tsx:59`) to "Sample agency
  tags: agencies an agent works with on their clients."

**Step A0.2: Bump `PUBLISHED`** (`src/lib/seo.ts:73-79`) for `crmSpain`,
`crmMarbella`, `guideIdealista` and `about` to the ship date.

**Verify**:
- This prints nothing:
  ```bash
  grep -rn -i "came through\|Norma Frank,Solvilla\|produces your deals\|producing deals\|whose listing it was\|whose commission you are\|whose listing a buyer\|whose listing the buyer\|agency it belongs to\|ends up on those tags\|keep listings from several agencies\|multi-agency listings\|por la que llegó\|por la que entró\|por qué agencia llegó\|cuál te da las operaciones\|te está dando\|de quién era el anuncio\|con quién repartes la comisión\|de quién es el inmueble que\|agencia a la que pertenece\|acaba en esas etiquetas\|llevar inmuebles de varias agencias\|,Direct\"\|,Directo\"" messages src/content src/app
  ```
  On 17 Sep 2026 this matched 32 lines, and every one of them is on the
  replacement list under "Until this ships". The two FAQ-question patterns
  are anchored ("keep listings…", "llevar inmuebles…") on purpose. The bare
  phrases also appear in lines that describe the agent's work and stay:
  - `crm-marbella.en.tsx:169` (meta description) and `:195` (FAQ answer)
  - `crm-marbella.es.tsx:170` and `:196`
  - The crm-marbella body may keep "Norma Frank, Solvilla or Drumelia",
    because it carries a non-partnership sentence.
  - crm-spain's "Whose listing it is decides who holds the keys…"
    (`crm-spain.en.tsx:60-61`, es `:62-63`) describes the market, not the
    product, and stays.
- `node -e 'for (const l of ["en","es"]) for (const n of ["landing","billing","clients"]) JSON.parse(require("fs").readFileSync(\`messages/${l}/${n}.json\`))'`
  exits 0.
- `npm run typecheck && npm test` pass. Typecheck catches broken JSX; no test
  reads these files.
- With `npm run dev`, each of these returns 200 and contains the new text
  (`curl -s <url> | grep -c "<new phrase>"`):
  - `/`, `/es`
  - `/pricing`, `/es/precios`
  - `/real-estate-crm-spain`, `/es/crm-inmobiliario-espana`
  - `/crm-for-marbella-agents`, `/es/crm-inmobiliario-marbella`
  - `/guides/idealista-lead-management`, `/es/guias/gestionar-leads-idealista`
  - `/about`, `/es/sobre-nosotros`
  - `/llms.txt`
- At 375 px, `/es` has no horizontal overflow
  (`document.documentElement.scrollWidth === 375`).

### Phase A — Agency suggestions and an agency filter (1 d, no migration)

**Step A.1: `src/lib/agencies.ts`** (pure, client-safe):
- **`cleanAgencyName(raw)`**:
  - Compute
    `Array.from(raw.normalize("NFC").replace(/\uFEFF/g, "").replace(/\s+/g, " ").trim()).slice(0, 120).join("").trimEnd()`.
  - This is the same rule as B1's SQL `public.agency_clean_name`:
    collapse every whitespace run, trim, cap at 120 **characters** (hence
    `Array.from`), trim again.
  - U+FEFF is removed on both sides, because JavaScript's `\s` matches it
    and PostgreSQL's doesn't (checked 16 Sep 2026). The SQL side spells out
    the rest of JavaScript's `\s` set, so the two agree on any database
    locale.
- **`agencyKey(raw)`**: `cleanAgencyName(raw).toLowerCase()`.
- **`pickSpelling(existing: (string | null)[], raw)`**:
  - Returns `null` when the cleaned input is empty.
  - Otherwise returns the most-used cleaned spelling in `existing` with the
    same key. Ties go to the first by `localeCompare`.
  - With no match, returns the cleaned input.
- **`agencyOptions(values: (string | null | undefined)[])`** returns
  `{ key, name, count }[]`:
  - Group by key, skipping empty values.
  - `name` is the `pickSpelling` winner.
  - Sort by count descending, then by name (`localeCompare`,
    `sensitivity: "base"`).
- **Filter values**, namespaced so an agency called "All" or "None" can't
  collide with a sentinel:
  - `ALL_AGENCIES = "all"` and `NO_AGENCY = "none"`.
  - `agencyOptionValue(key)` returns `` `k:${key}` ``.
  - `parseAgencyParam(value)` returns one of `{ kind: "all" }`,
    `{ kind: "none" }`, `{ kind: "key", key }` or `{ kind: "id", id }`:
    - `id` means a uuid, used from B1 on.
    - Anything else counts as `all`.

**Verify**: `agencies.test.ts` covers:
- `"Solvilla"`, `" solvilla "`, `"SOLVILLA"`, `"\tSolvilla\n"` and
  `"Solvilla\u00A0"` share one key.
- `"Sol\uFEFFvilla"` becomes `"Solvilla"`.
- `"Engel  &  Vo\u0308lkers"` (a decomposed ö) matches
  `"engel & völkers"`.
- A 119-character name plus `" b"` is cut to 119 characters with no
  trailing space. An emoji counts as one character.
- Empty, whitespace-only and null values are skipped.
- `pickSpelling`:
  - The most-used spelling wins, and ties are stable.
  - `pickSpelling([], "solvilla")` returns `"solvilla"`.
- Sorting is correct.
- An agency named "All" gets the value `"k:all"`, and
  `parseAgencyParam("k:all")` is a key, not the sentinel.

**Step A.2: `getAgencyNames()`** in `src/lib/data/clients.ts`:
- Query: `select("agency").not("agency", "is", null).order("updated_at", { ascending: false }).limit(1000)`,
  under RLS, both sides.
- Return `agencyOptions(rows).slice(0, 50)` as `{ name, count }[]`.
- Throw on error, following the module convention.

Wire it into both form pages:
- `src/app/(app)/clients/new/page.tsx`: add it to the existing
  `Promise.all`.
- `src/app/(app)/clients/[id]/edit/page.tsx`
- Pass the result as a new `agencyOptions` prop to `ClientForm`.

Plan 012's `getImportContext.agencies` should call this loader instead of its
own (note for 012's executor).

**Step A.3: One spelling on write.** In `src/lib/actions/clients.ts`, add a
non-exported `async function canonicalAgency(supabase, raw, selfId?)`:
1. Read the agent's other agency values: the A.2 query, plus
   `.neq("id", selfId)` when updating.
2. Return `pickSpelling(values, raw)`.

**Excluding the edited row** lets an agent fix the capitalisation of an
agency only that client uses ("solvilla" → "Solvilla"). When other clients
already use a spelling, the new value snaps to it; B1's rename fixes those.
Use it at `:84` (no `selfId`) and `:123` (`selfId = id`). Validation stays at
120 characters.

**Verify**: `agencies.test.ts` (`pickSpelling`) shows:
- `" solvilla "` becomes `"Solvilla"` when `["Solvilla"]` exists.
- `"Solvilla"` stays when `[]` (the edited row excluded).

There are no action tests in the repo, so don't add one here.

**Step A.4: Suggestion chips** in `client-form.tsx:294-307`. Keep the `Input`.
Under it, before `FormDescription`, render up to 8 chips:
- Source: `agencyOptions` whose key includes `agencyKey(field.value)`. Skip an
  option whose key equals the current value's key.
- Each chip is a `<button type="button">` styled like `AgencyChips`
  (`rounded-full text-xs`), with `min-h-8` for touch.
- `aria-label={t("useAgency", { name })}`. The group has
  `aria-label={t("agencySuggestions")}`.
- Click: `form.setValue("agency", name, { shouldDirty: true, shouldValidate: true })`.
- No `<datalist>`: iOS Safari support is partial (see Sources).

**Step A.5: The agency filter** in `clients-view.tsx`:
- **State**: `agencyFilter`, initialised from a new `initialAgency` prop
  (default `ALL_AGENCIES`). Adopt a changed prop with the same derived-state
  pattern as `initialStage` (`:103-108`).
- **Options**: `agencyOptions(visible.map((c) => c.agency))`, as
  - `{ value: ALL_AGENCIES, label: t("agencyAll") }`
  - one `{ value: agencyOptionValue(key), label: name }` per agency
  - `{ value: NO_AGENCY, label: t("agencyNone") }`

  A `k:` key that matches no option falls back to "all", and its param is
  removed.
- **Scope**: `scoped = visible` filtered through `parseAgencyParam`:
  - a key: `agencyKey(c.agency)` must equal it
  - `none`: the agency is empty

  Feed `scoped` into `stageCounts`, `StageTabs total` and `filtered` in
  place of `visible`, so the tabs count only that agency's clients. Priority
  and type keep today's behaviour.
- **Toolbar**: render
  `<FilterSelect label={tTable("agency")} …>` right after the Type
  `FilterSelect` (`:297`). Show it only when at least one row in `visible`
  has an agency, or when `agencyFilter !== ALL_AGENCIES`.
- **URL**: `changeAgencyFilter(value)` mirrors `changeStageFilter`. It stores
  the option value verbatim (`?agency=k:solvilla`, `?agency=none`) with
  `replaceState`, and deletes the param for "all".
- **`toggleInactive`** (`:216-218`): keep the current `stage` and `agency`
  params in the pushed URL.
- **Pages**: `buyers/page.tsx` and `sellers/page.tsx` read `sp.agency` and
  pass it to `ClientsScreen` → `ClientsView initialAgency`. `ClientsScreen`
  passes it through untouched; values are validated client-side.

**Step A.6: Honest totals (D21)**:
- `getClientRows` embeds `reservations(commission, closed_at)`.
- `ClientRow` gains `commission: number | null` and
  `closed_at: string | null`; `toRow` reads them with `one()`.
- `Summary` computes `pipeline`/`closed` from `rows` (already `filtered`).
- Under the summary row, render a muted note `t("summary.shownNote")` when a
  commission cell is shown.
- Remove the `commission` prop and the `getCommissionSummary()` call from
  `clients-screen.tsx`. Home keeps its own call
  (`home-panels.tsx:90-103`).

**Step A.7: Copy** (en / es) in `messages/{en,es}/clients.json`:

| Key | EN | ES |
|---|---|---|
| `list.agencyAll` | All | Todas |
| `list.agencyNone` | No agency | Sin agencia |
| `list.summary.shownNote` | Totals cover the clients shown. | Los totales cubren los clientes que ves. |
| `form.agencyDescription` (A0) | The agency you're working with on this client, if any. | La agencia con la que llevas este cliente, si la hay. |
| `form.agencySuggestions` | Agencies you've used | Agencias que ya usas |
| `form.useAgency` | Use {name} | Usar {name} |

**Step A.8: Switch the site copy to the "A live" strings** from "Until this
ships", in the same push as A.

**Verify**:
- `npm run typecheck && npm run lint && npm test && npm run build` pass.
- On `src/app/preview-tmp/<your-folder>/page.tsx`, render `ClientsView` with
  7 mock rows:
  - two with "Solvilla" in different case
  - one "Drumelia"
  - one inactive "Drumelia" with a closed commission
  - three with no agency, one of them with a reservation commission

  Check:
  - Choosing Solvilla shows 2 rows, the tabs count 2, and the commission cell
    shows only Solvilla's amount.
  - "No agency" shows 3 rows.
  - With no filter, the "Closed" cell excludes the inactive row until "Show
    inactive" is on. The note under the summary says so.
  - The URL gains `?agency=k:solvilla`; a reload keeps the filter.
  - Toggling "Show inactive" keeps it.
  - The filter is hidden when no row has an agency.
  - A mock agency named "All" is a separate option.
- Render `ClientForm` with 10 options: 8 chips show; typing "sol" narrows to
  Solvilla; tapping fills the input.
- Check at 375 px and desktop, en and es, with no horizontal overflow.
- Delete your preview folder.
- **Push only with the "A live" strings in the same push.**

### Phase B1 — Agencies table, client link and per-agency page (3–3.5 d, gated)

**Step B1.0: Gate.** Continue only if both hold:
- The "Gates" table in `plans/README.md` records B1's gate as passed
  (D12: ≥ 3 of the first 5 interviews green on A or on G), or the founder
  says to build in chat.
- The founder has fixed D1 (P3).

Otherwise stop after Phase A and say so in row 015.

**Step B1.1: Probe the live DB** (read-only). Save
`<scratchpad>/probe-agencies.mjs`. It opens `begin transaction read only`,
prints catalog facts and aggregates only, and ends with `rollback`. Expected
values are those of 16 Sep 2026.
- **Database**:
  - `show server_version` (17.6)
  - encoding, `datctype`, `datlocprovider` from `pg_database` (UTF8,
    en_US.UTF-8, `i`)
  - `lower('VÖLKERS')` (`völkers`)
  - `public.agency_clean_name` doesn't exist yet, and `normalize('x', NFC)`
    works
- **Objects**:
  - `to_regclass` for `public.agencies`, `public.buyer_registrations` and
    `public.registration_files` (all null)
  - whether `clients.agency_id` exists (no)
- **Policies**: the `pg_policies` count for `clients` (1) and its
  `with_check` text, `(agent_id = ( SELECT auth.uid() AS uid))`. B1 doesn't
  change it; the rehearsal compares against it.
- **Triggers**: the non-internal triggers on `clients`, with `tgname`, the
  function's `proname` (join `pg_proc` on `tgfoid`, as the rehearsal
  does), `tgqual is not null` and `pg_get_triggerdef(oid)`.
  Expected:
  - `clients_enforce_free_limit`
  - `clients_set_updated_at` → `set_updated_at` (or
    `clients_touch_updated_at` if plan 016/017 landed), no WHEN
- **The function behind `clients_set_updated_at`**:
  - Print `pg_get_functiondef` and **write it to
    `<scratchpad>/pre-b1-touch-fn.sql`**; the rollback needs it.
  - If it is a skip-list function, print its quoted keys.
- **Migration history**: the `supabase_migrations.schema_migrations` columns
  (`name, statements, version`) and its newest 5 versions.
- **Agency data**:
  - the distinct `(agent_id, lower(rtrim(left(btrim(regexp_replace(replace(normalize(agency, NFC), U&'\FEFF', ''), '[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+', ' ', 'g')), 120))))`
    groups over `agency ~ '[^[:space:]]'`, which is B1.2's cleaning rule
    inlined (4 on 16 Sep 2026)
  - the largest group count for one agent
  - blank values (`agency is not null and agency !~ '[^[:space:]]'`: 0)
  - values with edge whitespace (0)
  - the longest value (9)
- **The rehearsal agent**:
  - the number of `is_admin` profiles (1)
  - that admin's client count (5)
  - that at least one other profile exists

**Pick the version** `<ts>`:
- Start from the build day at `120000`.
- It must sort after every file in `supabase/migrations/` and after
  `20260916150000`.
- It must not exist in `schema_migrations`.
- `grep -rn "<ts>" plans/ supabase/migrations/` must show nothing else.

  If a sibling plan took that slot, use the next free half hour (`123000`,
  `130000`, …).

**Step B1.2: Write `supabase/migrations/<ts>_agencies.sql`.**
- Build the skip array in `clients_touch_updated_at` by **merging, never
  overwriting**. Whichever of B1 and plan 016 Phase 1 lands first creates
  the function; every later plan reads the live function first (B1.1) and
  merges its keys. The array is:
  - `'updated_at', 'agency', 'agency_id'`
  - plus **every** key B1.1 printed for a live skip-list function (today
    plans 016 and 017 both use `'last_contacted_at'` and `'wa_contact_id'`)
- Keep the function body in the batch's shared form below, so plans 016 and
  017 can merge into it.
- **If B1.1 found the trigger already bound to `clients_touch_updated_at`**
  (plan 016 or 017 landed first), delete the `drop trigger` /
  `create trigger clients_set_updated_at` pair from the file. The second
  plan to land replaces only the function and never re-binds the trigger.

```sql
-- ============================================================
-- Agencies: the agencies and developers an agent works with.
-- One agent's private list (never shared between agents). clients.agency_id
-- links a client to the agency the agent works with on that client
-- (plan 015, D1). clients.agency (text) stays as a trigger-maintained exact
-- copy of agencies.name until plan 015 phase B3 drops it; legacy writers
-- (plans 012/014 RPCs) keep working because a trigger derives agency_id
-- from the text.
-- ============================================================

-- One cleaning rule for agency names, used by the CHECK, agency_id_for and
-- the backfill. btrim() strips only spaces (see tasks.sql), so collapse every
-- whitespace run first, then trim, cap at 120 characters and trim again.
-- The class is spelled out so it doesn't depend on the database locale, and
-- it equals JavaScript's \s (src/lib/agencies.ts, cleanAgencyName) once
-- U+FEFF, which JavaScript counts as whitespace, has been dropped.
create or replace function public.agency_clean_name(p text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select rtrim(left(btrim(regexp_replace(
    replace(normalize(coalesce(p, ''), NFC), U&'\FEFF', ''),
    '[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+', ' ', 'g')), 120))
$$;

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  kind text not null default 'agency',
  email text,
  phone text,
  website text,
  notes text,
  -- the agent's own saved term, never a product default (plan 015, D5)
  registration_valid_months smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- stored clean, so lower(name) is the match key
  constraint agencies_name_clean check (
    name = public.agency_clean_name(name)
    and char_length(name) between 1 and 120
  ),
  constraint agencies_kind_valid check (kind in ('agency', 'developer')),
  constraint agencies_email_len check (email is null or char_length(email) <= 254),
  constraint agencies_phone_len check (phone is null or char_length(phone) <= 50),
  constraint agencies_website_len check (website is null or char_length(website) <= 300),
  constraint agencies_notes_len check (notes is null or char_length(notes) <= 2000),
  constraint agencies_valid_months_range check (
    registration_valid_months is null or registration_valid_months between 1 and 36
  )
);
create unique index agencies_agent_name_key on public.agencies (agent_id, lower(name));
create trigger agencies_set_updated_at
  before update on public.agencies
  for each row execute function public.set_updated_at();

alter table public.agencies enable row level security;
create policy "agent owns agencies" on public.agencies
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));

-- ---------- clients.agency_id ----------
alter table public.clients
  add column agency_id uuid references public.agencies (id) on delete set null;
create index clients_agency_id_idx on public.clients (agency_id);

-- updated_at means "the agent edited this client". Bookkeeping columns are
-- skipped, so the backfill, a merge, a rename or an agency delete never moves
-- it (plan 015, D13). SHARED with plans 016 and 017, which add their own
-- keys: whoever redefines this function keeps every key already listed.
create or replace function public.clients_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  skip constant text[] := array['updated_at', 'agency', 'agency_id'];  -- + live keys from B1.1
begin
  if (to_jsonb(new) - skip) = (to_jsonb(old) - skip) then
    new.updated_at := old.updated_at;
  else
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.clients_touch_updated_at();

-- The "agent owns clients" policy is NOT changed. An FK check ignores RLS,
-- so ownership of agency_id is checked in clients_sync_agency below. It
-- can't live in the policy (the tasks.sql shape): a WITH CHECK subquery
-- reads the statement's snapshot, so it can't see an agency that this
-- statement's trigger has just created for a legacy text write.

-- ---------- find-or-create by name ----------
create or replace function public.agency_id_for(p_agent uuid, p_name text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_name text := public.agency_clean_name(p_name);
  v_id uuid;
begin
  if v_name = '' then
    return null;
  end if;
  if (select auth.uid()) is not null and p_agent is distinct from (select auth.uid()) then
    raise exception 'agency_owner_mismatch' using errcode = '42501';
  end if;
  select id into v_id from public.agencies
   where agent_id = p_agent and lower(name) = lower(v_name);
  if v_id is null then
    insert into public.agencies (agent_id, name) values (p_agent, v_name)
    on conflict do nothing
    returning id into v_id;
    if v_id is null then -- lost a race to a concurrent insert
      select id into v_id from public.agencies
       where agent_id = p_agent and lower(name) = lower(v_name);
    end if;
  end if;
  return v_id;
end;
$$;
revoke all on function public.agency_id_for(uuid, text) from public, anon;
grant execute on function public.agency_id_for(uuid, text) to authenticated;

-- ---------- merge ----------
create or replace function public.merge_agencies(p_from uuid, p_into uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_from public.agencies;
  v_into public.agencies;
begin
  if p_from = p_into then
    raise exception 'agency_merge_same' using errcode = '22023';
  end if;
  select * into v_from from public.agencies where id = p_from and agent_id = (select auth.uid());
  select * into v_into from public.agencies where id = p_into and agent_id = (select auth.uid());
  if v_from.id is null or v_into.id is null then
    raise exception 'agency_not_found' using errcode = 'P0002';
  end if;
  -- clients_sync_agency rewrites the text from the new id
  update public.clients set agency_id = p_into where agency_id = p_from;
  -- phase B2 adds: update public.buyer_registrations set counterparty_id = p_into where counterparty_id = p_from;
  update public.agencies set
    email = coalesce(email, v_from.email),
    phone = coalesce(phone, v_from.phone),
    website = coalesce(website, v_from.website),
    registration_valid_months = coalesce(registration_valid_months, v_from.registration_valid_months),
    notes = case
      when v_from.notes is null then notes
      when notes is null then v_from.notes
      else left(notes || E'\n\n' || v_from.notes, 2000)
    end
  where id = p_into;
  delete from public.agencies where id = p_from;
end;
$$;
revoke all on function public.merge_agencies(uuid, uuid) from public, anon;
grant execute on function public.merge_agencies(uuid, uuid) to authenticated;

-- ---------- backfill: one agency per (agent, name key), most-used spelling ----------
-- Whitespace-only legacy values carry no agency.
update public.clients
   set agency = null
 where agency is not null
   and public.agency_clean_name(agency) = '';

with spelled as (
  select agent_id, public.agency_clean_name(agency) as name, count(*) as uses
  from public.clients
  where agency ~ '[^[:space:]]'
  group by 1, 2
)
insert into public.agencies (agent_id, name)
select distinct on (agent_id, lower(name)) agent_id, name
from spelled
where name <> ''
order by agent_id, lower(name), uses desc, name;

update public.clients c
   set agency_id = a.id,
       agency = a.name
  from public.agencies a
 where c.agency_id is null
   and c.agency is not null
   and a.agent_id = c.agent_id
   and lower(a.name) = lower(public.agency_clean_name(c.agency));

-- ---------- the link: ownership, and the text as an exact copy ----------
-- Legacy writers set only the text: derive the link. The agency must belong
-- to the client's agent (plpgsql queries take a fresh snapshot, so this sees
-- an agency created a moment ago; under RLS an agent sees only their own).
-- Any write of the id (the app, a merge, the FK's ON DELETE SET NULL)
-- rewrites the text from it. Phase B3 keeps only the ownership check.
create or replace function public.clients_sync_agency()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_name text;
begin
  if tg_op = 'INSERT' then
    if new.agency_id is null then
      new.agency_id := public.agency_id_for(new.agent_id, new.agency);
    end if;
  elsif new.agency_id is not distinct from old.agency_id
        and new.agency is distinct from old.agency then
    new.agency_id := public.agency_id_for(new.agent_id, new.agency);
  end if;

  if new.agency_id is null then
    new.agency := null;
    return new;
  end if;

  select a.name into v_name
    from public.agencies a
   where a.id = new.agency_id and a.agent_id = new.agent_id;
  if v_name is null then
    raise exception 'agency_not_owned' using errcode = '42501';
  end if;
  new.agency := v_name;
  return new;
end;
$$;
create trigger clients_sync_agency
  before insert or update of agency, agency_id on public.clients
  for each row execute function public.clients_sync_agency();

-- A rename rewrites the copies (updated_at stays put: both columns are skipped).
create or replace function public.agencies_mirror_name()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.clients set agency = new.name
   where agency_id = new.id and agency is distinct from new.name;
  return null;
end;
$$;
create trigger agencies_mirror_name
  after update of name on public.agencies
  for each row execute function public.agencies_mirror_name();
```

Notes for the executor:
- **Trigger order**: BEFORE triggers fire in name order:
  1. `clients_enforce_free_limit` (insert)
  2. `clients_set_updated_at` (update)
  3. `clients_sync_agency` (insert and update)

  A capped insert creates no agency. The updated_at function compares the
  row before `clients_sync_agency` edits it, which is fine because both
  agency columns are skipped.
- **When `clients_sync_agency` fires**: `UPDATE OF agency, agency_id` fires
  only when one of those columns is in the SET list (PostgreSQL docs, CREATE
  TRIGGER; changes made by other BEFORE triggers don't count). The FK's
  `ON DELETE SET NULL` sends
  `UPDATE … SET agency_id = NULL`, so it fires and clears the text. Tested
  on temp tables on the live PG 17.6, 16 Sep 2026:
  - an id-only update rewrote the text
  - a text-only update derived the id and the canonical name
  - an agency delete cleared both columns
  - `updated_at` stayed put throughout
- **Behaviour change**: under the shared function, an UPDATE that sets only
  `updated_at` is reverted, and a no-op update keeps `updated_at` (D13).
- **The backfill canonicalises spellings**, and the rollback doesn't restore
  them. That is harmless: the 4 live values had no variants on 16 Sep 2026.
- **Why ownership sits in the trigger, not the policy**: the first sketch
  replaced the `clients` policy with a tasks.sql-style `exists (…agencies…)`
  check. When that sketch's rehearsal ran on PGlite 0.5.8 (PostgreSQL 18.3
  in WASM, 16 Sep 2026), a legacy text write that created a **new** agency
  failed with "new row violates row-level security policy". The policy's
  subquery reads the statement's snapshot and can't see the agency the
  BEFORE trigger had just inserted. A plpgsql function is VOLATILE and
  "obtain[s] a fresh snapshot at the start of each query" (PostgreSQL docs,
  function volatility), so the check in `clients_sync_agency` sees it. The
  live rehearsal (PG 17.6) re-checks this: "legacy update derives a new
  agency". Keeping the policy as it is also removes the riskiest part of
  this migration.
- **Locale**: `agency_clean_name` spells its whitespace class out. On
  PGlite's C locale, `\s` doesn't match NBSP, while the live ICU database
  does (both checked 16 Sep 2026). The explicit class behaves the same on
  both.
- **Timeouts**: don't put `set local` lines in the migration file. The
  scripts set the timeouts.

**Rollback file** `<scratchpad>/rollback-agencies.sql`. Write it now; the
rehearsal runs it. This version is for the 16 Sep 2026 state, where the
pre-B1 function is `set_updated_at`.

```sql
-- Undo <ts>_agencies.sql. Valid only while nothing else builds on it (plan
-- 015 B2, or a plan 016/017 migration applied after B1): after that, write a
-- fresh rollback. clients.agency (the text) is kept.
drop trigger if exists agencies_mirror_name on public.agencies;
drop function if exists public.agencies_mirror_name();
drop trigger if exists clients_sync_agency on public.clients;
drop function if exists public.clients_sync_agency();
drop function if exists public.merge_agencies(uuid, uuid);
drop function if exists public.agency_id_for(uuid, text);

-- The "agent owns clients" policy was never changed, so nothing to restore.

-- Pre-B1 state: set_updated_at (init.sql:63-65). If B1.1 found
-- clients_touch_updated_at instead, replace the next four statements with
-- the saved definition from pre-b1-touch-fn.sql (create or replace function …)
-- and keep the trigger as it is.
drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();
drop function if exists public.clients_touch_updated_at();

alter table public.clients drop column if exists agency_id;
drop table if exists public.agencies;
drop function if exists public.agency_clean_name(text);

delete from supabase_migrations.schema_migrations where version = '<ts>';
```

After a **live** rollback:
- Run `notify pgrst, 'reload schema'`.
- B1's code tolerates the missing table:
  - `agencyChoices` becomes `null`, so the fallback input shows.
  - The client reads use `*`, so a missing `agency_id` is `undefined` and
    the links disappear.
- Revert the B1 commit when convenient.

**Step B1.3: Rehearse forward and back, with nothing kept.** Save this as
`<scratchpad>/rehearse-agencies.mjs`. Run it with the migration path and the
rollback path, at a quiet hour: it holds locks on `clients` for its few
seconds.

```js
import fs from "node:fs";
import pg from "pg";

const [forwardPath, rollbackPath] = process.argv.slice(2);
const sql = fs.readFileSync(forwardPath, "utf8");
const rollbackSql = fs.readFileSync(rollbackPath, "utf8");
const db = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
const q1 = async (text, params = []) => (await db.query(text, params)).rows[0];
const check = (label, ok, detail = "") => console.log(ok ? `ok   ${label}` : `FAIL ${label} ${detail}`);
const as = async (id) => {
  await db.query("reset role");
  await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: id, role: "authenticated" })]);
  await db.query("set local role authenticated");
};
const expectError = async (label, run, text) => {
  await db.query("savepoint s");
  try { await run(); console.log(`FAIL ${label}: no error`); }
  catch (e) { console.log(e.message.includes(text) ? `ok   ${label}` : `FAIL ${label}: ${e.message}`); }
  await db.query("rollback to savepoint s");
};
const OLD = Date.parse("2026-01-01T00:00:00Z");
const client = (id) => q1("select agency_id, agency, updated_at from public.clients where id = $1", [id]);
// proname, not tgfoid::regproc: regproc prints "public.x" when public isn't on the search_path
const touch = () => q1(`select p.proname as fn, pg_get_functiondef(p.oid) as body
  from pg_trigger t join pg_proc p on p.oid = t.tgfoid
  where t.tgrelid = 'public.clients'::regclass and t.tgname = 'clients_set_updated_at'`);
const policies = async () => (await db.query(
  "select with_check from pg_policies where schemaname = 'public' and tablename = 'clients' order by policyname")).rows.map((r) => r.with_check);

await db.connect();
await db.query("begin");
try {
  await db.query("set local lock_timeout = '3s'");
  await db.query("set local statement_timeout = '30s'");
  const pre = await touch();
  const prePolicies = await policies();
  const preKeys = pre.fn === "clients_touch_updated_at" ? [...pre.body.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]) : [];
  const before = (await db.query("select id, updated_at from public.clients")).rows;

  await db.query(sql);

  // 1. the cleaning rule
  for (const [raw, want] of [["\tSolvilla", "Solvilla"], ["Solvilla\n", "Solvilla"], ["Solvilla\u00A0", "Solvilla"],
    ["  Engel  &\tVölkers ", "Engel & Völkers"], ["Sol\uFEFFvilla", "Solvilla"], ["o\u0308", "ö"], [" \t\u00A0", ""], [null, ""]]) {
    const got = (await q1("select public.agency_clean_name($1) as v", [raw])).v;
    check(`clean ${JSON.stringify(raw)}`, got === want, JSON.stringify(got));
  }
  check("clean caps at 120 with no trailing space",
    (await q1("select public.agency_clean_name(repeat('a', 119) || ' b') as v")).v === "a".repeat(119));

  // 2. the backfill
  const groups = (await q1(`select count(*)::int as n from (select distinct agent_id, lower(public.agency_clean_name(agency))
    from public.clients where public.agency_clean_name(agency) <> '') g`)).n;
  check("one agency per (agent, name)", (await q1("select count(*)::int as n from public.agencies")).n === groups);
  check("every tagged client linked", (await q1("select count(*)::int as n from public.clients where agency is not null and agency_id is null")).n === 0);
  check("every copy equals its agency name", (await q1(`select count(*)::int as n from public.clients c
    join public.agencies a on a.id = c.agency_id where c.agency is distinct from a.name`)).n === 0);
  const after = new Map((await db.query("select id, updated_at from public.clients")).rows.map((r) => [r.id, +r.updated_at]));
  check("backfill left every updated_at", before.every((r) => after.get(r.id) === +r.updated_at));

  // 3. the shared updated_at function
  const post = await touch();
  check("trigger runs clients_touch_updated_at", post.fn === "clients_touch_updated_at", post.fn);
  for (const key of new Set(["updated_at", "agency", "agency_id", ...preKeys])) {
    check(`skip list keeps '${key}'`, post.body.includes(`'${key}'`));
  }

  const founder = (await q1("select id from public.profiles where is_admin limit 1")).id;
  const other = (await q1("select id from public.profiles where id <> $1 limit 1", [founder])).id;

  // 4. the agencies table and agency_id_for
  await as(founder);
  const a1 = (await q1("insert into public.agencies (name) values ('Rehearsal Homes') returning id")).id;
  await expectError("duplicate in another case", () => db.query("insert into public.agencies (name) values ('rehearsal homes')"), "agencies_agent_name_key");
  await expectError("double space", () => db.query("insert into public.agencies (name) values ('Rehearsal  X')"), "agencies_name_clean");
  await expectError("tab at the end", () => db.query("insert into public.agencies (name) values (E'Rehearsal X\\t')"), "agencies_name_clean");
  await expectError("blank name", () => db.query("insert into public.agencies (name) values (' ')"), "agencies_name_clean");
  const ids = await q1(`select public.agency_id_for($1, '  REHEARSAL   homes ') as a,
    public.agency_id_for($1, E'\\tRehearsal Homes\\n') as b,
    public.agency_id_for($1, 'Rehearsal Homes' || U&'\\00A0') as c,
    public.agency_id_for($1, E' \\t') as blank`, [founder]);
  check("agency_id_for: case, spaces, tab, newline, NBSP", ids.a === a1 && ids.b === a1 && ids.c === a1);
  check("agency_id_for: blank gives null", ids.blank === null);
  const ev1 = (await q1("select public.agency_id_for($1, 'Engel & Völkers Rehearsal') as id", [founder])).id;
  const ev2 = (await q1("select public.agency_id_for($1, 'ENGEL & VÖLKERS REHEARSAL') as id", [founder])).id;
  check("accents: NFC + lower() agree", ev1 === ev2);

  // 5. legacy writers and the exact copy. The INSERT carries the old
  // updated_at: the shared function reverts an UPDATE that only sets it.
  const c1 = await q1(`insert into public.clients (side, first_name, last_name, stage, agency, created_at, updated_at)
    values ('buyer', 'Rehearsal', 'One', 'new', 'REHEARSAL  homes', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z') returning id, agency_id, agency`);
  check("legacy insert derives agency_id", c1.agency_id === a1);
  check("legacy insert stores the canonical name", c1.agency === "Rehearsal Homes");
  const blank = await q1(`insert into public.clients (side, first_name, last_name, stage, agency)
    values ('buyer', 'Rehearsal', 'Blank', 'new', E' \\t') returning agency, agency_id`);
  check("whitespace-only agency stores nothing", blank.agency === null && blank.agency_id === null);
  const moved = await q1("update public.clients set agency = E'Rehearsal Developer\\t' where id = $1 returning agency_id, agency, updated_at", [c1.id]);
  const dev = moved.agency_id;
  check("legacy update derives a new agency", dev && dev !== a1 && moved.agency === "Rehearsal Developer");
  check("agency-only edit keeps updated_at", +moved.updated_at === OLD);
  const idOnly = await q1("update public.clients set agency_id = $1 where id = $2 returning agency, updated_at", [a1, c1.id]);
  check("id-only update rewrites the text", idOnly.agency === "Rehearsal Homes" && +idOnly.updated_at === OLD);
  if (preKeys.includes("last_contacted_at")) {
    // plan 016 landed first: its key must still be skipped after the merge
    const lc = await q1("update public.clients set last_contacted_at = now() where id = $1 returning updated_at", [c1.id]);
    check("016's last_contacted_at-only update keeps updated_at", +lc.updated_at === OLD);
  }
  const both = await q1(`insert into public.clients (side, first_name, last_name, stage, agency, agency_id)
    values ('buyer', 'Rehearsal', 'Two', 'new', 'something else', $1) returning agency`, [dev]);
  check("insert with an id stores that agency's name", both.agency === "Rehearsal Developer");

  // 6. merge and rename
  await db.query("update public.clients set agency_id = $1 where id = $2", [dev, c1.id]);
  await db.query("select public.merge_agencies($1, $2)", [dev, a1]);
  const merged = await client(c1.id);
  check("merge moves the client and its copy", merged.agency_id === a1 && merged.agency === "Rehearsal Homes");
  check("merge keeps updated_at", +merged.updated_at === OLD);
  check("merged agency deleted", (await q1("select count(*)::int as n from public.agencies where id = $1", [dev])).n === 0);
  await db.query("update public.agencies set name = 'Rehearsal Homes Marbella' where id = $1", [a1]);
  const renamed = await client(c1.id);
  check("rename copies, keeps link and updated_at",
    renamed.agency === "Rehearsal Homes Marbella" && renamed.agency_id === a1 && +renamed.updated_at === OLD);

  // 7. tenancy
  await as(other);
  const foreign = (await q1("insert into public.agencies (name) values ('Rehearsal Foreign') returning id")).id;
  check("other agent can't see founder's agency", (await q1("select count(*)::int as n from public.agencies where id = $1", [a1])).n === 0);
  await as(founder);
  await expectError("client → another agent's agency", () => db.query("update public.clients set agency_id = $1 where id = $2", [foreign, c1.id]), "agency_not_owned");
  await expectError("insert with another agent's agency", () => db.query(`insert into public.clients (side, first_name, last_name, stage, agency_id)
    values ('buyer', 'Rehearsal', 'Three', 'new', $1)`, [foreign]), "agency_not_owned");
  await expectError("agency_id_for for another agent", () => db.query("select public.agency_id_for($1, 'X')", [other]), "agency_owner_mismatch");
  await expectError("merge another agent's agency", () => db.query("select public.merge_agencies($1, $2)", [foreign, a1]), "agency_not_found");

  // 8. a direct agency delete (the single statement deleteAgency sends)
  const gone = (await q1("insert into public.agencies (name) values ('Rehearsal Gone') returning id")).id;
  await db.query("update public.clients set agency_id = $1 where id = $2", [gone, c1.id]);
  await db.query("delete from public.agencies where id = $1", [gone]);
  const cleared = await client(c1.id);
  check("agency delete clears both columns, keeps updated_at",
    cleared.agency_id === null && cleared.agency === null && +cleared.updated_at === OLD);

  // 9. a real edit still bumps
  await db.query("update public.clients set notes = 'rehearsal' where id = $1", [c1.id]);
  check("a real edit still bumps updated_at", +(await client(c1.id)).updated_at !== OLD);

  // 10. privileges
  await db.query("reset role");
  check("anon can't call agency_id_for", !(await q1("select has_function_privilege('anon', 'public.agency_id_for(uuid,text)', 'execute') as x")).x);
  check("anon can't call merge_agencies", !(await q1("select has_function_privilege('anon', 'public.merge_agencies(uuid,uuid)', 'execute') as x")).x);
  check("no security definer", !(await q1(`select coalesce(bool_or(prosecdef), false) as x from pg_proc
    where proname in ('agency_id_for', 'merge_agencies', 'clients_sync_agency', 'agencies_mirror_name', 'agency_clean_name', 'clients_touch_updated_at')`)).x);
  check("clients policy unchanged", JSON.stringify(await policies()) === JSON.stringify(prePolicies));

  // 11. the rollback file restores the pre-B1 state
  await db.query(rollbackSql);
  const undone = await touch();
  check("rollback: trigger function restored", undone.fn === pre.fn && undone.body === pre.body, undone.fn);
  check("rollback: policy still unchanged", JSON.stringify(await policies()) === JSON.stringify(prePolicies));
  const left = await q1(`select to_regclass('public.agencies') is null as t,
    not exists (select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'clients' and column_name = 'agency_id') as c,
    (select count(*)::int from pg_proc where pronamespace = 'public'::regnamespace and proname in
      ('agency_id_for', 'merge_agencies', 'clients_sync_agency', 'agencies_mirror_name', 'agency_clean_name')) as f,
    to_regprocedure('public.clients_touch_updated_at()') is null as touch_gone`);
  check("rollback: table, column and functions gone",
    left.t && left.c && left.f === 0 && (pre.fn === "clients_touch_updated_at" || left.touch_gone));
} finally {
  await db.query("rollback");
  await db.end();
}
```

**Expected**:
- Every line prints `ok`, and nothing is kept.
- The script prints no names and no connection string.
- A `FAIL … client_limit_reached` or a lock-timeout error (`55P03`) is a
  STOP.

**Step B1.4: Apply it live, right before the B1 push** (standing rule:
Claude does this). Build and verify the B1 code first (B1.5–B1.10). Then, at
a quiet hour (before 08:00 Europe/Madrid):
1. Re-run B1.1. Nothing may have changed since the rehearsal. If the trigger
   function changed, rewrite the skip array and the rollback, and
   re-rehearse.
2. Re-run B1.3. Every line must print `ok`.
3. Apply with `<scratchpad>/apply-migration.mjs`:

```js
import fs from "node:fs";
import pg from "pg";

const [file, version, name] = process.argv.slice(2);
if (!/^\d{14}$/.test(version ?? "") || !name) throw new Error("usage: apply-migration.mjs <file> <version> <name>");
const sql = fs.readFileSync(file, "utf8");
const db = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await db.connect();
try {
  const cols = (await db.query(`select column_name from information_schema.columns
    where table_schema = 'supabase_migrations' and table_name = 'schema_migrations' order by 1`)).rows.map((r) => r.column_name).join(",");
  if (cols !== "name,statements,version") throw new Error(`unexpected history columns: ${cols}`);
  if ((await db.query("select 1 from supabase_migrations.schema_migrations where version = $1", [version])).rowCount) {
    throw new Error(`version ${version} is already recorded`);
  }
  await db.query("begin");
  await db.query("set local lock_timeout = '3s'");
  await db.query("set local statement_timeout = '30s'");
  await db.query(sql);
  await db.query("insert into supabase_migrations.schema_migrations (version, name, statements) values ($1, $2, $3)", [version, name, [sql]]);
  await db.query("commit");
  await db.query("notify pgrst, 'reload schema'");
  console.log(`applied ${version}`);
} catch (e) {
  await db.query("rollback").catch(() => {});
  console.log(`FAIL ${e.code ?? ""} ${e.message}`);
  process.exitCode = 1;
} finally {
  await db.end();
}
```

Run it as
`node --env-file=… apply-migration.mjs supabase/migrations/<ts>_agencies.sql <ts> agencies`.
- **On `FAIL 55P03`** (lock not available), don't retry blindly:
  1. Look at `pg_stat_activity` for long transactions, with counts and
     durations only.
  2. Wait for a quiet moment and retry once.
  3. If it fails again, STOP.
- Push the B1 code straight after the apply.

**Check afterwards**:
- `to_regclass('public.agencies')` is not null, and `relrowsecurity` is true.
- The `clients` policy is unchanged: the count and `with_check` match B1.1.
- `agencies` has one policy.
- `pg_trigger` shows:
  - `clients_set_updated_at` → `clients_touch_updated_at`, whose body lists
    every expected key
  - `clients_sync_agency`
  - `clients_enforce_free_limit`
- The table probe (Commands) returns `200 []`.
- The agency count equals the B1.1 group count. No tagged client is
  unlinked, and every copy equals its agency's name.
- The history row is present.
- Keep `rollback-agencies.sql` in the scratchpad and mention it in the
  report.

Report what ran. Never print the connection string.

**Step B1.5: Types** (`src/lib/supabase/types.ts`, by hand):
- `agencies` (Row, Insert, Update).
- `agency_id: string | null` on `clients` (Row, and optional in Insert and
  Update).
- `Functions`: `agency_id_for` and `merge_agencies`.
- Export `Agency = Tables<"agencies">` and
  `AgencyKind = "agency" | "developer"`.

**Step B1.6: Server code.**
- **`src/lib/validation/agency.ts`**: `agencyFormSchema(t)`:
  - `name`: `cleanAgencyName`, 1–120 characters.
  - `kind`: enum.
  - `email`: `""` or `z.email()`, max 254.
  - `phone`: `optionalText(50)`.
  - `website`: `""` or an http(s) URL of up to 300 characters; prefix
    `https://` when the scheme is missing.
  - `notes`: `optionalText(2000)`.
  - `registration_valid_months`: optional integer 1–36.
  - Tests in `src/lib/validation/agency.test.ts`: the bounds, the website
    prefix, `javascript:` rejected, and a tab-edged name cleaned.
- **`src/lib/actions/agencies.ts`** (`"use server"`). Every action:
  - calls `supabase.auth.getUser()` and validates with zod
  - logs raw errors with `console.error` and returns localised messages from
    `agencies.errors.*`
  - calls `revalidatePath("/agencies")`, plus the detail path and
    `"/clients"` where relevant

  The actions:
  - **`createAgency(values)`** returns `{ error, id?, name?, existed? }`. On
    `23505`:
    1. Call `supabase.rpc("agency_id_for", { p_agent: user.id, p_name: values.name })`.
    2. Read that row by id, and return it with `existed: true`.

    Never look it up with `ilike`: `%` and `_` are wildcards there.
  - **`updateAgency(id, values)`**
  - **`deleteAgency(id)`**: **one statement**,
    `delete().eq("id", id).select("id")`:
    - An empty result means not found.
    - The FK's `set null` plus `clients_sync_agency` clear both client
      columns atomically.
    - From B2 on, a `23503` means the agency has registrations. Nothing
      changes in that case; return `agencies.errors.hasRegistrations`.
  - **`mergeAgencies(fromId, intoId)`**: `supabase.rpc("merge_agencies", …)`.
    Map `agency_not_found` and `agency_merge_same`.
- **`src/lib/data/agencies.ts`**:
  - **`getAgencies()`**: `id, name, kind, email, phone, website, registration_valid_months, clients(side, is_active)`,
    ordered by name. Count buyers and sellers (active only) in JS. Returns
    `null` on `isMissingTableError`.
  - **`getAgency(id)`**: the agency plus
    `clients(id, first_name, last_name, side, stage, is_active, priority, updated_at)`.
    It returns:
    - `"unavailable"` on `isMissingTableError`
    - `null` when not found **or on `22P02`** (a non-uuid id, the
      `getTaskById` pattern)
    - otherwise the row
  - **`getAgencyChoices()`**: `id, name, kind, registration_valid_months`,
    plus the client count and per-side counts (inactive included), sorted by
    count then name. Returns `null` on `isMissingTableError`. Used by the
    picker and the list filter.
- **Client form values**: `ClientFormValues` gains
  `agency_id: z.uuid().nullable().optional()`.
- **`createClient`/`updateClient`**:
  - **`agency_id` is a string**:
    - Read the agency under RLS. Not found →
      `clients.errors.agencyNotFound`.
    - Write `agency_id` and `agency = row.name`.
  - **`agency_id === null`** (the picker's "No agency"): write
    `agency_id: null, agency: null`.
  - **`agency_id === undefined`** (the fallback form, or the table is
    missing):
    - Keep A's `canonicalAgency`, and never send `agency_id`.
    - The trigger links the text.
  - `updateClient` gains the `getUser()` check it lacks today.
- **Form pages**:
  - Both `/clients/new` and `/clients/[id]/edit` add `getAgencyChoices()`
    to their `Promise.all` and pass `agencyChoices` to `ClientForm`.
  - When `agencyChoices` is an array, the edit defaults include
    `agency_id: client.agency_id ?? null`, and the new form defaults to
    `agency_id: null`.
  - When it is `null`, leave `agency_id` out (`undefined`).
- **`search.ts`**: `searchIndex()` returns
  `{ clients: SearchClient[]; agencies: SearchAgency[] }`:
  - `SearchAgency` is `{ id, name, kind }`.
  - Agencies: `select("id, name, kind").order("name").limit(200)`.
  - On a missing table, return `[]`. On any other agencies error, log it and
    return `[]`, so client search keeps working.
- **`quick-search.tsx`**: the state becomes `SearchIndex | null`, and
  `.catch` sets `{ clients: [], agencies: [] }`. The client group reads
  `index.clients`.

**Step B1.7: The picker**, `src/components/agencies/agency-picker.tsx`
(client component).
- **Props**:
  `{ value: string | null, onChange(id: string | null, name: string | null), choices, allowCreate = true }`.
- **Trigger**: an outline button showing the chosen name (plus a "Developer"
  `Tag` when relevant), or "No agency".
- **`PopoverContent`**: `w-[var(--radix-popover-trigger-width)]`, full width
  on phones. Inside:
  - a search `Input` (autofocus)
  - a `role="listbox"` list filtered by `agencyKey` includes: "No agency",
    then the choices
  - arrow keys move the active option; Enter selects
  - when the typed key matches no choice: `Create "X"`, with a two-button
    kind toggle (Agency / Developer). It calls `createAgency` and selects
    the result (an `existed` result just selects it).

In `client-form.tsx`:
- **When `agencyChoices` is an array**, render the picker. Its `onChange`
  runs:
  - `form.setValue("agency_id", id)`, where `id` is a uuid or `null`
  - `form.setValue("agency", name ?? "")`, never `null`, because
    `optionalText` rejects it
- **When it is `null`** (table missing), keep A's input and chips.

**Step B1.8: Links and filter by id** (the names still come from the copy,
D14):
- **Links**: where `client.agency_id` is set, link the name to
  `/agencies/<id>` in:
  - `client-detail-view.tsx:194` (header meta) and `:482-486` (Details row)
  - `client-sheet.tsx:278-279`
- **List filter**:
  - `ClientsScreen` loads `getAgencyChoices()` and passes it to
    `ClientsView`.
  - Option values: an agency's uuid. Choices with at least one client on
    this side, inactive included, become options.
  - Rows with text but no id (a deploy before the migration) fall back to
    A's `k:` values.
  - `?agency=<uuid>`:
    - Not among the choices (deleted): fall back to "All" and remove the
      param.
    - Among the choices but with no visible rows (e.g. only inactive
      clients): **keep the filter**, show the no-matches state with a "Clear
      filter" action, and label the select from the choice's name.
  - An old `k:<key>` URL resolves to the choice whose `agencyKey(name)`
    matches.
  - With `agencyChoices === null`, keep A's behaviour.
- **Agency page**: "View in list" links to
  `/clients/buyers?agency=<id>` and `/clients/sellers?agency=<id>`.

**Step B1.9: Routes and shell.**
- **`src/app/(app)/agencies/page.tsx`** renders `AgenciesView`:
  - `null` → `Notice` "Agencies aren't available yet."
  - A toolbar with search and "New agency" (`AgencyDialog`).
  - One `Panel` row per agency: name, kind `Tag`, buyers count, sellers
    count. A row menu offers:
    - Edit
    - "Merge into…" (`MergeAgencyDialog`, a target `Select` plus an
      explanation)
    - Delete (`ConfirmDialog`: "Its clients stay, with no agency.")
  - Empty state: "Agencies appear here when you tag a client, or add one
    now."
  - When an agency's key is `direct`, `directo`, `none` or `n/a`, show a
    `Notice`: "“{name}” is saved as an agency. Clients with no agency already
    count as direct, so you can delete or merge it."
  - When an agency has 0 clients, show a muted "No clients" and offer
    Delete first in its menu. This also covers agencies left behind by an
    undone import (plan 012).
- **`src/app/(app)/agencies/[id]/page.tsx`**:
  - `params: Promise<{ id: string }>`.
  - `getAgency(id)`:
    - `"unavailable"` → `Notice`
    - `null` → `notFound()`. A non-uuid id is a 404, not a 500.
  - A header with the name, kind `Tag`, and `mailto:`/`tel:`/website links
    (`rel="noopener noreferrer"`, `target="_blank"`).
  - Panels:
    - "Buyers (n)" and "Sellers (n)": rows link to `/clients/<id>`, with
      stage tags and a "View in list" `PanelAction`
    - Notes
  - B2 adds Registrations; C adds Money.
- **Breadcrumb**. Widening the type isn't enough, so change all four places:
  1. **`src/lib/crm.ts`**: add
     `agencyRecordId(pathname)`, using `/^\/agencies\/([^/]+)$/`, next to
     `clientRecordId`. Test it in `crm.test.ts`:
     - `/agencies/abc` gives `abc`
     - `/agencies` gives `null`
     - `/agencies/abc/x` gives `null`
  2. **`shell-context.tsx`**: widen `ShellCrumbValue` to
     `{ side: ClientSide; label: string } | { section: "agencies"; label: string }`.
     `ShellCrumb(props: ShellCrumbValue)`:
     - derives `const kind = "side" in props ? props.side : props.section`
     - rebuilds the value inside the layout effect
     - uses `[setCrumb, kind, props.label]` as deps
  3. **`app-bar.tsx`**:
     - `onRecord` becomes
       `clientRecordId(pathname) != null || agencyRecordId(pathname) != null`.
     - For `"section" in crumb`, render "Agencies › {name}", with the first
       part linking to `/agencies`.
     - Add `pathname.startsWith("/agencies")` → `t("agencies")` for the plain
       title.
  4. **`app-sidebar.tsx:145-147`**: narrow the crumb with
     `crumb && "side" in crumb ? crumb.side : null`. The Agencies item uses
     `within("/agencies")`, so it stays active on detail pages.

  The agency detail page renders
  `<ShellCrumb section="agencies" label={name} />`.
- **Navigation**:
  - Add `"/agencies"` to `PROTECTED_PREFIXES` (alphabetical, after
    `"/admin"`).
  - Add a sidebar `NavItem` after Tasks, with the lucide `Handshake` icon.
  - In ⌘K:
    - Add an "Agencies" item to `pages` (`quick-search.tsx:103-118`).
    - Add an "Agencies" result group that appears only when the query is
      non-empty. It shows up to 5 agencies whose `agencyKey(name)` includes
      `agencyKey(query)`, each opening `/agencies/<id>`.
- **Copy**:
  - A new namespace `agencies` (en/es), registered in
    `src/i18n/messages.ts`.
  - `nav.agencies` = "Agencies" / "Agencias".
  - `clients.errors.agencyNotFound`.
  - Spanish kinds: "Agencia" / "Promotora".

**Step B1.10: Privacy, terms and export.**
- **Privacy §4**:
  - EN (`privacy.en.tsx:149-153`): add "the agencies and developers you work
    with, and any business contact details you enter for them" to the list.
  - ES (`privacy.es.tsx:152-156`): "las agencias y promotoras con las que
    trabajas y los datos de contacto profesionales que guardes de ellas".
- **Terms, DPA annex §A**:
  - EN (`terms.en.tsx:227-233`):
    - Append to "Data": ", and the agencies and developers you work with,
      with the business contact details you enter for them".
    - "Data subjects" becomes "your buyers, sellers, prospects and their
      contacts, and the people at agencies and developers you work with".
  - ES (`terms.es.tsx:234-240`): "…, y las agencias y promotoras con las que
    trabajas, con los datos de contacto profesionales que guardes de ellas"
    and "…, y las personas de las agencias y promotoras con las que
    trabajas".
- Bump `LEGAL_UPDATED.privacy` and `.terms`. D22: this is not a material
  change, so no 30-day email.
- If plan 013's legal step is being done the same week, merge both into one
  bump.
- **Export**: if plan 011 has landed, add `agencies.csv` and a sheet (name,
  kind, email, phone, website, registration valid months, notes, created,
  ID). The buyer and seller `agency` column keeps reading the copy until B3.

**Verify**:
- `npm run typecheck && npm run lint && npm test && npm run build` pass.
  `routes.test.ts` passes with the new route; `crm.test.ts` covers
  `agencyRecordId`.
- Preview pages (your own folder) with mock data for:
  - `AgenciesView`, including the Direct notice and a 0-client agency
  - the detail view
  - the picker: create flow, keyboard, phone width, and an `existed` result
  - the list filter with an agency that has only inactive clients
  - the app-bar crumb on `/agencies/<id>` (pass the shell's `route` prop)

  Check en/es, 375 px and desktop. Use the chrome-devtools MCP for Radix
  overlays.
- Signed out: `curl -si http://localhost:3000/agencies | head -1` prints a
  307 to `/login`.
- Signed-out `curl -si http://localhost:3000/agencies/not-a-uuid` also
  redirects. After the push, the founder opens `/agencies/not-a-uuid` and
  sees the 404 page.
- A founder smoke test after the push (see Test plan).

### Phase B2 — Buyer-registration log with in-app expiry reminders (3.5–4 d, gated)

**Step B2.0: Gate.** Continue only if either:
- the "Gates" table in `plans/README.md` records that at least 3 of the first
  5 interviews were green on G (D12, P1), or
- the founder says to build anyway.

Otherwise ship nothing more from this plan and STOP.

**Step B2.1: Probe, then write `supabase/migrations/<ts2>_buyer_registrations.sql`.**

The probe is read-only, like B1.1. Expected:
- `to_regclass` of `buyer_registrations` and `registration_files` is null.
- `'registration_expiring'` is **not** in `enum_range(null::public.notification_type)`.
- There is no `notifications.registration_id` column.
- `agencies` exists, with B1's history row.
- `<ts2>` follows B1.1's rule for picking a version.

Anything else is a STOP. The `if not exists` clauses below exist for
idempotence and would otherwise hide a clash.

```sql
-- ============================================================
-- Buyer registrations: a dated record of each buyer an agent registers with
-- another agency or developer (plan 015 phase B2). In-app expiry reminders
-- only. No DNI/NIE field (plan 015, D10); proof files may still contain one.
-- ============================================================
create table public.buyer_registrations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  -- NO ACTION (the default): deleting an agency that has registrations fails;
  -- an account deletion that cascades to both tables succeeds (plan 015, D24)
  counterparty_id uuid not null references public.agencies (id),
  property_label text not null,
  property_ref text,
  property_url text,
  property_id uuid references public.properties (id) on delete set null,
  method text not null default 'email',
  status text not null default 'pending',
  sent_on date not null,
  confirmed_on date,
  -- the day the agent went with the buyer to the property or development
  visited_on date,
  valid_months smallint,
  expires_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint buyer_registrations_label_len check (
    property_label ~ '[^[:space:]]' and char_length(property_label) <= 200
  ),
  constraint buyer_registrations_ref_len check (property_ref is null or char_length(property_ref) <= 60),
  constraint buyer_registrations_url_len check (property_url is null or char_length(property_url) <= 500),
  constraint buyer_registrations_method_valid check (method in ('email', 'resales_request', 'developer_form', 'viewing_sheet', 'other')),
  constraint buyer_registrations_status_valid check (status in ('pending', 'confirmed', 'declined', 'closed')),
  constraint buyer_registrations_confirmed_after_sent check (confirmed_on is null or confirmed_on >= sent_on),
  constraint buyer_registrations_months_range check (valid_months is null or valid_months between 1 and 36),
  constraint buyer_registrations_expires_after_sent check (expires_on is null or expires_on >= sent_on),
  constraint buyer_registrations_notes_len check (notes is null or char_length(notes) <= 2000)
);
create index buyer_registrations_client_id_idx on public.buyer_registrations (client_id);
create index buyer_registrations_counterparty_id_idx on public.buyer_registrations (counterparty_id);
create index buyer_registrations_property_id_idx on public.buyer_registrations (property_id) where property_id is not null;
create index buyer_registrations_open_expiry_idx on public.buyer_registrations (agent_id, expires_on)
  where status in ('pending', 'confirmed') and expires_on is not null;
create trigger buyer_registrations_set_updated_at
  before update on public.buyer_registrations
  for each row execute function public.set_updated_at();

alter table public.buyer_registrations enable row level security;
create policy "agent owns buyer registrations" on public.buyer_registrations
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (
    agent_id = (select auth.uid())
    and exists (select 1 from public.clients c
                 where c.id = buyer_registrations.client_id
                   and c.agent_id = (select auth.uid()) and c.side = 'buyer')
    and exists (select 1 from public.agencies a
                 where a.id = buyer_registrations.counterparty_id
                   and a.agent_id = (select auth.uid()))
    and (buyer_registrations.property_id is null
         or exists (select 1 from public.properties p
                     where p.id = buyer_registrations.property_id
                       and p.agent_id = (select auth.uid())))
  );

create table public.registration_files (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  registration_id uuid not null references public.buyer_registrations (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size bigint,
  kind public.property_attachment_kind not null, -- same pdf/image pair AttachMenu emits
  created_at timestamptz not null default now(),
  constraint registration_files_path_owned check (storage_path like (agent_id::text || '/%')),
  constraint registration_files_file_name_len check (char_length(file_name) <= 200)
);
create index registration_files_registration_id_idx on public.registration_files (registration_id);
create index registration_files_agent_id_idx on public.registration_files (agent_id);
alter table public.registration_files enable row level security;
create policy "agent owns registration files" on public.registration_files
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (
    agent_id = (select auth.uid())
    and exists (select 1 from public.buyer_registrations r
                 where r.id = registration_files.registration_id
                   and r.agent_id = (select auth.uid()))
  );

-- Merge now moves registrations too (B1's body plus one update).
create or replace function public.merge_agencies(p_from uuid, p_into uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_from public.agencies;
  v_into public.agencies;
begin
  if p_from = p_into then
    raise exception 'agency_merge_same' using errcode = '22023';
  end if;
  select * into v_from from public.agencies where id = p_from and agent_id = (select auth.uid());
  select * into v_into from public.agencies where id = p_into and agent_id = (select auth.uid());
  if v_from.id is null or v_into.id is null then
    raise exception 'agency_not_found' using errcode = 'P0002';
  end if;
  update public.clients set agency_id = p_into where agency_id = p_from;
  update public.buyer_registrations set counterparty_id = p_into where counterparty_id = p_from;
  update public.agencies set
    email = coalesce(email, v_from.email),
    phone = coalesce(phone, v_from.phone),
    website = coalesce(website, v_from.website),
    registration_valid_months = coalesce(registration_valid_months, v_from.registration_valid_months),
    notes = case
      when v_from.notes is null then notes
      when notes is null then v_from.notes
      else left(notes || E'\n\n' || v_from.notes, 2000)
    end
  where id = p_into;
  delete from public.agencies where id = p_from;
end;
$$;

-- A new enum value cannot be used in the transaction that adds it; nothing
-- in this file uses it.
alter type public.notification_type add value if not exists 'registration_expiring';
alter table public.notifications
  add column if not exists registration_id uuid references public.buyer_registrations (id) on delete cascade;
create index if not exists notifications_registration_id_idx
  on public.notifications (registration_id) where registration_id is not null;
```

**Rollback file** `<scratchpad>/rollback-registrations.sql`:
- Drop `notifications_registration_id_idx` and `notifications.registration_id`.
- Drop `registration_files`, then `buyer_registrations`.
- Paste B1's `merge_agencies` definition back.
- Delete the `<ts2>` history row.
- `registration_expiring` stays in the enum: a value can't be dropped, and
  nothing uses it.
- Before a **live** rollback, remove any uploaded proof files: list
  `registration_files.storage_path` and delete those bucket objects through
  the storage API. Otherwise they are orphaned.

**Step B2.2: Rehearse, with nothing kept.**
- Copy `rehearse-agencies.mjs` to `rehearse-registrations.mjs`.
- Replace its body: apply the B2 file (B1 is live), run the checks below as
  the founder, then run `rollback-registrations.sql` and check that the
  tables and the column are gone and that `merge_agencies` no longer
  mentions `buyer_registrations`.
- Set up two rehearsal buyers, both tagged with a rehearsal agency, and one
  rehearsal counterparty.

Checks:
- A valid insert succeeds.
- **Registration writes never touch `clients`**: the buyer's `updated_at` is
  unchanged.
- These fail:
  - a **seller** client → `row-level security`
  - another agent's counterparty → `row-level security`
  - another agent's property → `row-level security`
  - `confirmed_on < sent_on` → `buyer_registrations_confirmed_after_sent`
  - `method = 'fax'` → `buyer_registrations_method_valid`
  - `property_label = E' \t'` → `buyer_registrations_label_len`
- Merging the counterparty into another agency moves the registration.
- **Deleting an agency that has a registration**:
  - It fails with `violates foreign key constraint`.
  - **Both** rehearsal buyers still have `agency_id` and `agency`: the
    delete is one statement, so nothing changed.
- **Cascade**: delete the rehearsal buyer that holds the registration. Its
  registration goes, and the counterparty can then be deleted.
- A `registration_files` row with a path outside the agent's folder fails
  with `registration_files_path_owned`.
- Deleting a registration cascades its file rows.
- The other agent sees 0 of the founder's registrations.
- `notifications.registration_id` exists.
- **Not rehearsed**: account deletion, which cascades from `auth.users` to
  both tables. It isn't rehearsed on the live `auth.users`; D24's temp-table
  test covers its shape.
- Don't insert a `registration_expiring` row (the enum rule).

**Step B2.3: Apply live, right before the B2 push**, as in B1.4: quiet hour,
re-probe, re-rehearse, then run
`apply-migration.mjs <file> <ts2> buyer_registrations`. Check afterwards:
- Both tables exist with RLS on.
- `select 'registration_expiring'::public.notification_type` works after
  the commit.
- The table probes return `200 []`.
- The history row is present.

**Step B2.4: `src/lib/registrations.ts`** (pure, client-safe):
- **Vocabulary**: `REGISTRATION_STATUSES`, `REGISTRATION_METHODS`,
  `WARN_DAYS = 14`, `GRACE_DAYS = 7`, `REGISTRATION_SIGNAL_LIMIT = 1000`,
  and `STATUS_TONE`:
  - `pending`: amber
  - `confirmed`: green
  - `declined`: red
  - `closed`: neutral
- **Date-key helpers**. `src/lib/attention.ts` has none for adding days, so
  all of these use UTC arithmetic on `yyyy-MM-dd`, like
  `calendarDaysFromToday`:
  - `addDaysToDateKey(key, days)`
  - `addMonthsToDateKey(key, months)`, which clamps to the month end
  - `laterDateKey(a, b)`
- **`computeExpiry({ sent_on, confirmed_on, valid_months })`**: returns
  `addMonthsToDateKey(confirmed_on ?? sent_on, valid_months)`, or `null`
  without months.
- **`confirmedOnFor(todayKey, sentOn)`**: `laterDateKey(todayKey, sentOn)`,
  so confirming never breaks `confirmed_after_sent`.
- **`registrationState(row, todayKey)`** returns
  `{ state, days }`:

  | state | When |
  |---|---|
  | `closed`, `declined` | from `status` |
  | `open` | no `expires_on` |
  | `active` | diff > 14 |
  | `expiring` | 0 ≤ diff ≤ 14 |
  | `expired` | −7 ≤ diff < 0 |
  | `lapsed` | diff < −7 |

  `diff` is `calendarDaysFromToday(expires_on, todayKey)`.
- **`isRemindable(state)`**: true for `expiring` and `expired`.
- **`registrationPingKey(id, expiresOn)`**: `reg-exp:${id}:${expiresOn}`.
- **`registrationDueAt({ expiresOn, createdAt, diff, timeZone, nowISO })`**:
  the bell row's `due_at`, which is **never in the future**:
  - `diff >= 0`: the later of these two:
    - the agent's start of day of `addDaysToDateKey(expiresOn, -WARN_DAYS)`
    - the registration's `createdAt`
  - `diff < 0`: the agent's start of day of `expiresOn`.
  - The result is capped at `nowISO`.
  - "Start of day" is
    `dayRangeInTimeZone(\`${key}T12:00:00Z\`, timeZone).start`
    (`src/lib/home.ts:63`). Noon UTC is the same calendar day in every zone
    from UTC−11 to UTC+11, which covers LeadWing's audience.

**Verify**: `registrations.test.ts` covers:
- **Month arithmetic**:
  - 2026-01-31 + 1 → 2026-02-28
  - 2028-01-31 + 1 → 2028-02-29
  - 2026-03-31 + 1 → 2026-04-30
  - 2026-11-15 + 3 → 2027-02-15
- **`addDaysToDateKey`**:
  - 2026-12-25 + 14 → 2027-01-08
  - 2028-03-01 − 1 → 2028-02-29
- confirmed_on beats sent_on
- `confirmedOnFor("2026-09-16", "2026-09-17")` → `2026-09-17`
- every state boundary (15, 14, 0, −1, −7, −8 days)
- **`registrationDueAt`**:
  - An expiring row created before its warn window gets the warn day's
    Madrid midnight.
  - One created inside the window gets its `createdAt`.
  - An expired row gets its expiry day's Madrid midnight.
  - Every result is ≤ `nowISO`.
  - A DST day (2026-10-25) in `Europe/Madrid` gives `…T22:00:00.000Z` of
    the previous day.

**Step B2.5: Validation and actions.**
- **`src/lib/validation/registration.ts`**: `registrationFormSchema({ t, todayKey })`:
  - `counterparty_id`: uuid
  - `property_label`: trimmed, 1–200
  - `property_ref`: ≤ 60
  - `property_url`: http(s) only, ≤ 500
  - `property_id`: optional uuid
  - `method`, `status`: enums
  - `sent_on`: a date key, **not after `todayKey`** (the agent's zone,
    passed in by the action)
  - `confirmed_on`: optional, ≥ `sent_on` and ≤ `todayKey`
  - `visited_on`: optional date key
  - `valid_months`: optional 1–36
  - `expires_on`: optional, ≥ `sent_on`
  - `notes`: ≤ 2000
  - `save_default`: boolean
- **`src/lib/actions/registrations.ts`**. Every action follows the B1.6 rules
  (auth, zod, friendly errors, no raw `error.message`), computes `todayKey`
  with `dateKeyInTimeZone(now, await getAgentTimeZone())`, and **never writes
  `clients`** (plan 009: this is contact with the counterparty, not the
  buyer).
  - **`addRegistration(clientId, values)`**:
    1. Check that the client is the agent's buyer, and that the counterparty
       and property (if any) are the agent's.
    2. When `expires_on` is empty and `valid_months` is set, compute it on
       the server.
    3. With `save_default`, update the agency's
       `registration_valid_months`.
    4. Revalidate `/clients/<id>`, `/agencies/<counterparty>` and `/home`.
  - **`updateRegistration(id, values)`**: if `status`, `expires_on` or
    `counterparty_id` changed, delete this registration's **unread**
    notifications.
  - **`setRegistrationStatus(id, status)`**:
    - For `confirmed`, set `confirmed_on = confirmedOnFor(todayKey, row.sent_on)`.
    - If the stored `expires_on` equals `computeExpiry` of the old values,
      recompute it; otherwise keep the agent's override.
    - Delete unread pings for `declined` and `closed`.
  - **`deleteRegistration(id)`**: remove its `registration_files` bucket
    objects, then the row (the cascade removes pings and file rows).
  - **`addRegistrationFile(clientId, registrationId, meta)`** clones
    `addPropertyAttachment`. The path must start with
    `${user.id}/${clientId}/registrations/`.
  - **`deleteRegistrationFile(clientId, fileId)`**.
- **`deleteClient`** (`actions/clients.ts:137-187`): collect
  `registration_files.storage_path` for the client's registrations before the
  delete. A missing table gives `data: null`, which is skipped.

**Verify**: `validation/registration.test.ts` covers:
- the bounds and the URL scheme
- `sent_on` = tomorrow is rejected
- `confirmed_on` before `sent_on` is rejected
- a whitespace-only label is rejected

**Step B2.6: Loaders and the buyer page.**
- **`src/lib/data/registrations.ts`**. Both loaders return `null` on a
  missing table.
  - `getClientRegistrations(clientId)`:
    `*, counterparty:agencies(id, name, kind, registration_valid_months), files:registration_files(id, storage_path, file_name, mime_type, size, kind, created_at)`,
    ordered by `sent_on desc`.
  - `getAgencyRegistrations(agencyId)`: the same, with
    `client:clients(id, first_name, last_name, is_active)`.
- **`src/lib/data/seller.ts`**: a new `getListingChoices()`.
  `getProperties` is per client, so this lists the agent's own listings:
  - Query: `properties` with `id, address, city, property_type, bedrooms, price, client:clients(first_name, last_name, is_active)`,
    ordered by `created_at desc`, limit 200.
  - Label each row as "address, city" (or "type · N bed").
- **`src/app/(app)/clients/[id]/page.tsx`**: add these to the `Promise.all`:
  - `isBuyer ? getClientRegistrations(client.id) : null`
  - `isBuyer ? getAgencyChoices() : null`
  - `isBuyer ? getListingChoices() : null`
- **`src/app/(app)/agencies/[id]/page.tsx`**: add
  `getAgencyRegistrations(id)`.

**Step B2.7: UI.**
- **`src/components/clients/sections/registrations-section.tsx`**:
  - **Draft provider**. It exports a client `RegistrationDraftProvider` and
    a `useRegistrationDraft()` hook:
    - The provider renders the dialog once and exposes
      `open(prefill?)`.
    - `client-detail-view.tsx` is a server component, so it renders
      `<RegistrationDraftProvider …>` around the buyer block
      (Preferences → Reservation), and only when registrations aren't
      `null`.
  - **Placement**: wrap the section in
    `<div id="registrations" className="scroll-mt-20">`, rendered after
    `ViewingsSection` (`client-detail-view.tsx:508-512`).
  - `Panel`: title "Registrations", `count`, action "Log registration".
  - **Each row**:
    - the counterparty name, linked to `/agencies/<id>`, with a "Developer"
      tag when relevant
    - the property label, the ref, and an external-link icon for the URL
    - "Sent 3 Sep · Email · Confirmed 5 Sep · Visited 6 Sep"
    - the status `Tag` (`STATUS_TONE`)
    - an expiry `Tag`: "Expires in 12 days" (orange), "Expires today",
      "Expired 3 days ago" (red), or "Valid until 5 Mar 2027" (neutral)
    - `AttachMenu` + `AttachmentChip`s (`useFileUpload` folder
      `registrations`)
    - a row menu: Mark confirmed, Mark declined, Close, Edit, Delete
      (`ConfirmDialog`)
  - Empty state: "Keep a dated record of every agency or developer you
    register this buyer with."
  - Footer, muted: "Your own dated record. Keep the other side's written
    confirmation as proof."
- **`registration-dialog.tsx`**:
  - Counterparty: `AgencyPicker`, with create.
  - Property (required; placeholder "3-bed villa, Nueva Andalucía"),
    Reference, Link.
  - "One of your listings": a `Select` fed by `getListingChoices()`, shown
    only when the list isn't empty.
  - Method, Sent on (`DatePicker`, defaults to today in the agent's zone,
    no future dates), Status (Pending/Confirmed), and Confirmed on (shown
    when Confirmed).
  - "Visited with the buyer on" (optional `DatePicker`).
  - "Valid for N months": pre-filled from the counterparty's saved term,
    otherwise empty. Helper: "Use the window in your agreement with them."
  - Checkbox "Save N months for {agency}": shown when N differs from the
    saved term.
  - "Expires on": computed and editable. "Recalculate" appears when
    overridden.
  - Notes, with helper "Don't paste ID numbers here; attach the proof
    instead."
  - A non-blocking `Notice` when an open, unexpired registration exists for
    this buyer and counterparty: "You registered this buyer with {agency} on
    {date}."
- **`viewings-section.tsx`**:
  - When `useRegistrationDraft()` returns a value, add a row-menu item "Log
    registration".
  - It calls `open({ property_label: viewing title, sent_on: today, visited_on: the viewing's date if it is in the past })`.
  - Without the provider (table missing), the item is hidden.
- **`agency-detail-view.tsx`**: a Registrations panel (buyer, property,
  status, expiry). **`agency-dialog.tsx`**: expose
  `registration_valid_months` ("Registrations with them last N months").

**Step B2.8: Reminders** (in-app only, D7). **Every query filters by
agent.** Plan 016 moves generation into a service-role cron, where RLS no
longer separates tenants.
- **Context** (`src/lib/data/attention.ts`):
  - **If plan 016 Step 10 has landed**, `AttentionContext` already is
    `{ agentId, nowISO, todayKey, timeZone }`.
  - **If not**, make exactly that change now, as 016 Step 10.1 describes:
    - `dashboard.ts` takes `agentId` from `getSessionUser()` and `timeZone`
      from `getAgentTimeZone()`.
    - `notifications.ts` passes `agentId` and `agentZone`.
    - Add `.eq("agent_id", ctx.agentId)` to the three existing queries too.
  - Don't add any other field (no `zoneTodayKey`).
- **The fourth query**, with `regKey = dateKeyInTimeZone(ctx.nowISO, ctx.timeZone)`:
  ```ts
  supabase.from("buyer_registrations")
    .select("id, client_id, expires_on, created_at, property_label, counterparty:agencies(agent_id, name), client:clients(agent_id, first_name, last_name, is_active)")
    .eq("agent_id", ctx.agentId)
    .in("status", ["pending", "confirmed"])
    .gte("expires_on", addDaysToDateKey(regKey, -GRACE_DAYS))
    .lte("expires_on", addDaysToDateKey(regKey, WARN_DAYS))
    .order("expires_on")
    .limit(REGISTRATION_SIGNAL_LIMIT)
  ```
- **Result handling**:
  - On `isMissingTableError`, return `registrationExpiries: null`. Throw on
    other errors.
  - The return type gains
    `registrationExpiries: { items: RegistrationExpiry[]; truncated: boolean } | null`.
  - `RegistrationExpiry` is
    `{ registrationId, clientId, name, counterparty, propertyLabel, expiresOn, createdAt, diff }`.
  - `truncated` is `rows.length === REGISTRATION_SIGNAL_LIMIT`, counted on
    the **raw** rows.
  - `items` skips inactive clients.
  - **Guard the embeds** the way plan 016 Step 10.3 does. Pass both
    `client` and `counterparty` through `ownEmbed(embed, ctx.agentId)`
    (016's helper in `src/lib/attention.ts`; add it as 016 describes if it
    isn't there yet). A row whose client or counterparty isn't the agent's
    own is skipped and added to 016's `foreignRows` count (if that count
    exists yet).
- **Where the bell rows are built** (E5, the notifications amendment to
  D-F): expiry pings are time-based rows.
  - Before 016 Phase 2 lands: B2 adds no cron route of its own, so the
    producer runs on the existing request-time path, `syncNotifications` in
    `src/lib/actions/notifications.ts`.
  - When 016 Phase 2 (Step 13) lands, the producer moves into
    `src/lib/notify/generate.ts`, where the `agent_id` filter is what keeps
    tenants apart. If 016 Phase 2 is already live when B2 is built, write it
    there directly.

  In either place:
  - `NotificationInsert` gains an **optional** `registration_id?`.
  - For each expiry, push:
    - `type: "registration_expiring"`
    - `title`, with a separate message per case (ICU plural can't turn a
      negative count into "ago"):
      - `diff > 0`: `t("registrationExpiring", { agency, days: diff })`
      - `diff === 0`: `t("registrationExpiresToday", { agency })`
      - `diff < 0`: `t("registrationExpired", { agency, days: Math.abs(diff) })`
    - `body`: `${name} · ${propertyLabel}`
    - `client_id`, `registration_id`
    - `dedupe_key: registrationPingKey(id, expiresOn)`
    - `due_at: registrationDueAt(…)`. This is never in the future, so the
      row doesn't sit above the feed or get filed under a future day. It
      moves once, from the warn day to the expiry day, when it expires. The
      upsert refreshes `due_at` and leaves `read_at` alone.
  - **Stale cleanup**: when `registrationExpiries !== null` and
    `!registrationExpiries.truncated`, delete this agent's
    (`.eq("agent_id", agentId)`) `reg-exp:%` rows that this sync didn't
    produce. Delete unread ones at once and read ones after 30 days, with
    the same code shape as the task cleanup.
  - **The generic 30-day prune is safe**: a read row can't be pruned while
    its window (21 days) is still open.
- **`src/lib/notifications.ts`**: route `registration_expiring` to
  `/clients/<client_id>#registrations`, before the generic branch. Add that
  case to `src/lib/notifications.test.ts`.
- **`notification-item.tsx`**: `ICONS.registration_expiring = FileClock`,
  `TONES.registration_expiring = "orange"`.
- **Types**: add the enum value and `registration_id` to `notifications`.
- **Copy**:

  | Key | EN | ES |
  |---|---|---|
  | `server.notifications.registrationExpiring` | Registration with {agency} expires in {days, plural, one {# day} other {# days}} | El registro de comprador con {agency} caduca en {days, plural, one {# día} other {# días}} |
  | `server.notifications.registrationExpiresToday` | Registration with {agency} expires today | El registro de comprador con {agency} caduca hoy |
  | `server.notifications.registrationExpired` | Registration with {agency} expired {days, plural, one {# day} other {# days}} ago | El registro de comprador con {agency} caducó hace {days, plural, one {# día} other {# días}} |
  | `notifications.types.registration_expiring` | Registration | Registro de comprador |

**Verify**: `src/lib/data/attention.test.ts`. It is new, or extends plan
016's file, reusing its recording fake client (a chainable builder that
logs calls and returns canned results). It asserts:
- every `from(...)` chain carried `eq("agent_id", <id>)`, including
  `buyer_registrations`
- `gte`/`lte` received `regKey − 7` and `regKey + 14`
- a `PGRST205` result gives `registrationExpiries: null` without throwing
- an inactive client's registration is skipped, while `truncated` still
  counts it
- a registration whose embedded client or counterparty has another
  `agent_id` produces no item, and no name from it appears anywhere in the
  result
- 1,000 raw rows set `truncated`

**Step B2.9: Home.**
- `AttentionItem.kind` gains `"registration"`; `KIND_TONE.registration` is
  `"orange"`.
- `getNeedsAttention` pushes the expiries right after the reservation items:
  - `id`: `regexp:${registrationId}:${expiresOn}`
  - `title`: the buyer's name
  - `detail`: `home.attention.registrationExpiring` / `…ExpiresToday` /
    `…Expired` with `{ agency, property, days }`, the same three-way split
  - `href`: `/clients/<id>#registrations`
- `null` → no items.
- An optional Home-only item, "Pending confirmation for 3+ days", may be
  skipped if time is short.

**Step B2.10: Copy, privacy, terms and export.**
- **Namespaces**: `clientDetail.registrations.*`, `agencies.registrations.*`,
  `home.attention.registration*`, and the method and status labels (en/es).
- **Spanish vocabulary**:
  - Use **"Registro de comprador"** (plural "Registros de compradores"),
    never a bare "Registro". A bare word could read as the Andalusian agent
    register (Ley 5/2025) or as account sign-up.
  - Labels: "Pendiente", "Confirmado", "Rechazado", "Cerrado", "Formulario
    de la promotora", "Solicitud de visita en Resales", "Hoja de visita".
- **Privacy §4** (en/es): add "registrations of your buyers with other
  agencies or developers, and the proof files you upload, which may include
  identity documents".
- **Privacy §5**: say that registrations are **not** sent to the AI.
- **Terms, DPA annex §A** (en/es): add those registration records and proof
  files to "Data".
- Bump `LEGAL_UPDATED.privacy` and `.terms` (D22).
- **Plan 011, if landed**:
  - `registrations.csv` + sheet: buyer name and ID, counterparty, kind,
    property, ref, link, method, status, sent, confirmed, visited, valid
    months, expires, notes, created, ID
  - `files.csv` rows with "attached to: registration"
- **Landing**: apply the "after B2" lines under "Until this ships".

**Verify**:
- `npm run typecheck && npm run lint && npm test && npm run build` pass,
  including:
  - `registrations.test.ts`
  - `validation/registration.test.ts`
  - `data/attention.test.ts`
  - the new `notifications.test.ts` case
- Preview:
  - the section with 5 mock rows (one per state)
  - the dialog: create counterparty, save default, override expiry,
    duplicate notice, visited date
  - the viewings menu item opening the dialog
  - the bell item

  Check en/es, 375 px and desktop.
- After the push, the founder logs one real registration with an expiry 10
  days out:
  - The bell shows one row within 5 minutes, dated today or earlier, and
    Home lists it.
  - Closing the registration removes the unread row on the next sync.

### Phase B3 — Contract: retire the `clients.agency` text (1 d)

**Step B3.0: Gates.** Run B3 only when all of these hold:
- B1 has been live for at least 7 days.
- Vercel runtime logs show no PGRST errors mentioning `agencies`.
- Plan 012 (import) and plan 014 (lead inbox) are not built, or each RPC
  has been redefined (in a new migration) to resolve the text with
  `public.agency_id_for(<agent>, <text>)` and write `agency_id` only.
- Plan 011 (export), if built, reads the name through the join.

**Step B3.1: Code that no longer names `clients.agency`.**
- **Reads**: embed `agency_ref:agencies!clients_agency_id_fkey(id, name, kind)`
  and read the name through a helper, `agencyOf(row)`, at:
  - `data/clients.ts` (`getClientRows`, `getClientById`)
  - `clients-table.tsx:312-319`, `clients-kanban.tsx:61-62`,
    `client-sheet.tsx:143/:278`
  - `client-detail-view.tsx:194/:343/:482-486`
  - `clients-view.tsx` (search haystack, filter labels)
  - `search.ts` (select `agency_ref:…` instead of `agency`) and
    `quick-search.tsx:135/:146`
  - `messages.ts:26/:58`
  - plan 011's `columns.ts` / `load.ts` (the `agency` column = the joined
    name)
- **Writes**: `createClient`/`updateClient` write `agency_id` only. Remove
  `canonicalAgency`, the text fallback in the form, `agency` from
  `validation/client.ts:17`, and the pre-fill at `edit/page.tsx:35`.
- **Grep**: `grep -rn "\.agency\b\|agency:\|\"agency\"\|, agency\b" src --include=*.ts --include=*.tsx`
  may list only `agency_id`, `agencyOf`, `agency_ref`, template vars and
  calculator fields.
- **Ship**:
  1. Run the full CI chain.
  2. Push.
  3. Wait for Vercel **Ready** on the pushed commit.
  4. The founder runs a signed-in smoke test: list, detail, ⌘K, an AI
     draft, creating and editing a client with an agency.

**Step B3.2: Probe and back up** (live, before the drop):
- **Read-only consistency probes**, which must all be 0:
  - `count(*) where agency is not null and agency_id is null`
  - `count(*) where agency_id is not null and agency is distinct from (select name from agencies where id = agency_id)`
- **Deployed code**: the production deployment's commit contains B3.1.
  Check with `vercel ls --scope lepadatumihails-projects` and `git merge-base --is-ancestor`.
- **Backup**, in one transaction:
  ```sql
  create schema if not exists backup;
  revoke all on schema backup from public, anon, authenticated;
  create table backup.clients_agency_<ts3> as
    select id, agent_id, agency from public.clients where agency is not null;
  ```
  The `backup` schema isn't exposed through the API. Drop the table after
  30 days.

**Step B3.3: Migration** `<ts3>_drop_client_agency_text.sql`:
```sql
drop trigger agencies_mirror_name on public.agencies;
drop function public.agencies_mirror_name();
drop trigger clients_sync_agency on public.clients;
drop function public.clients_sync_agency();

-- Ownership of agency_id still needs a check (the policy doesn't have one).
create or replace function public.clients_check_agency()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.agency_id is not null and not exists (
    select 1 from public.agencies a
     where a.id = new.agency_id and a.agent_id = new.agent_id
  ) then
    raise exception 'agency_not_owned' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger clients_check_agency
  before insert or update of agency_id on public.clients
  for each row execute function public.clients_check_agency();

alter table public.clients drop column agency;
```
- Leave `'agency'` in `clients_touch_updated_at`'s skip array. A missing key
  is harmless, and it spares a redefinition of the shared function.
- **Rehearse**:
  - the B1 script's tenancy checks (`agency_not_owned` on update and
    insert)
  - `updated_at` on an id-only update
  - a direct agency delete (`agency_id` becomes null)
  - the rollback below

  Then apply it with `apply-migration.mjs` and check as in B1.4.
- **Rollback**. B3.1's code never reads the column, so it keeps working
  either way:
  1. `alter table clients add column agency text`
  2. Recreate B1's `clients_sync_agency` and `agencies_mirror_name`, and
     drop `clients_check_agency`.
  3. `update clients c set agency_id = c.agency_id where c.agency_id is not null`.
     The trigger rewrites every copy. Cross-check the copies against
     `backup.clients_agency_<ts3>`.

**Step B3.4: Clean up.**
- Types: remove `agency` from `clients`.
- `plans/README.md` row 015.

**Verify**:
- The full CI chain.
- A signed-in smoke test of the list, the detail page, ⌘K and an AI draft.
- Vercel runtime logs show no `42703` or `PGRST204` mentioning `agency` for
  24 hours.

### Phase C — Commission deals, expected payments and "Owed to me" (hard-gated)

**Gate**: at least 3 of the first 8 solo agents green on F at the Fri 9 Oct
2026 checkpoint (D12). Green means any of:
- can't quickly say who owes them what
- keeps a commission spreadsheet
- has a chasing or cut-out story

If the gate passes:
- Re-plan this phase in detail (a new plan file) from this outline.
- Re-verify the current state.
- Have the founder confirm D15–D17 and D23 first.
- Ask P5 first: at a franchise office the agreements are signed by the
  agency, with its CIF, and the invoicing may not be the agent's.

- **Schema** (every amount nullable and ≥ 0; percentages 0–100). Table names
  follow D23, to avoid the calculator's `deal_analyses` modules and the
  `deal_type` enum.
  - **`commission_deals`**:
    - `client_id` primary key → clients, `on delete cascade`
    - `agent_id`
    - `registration_id` → buyer_registrations, `on delete set null`
    - `listing_agency_id` → agencies (the counterparty)
    - `via_agency_id` → agencies (defaults from `clients.agency_id`)
    - `property_label`, `sale_price`, `total_fee_before_vat`
    - `my_side_amount`, `my_side_pct`, `my_share_amount`, `my_share_pct`
    - `who_invoices` check (`me`, `my_agency`, `other_agency`, `developer`)
    - `closed_on`, `notes`
  - **`commission_payments`**:
    - `id`
    - `deal_id`, `on delete cascade`
    - `payer_agency_id`
    - `label` ≤ 120 ("at private contract")
    - `expected_on`, `amount_before_vat`
    - `invoice_ref` ≤ 60, `invoiced_on`
    - `paid_on`, `amount_received`
    - `notes`
  - **`commission_deal_files`**: the collaboration agreement and invoices
    issued elsewhere (the B2 file pattern).
  - RLS with an ownership check for every FK. Any FK that a write's own
    trigger could create needs a trigger-side check (see B1's note on
    snapshots).
  - The notification type `payment_due` + `notifications.deal_payment_id`.
- **Data**: copy `reservations.commission`/`closed_at` into
  `commission_deals` (1 live row with a commission on 16 Sep 2026). Point
  `getCommissionSummary` (`data/buyer.ts:58-76`) and A.6's list totals at
  it. Make the reservation fields read-only for one release, then drop them.
- **UI**:
  - A Deal panel next to Reservation, taking over
    `reservation-section.tsx:198-199` and `:363-384`.
  - A staged payment list (e.g. 2/3 + 1/3; 40/60 with a clawback note).
  - Invoice reference, date and upload only.
  - A Money panel on the agency page (owed by and to this agency).
  - A Home slot "Owed to me": overdue first, then the next 60 days, hidden
    when empty. It needs a new slot in `home-layout.tsx:7-36`.
  - Bell `payment_due` for overdue expected payments. Its `due_at` is never
    in the future (the B2 rule).
  - Per-agency saved terms, entered by the agent, may pre-fill **that
    agent's** splits for that agency.
- **Never**:
  - a product-wide %, a placeholder number, or a pre-filled or suggested
    split (50/50 included): split fields start **empty** unless the agent
    saved their own term
  - any display of another agency's or agent's commission terms, or any
    cross-agent aggregate
  - invoice numbering or PDFs, or tax computation
- **Export**: `commission_deals.csv`, `commission_payments.csv`. Deleting a
  client collects `commission_deal_files` paths.

### Phase D (optional) — Expiry lines in plan 016's daily digest (about 0.5 d)

Only after **plan 016 Phase 2** is live: its cron, `generate.ts` and the
08:00 digest (016 D8). There is no separate email and no separate cron.
- **Content**: add a "Registrations expiring" section to 016's
  `buildDigest` input:
  - for each registration: the client's name, the agency's name and the
    expiry date
  - at most 5, then "and N more"
  - no property label, since it may hold an address, and nothing from the
    proof files
  - skip registrations whose unread bell row the agent has already read
    (optional)
- **Source**: `getAttentionSignals`' `registrationExpiries`, which is
  already filtered by `agent_id` (B2.8), inside 016's per-agent loop. It
  keeps the batch's cron auth (`authorizeCron` in
  `src/lib/integrations/cron-auth.ts` with `CRON_SECRET`, created once by
  whichever of plans 013, 014, 016 and 017 lands first, expected 016
  Phase 2 (D-C): an unset or wrong secret returns 401 and no work runs),
  016's non-production `?agent=` guard and its per-agent try/catch. D adds
  no cron route, no `vercel.json` cron entry and no `cron.schedule`
  migration, so E2's `pg_cron` fallback check doesn't apply to it.
- **Sender, Reply-To and unsubscribe**: as 016 D9 and Step 18
  (`reminders@leadwing.app`, Reply-To `info@leadwing.app`). The email goes
  **to** the agent, so there is no Reply-To "the agent".
- **Tests**: extend 016's `digest.test.ts`:
  - the new section's cap
  - escaping of an agency name like `<b>X</b>`
  - no property label in the output
- **Not web push**: the service worker was retired in `40ddb52` (the iOS
  scroll fix). Push is 016's conditional Phase 3.
- **Copy**: only now may the site say "and in your morning email" for
  registration reminders.

## Until this ships (honest interim wording)

Apply this in Phase A0 (the fallback strings) and Phase A (the "A live"
strings, in the same push as the code). "A live" means Phase A is deployed.
The wording follows the recommended D1: a neutral "the agency you're working
with". If the founder picks "your side" (P3), replace that phrase with "the
agency you work each client through" / "la agencia con la que llevas a cada
cliente" and drop the co-broking sentences in crm-spain.

**Spanish vocabulary**: one verb, **"llevar"** (a client), across the
landing, the form and the pages. "Cartera **de clientes**" wherever the book
of clients is meant, because "cartera" alone reads as a property portfolio.
The Spanish text still needs a native review (P10).

Match on the quoted text, not the line numbers. Plans 013, 014, 016 and 017
edit other lines of the same files; 016 Step 0.1 applies all five plans'
tables in one commit (A0.0).

**`messages/{en,es}/landing.json` → `features.body` (`:45`)**
- EN: "Pipeline stage, properties viewed, offers made, documents signed, and
  the agency you're working with on each client."
- ES: "Etapa del embudo, propiedades vistas, ofertas hechas, documentos
  firmados y la agencia con la que llevas cada cliente."

**`features.items.agencies.title` (`:60`)**
- EN: "All your agencies in one client book"
- ES: "Todas tus agencias en una sola cartera de clientes"

**`features.items.agencies.body` (`:61`)**
- A live, EN: "Tag each client with the agency you're working with, then
  filter your buyers or sellers by agency. Your whole book stays in one
  private place."
- A live, ES: "Etiqueta cada cliente con la agencia con la que lo llevas y
  filtra tus compradores o vendedores por agencia. Toda tu cartera de
  clientes queda en un solo sitio privado."
- Fallback, EN: "Tag each client with the agency you're working with, and
  find them again by searching the agency name. Your whole book stays in one
  private place."
- Fallback, ES: "Etiqueta cada cliente con la agencia con la que lo llevas y
  encuéntralo buscando el nombre de la agencia. Toda tu cartera de clientes
  queda en un solo sitio privado."

**`features.items.agencies.tags` (`:62`)**: these replace the real agency
names. There is no "Direct" tag; D4 treats that value as one to delete.
- EN: `Your agency,Second agency,Developer`
- ES: `Tu agencia,Otra agencia,Promotora`

**`faq.items.agencies.a` (`:253`)**: also shown on `/pricing` and
`/es/precios`. The question stays.
- A live, EN: "Yes. Tag each client with the agency you're working with, then
  filter your buyers or sellers by that agency. Your whole book stays in one
  private place."
- A live, ES: "Sí. Etiqueta cada cliente con la agencia con la que lo llevas
  y filtra tus compradores o vendedores por esa agencia. Toda tu cartera de
  clientes queda en un solo sitio privado."
- Fallback, EN: "Yes. Tag each client with the agency you're working with,
  and find them again by searching the agency name. Your whole book stays in
  one private place."
- Fallback, ES: "Sí. Etiqueta cada cliente con la agencia con la que lo
  llevas y encuéntralo buscando el nombre de la agencia. Toda tu cartera de
  clientes queda en un solo sitio privado."

**`messages/{en,es}/billing.json` → `pricingPage.features.agencies.body` (`:223`)**
(the title stays "Multi-agency" / "Varias agencias")
- A live, EN: "Tag and filter clients by agency, so one book covers every
  agency you work with."
- A live, ES: "Etiqueta y filtra clientes por agencia: una sola cartera de
  clientes para todas las agencias con las que trabajas."
- Fallback, EN: "Tag each client by agency and find them by searching its
  name, so one book covers every agency you work with."
- Fallback, ES: "Etiqueta cada cliente por agencia y encuéntralo buscando su
  nombre: una sola cartera de clientes para todas las agencias con las que
  trabajas."

**`messages/{en,es}/clients.json` → `form.agencyDescription`** (A0): see the
table in Step A.7.

**`src/app/llms.txt/route.ts`**
- `:47`:
  - A live: "- Multi-agency: tag and filter clients by the agency the agent
    works with on them, so one book covers every agency an agent works with"
  - Fallback: "- Multi-agency: tag each client with the agency the agent works
    with on them; search finds clients by agency name"
- `:67`: "international buyers, multi-agency listings and viewing days" →
  "international buyers, working across agencies and viewing days".

**`src/content/pages/crm-marbella.en.tsx`**
- **`:48-50`**, in the "You sell for more than one agency" section: replace
  "Names like Norma Frank, Solvilla or Drumelia are the kind of agency that
  ends up on those tags — examples of a crowded local ecosystem, not
  partners of ours and not an endorsement in either direction." with
  "Norma Frank, Solvilla and Drumelia are the kind of agencies an
  independent agent here works with — examples of a crowded local ecosystem,
  not partners of ours and not an endorsement in either direction."
- **`:53-56`** (the whole paragraph "So in {SITE_NAME} every lead carries…"):
  - A live: "So in {SITE_NAME} every client carries the agency you are
    working with. One book covers every agency you work with, and one filter
    shows every client you have with that agency."
  - Fallback: the same, ending "…and searching the agency name finds every
    client you have with it."
- **`:178`** (FAQ question): "Can I keep clients from several agencies in
  one place?"
- **`:179`** (FAQ answer):
  - A live: "Yes. Tag each client with the agency you're working with, so
    one book covers every agency you sell for, and filter your list by
    agency."
  - Fallback: ends "…, and search your list by agency name."

**`src/content/pages/crm-marbella.es.tsx`**
- **`:47-49`**: replace "Nombres como Norma Frank, Solvilla o Drumelia son
  el tipo de agencia que acaba en esas etiquetas: ejemplos de un ecosistema
  local muy poblado, no socios nuestros ni un aval en ninguna dirección."
  with "Norma Frank, Solvilla o Drumelia son el tipo de agencia con la que
  trabaja un agente independiente aquí: ejemplos de un ecosistema local muy
  poblado, no socios nuestros ni un aval en ninguna dirección."
- **`:52-55`**:
  - A live: "Por eso en {SITE_NAME} cada cliente queda etiquetado con la
    agencia con la que lo llevas. Una sola cartera de clientes cubre todas
    las agencias con las que trabajas y, con un filtro, ves a todos los
    clientes que llevas con esa agencia."
  - Fallback: ends "…y, buscando el nombre de la agencia, encuentras a
    todos los clientes que llevas con ella."
- **`:179`** (FAQ question): "¿Puedo llevar clientes de varias agencias en
  un mismo sitio?"
- **`:180`** (FAQ answer):
  - A live: "Sí. Etiqueta cada cliente con la agencia con la que lo llevas:
    una sola cartera de clientes cubre todas las agencias con las que vendes
    y puedes filtrar tu lista por agencia."
  - Fallback: ends "…y puedes buscar en tu lista por el nombre de la
    agencia."

**`src/content/pages/crm-spain.en.tsx`** (the hub page)
- **`:118`**: "Tag each lead with the agency it came through and your whole
  book lives in one place," → "Tag each client with the agency you're
  working with and your whole book lives in one place," (the rest stays).
- **`:126-128`**: replace "For co-broking, the agency tag is what tells you,
  three weeks later, whose listing it was and whose commission you are
  splitting." with:
  - A live: "When you co-broke, the same tag filters your list down to every
    client you have with that agency."
  - Fallback: "When you co-broke, searching the agency name pulls up every
    client you have with that agency."
- **`:251`** (FAQ answer):
  - A live: "Yes. Tag each client with the agency you're working with, so
    one book covers every agency you work with, and filter your list by
    agency."
  - Fallback: ends "…, and find clients again by searching the agency name."
- **Keep `:60-61`** ("Whose listing it is decides who holds the keys and how
  the commission splits."). It describes the market, not the product.

**`src/content/pages/crm-spain.es.tsx`**
- **`:120`**: "Etiqueta cada lead con la agencia por la que llegó y toda tu
  cartera queda en un mismo" → "Etiqueta cada cliente con la agencia con la
  que lo llevas y toda tu cartera de clientes queda en un mismo" (the rest
  stays).
- **`:128-130`**: replace "Y cuando compartes operación con otra agencia, la
  etiqueta es lo que te recuerda tres semanas después de quién era el anuncio
  y con quién repartes la comisión." with:
  - A live: "Y cuando compartes operación con otra agencia, la misma etiqueta
    filtra tu lista hasta dejar todos los clientes que llevas con ella."
  - Fallback: "Y cuando compartes operación con otra agencia, buscando su
    nombre ves todos los clientes que llevas con ella."
- **`:255`** (FAQ answer):
  - A live: "Sí. Etiqueta cada cliente con la agencia con la que lo llevas:
    una sola cartera de clientes cubre todas las agencias con las que
    trabajas y puedes filtrar tu lista por agencia."
  - Fallback: ends "…y encuentras a tus clientes buscando el nombre de la
    agencia."
- **Keep `:62-63`** ("De quién sea el inmueble decide…").

**`src/content/pages/guide-idealista.en.tsx:248-250`**: replace "and if you
sell for more than one agency, put whose listing it was in the agency field"
with "and if the listing belongs to another agency, add its name to that same
line".

**`guide-idealista.es.tsx:253-254`**: replace "y, si vendes para varias
agencias, dejas en el campo de agencia de quién era el anuncio" with "y, si el
anuncio es de otra agencia, añades su nombre en esa misma línea".

**`src/content/pages/about.en.tsx`**
- **`:80-81`**:
  - A live: "<strong>Agency tags.</strong> Each client carries the agency
    the agent is working with, and the client list filters by it, so one
    book covers every agency an agent sells for."
  - Fallback: "<strong>Agency tags.</strong> Each client carries the agency
    the agent is working with, and search finds clients by agency name, so
    one book covers every agency an agent sells for."
- **`:102`**, in "Why it exists" (both versions): "with every lead tagged by
  the agency it belongs to" → "with every client tagged by the agency the
  agent works with".

**`src/content/pages/about.es.tsx`**
- **`:80-81`**:
  - A live: "<strong>Etiquetas de agencia.</strong> Cada cliente queda
    etiquetado con la agencia con la que lo lleva el agente, y la lista de
    clientes se filtra por ella, así que una sola cartera de clientes cubre
    todas las agencias con las que vende."
  - Fallback: "…, y la búsqueda encuentra clientes por el nombre de la
    agencia, así que…"
- **`:104-105`** (both versions): "con cada lead etiquetado por la agencia a
  la que pertenece" → "con cada cliente etiquetado con la agencia con la que
  lo lleva el agente".

**Keep as they are**:
- `src/app/layout.tsx:54` (keyword "multi-agency CRM")
- `src/app/opengraph-image.tsx:206` ("3 agencies · one place")

Both are true in the reduced form once A is live.

**`src/lib/seo.ts:73-79`**: bump `PUBLISHED` for `crmSpain`, `crmMarbella`,
`guideIdealista` and `about`, once for the combined pass (A0.0).

**After B1 (optional addition)**: append to the card body.
- EN: " Each agency gets its own page with every client you have with it."
- ES: " Cada agencia tiene su propia página con todos los clientes que llevas
  con ella."

**After B2 ships**:
- Append to the card body and the FAQ answer:
  - EN: " Keep a dated record of every buyer you register with another agency
    or developer, with a reminder in LeadWing before it expires."
  - ES: " Guarda un registro de comprador fechado por cada cliente que
    registras con otra agencia o promotora, con un aviso en LeadWing antes de
    que caduque."
- Add an `llms.txt` bullet: "- Buyer registrations: a dated record of each
  buyer registered with another agency or developer, with in-app expiry
  reminders".
- Only then may crm-spain say anything about co-broking records.

**Never write**:
- "protects your commission" / "protege tu comisión"
- "see which agency produces your deals" (needs Phase C)
- "whose listing it was" / "whose commission you are splitting" tied to the
  client tag
- "we'll remind you by email" (needs Phase D, which rides on plan 016)
- any default, "standard" or "usual" commission percentage or split

## Prerequisites outside the code

| # | What | Owner | Lead time / when |
|---|---|---|---|
| P1 | **One consolidated interview scorecard** (see below), drafted as a patch to `plans/validation-interview-script.md`, plus a **"Gates" table** in `plans/README.md` (gate · plan/phase · denominator · threshold · checkpoint · result · date). Neither exists today: §5c/§5d and scores F/G aren't in the script, so the B1, B2 and C gates have nothing to measure. | Claude drafts in a separate session (this plan doesn't edit the script); the founder approves | 1–2 h, before Mon 21 Sep 2026 |
| P2 | A static mock-up of the registration log (buyer panel + agency page), and later of "Owed to me". Shown only **after** scoring, at the end of an interview. | Claude on request (private artifact) | 1–2 h, before the first interview |
| P3 | **Decide D1** (what the client's agency tag means). The A0 wording depends on it. The trade-off is in the table below. Then ask the first interviewees what they would type (P1), and fix the meaning before B1. 4 live values as of 16 Sep 2026. | Founder | 10 min, before A0 (Thu 17 Sep 2026) |
| P4 | Confirm the Supabase plan of project `shetahkkkvcwgxkuqmwe`. Free has 1 GB of storage in total and pauses after a week idle; Pro has 100 GB. If the project is on Free, that is an existing risk for the whole product, not only for B2's proof files. | Founder (dashboard) | 5 min, before B2 |
| P5 | Ask Lena and other franchise agents (Engel & Völkers) how agencies, registrations and invoices run through the office. There the "agency" may always be the shop. Developer agreements are signed by the agency with its CIF (Rosso's form asks for it), and invoicing may not be the agent's. This affects A's usefulness (one value), B1's gate decision and C. | Founder via Lena | Before B1's gate is decided, and before C is re-planned |
| P6 | Legal copy: the privacy and terms (DPA annex §A) updates are inside B1/B2. D22 decides whether the change is "material" (the 30-day email). The legal-entity placeholders in `src/lib/legal.ts` are still unfilled (a separate open item). | Claude (copy) / founder (D22, entity data) | With each phase / open |
| P7 | Competition rule for everyone writing copy, seed or demo data. Never: a default or "standard" commission percentage, **a pre-filled or suggested split (50/50 included)**, **any display of other agencies' or agents' commission terms**, cross-agent averages or benchmarks, or a shared agency directory. CNMC S/0003/20 sanctioned minimum commissions, software filters, a fixed 50% split between listing and selling offices, and an exchange of commission information. Ley 15/2007 art. 1 also applies. | Everyone | Ongoing |
| P8 | Tax rule for C: track invoices, never issue or number them; never compute VAT or IRPF (Verifactu: 1 Jan 2027 for corporate-tax payers, 1 Jul 2027 for everyone else). | Everyone | Before C |
| P9 | Migration procedure: rehearse the forward **and** rollback files in a rolled-back transaction as the founder's user, with `lock_timeout` 3 s and `statement_timeout` 30 s, at a quiet hour. Expand migrations are applied **right before** the push; contract migrations **after** the code is live. Probe the live DB before calling anything pending. Needs `SUPABASE_DB_URL` in `.env.local` (present) and `pg` in the scratchpad. | Claude | Each of B1, B2, B3, C |
| P10 | A native Spanish review of the A0/A strings, the form hint and the B2 vocabulary ("Registro de comprador", "llevar", "cartera de clientes"). | Founder asks Lena or another native speaker | 30 min, before Mon 21 Sep 2026 (ship on 17–18 Sep, then correct) |
| P11 | One copy day for the batch: approve the interim wording of all five plans (013, 014, 015, 016, 017) together, so plan 016 Step 0.1 applies it (A0 included) in one commit, with one `PUBLISHED` bump and one push. | Founder | 15 min, Thu 17 Sep 2026 |
| P12 | Phase D only: plan 016's Phase 2 prerequisites (`RESEND_API_KEY` on Vercel, `CRON_SECRET`, sender confirmation, DMARC). D adds none of its own. | As plan 016 | With plan 016 Phase 2 |
| — | No new accounts, verifications or DNS changes are needed for A0–C. | — | — |

**P1, the proposed scorecard** (the founder approves; the letters A–K are
the batch's shared list, and plans 013, 014, 016 and 017 keep their own
gate definitions, aligned here):

| Score | Measures | Denominator | Checkpoint | Opens |
|---|---|---|---|---|
| A | consolidation (script) | first 5 interviews | when the 5th is scored (target Fri 2 Oct 2026) | headline; B1 (with G) |
| B, C | pivot candidates (script) | first 5 interviews | same | the script's decision rule |
| G | registrations (new §5d) | first 5 interviews | same (target Fri 2 Oct 2026; a deliberate exception to D-D's Fri 9 Oct / first-8 rule, E6, because B1 is cheap and early) | B1 and B2 |
| D, E | listing details, paperwork (script §5b) | first 8 solo agents | Fri 9 Oct 2026 | the script's feature bets |
| F | money (new §5c) | first 8 solo agents | Fri 9 Oct 2026 | re-planning C |
| H | calendar (plan 013 D21) | first 8 solo agents | Fri 9 Oct 2026 | plan 013 Phase 2 |
| I | portal enquiries (plan 014 D1) | first 8 solo agents | Fri 9 Oct 2026 | plan 014 Phases 1–5 |
| J | WhatsApp (plan 017 D1: "at least 3 of the first 8 solo agents") | first 8 solo agents; threshold: at least 3 of the first 8 solo agents | Fri 9 Oct 2026 | plan 017's build |
| K | phone alerts (plan 016 P15, Phase 3) | first 8 solo agents; threshold: at least 3 of the first 8 solo agents | Fri 9 Oct 2026 | plan 016 Phase 3 |

- **G questions** (past behaviour only):
  - "The last buyer you registered with another agency or developer: how,
    with what window, and where is the proof now?"
  - "Has a registration ever been disputed, lapsed or ignored?"
  - Green = sent a written registration in the last 3 months with a stated
    window, or has a disputed or lapsed story.
- **F questions**:
  - Core, always asked:
    - "Right now: how much are you owed, and by whom?" (a live test)
    - "How was the split on your last shared deal agreed and written down?"
  - Rotating:
    - "Who invoiced whom, and how long did payment take?"
    - "Ever chased a payment or been cut out? What proof did you have?"
  - Green = can't answer the owed question quickly, keeps a commission
    spreadsheet, or has a chasing or cut-out story.
- **P3's question** (1 min): "On a client card, what would you type in an
  'agency' field: your own agency, or the one whose listing they want?"
- **Time budget**:
  - The call stays 30–35 min, with at most 8 min for everything new.
  - Priority order: G1, F-core-1, P3, the 017 WhatsApp app question, G2,
    F-core-2, 013's "Show me where your last viewing is booked", the 017
    catches question, 016's alert question. Rotate the rest (including
    013's other H questions) across interviews.
  - Show the mock-up only after scoring.

**P3, the trade-off to decide**:

| Option | The tag means | For | Against |
|---|---|---|---|
| **Neutral now (recommended)** | "the agency you're working with on this client" | Honest under either reading. Useful for franchise consultants (they can tag the co-broking agency) and for solo agents. No relabel before evidence. | Mixed data (some tags name your shop, some the other side). D1 must be fixed before B1's page labels. |
| Your side | the agency you work the client through | Clean for freelancers who sell for several agencies; matches `{{agency}}` in templates. | For a franchise consultant it is always the same shop, and solo agents have none. The co-broking value only arrives with B2, so the co-broking copy must go now. |
| Listing agency | the other side of the deal | It is the dimension that varies. | Duplicates B2's counterparty; `{{agency}}` ("Soy …, de {agencia}") reads wrong. |

## Costs per agent per month

| Phase | What grows | Estimate |
|---|---|---|
| A0, A | One extra small read on the client form pages; list totals come from an embed | €0 |
| B1 | A few `agencies` rows (kilobytes); one extra small read on the list and form pages | < €0.001 |
| B2 | Registration rows (kilobytes). Proof files: about 15 MB per agent-year, far inside Supabase Pro's 100 GB, then $0.0213/GB. One indexed query per bell sync (every 5 min per open tab). | < €0.01 |
| C | Deal and payment rows plus invoice files, similar to B2 | < €0.01 |
| D | A few lines in plan 016's existing daily digest, so no extra emails. Email itself is €0 within Resend's Free quota (3,000/month, 100/day, 3 domains). That quota is shared by the whole account: auth OTP mail, plan 016's digest and `torresmethod.com`. Past 100/day the cost steps to a fixed $20/month (Pro, 50,000 emails), about €0.85 per paying agent at 20 Pro agents and falling after that. Cron time uses plan 016's figures (fra1: $0.184 per Active-CPU hour, $0.0152 per GB-hour, $0.60 per million invocations; about $0.06/month in total for 100 agents; **not re-checked here**). | €0 for D itself |

A–C stay under €0.01 per agent per month. D adds nothing beyond plan 016's
digest cost. Everything stays far under the "a few euros" ceiling at €29/month
Pro. The exchange rate was not checked.

## Test plan

- **Unit tests** (new files are marked):
  - `src/lib/agencies.test.ts` (new): keys, whitespace set, 120-character
    cap, options, `pickSpelling`, filter values
  - `src/lib/validation/agency.test.ts` (new)
  - `src/lib/crm.test.ts`: `agencyRecordId`
  - `src/lib/routes.test.ts`: the `/agencies` prefix
  - `src/lib/registrations.test.ts` (new): month and day arithmetic,
    states, `confirmedOnFor`, `registrationDueAt`
  - `src/lib/validation/registration.test.ts` (new)
  - `src/lib/data/attention.test.ts` (new, or plan 016's): agent filter,
    window, missing table, inactive clients, `truncated`
  - `src/lib/notifications.test.ts`: the `registration_expiring` route

  There are no action tests and no JSON-LD/`seo.ts` tests in the repo, and
  this plan doesn't add any.
- **CI**: `npm run typecheck && npm run lint && npm test && npm run build`
  pass for every phase.
- **Database**:
  - The B1 rehearsal (forward + rollback) prints only `ok`.
    - Its SQL and script were run on 16 Sep 2026 against PGlite 0.5.8
      (PostgreSQL 18.3) with a Supabase-shaped stub (roles, `auth.uid()`,
      the `clients` trigger and policy): all 49 checks passed.
    - Re-run on 17 Sep 2026 with this revision's SQL and script:
      - The same stub: 49 of 49 `ok`.
      - A stub with plan 016's function already bound (plus the
        `last_contacted_at` and `wa_contact_id` columns), using B1.2's
        merged skip array, the trigger pair removed and the saved-definition
        rollback: 52 of 52 `ok`.
      - The unmerged file on that stub prints 6 `FAIL` lines, so the checks
        catch a lost key.
    - That run doesn't replace the live rehearsal (PG 17.6, ICU, real
      data).
  - The B2 rehearsal covers ownership, the label check, merge, the
    agency-delete block with tags intact, and the cascade. The B2 and B3
    SQL passed the same PGlite run.
  - The B3 rehearsal covers ownership and `updated_at`.
- **Visual** (preview-tmp, your own folder, deleted afterwards):
  - the list filter
  - the form chips and picker
  - the agencies list and detail, and the agency breadcrumb
  - the registrations section, dialog and viewings menu item
  - the bell row and Home item

  Check each in en/es, at 375 px and desktop, and in dark mode for the new
  tags.
- **Manual, signed in** (the founder), on production after each push:
  1. **A**:
     - Tag one client "Solvilla", then create another as " solvilla "; it
       is saved as "Solvilla".
     - Change a single-use "drumelia" to "Drumelia"; it sticks.
     - Filter by Solvilla: the tabs and the commission total narrow, and the
       URL survives a reload.
  2. **B1**:
     - `/agencies` lists the migrated agencies with correct counts.
     - Rename one: the client card shows the new name, and the client's
       "Updated" time doesn't change.
     - Merge two.
     - Delete one: its clients show "No agency".
     - The picker creates a Developer.
     - `/agencies/not-a-uuid` shows the 404 page.
  3. **B2**:
     - Log a registration with a 1-month window confirmed today, and another
       with an expiry 10 days out.
     - The second shows "Expires in 10 days", appears in the bell within 5
       minutes (dated today or earlier) and on Home.
     - Close it: the unread bell row goes.
     - Attach a PDF.
     - Delete the buyer: the files are gone from the bucket (check the
       storage listing).

## Done criteria

- **A0**:
  - The fallback strings are live, and the old phrases grep to nothing.
  - `PUBLISHED` is bumped once.
  - The native review is requested (P10).
- **A**:
  - suggestions and the agency filter work on both sides
  - the filter survives a reload
  - the list totals follow the filters, with the "clients shown" note
  - new spellings snap to existing ones, and a single-use spelling can be
    corrected
  - the "A live" strings shipped in the same push
- **B1**:
  - the gate is recorded
  - the `agencies` table is live with RLS; every tagged client is linked,
    and every copy equals its agency's name
  - the `clients` policy is unchanged, and the shared `updated_at` function
    lists every expected key
  - the agencies list, detail, merge and delete work
  - the picker creates agencies
  - `/agencies` is protected, and a bad id is a 404
  - the privacy and terms pages are updated
  - `rollback-agencies.sql` is kept in the scratchpad
- **B2**:
  - the gate is recorded
  - registrations can be logged, confirmed, closed, attached and deleted
  - in-app reminders appear, are never dated in the future, and clear
  - every attention query filters by `agent_id`
  - `deleteClient` removes proof files
  - the privacy and terms pages are updated; the landing copy has the B2
    line
- **B3**:
  - the contract order was followed (code live → probes 0 → backup → drop)
  - `clients.agency` is dropped, and every read uses the join
  - the plan 012/014 RPCs (if built) use `agency_id_for`
  - no `42703`/`PGRST204` for 24 h
- **Every phase**:
  - CI is green.
  - The live DB matches the migration (history row present).
  - `plans/README.md` row 015 is updated.

## STOP conditions

- **Gates**:
  - B1, B2 or C is reached without its gate recorded (D12) or the
    founder's go-ahead.
  - B1 is reached without D1 fixed (P3).
- **Live state isn't what the plan expects**:
  - `agencies`, `buyer_registrations` or `registration_files` already
    exists without this plan's history row: someone else built it.
  - `registration_expiring` or `notifications.registration_id` already
    exists before B2.
  - `clients` has more than one policy, or a non-internal trigger other
    than `clients_enforce_free_limit` and `clients_set_updated_at`, before
    B1.
  - **The function behind `clients_set_updated_at`** is neither
    `set_updated_at` nor a recognisable skip-list function. Recognisable
    means its body only compares `to_jsonb(new)` and `to_jsonb(old)` minus a
    list of keys, then sets `updated_at`.
  - **Its skip list has changed** between the rehearsal and the live apply.
  - **`AttentionContext`** has a shape other than `{ nowISO, todayKey }` or
    plan 016's `{ agentId, nowISO, todayKey, timeZone }`.
  - **The database encoding isn't UTF8** (`normalize()` needs it).
  - **`lower('VÖLKERS')` isn't `völkers`**, or the database's `datctype` or
    locale provider differs from B1.1's expected values, and the rehearsal's
    accent check fails.
  - **The B1.1 probe finds more than 50 agency groups for one agent**, or
    values over 120 characters. Report before the backfill.
- **Versions**:
  - A migration version would sort before an already-applied file.
  - It is already present in `schema_migrations`, in
    `supabase/migrations/`, or in another plan's text as reserved.
- **Rehearsal and apply**:
  - **Any rehearsal line prints `FAIL`**, especially any `updated_at`,
    `agency_not_owned`, policy or rollback check.
  - **The rehearsal hits `client_limit_reached`**: the rehearsal agent is no
    longer Pro/admin, or has changed.
  - **A lock timeout (`55P03`) happens twice**. Don't retry blindly.
  - **Any check shows a row belonging to another agent.** RLS or the
    `agent_id` filter is broken; stop at once.
- **Code and deploys**:
  - **Anything seems to need the service-role client in app code** (plan
    016's cron is the only sanctioned exception).
  - **B3 is about to drop the column** while the plan 012 or 014 RPC still
    writes `clients.agency`, or the live deployment still references
    `clients.agency`.
- **Design**. A request or design step would:
  - add a default, suggested or pre-filled commission percentage or split
    (50/50 included), show another agency's or agent's commission terms,
    show a cross-agent figure, or create a shared directory (competition
    law)
  - generate invoice numbers or PDFs, or compute VAT or IRPF (Verifactu,
    tax)
  - store a DNI/NIE field
- **Copy**. It would need to say "protects your commission" or "we'll email
  you" before Phase D.

## Overlaps with other plans

- **Plan 016 (real contact and reminders)**:
  - **The `updated_at` trigger function.** 016 Phase 1 Step 2 creates
    `public.clients_touch_updated_at()`, skipping `updated_at`,
    `last_contacted_at` and `wa_contact_id` (the `clients_touch_updated_at`
    function in 016's Phase 1 migration step, "Step 2: The migration"), and
    re-binds `clients_set_updated_at` to it.
    - This plan uses the same function name and form, with `updated_at`,
      `agency` and `agency_id` in the skip array.
    - **Whichever of B1 and 016 Phase 1 lands first creates the function
      with the shared skip array. Any later plan (015, 016, 017) first reads
      the live function and merges its keys into the array with
      `create or replace`, never overwriting it.** B1.1 reads the live
      function for that purpose.
    - **Note for 016's executor**: 016's Step 2 now builds its skip array as
      the union of the live function's keys and its own (D-E), so if B1 has
      landed, `'agency'` and `'agency_id'` stay in the array. Re-run this
      plan's "agency-only edit keeps updated_at" check after 016's
      migration.
  - **`attention.ts`**. 016 Step 10 changes `AttentionContext` to
    `{ agentId, nowISO, todayKey, timeZone }`, filters every query by
    `agent_id` and guards embedded rows with `ownEmbed`. B2.8 adopts exactly
    that shape, never an extra field, and does both for its own query.
  - **`syncNotifications` / `generate.ts`**. 016 Step 13 moves generation
    into `src/lib/notify/generate.ts`, run by a service-role cron. B2's rows
    are built wherever generation lives at the time. Phase D is a section
    in 016's daily digest (D8), with 016's cron auth, sender, Reply-To and
    unsubscribe (D9, Steps 14 and 18).
  - **The recording fake client** (`src/lib/data/attention.test.ts`) is
    shared.
  - **Copy**. 016 Phase 0 edits `crm-spain`, `crm-marbella`, the landing
    and `PUBLISHED` on other lines. Its Step 0.1 is the one combined pass
    for all five plans, this plan's A0 included (A0.0, P11).
  - **Records**. Keep `client_contacts` (how recently you were in touch)
    separate from registrations (proof of introduction).
- **Plan 017 (WhatsApp coexistence)**:
  - Its migration also redefines `clients_touch_updated_at`, skipping
    `updated_at`, `last_contacted_at` and `wa_contact_id` (its
    "clients.updated_at: linking is not an edit" block), and its pre-flight
    (Step 4.0.3) reads the live function and merges its skip array. 017
    hard-depends on 016 Phase 1 (its Step 4.0.1 and 4.0.2 checks) and never
    creates the function; only B1 or 016 Phase 1 can (E4, D-E).
  - **Note for 017's executor**: 017's pre-flight looks for the shared skip
    array, not a `WHEN` clause; any `WHEN` wording left in 017 describes
    this plan's first sketch. B1 uses the shared function, so if B1 has
    landed, the live skip array already holds `agency` and `agency_id`.
    Merge them in; never overwrite the array.
  - Its U1 copy (`onePlace` strings and the `one-place.tsx` animation
    change) is applied by 016 Step 0.1.
- **Plan 013 (Google Calendar sync)**:
  - Phase 0 edits `crm-marbella` (`:117`), `about` (`:72`) and `PUBLISHED`
    on other lines: one combined pass (016 Step 0.1).
  - Its legal step (1.3) edits the privacy and terms pages: merge the
    `LEGAL_UPDATED` bumps if they fall in the same week.
  - Expiries and expected payments could become calendar events later;
    they stay out until that event model settles.
- **Plan 014 (portal lead inbox)**:
  - Its intake RPC inserts `clients.agency` as text
    (`public.capture_inbound_lead` in 014's migration). B1's trigger links it and
    stores the canonical name.
  - **Before B3**, the RPC must resolve the text with `agency_id_for()` and
    write `agency_id` only.
  - Its Phase 0 copy (`crm-spain :80-87`, `about :88-89`,
    `crm-marbella :83-85`) joins the combined pass (016 Step 0.1).
  - A captured lead's agency should use `agency_id_for()` or the picker,
    never free text.
- **Plan 011 (export)**:
  - Every new table (`agencies`, `buyer_registrations`,
    `registration_files`, later C's `commission_*` tables) goes into
    `loadAccountExport`, the ZIP, the workbook, the README and `files.csv`
    (011's maintenance rule).
  - The `agency` column reads the copy until B3, then the join.
  - The list export exports `filtered`, so A's filter narrows exports for
    free.
  - Both plans edit the `clients-view.tsx` toolbar and `Summary`: land A
    first, or rebase carefully.
- **Plan 012 (import)**:
  - Its RPC writes `clients.agency` raw (`public.import_clients` in 012's
    migration).
    B1's trigger links it and stores the canonical name, and a blank value
    stores nothing. Before B3 the RPC must call `agency_id_for()`.
  - `getImportContext.agencies` (012's `getImportContext(side)` section) should reuse A's
    `getAgencyNames` (B1: `getAgencyChoices`).
  - Its "Agency for every row" datalist (`:1303-1304`) should use A's chips
    or the B1 picker, because iOS datalist support is partial.
  - **Undo leaves agencies behind.** Undoing an import deletes its clients,
    but agencies that B1's trigger created during that import stay, with 0
    clients. 012's undo should offer to delete agencies with 0 clients
    created after the import started (`agencies.created_at`). Meanwhile
    `/agencies` marks 0-client agencies and offers Delete (B1.9).
  - It reserves migration `20260916150000`; this plan's migrations come
    later.
  - Its quiet-buyer digest edits the same notification-generation block B2
    extends.
- **Plan 009 (outreach tracking)**: registrations are contact with the
  counterparty, so they never set `last_contacted_at` or touch `clients`. D13
  keeps agency bookkeeping off `updated_at`.
- **Plan 007 (email automation)**: a registration by email could later be
  sent through 007's pipeline, with the email saved as proof.
- **Plan 004 (ICS)**: see plan 013 above.
- **Plan 008 (inverse matching)**: the dialog's "One of your listings"
  select reads the same `properties` rows; both add queries to the client
  page.
- **Plans 003/005**: new actions follow 003's auth and ownership contracts.
  `deleteClient` path collection gains `registration_files` (B2) and
  `commission_deal_files` (C). Avoid F7 (raw `error.message`).
- **Plan 002** owns `src/lib/attention.test.ts`. This plan doesn't fork it;
  its data-layer tests live in `src/lib/data/attention.test.ts`.
- **Validation bets D and E** (script §5b):
  - The key-free listing card (D) adds reference and link fields to
    viewings; the registration dialog uses the same names (`property_ref`,
    `property_url`).
  - The AML client file (E) wants typed documents. B2 has no ID **field**,
    but its proof files **may contain** ID numbers, so the privacy page and
    the DPA annex say so. C's `commission_deal_files` should share E's
    document-kind vocabulary.
- **Competitive brief, action 5**: this plan follows its shape:
  - two agencies per deal
  - splits on the fee before VAT
  - a payment list
  - a developer kind
  - invoices tracked, never issued
  - no product-wide %
  - no seller-side deals, shared records or directory

  The only reordering is the registration log (B2) before deals (C), per the
  agent-voice reframe.

## Maintenance notes

- **Name matching exists twice**:
  - JS: `cleanAgencyName`/`agencyKey` in `src/lib/agencies.ts`.
  - SQL: `public.agency_clean_name` + `lower(name)`.
  - Both spell out the same whitespace set, and both drop U+FEFF. Change
    them together. The B1 rehearsal's cleaning cases and "Völkers" check
    guard the pair.
- **`clients_touch_updated_at` is shared** by plans 015, 016 and 017:
  - A new `clients` column bumps `updated_at` by default. Add it to the
    skip array only if changing it isn't "touching" the client.
  - Whichever of B1 and 016 Phase 1 lands first creates it. **Never**
    redefine the function without first reading the live one
    (`pg_get_functiondef`) and merging every key already listed.
  - After any plan redefines it, re-run the "agency-only edit keeps
    updated_at" check.
- **Ownership of `clients.agency_id` lives in a trigger** (B1:
  `clients_sync_agency`; after B3: `clients_check_agency`), not in the
  policy. A policy subquery can't see a row created earlier in the same
  statement. Keep that in mind for C's FKs.
- **Rollback files are point-in-time**: `rollback-agencies.sql` is valid
  only until B2 or a plan 016/017 migration builds on B1. Write a fresh one
  before any later live rollback.
- **The B3 backup** `backup.clients_agency_<ts3>`: drop it 30 days after
  B3.
- **Adding a method or status**: alter the CHECK constraint in a migration,
  extend `REGISTRATION_METHODS`/`REGISTRATION_STATUSES`, and add en/es
  labels.
- **Notification rules**:
  - Any new notifications column stays an optional key on
    `NotificationInsert` (PGRST204).
  - Any new type needs `ICONS`, `TONES`, `notificationHref`, a
    `notifications.types.*` label and copy.
  - `due_at` is never in the future.
  - Every generation query filters by `agent_id`.
- **New readers of these tables** must tolerate `isMissingTableError`,
  because deploys can land before migrations. A detail page also returns
  `null` on `22P02`.
- **Reminder copy** says "in LeadWing" until Phase D ships.
- **No DNI/NIE field**, no default or suggested percentages or splits, no
  cross-agent figures, no invoice issuing.
- **Every new table** goes into plan 011's export.
- **Reviewer notes** (16 Sep 2026 revision):
  - **Keeping `crm-spain.{en,es}.tsx:60-63`.** The product review listed
    these lines with the claim sites. They say "Whose listing it is decides
    who holds the keys and how the commission splits", which describes the
    market, not a product feature. The rest of the hub page is reworded.
  - **NO ACTION for the counterparty FK.** The engineering review asked to
    rehearse RESTRICT or switch to NO ACTION. RESTRICT passed the
    account-deletion shape in both trigger orders (temp tables on the live
    DB), but the plan still switches to NO ACTION (D24): it blocks a direct
    delete the same way and is more forgiving within a single statement.
  - **The clients policy is no longer replaced.** The review's
    trigger-merge fix was adopted (the shared function form). Running the
    revised rehearsal on PGlite also showed that the tasks.sql-style policy
    check breaks legacy text writes that create a new agency, so ownership
    moved into the trigger (see B1.2's notes).
  - **D1: neutral wording now.** The product review offered "your side
    now" or "defer and ask". The plan takes the second and words the
    interim copy neutrally, so A0 doesn't depend on the answer.
  - **`visited_on` instead of a viewing link.** The optional visit field is
    a date, not a `viewing_id`: a viewing FK would need another ownership
    check. The viewings menu pre-fills it instead.
  - **Plans 013 and 014 exist now.** The review couldn't check them. The
    overlap check was re-run: 014's intake RPC also writes `clients.agency`
    (added to B3's gates), and 013/014 share the copy and legal files
    (added to the combined pass).
  - **17 Sep 2026 re-check.** Every blocker and major from both reviews
    was found fixed in the text. This pass fixed four more things:
    - **The A0 grep.** The first version could never print nothing: "listings
      from several agencies" and "inmuebles de varias agencias" also match
      crm-marbella's meta description and its "one agent" FAQ answer. Both
      describe the agent's work, not the tag, so they stay, and the two
      patterns are now anchored to the FAQ question.
    - **Line references into plans 012, 016 and 017.** Those plans were
      revised after this one. 016 and 017 now share one skip list, and 017
      dropped `phone_digits`.
    - **B2.8** follows 016's `ownEmbed` guard.
    - **P1's scorecard** lists 013's score H.
- 17 Sep 2026 (second pass): applied shared decisions D-A…D-I from the plan batch alignment. Third pass: applied E1–E7 where they touch this plan (E4: only B1 or 016 Phase 1 creates `clients_touch_updated_at`, 017 hard-depends on 016 Phase 1; E5: registration-expiry rows run on the request-time `syncNotifications` path until 016 Phase 2 moves them into `generate.ts`; E6: score G keeps its first-5 / Fri 2 Oct checkpoint as a stated exception to D-D). Dropped the stale note that 016's SQL overwrites the function body (016 Step 2 now merges, D-E), said `authorizeCron`/`CRON_SECRET` come from whichever of 013, 014, 016, 017 lands first, and replaced line references into plans 012, 014, 016 and 017 with section and function names. E1, E2, E3 and E7 need no change here: this plan adds no keys, no cron route and no encrypted fields.

## Sources

External facts were checked on 2026-09-16 unless marked otherwise.

- **CNMC S/0003/20**: press release, 9 Dec 2021, about €1.25M in total
  (Anaconda, Idealista, Inmovilla, Look & Find, MLS, Remax, Witei). The
  sanctioned conduct included:
  - a minimum commission (4% on sales, one month on rentals)
  - "reparto de la comisión al 50%" between the listing office and the
    closing office
  - an exchange of information on agencies' commissions
  - software filters and controls enforcing those conditions

  Per-company amounts differ between sources, so none are quoted.
  https://www.cnmc.es/prensa/sancionador-proptech-cnmc-intermediacion-inmobiliaria-cnmc-20211209
  (re-read 16 Sep 2026).
- **Ley 15/2007, art. 1.1**: prohibits agreements and collective
  recommendations that fix prices directly or indirectly.
  https://www.boe.es/buscar/act.php?id=BOE-A-2007-12946 (BOE consolidated
  text).
- **RDL 15/2025** (BOE-A-2025-24446, 3 Dec 2025): Verifactu applies from
  1 Jan 2027 for corporate-tax payers and from 1 Jul 2027 for everyone else.
  - https://www.boe.es/buscar/doc.php?id=BOE-A-2025-24446
  - https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/nota-informativa-ampliacion-plazo-adaptacion-facturacion.html
  - Checked via boe.es and AEAT listings; the full BOE text was not re-read.
    The review also confirmed the dates against a KPMG tax alert
    (https://assets.kpmg.com/content/dam/kpmgsites/es/pdf/2025/12/tax-alert-el-real-decreto-ley-15-2025-amplia-plazos-adaptacion-reglamento-verifactu.pdf.coredownload.inline.pdf;
    not opened in this revision).
- **AEAT FAQ**: a SIF is the hardware and software used to *issue*
  invoices. That tracking-only software is outside the definition is **an
  inference, not an AEAT statement.**
  https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/preguntas-frecuentes/cuestiones-generales-conceptos-definiciones.html
- **Rosso Inmobiliaria 21 S.L., "Acuerdo de colaboración con agencias"**
  (Benalmádena, 2024; all 3 pages re-read 16 Sep 2026):
  - Rosso "ha sido autorizada por LA PROMOTORA" to pay the commission, so
    it markets on a developer's behalf.
  - The agency form asks for its name, trade name and **CIF**.
  - The agency "deberá acompañar al cliente a la promoción", and needs the
    registration confirmed in writing.
  - Registration needs name, surnames and DNI/NIE, and is valid for **one
    month**.
  - Fees are paid in stages (2/3 + 1/3; 40/60 with a clawback; 50/50 for a
    cooperative), against an invoice with VAT.

  https://www.rossoinmobiliaria.com/wp-content/uploads/2024/11/ACUERDO-DE-COLABORACION-CON-AGENCIAS-ROSSO-INMOBILIARIA.pdf
- **Resales Online help** (article dated 24 Jun 2026): a viewing request
  shows the listing agent the surname and the last 4 phone digits; there is
  accept/decline and an automatic email. The article calls it an
  appointment. Reading it as a registration is the agent-voice research's
  interpretation.
  https://support.resales-online.com/en/articles/3420702-property-viewings-booking-and-managing-your-appointments
- **Registration windows** (about 6 months resale in Estepona; 2 or 4 months
  in two Marbella new-build agreements) and **court splits on signed viewing
  sheets** (Málaga 2015 and Cádiz 2024 for the agency, Madrid 2020 against):
  from the 16 Sep 2026 agent-voice research (memory
  `project_agent_voice_research.md`). **Not re-verified.**
- **IRPF on agents' fee invoices** depends on the IAE registration (section
  1, epígrafe 834, vs section 2 at 15%/7%; DGT V2188-21 cited).
  **Secondary sources only; the DGT text was not read.**
  - https://www.iberley.es/practicos/caso-practico-obligacion-practicar-retencion-irpf-alta-epigrafe-834-actividad-empresarial-91321
  - https://www.supercontable.com/informacion/IAE/Consulta_Vinculante_V2188-21.Epigrafe_para_agente_.html
- **PropertyList "commission control"** (the listing agent sets the
  commission; nothing public on payment tracking): memory
  `project_competitive_brief_sep2026.md`. **Not re-verified in this
  session.**
- **Supabase pricing**:
  - Free: 1 GB storage, 500 MB database, 5 GB egress, pauses after 1 week
    idle.
  - Pro: $25/month, 100 GB storage then $0.0213/GB, 8 GB database, 250 GB
    egress then $0.09/GB.

  https://supabase.com/pricing (figures confirmed by the review on 16 Sep
  2026). **This project's plan was not checked.**
- **Resend pricing**: Free is 3,000 emails/month, 100/day and 3 domains;
  Pro is $20/month for 50,000, then $0.90 per 1,000.
  https://resend.com/pricing (re-read 16 Sep 2026).
- **Vercel**:
  - Cron Jobs: included on every plan, 100 per project, 1-minute minimum on
    Pro, billed as function usage.
    https://vercel.com/docs/cron-jobs/usage-and-pricing (doc last updated
    2026-07-15).
  - fra1 function rates: taken from plan 016's Sources, **not re-checked
    here**.
- **`<datalist>`**: partial support in iOS Safari 12.2–26.6 and 27.0–27.1.
  https://caniuse.com/datalist
- **PostgreSQL docs**:
  - `btrim` removes spaces by default (string functions,
    https://www.postgresql.org/docs/current/functions-string.html, per the
    review). The live DB confirmed it:
    `regexp_replace(btrim(E'\tSolvilla'), '\s+', ' ', 'g')` = `' Solvilla'`.
  - Column-specific `UPDATE OF` triggers fire when a listed column is in the
    SET list; changes made by other BEFORE triggers aren't considered;
    same-kind triggers fire in alphabetical order.
    https://www.postgresql.org/docs/current/sql-createtrigger.html (re-read
    16 Sep 2026).
  - VOLATILE functions "obtain a fresh snapshot at the start of each query
    they execute"; STABLE/IMMUTABLE ones use the calling query's snapshot.
    https://www.postgresql.org/docs/current/xfunc-volatility.html (re-read
    16 Sep 2026).
  - `ALTER TYPE … ADD VALUE`: the value can't be used before commit.
    https://www.postgresql.org/docs/current/sql-altertype.html
  - Month arithmetic clamps to the month end.
    https://www.postgresql.org/docs/current/functions-datetime.html
  - RESTRICT "does not allow the check to be deferred"; NO ACTION does.
    https://www.postgresql.org/docs/current/ddl-constraints.html (per the
    review).
- **Live DB, 16 Sep 2026** (read-only probes plus experiments on temp
  tables inside rolled-back transactions; no public object touched):
  - PG 17.6, UTF8, ICU `en-US`
  - `\s` matches NBSP but not U+FEFF
  - the trigger and policy readouts in Current state §1
  - agency aggregates
  - `authenticated` `statement_timeout=8s`
  - the multi-path cascade passing with both RESTRICT and NO ACTION, and a
    direct delete failing with 23503
  - a skip-list function reverting an update that sets only `updated_at`
    while keeping an explicit INSERT value
  - an id-only update rewriting the text
  - the FK's set-null firing an `UPDATE OF agency_id` trigger
- **PGlite 0.5.8** (PostgreSQL 18.3 in WASM, C locale, time zone
  Etc/GMT-1), installed in the session scratchpad on 16 Sep 2026. It ran
  this plan's B1 rehearsal (forward + rollback), the apply script, and a B2
  and B3 check script against a Supabase-shaped stub. It found:
  - the policy-snapshot problem
  - the locale-dependent `\s`
  - a time-zone-dependent rehearsal timestamp

  All three are fixed above. The B1 rehearsal was re-run on 17 Sep 2026,
  including a plan-016-first stub (Test plan). https://pglite.dev
- **Next.js 16.2.6 bundled docs** (in the repo):
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`
  - `01-app/01-getting-started/07-mutating-data.md`
  - `01-app/03-api-reference/04-functions/revalidatePath.md`
- **Live DB aggregates** (earlier the same day): a read-only REST probe with
  the service-role key, aggregates only.
