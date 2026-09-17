# Plan 013: Google Calendar sync, through a "LeadWing" calendar in the agent's Google account

> **Executor instructions**: Follow this plan phase by phase and step by step.
> Run every verification command and confirm the expected result before moving
> on. If a "STOP conditions" item occurs, stop and report; do not improvise.
> When a phase is done, update this plan's row in `plans/README.md` (add row
> 013 if it is missing) with the phase reached.
>
> **Drift check (run first)**:
> `git diff --stat 9bad570..HEAD -- "src/app/api/calendar/[token]/route.ts" src/lib/ics.ts src/lib/calendar-feed-token.ts src/i18n/appointments.ts src/lib/data/calendar.ts src/lib/actions/calendar.ts src/lib/actions/buyer.ts src/lib/actions/clients.ts src/lib/actions/seller.ts src/lib/actions/notifications.ts src/lib/validation/calendar.ts src/components/calendar src/components/settings/settings-view.tsx "src/app/(app)/settings/page.tsx" "src/app/(app)/calendar/page.tsx" "src/app/(app)/home/page.tsx" src/lib/supabase/middleware.ts src/lib/routes.ts src/proxy.ts src/lib/supabase/types.ts src/lib/integrations src/content/legal src/content/pages/about.en.tsx src/content/pages/about.es.tsx src/content/pages/crm-marbella.en.tsx src/content/pages/crm-marbella.es.tsx src/lib/legal.ts src/lib/seo.ts src/lib/faq.ts src/app/llms.txt/route.ts messages/en/landing.json messages/es/landing.json messages/en/calendar.json messages/es/calendar.json messages/en/settings.json messages/es/settings.json messages/en/validation.json messages/es/validation.json vercel.json package.json .env.example supabase/migrations`
>
> Plans 004, 011, 012 and **014–017** may have landed first, so their changes
> can show up:
> - 004: ICS folding and the feed's cache header.
> - 011: the Data panel and the legal-page export text.
> - 012: the `client_imports` migration and new FAQ items.
> - 014: the lead inbox, its cron route and privacy text.
> - 015: `20260922120000_agencies.sql`, agency copy (`llms.txt:47`,
>   `crm-marbella.es.tsx:52-55`).
> - 016: `20260917120000_client_contacts.sql`, `/api/cron/notifications`,
>   `CRON_SECRET`, `src/lib/integrations/cron-auth.ts` (if it took the shared
>   helper), and edits to `data/calendar.ts`, `calendar-feed-token.ts`,
>   `settings-view.tsx`, `settings/page.tsx` and the reminder copy.
> - 017: `/api/cron/whatsapp`, its migration, `settings-view.tsx`.
>
> For anything else that changed, compare it against "Current state" first. A
> mismatch you can't reconcile is a STOP condition. If one of 014–017 changed
> `vercel.json`, `settings-view.tsx`, `data/calendar.ts` or
> `calendar-feed-token.ts` first, see the matching STOP condition.
>
> **Shared working tree**: other Claude sessions may be editing this checkout at
> the same time. Stage only the files this plan names (`git add <path>`), never
> `git add -A`, and don't touch changes you didn't make.

## Status

- **Priority**:
  - **P1 for Phase 0**: it must be live before outreach starts on 21 Sep 2026.
  - **P1 for prerequisite P1** (legal entity): it is needed now, for LSSI and
    live payments, not only for this plan.
  - **P3 for Phases 1–5 until the interview gate (D21) passes** on Fri 9 Oct
    2026. They become P2 if it passes.
  - P3 for Phases 6–8.
- **Effort**:
  - Phase 0: S (0.5–1 day).
  - Phases 1–5: **about 13–16 dev days** plus about 2 founder days.
    - Phase 1: about 1 day.
    - Phase 2: about 8–10 days.
    - Phase 3: about 1 day.
    - Phase 4: about 4–5 days (conflict model, per-item apply, restore,
      change log).
    - Phase 5 (5a and 5b): about 0.5 day.
  - **Elapsed**: about 3–6 weeks from the start of Phase 2 to the Phase 5a
    copy switch (5b follows Phase 4). That covers 2 weeks of build, a
    1-week pilot, and Google's review (3–5 business days on paper, 1–3 weeks
    realistically). With the 9 Oct gate, Phase 5a lands in November 2026 at
    the earliest.
  - Phases 6–8 are optional and gated (see each phase).
- **Risk**: MEDIUM–HIGH.
  - It adds the app's first per-agent OAuth grant, its first encrypted token
    store and its first cron job (unless plan 016 lands first).
  - It adds triggers on core tables (`appointments`, `viewings`, `clients`,
    `properties`), applied to the live database.
  - Background writes land in a third-party calendar, where mistakes are
    visible to the agent.
  - Google's review is outside our control.
- **Depends on**:
  - **Plan 004** (ICS RFC compliance, TODO). Phase 0 executes it.
  - **Plan 011** (soft): it edits the same legal pages and adds a Settings
    panel at the same spot. Run it first if both are queued.
  - **Plan 012** (ordering only): it reserves migration `20260916150000`. It
    also edits the landing FAQ.
  - **Plans 014–017** (shared strings, cron, migration slots, token crypto):
    see "Overlaps with other plans" and D9, D20 and D22.
- **Gated by**:
  - Phase 0: the founder approves the wording in "Until this ships". This
    plan's merged table is the single source for the shared pre-outreach
    strings.
  - Phases 1–8: the founder confirms the Decisions table below.
  - Phase 1: the legal-entity details exist (`src/lib/legal.ts`).
    Steps 1.1.0, 1.1 and 1.3 may start before the interview gate. Step 1.2
    (env vars) waits for it.
  - Phase 2: the interview gate D21 (Fri 9 Oct 2026), Phase 1, and plan 004.
  - Phase 3: a clean Phase 2 pilot, plus Step 3.0's homepage text.
  - Phase 4: a clean pilot week **and** a demand signal (D3).
  - Opening the feature to all agents: Google's verification (Phase 3).
- **Category**: feature
- **Planned at**: commit `9bad570`, 2026-09-16. Revised the same day after an
  engineering and product review.

## Why this matters

- **The site claims it, and the code doesn't back it.** The claim sites (all
  checked 16 Sep 2026):
  - `messages/en/landing.json:73`, key `howItWorks.steps.plan.blurb`:
    "…and syncs to your Google Calendar so it shows up everywhere you already
    look."
  - `:89`, key `howItWorks.tiles.calendar.synced`: "Synced", shown with a
    check mark by the animated tile at
    `src/components/landing/how-it-works.tsx:215`.
  - `:276-277`, keys `faq.items.calendar.q` / `.a`: "Does it sync with Google
    Calendar? Yes…". The FAQ is also emitted as FAQPage JSON-LD through the
    `calendar` entry in `FAQ_KEYS` (`src/lib/faq.ts:20`), so AI answer
    engines repeat it.
  - The Spanish twins are on the same lines of `messages/es/landing.json`.
  - `messages/es/settings.json:42` (`preferences.languageHint`): "Lo usan la
    app y tu calendario sincronizado." The English twin already says
    "calendar feed".
  - `src/app/llms.txt/route.ts:52`: "Google Calendar sync".
  - `src/content/pages/crm-marbella.en.tsx:117` ("Sync the calendar to Google
    Calendar"), `crm-marbella.es.tsx:116-117`, `about.en.tsx:72` ("a
    calendar that syncs to Google Calendar") and `about.es.tsx:72`.
  - What exists today is a **read-only ICS subscription**
    (`src/app/api/calendar/[token]/route.ts`).

  Phase 0 rewords these claims honestly now. **Phase 2 alone (one-way push
  into the agent's own Google account) makes the original "syncs to Google
  Calendar" claims true** (Phase 5a). Two-way sync (Phase 4) is a new, larger
  claim, so it has its own gate (Phase 5b).
- **What the ICS feed can't do** (see Sources):
  - Google refreshes subscribed calendars on its own, undocumented schedule.
    The app's own dialog says "every few hours"; third-party reports say 8–24
    hours, sometimes up to 48 (not verified).
  - Google Calendar only lets you subscribe from a computer web browser.
  - Feed events carry no alarms, so the agent's phone never buzzes when
    LeadWing is closed.
  - Nothing moved in Google comes back.
- **Table stakes, not a differentiator.** Witei documents two-way Google
  Calendar sync behind a "Conecta tu cuenta de Google" button (help article
  dated 26 Feb 2021; current status not re-checked). InmoCMS claims it too
  (search snippet only). The competitor brief says most rivals sell to
  agencies, so parity alone is weak support for a two-week build aimed at
  solo agents. **The interview gate (D21) makes the build decision.**
- **Phone reminders for free.** Pushing `reminder_minutes` as a Google popup
  reminder gives agents a real alert in the Google Calendar app. Today
  reminders only exist as bell rows, generated while the app is open
  (`supabase/migrations/20260601130000_calendar_notifications.sql:7-9`).
- **It lays the groundwork for plans 007, 016 and 017.** The OAuth flow, the
  token encryption (`src/lib/integrations/token-crypto.ts`) and the cron auth
  helper (`src/lib/integrations/cron-auth.ts`) are shared helpers.

## Decisions (open — founder to confirm)

Every row below is a recommendation, not yet a decision. Phase 0 can go ahead
once its wording is approved. **Phases 1–8 wait for the founder to confirm
or change this table.**

| # | Topic | Recommended | Alternatives |
|---|---|---|---|
| D1 | Google scope | **`https://www.googleapis.com/auth/calendar.app.created` only.** LeadWing creates a secondary calendar named "LeadWing" and reads and writes only that calendar. The connected account's email comes from the calendar's read-only `dataOwner` field, so no `openid`/`email` scope is needed. Before building, add the scope under Cloud Console → Data Access and read its sensitivity badge. If it shows non-sensitive, most of Phase 3 disappears. | `calendar.events`: events land on the primary calendar, but the consent reads "View and edit events on all your calendars" and a leaked token exposes everything. `calendar.events.owned`. Add `calendar.freebusy` later, through incremental consent, if agents ask for clash warnings. |
| D2 | Architecture | **Option C, built as B then C** (see "Options considered"). Pushes go through a trigger-filled outbox, drained by `after()` and a 5-minute cron. Pulls use incremental `syncToken`s, on the cron and (via `after()`) when the agent opens `/calendar` or Home. **One caller holds the per-agent lease for a whole cycle: pull first, then push.** From Phase 4, patches and deletes send `If-Match: <etag>`, so a push never silently overwrites a newer Google edit. Watch channels come later (Phase 7). | A (feed only), D (primary calendar), E (Nylas/Cronofy). |
| D3 | What LeadWing accepts from Google (Phase 4) | For **appointments** (both types, `meeting` and `viewing`): start/end time, title, location and notes. For **buyer viewings** (`viewings` table): only the time. Their title belongs to the buyer record. **Reminders are push-only**: Google doesn't change `updated` when only reminders change. **Past events are push-only**: a Google change to an event whose LeadWing start or Google start is before now is never applied. **Phase 4 is built only if** the pilot or the interviews show demand: at least 2 agents say they move or edit appointments in Google, or ask for it. Every Google-originated change to a viewing or appointment is written to `calendar_change_log` (old value, new value, time), because the dated record of when a buyer was shown a home is evidence (registration-log reframe). Once plan 015's registrations land, a viewing linked to a registration is push-only too. | Accept time changes only, for everything. Skip Phase 4 entirely (one-way stays the product). |
| D4 | An event deleted in Google (Phase 4) | Act only on Google's explicit `status: "cancelled"`, **never on absence from a list**. **Future appointment**: remove it from LeadWing, keep a snapshot in `calendar_removed_items` for 30 days, and show a notice on `/calendar` ("1 meeting was removed in Google Calendar") with **Review** (a dialog with **Restore** per item) and **Got it**. **Future buyer viewing**: never delete the record (it holds offers and files); clear `scheduled_at`, `ends_at` and `reminder_minutes`, and log the old values. **Past event (either kind)**: change nothing in LeadWing; drop the link, so the agent's cleanup in Google sticks. | Ignore deletions made in Google and re-push the event (safest, but surprising). Hard-delete appointments with a counter notice only (the first draft; a bulk cleanup in Google could wipe notes). |
| D5 | Events the agent creates directly on the LeadWing calendar | **Import** single timed events as meetings with no client, then tag them in Google so they are recognised later. Skip all-day and recurring events (and instances with `recurringEventId`), and show a count in the panel ("2 events can't sync"). This needs the appointment form to accept a meeting without a client when it has a title (`src/lib/validation/calendar.ts:28-31` requires a client for every meeting today). | Ignore anything LeadWing didn't create. |
| D6 | Tasks | An **optional toggle, off by default** (Phase 6). Open tasks with a `due_on` become all-day events marked free, pushed one way, and are removed when the task is done. `due_on` has no clock time (`20260915120000_tasks.sql:34-35`). | Never push tasks. |
| D7 | Client data in Google events | **Names shown by default**, e.g. "Viewing · Anna Schmidt @ Villa X", using the existing `appointmentTitleFor`: the agent needs to see on the phone whom they are meeting. **Notes are not copied by default.** Two toggles ship **in Phase 2**: "Hide client names in Google" (off) and "Copy my notes to Google" (off). LeadWing never copies the client's phone number, email address or offer amounts from the client record. When the agent turns notes on, notes are copied as written, and the toggle's hint says so. The description carries the notes (if on) plus a link back to the LeadWing page, which needs a login. Always `sendUpdates=none`, and LeadWing never adds guests. | Names hidden by default. Notes copied by default (the first draft; it conflicts with privacy by default, GDPR art. 25). |
| D8 | How changes come back from Google | **v1**: a Vercel cron every 5 minutes runs incremental pulls for connected agents. When an agent opens `/calendar` or Home and the last pull is more than 60 s old, the page schedules a pull with `after()` (no client-side server-action call on mount). A "Sync now" button calls a throttled server action (skipped if the last pull and push are under 15 s old). **Later (Phase 7)**: `events.watch` channels, once there are more than ~50 connected agents or complaints about lag, with the cron kept as an hourly safety net. | Watch channels from day one: seconds of latency, but a public webhook, renewal logic and echo handling. |
| D9 | Token storage (**decide once for 007, 013 and 017**) | **AES-256-GCM in the app**, in one shared module, `src/lib/integrations/token-crypto.ts`. One key, `INTEGRATION_TOKEN_KEY` (32 random bytes, base64), with `INTEGRATION_TOKEN_KEY_VERSION` (default `k1`) as the ciphertext prefix. The per-purpose AAD contexts are `calendar:<agentId>` (013), `mail:<agentId>` (007), `whatsapp:<agentId>` (017's Meta token), `whatsapp-body:<agentId>` (017's message bodies) and `whatsapp-payload:<sha256>` (017's raw webhook payloads) (batch decision E7). One rotation runbook (Maintenance notes). The key lives in Vercel as a Sensitive variable, plus a copy in the founder's password manager saved at creation, because Sensitive values can't be pulled back (batch decision D-I; the custody steps are Step 1.2's, batch decision E1). The ciphertext lives in RLS-locked tables with no `anon`/`authenticated` privileges. Splitting key (Vercel) and ciphertext (Supabase) means a single leak is harmless. Vault was ruled out because its `vault.decrypted_secrets` view is readable by any `postgres` session, including the routine `SUPABASE_DB_URL` sessions Claude runs. **Shared by 007, 013 and 017** (batch decision D-A, 17 Sep 2026): every integration token is stored as one text blob, `"<keyVersion>.<iv>.<ciphertext>.<tag>"`, written by `encryptSecret`, read by `decryptSecret` and rotated through `needsReencrypt` (Step 2.2). There are no `bytea` parts, no `key_version` column and no `encryptParts`/`decryptParts` helpers. The module exports only `encryptSecret`, `decryptSecret` and `needsReencrypt` (no `encryptBytes`/`decryptBytes`). 017 now uses this module and key too, not Vault or a `WHATSAPP_DATA_KEY`. Its `seal.ts` stays as a thin wrapper over `encryptSecret`/`decryptSecret` with no key of its own, and it encrypts text only: message bodies (AAD `whatsapp-body:<agentId>`) and raw webhook payloads as UTF-8 JSON text (AAD `whatsapp-payload:<sha256>`). **No integration token uses Vault** (D-B). The one Vault use in the batch is plan 016 Step 21b's optional `pg_cron` + `pg_net` fallback, which stores `CRON_SECRET` there because `pg_net` needs it inside the database. It is used only if Vercel Cron can't be, `CRON_SECRET` only triggers idempotent scheduled jobs and grants no data access, and `CRON_SECRET` is rotated after any exposure of `SUPABASE_DB_URL`. | Supabase Vault 0.3.1 (installed on the live DB), behind a security-definer RPC that only `service_role` can call, for all three plans (ruled out for tokens batch-wide, D-B). |
| D10 | Plans that get sync | **Every plan.** It costs about €0.02–0.05 per connected agent a month, it drives activation, and the landing FAQ says Pro is otherwise "identical to Free" (`landing.json:245`). | Pro only. That needs the FAQ changed and a downgrade path (pause sync, keep the calendar). |
| D11 | The ICS feed | **Keep it**, relabelled "Other calendar apps (read-only link)", for Apple and Outlook users and for agents who won't grant Google access. Phase 0 ships plan 004 and makes feed titles use `appointmentTitleFor`. Once Google is connected, tell the agent to remove any old subscription, or every event shows twice. Feed-token rotation can come later. | Retire the feed when Google sync ships (hurts Apple and Outlook users). |
| D12 | Google Cloud project and OAuth client | **A separate Cloud project, "LeadWing Calendar"**, whose only OAuth client is a Web client with the one redirect `https://www.leadwing.app/settings/calendar/google/callback`, and whose only authorized domain is `leadwing.app` (verified in Search Console on 7 Sep 2026). **Leave the Supabase login project as it is.** Why: brand verification requires the authorized domains to include the domains of every Web client's redirect URIs, with ownership verified in Search Console. The login client redirects to `<ref>.supabase.co`. `supabase.co` is in the private section of the Public Suffix List, so that host is its own registrable domain, and the founder can't verify it. A separate project keeps the calendar review off that problem and keeps the live login's publishing status untouched. The cost is one more brand check (usually minutes). | Reuse the login project (one brand). Only workable with a Supabase custom domain (a $10/month add-on that needs a paid Supabase plan; the project's plan isn't confirmed), or if Google's reviewer accepts the third-party domain (a third-party blog suggests this; not verified). |
| D13 | Pilot while verification is pending | **Publish the separate project as an unverified "In production" app** once brand verification passes. Pilot users see Google's unverified-app warning screen. There is a lifetime cap of 100 new users, which 2 pilot users won't reach, and **no 7-day token expiry**, so the one-week pilot isn't cut short by an expiry on day 7. The connect button still opens only to allow-listed emails (`GOOGLE_CALENDAR_PILOT_EMAILS`) until approval. | **Testing** mode with named test users: refresh tokens expire after 7 days, so pilot agents reconnect weekly. That churn exercises the revoked path, but it lands exactly on the one-week Done gate. |
| D14 | Conflicts (Phase 4) | **Three-way check, not timestamps against `updated_at`.** `set_updated_at` bumps `updated_at` on every update, including columns the sync ignores (`viewings.had_offer`, `offer_price`, `property_price`), so it can't tell who changed what. Instead: (1) **No pending outbox row with `changed_at`** for the record means LeadWing hasn't changed a tracked column since the last push, so **Google wins**. (2) **A pending row with `changed_at`** is a real conflict: the later of Google's `updated` and the row's `changed_at` wins. `changed_at` is stamped only by the sync triggers, never by backfills or reconciles. (3) Pushes carry `If-Match: <link.etag>`. A 412 leaves the outbox row for the next pull to settle (rule 2). Store the last pushed `etag` and payload hash, and skip echoes of our own writes. Pull writes go through a function that sets `leadwing.sync_origin = 'google'` for its transaction, so the outbox triggers stay quiet. | Google always wins, or LeadWing always wins. Last writer wins on `updated_at` (the first draft; an unrelated LeadWing edit silently reverts a Google time move). |
| D15 | Viewing end time | **Add a nullable `viewings.ends_at`.** Display still defaults to 1 hour, so an event stretched in Google isn't silently snapped back, and the feed can use it too. A database trigger keeps the duration when the start moves in LeadWing. | Ignore end-time changes for viewings. |
| D16 | Sync window | **First inserts**: the past 60 days plus everything ahead, the same window as the feed (`route.ts:25-27`). **An event that already has a link is always patched or deleted, whatever its age.** That is how a client's deletion or rename reaches older Google events. **Pulls** never apply changes to past events (D3). | Future only. |
| D17 | Disconnect | **Delete the LeadWing calendar in Google by default**, which removes the client data there. A checkbox keeps it as a frozen copy (reconnecting later creates a new calendar; the checkbox says so). **Disconnect works in every state**, including `revoked` and `calendar_missing`. Either way, revoke the token and wipe the tokens, links and outbox rows. | Keep the calendar by default. |
| D18 | This week's landing copy | "Yes, one way" plus a private calendar link, with **no date** and no "for now" (see "Until this ships"). Switch to "sync" (one-way, connected account) in Phase 5a, and to "two-way" only when Phase 4 is live for real, verified users (Phase 5b). | Remove every Google Calendar mention. |
| D19 | Outlook | Build it (Phase 8) **only if at least 2 of 5 interviewees** keep their diary in Outlook or Microsoft 365. Until then the ICS link covers them. | Build Outlook with Google. |
| D20 | Legal framing of the connection (**one position for 013, 014 and 017**; not legal advice, a lawyer should confirm) | **A service the agent connects under their own account is described as "a service you connect"**. Google Calendar (013) and WhatsApp Business (017 D8) are such services: LeadWing sends data into the agent's own account on the agent's instruction, and the agent's own agreement with the provider governs it there. **A new purpose for an already-listed provider** (Google here, Resend in 014) is not "adding or replacing" a sub-processor, so **Terms annex D's 30-day notice is not triggered**. The annex A purpose line and the annex E transfer sentence are still added (Step 1.3). **Send a courtesy email when the Phase 1 legal text goes live** (Step 1.4), not at the end of Phase 3: if the founder or a lawyer reads the change as material under Terms §16, the 30-day period then runs during the pilot and the review, not after them. | Treat Google as a sub-processor with a widened purpose and send the 30-day notice before connect opens to everyone. |
| D21 | Interview gate for Phase 2 | At the **Fri 9 Oct 2026** checkpoint, **at least 3 of the first 8 solo agents** are green on a new score **H** (Calendar). Green = their last viewing is booked in a Google Calendar they control (their own Gmail or a Workspace account whose admin doesn't block third-party apps). Questions to add to `plans/validation-interview-script.md` (past tense; the founder or a separate change adds them; this plan doesn't edit the script): "Show me where your last viewing is booked." · "Is that your own Gmail or your agency's account?" · "Has your office ever blocked an app from your Google account?" · "What did you do the last time a viewing moved?" H carries the same weight as D and E. F and G are taken by plan 015. Until the gate passes, Phases 1.2–5 stay P3. | Build without a gate (the first draft). |
| D22 | Shared cron auth (**one behaviour for 013, 014, 016 and 017**) | One helper, `src/lib/integrations/cron-auth.ts`, exporting `authorizeCron(request)`. The helper and `CRON_SECRET` (64 hex characters, `openssl rand -hex 32`, as plan 016 P7 has it) are created by whichever of plans 013, 014, 016 and 017 lands first (expected: 016 Phase 2); later plans reuse them (batch decision D-C). **An unset secret returns 401** and logs `cron_secret_missing` (never 500 or 503, so an unauthenticated caller learns nothing). A wrong header returns 401 and logs `cron_secret_mismatch`. In both cases no work runs. Outside production (`VERCEL_ENV !== "production"`), every cron route requires `?agent=<uuid>` and processes only that agent (plan 016's guard), because `.env.local` points at the live database. `vercel.json` `crons` entries are always appended, never replaced. Before adding any cron route, check whether plan 016's `pg_cron` fallback is already active (016 Step 21b's check: `pg_cron` installed and `select jobname from cron.job where jobname like 'leadwing_%'` returns rows); if it is, add a `cron.schedule` migration with 016 Step 21b's recipe instead of a `vercel.json` entry (batch decision E2). If the first cron run is blocked by Deployment Protection, use the fallback plan 016 P8 decides (`pg_cron` + `pg_net` per 016 Step 21b, or a protection-scope change); the founder chooses. The `pg_cron` fallback must schedule every route/schedule pair in `vercel.json`'s `crons` block as its own job, at the same cadence and with every header the route reads (including `x-vercel-cron-schedule` set to the exact schedule string, which 017's daily `15 3 * * *` retention run depends on), before that block is removed. Cron routes in the batch (E3): 013 `/api/cron/calendar-sync` (`*/5 * * * *`), 014 `/api/cron/inbox`, 016 `/api/cron/notifications` (hourly; `/api/cron/push` in its Phase 3), 017 `/api/cron/whatsapp` (`*/5 * * * *` plus `15 3 * * *`). | Per-plan behaviour (the earlier drafts had 014 → 503, 016 → 500, 017 → 401; all four plans now answer 401, D-C). |

## Options considered (checked 2026-09-16)

| Option | What it is | Cost per connected agent / month | Verdict |
|---|---|---|---|
| A | Keep the ICS feed; fix the copy | €0 | Right for this week (Phase 0), weak as the end state: one way, slow, needs a computer, no alarms. |
| B | One-way push through the Calendar API into a "LeadWing" calendar | ≈ €0.005 | The first half of C (Phase 2): same scope, consent and review. |
| **C** | **Two-way sync on the "LeadWing" calendar (`calendar.app.created`)** | **≈ €0.02–0.05** | **Recommended.** Narrowest scope, least personal data, no public webhook in v1, matches Witei. |
| D | Two-way sync on the primary calendar (`calendar.events`) | ≈ €0.03–0.05 | Scary consent. `syncToken` can't be combined with `privateExtendedProperty`, so every pull scans the agent's personal events too. |
| E | Nylas or Cronofy | ≈ €1.60–2.10 plus a $15–49 base (Nylas list price) | Eats most of a €29 seat, loses money on Free agents, adds a US sub-processor. A shared OAuth app is only offered on Nylas Pro Annual or Enterprise, so LeadWing's own Google verification is probably still needed. |

## Current state (verified 2026-09-16 at `9bad570`)

HEAD is `9bad570`. The only uncommitted changes are plan documents
(`plans/README.md`, `plans/validation-interview-script.md`, and the untracked
`plans/011-*` to `plans/017-*`).

1. **The only Google link is a public, read-only ICS feed**,
   `src/app/api/calendar/[token]/route.ts:16-109`:
   - `:21` verifies the HMAC token.
   - `:24` uses the service-role admin client; `:56-72` scopes every query by
     `agent_id`.
   - `:25-27` looks back 60 days. `:62-71` returns every appointment and
     every dated viewing from that point on. Tasks are never included.
   - `:80` and `:93` set the UIDs `leadwing-appt-<id>@leadwing.app` and
     `leadwing-view-<id>@leadwing.app`. `:95` gives every viewing a fixed
     1-hour end.
   - `:102-108` responds with `Cache-Control: public, max-age=3600` (`:105`)
     and `filename="leadwing.ics"`. Plan 004 quotes the older `lena.ics`
     version of this block; only the header line matters.
   - Plan 004's own drift check (base `4286cc9`) reports `dae512b` and
     `1b94d32` on `route.ts` and `ics.ts` (the i18n and rename commits). That
     is expected; only its `ics.ts` and headers excerpts need reconciling.
2. **Feed title bug.** `route.ts:83` builds appointment titles itself.
   - It never selects `type` or the property (`:59-61`), so an appointment of
     type `viewing` shows in Google as "Meeting with X".
   - The docstring at `src/i18n/appointments.ts:11-16` says the feed uses
     `appointmentTitleFor`; only the in-app calendar does
     (`src/lib/data/calendar.ts:122-132`, which also resolves the property
     label from `property_label`, `property.address` or the property type).
   - A third copy of that property-label expression lives in
     `src/lib/actions/notifications.ts:204-208`.
   - The live DB has 1 such appointment.
   - Viewing titles are `title` or "Viewing with {name}", in both the feed
     (`:96`) and the app (`data/calendar.ts:166-168`). The app sets
     `ends_at: null` and `location: null` for viewings.
3. **`src/lib/ics.ts:23-48`** doesn't fold long lines, doesn't end with CRLF,
   and writes no `SEQUENCE`, `LAST-MODIFIED` or `STATUS`. A deleted event
   simply drops out. Plan 004 (TODO) fixes the folding, the trailing CRLF and
   the cache header.
4. **Feed token**, `src/lib/calendar-feed-token.ts:5-16`: an HMAC of the agent
   id, keyed with `SUPABASE_SERVICE_ROLE_KEY`. It never expires and can't be
   revoked; that is a documented choice in plan 004.
5. **The subscribe UI** is `CalendarSyncDialog`
   (`src/components/calendar/calendar-sync-dialog.tsx:47-163`), rendered in
   the toolbar at `src/components/calendar/calendar-view.tsx:263`.
   - Button "Sync" (`messages/en/calendar.json:64`); title "Sync to Google
     Calendar" (`:65`). The Spanish twins are "Sincronizar" and "Sincronizar
     con Google Calendar".
   - It links to Google's add-by-URL settings page (`:21-22`).
   - Its note (`calendar.json:76`) says subscribed calendars refresh "every
     few hours". Google documents no interval.
6. **Where calendar rows are written.** The server actions are:
   - `getCalendarFeedToken`, `saveAppointment` and `deleteAppointment` in
     `src/lib/actions/calendar.ts` (`:16-29`, `:31-76`, `:78-89`), called
     from `src/components/calendar/appointment-dialog.tsx:147,171`.
   - `saveViewing` (which writes `scheduled_at` and `reminder_minutes`) and
     `deleteViewing` in `src/lib/actions/buyer.ts` (`:51-97`, `:99-122`),
     called from `viewing-dialog.tsx` and `sections/viewings-section.tsx`.
   - `saveProperty` (`src/lib/actions/seller.ts:19-57`) updates `address`,
     `city` and `property_type`. `deleteProperty` (`:59-78` and on) deletes a
     property, which SET NULLs `appointments.property_id`.
   - None of them has a sync hook. `saveAppointment` relies on RLS only, and
     accepts any `client_id` or `property_id` (see item 7).
7. **Changes that bypass those actions**, which is why sync must start in
   the database:
   - `viewings.client_id` is `ON DELETE CASCADE`
     (`20260529120000_init.sql:92`), so `deleteClient`
     (`src/lib/actions/clients.ts:137-187`, the delete at `:183`) removes a
     client's viewings inside Postgres.
   - `appointments.client_id` and `property_id` are `ON DELETE SET NULL`
     (`20260601130000_calendar_notifications.sql:28,30`), which silently
     changes derived titles.
   - Renaming a client (`updateClient`, `clients.ts:104`) or editing a
     property's address, city or type (`saveProperty`) also changes derived
     titles and locations.
   - Postgres fires row triggers on the referencing table for cascaded
     deletes and SET NULL updates, so triggers catch all of these.
   - **Cross-tenant references are possible.** The live RLS policies on
     `appointments`, `viewings`, `clients` and `properties` check only
     `agent_id = auth.uid()` (read-only `pg_policies` probe, 16 Sep 2026).
     FK checks bypass RLS, so an appointment can point at another agent's
     client or property id. The cookie-client loader (`data/calendar.ts`)
     is safe, because RLS on `clients` hides the foreign embed. **The
     service-role feed and sync would resolve it**, and so would leak the
     name or address. The live DB has 0 such rows today. `tasks` already
     checks client ownership in its with-check
     (`20260915120000_tasks.sql:94-101`).
8. **Schema to sync.**
   - `appointments` (`calendar_notifications.sql:22-40`): `type
     meeting|viewing`, `title`, `client_id`, `property_id`,
     `property_label`, `starts_at not null`, `ends_at`, `location`, `notes`,
     `reminder_minutes`. Its `updated_at` trigger is at `:44-46`. Its
     indexes are `(agent_id)`, `(agent_id, starts_at)` and `(client_id)`.
     **There is no index on `property_id`.**
   - `viewings` gained `scheduled_at` and `reminder_minutes` in
     `20260601140000_viewing_schedule.sql:10-12`. It has no end time and no
     location, and it also holds `had_offer`, `offer_price` and
     `property_price`, which the sync ignores. Its `updated_at` trigger is at
     `init.sql:105-107`.
   - `viewingScheduleSchema` caps `reminder_minutes` at 10080
     (`src/lib/validation/buyer.ts:66-69`). **`appointmentInputSchema` has no
     upper cap** (`src/lib/validation/calendar.ts:46`). Google accepts popup
     reminders of 0–40320 minutes.
   - Form limits (`src/lib/validation/calendar.ts`): title ≤ 200, location
     ≤ 200, notes ≤ 2000. Values pulled from Google must be truncated to
     these.
   - `tasks.due_on` is a plain date (`20260915120000_tasks.sql:34-35`).
   - `properties` (`init.sql:149-161`) has `address`, `city`,
     `property_type` and `agent_id`.
9. **OAuth storage today** is email-only and unused:
   - `email_accounts` (`init.sql:188-198`), with the enum `email_provider
     google|microsoft|resend` (`init.sql:14`).
   - `token_ref` is commented as a Vault reference (`init.sql:194`).
   - The live table has 0 rows.
   - There is no calendar connection table, no provider token store and no
     Google library in `package.json`.
10. **Login keeps no Google token.** `signInWithOAuth` uses default scopes
    (`src/app/login/page.tsx:74-88`); the callback is
    `src/app/auth/callback/route.ts:13-32`. 7 of the 12 live identities are
    Google, 5 are email OTP, and 4 of 10 users are on non-Gmail addresses.
    The login client redirects to the project's `<ref>.supabase.co` host
    (`.env.local` uses the plain `supabase.co` host). **Calendar connect
    must be its own OAuth flow, in its own Cloud project (D12)**,
    independent of how the agent signs in.
11. **Routing traps.**
    - `src/lib/supabase/middleware.ts:40-41` and `:55-59` send any signed-in
      request for a path starting with `/auth` to `/home`. **The Calendar
      callback must not live under `/auth`.**
    - `PROTECTED_PREFIXES` (`src/lib/routes.ts:14-26`) includes `/settings`
      and `/calendar`.
    - `/api` is public, but the proxy matcher (`src/proxy.ts:67-77`) still
      runs `updateSession` on it. That only refreshes cookies and never
      redirects `/api/*`.
    - Homes chosen: `src/app/(app)/settings/calendar/google/{start,callback}/route.ts`
      (no `page.tsx` shares those segments; `settings/` holds only
      `page.tsx`) and `src/app/api/cron/calendar-sync/route.ts`.
12. **No background infrastructure yet.**
    - `vercel.json` holds only `"regions": ["fra1"]`. Plans 014
      (`/api/cron/inbox`), 016 (hourly `/api/cron/notifications`, plus
      `/api/cron/push` in its Phase 3) and 017 (`/api/cron/whatsapp` every
      5 minutes, `*/5 * * * *`, plus a daily `15 3 * * *` retention run)
      also add cron routes (batch decision E3).
    - `CRON_SECRET` is in neither `.env.local` nor `.env.example`. Plans 014,
      016 and 017 use the same variable.
    - `after()` isn't used anywhere in `src`.
    - Bell rows are generated lazily (`src/lib/actions/notifications.ts:162-180`).
    - Patterns to copy: the admin client (`src/lib/supabase/admin.ts:11-17`,
      "scope every query by agent_id") and the signed, idempotent Stripe
      webhook (`src/app/api/stripe/webhook/route.ts:30-56`).
    - **The checkout has no `.vercel/` folder** (it is gitignored,
      `.gitignore:42-43`, and absent). Vercel CLI 32.2.4 therefore prompts to
      link before `vercel env ls/add` works.
13. **Next 16 docs** (bundled):
    - `after()` works in Server Components, Server Functions, Route Handlers
      and Proxy. It runs for the route's `maxDuration`, even after an error
      or a `redirect()`
      (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md:8,48-54`).
    - `cookies()`/`headers()` are readable inside `after` only from Route
      Handlers and Server Functions (`after.md:62-66`), so read the agent id
      before the callback in a page.
    - "The client currently dispatches and awaits them one at a time" for
      Server Functions
      (`01-app/01-getting-started/07-mutating-data.md:206`). A long sync
      action fired on page mount would queue the bell's sync and the agent's
      saves behind it.
    - `maxDuration` is a named export in a route file; for Server Actions it
      is set on the page
      (`03-file-conventions/02-route-segment-config/maxDuration.md`).
    - The route segment config no longer lists `dynamic` under Cache
      Components (`index.md`). This project doesn't enable Cache Components
      (`next.config.ts`).
14. **Settings.**
    - `SettingsView` (`src/components/settings/settings-view.tsx`) uses
      `Panel` (`:19`); the profile panel starts at `:87` and
      `<PreferencesPanel />` renders at `:170`. Plan 011 adds its Data panel
      right after it.
    - `src/app/(app)/settings/page.tsx:17-26` passes `email`, `fullName` and
      `timeZone`.
    - `messages/es/settings.json:42` `preferences.languageHint` says "tu
      calendario sincronizado"; the English `:42` says "calendar feed".
    - The agent's time zone is `profiles.time_zone`
      (`20260914120000_profile_settings.sql`), resolved by `resolveTimeZone`
      with the default `Europe/Madrid` (`src/lib/time-zones.ts:7,56-58`).
    - The feed takes its language from `profiles.locale` (`route.ts:31-37`).
    - `getSessionUser()` reads verified JWT claims locally
      (`src/lib/data/session.ts:18`).
15. **Copy that is already honest** and stays until Phase 5a:
    `crm-spain.en.tsx:133-134` ("a Google Calendar feed"),
    `crm-spain.es.tsx:135-136` ("suscripción") and
    `messages/{en,es}/billing.json:243` ("feed").
    `src/app/layout.tsx:49-56` keywords don't mention Google Calendar, so
    nothing changes there.
16. **Legal pages cover only the feed.**
    - `src/content/legal/privacy.en.tsx:240-244` names Google LLC for
      "Sign in with Google; Google Calendar, if you subscribe to your
      calendar feed"; Spanish at `privacy.es.tsx:249-254`.
    - Privacy §7 "International transfers" (`privacy.en.tsx:263-270`;
      ES `privacy.es.tsx:273` on) says the database and files are stored in
      the EU.
    - `terms.en.tsx:138-144` (§10 "Third-party services") and
      `terms.es.tsx:144` mention Google Calendar.
    - Terms annex A "What is processed" (`terms.en.tsx:217-234`; ES `:223`
      on) lists purposes without this transfer. Annex D (`:270-278`; ES
      `:282-291`) promises 30 days' notice before "adding or replacing" a
      sub-processor. Annex E (`:279-284`; ES `:292-297`) says "Data is stored
      in the European Union." §16 (`:188-194`) promises 30 days' notice of
      material changes to the terms.
    - `LEGAL_ENTITY` (`src/lib/legal.ts:10-23`) is still all placeholders,
      so the pages show a draft banner (`legalEntityPending()`).
    - `LEGAL_UPDATED` is at `:26-30`.
17. **Live DB** (read-only catalog probe, 16 Sep 2026):
    - Postgres 17.6. `supabase_vault` 0.3.1 is installed; `pg_cron` 1.6.4
      and `pg_net` 0.20.3 are available but not installed. This plan
      doesn't use them (see D22 for the Deployment Protection fallback).
    - The newest migration is `20260916120000`. Reserved by other plans:
      `20260916150000` (012), `20260917120000` (016's example), and
      `20260922120000` (015's example). `schema_migrations` has the columns
      `version`, `name` and `statements`.
    - 10 profiles; 8 appointments (7 meetings, 1 viewing); 8 viewings, 7 of
      them dated; 0 cross-tenant client or property references.
    - `to_regclass('public.calendar_connections')` is null.
    - **Default privileges**: new `public` tables grant `anon` and
      `authenticated` `arwdDxtm` (every privilege, including TRUNCATE,
      REFERENCES, TRIGGER and MAINTAIN). New functions grant EXECUTE to
      `anon`, `authenticated` and `service_role` explicitly.
    - **Timeouts**: `anon` has `statement_timeout=3s` and `authenticated`
      has 8 s. `service_role` has no role setting, **but every PostgREST
      call (admin client included) comes in through `authenticator`**,
      which has `statement_timeout=8s`, `lock_timeout=8s` and
      `session_preload_libraries=supautils, safeupdate`. Every service-role
      RPC in this plan must finish in 8 s, and every UPDATE/DELETE needs a
      WHERE clause (safeupdate).
18. **Tooling.**
    - Node 24 (`package.json` engines, `.nvmrc`).
    - Vitest runs in `jsdom` (`vitest.config.ts`). Node-only tests need
      `// @vitest-environment node`.
    - Real translators in tests: `src/lib/subscription.test.ts:1,18` uses
      `createTranslator` from `next-intl` (4.14.2) with the JSON messages.
    - CI runs typecheck → lint → test → build (`.github/workflows/ci.yml`).
    - There is one Supabase project, and `.env.local` points at it.
    - **Claude can't sign in**, so the founder runs the signed-in OAuth
      checks.

## Target design (Phases 2 and 4)

```
 LeadWing write (any path: action, cascade, rename, property edit)
   └─ AFTER trigger ─► calendar_enqueue(changed = true) ─► calendar_sync_outbox
                                   (one row per record, newest op wins, version + 1, changed_at = now())
                                                │
   after() in the action (≈ seconds) ───────────┤   runAgentCycle(agentId):
   after() on /calendar and Home (pull, stale) ─┤     withAgentLease → [pullAgent (Phase 4)] → drainAgent
   /api/cron/calendar-sync every 5 min ─────────┤     (the caller owns the lease; both steps assume it)
                                                ▼
                        drainAgent: token → Google events.insert/patch/delete
                                    (sendUpdates=none, deterministic ids, If-Match from Phase 4)
                                                │
                                                ▼
                                   calendar_event_links (etag, payload hash)

 Google change ─► pullAgent(agentId)
                    events.list?syncToken=… ─► compare with the link, the row and the outbox (D14)
                    ─► calendar_apply_changes() RPC, per-item savepoints
                       (sets leadwing.sync_origin='google'; triggers stay quiet; writes calendar_change_log)
```

- **Service role, carefully.** Tokens are service-role only, so the drain
  and the pull use `createAdminClient()`, the same as the feed. Every query
  filters on `agent_id`, **and every embedded client or property is dropped
  unless its own `agent_id` matches** (Current state 7). The agent id always
  comes from a verified session (`getSessionUser()` / `auth.getUser()`) or
  from the database itself (the cron), **never from request input**. The one
  exception is the non-production `?agent=` guard (D22), which only narrows a
  run.
- **Event ids** are deterministic on first insert: the kind letter plus the
  record's UUID without dashes. That is `a…` for appointments, `v…` for
  viewings and `t…` for tasks; `r` is reserved for plan 015's registrations.
  Google allows base32hex ids (`a–v`, `0–9`) of 5–1024 characters, and UUID
  hex is a subset of that. After the first insert, always use the id stored
  in `calendar_event_links` (imported events keep Google's own id).
- **Per-agent lock.** A lease column on `calendar_connections`
  (`lease_until`) is claimed through an RPC by the **caller** (`run.ts`),
  which holds it for the whole cycle and releases it in `finally`. Postgres
  advisory locks don't survive across PostgREST calls, so don't use them
  here.
- **Capacity.** One cron run has a 45 s budget at concurrency 4. At about
  0.3 s per agent that is roughly 500–600 agents per 5-minute cycle, not
  "thousands". Before about 300 connected agents, raise concurrency to 8–10
  or `maxDuration` (Pro with fluid compute allows up to 800 s), or move to
  Phase 7.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 |
| Lint | `npm run lint` | exit 0 (existing warnings OK) |
| Tests | `npm test` | exit 0, all pass |
| Build | `npm run build` | exit 0 |
| Dev server | `npm run dev` | serves on :3000 |
| DB scripts | `npm i pg --prefix <scratchpad>` once, then `node --env-file=/Users/lepadatumihail/Documents/work/personal/lena/.env.local <scratchpad>/<script>.mjs` | script output; never print `SUPABASE_DB_URL` |
| Link the checkout (once) | `vercel link --yes --project lena-crm --scope lepadatumihails-projects` | writes the gitignored `.vercel/`; never stage it |
| Vercel env names | `vercel env ls production --scope lepadatumihails-projects` | lists names, never values |
| Pull env for a one-off script | `vercel env pull <scratchpad>/.env.vercel --environment=production --scope lepadatumihails-projects` | a file in the scratchpad only; delete it after use; never `cat` it. Sensitive variables (`INTEGRATION_TOKEN_KEY`, `WHATSAPP_NUMBER_HMAC_KEY`) can't be pulled back this way, so nothing may depend on pulling them (D-I) |
| Cron, locally, unsigned | `curl -si http://localhost:3000/api/cron/calendar-sync \| head -1` | `HTTP/1.1 401` |
| Cron, locally, signed | `curl -si -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/calendar-sync?agent=<founder id>"` | `200` with `{"skipped":"not_configured"}`: local dev has no Google variables by design. Without `?agent=` it returns `400` (D22). Needs `CRON_SECRET` in the shell env or `.env.local` (plan 016 P7). |
| Vercel logs | Vercel MCP `get_runtime_logs` for project `lena-crm`, filtered on `/api/cron/calendar-sync` | 200s every 5 min |

## Suggested executor toolkit

- **Read before Phase 2** (bundled docs under
  `node_modules/next/dist/docs/01-app/`):
  - `03-api-reference/04-functions/after.md`
  - `03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md`
  - `01-getting-started/07-mutating-data.md` (Server Functions run one at a
    time from the client)
  - `01-getting-started/15-route-handlers.md`
  - `02-guides/backend-for-frontend.md` ("Do not rely on proxy alone")
  - `02-guides/authentication.md`
- **Google REST endpoints** (no SDK; the `googleapis` package is 214 MB
  unpacked). All calls use `fetch` with `AbortSignal.timeout(10_000)`.
  - Consent: `https://accounts.google.com/o/oauth2/v2/auth`
  - Tokens: `POST https://oauth2.googleapis.com/token`
    (`grant_type=authorization_code` or `refresh_token`)
  - Revoke: `POST https://oauth2.googleapis.com/revoke` (form body `token=`)
  - Calendar base: `https://www.googleapis.com/calendar/v3`
    - `POST /calendars` → `{ id, summary, timeZone, dataOwner }`
    - `PATCH /calendars/{calendarId}` (description updates)
    - `DELETE /calendars/{calendarId}`
    - `PATCH /users/me/calendarList/{calendarId}` with `{ selected: true }`
      (the CalendarList `selected` default is false)
    - `POST /calendars/{calendarId}/events?sendUpdates=none`
    - `PATCH /calendars/{calendarId}/events/{eventId}?sendUpdates=none`,
      from Phase 4 with `If-Match: <etag>` (a 412 means Google changed it)
    - `DELETE /calendars/{calendarId}/events/{eventId}?sendUpdates=none`,
      from Phase 4 with `If-Match`
    - `GET /calendars/{calendarId}/events?syncToken=…&pageToken=…&maxResults=250`.
      A full list omits `syncToken` and sets `showDeleted=true`. **Never**
      add `timeMin`, `timeMax`, `orderBy`, `q`, `updatedMin`, `iCalUID` or
      `privateExtendedProperty` alongside a `syncToken`.
    - Array fields in a patch replace the whole array. To restore an event,
      send `recurrence: []` and explicit `start.date: null` /
      `end.date: null` next to the `dateTime` values.
  - Errors come back as `{ error: { code, message, errors: [{ reason }] } }`.
- **DB scripts**: the rehearsal pattern from plan 012 Step 8 (run as the
  founder's user inside a transaction that always rolls back; wrap each
  expected error in a savepoint).
- **Seeing signed-in UI without signing in**:
  - Render components from `src/app/preview-tmp/<your-own-folder>/page.tsx`
    with mock props; never use a `_`-prefixed folder.
  - Delete only your own folder, then grep `.next/types` and
    `.next/dev/types` for it.
  - Radix overlays can freeze in the in-app Browser pane; use the
    chrome-devtools MCP.
- **Optional Google-side check**: if the session has a Google Calendar
  connector for the founder's account, use it **read-only**
  (`list_calendars`, `list_events`) to confirm the "LeadWing" calendar and
  its events. Never create or delete through it.

## Scope

**In scope** (the only files to create or modify), by phase:

- **Phase 0**:
  - `messages/{en,es}/landing.json`, `messages/{en,es}/calendar.json`
  - `messages/es/settings.json` (`preferences.languageHint` only)
  - `src/app/llms.txt/route.ts`
  - (the copy files above are normally edited by plan 016 Step 0.1, which
    applies this plan's "Until this ships" table; see Step 0.3)
  - `src/content/pages/crm-marbella.{en,es}.tsx`, `src/content/pages/about.{en,es}.tsx`
  - `src/lib/seo.ts` (`PUBLISHED` only)
  - plan 004's files (`src/lib/ics.ts`, `src/lib/ics.test.ts`,
    `src/app/api/calendar/[token]/route.ts`, `src/lib/calendar-feed-token.ts`)
  - `src/i18n/appointments.ts` (the new `appointmentPlaceFor` helper)
  - `src/lib/data/calendar.ts` (use that helper; no other change)
  - `src/app/api/calendar/[token]/route.test.ts` (new)
  - `plans/README.md`
- **Phase 1**:
  - `src/lib/legal.ts`
  - `src/content/legal/privacy.{en,es}.tsx`, `src/content/legal/terms.{en,es}.tsx`
  - `.env.example`
- **Phase 2**:
  - the migration `supabase/migrations/<ts>_calendar_sync.sql` and
    `src/lib/supabase/types.ts`
  - `src/lib/integrations/token-crypto.ts` (+ test), `src/lib/integrations/cron-auth.ts` (+ test, only if this plan is the first of 013, 014, 016 and 017 to land; expected creator: 016 Phase 2, D22)
  - `src/lib/integrations/google/{http,errors,oauth,calendar-api}.ts`
    (+ tests for `errors`, `oauth` and `calendar-api`)
  - `src/lib/calendar-sync/{config,event-id,event-mapping,source,connection,push,run,schedule}.ts`
    (+ tests for `event-id`, `event-mapping`, `source`, `push`, `run`)
  - `src/lib/calendar-sync/fake-google.ts` (a test double)
  - `src/lib/actions/calendar-sync.ts` (+ test), `src/lib/data/calendar-sync.ts`
  - `after()` hooks in `src/lib/actions/{calendar,buyer,clients,seller}.ts`
    (`seller.ts`: `saveProperty` and `deleteProperty`)
  - `src/lib/actions/notifications.ts`: **only** replace the property-label
    expression at `:204-208` with `appointmentPlaceFor`
  - `src/lib/validation/calendar.ts` and a new
    `src/lib/validation/calendar.test.ts`
  - `messages/{en,es}/validation.json` (`chooseClientOrTitle`)
  - `src/app/(app)/settings/calendar/google/start/route.ts`,
    `.../callback/route.ts` (+ `route.test.ts` for each)
  - `src/app/api/cron/calendar-sync/route.ts` (+ `route.test.ts`)
  - `vercel.json`
  - `src/components/settings/calendar-panel.tsx`,
    `src/components/settings/settings-view.tsx`,
    `src/app/(app)/settings/page.tsx`
  - `src/components/calendar/calendar-sync-dialog.tsx`,
    `src/components/calendar/calendar-sync-status.tsx`,
    `src/components/calendar/calendar-view.tsx`, `src/app/(app)/calendar/page.tsx`
  - `src/lib/data/calendar.ts` (viewing `ends_at`)
  - `messages/{en,es}/settings.json`, `messages/{en,es}/calendar.json`
- **Phase 3**: `messages/{en,es}/landing.json` (Step 3.0 FAQ sentence),
  `src/lib/seo.ts` if a content page changes.
- **Phase 4**:
  - `supabase/migrations/<ts>_calendar_pull.sql` and `types.ts`
  - `src/lib/calendar-sync/pull.ts` (+ test), `src/lib/calendar-sync/fixtures/*.json`
  - `src/app/(app)/home/page.tsx`, `src/app/(app)/calendar/page.tsx`
  - `src/components/calendar/calendar-removed-dialog.tsx` (new)
  - the Phase 2 UI and sync files, for the pull, the removed notice, the
    `description` copy and the calendar-description refresh
- **Phase 5**: the same copy files as Phase 0, plus
  `src/content/pages/crm-spain.{en,es}.tsx`, `messages/{en,es}/billing.json`
  and the plan 010 feature page if it exists.
- **Phases 6–8**: listed inside each phase.

**Out of scope**:
- the primary calendar, free/busy or clash detection (option D; needs a new
  scope and a new review)
- recurring or all-day events coming from Google
- guests and invitations
- Google Meet links
- new bell notification types (this plan uses banners; its only
  `notifications.ts` edit is the shared place label)
- feed-token rotation
- changing how agents sign in, or the login Cloud project
- `pg_cron` / `pg_net` (unless D22's fallback is chosen)
- account self-deletion (no feature exists; see Maintenance notes)
- `plans/validation-interview-script.md` (D21's questions go in by a
  separate change)

## Git workflow

- Commit on `main`, the founder's workflow. Ignore plan 004's `advisor/…`
  branch line when you run it as Phase 0.
- **Don't push unless the operator asks.** Phase 0 has to be live before
  21 Sep 2026, so ask for the push as soon as its checks pass.
- One commit per phase or step group. Styles:
  - `fix(calendar): …` (Phase 0 feed fixes)
  - `docs(marketing): …` (copy; only if this plan's interim rows ship
    before plan 016 Step 0.1, see Step 0.3)
  - `docs(legal): …`
  - `feat(calendar-sync): …`
  - `chore(vercel): add calendar sync cron`
- End commit messages with the attribution line the session gives you.
- Never stage `.vercel/`, `.env*` files or scratchpad files.
- **Migrations**: rehearse in a rolled-back transaction, then apply them to
  the live DB yourself with their history row (the founder expects this).
  Never hand the step back. Pick a timestamp that sorts after every file in
  `supabase/migrations/` **and** after the reserved slots `20260916150000`
  (012), `20260917120000` (016) and `20260922120000` (015). Run
  `grep -rhn "2026091[6-9]\|202609[23][0-9]\|202610" plans/ | grep -i migration`
  first and take a slot no plan mentions.

## Steps

### Phase 0: Honest copy and feed fixes (before 21 Sep 2026)

**Gate**: the founder approves the wording in "Until this ships". Nothing
else.

#### Step 0.1: Run plan 004

Execute `plans/004-ics-feed-rfc-compliance.md` Steps 1–4 on `main`:
- UTF-8-safe line folding and a trailing CRLF in `buildICS`
- `src/lib/ics.test.ts`
- `"Cache-Control": "private, no-store"`
- decoded-digest compare in `verifyFeedToken`

**Plan 004's drift check will report `dae512b` and `1b94d32`** on its files
(base `4286cc9`). That is expected and not a STOP: reconcile only its
`ics.ts` and headers excerpts. The headers excerpt shows `lena.ics`; only the
`Cache-Control` line changes.

**Verify**:
- `npm test` passes, and plan 004's done criteria are met.
- `grep -n '"Cache-Control": "private, no-store"' "src/app/api/calendar/[token]/route.ts"`
  prints 1 match.

#### Step 0.2: Feed titles through `appointmentTitleFor`, and no foreign embeds

In `src/app/api/calendar/[token]/route.ts`:

1. Select, for appointments,
   `id, type, title, starts_at, ends_at, location, notes, property_label, client:clients(agent_id, first_name, last_name), property:properties(agent_id, address, city, property_type)`.
   For viewings, add `agent_id` to the client embed.
2. **Drop any embed whose `agent_id` isn't `agentId`**: treat it as `null`
   (Current state 7).
3. Load a `crm` translator for the profile's locale next to the
   `server.appointments` one (`getTranslations({ locale, namespace: "crm" })`).
4. Replace `:83` with `appointmentTitleFor(t, a, { clientName, property })`,
   where `property` is built exactly as `src/lib/data/calendar.ts:126-131`
   builds it: `property_label ?? property.address ?? propertyTypeLabel(tCrm, property.property_type)`.
5. Move that property-label expression into one exported helper,
   `appointmentPlaceFor(tCrm, appt)` in `src/i18n/appointments.ts`, and use it
   in the feed and in `data/calendar.ts`. Phase 2 moves
   `notifications.ts:204-208` onto it too, and its event mapping uses it.

**Verify**: a new `src/app/api/calendar/[token]/route.test.ts`
(`// @vitest-environment node`):
- Mock `@/lib/supabase/admin` with canned rows.
- Mock `next-intl/server` so `getTranslations({ locale, namespace })`
  returns a real translator: `createTranslator({ locale: "en", messages: { server: enServer, crm: enCrm }, namespace })`,
  with `messages/en/server.json` and `messages/en/crm.json` imported as JSON
  (the `src/lib/subscription.test.ts` pattern).

It checks that:
- a `type: "viewing"` appointment with a client and a property label comes out
  as `SUMMARY:Viewing · Anna Schmidt @ Calle Uno 1`
- a meeting without a title comes out as `SUMMARY:Meeting with Anna Schmidt`
- an appointment whose embedded client has another `agent_id` comes out
  without that name (`SUMMARY:Meeting`)
- a bad token gets 404

#### Step 0.3: Reword the claims

**Applied by plan 016 Step 0.1** (batch decision D-G): that step applies all
five plans' "Until this ships" tables (013, 014, 015, 016, 017) in one
commit, including this plan's `messages/es/settings.json:42`
(`preferences.languageHint`) row and the `calendar.sync.*` rows of Step 0.4.
If it has landed, check that every row below is live and move on. **Only if
this plan ships before 016 Step 0.1**, apply your own rows alone in a
`docs(marketing): …` commit, as follows.

Apply every EN and ES string in "Until this ships" to the keys and files it
names:
- **Change values only; never rename keys.** English types every key, and
  `how-it-works.tsx:215` reads `howItWorks.tiles.calendar.synced`.
- That table is **the merged pre-outreach text** for the strings plans 013
  and 016 share (`faq.items.calendar.a`, `llms.txt:52`). If plan 016's
  Phase 0 already landed, its reminder clause is already in the merged text;
  write the merged value as given.
- Bump `PUBLISHED.crmMarbella` and `PUBLISHED.about` in `src/lib/seo.ts:73-79`
  to the ship day. If 014, 015 or 016 bump the same keys the same day, one
  bump is enough.
- **Coordinate with plan 012 Step 15** if it has landed or is in flight: it
  adds FAQ items to the same files. Keep one commit for all overclaim
  rewrites if other pre-outreach copy fixes (portals, agencies, nudges) are
  batched the same day.

**Verify**:
- These greps print nothing:
  - `grep -rn -i "sincroniz\|synced\|syncs to\|sync to\|sync link\|calendar sync\|Sync the calendar" messages/en/landing.json messages/es/landing.json messages/en/calendar.json messages/es/calendar.json messages/es/settings.json src/content/pages/crm-marbella.en.tsx src/content/pages/crm-marbella.es.tsx src/content/pages/about.en.tsx src/content/pages/about.es.tsx src/app/llms.txt/route.ts`
    (`messages/*/server.json:32`, "sync context", is unrelated and isn't
    searched).
  - `grep -n -i "one way for now\|sentido por ahora" messages/en/landing.json messages/es/landing.json`
    (`crm-marbella.en.tsx:137` has an unrelated "for now").
- `node -e 'for (const l of ["en","es"]) for (const n of ["landing","calendar","settings"]) JSON.parse(require("fs").readFileSync(`messages/${l}/${n}.json`))'`
  exits 0.
- With `npm run dev`:
  - `/`, `/es`, `/crm-for-marbella-agents`, `/es/crm-inmobiliario-marbella`,
    `/about` and `/es/sobre-nosotros` show the new copy.
  - `curl -s http://localhost:3000/ | grep -o '"name":"Does it work with Google Calendar?"'`
    prints one match: the FAQPage JSON-LD follows the key.
  - `curl -s http://localhost:3000/llms.txt | grep -n "read-only calendar link"`
    prints one line.
- The "How it works" calendar tile shows the new chip without wrapping at
  375 px in both languages. If "Enlace de calendario" wraps, use the
  fallback "Enlace iCal" / "iCal link".

#### Step 0.4: Dialog copy

`CalendarSyncDialog` keeps its behaviour; only the `calendar.sync.*` values
change (see "Until this ships"). Those values are applied with the rest of
the table by plan 016 Step 0.1, or by Step 0.3 here if this plan ships first
(D-G).

**Verify**: render the dialog on a preview-tmp page in both languages. The
button reads "Calendar link" / "Enlace de calendario". Delete your preview
folder afterwards.

#### Step 0.5: Gates and hand-off

- `npm run typecheck && npm run lint && npm test && npm run build` all pass.
- Ask the operator to push.
- After deploy:
  - `curl -s https://www.leadwing.app/llms.txt | grep -c "Google Calendar sync"`
    prints `0`.
  - `curl -s https://www.leadwing.app/es | grep -c "sincroniza con tu Google"`
    prints `0`.
- Update `plans/README.md` row 013 to "Phase 0 DONE".

### Phase 1: Google Cloud and legal groundwork

**Gate**:
- The founder has confirmed the Decisions table.
- The legal-entity details exist (P1).
- Steps 1.1.0, 1.1, 1.3 and 1.4 may run before the interview gate (D21).
  **Step 1.2 waits for D21.**

Most of this phase is founder work in consoles (see "Prerequisites outside
the code"). Claude can walk the founder through the screens but can't sign
in to Google.

#### Step 1.1.0: Record the login project first (founder)

Before touching any console:
1. Find the Cloud project and account behind the Supabase Google login
   client. Supabase dashboard → Authentication → Providers → Google shows
   the client id; search it in Cloud Console → Google Auth Platform →
   Clients.
2. Screenshot that project's **Audience** (publishing status, user type),
   **Branding** (status, authorized domains) and **Clients** pages. Keep the
   screenshots with the founder's records.
3. **Change nothing in that project.** D12 puts Calendar in a new project.

**Verify**: the founder reports the login project's publishing status and
brand status (e.g. "In production, branding not verified").

#### Step 1.1: Console work in a new project (founder)

1. Create the Cloud project **"LeadWing Calendar"**, owned by the Google
   account that verified the `leadwing.app` Search Console property (7 Sep
   2026), or add that account as Owner.
2. Enable the **Google Calendar API**.
3. **Branding**:
   - app name LeadWing, the support email
   - homepage `https://www.leadwing.app`
   - privacy `https://www.leadwing.app/privacy`
   - terms `https://www.leadwing.app/terms`
   - authorized domain `leadwing.app` (and nothing else)
4. **Clients → Create client → Web application** "LeadWing Calendar", with
   one redirect URI:
   - `https://www.leadwing.app/settings/calendar/google/callback`

   Don't register localhost or preview URLs. Local development runs without
   the Google variables (one Supabase project, so a local connect would write
   into the live DB anyway), and previews sit behind Vercel Authentication.
5. **Data Access → Add scope** `…/auth/calendar.app.created`. **Screenshot the
   sensitivity badge** and paste what it says into this plan's Decisions row
   D1.
6. Run **brand verification** (Branding → Verify branding). It needs the
   legal pages without a draft banner (Step 1.3), so do Step 1.3 first if
   the check asks for them. If the console offers the check only after
   publishing, do item 7 first; until the brand is verified, the consent
   screen may not show the LeadWing name (not verified).
7. **Audience** (D13): once branding is verified, **Publish app** (In
   production, unverified). If the founder chose D13's alternative, keep
   **Testing** and add the founder's and Lena's Google accounts as test users.
8. **Smoke test the live login right away**: sign out of LeadWing, then
   sign in with Google using an account that isn't a test user. It must work
   as before.

**Verify** (the founder reports back):
- the client id (not the secret)
- the badge text
- the brand verification result (automatic, manual review, or the domains it
  names)
- the publishing status chosen
- that Google sign-in still works (item 8)

#### Step 1.2: Env vars (after D21 passes)

Run `vercel link --yes --project lena-crm --scope lepadatumihails-projects`
once (it writes the gitignored `.vercel/`). Then run
`vercel env ls production --scope lepadatumihails-projects` and note which of
these already exist. **`CRON_SECRET` may already exist from whichever of
plans 014, 016 and 017 landed first (expected: 016 Phase 2, D22); never add
it twice or overwrite it.**

Add these to Vercel **Production** (team scope `lepadatumihails-projects`,
project `lena-crm`):

| Name | Value | Who |
|---|---|---|
| `GOOGLE_CALENDAR_CLIENT_ID` | from Step 1.1 | founder |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | from Step 1.1 | founder (pastes it into the Vercel dashboard; never into chat) |
| `INTEGRATION_TOKEN_KEY` | 32 random bytes, base64 (D9) | Claude, only after the founder says yes; skip if plan 007 or 017 already created it. Custody (batch decision E1): (1) `(umask 077; openssl rand -base64 32 \| tr -d '\n' > <scratchpad>/integration-token-key)`, a 0600 file (`tr` drops the trailing newline); (2) `vercel env add INTEGRATION_TOKEN_KEY production --sensitive --scope lepadatumihails-projects < <scratchpad>/integration-token-key`; (3) tell the founder the file path so the founder copies the value into their password manager, because a Sensitive value can't be pulled back (D-I); (4) once the founder confirms, `rm -P <scratchpad>/integration-token-key`. The value is never printed in chat, logs or commits (no `cat`, no `echo`). The installed Vercel CLI 32.2.4 has no `--sensitive` flag (checked 17 Sep 2026; current docs have it), so run a current CLI (for example `npx vercel@latest`) and confirm `vercel env add --help` lists `--sensitive` first |
| `INTEGRATION_TOKEN_KEY_VERSION` | `k1` | Claude |
| `CRON_SECRET` | only if missing (this plan landed first of 013, 014, 016, 017): `openssl rand -hex 32` piped into `vercel env add` (D22) | Claude, with the same four file steps as the row above (generating with `openssl rand -hex 32`), after the founder's OK; the custody rule D-I applies: a current CLI adds Production variables as Sensitive by default, so the founder saves the value to the password manager before the file is deleted |
| `GOOGLE_CALENDAR_ACCESS` | `pilot` | Claude |
| `GOOGLE_CALENDAR_PILOT_EMAILS` | the founder's and Lena's LeadWing sign-in emails, comma-separated | founder |

- Add the names, with no values and a comment, to `.env.example`.
- **Don't put `INTEGRATION_TOKEN_KEY` in `.env.local`**: other sessions read
  that file. Local development leaves the Google variables unset, so the
  panel shows "not configured".
- Env changes apply to new deployments only.

**Verify**: `vercel env ls production --scope lepadatumihails-projects` lists
all seven names.

#### Step 1.3: Legal text

This is not legal advice; the founder (and ideally a lawyer) owns the
wording. D20 sets the framing.

1. **`LEGAL_ENTITY`**: fill every bracketed value in `src/lib/legal.ts:10-23`
   with the founder's details. `hostingRegion` is "EU (Frankfurt,
   eu-central-1)". `legalEntityPending()` must now return false.
2. **Privacy §6, Google row** (`privacy.en.tsx:240-244`,
   `privacy.es.tsx:249-254`):
   - EN: "Sign in with Google; Google Calendar, if you subscribe to your
     calendar link, or if you connect your Google account (a service you
     connect; see section 4)"
   - ES: "Inicio de sesión con Google; Google Calendar, si te suscribes a tu
     enlace de calendario o si conectas tu cuenta de Google (un servicio que
     tú conectas; ver sección 4)"
3. **Privacy §4, a new `<h3>`**. Use a sub-heading so the section numbers that
   plan 011 cites don't move.
   - EN heading "Google Calendar (only if you connect it)", body:
     - "If you connect Google Calendar, LeadWing creates a separate
       “LeadWing” calendar in your own Google account and keeps it up to
       date with your viewings and meetings: their time, title (which can
       include the client's name and the property, unless you hide names),
       location and reminder. Your notes are copied only if you turn that on,
       and then exactly as you wrote them. LeadWing never copies a client's
       phone number, email address or offer amounts from their record."
     - "LeadWing can only see and change that one calendar. We read the
       changes you make to it (times, titles, locations, notes and deleted
       events) to update LeadWing, and we never access your other
       calendars."
     - "We store encrypted access and refresh tokens, the calendar's
       identifier, which LeadWing record matches which event, and a short
       history of changes that came from Google. We delete them when you
       disconnect or close your account; when you disconnect we also delete
       the LeadWing calendar unless you choose to keep it. What is in your
       Google account is governed by your agreement with Google, and you can
       delete it there."
     - "LeadWing's use and transfer to any other app of information received
       from Google APIs will adhere to the Google API Services User Data
       Policy, including the Limited Use requirements. The use of
       information received from Google Workspace scopes will adhere to the
       Google User Data Policy, including the Limited Use requirements. We
       don't sell Google user data, use it for advertising, or use it to
       develop, improve or train AI or machine-learning models, and we never
       send it to our AI providers."
   - ES heading "Google Calendar (solo si lo conectas)", body: a faithful
     translation in the same four paragraphs. Keep both policy names in
     English plus "(Política de datos de usuario de los servicios de API de
     Google)" / "(Política de datos de usuario de Google)".
4. **Privacy §7 (International transfers)** (`privacy.en.tsx:263-270`,
   `privacy.es.tsx:273` on), add: "If you connect Google Calendar, the
   calendar data you choose to send goes to your own Google account, outside
   our EU storage, under your agreement with Google." ES: "Si conectas
   Google Calendar, los datos de calendario que decides enviar van a tu
   propia cuenta de Google, fuera de nuestro almacenamiento en la UE, según
   tu acuerdo con Google."
5. **Privacy §10 (retention)**: add "Google Calendar connection data: until
   you disconnect or close your account." with the ES twin.
6. **Terms §10** (`terms.en.tsx:140`): add after the first sentence: "If you
   connect Google Calendar, you instruct LeadWing to create and update a
   “LeadWing” calendar in your own Google account; you can disconnect at any
   time in Settings." The ES twin goes after `terms.es.tsx:144`.
7. **Terms annex A** (`terms.en.tsx:223-226`, "Nature and purpose"; ES
   `terms.es.tsx:229-232`, "Naturaleza y finalidad"): append "and, when you connect it, copying
   viewings and meetings to a calendar in your own Google account". ES: "y,
   si lo conectas, copiar visitas y reuniones a un calendario de tu propia
   cuenta de Google".
8. **Terms annex E** (`terms.en.tsx:279-284`; ES `:292-297`): append "Data
   you choose to send to your own Google account (for example through the
   Google Calendar connection) leaves our EU storage and is governed by your
   agreement with Google." ES: "Los datos que decides enviar a tu propia
   cuenta de Google (por ejemplo, con la conexión a Google Calendar) salen de
   nuestro almacenamiento en la UE y se rigen por tu acuerdo con Google."
9. **`LEGAL_UPDATED`**: set `privacy` and `terms` to the day this ships. If
   plan 011, 014 or 017 changed them too, take the later date.

**Verify**:
- `/privacy`, `/es/privacidad`, `/terms` and `/es/terminos` render the new
  text with no draft banner.
- `grep -c "Google Workspace scopes" src/content/legal/privacy.en.tsx`
  prints `1`.
- The sitemap `lastmod` for those pages moved.
- The founder confirms the legal text.

#### Step 1.4: Courtesy email to existing agents (founder, when Step 1.3 is live)

Send a short email to the existing accounts. It announces the optional
Google Calendar connection (in pilot) and links the updated privacy policy
and terms. Per D20, annex D isn't triggered. Sending now means any 30-day
period under Terms §16 runs during the pilot and Google's review, not after
them.

### Phase 2: Connect and one-way push (option B, the base of C)

**Gate**:
- **D21 passed** at the Fri 9 Oct 2026 checkpoint (or the founder waives it
  in writing).
- Phase 1 is done (Step 1.1 verified, Step 1.2 names listed, Step 1.3 live).
- The founder has confirmed the Decisions table.
- Plan 004 has landed.

#### Step 2.1: The migration: `supabase/migrations/<ts>_calendar_sync.sql`

**File name.**
- Use a timestamp that sorts **after** every file in `supabase/migrations/`
  **and** after the reserved slots `20260916150000` (012), `20260917120000`
  (016) and `20260922120000` (015), even if those plans haven't landed. See
  "Git workflow" for the grep.
- Before writing, check that the live DB has no such table:
  `select to_regclass('public.calendar_connections')` must return null.

```sql
-- ============================================================
-- Google Calendar sync (plan 013)
--
-- calendar_connections: one row per agent who connected Google Calendar.
--   The agent can read their row and change three toggles plus the removed
--   notice counter; everything else is written by the server (service role).
-- calendar_tokens: encrypted OAuth tokens and Google's sync token.
--   Service role only: RLS on, no policies, privileges revoked.
-- calendar_event_links: which Google event mirrors which LeadWing record.
-- calendar_sync_outbox: what still has to reach Google. Filled by triggers,
--   so cascades (a deleted client), SET NULLs and renames are never missed.
--   One row per record; a newer change replaces the older one (version + 1).
--   changed_at is stamped only by the triggers (a real LeadWing edit), never
--   by backfills or reconciles; Phase 4's conflict rule reads it.
--   Rows keep accumulating while a connection is revoked, so nothing made
--   during a lapse is lost; the drain only runs for active connections.
--
-- Writes coming from Google (plan 013 Phase 4) set
-- leadwing.sync_origin = 'google' for their transaction, so these triggers
-- don't send the change straight back. An agent can't reach set_config
-- through PostgREST, and at worst would only pause their own sync.
--
-- Every UPDATE/DELETE below has a WHERE clause: PostgREST sessions preload
-- pg-safeupdate. Every service-role RPC must finish inside the
-- authenticator's 8 s statement_timeout.
-- ============================================================

create type public.calendar_provider as enum ('google');
create type public.calendar_connection_status as enum
  ('active', 'revoked', 'calendar_missing', 'disconnecting');

create table public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null unique references auth.users (id) on delete cascade,
  provider public.calendar_provider not null default 'google',
  status public.calendar_connection_status not null default 'active',
  account_email text,
  calendar_id text,
  calendar_meta_version integer not null default 1,
  granted_scopes text[] not null default '{}',
  include_tasks boolean not null default false,
  hide_client_names boolean not null default false,
  copy_notes boolean not null default false,
  skipped_count integer not null default 0,
  removed_count integer not null default 0,
  last_push_at timestamptz,
  last_pull_at timestamptz,
  last_error text,
  last_error_at timestamptz,
  lease_until timestamptz,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_connections_counts check (skipped_count >= 0 and removed_count >= 0),
  constraint calendar_connections_error_len check (char_length(last_error) <= 500)
);
create trigger calendar_connections_set_updated_at
  before update on public.calendar_connections
  for each row execute function public.set_updated_at();

alter table public.calendar_connections enable row level security;
create policy "agent reads own calendar connection" on public.calendar_connections
  for select to authenticated using (agent_id = (select auth.uid()));
create policy "agent updates own calendar options" on public.calendar_connections
  for update to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));
-- The default ACL grants anon/authenticated every privilege on new tables
-- (TRUNCATE ignores RLS), so start from nothing.
revoke all on public.calendar_connections from anon, authenticated;
grant select on public.calendar_connections to authenticated;
grant update (include_tasks, hide_client_names, copy_notes, removed_count)
  on public.calendar_connections to authenticated;

create table public.calendar_tokens (
  connection_id uuid primary key references public.calendar_connections (id) on delete cascade,
  agent_id uuid not null references auth.users (id) on delete cascade,
  refresh_token text not null,   -- "<keyVersion>.<iv>.<ciphertext>.<tag>", AES-256-GCM
  access_token text,             -- same format
  access_expires_at timestamptz,
  sync_token text,               -- Google nextSyncToken for the LeadWing calendar
  updated_at timestamptz not null default now()
);
create trigger calendar_tokens_set_updated_at
  before update on public.calendar_tokens
  for each row execute function public.set_updated_at();
alter table public.calendar_tokens enable row level security;
revoke all on public.calendar_tokens from anon, authenticated;

create table public.calendar_event_links (
  connection_id uuid not null references public.calendar_connections (id) on delete cascade,
  agent_id uuid not null references auth.users (id) on delete cascade,
  source_kind text not null,
  source_id uuid not null,
  google_event_id text not null,
  etag text,
  payload_hash text,
  google_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (connection_id, source_kind, source_id),
  unique (connection_id, google_event_id),
  constraint calendar_event_links_kind check (source_kind ~ '^[a-z][a-z_]{0,31}$')
);
create index calendar_event_links_source_idx
  on public.calendar_event_links (agent_id, source_kind, source_id);
create trigger calendar_event_links_set_updated_at
  before update on public.calendar_event_links
  for each row execute function public.set_updated_at();
alter table public.calendar_event_links enable row level security;
revoke all on public.calendar_event_links from anon, authenticated;

create table public.calendar_sync_outbox (
  agent_id uuid not null references auth.users (id) on delete cascade,
  source_kind text not null,
  source_id uuid not null,
  op text not null,
  version bigint not null default 1,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  enqueued_at timestamptz not null default now(),
  changed_at timestamptz,        -- set only by the triggers (a real LeadWing edit)
  primary key (agent_id, source_kind, source_id),
  constraint calendar_sync_outbox_op check (op in ('upsert', 'delete')),
  constraint calendar_sync_outbox_kind check (source_kind ~ '^[a-z][a-z_]{0,31}$')
);
create index calendar_sync_outbox_due_idx on public.calendar_sync_outbox (next_attempt_at);
alter table public.calendar_sync_outbox enable row level security;
revoke all on public.calendar_sync_outbox from anon, authenticated;

-- A buyer viewing can now end at a time other than start + 1 hour.
alter table public.viewings add column if not exists ends_at timestamptz;
alter table public.viewings add constraint viewings_ends_after_start
  check (ends_at is null or (scheduled_at is not null and ends_at > scheduled_at));

-- When the start moves in LeadWing, keep the duration; when it's cleared,
-- clear the end. Writes from Google set both themselves.
create or replace function public.viewings_keep_duration()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.scheduled_at is null then
    new.ends_at := null;
  elsif coalesce(current_setting('leadwing.sync_origin', true), '') <> 'google'
    and new.scheduled_at is distinct from old.scheduled_at
    and new.ends_at is not distinct from old.ends_at
    and old.ends_at is not null and old.scheduled_at is not null then
    new.ends_at := new.scheduled_at + (old.ends_at - old.scheduled_at);
  end if;
  return new;
end $$;
create trigger viewings_keep_duration
  before update on public.viewings
  for each row execute function public.viewings_keep_duration();

-- Tenant hardening (Current state 7): an appointment or viewing may only
-- point at the agent's own client or property. FK actions (SET NULL,
-- CASCADE) are not subject to RLS, so they keep working.
alter policy "agent owns appointments" on public.appointments
  with check (
    agent_id = (select auth.uid())
    and (appointments.client_id is null or exists (
      select 1 from public.clients c
      where c.id = appointments.client_id and c.agent_id = (select auth.uid())))
    and (appointments.property_id is null or exists (
      select 1 from public.properties p
      where p.id = appointments.property_id and p.agent_id = (select auth.uid())))
  );
alter policy "agent owns viewings" on public.viewings
  with check (
    agent_id = (select auth.uid())
    and exists (
      select 1 from public.clients c
      where c.id = viewings.client_id and c.agent_id = (select auth.uid()))
  );

-- ---------- the outbox writer ----------
-- p_changed = true only from the triggers (a real LeadWing edit).
create or replace function public.calendar_enqueue(
  p_agent uuid, p_kind text, p_id uuid, p_op text, p_changed boolean default true
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(current_setting('leadwing.sync_origin', true), '') = 'google' then
    return;
  end if;
  if not exists (
    select 1 from public.calendar_connections c
    where c.agent_id = p_agent and c.status <> 'disconnecting'
  ) then
    return;
  end if;
  insert into public.calendar_sync_outbox as o
    (agent_id, source_kind, source_id, op, changed_at)
  values (p_agent, p_kind, p_id, p_op, case when p_changed then now() end)
  on conflict (agent_id, source_kind, source_id) do update
    set op = excluded.op,
        version = o.version + 1,
        attempts = 0,
        next_attempt_at = now(),
        last_error = null,
        enqueued_at = now(),
        changed_at = case when p_changed then now() else o.changed_at end;
end $$;
revoke execute on function public.calendar_enqueue(uuid, text, uuid, text, boolean)
  from public, anon, authenticated;
grant execute on function public.calendar_enqueue(uuid, text, uuid, text, boolean)
  to service_role;

-- ---------- triggers (security definer: they call calendar_enqueue) ----------
create or replace function public.appointments_calendar_sync()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    perform public.calendar_enqueue(old.agent_id, 'appointment', old.id, 'delete');
    return old;
  end if;
  if tg_op = 'UPDATE' and
     (new.type, new.title, new.client_id, new.property_id, new.property_label,
      new.starts_at, new.ends_at, new.location, new.notes, new.reminder_minutes)
     is not distinct from
     (old.type, old.title, old.client_id, old.property_id, old.property_label,
      old.starts_at, old.ends_at, old.location, old.notes, old.reminder_minutes) then
    return new;
  end if;
  perform public.calendar_enqueue(new.agent_id, 'appointment', new.id, 'upsert');
  return new;
end $$;
create trigger appointments_calendar_sync
  after insert or update or delete on public.appointments
  for each row execute function public.appointments_calendar_sync();

create or replace function public.viewings_calendar_sync()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.scheduled_at is not null then
      perform public.calendar_enqueue(old.agent_id, 'viewing', old.id, 'delete');
    end if;
    return old;
  end if;
  if new.scheduled_at is null then
    if tg_op = 'UPDATE' and old.scheduled_at is not null then
      perform public.calendar_enqueue(new.agent_id, 'viewing', new.id, 'delete');
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' and
     (new.title, new.description, new.scheduled_at, new.ends_at, new.reminder_minutes, new.client_id)
     is not distinct from
     (old.title, old.description, old.scheduled_at, old.ends_at, old.reminder_minutes, old.client_id) then
    return new;
  end if;
  perform public.calendar_enqueue(new.agent_id, 'viewing', new.id, 'upsert');
  return new;
end $$;
create trigger viewings_calendar_sync
  after insert or update or delete on public.viewings
  for each row execute function public.viewings_calendar_sync();

-- A renamed client renames their events: every record in the window, plus
-- every record already in Google (linked), whatever its age.
create or replace function public.clients_calendar_sync()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.first_name, new.last_name) is not distinct from (old.first_name, old.last_name)
     or not exists (select 1 from public.calendar_connections c
                    where c.agent_id = new.agent_id and c.status <> 'disconnecting') then
    return new;
  end if;
  perform public.calendar_enqueue(a.agent_id, 'appointment', a.id, 'upsert')
    from public.appointments a
    where a.client_id = new.id and a.agent_id = new.agent_id
      and (a.starts_at >= now() - interval '60 days'
           or exists (select 1 from public.calendar_event_links l
                      where l.agent_id = new.agent_id and l.source_kind = 'appointment'
                        and l.source_id = a.id));
  perform public.calendar_enqueue(v.agent_id, 'viewing', v.id, 'upsert')
    from public.viewings v
    where v.client_id = new.id and v.agent_id = new.agent_id
      and v.scheduled_at is not null
      and (v.scheduled_at >= now() - interval '60 days'
           or exists (select 1 from public.calendar_event_links l
                      where l.agent_id = new.agent_id and l.source_kind = 'viewing'
                        and l.source_id = v.id));
  return new;
end $$;
create trigger clients_calendar_sync
  after update of first_name, last_name on public.clients
  for each row execute function public.clients_calendar_sync();

-- A property's address, city or type feeds viewing-appointment titles and
-- locations. The agent filter lets Postgres use appointments_agent_starts_idx
-- (appointments.property_id has no index).
create or replace function public.properties_calendar_sync()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.address, new.city, new.property_type) is not distinct from
     (old.address, old.city, old.property_type)
     or not exists (select 1 from public.calendar_connections c
                    where c.agent_id = new.agent_id and c.status <> 'disconnecting') then
    return new;
  end if;
  perform public.calendar_enqueue(a.agent_id, 'appointment', a.id, 'upsert')
    from public.appointments a
    where a.agent_id = new.agent_id and a.property_id = new.id
      and (a.starts_at >= now() - interval '60 days'
           or exists (select 1 from public.calendar_event_links l
                      where l.agent_id = new.agent_id and l.source_kind = 'appointment'
                        and l.source_id = a.id));
  return new;
end $$;
create trigger properties_calendar_sync
  after update of address, city, property_type on public.properties
  for each row execute function public.properties_calendar_sync();

-- ---------- server-side helpers (service role only) ----------
create or replace function public.calendar_claim_lease(p_agent uuid, p_seconds integer)
returns boolean language sql security invoker set search_path = '' as $$
  with claimed as (
    update public.calendar_connections
    set lease_until = now() + make_interval(secs => p_seconds)
    where agent_id = p_agent and status = 'active'
      and (lease_until is null or lease_until < now())
    returning 1
  )
  select exists (select 1 from claimed);
$$;

-- Extends a lease the caller holds; false once the connection stopped being
-- active (e.g. the agent is disconnecting), so the drain stops.
create or replace function public.calendar_renew_lease(p_agent uuid, p_seconds integer)
returns boolean language sql security invoker set search_path = '' as $$
  with renewed as (
    update public.calendar_connections
    set lease_until = now() + make_interval(secs => p_seconds)
    where agent_id = p_agent and status = 'active' and lease_until is not null
    returning 1
  )
  select exists (select 1 from renewed);
$$;

create or replace function public.calendar_release_lease(p_agent uuid)
returns void language sql security invoker set search_path = '' as $$
  update public.calendar_connections set lease_until = null where agent_id = p_agent;
$$;

-- Delete an outbox row only if nothing newer was enqueued meanwhile.
create or replace function public.calendar_ack(
  p_agent uuid, p_kind text, p_id uuid, p_version bigint
) returns void language sql security invoker set search_path = '' as $$
  delete from public.calendar_sync_outbox
  where agent_id = p_agent and source_kind = p_kind and source_id = p_id
    and version = p_version;
$$;

-- Record a failed attempt, only if nothing newer was enqueued meanwhile.
-- Returns the new attempt count, or null when the version moved on.
create or replace function public.calendar_fail(
  p_agent uuid, p_kind text, p_id uuid, p_version bigint,
  p_error text, p_delay_seconds integer
) returns integer language sql security invoker set search_path = '' as $$
  update public.calendar_sync_outbox
  set attempts = attempts + 1,
      next_attempt_at = now() + make_interval(secs => p_delay_seconds),
      last_error = left(p_error, 64)
  where agent_id = p_agent and source_kind = p_kind and source_id = p_id
    and version = p_version
  returning attempts;
$$;

-- Active, unleased agents with work due. Phase 4 passes p_stale_pull_seconds.
create or replace function public.calendar_due_agents(
  p_limit integer, p_stale_pull_seconds integer default null
) returns setof uuid language sql security invoker set search_path = '' as $$
  select c.agent_id
  from public.calendar_connections c
  where c.status = 'active'
    and (c.lease_until is null or c.lease_until < now())
    and (
      exists (select 1 from public.calendar_sync_outbox o
              where o.agent_id = c.agent_id and o.next_attempt_at <= now())
      or (p_stale_pull_seconds is not null
          and (c.last_pull_at is null
               or c.last_pull_at < now() - make_interval(secs => p_stale_pull_seconds)))
    )
  order by coalesce(least(c.last_push_at, c.last_pull_at), 'epoch'::timestamptz)
  limit p_limit;
$$;

-- Queue everything in the sync window and reconcile the links (on connect,
-- reconnect, recreate and option changes). Never stamps changed_at.
create or replace function public.calendar_enqueue_backfill(p_agent uuid)
returns integer language plpgsql security invoker set search_path = '' as $$
declare
  n integer := 0;
  c integer;
begin
  insert into public.calendar_sync_outbox as o (agent_id, source_kind, source_id, op)
  select p_agent, 'appointment', a.id, 'upsert' from public.appointments a
  where a.agent_id = p_agent and a.starts_at >= now() - interval '60 days'
  on conflict (agent_id, source_kind, source_id) do update
    set op = 'upsert', version = o.version + 1, attempts = 0,
        next_attempt_at = now(), last_error = null, enqueued_at = now();
  get diagnostics c = row_count; n := n + c;

  insert into public.calendar_sync_outbox as o (agent_id, source_kind, source_id, op)
  select p_agent, 'viewing', v.id, 'upsert' from public.viewings v
  where v.agent_id = p_agent and v.scheduled_at >= now() - interval '60 days'
  on conflict (agent_id, source_kind, source_id) do update
    set op = 'upsert', version = o.version + 1, attempts = 0,
        next_attempt_at = now(), last_error = null, enqueued_at = now();
  get diagnostics c = row_count; n := n + c;

  -- Linked events whose record is gone, or a viewing that lost its date:
  -- the Google event must go, whatever its age.
  insert into public.calendar_sync_outbox as o (agent_id, source_kind, source_id, op)
  select p_agent, l.source_kind, l.source_id, 'delete'
  from public.calendar_event_links l
  where l.agent_id = p_agent
    and (
      (l.source_kind = 'appointment' and not exists (
        select 1 from public.appointments a
        where a.id = l.source_id and a.agent_id = p_agent))
      or (l.source_kind = 'viewing' and not exists (
        select 1 from public.viewings v
        where v.id = l.source_id and v.agent_id = p_agent and v.scheduled_at is not null))
    )
  on conflict (agent_id, source_kind, source_id) do update
    set op = 'delete', version = o.version + 1, attempts = 0,
        next_attempt_at = now(), last_error = null, enqueued_at = now();
  get diagnostics c = row_count; n := n + c;
  return n;
end $$;

-- Save a (re)connection atomically: the connection row and its tokens.
-- A new calendar also drops the old links and the old sync token.
create or replace function public.calendar_save_connection(
  p_agent uuid, p_calendar_id text, p_account_email text, p_scopes text[],
  p_refresh text, p_access text, p_access_expires timestamptz, p_new_calendar boolean
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
begin
  insert into public.calendar_connections as c
    (agent_id, status, calendar_id, account_email, granted_scopes, connected_at)
  values (p_agent, 'active', p_calendar_id, p_account_email, p_scopes, now())
  on conflict (agent_id) do update
    set status = 'active', calendar_id = excluded.calendar_id,
        account_email = coalesce(excluded.account_email, c.account_email),
        granted_scopes = excluded.granted_scopes, last_error = null,
        last_error_at = null, lease_until = null, connected_at = now()
  returning id into v_id;

  if p_new_calendar then
    delete from public.calendar_event_links where connection_id = v_id;
  end if;

  insert into public.calendar_tokens as t
    (connection_id, agent_id, refresh_token, access_token, access_expires_at, sync_token)
  values (v_id, p_agent, p_refresh, p_access, p_access_expires, null)
  on conflict (connection_id) do update
    set refresh_token = excluded.refresh_token,
        access_token = excluded.access_token,
        access_expires_at = excluded.access_expires_at,
        sync_token = case when p_new_calendar then null else t.sync_token end;
  return v_id;
end $$;

-- invalid_grant: stop syncing, drop the tokens, keep the outbox and links.
create or replace function public.calendar_mark_revoked(p_agent uuid)
returns void language sql security invoker set search_path = '' as $$
  update public.calendar_connections
    set status = 'revoked', lease_until = null,
        last_error = 'revoked', last_error_at = now()
    where agent_id = p_agent and status in ('active', 'calendar_missing');
  delete from public.calendar_tokens where agent_id = p_agent;
$$;

-- Disconnect, step 1: stop new drains; returns the current lease end so the
-- caller can wait for an in-flight drain.
create or replace function public.calendar_begin_disconnect(p_agent uuid)
returns timestamptz language sql security invoker set search_path = '' as $$
  update public.calendar_connections
    set status = 'disconnecting'
    where agent_id = p_agent
  returning lease_until;
$$;

revoke execute on function public.calendar_claim_lease(uuid, integer) from public, anon, authenticated;
revoke execute on function public.calendar_renew_lease(uuid, integer) from public, anon, authenticated;
revoke execute on function public.calendar_release_lease(uuid) from public, anon, authenticated;
revoke execute on function public.calendar_ack(uuid, text, uuid, bigint) from public, anon, authenticated;
revoke execute on function public.calendar_fail(uuid, text, uuid, bigint, text, integer) from public, anon, authenticated;
revoke execute on function public.calendar_due_agents(integer, integer) from public, anon, authenticated;
revoke execute on function public.calendar_enqueue_backfill(uuid) from public, anon, authenticated;
revoke execute on function public.calendar_save_connection(uuid, text, text, text[], text, text, timestamptz, boolean) from public, anon, authenticated;
revoke execute on function public.calendar_mark_revoked(uuid) from public, anon, authenticated;
revoke execute on function public.calendar_begin_disconnect(uuid) from public, anon, authenticated;
grant execute on function public.calendar_claim_lease(uuid, integer) to service_role;
grant execute on function public.calendar_renew_lease(uuid, integer) to service_role;
grant execute on function public.calendar_release_lease(uuid) to service_role;
grant execute on function public.calendar_ack(uuid, text, uuid, bigint) to service_role;
grant execute on function public.calendar_fail(uuid, text, uuid, bigint, text, integer) to service_role;
grant execute on function public.calendar_due_agents(integer, integer) to service_role;
grant execute on function public.calendar_enqueue_backfill(uuid) to service_role;
grant execute on function public.calendar_save_connection(uuid, text, text, text[], text, text, timestamptz, boolean) to service_role;
grant execute on function public.calendar_mark_revoked(uuid) to service_role;
grant execute on function public.calendar_begin_disconnect(uuid) to service_role;
```

**Dry run already done (16 Sep 2026, planning only):** this SQL ran cleanly
in PGlite 0.5.8 (in-memory Postgres) on a stub schema with the same tables,
policies, roles and default privileges, and checks 3–11 below passed there
(the planning session's scratchpad `pglite-test-013.mjs`). That doesn't
replace the live rehearsal: PGlite has no Supabase roles, `supautils` or
real data.

**Rehearse it** in a transaction that always rolls back. Write
`<scratchpad>/rehearse-013.mjs` on the plan 012 Step 8 pattern:
- First statements: `begin; set local lock_timeout = '3s'; set local statement_timeout = '30s';`.
  The `alter table viewings` holds an ACCESS EXCLUSIVE lock until the
  rollback, which blocks live calendar reads. **Keep the whole rehearsal
  under about 5 seconds**, and run it at a quiet hour (not during an
  outreach call).
- `as(user)` = `set local role authenticated` plus
  `set_config('request.jwt.claims', json_build_object('sub', user, 'role', 'authenticated')::text, true)`.
- `asService()` = `set local role service_role` (the role PostgREST uses
  for the admin client).
- `asAnon()` = `set local role anon`.
- `reset role` returns to the owner.
- Wrap every check that expects an error in `savepoint s; … ; rollback to savepoint s`.

Checks, each printing `ok …`, `FAIL …` or `SKIP …`:

1. Run the file's SQL. The founder is
   `select id from public.profiles where is_admin limit 1`.
2. As owner: insert a `calendar_connections` row for the founder with
   `calendar_id = 'rehearsal'`.
3. As the founder:
   - Insert an appointment: 1 outbox row, `op = 'upsert'`, `version = 1`,
     `changed_at` not null.
   - Update its title: still 1 row, `version = 2`.
   - Run `update … set updated_at = now()`: `version` stays 2.
   - Delete it: `op = 'delete'`, `version = 3`.
4. As the founder, viewings:
   - Insert a client and a viewing with `scheduled_at`: one `viewing` upsert.
   - Set `ends_at = scheduled_at + 90 min`, then move `scheduled_at` by one
     day: `ends_at` moved by one day.
   - Set `had_offer = true`: the viewing's `version` doesn't change.
   - Set `scheduled_at = null`: `op = 'delete'` and `ends_at` is null.
   - Schedule it again, then delete the client: the viewing row's
     `op = 'delete'` (the cascade was caught).
5. As the founder: insert a client plus an appointment for them, then rename
   the client. The appointment's version goes up.
6. As the founder: insert a property plus a viewing-type appointment that
   uses it, then change the property's address. The appointment's version
   goes up.
7. **As `service_role`**: `select set_config('leadwing.sync_origin', 'google', true)`,
   update an appointment's title: the version doesn't change. Then set the
   value back to `''`.
8. **Lapse and reconcile** (as owner, then the founder, then service_role):
   - Insert a `calendar_event_links` row for an existing founder
     appointment. Set the connection to `revoked`.
   - As the founder, delete that appointment: an outbox `delete` row exists.
   - As owner, delete that outbox row (simulating a lapse before this fix),
     set the connection back to `active`.
   - As service_role, `select calendar_enqueue_backfill(<founder>)`: a
     `delete` row exists for that appointment, with `changed_at` null.
9. **Cross-tenant** (as owner, pick `select id from clients where agent_id <> <founder> limit 1`;
   print `SKIP` if there is none): as the founder, inserting an appointment
   with that `client_id` fails with `42501`. Inserting one with the
   founder's own client succeeds.
10. Privileges, each expecting error `42501`:
    - as the founder: `select * from calendar_tokens`,
      `select * from calendar_sync_outbox`,
      `select * from calendar_event_links`,
      `update calendar_connections set status = 'revoked'`,
      `delete from calendar_connections`
    - as the founder: `select public.calendar_enqueue_backfill(<founder>)`,
      `select public.calendar_enqueue(<founder>, 'appointment', gen_random_uuid(), 'upsert')`,
      `select public.calendar_claim_lease(<founder>, 10)`,
      `select public.calendar_ack(<founder>, 'appointment', gen_random_uuid(), 1)`,
      `select public.calendar_release_lease(<founder>)`,
      `select public.calendar_save_connection(<founder>, 'x', null, '{}', 'x', null, null, false)`
    - as anon: `select * from calendar_connections`
    - as owner: `has_table_privilege('authenticated', 'public.calendar_connections', 'TRUNCATE')`
      is false, and so is the same check for `REFERENCES` and `TRIGGER`

    And these should succeed:
    - as the founder: `update calendar_connections set include_tasks = true`
      updates 1 row; `select id, status from calendar_connections` returns
      1 row.
    - as service_role: `select calendar_claim_lease(<founder>, 10)` is true,
      a second call is false, `calendar_renew_lease` is true,
      `calendar_release_lease` runs, and `calendar_due_agents(10)` returns
      the founder.
11. As owner: set the connection to `disconnecting`. Then, as the founder,
    insert an appointment: no outbox row.
12. Timing: renaming a client who has 50 appointments takes well under 1 s.
13. `rollback`.

**Expected**: every line prints `ok` (or `SKIP` for check 9 only), and
nothing is kept. If the live app shows errors while the rehearsal runs,
that is a STOP condition.

**Apply it.** Only when the rehearsal passes, in one transaction, at a quiet
hour, with `set local lock_timeout = '3s'` (retry once if it times out):
1. Run the file.
2. Insert its history row into `supabase_migrations.schema_migrations`
   (`version`, `name`, `statements`; read the columns first).
3. Commit.

**Check afterwards**:
- `to_regclass` is non-null for all four tables.
- `pg_class.relrowsecurity` is true on all four.
- `pg_policies` shows exactly 2 policies on `calendar_connections` and none on
  the other three, and the with-checks on `appointments` and `viewings` now
  mention `clients`.
- `has_table_privilege('authenticated', 'public.calendar_tokens', 'select')`
  is `false`, and `…calendar_connections', 'TRUNCATE')` is `false`.
- `has_function_privilege('authenticated', 'public.calendar_enqueue(uuid,text,uuid,text,boolean)', 'execute')`
  is `false`, and it is `true` for `service_role`.
- `pg_trigger` lists the **eight** new triggers: three `*_set_updated_at`,
  `viewings_keep_duration`, and the four `*_calendar_sync`.
- The history row is present.
- Opening `/calendar` in production still works (the founder, or the
  runtime logs show no new errors).

Report what ran; never print the connection string.

**Types.** Add the four tables, the two enums, `viewings.ends_at` and the
eleven `Functions` entries (`calendar_enqueue` plus the ten helpers) to `src/lib/supabase/types.ts` by hand, in the file's
existing style.

#### Step 2.2: Token crypto: `src/lib/integrations/token-crypto.ts` (D9)

- `encryptSecret(plain: string, context: string): string` returns one text
  blob, `"<keyVersion>.<iv>.<ciphertext>.<tag>"`, the single token format
  for 007, 013 and 017 (D9, batch decision D-A; no `bytea` parts, no
  `key_version` column). The IV, ciphertext and tag are base64url:
  - AES-256-GCM with a 12-byte random IV.
  - The AAD is `context`: this plan passes `calendar:<agentId>`, so a
    ciphertext copied onto another agent's row fails to decrypt. The batch
    contexts (D9, batch decision E7) are `calendar:<agentId>` (013),
    `mail:<agentId>` (007), `whatsapp:<agentId>` (017's token),
    `whatsapp-body:<agentId>` (017's message bodies) and
    `whatsapp-payload:<sha256>` (017's raw webhook payloads, stored as
    UTF-8 JSON text).
- The module exports only `encryptSecret`, `decryptSecret` and
  `needsReencrypt` (E7). `TokenKeyError` stays internal; callers match it
  by `err.name === "TokenKeyError"`. There is no
  `encryptBytes`/`decryptBytes`: callers encrypt text. 017's `seal.ts` is a
  thin wrapper over these with no key of its own.
- `decryptSecret(blob, context): string` throws `TokenKeyError` on an unknown
  version, a wrong key or tampering.
- **Keys**:
  - `INTEGRATION_TOKEN_KEY` is the current key; its version is
    `INTEGRATION_TOKEN_KEY_VERSION` (default `k1`; must match
    `/^k[0-9]{1,3}$/`).
  - An optional `INTEGRATION_TOKEN_KEY_PREVIOUS` with
    `INTEGRATION_TOKEN_KEY_PREVIOUS_VERSION` supports rotation.
  - Validate that each key decodes to exactly 32 bytes.
  - `needsReencrypt(blob)` is true when the blob's version isn't the
    current one (the rotation runbook's deployed server-side job uses it;
    no local script holds a key, E1).
- Never log plaintext or ciphertext.

**Verify**: `token-crypto.test.ts` (node environment) checks:
- a round trip works
- a changed byte throws
- a different context throws, including across the batch contexts: a blob
  sealed with `whatsapp-body:<agentId>` fails under `whatsapp:<agentId>`,
  `calendar:<agentId>` and `mail:<agentId>`, and one sealed with
  `whatsapp-payload:<sha256>` fails under a different hash
- a UTF-8 JSON payload (non-ASCII text included) round-trips unchanged
- the module's exports are exactly `encryptSecret`, `decryptSecret` and
  `needsReencrypt`, and a thrown key error has `name === "TokenKeyError"`
- an unknown version throws
- a 31-byte key throws
- two encryptions of the same text differ (random IV)
- with `_PREVIOUS` set, an old blob decrypts, and a new blob carries the new
  version

#### Step 2.3: Google HTTP layer: `src/lib/integrations/google/`

- **`http.ts`**: `googleFetch(url, { method, token, body, query, ifMatch })`.
  - JSON in and out, `AbortSignal.timeout(10_000)`.
  - Sends `If-Match` when `ifMatch` is given.
  - Throws `GoogleApiError { status, reason, message }` parsed from
    `error.errors[0].reason`.
  - Never includes the token or body in error text.
- **`errors.ts`**: `classify(err)` returns one of:
  - `auth`: 401, or `invalid_grant` from the token endpoint
  - `rate`: 429, or 403 with a reason of `rateLimitExceeded`,
    `userRateLimitExceeded`, `quotaExceeded` or `usageLimits`
  - `retry`: 500, 502, 503, 504, a timeout or a network error
  - `gone`: 404 or 410
  - `conflict`: 409
  - `precondition`: 412 (the `If-Match` etag is stale)
  - `forbidden`: any other 403
  - `fatal`: any other 4xx
- **`oauth.ts`**:
  - `buildAuthUrl({ state, codeChallenge, loginHint? })`:
    `response_type=code`, the scope constant from
    `src/lib/calendar-sync/config.ts`, `access_type=offline`,
    `prompt=consent`, `state`, `code_challenge` and
    `code_challenge_method=S256`. **No `include_granted_scopes`** (plan 007
    can add it when it needs incremental consent). The `redirect_uri` is
    `${process.env.NEXT_PUBLIC_SITE_URL}/settings/calendar/google/callback`;
    never derive it from request headers.
  - `exchangeCode(code, codeVerifier)` returns
    `{ accessToken, expiresIn, refreshToken?, scope }`.
  - `refreshAccessToken(refreshToken)` throws a `GoogleApiError` with
    `reason: "invalid_grant"` on revocation.
  - `revokeToken(token)` treats a 400 from `revoke` as "already revoked".
  - PKCE with a confidential web client isn't described on Google's
    web-server guide (checked 16 Sep 2026; not verified). If the pilot's
    token exchange fails because of it, that is a STOP condition: report it,
    then drop PKCE and keep the user-bound state.
- **`calendar-api.ts`**: `createCalendar`, `patchCalendar`,
  `deleteCalendar`, `setCalendarListEntry(calendarId, { selected, colorId? })`,
  `insertEvent`, `patchEvent(…, { ifMatch? })`,
  `deleteEvent(…, { ifMatch? })`, `listEvents`.
  - Every event write passes `sendUpdates=none`.
  - `listEvents` returns `{ items, nextPageToken, nextSyncToken }` and takes
    `showDeleted` for full lists.

**Verify**:
- `errors.test.ts` covers every class.
- `oauth.test.ts` checks that the auth URL contains exactly the one Calendar
  scope, `access_type=offline`, `prompt=consent`, an S256 challenge, no
  `include_granted_scopes`, and the site origin as the redirect. The token
  exchange posts a form body with `code_verifier` (mock `fetch`).
- `calendar-api.test.ts` checks that `If-Match` is sent only when given and
  that `setCalendarListEntry` patches `/users/me/calendarList/{id}`.

#### Step 2.4: Sync core: `src/lib/calendar-sync/`

**`config.ts`**:
- `CALENDAR_SCOPE`
- `SYNC_WINDOW_DAYS = 60`
- `DEFAULT_DURATION_MIN = 60`
- `MAX_REMINDER_MIN = 40320` (Google's popup limit)
- `CALENDAR_META_VERSION = 1` (Phase 4 bumps it; see `push.ts`)
- `calendarSyncConfigured()`: `GOOGLE_CALENDAR_CLIENT_ID`,
  `GOOGLE_CALENDAR_CLIENT_SECRET` and `INTEGRATION_TOKEN_KEY` are present.
- `calendarConnectAllowed(email)`:
  - `GOOGLE_CALENDAR_ACCESS=open` lets everyone in.
  - `pilot` lets in only the emails in `GOOGLE_CALENDAR_PILOT_EMAILS`
    (case-insensitive).
  - Anything else (`closed`) lets nobody in.

**`event-id.ts`**: `googleEventId(kind, uuid)`.
- Kind letters: `appointment → a`, `viewing → v`, `task → t`.
- The result is the letter plus the UUID's 32 hex characters.
- Assert `/^[a-v0-9]{5,1024}$/`.

**`event-mapping.ts`** (pure):

`buildEventBody(source, ctx)`, where
`ctx = { t, tCrm, timeZone, siteUrl, hideNames, copyNotes, forInsert }`,
returns `{ body, hash, canonical }`:

- `summary`:
  - Appointments: `appointmentTitleFor(t, appt, { clientName, property: appointmentPlaceFor(tCrm, appt) })`.
  - Viewings: `title` or `t("viewingWith", { name })`.
  - `hideNames` passes `clientName: null` (and viewings fall back to
    `t("viewing")`). Custom titles are copied as written.
- `location`:
  - Appointments: `location ?? appointmentPlaceFor(...)` when the type is
    `viewing`, otherwise `location`.
  - Viewings: omitted.
- `description`: when `copyNotes` is on, the notes (or the viewing's
  `description`), then `"\n\n— LeadWing: " + url`. When it is off, only the
  footer, and **only on insert** (`forInsert`). Patches then leave Google's
  description alone, so notes the agent types in Google survive. The url is
  `${siteUrl}/clients/<clientId>` when there is a client, otherwise
  `${siteUrl}/calendar`. Export `LEADWING_FOOTER_RE` so pulls can strip it.
- `start` / `end`: `{ dateTime: <ISO UTC>, timeZone }` plus explicit
  `date: null`. The end is `ends_at` or start + 60 min.
- `recurrence: []` (a restore wipes any recurrence the agent added).
- `reminders`: `{ useDefault: false, overrides: reminder_minutes == null ? [] : [{ method: "popup", minutes: clamp(reminder_minutes, 0, MAX_REMINDER_MIN) }] }`.
- `extendedProperties.private.leadwing`: `"<kind>:<uuid>"`.
- `transparency`: `"opaque"`. `status`: `"confirmed"`.
- **Never** set `attendees`, `conferenceData`, a phone, an email or an
  amount.

`hash`: sha256 of a stable-key JSON of summary, description (when sent),
location, start, end and reminders.

`canonical`: the same fields minus reminders (and minus description when
`copyNotes` is off), with times normalised to ISO UTC milliseconds. Phase 4
compares Google events against it.

**`source.ts`**:
- `loadSources(admin, agentId, refs)` reads appointments with
  `client:clients(id, agent_id, first_name, last_name)` and
  `property:properties(agent_id, address, city, property_type)`, and viewings
  with `client:clients(id, agent_id, first_name, last_name)`, always
  `.eq("agent_id", agentId)`.
- **It drops any embed whose `agent_id` isn't `agentId`** (treats it as
  `null`) and counts it in a `foreignEmbeds` metric, which is logged as a
  number only.
- It also reads the profile's `locale` and `time_zone`, and the
  connection's `hide_client_names` and `copy_notes`, then builds the
  translators the same way the feed does.
- A row older than the window counts as "out of window".

**`connection.ts`**: `getAccessToken(admin, conn)`.
- If there is no token row, throw `ConnectionRevoked`.
- Decrypt the cached access token with
  `` decryptSecret(blob, `calendar:${agentId}`) ``; if it expires in more
  than 120 s, use it.
- Otherwise refresh, then store the new access token and its expiry,
  encrypted with `` encryptSecret(token, `calendar:${agentId}`) ``. If
  Google returns a new refresh token, store that too, under the same
  context.
- On `invalid_grant`: call `calendar_mark_revoked(agentId)` (status
  `revoked`, tokens deleted, **outbox rows and links kept**), then throw
  `ConnectionRevoked`.

**`push.ts`**: `drainAgent(agentId, { budgetMs, conn })`. **The caller holds
the lease** (`run.ts`).

1. If `conn.calendar_meta_version < CALENDAR_META_VERSION`, `patchCalendar`
   with the current `googleDescription` (profile locale), then store the
   new version. A failure here is logged and doesn't block events.
2. Loop: load up to 100 due outbox rows (`next_attempt_at <= now()`, oldest
   first). Stop when none are due or the budget is spent.
3. Before each row, `calendar_renew_lease(agentId, 90)`. If it returns false
   (the agent is disconnecting), stop at once.
4. For each row:
   - **`upsert`**:
     - The source is missing, or it is a viewing with no `scheduled_at`:
       handle it as a `delete`.
     - There is **no link** and the source is out of the window: ack and
       move on. **With a link, the window doesn't apply** (D16): patch it.
     - The link exists and `link.payload_hash === hash`: ack (no API call).
     - There is no link: `insertEvent` with the deterministic id and the
       insert body.
       - On 409, `patchEvent` the same id with the body. This covers an
         event deleted in Google and re-created here (`status: "confirmed"`
         is in the body).
       - Save the link with the `etag`, the hash and `updated`. If saving it
         fails with `23503` (the connection row is gone), stop the drain:
         the agent disconnected.
     - The link exists: `patchEvent(link.google_event_id)`, with
       `ifMatch: link.etag` once Phase 4 is live.
       - On `precondition` (412): don't ack and don't count a failure.
         Leave the row for the next pull, which settles the conflict (D14),
         and count it as `deferred`.
       - On `gone`, drop the link and insert as above.
       - If that insert also comes back `gone`, the calendar itself is gone:
         set `status = 'calendar_missing'` and stop.
   - **`delete`**:
     - No link: ack.
     - Otherwise `deleteEvent` (with `ifMatch` once Phase 4 is live;
       `precondition` → leave the row, as above), treating `gone` as
       success, then delete the link and ack.
   - Ack with `calendar_ack(agent, kind, id, version)`.
5. **Errors** (always through `calendar_fail`, which is version-guarded, so
   a newer enqueue is never pushed back):
   - `rate` or `retry`: delay `min(2^attempts, 60)` minutes plus up to 30 s
     of jitter. On `rate`, stop this agent for the cycle.
   - `auth`: follow the `ConnectionRevoked` path.
   - `forbidden` or `fatal`: store a `last_error` code only (e.g.
     `event_400`, never the message body). The delay is 5 minutes, or 24 h
     from the 5th attempt on, and the connection's `last_error` /
     `last_error_at` is set.
6. At the end: set `last_push_at` when at least one call succeeded. **If
   the drain had no failures and nothing is left in error, clear the
   connection's `last_error`**, so the "needs attention" chip doesn't stick.
7. Log only counts and error codes, never titles, names or tokens.

**`run.ts`**:
- `withAgentLease(agentId, seconds, fn)`: `calendar_claim_lease`; when it
  returns false, resolve `{ skipped: "busy_or_inactive" }`; otherwise run
  `fn` and **always** `calendar_release_lease` in `finally`.
- `runAgentCycle(agentId, { budgetMs })`: under one lease, load the
  connection, then (Phase 4) `pullAgent`, then `drainAgent`, sharing the
  budget.
- `runCalendarSyncCycle({ budgetMs, onlyAgent? })`:
  - Agents: `[onlyAgent]` when given (non-production cron), otherwise
    `rpc("calendar_due_agents", { p_limit: 500 })`. Phase 4 passes
    `p_stale_pull_seconds: 240`.
  - Process agents with a concurrency of 4 until the budget ends.
  - Return `{ agents, pushed, pulled, deferred, skipped, errors }`.

**`schedule.ts`**: `scheduleCalendarPush(agentId)` =
`after(() => pushSoon(agentId).catch(logCode))`, with
`import { after } from "next/server"`:
- `pushSoon` tries `withAgentLease(agentId, 60, …drainAgent(…, { budgetMs: 8_000 }))`
  up to 3 times, 2 s apart, while the lease is busy. It keeps draining
  while rows are due and the budget lasts. If the lease stays busy, the rows
  stay due and the next cron takes them.
- Get the id from `getSessionUser()` (verified claims, no network call),
  before calling `after`.
- The claim returns false at once when the agent has no active connection.

**`fake-google.ts`**: an in-memory double of `calendar-api.ts`, used by the
tests. It:
- keeps events per calendar with an `etag` counter and an `updated` time
- returns 409 on a duplicate id insert
- returns 412 when `If-Match` doesn't match
- marks deletes `cancelled` and returns 410 on a second delete
- keeps a CalendarList with `selected`
- supports `syncToken` and `showDeleted` for Phase 4
- can inject 429/500 errors

**Verify**:
- `event-id.test.ts`: the pattern holds and ids are deterministic.
- `event-mapping.test.ts`:
  - a viewing-type appointment's title and location
  - a meeting without a client gets "Meeting"
  - a 60-min default end
  - a reminder override, none for `null`, and 50000 clamped to 40320
  - the footer is present, and `LEADWING_FOOTER_RE` strips it exactly
  - `copyNotes: false` sends no notes, and no `description` on a patch
  - `hideNames: true` drops the client name
  - no phone or email even when the source has them
  - `recurrence: []` and `date: null` are present
  - the hash is stable across key order
  - Spanish titles
- `source.test.ts`: an appointment whose client belongs to another agent
  loads with `client: null` and no name reaches the body.
- `push.test.ts`, with a mocked admin client plus `fake-google`, covers:
  - insert, then link
  - an unchanged payload makes no API call
  - a patch
  - a 409 becomes a patch with `confirmed`
  - a delete, and a delete of a missing link
  - a 429 schedules a retry and stops the agent
  - `invalid_grant` calls `calendar_mark_revoked` and **keeps the outbox**
  - **a delete queued while revoked is pushed after reconnect**
  - a linked source older than the window is still patched (a client
    rename), and an unlinked one is acked without a call
  - a 412 leaves the row due and isn't counted as a failure
  - a failure ack with a stale version doesn't overwrite the newer row
  - `calendar_renew_lease` returning false stops the drain
  - a clean drain clears the connection's `last_error`
  - the calendar description is patched once when `calendar_meta_version`
    is behind
- `run.test.ts`: the lease is claimed once per cycle and always released
  (also when `drainAgent` throws); a busy lease skips the agent.

#### Step 2.5: OAuth routes

**`src/app/(app)/settings/calendar/google/start/route.ts`**, `GET`:

1. `const supabase = await createClient()`, then `supabase.auth.getUser()`.
   With no user, redirect to `/login?next=/settings`.
2. If `!calendarSyncConfigured()` or `!calendarConnectAllowed(user.email)`,
   redirect to `/settings?calendar=unavailable#google-calendar`.
3. `state = randomBytes(32).toString("base64url")`,
   `verifier = randomBytes(32).toString("base64url")`,
   `challenge = sha256(verifier)` in base64url.
4. Set the cookie `lw_gcal_state` to a base64url JSON
   `{ s: state, u: sha256(user.id), v: verifier }`, with `httpOnly`,
   `secure` (in production), `sameSite: "lax"`,
   `path: "/settings/calendar/google"` and `maxAge: 600`.
5. Redirect (302) to `buildAuthUrl({ state, codeChallenge: challenge, loginHint: user.email })`.

**`.../callback/route.ts`**, `GET`, with `export const maxDuration = 60`:

1. Read `code`, `state` and `error`, and parse the cookie; then delete the
   cookie.
   - `error=access_denied` → `?calendar=denied`. If Google also sends
     `error_subtype=admin_policy_enforced` (a Workspace admin block; the
     parameter name is not verified), use `?calendar=blocked`.
   - A missing cookie, or a `state` that doesn't match `s` (compare with
     `timingSafeEqual` on equal-length buffers) → `?calendar=failed`.
2. `getUser()` again. The user must be allowed (as in start), and
   `sha256(user.id)` must equal the cookie's `u`; otherwise `failed`.
3. `exchangeCode(code, cookie.v)`.
   - If `scope` doesn't include `CALENDAR_SCOPE` (granular consent),
     `revokeToken` and go to `?calendar=scope`.
   - If there is no `refreshToken`, `revokeToken` and go to
     `?calendar=failed`.
4. With the admin client, look for an existing `calendar_connections` row
   (`.eq("agent_id", user.id)`):
   - **Status `disconnecting`**: `revokeToken`, `failed` (try again in a
     minute).
   - **A row with a `calendar_id`** (a reconnect): probe it with
     `listEvents(calendarId, { maxResults: 1 })`.
     - On 200, reuse the calendar and keep its links (`newCalendar = false`).
     - On `gone`/`forbidden`, create a new calendar (`newCalendar = true`).
   - **No row**: create a new calendar.
   - **Creating**: `createCalendar({ summary: "LeadWing", description: <settings.calendar.googleDescription in the profile locale>, timeZone })`,
     then `setCalendarListEntry(calendarId, { selected: true })` so it shows
     in Google Calendar and its reminders fire. A failure of that second
     call is logged and doesn't stop the connect.
5. **Right away**, one RPC that writes the connection and the tokens in one
   transaction (`agentId` is `user.id`; both tokens are stored,
   `access_token` included, each under the AAD `calendar:<agentId>`):

   ```ts
   calendar_save_connection(agentId, calendarId,
     calendar.dataOwner ?? null, grantedScopes,
     encryptSecret(refresh, `calendar:${agentId}`),
     encryptSecret(access, `calendar:${agentId}`),
     expiresAt, newCalendar)
   ```

   **If it fails and the calendar was just created**, try
   `deleteCalendar` on it (so a retry doesn't leave an orphan "LeadWing"
   calendar), `revokeToken`, and go to `failed`.
6. `calendar_enqueue_backfill(user.id)`, then
   `after(() => runAgentCycle(user.id, { budgetMs: 45_000 }))`.
7. Redirect to `/settings?calendar=connected#google-calendar`.

Any other failure goes to `?calendar=failed`, and the server logs the error
code only. The redirects use `NextResponse.redirect(new URL(path, process.env.NEXT_PUBLIC_SITE_URL ?? request.url))`.

**Verify**: `route.test.ts` for each route mocks `@/lib/supabase/server`,
`@/lib/supabase/admin` and `fetch`, and checks that:
- signed out → login redirect
- a user not on the allow-list → `unavailable`
- start sets the cookie (with `u` and `v`, never the raw user id) and
  redirects to `accounts.google.com` with `state` and `code_challenge`
- a state mismatch → `failed`, with no token exchange
- a cookie made for another user id → `failed`, with no token exchange
- `error_subtype=admin_policy_enforced` → `blocked`
- a missing scope → the revoke endpoint is called, then `scope`
- success creates a calendar, patches its CalendarList entry to
  `selected: true`, calls `calendar_save_connection` once with
  **ciphertext** (the stored value doesn't contain the refresh token),
  enqueues the backfill and redirects to `connected`
- a failing `calendar_save_connection` deletes the new calendar and
  redirects to `failed`

Then, with `npm run dev`:
- `curl -si http://localhost:3000/settings/calendar/google/start | head -1`
  prints a 307 to `/login`, from the proxy.

#### Step 2.6: Server actions and data: `src/lib/actions/calendar-sync.ts`, `src/lib/data/calendar-sync.ts`

**`getCalendarConnection()`** uses the cookie client under RLS and selects:
- `status`, `account_email`
- `last_push_at`, `last_pull_at`
- `last_error`, `last_error_at`
- `include_tasks`, `hide_client_names`, `copy_notes`
- `skipped_count`, `removed_count`

It returns `null` when there is no row, or when the table is missing
(PGRST205, so a deploy ahead of the migration doesn't break Settings).

**Actions**. Each one calls `supabase.auth.getUser()` and uses `user.id`
only. **Every database write outside the three toggles and
`removed_count` goes through the admin client, filtered on
`agent_id = user.id`** (`authenticated` has no INSERT or DELETE there).

- **`syncCalendarNow()`**:
  - **Throttle on the server**: read the connection (cookie client). If
    `last_push_at` and `last_pull_at` (Phase 4) are both under 15 s old,
    return `{ changed: 0, throttled: true }` without calling Google.
  - Otherwise `runAgentCycle(user.id, { budgetMs: 8_000 })`. Returns
    `{ changed }`.
  - It is only called from the explicit "Sync now" button, never on mount
    (Current state 13).
- **`disconnectGoogleCalendar({ keepCalendar })`**, offered **in every
  state**:
  1. `calendar_begin_disconnect(user.id)`. If it returns a lease end in the
     future, poll every 500 ms (up to 12 s) until the lease is released or
     expired. The drain checks `calendar_renew_lease` before each row, so it
     stops within one Google call.
  2. If a token row exists and `getAccessToken` succeeds:
     - Unless `keepCalendar`, `deleteCalendar`. `ok` or `gone` is success.
       Any other result (`forbidden`, `auth`, `retry`, …) doesn't stop the
       disconnect; remember to return `deleteItYourself`.
     - `revokeToken(refresh)`. A failure is logged only.
  3. If there are no tokens (for example `revoked`), make no Google calls,
     and return `deleteItYourself` unless `keepCalendar`, because the
     calendar may still exist.
  4. With the admin client: delete the `calendar_connections` row
     (`.eq("agent_id", user.id)`; the cascade removes tokens and links),
     then delete the agent's outbox rows.
  5. `revalidatePath("/settings")` and `revalidatePath("/calendar")`.
- **`recreateGoogleCalendar()`**, for `calendar_missing`: claim the lease,
  create a new calendar (plus `setCalendarListEntry`),
  `calendar_save_connection(…, newCalendar: true)` with the current tokens,
  backfill, release, then `scheduleCalendarPush`.
- **`setCalendarSyncOption(key, value)`**: only `include_tasks`,
  `hide_client_names` or `copy_notes`, through the cookie client (column
  grants apply). For `hide_client_names` and `copy_notes`, then call
  `calendar_enqueue_backfill(user.id)` with the admin client and
  `scheduleCalendarPush`, since every title or description changes.
  Phase 6 wires `include_tasks`.
- **`dismissRemovedNotice()`**: sets `removed_count = 0` through the cookie
  client.

**Verify**: typecheck, plus `calendar-sync.test.ts` with a mocked admin
client and `fetch`:
- disconnect calls `deleteCalendar` before `revokeToken`, then deletes the
  rows with the admin client, scoped to the user
- `forbidden` on `deleteCalendar` still revokes and deletes, and returns
  `deleteItYourself`
- a `revoked` connection with no tokens makes no Google call and deletes
  the rows
- a held lease makes the action wait, then proceed
- `syncCalendarNow` inside 15 s of the last run makes no Google call

#### Step 2.7: Push hooks with `after()`

After a successful write in each of these, add
`scheduleCalendarPush(agentId)`:
- `saveAppointment` and `deleteAppointment` (`src/lib/actions/calendar.ts`)
- `saveViewing` and `deleteViewing` (`src/lib/actions/buyer.ts`)
- `deleteClient` and `updateClient` (renames; `src/lib/actions/clients.ts`)
- `saveProperty` (updates only) and `deleteProperty`
  (`src/lib/actions/seller.ts:19`, `:59`): their triggers or SET NULLs change
  derived titles

Notes:
- The drain returns at once when the agent has no active connection.
- `saveViewing` doesn't need to write `ends_at`: the `viewings_keep_duration`
  trigger moves or clears it when `scheduled_at` changes.
- In `src/lib/actions/notifications.ts:204-208`, replace the property-label
  expression with `appointmentPlaceFor(tc, a)` (no behaviour change). That
  makes `appointmentTitleFor` plus `appointmentPlaceFor` the single source
  for titles.

**Verify**: the existing action tests still pass, with
`@/lib/calendar-sync/schedule` mocked where those tests import the actions
(`attachments.test.tsx` mocks the buyer actions already).

#### Step 2.8: The cron: `src/app/api/cron/calendar-sync/route.ts` and `vercel.json`

`cron-auth.ts` and `CRON_SECRET` are created by whichever of plans 013, 014,
016 and 017 lands first (expected: 016 Phase 2, D22). If
`src/lib/integrations/cron-auth.ts` already exists, reuse it as it is. If its
unset-secret behaviour differs from D22, report that; don't change another
plan's route. Otherwise this plan is first, so create it:

```ts
// src/lib/integrations/cron-auth.ts
export function authorizeCron(request: Request):
  | { ok: true; agentId: string | null }
  | { ok: false; response: Response } {
  // 1. CRON_SECRET unset → log "cron_secret_missing", 401.
  // 2. Authorization !== `Bearer ${secret}` (timingSafeEqual after a length check)
  //    → log "cron_secret_mismatch", 401. In 1 and 2 no work runs.
  // 3. VERCEL_ENV !== "production": require ?agent=<uuid> (zod uuid) → else 400;
  //    return that id so the caller processes only that agent.
}
```

```ts
// src/app/api/cron/calendar-sync/route.ts
export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = authorizeCron(request);
  if (!auth.ok) return auth.response;
  const headers = { "Cache-Control": "no-store" };
  if (!calendarSyncConfigured()) {
    return Response.json({ skipped: "not_configured" }, { headers });
  }
  const result = await runCalendarSyncCycle({
    budgetMs: 45_000,
    onlyAgent: auth.agentId ?? undefined,
  });
  return Response.json(result, { headers });
}
```

**First, check whether plan 016's `pg_cron` fallback is active** (batch
decision E2). Run 016 Step 21b's "fallback active" check through
`SUPABASE_DB_URL`: is `pg_cron` in `pg_extension`, and if so, does
`select jobname, schedule from cron.job where jobname like 'leadwing_%'`
return rows? If both are true, don't touch `vercel.json`. Instead add a
migration with 016 Step 21b's recipe: one `cron.schedule` for
`/api/cron/calendar-sync` as its own job (for example
`leadwing-calendar-sync-5min`), schedule `*/5 * * * *`, calling the
production URL with every header the route reads: `Authorization` from
the Vault secret `leadwing_cron_secret`, and `x-vercel-cron-schedule` set
to exactly `*/5 * * * *`. Rehearse and apply it the way Step 21b says
(`begin … rollback` first, then a history row).

Otherwise `vercel.json` gets a `crons` entry. **Append to an existing
`crons` array; never replace it** (plans 014, 016 and 017 add their own,
batch decision E3):

```json
{ "path": "/api/cron/calendar-sync", "schedule": "*/5 * * * *" }
```

If `vercel.json` has no `crons` yet, it becomes:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["fra1"],
  "crons": [{ "path": "/api/cron/calendar-sync", "schedule": "*/5 * * * *" }]
}
```

**Verify**:
- `cron-auth.test.ts` (if created here): unset → 401 (`cron_secret_missing`),
  wrong → 401 (`cron_secret_mismatch`), neither runs work; right →
  ok; non-production without `?agent` → 400, and with it returns the id.
- `route.test.ts`:
  - no header → 401
  - a wrong secret → 401
  - the right secret → 200 with the counts from a mocked
    `runCalendarSyncCycle`
  - an unset `CRON_SECRET` → 401
  - outside production, `?agent=<uuid>` is passed through as `onlyAgent`
- The E2 check's result is reported (fallback active or not).
- If `vercel.json` changed: `node -e 'JSON.parse(require("fs").readFileSync("vercel.json"))'`
  exits 0, and any other plan's `crons` entries are still there. If the
  `pg_cron` path was taken: `cron.job` lists the new calendar-sync job at
  `*/5 * * * *` next to the other `leadwing_%` jobs, and `vercel.json` is
  unchanged.
- After deploy, the Vercel runtime logs show `GET /api/cron/calendar-sync 200`
  every 5 minutes. **A 401/403 page from Vercel Authentication, or no log at
  all, is a STOP condition** (D22's fallback is the founder's call).

#### Step 2.9: Settings panel: `src/components/settings/calendar-panel.tsx`

- **`GoogleCalendarPanel`** is a client component with props:
  - `connection` (from Step 2.6, or `null`)
  - `configured`
  - `allowed`
  - `notice` (the `calendar` search param)
- `src/app/(app)/settings/page.tsx`:
  - loads `getCalendarConnection()` beside the profile
  - computes `configured` / `allowed` on the server
  - passes `searchParams.calendar` down
- `SettingsView` renders the panel after `<PreferencesPanel />`, and before
  plan 011's Data panel if that exists (and wherever plans 016/017 put
  theirs, keeping this one right after Preferences). Give it the anchor
  `id="google-calendar"`.

`Panel`: `title = settings.calendar.title`, icon `CalendarSync` from lucide
(fall back to `CalendarDays` if the installed lucide lacks it).

The panel shows one of these states. **Every connected state (any row
exists) offers the Disconnect dialog.**

| State | Shows |
|---|---|
| Not configured, or not allowed | the description plus `pilotOnly`, no button |
| Not connected | the description, `privacyNote`, and the button `<a href="/settings/calendar/google/start">` labelled `connect` |
| `active` | `connectedAs` (or `connected`); `lastSynced` with relative time from `useFormatter().relativeTime`, or `neverSynced`; a "Sync now" button (`syncCalendarNow`, spinner, `router.refresh()`; toast `upToDate` when throttled); the `hideNames` and `copyNotes` switches with their hints; the Disconnect dialog; and a `Notice` with `duplicateHint` |
| `revoked` | a `Notice` (`revoked`), a Reconnect link to start, and the Disconnect dialog |
| `calendar_missing` | a `Notice` (`calendarMissing`), a Recreate button, and the Disconnect dialog |
| `disconnecting` | `disconnecting` text, no buttons |
| `last_error` set (and `active`) | a quiet `Notice` (`error`) under the status line |
| `skipped_count > 0` | the `skipped` line (Phase 4) |

The Disconnect dialog has `disconnectTitle`, `disconnectBody`, a
`keepCalendar` checkbox and `confirmDisconnect`. When the action returns
`deleteItYourself`, show that as a toast.

On mount, toast `notice` (`connected`, `denied`, `blocked`, `scope`,
`failed`, `unavailable`), then `router.replace("/settings#google-calendar")`.

**Copy.** Add `settings.calendar.*` in EN and ES:

| key | EN | ES |
|---|---|---|
| `title` | Google Calendar | Google Calendar |
| `description` (Phase 2) | Put your viewings and meetings in a separate “LeadWing” calendar in your Google account. New bookings and changes show up in Google within seconds, with a reminder in the Google Calendar app. | Lleva tus visitas y reuniones a un calendario «LeadWing» propio en tu cuenta de Google. Las citas nuevas y los cambios aparecen en Google en segundos, con aviso en la app de Google Calendar. |
| `privacyNote` | LeadWing can only see and change the LeadWing calendar, never your other calendars. | LeadWing solo puede ver y cambiar el calendario LeadWing, nunca tus otros calendarios. |
| `googleDescription` | Viewings and meetings from LeadWing. (Phase 4: "Viewings and meetings from LeadWing. Changes here sync back.") | Visitas y reuniones de LeadWing. (Fase 4: «Visitas y reuniones de LeadWing. Los cambios que hagas aquí vuelven a LeadWing.») |
| `connect` | Connect Google Calendar | Conectar Google Calendar |
| `pilotOnly` | Connecting Google Calendar is in a private pilot. Until it opens, use the calendar link on the Calendar page. | La conexión con Google Calendar está en prueba privada. Mientras tanto, usa el enlace de calendario de la página Calendario. |
| `connectedAs` | Connected to {email} | Conectado a {email} |
| `connected` | Connected | Conectado |
| `lastSynced` | Last synced {when} | Última sincronización: {when} |
| `neverSynced` | Waiting for the first sync | Esperando la primera sincronización |
| `syncNow` | Sync now | Sincronizar ahora |
| `hideNames` | Hide client names in Google | Ocultar los nombres de los clientes en Google |
| `hideNamesHint` | Events show “Viewing” or “Meeting” instead. Titles you typed yourself are copied as written. | Los eventos muestran «Visita» o «Reunión». Los títulos que escribiste tú se copian tal cual. |
| `copyNotes` | Copy my notes to Google | Copiar mis notas a Google |
| `copyNotesHint` | Notes are copied exactly as you wrote them, including any phone numbers or amounts you typed. | Las notas se copian tal cual las escribiste, con los teléfonos o importes que hayas puesto. |
| `disconnect` | Disconnect | Desconectar |
| `disconnectTitle` | Disconnect Google Calendar? | ¿Desconectar Google Calendar? |
| `disconnectBody` | LeadWing stops updating Google and deletes its access. Your viewings and meetings stay in LeadWing. | LeadWing deja de actualizar Google y borra su acceso. Tus visitas y reuniones siguen en LeadWing. |
| `keepCalendar` | Keep the LeadWing calendar in Google. It won't update any more, and if you reconnect later LeadWing creates a new one, so delete this copy then. | Conservar el calendario LeadWing en Google. Ya no se actualizará y, si vuelves a conectar, LeadWing creará uno nuevo, así que borra entonces esta copia. |
| `confirmDisconnect` | Disconnect | Desconectar |
| `disconnecting` | Disconnecting… | Desconectando… |
| `deleteItYourself` | We couldn't delete the LeadWing calendar. Delete it in Google Calendar's settings. | No hemos podido borrar el calendario LeadWing. Bórralo en los ajustes de Google Calendar. |
| `revoked` | Google access was removed, so nothing is syncing. Reconnect to catch up, or disconnect. | Se retiró el acceso a Google, así que no se sincroniza nada. Vuelve a conectar para ponerte al día, o desconecta. |
| `reconnect` | Reconnect | Volver a conectar |
| `calendarMissing` | The LeadWing calendar was deleted in Google. Create it again to keep syncing. | El calendario LeadWing se borró en Google. Créalo de nuevo para seguir sincronizando. |
| `recreate` | Create it again | Crearlo de nuevo |
| `error` | Some changes couldn't reach Google. LeadWing keeps trying. | Algunos cambios no han llegado a Google. LeadWing lo sigue intentando. |
| `duplicateHint` | Subscribed to the LeadWing calendar link before? Remove that subscription in Google Calendar, or every event shows twice. | ¿Te suscribiste antes al enlace de calendario de LeadWing? Quita esa suscripción en Google Calendar o verás cada evento dos veces. |
| `notices.connected` | Google Calendar connected | Google Calendar conectado |
| `notices.denied` | Google Calendar wasn't connected | No se ha conectado Google Calendar |
| `notices.blocked` | Your organisation's Google admin doesn't allow this app. Ask them to allow “LeadWing”, or use the calendar link. | El administrador de Google de tu organización no permite esta app. Pídele que permita «LeadWing» o usa el enlace de calendario. |
| `notices.scope` | LeadWing needs permission to manage its own calendar. Try again and leave that box ticked. | LeadWing necesita permiso para gestionar su propio calendario. Inténtalo de nuevo y deja esa casilla marcada. |
| `notices.failed` | Couldn't connect Google Calendar. Try again. | No se ha podido conectar Google Calendar. Inténtalo de nuevo. |
| `notices.unavailable` | Connecting Google Calendar isn't available for your account yet. | La conexión con Google Calendar aún no está disponible para tu cuenta. |
| `notices.disconnected` | Google Calendar disconnected | Google Calendar desconectado |
| `notices.upToDate` | Already up to date | Ya está al día |

**Verify**: render every state on a preview-tmp page, in both languages, at
375 px and at desktop width. Check there are no console errors, then delete
your folder.

#### Step 2.10: Calendar page

**`CalendarSyncDialog`** is rewritten.
- The trigger label is `sync.button` ("Google Calendar" / "Google Calendar").
  Once connected, `CalendarSyncStatus` sits beside it.
- A `Segmented` control (`@/components/shell/toolbar`) switches between two
  panes:
  1. **`sync.tabs.google`**, which shows the connection state in short form
     plus one button: "Connect Google Calendar" (a link to start, only when
     allowed) or "Manage in Settings" (`/settings#google-calendar`).
     Otherwise it shows `pilotOnly`.
  2. **`sync.tabs.other`**, the existing link UI, retitled `sync.otherTitle`
     with the Phase 0 note. Use this text:
     - EN: "For Apple Calendar, Outlook and other apps. The app refreshes the
       link on its own schedule (Google Calendar can take up to a day), and
       changes made there don't come back."
     - ES: "Para Apple Calendar, Outlook y otras apps. La app actualiza el
       enlace a su ritmo (en Google Calendar puede tardar hasta un día) y lo
       que cambies allí no vuelve a LeadWing."
- The calendar page passes `connection` (from `getCalendarConnection()`) and
  `allowed` into `CalendarView` and on to the dialog.

**`CalendarSyncStatus`** (new) is a small `Tag`:
- `sync.status.synced`: "Google · synced {when}" / "Google · sincronizado {when}"
- `sync.status.attention`: "Google · needs attention" / "Google · requiere
  atención", shown for `revoked`, `calendar_missing` or `last_error`
- It never calls a server action on mount. Phase 4 adds the pull through
  `after()` on the page (Step 4.3).

**`src/lib/data/calendar.ts`**: viewing events use `ends_at: v.ends_at` and
select it (`*` already includes it once the types are updated).

The feed (`route.ts:95`) uses `v.ends_at ?? start + 1 h`.

**Coordinate with plan 009**: its reminder link now lives in
`src/components/calendar/event-row.tsx:40` (`eventReminderHref`), not at
`calendar-view.tsx:240` as 009 says. This plan edits `calendar-view.tsx`
only around the toolbar (`:263`) and the props.

**Verify**: a preview-tmp render of `CalendarView` in these states: not
connected, pilot-blocked, connected, and needs attention, in both languages.
The dialog switches panes, and the existing link still copies. Then delete
your folder.

#### Step 2.11: Meetings without a client, and a reminder cap

In `src/lib/validation/calendar.ts`:
- In `appointmentFormSchema` (`:28-31`), change the refine so that a meeting
  needs a client **or** a non-empty title. Keep the `chooseClient` key; add
  a `validation` key `chooseClientOrTitle` in `messages/{en,es}/validation.json`:
  - EN: "Choose a client or add a title"
  - ES: "Elige un cliente o añade un título"
- In `appointmentInputSchema` (`:46`), cap `reminder_minutes` at 40320
  (`.max(40320)`). The mapping clamps as well.

**Verify**: a new `src/lib/validation/calendar.test.ts`:
- a meeting with a title and no client is valid
- a meeting with neither is invalid, with the new message
- a viewing is unchanged
- `reminder_minutes: 40321` is rejected by `appointmentInputSchema`

#### Step 2.12: Gates, deploy and pilot

1. `npm run typecheck && npm run lint && npm test && npm run build` all pass.
2. Apply the migration (Step 2.1) **before** pushing code that reads the new
   tables. `getCalendarConnection` tolerates their absence anyway.
3. Commit, and ask the operator to push.
4. After deploy:
   - the cron logs show 200s
   - `/settings/calendar/google/start` signed out gives a 307 to `/login`
   - `curl -si https://www.leadwing.app/api/cron/calendar-sync | head -1`
     prints a 401
5. The founder, signed in, checks:
   1. Connect. The consent screen names LeadWing and asks only for the
      LeadWing-calendar permission (plus the unverified-app warning while
      D13 applies).
   2. A "LeadWing" calendar appears **in Google Calendar on the web and in
      the Google Calendar phone app**, ticked, with the past 60 days plus
      future events. The count matches the DB: `calendar_event_links` rows
      for the founder equal the appointments and dated viewings in the
      window.
   3. Create a meeting with a 30-minute reminder. It appears in Google within
      about 10 s, and **the phone alerts 30 minutes before**.
   4. Move it, rename the client, and delete it. Each change shows in Google
      (the rename within 5 minutes at worst).
   5. Delete a test client that has a dated viewing. The event disappears.
   6. **Lapse rehearsal**: at https://myaccount.google.com/connections,
      remove LeadWing Calendar's access. Delete a test appointment in
      LeadWing. Within 5 minutes, the panel shows `revoked`. Reconnect:
      the deleted appointment's event disappears from Google.
   7. Disconnect with "keep" unticked. The calendar is gone, and **LeadWing
      no longer has Calendar access** (the calendar permission is gone from
      the connections page; the sign-in entry, if any, may stay).
   8. Reconnect.
   9. If an iPhone is at hand: add the same Google account in Apple
      Calendar and note whether the LeadWing calendar shows and whether its
      alerts fire. The result only changes the copy (Phase 5a), not the
      build.
6. **DB checks** (read-only script):
   - no outbox rows older than 10 minutes
   - `last_push_at` is recent
   - `calendar_tokens.refresh_token` starts with `k1.`
7. **Pilot for one week** with the founder and Lena. Lena first confirms
   that her office allows a third-party app on her Google account (P12).

**Done when**: a week passes with no duplicate or missing events, no
unexplained `last_error`, and the lapse rehearsal passed.

### Phase 3: Google verification

**Gate**:
- Phase 2 works in production (its Done criteria).
- The legal pages have no draft banner.
- Brand verification passed for the "LeadWing Calendar" project.
- Phase 1 Step 1.4's email is sent.
- Step 3.0 is live.

#### Step 3.0: Describe the connection on the homepage first

Google's requirements say the homepage must describe the app's
functionality, and the reviewer sees a consent screen asking for Calendar
access. It is an inference, not a written rule, that a homepage saying only
"subscribe to a link" could be flagged; a rejection would restart a 1–3 week
clock. So, before submitting, append one sentence to
`faq.items.calendar.a` (and ask the operator to push):
- EN: " Connecting your Google account, so LeadWing keeps a separate
  “LeadWing” calendar there up to date, is in a private pilot."
- ES: " Conectar tu cuenta de Google, para que LeadWing mantenga al día un
  calendario «LeadWing» propio, está en prueba privada."

**Verify**: `curl -s https://www.leadwing.app/ | grep -c "private pilot"`
prints at least `1` after deploy.

#### Step 3.1: Submit

1. **Demo video** (founder records it; Claude writes the script). It is an
   unlisted YouTube video, in English, that shows:
   - the browser address bar on `www.leadwing.app`
   - the homepage sentence from Step 3.0
   - Settings → Connect Google Calendar
   - the **full consent screen**, with the app name and the scope
   - the OAuth client id visible in the URL
   - the LeadWing calendar appearing in Google
   - a viewing created in LeadWing arriving in Google
   - the "Hide client names" and "Copy my notes" switches
   - (after Phase 4) a time moved in Google arriving back in LeadWing
   - Disconnect
2. **Scope justification** (Claude drafts it): "LeadWing is a CRM for
   independent real-estate agents. With calendar.app.created it creates one
   secondary calendar named LeadWing in the agent's account and keeps the
   agent's property viewings and client meetings in it, so they appear in
   Google Calendar with reminders, and reads changes the agent makes to that
   calendar. It can't access any other calendar. The data is used only for
   this user-facing sync feature, is never sold, used for ads, sent to AI
   providers or used to train AI models, and is deleted when the agent
   disconnects."
3. The founder submits under Google Auth Platform → Verification Center and
   answers reviewer mail. **A rejection restarts the clock**; fix and
   resubmit the same week.
4. **On approval**:
   - If the project is still in Testing (D13's alternative), move it to
     **In production**; pilot tokens may need a reconnect.
   - Set `GOOGLE_CALENDAR_ACCESS=open` on Vercel and redeploy.

**Done when**:
- Verification Center shows the app as verified.
- A non-pilot Google account connects without the unverified-app screen.

### Phase 4: Pull-back (true two-way)

**Gate**:
- The Phase 2 pilot week is clean.
- **A demand signal** (D3): at least 2 pilot or interview agents say they
  move or edit appointments in Google, or ask for it. Without it, stop
  after Phase 5a; one-way sync is the product.

Phase 4 can ship before or after Phase 3; the scope is the same.

#### Step 4.1: Migration: `supabase/migrations/<ts>_calendar_pull.sql`

It must sort after the Phase 2 file and every reserved slot. It adds:

- **`calendar_change_log`**: `id bigint generated always as identity`,
  `agent_id`, `source_kind`, `source_id`, `field text`
  (`starts_at|ends_at|title|location|notes|scheduled_at|removed`),
  `old_value text`, `new_value text`, `origin text default 'google'`,
  `changed_at timestamptz default now()`. RLS on, one `select` policy for
  the agent, `revoke all … from anon, authenticated` then
  `grant select … to authenticated`. It is kept as long as the record
  exists. The dated history of a viewing is evidence (D3), and plan 015's
  registration log can read it later.
- **`calendar_removed_items`**: `id uuid`, `agent_id`, `source_kind`,
  `source_id`, `snapshot jsonb`, `removed_at`, `restored_at`. It has the
  same RLS and grants as the change log. Rows older than 30 days are purged
  by `calendar_purge_removed()`, which the cron calls once an hour.
- **`calendar_connections.pull_failures integer not null default 0`**.
- **`calendar_apply_changes(p_agent uuid, p_connection uuid, p_changes jsonb) returns jsonb`**,
  `security invoker`, `set search_path = ''`, service role only:
  1. `perform set_config('leadwing.sync_origin', 'google', true);`
  2. For each element of `p_changes` (a JSON array, **at most 50 per
     call**, because PostgREST calls run under the authenticator's 8 s
     `statement_timeout`), run the element **in its own
     `begin … exception when others then … end` block**. A failing element
     is rolled back alone, recorded as `{ index, code: SQLSTATE }`, and the
     loop continues.
  3. Return `{ inserted: [{ google_event_id, id }], applied: n, failed: [{ index, code }] }`.

| `op` | Effect (always `where agent_id = p_agent`) |
|---|---|
| `appointment_update` | `update appointments set starts_at, ends_at, title, location, notes` from the element. Only the keys present are set; `title`, `location` and `notes` may be `null`. Log each changed field to `calendar_change_log`. Upsert the link (`etag`, `google_updated_at`, `payload_hash`). |
| `appointment_insert` | `insert into appointments (agent_id, type, title, starts_at, ends_at, location, notes) values (p_agent, 'meeting', …) returning id`, then insert the link with the Google id. Returns the new id in the result. |
| `appointment_remove` | Copy the row into `calendar_removed_items.snapshot`, delete it, delete the link, log `removed`, and add 1 to `removed_count`. |
| `viewing_update` | `update viewings set scheduled_at, ends_at`, log the old and new values, then upsert the link. |
| `viewing_unschedule` | `update viewings set scheduled_at = null, ends_at = null, reminder_minutes = null`, log the old values, then delete the link. |
| `link_insert` | Insert a link for a tagged event, **only if** the source row exists with `agent_id = p_agent` and has no link yet; otherwise record a failure code `no_source`. |
| `link_only` | Update an existing link's `etag` / `google_updated_at` / `payload_hash` (echoes, unchanged content, conflicts LeadWing wins). |
| `drop_link` | Delete the link only (a past event cancelled in Google). |
| `outbox_resolve` | Delete the record's outbox row `where version = <element.version>` (Google won a conflict). |

- **`calendar_restore_removed(p_agent uuid, p_id uuid) returns uuid`**,
  service role only. It re-inserts the snapshot with the same id **without**
  `leadwing.sync_origin`, so the trigger enqueues a push. `client_id` and
  `property_id` are kept only if those rows still exist for `p_agent`. It
  sets `restored_at`.
- **`calendar_purge_removed() returns integer`**, service role only:
  deletes `calendar_removed_items` rows older than 30 days.

Add `revoke execute … from public, anon, authenticated` and
`grant execute … to service_role` for the three functions.

**Rehearse** as in Step 2.1 (`lock_timeout = '3s'`, savepoints), **calling
the functions as `service_role`** (`set local role service_role`), because
that is how PostgREST runs them:
- Each op changes only the founder's rows.
- There are **no outbox rows** after the call (the origin guard works),
  except after `calendar_restore_removed`, which must leave one `upsert`.
- **One invalid element among three** (an `ends_at` before `starts_at`,
  which breaks `viewings_ends_after_start`) returns
  `failed: [{ index: 1, code: '23514' }]`, and the other two are applied.
- `link_insert` for another agent's appointment id records `no_source` and
  inserts nothing.
- A `p_agent` that doesn't own the id changes 0 rows.
- `viewing_update` writes `calendar_change_log` rows with the old time.
- The functions are not executable by `authenticated` (`42501`), and
  `calendar_change_log` is readable by the founder only for their own rows.

Apply it with its history row, and add it to `types.ts`.

#### Step 4.2: `src/lib/calendar-sync/pull.ts`

`pullAgent(agentId, { budgetMs, conn })`. **The caller holds the lease**
(`runAgentCycle`), and pull runs before the drain.

1. `listEvents(calendarId, { syncToken, pageToken, maxResults: 250 })`, page
   by page.
   - With no `sync_token` (right after connect, or after a 410), do a full
     list **with `showDeleted: true`**.
   - Save `nextSyncToken` when the last page is reached **and every
     `calendar_apply_changes` call returned** (per-item failures don't
     block it).
   - If the budget runs out mid-way, keep the old token; the next run
     repeats the pages harmlessly.
2. Build the change list, then apply it in batches of up to 50.
   - Per-item failures count as skipped; set the connection's
     `last_error = 'pull_item_<code>'`. The token still advances.
   - **A whole `calendar_apply_changes` call that fails** (timeout,
     network) leaves the token alone and adds 1 to `pull_failures`. At 2 or
     more, set `last_error = 'pull_stuck'` (a STOP condition during the
     pilot). A successful pull resets `pull_failures` to 0.
3. For each item, in this order:
   1. `recurringEventId` present → ignore (not counted: the series master
      is counted).
   2. Match it to a link by `google_event_id`. If there is no link, read
      `extendedProperties.private.leadwing`.
   3. "Past" means the LeadWing start (for a linked source) or the Google
      start is before now.

| Case | Action |
|---|---|
| `status: "cancelled"` + a link + past | `drop_link` (D4: nothing changes in LeadWing) |
| `status: "cancelled"` + a link to a future appointment | `appointment_remove` |
| `status: "cancelled"` + a link to a future viewing | `viewing_unschedule` |
| `status: "cancelled"` + no link | nothing |
| a link and `item.etag === link.etag` | skip (our own write) |
| **a link, but the source row is gone** (or is a viewing with no date) | enqueue a `delete` (`calendar_enqueue`, `p_changed = false`) if none is pending |
| a linked event that became all-day (`start.date`) or recurring | don't apply; enqueue an `upsert` (`p_changed = false`). The push restores it (`recurrence: []`, `date: null`). |
| a link + past + content differs | don't apply (D3); enqueue an `upsert` (`p_changed = false`) so LeadWing's version is restored |
| a link, and Google's canonical equals LeadWing's current canonical (`event-mapping.ts`, footer stripped) | `link_only` |
| a link, content differs, **no pending outbox row with `changed_at`** (LeadWing unchanged) | **Google wins**: `appointment_update` (times plus title, location and notes; notes only when `copy_notes` is on; don't store a title or location that equals the derived one, keep `null`), or `viewing_update` (times only; other differences are re-pushed by enqueuing an upsert with `p_changed = false`) |
| a link, content differs, a pending row with `changed_at`, and `item.updated` > `changed_at` | Google wins: apply as above, plus `outbox_resolve` with that row's version |
| a link, content differs, a pending row with `changed_at`, and `changed_at` ≥ `item.updated` | LeadWing wins: `link_only` with Google's current etag (so the next `If-Match` push succeeds); leave the row |
| no link, no LeadWing tag, a timed single event (`start.dateTime`, no `recurrence`), inside the window | `appointment_insert` (truncate title to 200, location to 200, notes to 2000); then `patchEvent` to add `extendedProperties.private.leadwing = "appointment:<newId>"` and store the returned etag |
| no link, no tag, all-day or recurring | count as skipped |
| no link, a LeadWing tag, the source exists and has no link | `link_insert` (the function checks the source's `agent_id`) |
| no link, a LeadWing tag, the source exists but **is already linked to another event** (the agent duplicated it in Google) | treat as a new event: `appointment_insert`, then re-tag it with the new id |
| no link, a LeadWing tag, the source is gone | `deleteEvent` (an orphan) |

4. **Error cases**:
   - On **410** from `list`: clear `sync_token` and do a full list with
     `showDeleted: true` in the same call if the budget allows. Apply D4 to
     the cancelled items it returns. **Never delete for absence**: for every
     linked source missing from the result entirely, enqueue an `upsert`
     (`p_changed = false`).
   - On **404** for the calendar: `status = 'calendar_missing'`.
5. Finish:
   - Set `skipped_count` to the count from the last full list; incremental
     pulls adjust it by the difference.
   - Set `last_pull_at`. Return `{ changed }`.
6. In `run.ts`, pass `p_stale_pull_seconds: 240` to `calendar_due_agents`
   and call `pullAgent` before `drainAgent` in `runAgentCycle`. Once an
   hour, the cron also calls `calendar_purge_removed()`.
7. Turn on `ifMatch` in `push.ts` (Step 2.4), and bump
   `CALENDAR_META_VERSION` to 2 with the Phase 4 `googleDescription`, so
   existing calendars get the new description on their next drain.

**Fixtures**: `src/lib/calendar-sync/fixtures/` holds realistic Google list
pages:
- a first page and a last page with `nextSyncToken`
- a cancelled event (future and past)
- an echo (same etag)
- a time move
- a title edit
- a new timed event
- an all-day event
- a recurring master, an instance and an exception with `recurringEventId`
- a duplicated event carrying another event's tag
- an event whose summary equals the derived title
- a 410 body

**Verify**: `pull.test.ts` with `fake-google` covers:
- every row of the table
- pagination, with the token saved only at the end
- a budget cut mid-way keeps the old token
- **one invalid element among three**: two are applied, the token
  advances, and `last_error` is `pull_item_…`
- **a failed apply call twice on the same page** sets `pull_stuck` and
  keeps the token
- a 410 leads to a full resync with `showDeleted=true`, D4 applied to its
  cancellations, and no deletes for absence
- a 404 on the calendar gives `calendar_missing`
- an import tags the event and the next pull treats it as an echo
- **an unrelated LeadWing edit (`had_offer`) doesn't revert a Google time
  move**, since no outbox row has `changed_at`
- a real conflict: the later of `changed_at` and `updated` wins, both ways
- a push after a Google edit gets 412, and the next pull settles it
- a past event edited in Google is restored, and a past cancellation only
  drops the link
- a `recurringEventId` item is ignored, and a duplicated tagged event is
  imported as a new meeting
- nothing is written for another agent

#### Step 4.3: Pull triggers and notices in the UI

- **`src/app/(app)/calendar/page.tsx`** and
  **`src/app/(app)/home/page.tsx`**: read the user id with
  `getSessionUser()` **before** calling `after`, then
  `after(() => pullIfStale(id, { budgetMs: 5_000, staleMs: 60_000 }))`.
  `pullIfStale` reads `last_pull_at` with the admin client (filtered on the
  id) and runs `runAgentCycle` only when it is stale. The page isn't
  refreshed; the next navigation shows the changes. **No server action runs
  on mount** (Current state 13).
- **"Sync now"** stays the only client-side trigger (throttled on the
  server, Step 2.6).
- **The removed notice on `/calendar`**: a `Notice` shows when
  `removed_count > 0`, with **Review** and **Got it**:
  - EN: "{count, plural, one {# meeting was} other {# meetings were}} removed
    in Google Calendar."
  - ES: "{count, plural, one {Se eliminó # reunión} other {Se eliminaron #
    reuniones}} en Google Calendar."
  - Buttons: "Review" / "Revisar", "Got it" / "Entendido"
    (`dismissRemovedNotice`).
  - **Review** opens `calendar-removed-dialog.tsx`, which lists the
    agent's `calendar_removed_items` from the last 30 days that aren't
    restored (cookie client, RLS), with the title and date, and a
    **Restore** / "Restaurar" button per item. It calls a
    `restoreRemovedAppointment(id)` server action (`getUser()`, then the
    service-role `calendar_restore_removed(user.id, id)`, then
    `scheduleCalendarPush`). Footer: "Removed meetings can be restored for
    30 days." / "Puedes restaurar las reuniones eliminadas durante 30 días."
- **The `skipped` line** in the Settings panel:
  - EN: "{count, plural, one {# event} other {# events}} in the LeadWing
    calendar can't sync (all-day or repeating)."
  - ES: "{count, plural, one {# evento} other {# eventos}} del calendario
    LeadWing no se pueden sincronizar (de todo el día o periódicos)."
- **Update `settings.calendar.description`** by appending:
  - EN: " Times you move in Google come back to LeadWing within minutes.
    Past events stay as LeadWing recorded them."
  - ES: " Las horas que muevas en Google vuelven a LeadWing en unos minutos.
    Los eventos pasados se quedan como los registró LeadWing."

  Also update `googleDescription` to its Phase 4 text (step 4.2.7 pushes it
  to existing calendars).

**Verify**:
- The gates pass.
- A preview-tmp render of the removed notice and the Review dialog, in both
  languages, at 375 px.
- The founder, signed in, checks:
  1. Drag a future viewing to a new time in Google: LeadWing shows it
     within 5 minutes, or on the next page load after opening `/calendar`.
     `calendar_change_log` has the old time.
  2. Rename a future meeting in Google: the title changes in LeadWing.
  3. Record an offer on a viewing in LeadWing right after moving it in
     Google: the Google time stays.
  4. Create a timed event in the LeadWing calendar: it appears as a meeting
     without a client and can be edited in LeadWing.
  5. Create an all-day event: the panel counts 1 skipped.
  6. Delete a future meeting in Google: it is gone from LeadWing, with the
     notice. **Restore** brings it back, in LeadWing and in Google.
  7. Delete a future buyer viewing in Google: the viewing is still on the
     client page, now without a date.
  8. Move a past event in Google: within 5 minutes Google shows LeadWing's
     time again.
  9. Edit the same meeting in both places within a minute: the later edit
     wins, and there is no ping-pong (the event's `updated` stops changing).
  10. The existing LeadWing calendar's description now says changes sync
      back.
- The DB shows no outbox rows that keep coming back for the same record,
  and `pull_failures` is 0.

### Phase 5: Copy switch

#### Phase 5a: "Syncs to Google Calendar" (one way, connected account)

**Gate**:
- Phase 3 is done and `GOOGLE_CALENDAR_ACCESS=open`.
- At least one non-founder agent is connected and syncing.

Replace the Phase 0 wording on the same keys and files. **Keep the reminder
clause as plan 016 has it at that time** (016 owns it); only the calendar
part changes.

- **`howItWorks.steps.plan.blurb`**
  - EN: "Add a buyer and book the tour. LeadWing keeps the date, the
    reminder and the bell together, and syncs it to your own Google Calendar
    so it shows up wherever you already look."
  - ES: "Añade un comprador y agenda la visita. LeadWing mantiene juntos la
    fecha, el recordatorio y el aviso, y lo sincroniza con tu propio Google
    Calendar para que aparezca donde ya miras."
- **`howItWorks.tiles.calendar.synced`**: "Synced" / "Sincronizado".
- **`faq.items.calendar`**
  - EN Q: "Does it sync with Google Calendar?"
  - EN A: "Yes. Connect your Google account once and LeadWing keeps its own
    “LeadWing” calendar in your Google Calendar up to date: new and changed
    viewings and meetings appear within seconds, with a reminder in the
    Google Calendar app, and LeadWing shows a reminder in the app before
    each one. LeadWing only sees that one calendar, never your personal
    events. Edits you make in Google stay in Google. Apple Calendar, Outlook
    and other apps can use a read-only calendar link."
  - ES Q: "¿Se sincroniza con Google Calendar?"
  - ES A: "Sí. Conectas tu cuenta de Google una vez y LeadWing mantiene al
    día su propio calendario «LeadWing» dentro de tu Google Calendar: las
    visitas y reuniones nuevas o modificadas aparecen en segundos, con aviso
    en la app de Google Calendar, y LeadWing te muestra un aviso en la app
    antes de cada una. LeadWing solo ve ese calendario, nunca tus citas
    personales. Lo que cambies en Google se queda en Google. Apple Calendar,
    Outlook y otras apps pueden usar un enlace de calendario de solo
    lectura."
- **`llms.txt:52`**: "- Viewing scheduler: month and week calendar with
  in-app reminders, Google Calendar sync into a dedicated LeadWing calendar
  in the agent's own Google account (one way; phone reminders through the
  Google Calendar app; LeadWing never reads the agent's other calendars), a
  read-only iCal link for other calendar apps, and one-tap WhatsApp
  confirmations"
- **`crm-marbella.en.tsx:117`**: "Connect Google Calendar and every viewing
  lands in your own LeadWing calendar there, with a reminder in the Google
  Calendar app."
  - ES: "Conecta Google Calendar y cada visita aparece en tu calendario
    LeadWing, con aviso en la app de Google Calendar."
- **`about.{en,es}.tsx:72`**:
  - EN: "every viewing on a calendar that syncs to your Google Calendar"
  - ES: "cada visita en un calendario que se sincroniza con tu Google
    Calendar"
- **`crm-spain.{en,es}`**: "a Google Calendar feed" → "Google Calendar
  sync"; "una suscripción a Google Calendar" → "sincronización con Google
  Calendar".
- **`billing.json:243`**: only "a Google Calendar feed" → "Google Calendar
  sync" / "feed para Google Calendar" → "sincronización con Google
  Calendar".
- **Plan 010's `viewing-scheduler` / `agenda-visitas` page**, if built: the
  same claim.
- If the iPhone check (Step 2.12.5.9) failed, don't mention phones beyond
  "the Google Calendar app".
- **Claim timings honestly**: only say "within seconds" if the pilot saw
  pushes arrive in under about 10 s; otherwise say "within a minute" (and
  change `settings.calendar.description` to match).
- Bump `PUBLISHED` for every edited content page.

**Verify**:
- `grep -n -i "one way:\|en un solo sentido\|private pilot\|prueba privada" messages/en/landing.json messages/es/landing.json`
  prints nothing.
- `grep -c "dedicated LeadWing calendar" src/app/llms.txt/route.ts` prints `1`.
- `grep -rn "Google Calendar feed\|feed para Google Calendar" src/content messages`
  prints nothing.
- The pages render with `npm run dev`, as in Step 0.3.

#### Phase 5b: "Two-way"

**Gate**: Phase 4 is live for real, verified users, and 5a is live.

- **`howItWorks.steps.plan.blurb`**: "…and two-way Google Calendar sync puts
  it wherever you already look." / "…y la sincronización en ambos sentidos
  con Google Calendar lo lleva donde ya miras."
- **`faq.items.calendar.a`**: replace "Edits you make in Google stay in
  Google." with "Times you move in Google come back to LeadWing within
  minutes." and "Yes." with "Yes, both ways." ES: "Lo que cambies en Google
  se queda en Google." → "Las horas que muevas en Google vuelven a LeadWing
  en unos minutos."; "Sí." → "Sí, en ambos sentidos."
- **`llms.txt:52`**: "(one way; …)" → "(two-way for times, titles, locations
  and notes; …)".
- **`crm-marbella`**: append "; move it in Google and LeadWing follows." /
  "; si la mueves en Google, LeadWing se actualiza."
- **`about`**: "syncs both ways with Google Calendar" / "se sincroniza en
  ambos sentidos con Google Calendar".
- **`crm-spain` and `billing.json:243`**: "two-way Google Calendar sync" /
  "sincronización en ambos sentidos con Google Calendar".
- **Claim timings honestly**: only say "within seconds" if the pilot saw
  pushes arrive in under about 10 s. Only say "within minutes" for pulls
  while the 5-minute cron is the path.
- Bump `PUBLISHED` for every edited content page.

**Verify**:
- `grep -n "stay in Google\|se queda en Google" messages/en/landing.json messages/es/landing.json`
  prints nothing.
- `grep -rn "two-way\|ambos sentidos" messages/en/landing.json messages/es/landing.json src/app/llms.txt/route.ts`
  prints the new lines.

### Phase 6: Tasks as all-day events

**Gate**: interview or pilot agents ask for it. (Hiding client names and
copying notes moved to Phase 2.)

- **Migration `<ts>_calendar_tasks.sql`**:
  - A `tasks_calendar_sync()` trigger (the same shape as viewings, with an
    agent filter) that enqueues `task` when `due_on`, `title` or `status`
    changes.
  - It only enqueues when the connection has `include_tasks`.
  - `status = 'done'`, or `due_on` set to null, means `delete`.
  - Extend `calendar_enqueue_backfill`'s reconcile to tasks.
  - Turning the toggle on runs a task backfill; turning it off enqueues
    deletes for the linked tasks.
  - Both happen in `setCalendarSyncOption`, through service-role RPCs
    modelled on `calendar_enqueue_backfill`.
- **Mapping**:
  - `start: { date: due_on, dateTime: null }`,
    `end: { date: due_on + 1 day, dateTime: null }`
  - `transparency: "transparent"`
  - no reminders
  - the summary is "Task: {title}" / "Tarea: {title}"
  - the event id prefix is `t`
  - pulls ignore task events (push-only): re-push on change, and on a
    Google delete just drop the link
- **Copy** (`settings.calendar`):
  - `includeTasks`: "Add tasks with a due date as all-day events" /
    "Añadir las tareas con fecha como eventos de todo el día"
- **Privacy §4**: add "tasks with a due date, if you turn that on" to the
  list of what is copied.

**Verify**:
- Rehearse the migration.
- Tests cover the task mapping and the toggle backfills.
- The founder turns tasks on and sees the due tasks as all-day, free
  events; completing one removes it.

### Phase 7: Push channels (`events.watch`)

**Gate**: any one of these:
- more than ~50 connected agents
- complaints about the 5-minute lag
- Google quota billing making polling costly
- about 2,500 connected agents in any case: at ~300 calls per agent per day,
  polling reaches the 1M/day project quota near 3,000 agents, and that
  ceiling can't be raised on request

- **Migration**: a `calendar_channels` table (`connection_id`, `channel_id
  uuid`, `resource_id`, `token_hash`, `expires_at`), service role only.
- **`src/app/api/google-calendar/notify/route.ts`**, `POST`:
  1. Read `X-Goog-Channel-ID`, `X-Goog-Resource-ID`,
     `X-Goog-Resource-State` and `X-Goog-Channel-Token`.
  2. Look up the channel, compare the token with an HMAC
     (`timingSafeEqual`), and return 404 for unknown channels.
  3. Reply `200` at once.
     - `sync` (the first message): nothing more.
     - `exists` / `not_exists`: `after(() => runAgentCycle(agentId, { budgetMs: 20_000 }))`
       (it takes the lease; if the lease is busy, the next cron run pulls).
  4. Return `503` only for transient failures, since Google retries 5xx.
- **Watching**: on connect or recreate, `POST /calendars/{id}/events/watch`
  with `{ id: <uuid>, type: "web_hook", address: "https://www.leadwing.app/api/google-calendar/notify", token: <random>, params: { ttl: "604800" } }`.
- **Renewal**: the cron renews any channel with under 24 h left (a new
  channel first, then `channels.stop` on the old one) and pulls every agent
  hourly as a safety net. Change the cron selection to
  `last_pull_at < now() - 1 hour` for agents with a live channel.
- **Disconnect**: `channels.stop` for all of the agent's channels.
- **The proxy**: `/api/google-calendar/notify` isn't protected and isn't
  redirected. Add it to the proxy comment's pass-through list
  (`middleware.ts:43-47`).

**Verify**:
- Route tests: an unknown channel gets 404, a bad token gets 404, `sync` gets
  200 with no pull, and `exists` gets 200 and schedules a pull.
- Moving an event in Google reaches LeadWing within about 10 s in
  production.

### Phase 8: Microsoft Outlook / Microsoft 365

**Gate**:
- At least 2 of 5 interviewees use Outlook calendars.
- A Microsoft Entra work tenant exists.
- The Partner Program account is verified.

- An Entra multitenant app with `Calendars.ReadWrite` and `offline_access`.
  Check whether typical tenants require admin consent before building.
- A dedicated "LeadWing" calendar.
- Delta queries for pulls, plus Graph subscriptions (at most 10,080 minutes)
  with `lifecycleNotificationUrl` handling for `reauthorizationRequired`,
  `subscriptionRemoved` and `missed`.
- `alter type calendar_provider add value 'microsoft'`. Relax
  `calendar_connections` to one row per `(agent_id, provider)`, and add a
  provider to the links and outbox keys, or keep one connection per agent and
  let the agent choose. That is a founder decision at the time.
- A `src/lib/integrations/microsoft/` layer mirroring the Google one, with
  `src/lib/calendar-sync/` made provider-agnostic.
- Publisher verification in Partner Center.
- A privacy-policy row for Microsoft.

This phase gets its own plan when its gate opens.

## Until this ships (interim landing wording)

Apply these in Phase 0; Phase 5a replaces them. **Plan 016 Step 0.1 applies
this table**, together with plans 014, 015, 016 and 017's tables, in one
commit (batch decision D-G), including the `messages/es/settings.json:42`
row. Only if this plan ships before 016 Step 0.1, apply these rows alone in a
`docs(marketing): …` commit (Step 0.3). **Values only; key names stay
the same.** **This table is the single source for the pre-outreach text of
the strings plans 013 and 016 share** (marked "merged"). If another plan in
this batch has a different interim text for one of those strings, this table
wins.

| File, key | EN | ES |
|---|---|---|
| `messages/{en,es}/landing.json` `howItWorks.steps.plan.blurb` (`:73`) | Add a buyer and book the tour. LeadWing keeps the date, the reminder and the bell together, and a private calendar link puts your viewings in Google Calendar too. | Añade un comprador y agenda la visita. LeadWing mantiene juntos la fecha, el recordatorio y el aviso, y un enlace privado de calendario lleva tus visitas también a Google Calendar. |
| `howItWorks.tiles.calendar.synced` (`:89`) | Calendar link | Enlace de calendario |
| `faq.items.calendar.q` (`:276`) | Does it work with Google Calendar? | ¿Funciona con Google Calendar? |
| `faq.items.calendar.a` (`:277`), which also feeds the FAQPage JSON-LD via `src/lib/faq.ts:20`. **Merged 013 + 016.** | Yes, one way: subscribe once to your private LeadWing calendar link and your viewings and meetings show up in Google Calendar (or any calendar app that takes a link), and LeadWing shows a reminder in the app before each one. Google refreshes subscribed calendars on its own schedule, so a new booking can take a day or more to appear there, and changes you make in Google don't come back to LeadWing. You set it up from a computer, because the Google Calendar phone app can't add a calendar by link. | Sí, en un solo sentido: te suscribes una vez a tu enlace privado de calendario de LeadWing y tus visitas y reuniones aparecen en Google Calendar (o en cualquier app de calendario que acepte un enlace), y LeadWing te muestra un aviso en la app antes de cada una. Google actualiza los calendarios suscritos a su ritmo, así que una visita nueva puede tardar un día o más en aparecer allí, y lo que cambies en Google no vuelve a LeadWing. Se configura desde un ordenador, porque la app de Google Calendar para móvil no permite añadir un calendario por enlace. |
| `src/app/llms.txt/route.ts:52` (English only). **Merged 013 + 016; 017's "one-tap WhatsApp confirmations" is kept.** | - Viewing scheduler: month calendar with in-app reminders, a private read-only calendar link (iCal) for Google Calendar and other calendar apps, and one-tap WhatsApp confirmations | — |
| `src/content/pages/crm-marbella.en.tsx:117` / `crm-marbella.es.tsx:116-117` | Subscribe to your private calendar link in Google Calendar, so the day shows up wherever you already look. | Suscríbete a tu enlace privado de calendario desde Google Calendar para que el día aparezca donde ya miras. |
| `src/content/pages/about.en.tsx:72` / `about.es.tsx:72` (the phrase only) | every viewing on a calendar you can subscribe to in Google Calendar | cada visita en un calendario al que puedes suscribirte desde Google Calendar |
| `messages/es/settings.json:42` `preferences.languageHint` | (unchanged: "The app and your calendar feed use it.") | Lo usan la app y tu enlace de calendario. |
| `messages/{en,es}/calendar.json` `sync.button` (`:64`) | Calendar link | Enlace de calendario |
| `sync.title` (`:65`) | Your calendar link | Tu enlace de calendario |
| `sync.description` (`:66`) | Subscribe to this link once and your viewings and meetings appear in Google Calendar, Apple Calendar or Outlook. In Google Calendar, add it from a computer. | Suscríbete una vez a este enlace y tus visitas y reuniones aparecerán en Google Calendar, Apple Calendar u Outlook. En Google Calendar, añádelo desde un ordenador. |
| `sync.note` (`:76`) | Calendar apps refresh subscribed calendars on their own schedule; in Google Calendar a new event can take a day or more to appear. Changes you make there don't come back to LeadWing. | Las apps de calendario actualizan los calendarios suscritos a su ritmo; en Google Calendar un evento nuevo puede tardar un día o más en aparecer. Lo que cambies allí no vuelve a LeadWing. |
| `sync.linkFailed` (`:77`) | Couldn't generate your calendar link | No se ha podido generar tu enlace de calendario |
| `src/lib/seo.ts` `PUBLISHED.crmMarbella`, `PUBLISHED.about` | the ship day (one bump, even if 014–016 bump the same key that day) | — |

**Who owns which shared line** (so no plan overwrites another):

| Line | Owner(s) | Pre-21-Sep value |
|---|---|---|
| `landing.json:73`, `:89`, `:276` | 013 | the table above |
| `landing.json:277` (`faq.items.calendar.a`) | 013 (calendar part), 016 (reminder clause) | the merged row above |
| `landing.json:81`, `:138`, `:140`, `:5` | 016 | plan 016 |
| `landing.json:251-254` (agencies FAQ) | 015 | plan 015 |
| `landing.json:263-266` (portals FAQ) | 014 | plan 014 |
| `llms.txt:47` / `:49` / `:51` | 015 / 016 / 014 | those plans |
| `llms.txt:52` | 013 (calendar), 016 (reminders), 017 (keeps "one-tap WhatsApp confirmations") | the merged row above |
| `crm-marbella.en.tsx:113` / `.es.tsx:112` | 016 | plan 016 |
| `crm-marbella.en.tsx:117` / `.es.tsx:116-117` | 013 | the table above |
| `crm-marbella.es.tsx:52-55` | 015 | plan 015 |
| `crm-spain.en.tsx:133` / `.es.tsx:135` | 016 (reminder part only); 013 changes "feed" only in Phase 5a | plan 016 |
| `PUBLISHED` keys | whoever ships that day | one bump per key per day |

**Notes on the wording**:
- **Leave these unchanged**: `crm-spain.{en,es}` and `billing.json:243`
  already say "feed" / "suscripción". `src/app/layout.tsx` keywords don't
  mention Google Calendar. The English `settings.json:42` already says
  "calendar feed".
- **"A day or more"**: Google's help page gives no refresh interval for
  subscribed calendars. Third-party reports say 8–24 hours, sometimes up to
  48 (not verified), so the copy doesn't promise "hours".
- **No "for now" and no date** for two-way sync (D18); Phases 1–5 aren't
  committed until D21 passes.
- **The phone app**: "the Google Calendar phone app", not "Google's phone
  app", which could mean the Google search app.
- **The tile chip**: "Calendar link" with its check mark reads as "set up",
  which is true once subscribed; "Synced" suggested an instant sync.
- **The dialog button**: "Calendar link", because the same link serves
  Apple Calendar and Outlook.
- **The reminder clause** matches plan 016's interim text ("…, and LeadWing
  shows a reminder in the app before each one"), placed where "each one"
  has an antecedent.

## Prerequisites outside the code

| # | Item | Owner | Lead time | Needed by |
|---|---|---|---|---|
| P1 | Legal entity: legal name, NIF, address; hosting region "EU (Frankfurt)" in `src/lib/legal.ts`. The pages lose their draft banner. The same details gate 013 Phase 3, 014's privacy work and 017's Meta verification. Google's review checks the privacy policy and homepage; that placeholders would fail it is an inference, not a written rule. | founder | 1 day if a NIF and registration (autónomo or company) exist; **days to weeks if not** | **Now** (the LSSI art. 10 identification duty applies to a site that sells; Stripe live keys since 15 Sep 2026), and Phase 1 |
| P2 | Step 1.1.0: screenshots of the login project's Audience, Branding and Clients pages. Change nothing there. | founder | 30 min | Phase 1 |
| P3 | Step 1.1: the new "LeadWing Calendar" project, Calendar API, branding (authorized domain `leadwing.app` only), **brand verification**. | founder | minutes (automated) to 2–3 business days (manual). If the check names any domain other than `leadwing.app`, that is a STOP condition. | Phase 2 (D13 publishing) and Phase 3 (it is a prerequisite for data-access verification) |
| P4 | A Web OAuth client "LeadWing Calendar" with the one production redirect URI. | founder | 15 min | Phase 2 |
| P5 | Data Access: declare `calendar.app.created` and **screenshot its sensitivity badge**. Publish (D13) or add test users (D13 alternative). Then the Google sign-in smoke test (Step 1.1.8). | founder | 15 min | Phase 2 |
| P6 | Vercel Production env: `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `INTEGRATION_TOKEN_KEY`, `INTEGRATION_TOKEN_KEY_VERSION`, `CRON_SECRET` (if missing), `GOOGLE_CALENDAR_ACCESS`, `GOOGLE_CALENDAR_PILOT_EMAILS`. `vercel link` first. Env changes apply to new deployments only. | founder (client secret); Claude (random keys, with the founder's OK, by Step 1.2's file steps, batch decision E1: generated into a 0600 scratchpad file, piped into `vercel env add … --sensitive`, the founder copies it from that path into the password manager, then `rm -P` after the founder confirms; never printed in chat, logs or commits) | 15 min | Phase 2 (after D21) |
| P7 | Unlisted YouTube demo video, and the scope justification text. | founder records; Claude scripts | 1 day | Phase 3 |
| P8 | Courtesy email to existing agents when the Phase 1 legal text goes live (D20). A lawyer's view on D20's framing, shared with 014 and 017. | founder | 30 min; about 1 h of lawyer time | Phase 1 (Step 1.4) |
| P9 | Update the founder's record of processing: tokens, calendar ids, event mappings, the change log and removed items; retention = until disconnect; revoke on account deletion. Add "disconnect Google Calendar first" to the manual account-deletion runbook (there is no self-service deletion). | founder | 1 h | Phase 2 |
| P10 | Add D21's four questions and score **H** to `plans/validation-interview-script.md` (a separate change; this plan doesn't edit it). | founder (Claude drafts on request) | 15 min | **Before Mon 21 Sep 2026** |
| P11 | Outlook only: a Microsoft Entra work tenant, plus a verified Microsoft AI Cloud Partner Program account (free) for publisher verification. | founder | days to weeks | Phase 8 |
| P12 | Lena confirms in writing that her office allows a third-party app on her Google account, and whether that account is a Workspace account whose admin restricts apps (Google says admins may block sensitive scopes for untrusted client ids). Ties in with the outreach notes on Engel & Völkers' rules. | founder via Lena | days | Phase 2 pilot |
| P13 | Only if the founder keeps D12's alternative: a paid Supabase plan (the project's plan isn't confirmed), the Custom Domain add-on ($10/month), and moving the login redirect to that domain. | founder | days | Phase 1 |

## Costs per agent per month

The assumptions are rough, and USD is treated as roughly EUR at this
precision. Prices were checked on 16 Sep 2026.

| Item | Assumption | Per connected agent / month |
|---|---|---|
| Google Calendar API | ~8,640 incremental list calls a month (one every 5 min, about 290 a day), plus page-open pulls and ~100–300 writes. It is free today, far under 600 requests/min per user. The project-wide free limit is 1,000,000 requests a day, **which can't be raised on request**, so polling tops out near 3,000 connected agents (Phase 7 comes first). Google plans charges for exceeding quota "later in 2026", with at least 90 days' notice. | €0 |
| Vercel invocations | The cron is **per project**: 8,640 runs a month in total, whatever the agent count. `after()` adds tens per agent. At $0.60 per million. | < €0.001 |
| Vercel Active CPU (fra1, $0.184/h) | ~50 ms of CPU per agent per cycle. Waiting on Google isn't billed as CPU. 8,640 × 0.05 s ≈ 0.12 h. | ≈ €0.02 |
| Vercel provisioned memory ($0.0152/GB-h) | An upper bound: ~0.3 s wall time per agent per cycle on a 2 GB instance, with no sharing. In practice agents share one instance per run. | ≤ €0.02 |
| Supabase | A few hundred small rows per agent (links, one connection, a transient outbox, a small change log), inside the current plan. | €0 |
| **Total** | | **≈ €0.02–0.05** (under €0.01 once Phase 7 replaces polling) |
| Fixed costs | **€0 with D12's recommended separate project.** Only with D12's alternative: the Supabase Custom Domain add-on at $10/month, on a paid Supabase plan. D13's recommendation also removes the weekly pilot reconnects (founder time). | €0 (or ≈ €9/month in total) |
| One-off | Google verification €0. Microsoft publisher verification €0. Vercel Pro is already paid (cron and 60 s functions are included). | — |
| For comparison, option E (Nylas) | $1.75–2.25 per extra connected account, plus a $15–49 base | ≈ €1.60–2.10 plus the base |

With no agents connected, the cron costs well under €0.01 a month. At a €29
Pro seat or a free seat, €0.02–0.05 is well inside the "few euros" budget.

## Risks and mitigations

- **Timing.**
  - Nothing verified can ship before 21 Sep; only Phase 0 does.
  - Phase 2 waits for the 9 Oct gate (D21). With 2 weeks of build, a pilot
    week and Google's review, Phase 5a lands in November 2026 at the
    earliest.
  - Mitigation: the interim wording, the pilot allow-list, no dates in copy.
- **The interview gate fails.** Then Phases 1.2–5 stay parked, Phase 0's
  honest copy stays, and the ICS link is the product. Nothing is lost but the
  planning time.
- **The review fails or stalls** on draft legal pages, a missing Limited Use
  statement, a homepage that doesn't describe the connection, or a weak
  video. Mitigation: Step 1.3, Step 3.0 and the Phase 3 checklist; resubmit
  the same week.
- **Brand verification of a project with a Supabase redirect** can't pass
  without a verifiable domain (D12). Mitigation: the separate project, which
  never touches the live login.
- **Pilot constraints.**
  - D13 (unverified production): every pilot agent sees Google's warning
    screen; the lifetime cap is 100 new users.
  - D13's alternative (Testing): tokens expire every 7 days, handled as
    `revoked`, with a weekly reconnect.
- **Workspace admins can block the app.** Google says admins may restrict
  sensitive scopes for client ids they haven't marked trusted. Franchise
  office accounts (Lena's included) may be blocked. Mitigations: D21's
  question, P12, the `blocked` notice, and the ICS link as the fallback.
- **Loops and duplicates.**
  - Causes: pull writes re-triggering pushes, a cron run delivered twice or
    overlapping runs, and Google not detecting id collisions at creation.
  - Mitigations: the `sync_origin` guard, the etag and hash checks,
    `If-Match`, the outbox primary key plus version-guarded acks and fails,
    deterministic ids, and the caller-held lease.
- **Lapses lose nothing.** Changes made while a connection is revoked stay
  in the outbox (they are enqueued in every state but `disconnecting`), and
  every backfill reconciles links whose record is gone.
- **Changes that bypass the actions** (cascades, SET NULL, renames, property
  edits) are caught by the triggers, and linked events are updated whatever
  their age.
  - Account deletion is not caught: `auth.users` cascades remove LeadWing's
    rows, but the Google calendar stays. The runbook says disconnect first
    (P9).
- **A pull stuck on one bad event.** Per-item savepoints skip it, the token
  advances, and `last_error` shows it. A whole call failing twice sets
  `pull_stuck` (STOP).
- **Silent overwrite of dated evidence** (a stray drag in Google). Past
  events are push-only, and every Google-originated change to a viewing or
  appointment is logged with its old value (D3). Appointments removed in
  Google can be restored for 30 days (D4).
- **Re-creating a deleted event id.** Google may answer 409; the drain patches
  it back to `confirmed`. This behaviour isn't documented; it is tested with
  the fake and must be confirmed in the pilot (STOP otherwise).
- **Double events** when an agent keeps the old ICS subscription. LeadWing
  can't detect it; only the `duplicateHint` note helps.
- **A kept calendar plus a reconnect** creates a second LeadWing calendar.
  The `keepCalendar` text says so.
- **Tokens die silently.**
  - Causes: the agent revokes access, the token goes unused for 6 months, or
    the agent deletes the LeadWing calendar.
  - Mitigations: the statuses `revoked` / `calendar_missing`, the panel and
    status-chip banners, Reconnect / Recreate, and Disconnect in every
    state.
- **Token security.**
  - A refresh token plus the client secret can write to the agent's
    LeadWing calendar.
  - `calendar.app.created` limits the damage to that calendar.
  - The key and the ciphertext live at different providers, with AAD per
    agent and purpose, a version prefix for rotation, and no token in logs.
  - The OAuth state is bound to the signed-in user, with PKCE on top (if
    Google accepts it for web clients).
- **Cross-tenant leaks through service-role embeds.** Closed three ways: the
  RLS with-check hardening, the agent filter on embeds (feed and sync), and
  the agent filter in the triggers.
- **Quota billing**: Google plans charges later in 2026 (at least 90 days'
  notice), and a new quota tiering model was announced on 1 May 2026. The
  1M/day project limit can't be raised; Phase 7 cuts calls roughly tenfold
  and must land before about 2,500 connected agents. Check the billing terms
  before growth.
- **Cron capacity**: one run covers roughly 500–600 agents (Target design).
  Raise concurrency or `maxDuration` before about 300 connected agents.
- **Cron versus Deployment Protection**: untested here (Vercel
  Authentication, `all_except_custom_domains`). Cron also doesn't follow
  redirects. Mitigation: check the first runs' logs (STOP condition), then
  D22's fallback.
- **Proxy trap**: a callback under `/auth` would bounce signed-in agents to
  `/home` (`middleware.ts:55-59`). The routes live under `/settings`.
- **Live DDL**: the Phase 2 migration takes an ACCESS EXCLUSIVE lock on
  `viewings` and changes two live RLS policies. Mitigations: a short
  rehearsal at a quiet hour, `lock_timeout = '3s'`, and the cross-tenant
  and privilege checks.
- **Merge risk**: `vercel.json`, `settings-view.tsx`, `calendar-view.tsx`,
  `data/calendar.ts`, `calendar-feed-token.ts`, the legal pages,
  `landing.json` and `llms.txt` are shared with plans 009–017 and other
  sessions. Stage named paths only, pick migration timestamps after every
  reserved slot, and follow the ownership table in "Until this ships".
- **GDPR**: client names, addresses and (optionally) notes are copied into
  the agent's Google account, where LeadWing loses control once written.
  Mitigations: notes off by default and the hide-names toggle (both Phase 2),
  never copying phones, emails or amounts from the record, the privacy text,
  deleting the calendar on disconnect by default, and linked events being
  patched or deleted whatever their age, so an erasure in LeadWing reaches
  Google while the agent stays connected.
- **Scope creep toward option D** (primary calendar, clash detection) would
  need a broader scope and a new review. Keep it a separate, incremental
  consent.

## Overlaps with other plans

- **Plan 004** (ICS compliance, TODO):
  - Phase 0 executes it. Its drift check reports `dae512b` and `1b94d32`;
    that is expected.
  - 004 marks `calendar-sync-dialog.tsx` out of scope, but this plan rewrites
    that dialog, so run 004 first.
  - 004's cache header and this plan's title fix touch the same `route.ts`;
    do both in one pass.
- **Plan 007** (email automation):
  - It reuses this plan's OAuth helpers, `token-crypto.ts` (D9) and
    `cron-auth.ts` (D22).
  - Gmail sending would be a new scope in a Cloud project, with its own
    verification. Put it in the "LeadWing Calendar" project only if the
    founder wants one consent for both; that changes the project's name and
    review.
  - It stores its Gmail tokens as this plan's single text blobs through
    `token-crypto.ts` (AAD `mail:<agentId>`, E7), not Vault (batch decisions
    D-A and D-B, 17 Sep 2026; replaces 007 §4's Vault design).
  - Corrections to 007: `gmail.send` is **not** on Google's restricted-scope
    list (checked 16 Sep 2026), and the Vercel plan is **Pro** (per-minute
    cron), not Hobby (007 §2).
- **Plan 009** (outreach tracking): its reminder link now lives in
  `src/components/calendar/event-row.tsx:40`, not `calendar-view.tsx:240`.
  It also edits `CalendarEvent.contact` in `src/lib/data/calendar.ts`. This
  plan edits `calendar-view.tsx` (the toolbar at `:263`) and viewing
  `ends_at` in `data/calendar.ts`. Sequence them or merge carefully.
- **Plan 010** (feature pages): its `viewing-scheduler` / `agenda-visitas`
  page is titled "Viewings, reminders and Google Calendar". It must use the
  interim one-way wording until Phase 5a.
- **Plan 011** (export):
  - It edits `privacy.{en,es}.tsx`, `terms.{en,es}.tsx` and `LEGAL_UPDATED`,
    as Phase 1 does. Take the later date.
  - It adds a Data panel after `PreferencesPanel`, the same spot as this
    plan's panel. Order: Preferences, Google Calendar, Your data.
  - Its maintenance note puts every new table into the ZIP. The sync tables
    are operational metadata: **export a "Google Calendar connected:
    yes/no" field in `account.csv`, plus the agent's `calendar_change_log`
    rows (client history), never tokens, links or outbox rows.**
- **Plan 012** (import):
  - It reserves migration `20260916150000`.
  - Its Step 15 rewrites FAQ items, `faq.ts` and `llms.txt`, the same files
    as Phases 0 and 5. Coordinate the edits and the `PUBLISHED` bumps.
  - It changes `src/lib/actions/notifications.ts`; this plan's only edit
    there is the one-line place label (Step 2.7).
  - Imported clients don't touch calendars.
- **Plan 008** (inverse matching): no file overlap.
- **Plan 014** (portal lead inbox):
  - It adds `/api/cron/inbox`, uses `CRON_SECRET` through the D22 helper
    and answers 401 when the secret is unset (aligned 17 Sep 2026). It is
    one of the four cron plans (E3) and runs the same E2 fallback check
    before adding its route.
  - It edits the legal pages (privacy §6, Resend's purpose), `llms.txt:51`,
    `landing.json:263-266`, `about` and `PUBLISHED`.
  - It treats Resend's new purpose as "no annex D notice", the same position
    as D20.
- **Plan 015** (agencies and registrations):
  - Example migration `20260922120000_agencies.sql`; this plan's migrations
    must not take that slot.
  - It edits `llms.txt:47`, `crm-marbella.es.tsx:52-55` and `PUBLISHED`.
  - It adds interview scores F (money) and G (registrations); D21 uses H.
    Plan 014 uses I (portal enquiries), plan 017 uses J (WhatsApp) and plan
    016's phone-alert question is K (letters aligned 17 Sep 2026).
  - Registration-expiry reminders could later be pushed as all-day events
    through this outbox under a new `source_kind` (event-id letter `r`),
    and viewings linked to a registration become push-only (D3).
- **Plan 016** (real contact and reminders):
  - It adds an hourly `/api/cron/notifications` (401 on an unset or wrong
    secret, logged as `cron_secret_missing` / `cron_secret_mismatch`, plus
    the non-production `?agent=` guard) and generates `CRON_SECRET` as 64
    hex characters with a copy in `.env.local` (P7). D22 adopts its format
    and its guard; all four cron plans now answer 401 (D-C). Its Phase 2
    is the expected creator of `cron-auth.ts` and `CRON_SECRET`, unless
    013, 014 or 017 lands first.
  - Its optional Step 21b fallback (`pg_cron` + `pg_net`) is the batch's
    only Vault use: it stores `CRON_SECRET` in Vault, and must schedule
    every route/schedule pair in `vercel.json`'s `crons` block as its own
    job, with `x-vercel-cron-schedule` set to the exact schedule string
    (including `/api/cron/calendar-sync`, every 5 minutes), before that
    block is removed (D-B, D-C). Step 21b also defines the "fallback
    active" check that Step 2.8 runs first (E2).
  - Its hourly route may be joined by a Phase 3 `/api/cron/push` (E3).
  - Its example migration slot is `20260917120000`.
  - It edits `src/lib/data/calendar.ts`, `src/lib/calendar-feed-token.ts`,
    `settings-view.tsx`, `settings/page.tsx`, the reminder clause of
    `faq.items.calendar.a` and `llms.txt:52` ("in-app reminders"). The
    merged table in "Until this ships" holds the combined text.
  - Its P8 fallback (`pg_cron` + `pg_net`, or a protection-scope change) is
    the agreed answer if Deployment Protection blocks the first cron run.
  - Google popup reminders cover calendar events when LeadWing is closed,
    but not client nudges.
- **Plan 017** (WhatsApp coexistence):
  - It adds `/api/cron/whatsapp` every 5 minutes (`*/5 * * * *`) plus a
    daily `15 3 * * *` retention run on the same path, which it tells apart
    by the `x-vercel-cron-schedule` header (batch decision E3), and uses the
    same `CRON_SECRET`.
  - It stores its Meta tokens through this plan's `token-crypto.ts` and
    `INTEGRATION_TOKEN_KEY` as single text blobs, with no Vault or
    `WHATSAPP_DATA_KEY` (D-A, D-B). AAD contexts: `whatsapp:<agentId>`
    (token), `whatsapp-body:<agentId>` (message bodies) and
    `whatsapp-payload:<sha256>` (raw webhook payloads, UTF-8 JSON text).
    Its `seal.ts` stays as a thin wrapper over `encryptSecret`/
    `decryptSecret` with no key of its own (E7). Its separate
    `WHATSAPP_NUMBER_HMAC_KEY` follows the same custody steps as
    `INTEGRATION_TOKEN_KEY` (D-I, E1; Step 1.2).
  - Its D8 (Meta as "a service you connect") matches D20.
  - It lists `llms.txt:52` under "leave alone"; the merged row keeps its
    WhatsApp phrase unchanged.
  - Meta business verification needs the same legal-entity details (P1).
  - It edits `settings-view.tsx`.

## Test plan

- **Unit tests**, all in CI:
  - Phase 0: `ics` (plan 004) and the feed route (titles, foreign embeds,
    404)
  - Phase 2: `token-crypto`, `cron-auth`, `google/errors`, `google/oauth`,
    `google/calendar-api`, `event-id`, `event-mapping`, `source`, `push`,
    `run`, the start and callback routes, the cron route,
    `validation/calendar`, and the `calendar-sync` actions (disconnect in
    every state, throttle)
  - Phase 4: `pull`, with fixtures and `fake-google` (including per-item
    failures, the three-way conflict rule, `If-Match`, past events,
    duplicates and recurring exceptions)
  - Phases 6 and 7: the task mapping, toggles and the notify route
- **Gates**: `npm run typecheck && npm run lint && npm test && npm run build`.
- **Database**: the Step 2.1 and Step 4.1 rehearsals print only `ok` lines
  (Step 2.1 check 9 may print `SKIP`), including the service-role, anon,
  lapse-and-reconcile and cross-tenant checks, and the post-apply checks
  pass.
- **UI**: preview-tmp renders of every panel, dialog and notice state, in
  both languages, at 375 px and at desktop width.
- **Production, signed out** (Claude):
  - the cron without a secret gets 401
  - the start route gets 307 to `/login`
  - the cron logs show 200 every 5 minutes
  - the landing, `llms.txt` and content pages carry the right copy for the
    phase
- **Production, signed in** (the founder): Step 1.1.8 (login smoke test),
  and the Step 2.12 and Step 4.3 checklists.
- **Optional Google-side check**: read-only listing of the LeadWing calendar
  through a Google Calendar connector, if the session has one.

## Done criteria

- **Phase 0**:
  - No page, JSON-LD, `llms.txt`, dialog or settings hint claims sync that
    doesn't exist.
  - The feed folds lines, is `private, no-store`, titles viewing
    appointments correctly, and never shows another agent's client or
    property.
  - Live before 21 Sep 2026.
- **Phase 1**: the legal pages are final and describe the Google Calendar
  connection with both Limited Use statements; the login project is
  unchanged and Google sign-in works; the courtesy email is sent.
- **Phase 2**:
  - An agent can connect, disconnect (in every state), reconnect and
    recreate.
  - Every appointment and dated viewing in the window is mirrored within
    seconds (or at worst 5 minutes), with popup reminders on the phone,
    including cascades, renames and property edits; linked events outside
    the window are still updated or removed.
  - A change made during a lapse reaches Google after reconnecting.
  - Tokens are stored encrypted and readable only by `service_role`.
  - The migration is live with its history row.
  - The cron runs.
- **Phase 3**: the app is verified, and `GOOGLE_CALENDAR_ACCESS=open`.
- **Phase 4**: time, title, location and notes edits, deletions and new timed
  events flow back per D3–D5 and D14, past events stay as LeadWing recorded
  them, removed meetings can be restored, and there are no loops or
  duplicates in a week of pilot use.
- **Phase 5a**: the copy says "syncs to Google Calendar" (one way). **Phase
  5b**: the copy says two-way, and only then.
- CI passes at every phase.
- `plans/README.md` row 013 shows the phase reached.

## STOP conditions

Report back with what you saw, what you ran and the exact error text (never
secrets), then wait.

- **Decisions**: the founder hasn't confirmed the Decisions table. Phase 0
  may proceed after its wording is approved; everything else stops.
- **Interview gate**: D21 hasn't passed (or been waived in writing) and
  Step 1.2 or Phase 2 is next. Report the H count.
- **Drift**: plans 014–017 changed `vercel.json`, `settings-view.tsx`,
  `src/lib/data/calendar.ts` or `src/lib/calendar-feed-token.ts` in a way
  "Current state" doesn't describe (for example, a `crons` block with a
  different cron-auth helper, or a new feed-token format). Report the diff
  and the plan it came from.
- **Plan 004**: it hasn't landed, and its changes conflict with Step 0.2.
  Reconcile, or report. (Its reported drift on `dae512b` / `1b94d32` alone
  is not a stop.)
- **Google console**:
  - **Google sign-in fails** after any console change (Step 1.1.8), for
    any account. Report the error screen text and undo the last console
    change if the founder agrees.
  - Brand verification names `supabase.co`, a `<ref>.supabase.co` host, or
    any domain other than `leadwing.app`. Report the message; don't add
    domains.
  - The Cloud console marks `calendar.app.created` as **restricted** (that
    would bring CASA). Report it before building further.
  - Anything seems to need `calendar`, `calendar.events` or any scope beyond
    `calendar.app.created`. That is option D and needs the founder.
- **Env and CLI**:
  - `vercel env ls` or `vercel env add` prompts for input after
    `vercel link`, or the link targets a project other than `lena-crm`.
  - `CRON_SECRET` already exists with a format other than D22's, or
    `INTEGRATION_TOKEN_KEY` already exists (from plan 007 or 017) with a
    different version scheme. Don't overwrite either; report.
- **Migrations**:
  - The live DB already has `calendar_connections`, or a migration timestamp
    collides with, or sorts before, a reserved slot or an applied file.
  - Any rehearsal check fails, above all if `authenticated` or `anon` can
    read `calendar_tokens`, the outbox or the links, can truncate a sync
    table, or can execute any `calendar_*` function.
  - **The live app errors while the rehearsal or the apply runs** (the DDL
    holds locks), or the apply hits `lock_timeout` twice.
- **Cron**: the first production cron runs return a Vercel Authentication
  page (401/403), or no log appears within 15 minutes. Don't change
  Deployment Protection without the founder (D22's fallback).
- **OAuth**: the token exchange fails in the pilot because of PKCE (report,
  then drop PKCE and keep the user-bound state).
- **Pilot**:
  - **The LeadWing calendar doesn't show** in Google Calendar on the web or
    in the phone app after connecting, or **popup reminders don't fire** on
    the phone (the copy promises them). Report the device and the
    CalendarList `selected` value.
  - A duplicate or missing event appears that the logs can't explain.
  - The "insert → 409 → patch confirmed" path fails against real Google.
  - The lapse rehearsal (Step 2.12.5.6) leaves the deleted event in Google.
  - **A pull fails on the same page twice** (`last_error = 'pull_stuck'`).
  - Stop before Phase 3 or Phase 4 in any of these cases.
- **Security**:
  - Any code path would pass an agent id taken from request input into the
    service-role client (beyond the non-production `?agent=` guard).
  - A test or check shows another agent's rows, names or addresses.
  - A token, a client name or a phone number appears in logs or error
    responses.
- **Legal**: `legalEntityPending()` is still true when Phase 3 is about to be
  submitted.

## Maintenance notes

- **A new calendar-bearing record** (for example registration expiries):
  - Add a `source_kind`, an event-id letter within `a–v` (`a`, `v` and `t`
    are used; `r` is reserved), a trigger calling `calendar_enqueue` (with
    an agent filter), a mapping case, a reconcile clause in
    `calendar_enqueue_backfill`, and a pull rule (default: push-only).
  - Update the privacy text if new data types go to Google.
- **Title or description format changes** re-push every event in the window
  on the next change. For a deliberate format change, run a backfill per
  agent spread over cycles, not all at once. For the calendar's own
  description, bump `CALENDAR_META_VERSION`.
- **Key rotation** (one runbook for every `INTEGRATION_TOKEN_KEY` user: 007,
  013 and 017, whose secrets are all single text blobs, D-A):
  1. The current key exists only in Vercel and the founder's password
     manager (a Sensitive variable can't be pulled back, D-I). The founder
     pastes it from the password manager into the Vercel dashboard as the
     Sensitive `INTEGRATION_TOKEN_KEY_PREVIOUS` (never into chat), and Claude
     sets `INTEGRATION_TOKEN_KEY_PREVIOUS_VERSION` to the current version.
     Then `INTEGRATION_TOKEN_KEY` gets a new key and
     `INTEGRATION_TOKEN_KEY_VERSION` the next version (`k2`, …). Claude
     creates the new key after the founder's OK with the E1 steps (Step
     1.2): `openssl rand -base64 32` (with `tr -d '\n'`) into a 0600 file
     in the session scratchpad, piped into `vercel env update INTEGRATION_TOKEN_KEY
     production --sensitive --yes` (the name already exists), the file path
     given to the founder to copy into the password manager, and `rm -P`
     on the file once the founder confirms. The value is never printed in
     chat, logs or commits. `WHATSAPP_NUMBER_HMAC_KEY` (017) is created
     with the same custody steps.
  2. Deploy.
  3. Re-encrypt inside the deployment, not from a pulled env file: **don't
     rely on `vercel env pull` for these keys** (Sensitive values can't be
     pulled back, D-I). Deploy a one-off server-side job (for example a
     route behind `authorizeCron`) that reads every blob (the
     `calendar_tokens` text columns, 007's mail tokens, and 017's token,
     message bodies and raw payloads) and rewrites each one where
     `needsReencrypt(blob)` is true, using `decryptSecret` then
     `encryptSecret` with the same D9 AAD context (`calendar:`, `mail:`,
     `whatsapp:`, `whatsapp-body:` or `whatsapp-payload:`). Remove it
     afterwards. No local script ever holds either key (E1): never copy a
     key into `.env.local`, and the scratchpad holds only step 1's 0600
     file until `rm -P`.
  4. Check with a `SUPABASE_DB_URL` query that no blob still starts with the
     old version prefix (for example `k1.`), then remove the previous key
     and redeploy.
- **Scope changes** (adding `gmail.send`, `calendar.freebusy` or anything
  else) mean a new verification. Use incremental consent, and update the
  privacy page and the demo video.
- **Watch Google's quota and billing notices** (quota page, release notes),
  and revisit Phase 7 before polling grows costly or nears the 1M/day
  ceiling.
- **Account deletion** is manual today. The runbook must disconnect Google
  Calendar (delete the calendar, revoke the token) before deleting the user.
  If self-service deletion is ever built, do this in code first.
- **Plan 011's export** lists only "Google Calendar connected: yes/no" plus
  the change log. Never export tokens, links or outbox rows.
- **`appointmentTitleFor` and `appointmentPlaceFor`** are the single source
  for titles and place labels in the app, the feed, the bell and Google.
  Never build a title elsewhere.
- **Calendar data pulled from Google never feeds the OpenRouter/OpenAI
  features** (message drafting, lead extraction) or any model training.
  If an AI feature ever reads appointments, exclude rows imported from
  Google and fields last changed by Google, or update the privacy text and
  the Limited Use review first.
- **The ICS feed stays** as the path for other apps. Keep it working, and
  keep its copy saying "read-only".
- **Shared strings**: plan 016 Step 0.1 applies every plan's "Until this
  ships" table (013–017) in one commit (D-G), so the ownership table here
  still decides which plan owns each shared line.
- **Reviewer notes** (16 Sep 2026 review):
  - *D12, Public Suffix List*: the review said `supabase.co` is not on the
    Public Suffix List. It is, in the private section (list version
    2026-09-15, lines 15991–15993: `supabase.co`, `realtime.supabase.co`,
    `storage.supabase.co`). So the login client's registrable domain is the
    project host `<ref>.supabase.co`, not `supabase.co`. The conclusion
    still holds: the founder can't verify that host in Search Console, so
    D12 is reversed anyway. The STOP condition names both forms.
  - *Interim delay wording*: the review suggested "can take up to a day".
    The plan says "a day or more", because the third-party reports it
    cites mention up to 48 hours.
  - *Notes default*: the review offered notes off or a clarified
    always-on. The plan takes notes off by default (privacy by default),
    and keeps names on, because an event without a name is of little use
    on the phone. D7 lists names hidden by default as the alternative.
  - *"Link exists, source gone" in the pull*: the review asked for a row.
    It enqueues a `delete` instead of calling `deleteEvent` directly, so
    deletes keep one path (the drain, with `If-Match` and version-guarded
    acks).
- 17 Sep 2026 (second pass): applied shared decisions D-A…D-I from the plan batch alignment. Third pass (same day, shared decisions E1–E3 and E7): key custody via a 0600 scratchpad file, `vercel env add … --sensitive`, the founder's password manager and `rm -P` (Step 1.2, P6, key rotation; E1); the `pg_cron` "fallback active" check before any cron entry (D22, Step 2.8; E2); 017's cron cadence and 014's `/api/cron/inbox` among the cron users (E3); `token-crypto.ts` exports only three functions, the full AAD context list, 017's `seal.ts` as a keyless wrapper, and `encryptSecret` in the connect step and `connection.ts` (D9, Step 2.2, Step 2.4's `connection.ts`, Step 2.5; E7).

## Sources (checked 2026-09-16)

"Verified" means the page was opened and read on that date. "Not verified"
marks claims taken from search snippets or not stated on any page read.

- Calendar API scopes (page updated 2026-09-03): the descriptions of
  `calendar.app.created`, `calendar.events`, `calendar.events.owned` and
  `calendar.freebusy`. The page doesn't state sensitivity classes.
  https://developers.google.com/workspace/calendar/api/auth (verified)
- **Not verified**: whether `calendar.app.created` is sensitive. Google's own
  example of a sensitive scope is reading Calendar events, so this plan
  assumes verification is needed. The console badge is authoritative.
  https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification
- Restricted-scope list (Gmail, Drive, Fit, Chat, Data Portability, Photos
  Ambient, Health). No Calendar scope and no `gmail.send`, so CASA doesn't
  apply to Calendar.
  https://support.google.com/cloud/answer/13464325?hl=en (verified)
- Sensitive-scope verification (page updated 2026-08-19): privacy policy,
  homepage, Search Console domain ownership, per-scope justification, an
  unlisted demo video, "typically takes 3-5 business days". Also: "Google
  Workspace organization administrators might restrict access to sensitive
  scopes to prevent access by OAuth client IDs that the organization doesn't
  explicitly mark as trusted." 
  https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification
  (verified)
- Verification requirements: the privacy policy must disclose Google user
  data handling and sit on the homepage's domain; the homepage can't be only
  a login page; the video must show the full consent screen in English.
  https://support.google.com/cloud/answer/13464321?hl=en (verified)
- Brand verification (page updated 2026-08-19): required for External,
  published apps with a name or logo; minutes (automated) or 2–3 business
  days (manual); a prerequisite for data-access verification. The authorized
  domains "need to include the redirect URIs or JavaScript origins
  authorized in your 'Web application' OAuth client types", and their
  ownership must be verified in Search Console. The page says nothing about
  third-party domains.
  https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
  (verified)
- Unverified apps: the warning screen and a lifetime cap of 100 new users.
  https://support.google.com/cloud/answer/7454865?hl=en (verified)
- Publishing status: set per project ("Projects configured with a
  publishing status of Testing are limited to up to 100 test users");
  refresh tokens expire after 7 days in Testing; apps asking only for name,
  email and profile are exempt (no test-user list, no warning, no 7-day
  expiry). Nothing about moving from In production back to Testing.
  https://support.google.com/cloud/answer/15549945?hl=en (verified)
- Refresh-token expiry causes (page updated 2026-05-26).
  https://developers.google.com/identity/protocols/oauth2 (verified)
- Web-server OAuth flow: `access_type=offline`, `prompt=consent`,
  `include_granted_scopes` (the new token "will also cover any scopes to
  which the user previously granted the application access"), `state`
  (recommended against CSRF), granted scopes in the token response, granular
  consent, and revoke at `oauth2.googleapis.com/revoke`. **Not verified**:
  PKCE for web clients (not described on the page), and what revoking one
  part of a combined grant does (not described).
  https://developers.google.com/identity/protocols/oauth2/web-server
- Google API Services User Data Policy (updated 2024-02-15): Limited Use for
  sensitive and restricted scopes, a privacy policy, minimal scopes. The
  exact disclosure sentence used in Step 1.3 is the widely used form; **not
  verified** as quoted text on that page.
  https://developers.google.com/terms/api-services-user-data-policy
- Workspace API user data policy (updated 2026-09-03): covers "Gmail,
  Google Chat, Google Drive, Google Sheets, and other Google Workspace APIs";
  no AI training beyond the user's own model; the required statement is
  "The use of information received from Google Workspace scopes will adhere
  to the Google User Data Policy, including the Limited Use requirements"
  (verified, used in Step 1.3). **Not verified**: that "other Google
  Workspace APIs" includes Calendar (likely; the statement is added anyway).
  https://developers.google.com/workspace/workspace-api-user-data-developer-policy
- Push notifications (updated 2026-09-11): HTTPS, headers, no body, no
  auto-renewal, `channels.stop`, 5xx retried.
  https://developers.google.com/workspace/calendar/api/guides/push (verified)
- `events.watch`: `ttl` defaults to 604800 s; `calendar.app.created` is
  accepted. The maximum TTL isn't documented.
  https://developers.google.com/workspace/calendar/api/v3/reference/events/watch
  (verified)
- Incremental sync (updated 2026-09-11) and `events.list` (updated
  2026-07-29): `nextSyncToken` on the last page, 410 → full sync, deleted
  entries always included with a `syncToken`, `showDeleted` allowed on a
  full list, the parameters that can't be combined with `syncToken`
  (`iCalUID`, `orderBy`, `privateExtendedProperty`, `q`,
  `sharedExtendedProperty`, `timeMin`, `timeMax`, `updatedMin`),
  `maxResults` 250/2500.
  https://developers.google.com/workspace/calendar/api/guides/sync and
  https://developers.google.com/workspace/calendar/api/v3/reference/events/list
  (verified)
- `events.insert` (updated 2026-07-07): client ids use base32hex, 5–1024
  characters, unique per calendar, and collisions "cannot guarantee" to be
  detected at creation; popup minutes 0–40320; `sendUpdates` all,
  externalOnly or none; `calendar.app.created` is accepted. No 409 behaviour
  is documented (**not verified**; test it in the pilot). Also: at most 5
  reminder overrides, and `updated` doesn't change on reminder-only edits.
  https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
  and https://developers.google.com/workspace/calendar/api/v3/reference/events
  (verified)
- Calendar resource (updated 2026-07-01): the read-only `dataOwner`, "email
  of the owner", set only for secondary calendars.
  https://developers.google.com/workspace/calendar/api/v3/reference/calendars
  (verified). **Not verified**: that the `calendars.insert` response already
  carries `dataOwner`; the panel falls back to "Connected".
- `calendars.insert`: `calendar`, `calendar.app.created` and
  `calendar.calendars` are accepted, and the requester becomes the data
  owner. The single data owner applies since 10 Nov 2025.
  https://developers.google.com/workspace/calendar/api/v3/reference/calendars/insert
  and https://developers.google.com/workspace/calendar/release-notes (verified)
- `calendars.delete` (updated 2026-05-12): `calendar.app.created` is
  accepted; secondary calendars only.
  https://developers.google.com/workspace/calendar/api/v3/reference/calendars/delete
  (verified)
- Quotas (updated 2026-09-11): 10,000 requests/min per project and 600/min
  per user; free, with charges for exceeding quota "planned … later in 2026"
  and "at least 90 days' notice"; 1,000,000 requests/day per project free,
  and "You cannot request an increase on this daily threshold limit";
  403/429 usageLimits with backoff; tiering announced 1 May 2026.
  https://developers.google.com/workspace/calendar/api/guides/quota (verified)
- Subscribing by URL: "To subscribe to a new calendar, you must use a
  computer web browser"; no refresh interval is given.
  https://support.google.com/calendar/answer/37100?hl=en (verified)
- Vercel cron pricing and limits (updated 2026-07-15): 100 jobs per project,
  Pro down to once a minute, only production deployments are invoked.
  https://vercel.com/docs/cron-jobs/usage-and-pricing (verified)
- Managing cron jobs (updated 2026-08-11): `CRON_SECRET` sent as
  `Authorization: Bearer …`, no retries, best-effort delivery with possible
  duplicates, redirects not followed, overlapping runs possible, a 404 path
  still invoked.
  https://vercel.com/docs/cron-jobs/manage-cron-jobs (verified)
- **Not verified** for this project's protection setting: that cron
  invocations pass Deployment Protection. The GA changelog mentions support.
  https://vercel.com/changelog/vercel-cron-jobs-are-now-generally-available
- Function duration (updated 2026-08-24): Pro with fluid compute defaults to
  300 s, with a maximum of 800 s; `maxDuration` is a named export in App
  Router route files.
  https://vercel.com/docs/functions/configuring-functions/duration (verified)
- Fluid compute prices (updated 2026-06-16): $0.60 per million invocations;
  fra1 Active CPU $0.184/h; memory $0.0152/GB-h.
  https://vercel.com/docs/functions/usage-and-pricing (verified)
- Supabase Vault: libsodium AEAD; the root key is outside the DB;
  `decrypted_secrets` must be locked down with privileges.
  https://supabase.com/docs/guides/database/vault (verified)
- Supabase Google login: sensitive scopes may trigger verification; provider
  refresh tokens need `offline` plus `consent`; Supabase doesn't refresh
  provider tokens.
  https://supabase.com/docs/guides/auth/social-login/auth-google (verified)
- Live Supabase project `shetahkkkvcwgxkuqmwe`, read-only catalog queries
  (16 Sep 2026, run twice): `pg_policies` on appointments, viewings,
  clients and properties; `pg_default_acl` (`arwdDxtm` for anon and
  authenticated on new public tables); `pg_db_role_setting`
  (authenticator: `statement_timeout=8s`, `lock_timeout=8s`,
  `session_preload_libraries=supautils, safeupdate`); 0 cross-tenant
  references; `appointments` indexes;
  Postgres 17.6; `supabase_vault` 0.3.1 installed; `pg_cron` 1.6.4 and
  `pg_net` 0.20.3 available; the migration list; row counts; role timeouts.
  (verified)
- Microsoft Graph subscriptions: at most 10,080 minutes for Outlook events;
  lifecycle notifications.
  https://learn.microsoft.com/en-us/graph/api/resources/subscription?view=graph-rest-1.0
  (verified)
- Microsoft publisher verification: needs a Partner Program account and an
  Entra work account; free; consent limits for unverified multitenant apps.
  **Not verified**: whether `Calendars.ReadWrite` needs admin consent in
  typical tenants.
  https://learn.microsoft.com/en-us/entra/identity-platform/publisher-verification-overview
- Witei: a help article dated 26 Feb 2021 says edits sync both ways ("Tanto
  si editas el evento en Calendar como si lo editas en Witei…") and that new
  tasks sync too; it doesn't say which Google calendar events land in.
  **Current status not re-checked.**
  https://get.witei.com/es/articulos/witei-google-calendar/ (verified)
- InmoCMS: claims two-way Google Calendar sync. **Not verified** (search
  snippet only). https://inmocms.com/calendario-inmobiliario/
- Nylas pricing: Free 5 accounts; Essentials $15 with 10 accounts, then $2.25
  each; Pro $49 ($43 annual) with 25 accounts, then $2.00 ($1.75) each; a
  shared OAuth app only on Pro Annual and Enterprise.
  https://www.nylas.com/pricing/ (verified)
- npm (`npm view`): `googleapis` 181.0.0 is 214 MB unpacked;
  `@googleapis/calendar` 20.0.0 is 847 KB; `google-auth-library` 11.1.0 is
  602 KB; `@microsoft/microsoft-graph-client` 3.0.7 is 1.25 MB. (verified)
- Bundled Next 16 docs:
  `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`,
  `01-app/01-getting-started/07-mutating-data.md:206` ("The client currently
  dispatches and awaits them one at a time") and
  `03-file-conventions/02-route-segment-config/{index,maxDuration}.md`
  (read 2026-09-16).
- **Added in the 16 Sep 2026 revision** (all checked that day):
  - Public Suffix List (version 2026-09-15_10-18-26_UTC): `supabase.co`,
    `realtime.supabase.co` and `storage.supabase.co` are listed in the
    private-domains section (lines 15989–15995).
    https://publicsuffix.org/list/public_suffix_list.dat (verified)
  - Supabase custom domains: "a paid add-on for projects on a paid plan";
    the project URL is otherwise shown on OAuth consent screens.
    https://supabase.com/docs/guides/platform/custom-domains (verified).
    Price: "$0.0137 per hour ($10 per month)".
    https://supabase.com/docs/guides/platform/manage-your-usage/custom-domains
    (verified). This project's Supabase plan is **not verified**.
  - Asking Google's reviewer to accept the third-party Supabase domain:
    **not verified** (a third-party blog; the page didn't load for this
    check).
    https://www.supascale.app/blog/supabase-google-oauth-branding-without-custom-domain
  - CalendarList resource (updated 2026-07-29): `selected`: "Whether the
    calendar content shows up in the calendar UI. Optional. The default is
    False." Whether `calendars.insert` selects the new calendar on its own
    is **not verified**.
    https://developers.google.com/workspace/calendar/api/v3/reference/calendarList
    (verified)
  - `calendarList.patch` (updated 2026-05-12) and `calendars.patch` (updated
    2026-05-12) accept `calendar.app.created`.
    https://developers.google.com/workspace/calendar/api/v3/reference/calendarList/patch
    and https://developers.google.com/workspace/calendar/api/v3/reference/calendars/patch
    (verified)
  - `events.patch` (updated 2026-07-01): "Array fields, if specified,
    overwrite the existing arrays; this discards any previous array
    elements." Nothing is said about explicit nulls (the plan sends them;
    confirm in the pilot).
    https://developers.google.com/workspace/calendar/api/v3/reference/events/patch
    (verified)
  - Conditional modification (updated 2026-09-11): `If-Match` with the
    etag; otherwise "you will get a 412 (Precondition failed)".
    https://developers.google.com/workspace/calendar/api/guides/version-resources
    (verified)
  - Subscribed-calendar refresh times of 8–24 hours, sometimes up to 48:
    **not verified** (a Google Calendar community thread and a vendor blog).
    https://support.google.com/calendar/thread/9037280 and
    https://www.usecarly.com/blog/google-calendar-ics-refresh-rate/
  - The OAuth `error_subtype=admin_policy_enforced` parameter for a
    Workspace admin block: **not verified**; the callback falls back to
    `denied` if it is absent.
