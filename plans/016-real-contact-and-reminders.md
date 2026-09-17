# Plan 016: Quiet-client nudges from real contact, and reminders when the app is closed

> **Executor instructions**: Follow this plan phase by phase and step by step.
> Run every verification command and confirm the expected result before moving
> on. If a "STOP conditions" item occurs, stop and report; do not improvise.
> Every row in "Decisions" is still **open**: confirm the ones a phase needs with
> the founder before starting that phase. When a phase is done, update this
> plan's row in `plans/README.md` (add row 016 if it is missing).
>
> **Drift check (run first)**:
> `git diff --stat 9bad570..HEAD -- src/lib/data/attention.ts src/lib/attention.ts src/lib/actions/notifications.ts src/lib/notifications.ts src/lib/data/dashboard.ts src/lib/data/calendar.ts src/lib/data/session.ts src/lib/actions/clients.ts src/lib/actions/buyer.ts src/lib/actions/calendar.ts src/lib/actions/settings.ts src/lib/email.ts src/lib/site.ts src/lib/home.ts src/lib/time-zones.ts src/lib/calendar-feed-token.ts src/lib/supabase/types.ts src/components/notifications src/components/clients/whatsapp-button.tsx src/components/clients/message-composer.tsx src/components/clients/client-detail-view.tsx src/components/clients/client-sheet.tsx src/components/clients/clients-view.tsx src/components/clients/clients-screen.tsx src/components/clients/viewing-dialog.tsx src/components/date-time-picker.tsx src/components/shell/key-value.tsx src/components/home/upcoming-panel.tsx src/components/calendar/event-row.tsx src/components/landing src/components/settings/settings-view.tsx "src/app/(app)/settings/page.tsx" src/components/service-worker-register.tsx src/proxy.ts next.config.ts vercel.json messages/en messages/es src/app/llms.txt/route.ts src/content/pages src/content/legal src/lib/seo.ts src/lib/legal.ts supabase/migrations`
> Plans 011–015 and 017 may have landed first, so their files can show up.
> For anything else that changed, compare it against "Current state" first. A
> mismatch you can't reconcile is a STOP condition.
>
> **Shared working tree**: other Claude sessions may be editing this checkout at
> the same time. Never `git add -A`, and don't touch changes you didn't make.
> Plans 013, 014, 015 and 017 edit the same copy files as phase 0
> (`landing.json`, `billing.json`, the `llms.txt` route, the content pages,
> `PUBLISHED` in `seo.ts`), and phase 1–2 share `types.ts`, `clients.ts` and
> `messages/*` with other plans. So, for every file you stage:
> 1. Run `git diff <path>` and read every hunk.
> 2. If every hunk is yours, `git add <path>`. Otherwise stage only your
>    hunks: `git diff <path> > <scratchpad>/<name>.patch`, delete the other
>    session's hunks from the patch, then
>    `git apply --cached <scratchpad>/<name>.patch`. (`git add -p` needs an
>    interactive terminal, which this environment doesn't have.)
> 3. If a single hunk mixes your lines with another session's, build the
>    commit from a temporary index instead (the recipe from the iOS Safari
>    session):
>    1. Write your version of the file (HEAD plus only your changes) to the
>       scratchpad.
>    2. `export GIT_INDEX_FILE=<scratchpad>/index && git read-tree HEAD`
>    3. `git update-index --add --cacheinfo 100644,$(git hash-object -w <scratchpad file>),<path>`
>       for each such file.
>    4. `git commit-tree $(git write-tree) -p HEAD -F <message file>`, then
>       `unset GIT_INDEX_FILE`.
>    5. `git update-ref refs/heads/main <new commit> <old HEAD>`, then
>       `git reset -q -- <paths>` so the real index matches the new HEAD. The
>       working tree keeps the other session's edits.
> 4. Before committing, check `git diff --cached` shows only your changes. If
>    you can't separate the hunks, STOP.
>
> Use your own folder under `src/app/preview-tmp/`, and never delete the whole
> `preview-tmp` folder.

## Status

- **Priority**, by phase:
  - Phase 0 (honest copy for every overclaim, one commit): P0. It must be
    live before the agent outreach starts on Mon 21 Sep 2026.
  - Phase 1 (real contact tracking): P1. It fixes a correctness bug behind a
    live claim, so it needs no interview gate.
  - Phase 2 (scheduled generation and a morning email): P2. It becomes P1 if
    its interview gate passes (see "Gated by").
  - Phase 3 (web push): P3.
- **Effort**, by phase:
  - Phase 0, one consolidated interim-copy commit: S (0.5–1 day)
  - Phase 1, real contact tracking and a new quiet rule: M–L (3–4 days).
    About 20 files: the migration with its rehearsal and live apply, the
    beacon route, hook and library, 3 new and about 11 edited components, the new
    quiet rule with its fake-client tests, EN/ES copy, visual checks and a
    real-iPhone pass.
  - Phase 2, scheduled generation and the morning email: L (4–5 days), plus
    at least 2 mornings of calendar time for the rollout (a founder test
    inside the 08:00–11:59 window, then a check the next morning). It moves
    about 340 lines and adds HTML and text email, a send state machine, the
    unsubscribe token, route and page, a settings panel, legal copy and env
    setup.
  - Phase 3, web push (conditional): L (3–4 days), plus device tests
  - Phase 4, later add-ons: S–M each
- **What can be live when** (as of Wed 16 Sep 2026):
  - **By Sun 20 Sep 2026, only phase 0 is live.** Target: land it Thu 17 or
    Fri 18 Sep.
  - **Phase 1** ships before outreach only if D1–D4, D14 and D15 are answered
    by Thu 17 Sep, the build is done by Sat 19 Sep, and the founder runs the
    iPhone test on Sat 19 Sep. At 3–4 days of work that is unlikely, so plan
    for Tue 22–Fri 25 Sep. Like plan 015's B1, don't apply its live
    migration between Fri 18 and Mon 21 Sep.
  - **Phase 2**: no earlier than late September, and only once its gate
    passes.
  - **Phase 3**: not before the interview checkpoint on Fri 9 Oct 2026.
- **Where it sits in the batch.** The 16 Sep competitive brief recommends this
  order: overclaims → import/export (011/012) → agencies (015) → 009 → 008 →
  closed-app reminders → 007. This plan maps onto it like this:
  - **Phase 0 is the "overclaims" step** for the whole batch. It applies the
    interim wording of plans 013, 014, 015 and 017 as well as this plan's
    (see Step 0.1).
  - **Phase 1 is plan 009's build.** It can run alongside 011, since the two
    share only `types.ts` and `plans/README.md`. If only one session is free,
    run 011 first.
  - **Phase 2 is "closed-app reminders".** It follows 011 and 012 unless its
    interview gate passes first.
  - **Phase 3** comes last, after the Fri 9 Oct checkpoint.
- **Risk**: MEDIUM.
  - Two migrations on the live database (phases 1 and 2). The phase 1
    migration also tightens three existing RLS policies, and creates or
    merges into the shared `clients_touch_updated_at` skip array (plan 015
    B1 may have created it first; Steps 1–2).
  - The first job that runs with the service-role client across every tenant
    (phase 2).
  - The first email LeadWing sends to agents unprompted (phase 2). It goes
    out from the domain that also sends the sign-in codes.
- **Depends on**: nothing hard. This is the build of design spike 009
  (`plans/009-outreach-tracking-design.md`), with the deviations listed under
  "Overlaps". It shares files with plans 007, 011–015 and 017 (see
  "Overlaps").
- **Gated by**:
  - Phase 0: founder approval of the wording (D12, D13).
  - Phase 1: decisions D1–D4, D14 and D15. No interview gate.
  - Phase 2: phase 1 live; decisions D5–D10; prerequisites P6–P13 and P16;
    and **one** of these:
    - B ("forgotten follow-up story") scores green in at least 3 of the
      first 5 interviews, and the answers to the proposed morning questions
      (P15) point to email, not the phone lock screen.
    - The Fri 9 Oct 2026 checkpoint shows the same.

    Otherwise, schedule phase 2 after plan 011.
  - Phase 3: D11, the P15 interview evidence read as **score K** ("phone
    alerts": green in at least 3 of the first 8 solo agents at the Fri 9 Oct
    2026 checkpoint), and two device tests.
- **Category**: feature
- **Planned at**: commit `9bad570`, 2026-09-16 (revised the same day after
  review)

## Why this matters

- **The site promises things the code doesn't do.**

  | Claim | Where | What the code does today |
  |---|---|---|
  | "hands you a ready-to-send follow-up before a lead goes cold" | `messages/en/landing.json:5` `hero.subtitle` | Flags buyers whose record wasn't **edited** for 7 days |
  | "let LeadWing handle the follow-up" | `landing.json:69` `howItWorks.body` | LeadWing drafts; the agent does the follow-up |
  | "Let LeadWing follow up" | `landing.json:80` `howItWorks.steps.followUp.title` | Same |
  | "LeadWing spots clients going quiet" | `landing.json:81` `howItWorks.steps.followUp.blurb` | Flags buyers whose record wasn't edited. Sellers are never checked, and messaging a buyer doesn't count. |
  | "Stop chasing. Let LeadWing do the follow-ups." | `landing.json:105` `deepDives.heading` | Same as `:69` |
  | "get a reminder before each one" | `landing.json:138` `deepDives.items.scheduler.body` | Reminders appear in the bell only while a LeadWing tab is open, and only for events that have a reminder set (see below) |
  | "LeadWing reminds you before each one" | `landing.json:277` `faq.items.calendar.a` | Same |
  | Demo: "Sent", "Follow-up sent", "WhatsApp reminder sent to {name}" | `landing.json:23` `mock.sent`, `:95` `howItWorks.tiles.followUp.sentToast`, `:15` `preview.toasts.reminderSent` | LeadWing opens WhatsApp; it can't know a message was sent |
  | "Auto-engage: Spots the clients going quiet and hands you a nudge" | `messages/en/billing.json:229-232` `pricingPage.features.autoEngage` | Same as `:81`, and nothing is engaged automatically |
  | "Month view with reminders" | `billing.json:243` `pricingPage.features.calendar.body` | Same as `:138` |
  | "Auto-engage: spots clients going quiet"; "month calendar with reminders" | `src/app/llms.txt/route.ts:49` and `:52` | Same (AI engines quote this file) |
  | "Auto-engage watches for clients who have gone silent" | four SEO content pages, EN and ES (listed under "Until this ships") | Same |

  The Spanish twins say the same thing. The ES demo tag `mock.quiet`
  ("# días sin contacto", `messages/es/landing.json:24`) already claims
  contact-based detection. The ES pricing card says "se están enfriando"
  (`es/billing.json:231`).
- **"A reminder before each one" isn't true even with the app open.**
  - `reminder_minutes` is nullable.
  - A viewing created from the client page defaults to no reminder
    (`src/components/clients/viewing-dialog.tsx:76-80`). Only viewings
    created from the calendar default to 30 minutes, and so do all meetings
    (`src/components/calendar/appointment-dialog.tsx:99`).
  - Live: 1 of 7 dated viewings has no reminder (probe, 16 Sep 2026).
  - Rows are generated only while a tab is open, so a reminder can first
    appear after the viewing has happened.
- **"Quiet" is measured wrongly.** `updated_at` means "row edited", so:
  - An agent who messaged a buyer yesterday is still told to follow up.
  - Starring, hiding or moving a buyer silences the nudge without any contact.
- **Nothing reaches an agent who isn't looking.** Notifications are created
  only by the bell, only while a LeadWing tab is open. Solo agents spend the day
  in cars and at viewings, not in a browser tab.
- **Outreach starts 21 Sep 2026.** Founding agents will test exactly these
  promises. The 16 Sep competitive brief lists this as one of the site claims
  to fix before outreach.
- **The nudges are noisy, and there is no real-agent data yet.** The live
  database holds 19 `follow_up` rows, 17 of them unread (probe, 16 Sep 2026).
  But almost all of them are the founder's own:
  - 13 rows (11 unread) are on the `is_admin` account.
  - 3 unread rows are on founding account `d4ec…`, which the 16 Sep pricing
    review identifies as the founder's own test checkout.
  - 3 unread rows are on one other account.

  So this shows that the nudges get ignored, not that they fail to reach
  agents. One likely reason: edits and contact are conflated, so the list
  doesn't match what the agent actually did.

## Decisions (open — founder to confirm)

Every row is **open**. The recommended answer is what this plan builds unless
the founder picks otherwise.

| # | Question | Recommended answer | Alternatives | Needed by |
|---|---|---|---|---|
| D1 | Contact data model | A thin `client_contacts` log (channel, source, optional note ≤ 500, `occurred_at`) plus a cached `clients.last_contacted_at` kept up to date by a trigger. The log exists so a manual "log a call" can keep an optional note ("what was agreed") and so a mistaken tap can be undone. Plan 007 sends, WhatsApp sync (plan 017) and plan 012 imports all add contact rows. | Plan 009's single column only: about half a day less work, but it can't store what was said or undo a mistaken tap. A required note (more friction on every call log). | Phase 1 |
| D2 | What counts as contact | **Yes**: <ul><li>the WhatsApp button</li><li>the composer's WhatsApp and email sends</li><li>the calendar WhatsApp reminder</li><li>plain `mailto:`/`tel:` taps, with an Undo toast</li><li>manual Call / Meeting / Other logs</li><li>a stage move from `new` to `contacted` (source `stage`)</li></ul>**Also yes, worked out when the rule runs**: a viewing or meeting with the buyer in the last 7 days, or booked in the next 7. **No**: any other record edit. | Count only explicit taps and manual logs (stricter, more false nudges); keep counting edits (keeps the overclaim) | Phase 1 |
| D3 | Where the quiet clock starts for clients with no logged contact | At `created_at`, with no backfill. The nudge then reads "no contact logged yet" instead of "quiet 60 days". | Start everyone at the launch date (hides real neglect for a week). Backfilling from `updated_at` is rejected: it invents contact data. | Phase 1 |
| D4 | Quiet nudges for sellers | Not in v1. Keep buyers only, and make the copy say "buyers". | Sellers at a 14-day threshold (a small change in `attention.ts` plus copy) | Phase 1 |
| D5 | Scheduler | Vercel Cron (the project is on Pro), hourly, with a `CRON_SECRET` bearer. After the first deploy, trigger it (`vercel crons run`, Step 21) and confirm our route answers 200. Vercel added Deployment Protection support to crons before GA (changelog, 15 Nov 2023), so a block is unlikely, but the project's protection covers exactly the `*.vercel.app` URLs a cron calls, and no page says how Standard Protection treats cron requests. If Vercel's own auth answers 401, switch to the `pg_cron` + `pg_net` fallback written out in Step 21b. That fallback schedules **every** route/schedule pair in `vercel.json`'s `crons` block as its own job, at the same cadence and with every header the route reads (including `x-vercel-cron-schedule`), before the block is removed; while it is active (Step 21b's check), new cron routes are `cron.schedule` migrations, not `vercel.json` entries. It is the batch's one accepted Vault use (it stores `CRON_SECRET`, see Step 21b). | `pg_cron` + `pg_net` from the start; a GitHub Actions schedule (best effort, rejected) | Phase 2 |
| D6 | Which time zone the bell uses once a cron also writes rows | The profile zone everywhere, with the week key taken from the agent's local date. The bell stops sending the browser's zone, so the bell and the cron write identical dedupe keys. | Keep the browser zone in the bell (duplicate "today" rows whenever the device zone differs from the profile's) | Phase 2 |
| D7 | Is the morning email on by default? | **On only for agents who signed in within the last 30 days** when the phase 2 migration runs, and for everyone who signs up afterwards. Everyone else starts with it off and gets one bell prompt that links to Settings. (Live, 16 Sep 2026: besides the founder's, 4 of the 10 accounts signed up 28 May–23 Jun, under the "Lena" name; 2 of them last signed in on 30 May, and one of those has an active buyer. After phase 1, D3 would flag that buyer, so that account would get a weekly email from a brand it never signed up under.) The first email opens with one line: "New: your morning summary. Turn it off here." It is sent only on days with something new in it, with a one-click unsubscribe and a Settings switch, and carries no promotion. The privacy page doesn't cover it yet: Step 20 adds it. The founder confirms the recipient list before go-live (P16). | On for every agent (emails dormant, pre-rename accounts from the domain that carries sign-in codes); opt-in during onboarding (the claim stays untrue for most agents); a weekly summary | Phase 2 |
| D8 | Digest time and contents | A fixed 08:00 in the profile zone. The email lists:<ul><li>today's viewings and meetings</li><li>tasks due today, plus tasks that became overdue yesterday by name; older overdue tasks as one "N overdue tasks" line, which never triggers a send on its own</li><li>reservation key dates within 5 days</li><li>offers **newly** flagged as stalled since the last digest</li><li>buyers newly flagged as quiet since the last digest (at most 5, then "and N more")</li></ul>Both "newly flagged" lists use the weekly `stalled_offer` and `follow_up` rows, so a still-stalled offer or still-quiet buyer comes back once a week, on the first digest of the ISO week, not every morning. It shows client names, counterparties and dates only (no phones, notes or amounts) and links to `/home`. Future producers follow the same rule: plan 014's new-lead alerts, and plan 015's registration-expiry and expected-payment reminders (never amounts). | A time picker (a later column); repeating every stalled offer, quiet buyer and overdue task daily (nagging: one stalled offer would mean an email every morning forever) | Phase 2 |
| D9 | Sender and Reply-To | From `LeadWing <reminders@leadwing.app>`, with Reply-To `info@leadwing.app` (ImprovMX forwards replies to the founder). Open and click tracking off; Resend keeps them off by default, per domain. Plan 007's client-facing sends should use a separate subdomain, so a buyer's spam complaint can't hurt agents' sign-in codes and digests. | `no-reply@leadwing.app`, the auth sender (replies go nowhere) | Phase 2 |
| D10 | A reminder email before each viewing | No in v1. The morning digest carries the day's agenda; alerts before an event wait for web push. | An opt-in "1 hour before" email on a 5-minute cron | Phase 2 |
| D11 | Web push | Later, and only if the P15 interview answers show that agents act on phone notifications today (past behaviour, not "would you"): **score K** (phone alerts) green in at least 3 of the first 8 solo agents at the Fri 9 Oct 2026 checkpoint. It also needs the iOS scroll regression pass and an iPhone test in Spain. | Build it now alongside the digest (+3–4 days, iOS risk); skip it for a WhatsApp message to the agent (needs Meta verification and the legal entity) | Phase 3 |
| D12 | Rename "Auto-engage" | Yes, to "Follow-up nudges" / "Avisos de seguimiento". The feature never engages anyone on its own; the agent always sends. | Keep the name and add a clarifying body line | Phase 0 |
| D13 | The interim wording for 21 Sep | Ship it before outreach in **one consolidated commit** that also carries the interim wording of plans 013, 014, 015 and 017 (Step 0.1). Then switch to the phase 1 and phase 2 wording as each lands. | Five separate copy commits from five sessions on the same files the weekend before outreach; leave the copy until phase 1 lands (outreach runs on an overclaim) | Phase 0 |
| D14 | Default reminder for new viewings | Yes: a new viewing defaults to 30 minutes wherever it is created, like meetings already do. Existing viewings keep their setting. The site still says "reminders you set" until phase 3. | Keep "none" on the client page (more events with no reminder) | Phase 1 |
| D15 | Who writes `clients.last_contacted_at` | **Only the `client_contacts` trigger.** Plan 017 inserts `client_contacts` rows and never updates the column. Its revised D6 (read 16 Sep 2026, ~21:15) already says so: outbound messages of linked contacts only, `channel 'whatsapp'`, source `whatsapp_phone` or `whatsapp_api` (its migration widens the check), and a row only when the message is more than 1 hour after the current `last_contacted_at`. The `updated_at` trigger keeps one shared skip array (plans 015, 016 and 017): whichever of 015 B1 or this plan's phase 1 lands first creates `clients_touch_updated_at`; every later migration reads the live function first and merges its own keys into the array, never overwriting it. | 017 writes the column with `greatest(…)` and 016's trigger computes `greatest(max(occurred_at), clients.last_whatsapp_out_at)` (two writers, a second column) | Phase 1 (before 017's phase 4) |

## Current state (verified 2026-09-16 at `9bad570`)

`git diff 9bad570..HEAD` is empty. The only uncommitted changes are plan files:
plans 011–017 are on disk (`plans/` checked 16 Sep 2026, ~21:00), uncommitted.

1. **The quiet rule**, `src/lib/data/attention.ts`:
   - `getAttentionSignals(supabase, ctx)` starts at `:77`, with
     `ctx = { nowISO, todayKey }` (`:19`).
   - `staleBefore = nowISO − STALE_AFTER_DAYS` (`:85-87`).
     `STALE_AFTER_DAYS = 7` lives in `src/lib/attention.ts:13`.
   - The query (`:96-102`) asks for:
     - `side = buyer` (`:99`)
     - `is_active` (`:100`)
     - `stage <> reserved` (`:101`)
     - `.lte("updated_at", staleBefore)` (`:102`)
   - `quietDays` comes from `updated_at.slice(0,10)` (`:130-133`), in UTC.
     Buyers already flagged as stalled offers are skipped (`:129`).
   - Sellers are never checked.
   - **No query in this function filters by `agent_id`**: it is safe only
     under the cookie client's RLS.
2. **`updated_at` means "edited"**:
   - `set_updated_at()` (`supabase/migrations/20260529120000_init.sql:19-29`)
     runs before **every** `clients` UPDATE (`:63-65`).
   - So all of these reset the clock:
     - `updateClientStage` (`src/lib/actions/clients.ts:191-209`)
     - `setClientPriority` (`:211-224`)
     - `setClientActive` (`:226-`)
     - `updateClient` (`:104-`)
   - Viewings, preferences and reservations have their own triggers
     (`init.sql:83,105,142`) and don't touch `clients.updated_at`.
   - Opening WhatsApp or email writes nothing.
   - `last_contacted_at` exists neither in the code nor in the live database.
   - The client list is ordered by `updated_at`
     (`src/lib/data/clients.ts`, `getClientRows` at `:55`).
   - The detail page shows "Updated …" from it
     (`client-detail-view.tsx:186`).
   - The client sheet's "Last activity" stat also reads it
     (`client-sheet.tsx:247-253`).
3. **Notifications are generated only by the bell.**
   - `syncNotifications(ctx)` (`src/lib/actions/notifications.ts:90-430`) is
     the only producer.
   - Its only caller is `loadNotifications` (`:432-438`), which only
     `NotificationsBell` calls (`src/components/notifications/notifications-bell.tsx:55`).
   - The bell is mounted in `src/components/shell/app-bar.tsx:134`. It syncs
     on mount, every 5 minutes (`:65-78`), and when the popover opens
     (`:80-83`).
   - With no tab open, nothing is generated or delivered.
4. **The sync depends on the request.**
   - It calls `getTranslations`, `getLocale` (the cookie),
     `getAgentTimeZone` and `getSessionUser` (`notifications.ts:95-103`).
   - The request-free pattern already exists in
     `src/app/api/calendar/[token]/route.ts:31-37`: it reads
     `profiles.locale`, then calls
     `getTranslations({ locale, namespace })`, and filters by
     `.eq("agent_id", agentId)` (`:62`, `:69`).
5. **Time zones are mixed.**
   - The browser `SyncContext` (`notifications-bell.tsx:30-39`, validated by
     zod at `notifications.ts:47-53` and `:117-118`) drives:
     - appointment reminders
     - the key `today-digest:${ctx.todayKey}` (`:279`)
     - body formatting (`:251`, `:269`)
   - Task pings use the profile zone and the server clock (`:104-112`).
   - `weekKey` comes from date-fns `getISOWeek(new Date(ctx.nowISO))`
     (`:120-126`): the browser's instant, evaluated in the server's own zone,
     which is UTC on Vercel.
   - The auth check is `getSessionUser()` (`:102`), the local `getClaims()`
     check from `9bd2da3`. Actions behind the agent's own edits keep calling
     `getUser()` (`src/lib/data/session.ts:10-17`).
6. **Idempotency.**
   - The unique index `notifications_agent_dedupe_idx` on
     `(agent_id, dedupe_key)`
     (`supabase/migrations/20260601130000_calendar_notifications.sql:63-64`)
     backs the upsert (`notifications.ts:380-382`). The upsert refreshes
     title, body and `due_at`, and keeps `read_at`.
   - `follow_up` rows use the key `followup:${clientId}:${weekKey}`
     (`:309-323`): one row per buyer per ISO week.
   - Read rows older than 30 days are pruned (`:393-397`). Task pings have
     their own cleanup (`:405-427`).
   - None of the prune or cleanup queries filter by `agent_id`.
   - `notification_type` has these values: `appointment_reminder`,
     `appointment_today`, `follow_up`, `reservation_date`, `stalled_offer`,
     and `task_due` (added in `20260915120000_tasks.sql:116`).
7. **Home mirrors the signals.**
   - `getNeedsAttention` (`src/lib/data/dashboard.ts:192-288`) calls
     `getAttentionSignals` at `:207` with the profile zone. Follow-up items
     are built at `:272-283` and link to `?compose=check_in`.
   - Home shows at most `ATTENTION_LIMIT = 8` items
     (`src/components/home/home-panels.tsx:37`).
   - The copy says "quiet N days":
     - Home: `messages/en/home.json:29` `attention.followUp` ("sin novedades"
       in es)
     - bell: `messages/en/server.json:16-17` `notifications.followUp` /
       `followUpBody`
   - `notificationHref` (`src/lib/notifications.ts:11-22`) sends `follow_up`
     rows to `/clients/{id}?compose=check_in`, and client-less rows to
     `/calendar`.
8. **Outreach surfaces that record nothing**:

   | Surface | File | Today |
   |---|---|---|
   | WhatsApp button | `src/components/clients/whatsapp-button.tsx:15-45` | A plain `<a>`, no `"use client"`. Rendered in `client-detail-view.tsx:450-456` (a **server** component) and `client-sheet.tsx:199-204` (a client component). Props: `phone`, `firstName`, `language`, `size`, `className`. |
   | Composer send | `src/components/clients/message-composer.tsx:185-202` | `window.open(wa.me…)` at `:194`; `location.href = mailto:` at `:196-199`. `client.id` is in scope (`:168`). |
   | Email / phone rows, detail page | `client-detail-view.tsx:421`, `:436` | `KeyValueRow` with an `href` (`src/components/shell/key-value.tsx:22`, which renders a plain `<a>` at `:47-48`) |
   | Email / phone rows, sheet | `client-sheet.tsx:186-197` | `InfoRow` with an `href` |
   | Calendar WhatsApp reminder | `src/components/home/upcoming-panel.tsx:73`, `:99-110`; `src/components/calendar/event-row.tsx:40`, `:103-113` | Both are client components. The link comes from `eventReminderHref` (`src/lib/event-reminder.ts`). |

9. **Calendar contact has no client id.**
   - `EventContact` (`src/lib/data/calendar.ts:24-29`) is
     `{ firstName, phone, language }`.
   - Meetings select `client:clients(id, …)` (`:56`) and build the contact at
     `:134`.
   - Viewings build it at `:170` and carry `buyerId: v.client_id` (`:179`).
   - So the id is available in both places. Plan 009's call-site map
     (`clients/[id]/page.tsx:213-218`, `calendar-view.tsx:240`) has been stale
     since the shell redesign.
10. **Nothing is scheduled anywhere.**
    - `vercel.json` holds only `$schema` and `regions: ["fra1"]`.
    - The route handlers are `api/calendar/[token]`, `api/stripe/webhook`,
      `auth/callback`, `join/*`, `llms.txt`, `markdown` and `robots.txt`.
    - `CRON_SECRET`, VAPID and `web-push` appear nowhere in `src/` or
      `package.json`.
11. **Email**, `src/lib/email.ts:35-58`:
    - One Resend REST POST, text only.
    - `from` is `SUPPORT_FROM` (default `LeadWing <info@leadwing.app>`,
      `:15-16`), with an optional `reply_to`.
    - No `html`, no custom headers, no `Idempotency-Key`. It returns `void`.
    - `RESEND_API_KEY` is in `.env.local` but **not on Vercel**, and it is
      commented out in `.env.example:16`.
12. **Profiles.**
    - `email` exists (`20260906120000_billing_referrals.sql:62`).
    - `time_zone` is nullable (`20260914120000_profile_settings.sql:8-9`);
      `resolveTimeZone` falls back to `Europe/Madrid`
      (`src/lib/time-zones.ts:7`, `:57-58`).
    - `locale` is `en` or `es` (`20260906140000_profile_locale.sql`).
    - Agents can only SELECT their own profile row, so new preferences need a
      definer function like `update_my_settings`
      (`profile_settings.sql:14-43`).
    - `getSessionProfile()` selects `*` (`src/lib/data/session.ts:31-41`), so
      a new column shows up without a code change.
13. **Settings.**
    - `SettingsView` is in `src/components/settings/settings-view.tsx`: the
      profile panel is at `:87-166`, `<PreferencesPanel />` renders at `:170`,
      and the component itself is at `:225-266`.
    - `saveSettings` is in `src/lib/actions/settings.ts:17-39`.
    - The page reads the profile in `src/app/(app)/settings/page.tsx:17-25`.
    - A `Switch` primitive exists (`src/components/ui/switch.tsx`), and so
      does `DatePicker` (`src/components/date-time-picker.tsx:29-37`). It
      takes only `value`, `onChange` and `placeholder`, so it can't disable
      future days yet.
    - `ClientSheet` (`src/components/clients/client-sheet.tsx:108`) gets no
      time zone. It is rendered by `clients-view.tsx:351`, which
      `clients-screen.tsx` (a server component, used by
      `/clients/buyers` and `/clients/sellers`) renders.
14. **The service worker is retired.**
    - `public/sw.js` is a kill switch that unregisters itself.
    - `ServiceWorkerRegister` (`src/components/service-worker-register.tsx:14-29`),
      mounted in the root layout (`src/app/layout.tsx:124`), unregisters
      **every** registration and clears all caches on every page load. A push
      worker would be removed at once.
    - The manifest has `display: "standalone"` and
      `start_url: "/clients/buyers"` (`src/app/manifest.ts:10-11`).
15. **Routing and auth.**
    - The proxy matcher (`src/proxy.ts:66-77`) runs `updateSession` on
      `/api/*`.
    - `/api` is not in `PROTECTED_PREFIXES` (`src/lib/routes.ts:14-26`), so an
      anonymous cron or unsubscribe request is passed through, not
      redirected. Each handler must authenticate itself, per
      `node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md:815`.
    - `robots.txt` already disallows `/api/`
      (`src/app/robots.txt/route.ts:19`).
16. **Signed-link risk.** `src/lib/calendar-feed-token.ts:11-40` signs the
    bare agent id with HMAC, keyed with the service-role key. If unsubscribe
    links reused it, every emailed or forwarded link would work as a
    calendar-feed credential, exposing client names.
17. **The service-role client** `createAdminClient()`
    (`src/lib/supabase/admin.ts:11-17`) bypasses RLS. Its own comment says
    callers must scope every query by `agent_id`.
18. **Privacy.**
    - `src/content/legal/privacy.en.tsx:119-121` lists "the reminders you
      set" among the service emails, on a contract basis (ES:
      `privacy.es.tsx:122-124`). That covers bell reminders the agent sets,
      not an unrequested morning summary.
    - Resend is listed for "sign-in codes and service emails" (EN: the cell
      at `:252`; ES: the cell at `:262`).
    - Section 10, "How long we keep data" (EN `:340-352`), says nothing about
      email logs at the provider.
    - `LEGAL_UPDATED` is in `src/lib/legal.ts:26-30`. The legal-entity
      placeholders are still unfilled.
19. **Live database** (read-only probes, 16 Sep 2026):
    - 10 profiles, all with an `email`, 1 `is_admin`: 1 with `time_zone` set,
      0 with locale `es`.
    - Accounts: 5 signed up 28 May–23 Jun under the "Lena" name (the
      founder's, and 4 others). Of those 4, two last signed in on 30 May (one
      has an active buyer) and one never signed in. The other 5 signed up
      1–7 Sep. 7 accounts signed in within the last 30 days.
    - 14 clients across 6 agents, at most 5 each. The founder has 3 active,
      non-reserved buyers.
    - 19 `follow_up` notifications, 17 of them unread: 13/11 on the `is_admin`
      account, 3/3 on `d4ec…`, 3/3 on one other account.
    - Cross-tenant rows: **0** viewings, appointments (by client or by
      property), reservations, tasks or notifications point at another
      agent's client or property.
    - `supabase_migrations.schema_migrations` has exactly the columns
      `version`, `statements` and `name`.
    - `pg_cron` 1.6.4 and `pg_net` 0.20.3 are available but not installed;
      `supabase_vault` 0.3.1 is installed. Postgres is 17.6.
    - `authenticated` and `authenticator` carry `statement_timeout=8s`, and
      `authenticator` preloads `safeupdate`, so every UPDATE or DELETE needs a
      WHERE.
    - Latest migration: `20260916120000`. Plan 012 reserves `20260916150000`.
20. **Tooling.**
    - Vitest runs in `jsdom` (`vitest.config.ts`). Node-only tests need
      `// @vitest-environment node` on their first line.
    - `src/lib/attention.test.ts` (owned by plan 002) covers the pure helpers.
      There is no test for `src/lib/data/attention.ts` yet.
    - CI runs typecheck → lint → test → build. Node is pinned to 24.x.
    - The undo-toast pattern already exists: `toast(…, { action: { label, onClick } })`
      in the tasks UI.
    - The lazy-load-on-open pattern exists too: `listTaskNotes` in
      `src/lib/actions/task-notes.ts:36`.
    - No test mocks `next/cache` yet, and `revalidatePath` throws outside a
      request, so route tests that reach it must mock it.
    - Local Node is 22.20; CI and Vercel run 24.x. A CI-only ICU failure has
      already happened once (`time-zones.test.ts`, fixed in `dd69b7a`). nvm
      has 24.15 installed locally.
    - `src/lib/home.ts` imports `@/lib/crm` and `@/lib/tones`, so it isn't
      import-free. `src/lib/time-zones.ts` and `src/lib/attention.ts` have
      no imports. `utcOffsetMinutes(zone, at)` is at `time-zones.ts:95`.
21. **Cross-tenant data through embeds.** Client names reach the bell through
    PostgREST embeds, not only through top-level queries:
    - `client:clients(…)` on appointments, viewings and tasks
      (`notifications.ts:163-183`), and on viewings (offers) and reservations
      (`src/lib/data/attention.ts:90-108`).
    - `property:properties(address, …)` on appointments feeds event titles.

    Under the cookie client, RLS on `clients` and `properties` hides a foreign
    row, so the embed comes back null and the code skips or anonymises it.
    **The service-role client bypasses that.** Meanwhile:
    - The viewings, appointments and reservations policies check only
      `agent_id` (`init.sql:261-274`,
      `20260601130000_calendar_notifications.sql:74-77`). Tasks already check
      client ownership (`20260915120000_tasks.sql:97-110`).
    - `saveViewing` (`src/lib/actions/buyer.ts:90`) and `saveAppointment`
      (`src/lib/actions/calendar.ts:46-47`, client and property) store
      browser-supplied ids without an ownership check.

    So a row owned by agent A that points at agent B's client or property
    would put B's data into A's titles, A's `appointment_today` body (which
    has no `client_id`) and A's digest once phase 2 reads with the service
    role. The probe above found 0 such rows, so the leak is latent today.
22. **Environment and tooling for phase 2.**
    - `.env.local` sets `NEXT_PUBLIC_SITE_URL` to a localhost URL (checked
      16 Sep 2026, value not printed). `SITE_URL` (`src/lib/site.ts:35-37`)
      reads it, so a digest built by a local dev server would carry
      `http://localhost:3000` links.
    - The repo has no `.vercel` link (`.vercel` is gitignored at
      `.gitignore:43`). The local Vercel CLI is 32.2.4, which answers "Your
      codebase isn't linked to a project on Vercel" to `vercel env ls`.
    - Deployment Protection on `lena-crm` (Vercel API, read 16 Sep 2026):
      Vercel Authentication is **on** with scope
      `all_except_custom_domains`; password protection and trusted IPs are
      off. Vercel's cron docs say a cron calls "your project's production
      deployment URL", with `https://*.vercel.app/api/cron` as the example,
      which is exactly what that scope protects.
    - `next.config.ts` has no `headers()`.
    - `profiles` rows are created by `handle_new_user()` on `auth.users`
      insert (`20260906120000_billing_referrals.sql:83-102`), so a column
      default applies to new sign-ups.
    - Notification types are listed in two maps in
      `src/components/notifications/notification-item.tsx:28`, `:38` and in
      `notificationHref`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 |
| Lint | `npm run lint` | exit 0 (existing warnings OK) |
| Tests | `npm test` | exit 0, all pass |
| Tests on CI's Node | `source ~/.nvm/nvm.sh && nvm use 24 && npm test` (before every push that adds date, time-zone or time-format tests) | exit 0, all pass |
| Build | `npm run build` | exit 0 |
| DB scripts | `node --env-file=/Users/lepadatumihail/Documents/work/personal/lena/.env.local <scratchpad>/<script>.mjs` | see each step |
| Install `pg` for DB scripts | `npm i pg --prefix <scratchpad>` | `pg` under `<scratchpad>/node_modules` |
| Link the repo to Vercel (phase 2, once) | First `cp .env.local <scratchpad>/env.local.bak`: a Vercel changelog titled "Preserve local environment variables when linking with the Vercel CLI" suggests that linking can write local env files (the entry itself wasn't read). Then `npx vercel@latest link --yes --project lena-crm --scope lepadatumihails-projects`. Afterwards `diff .env.local <scratchpad>/env.local.bak` must print nothing; restore the backup if it does. | a `.vercel/` folder (gitignored) |
| Vercel env | `npx vercel@latest env ls production --scope lepadatumihails-projects` | lists names only |
| Trigger the deployed cron | `npx vercel@latest crons run /api/cron/notifications --scope lepadatumihails-projects` (`vercel crons` is beta; https://vercel.com/docs/cli/crons, checked 2026-09-16) | the run starts; read the result in the runtime logs |
| Cron call, local | `curl -s -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/notifications?agent=<founder id>"` | JSON counts |

Never print `SUPABASE_DB_URL`, `CRON_SECRET` or any API key. Report what ran
instead.

## Suggested executor toolkit

- **Read these Next 16 docs** before phases 1 and 2 (in
  `node_modules/next/dist/docs/01-app/`):
  - `01-getting-started/15-route-handlers.md`: route handlers aren't cached
    by default, and a `route.ts` can't share a segment with a `page.tsx`
  - `03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md`
  - `03-api-reference/04-functions/after.md`
  - `02-guides/backend-for-frontend.md:556-590` (secret-checked webhooks)
    and `:815`
  - Phase 3 only: `02-guides/progressive-web-apps.md:84-460` (web push with
    VAPID)
- **Live DB access**: follow the memory note on running migrations.
  - Connect with `pg` using
    `ssl: { rejectUnauthorized: false }`.
  - Rehearse inside `begin … rollback`.
  - Apply the file and its `supabase_migrations.schema_migrations` row in one
    transaction.
  - Read that table's columns first; today they are `version`, `statements`
    and `name`. Any other set is a STOP.
- **Acting as an agent inside a transaction** (the pattern plan 012 uses):

  ```js
  const as = async (id) => {
    await db.query("reset role");
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: id, role: "authenticated" })]);
    await db.query("set local role authenticated");
  };
  ```

- **Seeing signed-in UI without signing in**:
  - Render the component from
    `src/app/preview-tmp/<your-own-folder>/page.tsx` with mock props. Never use
    a `_`-prefixed folder.
  - Delete **only your own folder** afterwards, then grep `.next/types` for
    leftovers.
  - Radix menus can freeze in the in-app browser pane; the chrome-devtools
    MCP works.
- **PostgREST reserved characters.** Inside `or=(…)`, a value that contains
  `,` `.` `:` `(` or `)` must be wrapped in double quotes (PostgREST docs,
  checked 2026-09-16). ISO timestamps contain `.` and `:`, so always quote
  them.

## Scope

**In scope** (the only files to create or modify):

- **Phase 0** (the consolidated copy commit, Step 0.1, carrying the "Until
  this ships" tables of plans 013, 014, 015, 016 and 017):
  - `messages/{en,es}/landing.json`, `messages/{en,es}/billing.json`,
    `messages/{en,es}/calendar.json` (plan 013's `sync.*` values only)
  - `messages/{en,es}/settings.json` (plan 013's
    `preferences.languageHint` row only)
  - `src/components/landing/one-place.tsx` (plan 017's animation change,
    its U3, only if the founder picked "match")
  - `src/app/llms.txt/route.ts`
  - `src/app/layout.tsx` (`keywords` only, and only if one of the five
    tables changes them; on 17 Sep 2026 none does)
  - the ten content modules:
    - `src/content/pages/crm-marbella.{en,es}.tsx`
    - `src/content/pages/crm-spain.{en,es}.tsx`
    - `src/content/pages/guide-idealista.{en,es}.tsx`
    - `src/content/pages/guide-follow-up.{en,es}.tsx`
    - `src/content/pages/about.{en,es}.tsx` (plans 013, 014 and 015 lines
      only)
  - `src/lib/seo.ts` (`PUBLISHED` only)
  - `src/components/landing/feature-grid.tsx` (plan 015's comment at `:59`
    only)
  - Only the copy parts of the other plans. Plan 013's feed fixes (plan
    004's files), plan 014's and plan 017's interview questions and plan
    015's phase A stay with those plans.
- **Phase 1**:
  - `supabase/migrations/<timestamp>_client_contacts.sql`,
    `src/lib/supabase/types.ts`
  - `src/lib/contacts.ts` + `contacts.test.ts`
  - `src/lib/validation/contact.ts` + `contact.test.ts`
  - `src/lib/actions/contacts.ts`, `src/lib/data/contacts.ts` +
    `src/lib/data/contacts.test.ts`
  - `src/app/api/contact-events/route.ts` + `route.test.ts`
  - `src/lib/contact-beacon.ts` + `contact-beacon.test.ts`,
    `src/hooks/use-contact-recorder.ts`
  - Client components:
    - `src/components/clients/whatsapp-button.tsx`
    - `src/components/clients/message-composer.tsx`
    - `src/components/clients/tracked-contact-link.tsx` (new)
    - `src/components/clients/log-contact-dialog.tsx` (new)
    - `src/components/clients/last-contact.tsx` (new)
    - `src/components/clients/client-detail-view.tsx`
    - `src/components/clients/client-sheet.tsx`
    - `src/components/clients/clients-view.tsx` and
      `src/components/clients/clients-screen.tsx` (thread `timeZone` to the
      sheet)
    - `src/components/clients/viewing-dialog.tsx` (the default reminder,
      D14, `:76-80` only)
    - `src/components/date-time-picker.tsx` (an optional `maxDate` prop on
      `DatePicker`)
    - `src/components/shell/key-value.tsx`
  - Calendar:
    - `src/lib/data/calendar.ts`
    - `src/components/home/upcoming-panel.tsx`
    - `src/components/calendar/event-row.tsx`
  - `src/lib/data/clients.ts`, if the sheet's `ClientRow` needs the new
    column
  - `src/lib/actions/clients.ts` (`updateClientStage` only)
  - Quiet rule and its tests:
    - `src/lib/attention.ts` + `src/lib/attention.test.ts` (extend)
    - `src/lib/data/attention.ts`
    - `src/lib/data/attention.test.ts` (new)
  - Callers of the quiet rule: `src/lib/data/dashboard.ts`,
    `src/lib/actions/notifications.ts`
  - Copy:
    - `messages/{en,es}/home.json`, `server.json`, `clientDetail.json`
    - the phase 1 claim wording in the phase 0 files
- **Phase 2**:
  - `src/lib/notify/generate.ts` + `generate.test.ts` (new folder `notify`;
    see the note in Step 13)
  - `src/lib/notify/digest.ts` + `digest.test.ts`
  - `src/lib/notify/run-digest.ts`
  - `src/lib/follow-ups.ts`: create it, or reuse it if plan 012 already has
  - `src/lib/actions/notifications.ts`,
    `src/components/notifications/notifications-bell.tsx`
  - The `digest_offer` bell prompt (D7): `src/lib/notifications.ts`
    (`notificationHref`) and
    `src/components/notifications/notification-item.tsx` (the icon and tone
    maps)
  - `src/app/api/cron/notifications/route.ts` + `route.test.ts`, `vercel.json`
  - `src/lib/notify/run-digest.test.ts`
  - `supabase/migrations/<timestamp>_notification_digests.sql`,
    `src/lib/supabase/types.ts`
  - `src/lib/email.ts` + `src/lib/email.test.ts` (new)
  - `src/lib/unsubscribe-token.ts` + `unsubscribe-token.test.ts`
  - `src/app/api/unsubscribe/[token]/route.ts` + `route.test.ts`
  - Settings:
    - `src/lib/actions/settings.ts` (add `saveNotificationPrefs`)
    - `src/components/settings/notifications-panel.tsx` (new)
    - `src/components/settings/settings-view.tsx`
    - `src/app/(app)/settings/page.tsx`
    - `messages/{en,es}/settings.json`
  - Legal:
    - `src/content/legal/privacy.{en,es}.tsx`
    - `src/lib/legal.ts` (`LEGAL_UPDATED.privacy` only)
  - `.env.example`
  - the phase 2 claim wording in the phase 0 files
- **Phase 3, only once its gates pass**:
  - `public/push-sw.js`
  - `next.config.ts` (a `headers()` entry for `/push-sw.js` only)
  - `src/components/service-worker-register.tsx`
  - `src/proxy.ts` (matcher only)
  - `supabase/migrations/<timestamp>_push_subscriptions.sql`
  - `src/lib/push.ts`
  - `src/app/api/cron/push/route.ts`
  - `src/components/settings/push-panel.tsx`
  - `package.json` and `package-lock.json` (`web-push`)
- Every phase: `plans/README.md` (row 016; in phase 0 also the copy status
  of rows 013, 014, 015 and 017).

**Out of scope**:

- **Writing** other plans' interim wording. Phase 0 applies the text that
  plans 013 ("Google Calendar sync"), 014 ("Portal lead capture"), 015 ("One
  CRM for every agency") and 017 (`onePlace` "pulls the WhatsApp
  conversation") wrote, verbatim; it doesn't reword it.
- Any build work of plans 013, 014, 015 and 017.
- Sending anything to **clients** (plan 007), and a WhatsApp inbox or sync.
- Quiet sellers, a digest time picker, and per-event reminder emails (D4, D8,
  D10).
- Web push before its gates pass (D11).
- Plan 012's follow-up digest row. This plan only prepares the hook for it.
- Changing Deployment Protection settings without the founder's sign-off.

## Git workflow

- Commit on `main`, which is where the founder ships.
  - Push only when the operator asks. The founder usually wants each phase
    pushed once CI-equivalent checks pass locally.
  - Vercel deploys `main` automatically, so a push is a production deploy.
- Commit style, one commit per step group:
  - `docs(marketing): …` for phase 0
  - `feat(contacts): …`
  - `feat(notifications): …`
  - `feat(digest): …`
  - `chore(db): …` for migrations
- **Order matters for migrations.** Apply a migration to the live database
  **before** pushing code that needs it. Code in this plan must also tolerate a
  missing table or column (see `isMissingTableError` in
  `src/lib/supabase/errors.ts`), because deploys and migrations can race.
- **Stage by hunk, not by file**, whenever `git diff <path>` shows hunks you
  didn't write. See "Shared working tree" at the top.
- Run `nvm use 24 && npm test` before pushing any phase that adds date, zone
  or time-format tests (phases 1 and 2).
- End each commit message with the attribution line the session gives you.

## Steps

### Phase 0: honest interim copy (before 21 Sep 2026)

#### Step 0.1: One consolidated interim-copy commit

This step is the single owner of the pre-outreach copy for the whole batch.
One session makes one commit, so five sessions don't edit the same JSON files
the weekend before 21 Sep. It applies, verbatim:
1. This plan's "Interim wording" tables (in "Until this ships").
2. Plan 013's "Until this ships (interim landing wording)" table, copy rows
   only. Its feed fixes (plan 004) stay with plan 013.
3. Plan 014's "Until this ships" section (its Step 0.1). Its interview
   question (Step 0.2) stays with plan 014.
4. Plan 015's "Until this ships" section, phase A0. Use the **Fallback**
   variants unless plan 015's phase A is already deployed.
5. Plan 017's "U1: Copy fix" table (`onePlace.body`, `onePlace.srSummary`,
   `preview.toasts.reminderSent`), plus its U3 animation change in
   `src/components/landing/one-place.tsx` if the founder picked "match"
   (with U3's height check). Its interview questions (U2) stay with plan
   017.

All five tables (013, 014, 015, 016, 017) land in this ONE commit, including
plan 013's `preferences.languageHint` row in `messages/{en,es}/settings.json`.
Each other plan's own copy step says "applied by 016 Step 0.1; only if this
plan ships before 016 Step 0.1, apply your own rows alone in a docs(...)
commit".

**Rules**:
- **Change only the listed strings.** Keep ICU placeholders, rich-text tags
  (`<nowrap>`, `<accent>`) and JSX structure as they are.
- **When two tables name the same key, the plan that owns the claim wins.**
  - `faq.items.calendar.a` (`:277`) and `llms.txt:52` belong to plan 013.
    Its text already drops "reminds you before each one" and says "in-app
    reminders", so this plan adds nothing there.
  - `hero.subtitle` belongs to this plan until a plan switches the headline
    (plan 015, D20).
  - `onePlace.*` and `preview.toasts.reminderSent` belong to plan 017.
- **If one of those plans has already landed its own copy commit** (check
  `git log --oneline -- messages/en/landing.json`), keep its text and apply
  only what is missing. If its wording and this plan's clash on a line,
  STOP.
- **Bump `PUBLISHED`** (`src/lib/seo.ts:73-79`) for `crmSpain`,
  `crmMarbella`, `guideIdealista`, `guideFollowUp` and `about` to the ship
  day.
- **Plans index**: update rows 013, 014, 015, 016 and 017 in
  `plans/README.md` (add the rows if missing): "interim copy DONE in <sha>".
- Re-read each of those plans' copy section on the day: the plans are being
  revised in parallel, and their text on disk is what counts.

**Verify**:
- **Product-claim greps: each must print nothing.** The `grep -v` filters
  drop the only non-claim lines these patterns hit: a guide FAQ question and
  a guide heading and description that describe the market, not LeadWing.
  `templates.json` isn't searched: its "gone quiet" is an AI template
  purpose.

  ```bash
  grep -rn -i -E 'auto-engage|do the (<nowrap>)?follow|handle the follow|leadwing follow up|reminds you before|reminder before|reminders that reach|goes cold|going quiet|gone quiet|goes quiet|gone silent|follow-up sent|reminder sent|"sent": "sent"|pulls all of it|flow into leadwing' \
    messages/en/landing.json messages/en/billing.json src/app/llms.txt/route.ts src/content/pages/*.en.tsx \
    | grep -v -F 'What do I write when a buyer goes quiet'

  grep -rn -i -E 'auto-engage|en silencio|seguimiento automático|enfri|enfrí|haga (el|los) (<nowrap>)?seguimiento|se encargue del seguimiento|te avisa antes|aviso antes|recordatorio antes|que de verdad te llegan|llevan tiempo callados|hablado|seguimiento enviado|recordatorio de whatsapp enviado|"sent": "enviado"|sin contacto|lo reúne todo|entran en leadwing' \
    messages/es/landing.json messages/es/billing.json src/content/pages/*.es.tsx \
    | grep -v -F -e 'Por qué se enfrían los leads' -e 'para los leads que se quedan en silencio'
  ```

  On 16 Sep 2026 these print exactly the lines the interim tables change
  (this plan's, plan 013's `:277` and plan 017's `onePlace` lines): 25 EN
  lines and 26 ES lines. After the commit they must print nothing.
- **The other plans' checks** pass too: plan 014's
  `grep -rn "Portal lead capture\|Captura de leads de portales" messages src`
  prints nothing, and the copy checks in plan 013's Phase 0 and plan 015's
  A0 pass (013's feed tests belong to its own commit).
- **Positive checks**:
  - `grep -c "in-app reminders" messages/en/billing.json src/app/llms.txt/route.ts`
    prints 1 for each file.
  - `grep -c "recordatorios en la app" messages/es/billing.json` prints 1.
  - `grep -c "Follow-up nudges" messages/en/billing.json src/app/llms.txt/route.ts`
    prints 1 for each file.
- **JSON**: this command exits 0.

  ```bash
  node -e 'for (const l of ["en","es"]) for (const n of ["landing","billing","calendar","settings"]) JSON.parse(require("fs").readFileSync("messages/"+l+"/"+n+".json","utf8"))'
  ```

- `npm run typecheck && npm run lint && npm test && npm run build` all pass.
- **In the browser**: run `npm run dev`, then check:
  - `/`, `/es`, `/pricing`, `/es/precios`, `/about`, `/es/sobre-nosotros`
    and the four content pages show the new text.
  - At 375 px wide, `/es` and `/es/precios` don't scroll sideways:
    `document.documentElement.scrollWidth` must equal `innerWidth`. Spanish
    copy runs wider.
  - **The looping demos don't change height.** Watch the "How it works"
    follow-up tile through two loops at 375 px and at desktop width: the
    "Opened" button and the toast must stay on one line (see the landing demo
    layout feedback note).
- `curl -s localhost:3000/llms.txt | grep -i "follow-up nudges"` prints the
  new line.

### Phase 1: real contact tracking and a contact-based quiet rule

#### Step 1: Pre-flight on the live database

Write `<scratchpad>/probe-016.mjs` and run it. It prints these values and
changes nothing:
- `to_regclass('public.client_contacts')`
- whether `clients.last_contacted_at` exists (from
  `information_schema.columns`)
- the columns of `supabase_migrations.schema_migrations`, and its newest 5
  rows
- `select count(*) from public.notifications where type = 'follow_up' and read_at is null`
- the names of the current policies on `viewings`, `appointments` and
  `reservations` (`pg_policies`)
- **the shared `updated_at` skip array** (plan 015 B1 may have created it
  first):
  - `to_regprocedure('public.clients_touch_updated_at()')`
  - the function behind the `clients_set_updated_at` trigger
    (`tgfoid::regproc`)
  - if the skip-list function exists, its `pg_get_functiondef`, **written
    to `<scratchpad>/pre-016-touch-fn.sql`** (the rollback needs it), and
    its quoted keys from the `skip` array
- the cross-tenant counts (each must be 0):

  ```sql
  select
    (select count(*) from public.viewings v join public.clients c on c.id = v.client_id where c.agent_id <> v.agent_id) as viewings,
    (select count(*) from public.appointments a join public.clients c on c.id = a.client_id where c.agent_id <> a.agent_id) as appt_clients,
    (select count(*) from public.appointments a join public.properties p on p.id = a.property_id where p.agent_id <> a.agent_id) as appt_properties,
    (select count(*) from public.reservations r join public.clients c on c.id = r.client_id where c.agent_id <> r.agent_id) as reservations,
    (select count(*) from public.tasks t join public.clients c on c.id = t.client_id where c.agent_id <> t.agent_id) as tasks;
  ```

**Expected**:
- `client_contacts` is null.
- There is no `last_contacted_at` column. (Plan 017's migration depends on
  this one, so it can't have added it. If the column exists anyway, the
  migration's `add column if not exists` tolerates it: report it.)
- The history columns are `version`, `statements` and `name`.
- The newest version is `20260916120000`, or a later one from plans 011–015
  or 017 if they have landed (plan 012 reserves `20260916150000`).
- The policies are named `agent owns viewings`, `agent owns appointments`
  and `agent owns reservations`.
- **Skip array**: either `clients_touch_updated_at` doesn't exist and the
  trigger runs `set_updated_at` (this plan creates the function and binds
  the trigger), or it exists and the trigger already runs it (plan 015 B1
  landed first, the only plan that can create it before this phase 1; plan
  017 depends on this phase 1 and never creates it: Step 2 merges into its
  array and does **not** re-bind the trigger). Any other function behind the
  trigger is a STOP.
- Every cross-tenant count is 0. Anything else is a STOP: the tightened
  policies in Step 2 would not remove existing rows.

**Pick the timestamp**: the build day at `120000` (for example
`20260917120000`). It must sort after every file in `supabase/migrations/`
**and** after `20260916150000`. Also run `grep -rhn "20260917\|20260918"
plans/`, so you don't take a timestamp another plan in this batch has
reserved.

#### Step 2: The migration: `supabase/migrations/<timestamp>_client_contacts.sql`

**Build the skip array** in `clients_touch_updated_at` as the union of:
- `'updated_at', 'last_contacted_at', 'wa_contact_id'` (this plan's keys,
  plus plan 017's so it has nothing to add later)
- **every** key Step 1 printed for a live skip-list function (for example
  plan 015's `'agency'` and `'agency_id'`). Merge; never overwrite.

Keep the function body in the batch's shared form below. **If Step 1 found
the trigger already bound to `clients_touch_updated_at`**, delete the
`drop trigger` / `create trigger clients_set_updated_at` pair from the file:
only the first plan to land binds the trigger.

```sql
-- ============================================================
-- Client contacts: when the agent actually reached a client, and how.
--
-- client_contacts is an append-only log. clients.last_contacted_at caches
-- max(occurred_at) per client, kept by a trigger, so the quiet-buyer rule
-- reads one column. The trigger is the column's ONLY writer: other features
-- (plan 017's WhatsApp sync, plan 012's import, plan 007's sends) insert
-- client_contacts rows instead of updating the column.
-- Recording contact is not editing the client, so the clients updated_at
-- trigger now ignores updates that only change bookkeeping columns (and
-- no-op updates). Its skip array is SHARED with plans 015 and 017: it
-- already names plan 017's column (wa_contact_id) and keeps every key the
-- live function had (Step 1); removing a key that doesn't exist from jsonb
-- is a no-op.
--
-- channel/source are text + check (not enums) so a later migration can
-- widen them (e.g. source 'whatsapp_api') without ALTER TYPE.
-- The insert policy also checks that the client belongs to the agent: a
-- foreign-key check ignores RLS (same reasoning as task_notes).
--
-- The same gap exists on viewings, appointments and reservations: their
-- policies check only agent_id, so a browser-supplied client_id (or an
-- appointment's property_id) could point at another agent's row. The
-- service-role cron would then read that row's name through an embed. The
-- three policies are rebuilt below with an ownership check, as tasks has.
-- ============================================================

alter table public.clients
  add column if not exists last_contacted_at timestamptz;

create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  channel text not null,
  source text not null,
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint client_contacts_channel_valid
    check (channel in ('whatsapp', 'email', 'call', 'meeting', 'other')),
  constraint client_contacts_source_valid
    check (source in ('app_link', 'manual', 'stage', 'email_send', 'import')),
  constraint client_contacts_note_len
    check (note is null or char_length(note) <= 500),
  constraint client_contacts_occurred_not_future
    check (occurred_at <= created_at + interval '36 hours')
);

-- the client page lists a client's recent contacts, newest first
create index client_contacts_client_occurred_idx
  on public.client_contacts (client_id, occurred_at desc);
-- plan 011's export and any per-agent read
create index client_contacts_agent_occurred_idx
  on public.client_contacts (agent_id, occurred_at desc);
-- the quiet-buyer scan
create index if not exists clients_agent_last_contacted_idx
  on public.clients (agent_id, last_contacted_at);

alter table public.client_contacts enable row level security;

create policy "agent reads own client contacts" on public.client_contacts
  for select to authenticated
  using (agent_id = (select auth.uid()));

create policy "agent logs contact on own clients" on public.client_contacts
  for insert to authenticated
  with check (
    agent_id = (select auth.uid())
    and exists (
      select 1 from public.clients c
      where c.id = client_contacts.client_id
        and c.agent_id = (select auth.uid())
    )
  );

create policy "agent deletes own client contacts" on public.client_contacts
  for delete to authenticated
  using (agent_id = (select auth.uid()));
-- No update policy: an entry is written once and removed, never edited.

-- Keep clients.last_contacted_at = max(occurred_at). Runs with the caller's
-- rights: the insert policy has already proved the client is the caller's.
-- The service role bypasses that policy (plan 007/012/017 writers), so an
-- insert also checks that the row's agent owns the client.
create or replace function public.client_contacts_sync_last_contacted()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_client uuid;
  v_latest timestamptz;
begin
  if tg_op = 'DELETE' then
    v_client := old.client_id;
  else
    v_client := new.client_id;
    if not exists (
      select 1 from public.clients c
      where c.id = new.client_id and c.agent_id = new.agent_id
    ) then
      raise exception 'client_contacts: client % is not owned by the row''s agent', new.client_id
        using errcode = '42501';
    end if;
  end if;

  select max(cc.occurred_at) into v_latest
  from public.client_contacts cc
  where cc.client_id = v_client;

  update public.clients c
     set last_contacted_at = v_latest
   where c.id = v_client
     and c.last_contacted_at is distinct from v_latest;

  return null;
end;
$$;

create trigger client_contacts_sync_last_contacted
  after insert or delete on public.client_contacts
  for each row execute function public.client_contacts_sync_last_contacted();

-- updated_at means "edited": ignore bookkeeping-only (and no-op) updates.
-- One function, one array, SHARED with plans 015 and 017: whoever redefines
-- it reads the live function first and keeps every key already listed.
create or replace function public.clients_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  skip constant text[] := array['updated_at', 'last_contacted_at', 'wa_contact_id'];  -- + live keys from Step 1
begin
  if (to_jsonb(new) - skip) = (to_jsonb(old) - skip) then
    new.updated_at := old.updated_at;
  else
    new.updated_at := now();
  end if;
  return new;
end;
$$;

-- Only if Step 1 found the trigger still on set_updated_at; otherwise
-- delete these three statements (the trigger already runs this function).
drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.clients_touch_updated_at();

-- ---------- ownership checks on rows that point at a client ----------
drop policy "agent owns viewings" on public.viewings;
create policy "agent owns viewings" on public.viewings
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (
    agent_id = (select auth.uid())
    and exists (
      select 1 from public.clients c
      where c.id = viewings.client_id
        and c.agent_id = (select auth.uid())
    )
  );

drop policy "agent owns reservations" on public.reservations;
create policy "agent owns reservations" on public.reservations
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (
    agent_id = (select auth.uid())
    and exists (
      select 1 from public.clients c
      where c.id = reservations.client_id
        and c.agent_id = (select auth.uid())
    )
  );

drop policy "agent owns appointments" on public.appointments;
create policy "agent owns appointments" on public.appointments
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (
    agent_id = (select auth.uid())
    and (
      appointments.client_id is null
      or exists (
        select 1 from public.clients c
        where c.id = appointments.client_id
          and c.agent_id = (select auth.uid())
      )
    )
    and (
      appointments.property_id is null
      or exists (
        select 1 from public.properties p
        where p.id = appointments.property_id
          and p.agent_id = (select auth.uid())
      )
    )
  );
```

Notes:
- The shared `public.set_updated_at()` stays: other tables still use it.
- **The skip array is merged, never overwritten.** Plan 015 B1 and plan
  017's migration (which lands after this one: it needs `client_contacts`)
  each read the live function and replace it with the union of the live
  array and their own keys. Whichever of 015 B1 or this phase lands first
  creates the function and binds the trigger; the other only merges. If the
  live array (Step 1) has keys this file doesn't list, add them before
  applying, so no plan drops another's.
- **Rollback of the function**: if this phase created it, drop it and
  re-bind `clients_set_updated_at` to `set_updated_at`; if it already
  existed, restore `<scratchpad>/pre-016-touch-fn.sql` instead.
- **The policy rebuilds need no code change.** `saveViewing`,
  `saveAppointment` and the reservation upsert still work for the agent's
  own rows. A foreign id now fails with an RLS error, which those actions
  already return as an error message.
- The policy names must match what Step 1 printed. If they differ, STOP.

#### Step 3: Rehearse it with nothing kept

Save this as `<scratchpad>/rehearse-client-contacts.mjs` and run it with the
migration path as the argument.

```js
import fs from "node:fs";
import pg from "pg";

const sql = fs.readFileSync(process.argv[2], "utf8");
const db = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
const as = async (id) => {
  await db.query("reset role");
  await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: id, role: "authenticated" })]);
  await db.query("set local role authenticated");
};
const ok = (label, cond, detail = "") => console.log(cond ? `ok   ${label}` : `FAIL ${label} ${detail}`);
const expectError = async (label, run, text) => {
  await db.query("savepoint s");
  try { await run(); console.log(`FAIL ${label}: no error`); }
  catch (e) { console.log(e.message.includes(text) ? `ok   ${label}` : `FAIL ${label}: ${e.message}`); }
  await db.query("rollback to savepoint s");
};
const client = async (id) => (await db.query("select last_contacted_at, updated_at from public.clients where id = $1", [id])).rows[0];

await db.connect();
await db.query("begin");
try {
  // Don't queue behind live traffic for long: the DDL takes exclusive locks.
  await db.query("set local lock_timeout = '5s'");
  await db.query(sql);
  const founder = (await db.query("select id from public.profiles where is_admin limit 1")).rows[0].id;
  const other = (await db.query("select id from public.profiles where id <> $1 limit 1", [founder])).rows[0].id;

  await as(founder);
  // An INSERT doesn't fire the update trigger, so an old updated_at sticks.
  const c = (await db.query(
    "insert into public.clients (side, first_name, last_name, stage, created_at, updated_at) values ('buyer', 'Rehearsal', 'Contact', 'new', '2026-01-01', '2026-01-01') returning id"
  )).rows[0].id;

  await db.query("insert into public.client_contacts (client_id, channel, source, occurred_at) values ($1, 'whatsapp', 'app_link', '2026-09-10T10:00:00Z')", [c]);
  let row = await client(c);
  ok("cache set on insert", row.last_contacted_at?.toISOString() === "2026-09-10T10:00:00.000Z", row.last_contacted_at);
  ok("updated_at untouched by contact", row.updated_at.toISOString().startsWith("2026-01-01"), row.updated_at);

  const older = (await db.query("insert into public.client_contacts (client_id, channel, source, note, occurred_at) values ($1, 'call', 'manual', 'Agreed a second viewing', '2026-09-01T09:00:00Z') returning id", [c])).rows[0].id;
  ok("older entry keeps the max", (await client(c)).last_contacted_at.toISOString() === "2026-09-10T10:00:00.000Z");

  // While rows still exist, so a 0 means "no policy", not "nothing to update".
  const upd = await db.query("update public.client_contacts set note = 'x' where client_id = $1", [c]);
  ok("no update policy (2 rows exist, 0 updated)", upd.rowCount === 0);

  // Undo path (Step 6): delete this week's unread nudge, then a later sync
  // re-inserts it unread.
  const nudgeKey = `followup:${c}:2026-W38`;
  await db.query("insert into public.notifications (type, title, client_id, dedupe_key) values ('follow_up', 'Rehearsal', $1, $2)", [c, nudgeKey]);
  const cleared = await db.query("delete from public.notifications where agent_id = $1 and client_id = $2 and type = 'follow_up' and read_at is null", [founder, c]);
  ok("contact clears the unread nudge", cleared.rowCount === 1);
  await db.query("insert into public.notifications (agent_id, type, title, client_id, dedupe_key) values ($1, 'follow_up', 'Rehearsal', $2, $3) on conflict (agent_id, dedupe_key) do update set title = excluded.title", [founder, c, nudgeKey]);
  ok("a later sync brings it back unread", (await db.query("select read_at from public.notifications where client_id = $1 and type = 'follow_up'", [c])).rows[0]?.read_at === null);

  await db.query("delete from public.client_contacts where client_id = $1 and id <> $2", [c, older]);
  ok("delete recomputes", (await client(c)).last_contacted_at.toISOString() === "2026-09-01T09:00:00.000Z");

  await db.query("update public.clients set priority = true where id = $1", [c]);
  ok("a real edit bumps updated_at", !(await client(c)).updated_at.toISOString().startsWith("2026-01-01"));

  await expectError("bad channel", () => db.query("insert into public.client_contacts (client_id, channel, source) values ($1, 'fax', 'manual')", [c]), "client_contacts_channel_valid");
  await expectError("long note", () => db.query("insert into public.client_contacts (client_id, channel, source, note) values ($1, 'call', 'manual', repeat('x', 501))", [c]), "client_contacts_note_len");

  const started = Date.now();
  await db.query("insert into public.client_contacts (client_id, channel, source, occurred_at) select $1, 'call', 'import', now() - (g || ' hours')::interval from generate_series(1, 200) g", [c]);
  console.log(`info 200 contacts in ${Date.now() - started} ms (must stay far below 8000 ms)`);

  // A founder property, for the appointment policy check below
  const prop = (await db.query("insert into public.properties (client_id, address) values ($1, 'Rehearsal') returning id", [c])).rows[0].id;

  await as(other);
  await expectError("another agent's client", () => db.query("insert into public.client_contacts (client_id, channel, source) values ($1, 'call', 'manual')", [c]), "row-level security");
  ok("other agent sees nothing", (await db.query("select count(*)::int as n from public.client_contacts where client_id = $1", [c])).rows[0].n === 0);
  const foreignDelete = await db.query("delete from public.client_contacts where id = $1", [older]);
  ok("other agent deletes nothing", foreignDelete.rowCount === 0);
  await expectError("viewing on a foreign client", () => db.query("insert into public.viewings (client_id, title) values ($1, 'x')", [c]), "row-level security");
  await expectError("reservation on a foreign client", () => db.query("insert into public.reservations (client_id) values ($1)", [c]), "row-level security");
  await expectError("appointment with a foreign client", () => db.query("insert into public.appointments (type, client_id, starts_at) values ('meeting', $1, now())", [c]), "row-level security");
  await expectError("appointment at a foreign property", () => db.query("insert into public.appointments (type, property_id, starts_at) values ('meeting', $1, now())", [prop]), "row-level security");
  const ownOk = await db.query("insert into public.appointments (type, starts_at) values ('meeting', now()) returning id");
  ok("a client-less appointment still works", ownOk.rowCount === 1);

  await as(founder);
  ok("own viewing still works", (await db.query("insert into public.viewings (client_id, title) values ($1, 'x') returning id", [c])).rowCount === 1);
  ok("own appointment still works", (await db.query("insert into public.appointments (type, client_id, property_id, starts_at) values ('meeting', $1, $2, now()) returning id", [c, prop])).rowCount === 1);
  await db.query("delete from public.client_contacts where client_id = $1", [c]);
  ok("last delete clears", (await client(c)).last_contacted_at === null);

  // Service-role writers (plans 007, 012, 017) pass agent_id explicitly.
  await db.query("reset role");
  await db.query("set local role service_role");
  ok("service role inserts with the right agent", (await db.query("insert into public.client_contacts (agent_id, client_id, channel, source) values ($1, $2, 'email', 'email_send') returning id", [founder, c])).rowCount === 1);
  await expectError("service role with the wrong agent", () => db.query("insert into public.client_contacts (agent_id, client_id, channel, source) values ($1, $2, 'email', 'email_send')", [other, c]), "not owned by the row's agent");

  await as(founder);
  await db.query("delete from public.clients where id = $1", [c]);
  ok("client delete cascades", (await db.query("select count(*)::int as n from public.client_contacts where client_id = $1", [c])).rows[0].n === 0);
} finally {
  await db.query("rollback");
  await db.end();
}
```

**Expected**:
- Every check line prints `ok`. The `info` line is informational.
- The 200-row insert takes a few hundred ms at most.
- A dry run of this exact SQL and script on 16 Sep 2026 (rolled back)
  printed `ok` on all 25 checks, with 200 contacts in 80 ms. Afterwards
  `client_contacts` was still absent and the trigger still pointed at
  `set_updated_at`. Re-run it anyway: the live data will have changed.
- Nothing is kept: the script always rolls back.
- If the `service_role` role can't be assumed from the DB URL's role, the
  service-role lines fail with a permission error. Report it and run those
  two checks through `createAdminClient()` in a scratch script instead,
  deleting the inserted row afterwards.

#### Step 4: Apply it live, then add the types

**Apply**, only when the rehearsal passes, in one transaction:
1. Run the file.
2. Insert the history row (`version` = the timestamp,
   `name` = `client_contacts`, `statements` = `[sql]`).
3. Commit.

**Check afterwards**:
- `to_regclass('public.client_contacts')` is not null.
- `pg_policies` has 3 rows for the table.
- `pg_policies` still has exactly 1 row each for `viewings`, `appointments`
  and `reservations`, and each `with_check` mentions `clients` (and
  `appointments`' also mentions `properties`).
- `pg_trigger` has `client_contacts_sync_last_contacted`, and
  `clients_set_updated_at` now points at `clients_touch_updated_at`
  (`tgfoid::regproc`).
- `pg_get_functiondef('public.clients_touch_updated_at()'::regprocedure)`
  still lists every skip key Step 1 printed, plus `last_contacted_at` and
  `wa_contact_id`. (Run the same check inside Step 3's rehearsal, before the
  rollback.)
- The history row is present.
- Report what ran.
- Then, signed in as the founder on production, add and edit one viewing
  and one meeting: both save as before.

**Types**: in `src/lib/supabase/types.ts`, add by hand:
- `client_contacts` (Row, Insert, Update)
- `last_contacted_at: string | null` on `clients` (Row, and optional in
  Insert and Update)

Also export `export type ClientContact = Tables<"client_contacts">`, following
the file's existing aliases.

**Verify**: `npm run typecheck` passes.

#### Step 5: Pure helpers: `src/lib/contacts.ts`

Its only import is `@/lib/time-zones`, which itself imports nothing, so both
client and server code can use this file. Don't import `src/lib/home.ts`: it
pulls in `@/lib/crm` and `@/lib/tones`.
- `CONTACT_CHANNELS = ["whatsapp", "email", "call", "meeting", "other"] as const`
- `CONTACT_SOURCES = ["app_link", "manual", "stage", "email_send", "import"] as const`
- `MANUAL_CHANNELS = ["call", "meeting", "whatsapp", "email", "other"] as const`:
  the order the log dialog shows.
- `BEACON_DEDUPE_MS = 10 * 60_000`: the browser-side window in which a
  repeated tap on the same client and channel is not sent again.
- `CONTACT_WINDOW_DAYS = 7`: a viewing or meeting this close counts as
  contact.
- `localNoonISO(dateKey, timeZone)`: the instant of 12:00 wall-clock time on
  that day in that zone.
  1. `guess = Date.UTC(y, m - 1, d, 12)`.
  2. Subtract `utcOffsetMinutes(timeZone, new Date(guess))` minutes.
  3. Recompute the offset at the result and subtract again from `guess`, so
     a day with a DST switch uses the offset in force at noon.
- `manualOccurredAt(dateKey, todayKey, nowISO, timeZone)`:
  - If the key is today, return `nowISO`.
  - Otherwise return `localNoonISO(dateKey, timeZone)`.
  - Throw for a key after `todayKey`.

**Verify**: `src/lib/contacts.test.ts` covers these cases (expected values
computed on 16 Sep 2026 with Node 22's ICU):
- today returns `now`
- `2026-09-15`, `Europe/Madrid` → `2026-09-15T10:00:00.000Z`
- `2026-09-15`, `America/New_York` → `2026-09-15T16:00:00.000Z`
- spring-forward days: `2026-03-29`, `Europe/Madrid` →
  `2026-03-29T10:00:00.000Z`; `2026-03-08`, `America/New_York` →
  `2026-03-08T16:00:00.000Z`
- fall-back day: `2026-10-25`, `Europe/Madrid` → `2026-10-25T11:00:00.000Z`
- a future day throws

Run it under Node 24 as well (`nvm use 24 && npx vitest run src/lib/contacts.test.ts`):
CI's ICU differs from the local one.

#### Step 6: Validation and server actions

**`src/lib/validation/contact.ts`** (zod):
- `logContactSchema`:
  - `id: z.uuid().optional()`
  - `clientId: z.uuid()`
  - `channel: z.enum(CONTACT_CHANNELS)`
  - `note: z.string().trim().max(500).optional()`
  - `date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()`
- `contactEventSchema` (the beacon body):
  - `{ id: z.uuid(), clientId: z.uuid(), channel: z.enum(["whatsapp", "email", "call"]) }`
  - The source is always `app_link`: the browser can't choose it.

**`src/lib/actions/contacts.ts`** (`"use server"`):

- **Every action starts the same way**:
  1. `const supabase = await createClient()`
  2. `supabase.auth.getUser()`. With no user, return
     `{ error: t("errors.notAuthenticated") }`.
- **`logContact(input)`**, for manual logs from the dialog:
  1. Parse the input.
  2. Read `todayKey` and `occurred_at` with the profile zone
     (`getAgentTimeZone()`).
  3. Insert with `source: "manual"`.
  4. Call `clearFollowUps(supabase, user.id, clientId)`.
  5. Revalidate `/home`, `/clients` and `/clients/${clientId}`.
  6. Return `{ error: null, id }`.
- **`deleteContact(id)`**, used by Undo and "Remove":
  1. Parse the id with `z.uuid()`.
  2. `.delete().eq("id", id).eq("agent_id", user.id).select("id")`.
  3. Return `{ error: null, deleted: data.length }`. The caller treats
     `deleted === 0` as "not saved yet" (see Step 7's hook).
  4. Revalidate the same paths. The trigger recomputes the cache.
  5. Nothing to restore in `notifications`: `clearFollowUps` deleted the
     unread nudge rather than marking it read, so the next sync re-inserts
     it unread if the buyer is quiet again.
- **`listContacts(clientId)`**: the newest 10 entries (`id`, `channel`,
  `source`, `note`, `occurred_at`), loaded when the popover opens.
  - It returns `null` when the table is missing (`isMissingTableError`), so
    a deploy that lands before the migration still works.
- **`clearFollowUps(supabase, agentId, clientId)`** lives in a new
  `src/lib/data/contacts.ts`, **not** in the `"use server"` file: every
  export of a `"use server"` module becomes a callable server action.
  - It runs `.from("notifications").delete().eq("agent_id", agentId).eq("client_id", clientId).eq("type", "follow_up").is("read_at", null)`.
  - **Why delete, not mark read**: the generator's upsert never writes
    `read_at` (`notifications.ts:378-382`), so a row marked read stays read
    for the rest of the ISO week. After an Undo or a mistaken tap, the
    buyer's nudge would then stay hidden for up to 7 days. A deleted row is
    simply re-inserted, unread, by the next sync if the buyer is still
    quiet. Rows the agent already read stay as they are. (This deviates from
    plan 009 §6, which marked them read.)
  - Leave `stalled_offer` rows alone (plan 009 §6).
  - **Verify**: `src/lib/data/contacts.test.ts` checks, with a recording
    fake client, that the call is a `delete` carrying all four filters and
    no `update`. Step 3's rehearsal proves the delete-then-sync path on the
    real schema.

**Stage move**: in `updateClientStage` (`src/lib/actions/clients.ts:191`),
when `stage === "contacted"`:
1. Run `update({ stage }).eq("id", id).eq("stage", "new").select("id")` first.
2. If a row comes back, insert a `client_contacts` row
   (`channel: "other"`, `source: "stage"`) and call `clearFollowUps`.
3. Otherwise run today's plain update.

Every other stage keeps today's code path. The action currently doesn't call
`getUser()`, so add that call for the agent id.

**Copy**: add the errors to `messages/{en,es}/clientDetail.json` under
`contactLog.errors`: `notAuthenticated`, `failed`, `notReady`, `undoFailed`
(EN in Step 7; ES: "No hemos encontrado ese registro. Si aparece en Último
contacto, elimínalo desde ahí.").

**Verify**: `npm run typecheck`, then `src/lib/validation/contact.test.ts`
passes. It rejects:
- a bad uuid
- channel `fax`
- a 501-character note
- a beacon body with channel `meeting`

#### Step 7: The beacon route: `src/app/api/contact-events/route.ts`

A tapped link hands the page to WhatsApp or the mail app, and iOS may suspend
the page at once. A server action can't survive that. `navigator.sendBeacon`
and `fetch(…, { keepalive: true })` can.

`export async function POST(request: Request)` takes these steps in order:
1. **Origin**: if `Origin` is missing, or its host differs from
   `new URL(request.url).host`, return 403. A `text/plain` beacon is a
   CORS-simple request, so this check is the CSRF guard.
2. **Body size**: if the `Content-Length` header is present and above 1024,
   return 413 **before** reading the body. Then read
   `await request.text()` and return 413 if it is longer than 1024
   characters (chunked requests carry no `Content-Length`).
3. **Body**: `JSON.parse`, then `contactEventSchema`. Bad input returns 400.
4. **Session**: `createClient()`, then `auth.getUser()`. With no user, return
   401.
5. **Insert**:
   - `.upsert({ id, client_id, channel, source: "app_link" }, { onConflict: "id", ignoreDuplicates: true })`,
     so a retried beacon with the same id is a no-op.
   - There is **no server-side time-window dedupe**. The browser already
     collapses repeated taps (below), and a server dedupe would drop the very
     id the Undo toast later tries to delete: `sendBeacon` can't read a
     response, so the page would never learn which id was kept.
   - An RLS error (the client isn't the caller's) returns 404.
   - A missing table returns 503.
6. Call `clearFollowUps`, then `revalidatePath` on `/home`, `/clients` and
   `/clients/${clientId}`.
7. Return 204 with `Cache-Control: no-store`.
8. **Errors**: log the raw error on the server only.

**`src/lib/contact-beacon.ts`** (browser only):
- `recordContact({ clientId, channel }): string` returns the new id.
  1. Generate the id with `crypto.randomUUID()`.
  2. Send the body as a `text/plain` Blob with `navigator.sendBeacon`.
  3. If `sendBeacon` is missing or returns false, fall back to
     `fetch("/api/contact-events", { method: "POST", body, keepalive: true, credentials: "same-origin" })`.
- It remembers `(clientId, channel) → { id, at }` in memory for
  `BEACON_DEDUPE_MS`, and returns the remembered id instead of sending again.
  The map is per tab and is lost on reload; a second tab or a reload simply
  records a second contact, which is harmless.
- `forgetContact(id)` removes the entry holding that id, so a tap after an
  Undo is recorded again instead of returning the deleted id.

**`src/hooks/use-contact-recorder.ts`**:
- It returns `record(clientId, channel)`, which does four things:
  - calls `recordContact`
  - shows the toast `contactLog.toast.opened` (with the channel label) for
    8 s, with an **Undo** action (below)
  - on the next `visibilitychange` to visible, calls `router.refresh()`
  - if the page never went hidden, calls `router.refresh()` after 1.5 s
    (desktop WhatsApp Web opens in a new tab)
- **Undo**:
  1. Call `forgetContact(id)`, then `deleteContact(id)`.
  2. If it reports `deleted === 0`, the beacon may not have landed yet: wait
     1.5 s and call `deleteContact(id)` once more.
  3. If a row was deleted, show `contactLog.toast.removed` and call
     `router.refresh()`.
  4. If still nothing was deleted, show `contactLog.errors.undoFailed` ("We
     couldn't find that entry. Remove it from Last contact if it shows up.")
     instead. Never say "removed" when nothing was.

**Verify**: `route.test.ts` (node environment) mocks
`@/lib/supabase/server` **and `next/cache`** (`revalidatePath` throws outside
a request), and checks:
- no Origin, or a foreign one, gets 403
- a `Content-Length` of 2000 gets 413, and the body is never read (a stub
  `text()` that throws proves it)
- a bad body gets 400
- no user gets 401
- a valid body gets 204; the upsert payload carries `source: "app_link"` and
  the browser's `id`, with `onConflict: "id"` and `ignoreDuplicates: true`
- two calls with the same id make two identical upserts (the database keeps
  one row), and there is no time-window lookup

`src/lib/contact-beacon.test.ts` (jsdom) checks that a second tap within
10 minutes sends nothing and returns the same id, and that after
`forgetContact(id)` the next tap sends a new id (it is listed in Scope).

#### Step 8: Wire the outreach surfaces

Record first, then open. `sendBeacon` is synchronous and doesn't break the
user-gesture chain, so `window.open` still passes the popup blocker.

1. **`WhatsAppButton`**:
   - Add `"use client"` and a required `clientId` prop.
   - `onClick={() => record(clientId, "whatsapp")}`. Don't call
     `preventDefault`: the anchor still opens WhatsApp.
   - Pass `clientId={client.id}` at `client-detail-view.tsx:450` and
     `clientId={c.id}` at `client-sheet.tsx:199`.
2. **Composer**, in `send()` at `message-composer.tsx:185`:
   - Call `record(client.id, channel)` before `window.open(url, …)` at `:194`,
     and before `window.location.href = url` at `:198`.
   - For email, `record` also runs before the `mailto:` hand-off. It needs the
     client id only, so a missing `client.email` doesn't stop it.
3. **Email and phone rows**:
   - `KeyValueRow` (`key-value.tsx:22`) gets an optional
     `track?: { clientId: string; channel: "email" | "call" }` prop.
   - When `track` is set, it renders `<TrackedContactLink>`, a new client
     component that renders the same `<a>` with an `onClick` calling
     `record`. That keeps the detail page a server component.
   - Pass `track` at `client-detail-view.tsx:421` (email) and `:436` (call).
   - In the sheet, `InfoRow` (`client-sheet.tsx:186-197`) gets an optional
     `onNavigate` callback. Wire it the same way.
4. **Calendar reminders**:
   - Add `clientId: string` to `EventContact` (`calendar.ts:24-29`). Set it to
     `a.client.id` at `:134` and to `v.client_id` at `:170`.
   - In `upcoming-panel.tsx:99-110` and `event-row.tsx:103-113`, add
     `onClick={() => record(e.contact!.clientId, "whatsapp")}` to the
     reminder `<a>`. `remind` is non-null only when `e.contact.phone` exists.

**Verify**:
- `npm run typecheck`.
- On a preview-tmp page (your own folder) that renders `WhatsAppButton`,
  `TrackedContactLink` and `EventRow` with mock data, stub
  `navigator.sendBeacon` with a spy.
  - Each click calls it once, with the right body.
  - A second click within 10 minutes doesn't call it again.
  - The Undo toast appears.
- Delete only your preview folder.

#### Step 9: Log contact and "Last contact"

1. **`LastContact`** (`src/components/clients/last-contact.tsx`, a client
   component). Props: `clientId`, `lastContactedAt`, `timeZone`.
   - The row reads "Last contact · WhatsApp · 3 days ago", or "No contact
     logged yet".
   - Clicking it opens a popover that lazy-loads `listContacts(clientId)`.
     Each entry shows:
     - the channel label
     - "opened from LeadWing" when the source is `app_link`
     - the date in the agent's zone
     - the note
     - a remove icon that calls `deleteContact` after a `ConfirmDialog`
   - The channel shown in the row is the newest entry's. Load it with the
     popover data. Before the popover opens, show only "3 days ago": the
     column holds a time, not a channel.
   - If `listContacts` returns `null`, show "Contact history isn't available
     yet".
2. **`LogContactDialog`** (`log-contact-dialog.tsx`):
   - A channel toggle in `MANUAL_CHANNELS` order.
   - A day picker (`DatePicker`), defaulting to today (the profile-zone day,
     passed in as `todayKey`). Future days are disabled: add an optional
     `maxDate?: string` ("yyyy-MM-dd") prop to `DatePicker`
     (`src/components/date-time-picker.tsx:29-37`) that disables later days
     in its calendar. Existing callers don't pass it and are unchanged. The
     server still rejects a future day (`manualOccurredAt` throws).
   - A note field (at most 500 characters, with a counter).
   - Save calls `logContact`, then shows a toast and calls
     `router.refresh()`.
   - The trigger is a small "Log contact" button.
3. **Where they go**:
   - Detail page: in the Contact panel (`client-detail-view.tsx:411`), put a
     `LastContact` row under the key-value list and the "Log contact" button
     beside the WhatsApp button.
   - Client sheet: the same, under `InfoRow`s (`client-sheet.tsx:183-205`).
   - The sheet has no time zone today. Thread it through:
     `clients-screen.tsx` calls `getAgentTimeZone()` (alongside its existing
     `Promise.all`) and passes `timeZone` (and `todayKey`) to `ClientsView`,
     which passes them to `ClientSheet` at `clients-view.tsx:351`. The
     `/clients/buyers` and `/clients/sellers` pages need no change.
   - For the sheet data, add `last_contacted_at` to the `getClientRows`
     select (`src/lib/data/clients.ts:62`) if it doesn't already select `*`.
   - Keep the sheet's "Last activity" stat on `updated_at`: it means edits.
4. **Copy**: add `clientDetail.contactLog.*` in EN and ES.

   | Key | EN | ES |
   |---|---|---|
   | `title` | Last contact | Último contacto |
   | `never` | No contact logged yet | Aún sin contacto registrado |
   | `value` | {channel} · {when} | {channel} · {when} |
   | `log` | Log contact | Registrar contacto |
   | `channels.whatsapp` / `email` / `call` / `meeting` / `other` | WhatsApp / Email / Call / Meeting / Other | WhatsApp / Correo / Llamada / Reunión / Otro |
   | `opened` | opened from LeadWing | abierto desde LeadWing |
   | `note` | What was agreed? (optional) | ¿Qué quedó hablado? (opcional) |
   | `date` | Day | Día |
   | `save` | Save | Guardar |
   | `toast.opened` | {channel} opened · logged as contact | {channel} abierto · registrado como contacto |
   | `toast.logged` | Contact logged | Contacto registrado |
   | `toast.removed` | Contact removed | Contacto eliminado |
   | `undo` | Undo | Deshacer |
   | `remove` | Remove this entry | Eliminar este registro |
   | `history` | Recent contact | Contactos recientes |
   | `notReady` | Contact history isn't available yet | El historial de contactos aún no está disponible |
   | `errors.undoFailed` | We couldn't find that entry. Remove it from Last contact if it shows up. | No hemos encontrado ese registro. Si aparece en Último contacto, elimínalo desde ahí. |

   Always say "opened" or "logged", never "sent": the app can't know that a
   message was sent.

**Verify**: on a preview page with mock data, check both components:
- in EN and ES
- at 375 px and at desktop width
- in dark mode
- with the dialog open: no console errors, and tomorrow is disabled in the
  day picker

Delete only your preview folder.

#### Step 9b: A default reminder for new viewings (D14)

In `src/components/clients/viewing-dialog.tsx:76-80`, a new viewing
(`viewing` undefined) defaults `reminder` to `"30"` whether or not
`defaultDateKey` is set. Editing an existing viewing keeps its stored value.
The save path already stores `null` when the viewing has no date
(`:142-143`), so an undated viewing still gets no reminder.

**Verify**: `npm run typecheck`. On the preview page, the "new viewing"
dialog opened from a client preselects the 30-minute reminder option; an
existing viewing with no reminder still shows the "none" option.

#### Step 10: The new quiet rule, in `src/lib/data/attention.ts`

1. **Context**: change `AttentionContext` to
   `{ agentId: string; nowISO: string; todayKey: string; timeZone: string }`.
   Update both callers:
   - `dashboard.ts:203-207`: take `agentId` from `getSessionUser()` and add
     `timeZone`.
   - `notifications.ts:288-292`: `agentId` is already in scope. Pass
     `todayKey: taskTodayKey`, `nowISO: serverNowISO` and
     `timeZone: agentZone` (all profile-zone values from `:104-112`), not
     the browser's `ctx.todayKey`: mixing the browser's day with the profile
     zone would skew `quietDays` whenever the two zones differ.
2. **Filter by agent**: add `.eq("agent_id", ctx.agentId)` to **every** query
   in the function: offers, quiet buyers and reservations.
3. **Guard the embeds** (Current state 21), so the function is safe under
   the service-role client in phase 2:
   - Add `agent_id` to both `client:clients(…)` embeds (offers at `:93`,
     reservations at `:106`).
   - Add a pure helper `ownEmbed(embed, agentId)` to `src/lib/attention.ts`.
     It returns the embedded row only when its `agent_id` equals `agentId`,
     else `null`.
   - Offers and reservation rows whose client isn't the agent's own are
     skipped, as a null embed is today. Count them in a returned
     `foreignRows` number, which callers log (agent id prefix only) and
     phase 2 treats as a STOP.
   - PostgREST could also filter in the database with
     `client:clients!inner(agent_id, …)` plus `.eq("client.agent_id", agentId)`.
     The code-level check is used instead because it works the same for
     nullable foreign keys (appointments, tasks) in Step 13.
4. **The quiet query**:
   - Select `id, first_name, last_name, stage, created_at, last_contacted_at`.
   - Keep `side`, `is_active` and `stage` as they are.
   - Replace `.lte("updated_at", staleBefore)` with
     `.or(quietBuyersFilter(staleBefore))`.
   - `quietBuyersFilter` is a new pure export in `src/lib/attention.ts`:

     ```ts
     /** PostgREST or-filter: no contact since `beforeISO`, counting from created_at when none was logged. */
     export function quietBuyersFilter(beforeISO: string): string {
       const v = `"${beforeISO}"`; // ISO timestamps hold reserved characters
       return `last_contacted_at.lte.${v},and(last_contacted_at.is.null,created_at.lte.${v})`;
     }
     ```

5. **Window exclusion**: in the same `Promise.all`, run two more queries, both
   with `.eq("agent_id", ctx.agentId)`:
   - `viewings`, `select("client_id")`, with
     `.or(\`and(scheduled_at.gte."${from}",scheduled_at.lte."${to}"),and(scheduled_at.is.null,created_at.gte."${from}")\`)`
   - `appointments`, `select("client_id")`, with
     `.not("client_id", "is", null)`, `.gte("starts_at", from)` and
     `.lte("starts_at", to)`

   Here `from = now − CONTACT_WINDOW_DAYS` and `to = now + CONTACT_WINDOW_DAYS`.
   Skip any quiet buyer whose id appears in either result.
6. **Days quiet**: `quietDays` counts from
   `dateKeyInTimeZone(last_contacted_at ?? created_at, ctx.timeZone)` to
   `ctx.todayKey`, with at least 1.
7. **New fields**: `StaleBuyer` gains `lastContactAt: string | null`.
   `neverContacted` is `lastContactAt === null`.
8. **Copy**:

   | File · key | EN | ES |
   |---|---|---|
   | `home.json` `attention.followUp` | {stage} · no contact in {days, plural, one {# day} other {# days}} | {stage} · {days, plural, one {# día} other {# días}} sin contacto |
   | `home.json` `attention.followUpNever` (new) | {stage} · no contact logged yet | {stage} · aún sin contacto registrado |
   | `server.json` `notifications.followUpBody` | {stage} · no contact in {days, plural, one {# day} other {# days}} | {stage} · sin contacto desde hace {days, plural, one {# día} other {# días}} |
   | `server.json` `notifications.followUpBodyNever` (new) | {stage} · no contact logged yet | {stage} · aún sin contacto registrado |

   `dashboard.ts:272-283` and `notifications.ts:309-323` pick the `…Never`
   key when `neverContacted` is true.
9. **Missing column**: if the quiet query fails with 42703 (column missing,
   i.e. a deploy before the migration), fall back to the old `updated_at`
   query and log once. Remove the fallback in the phase 2 commit.

**Verify**:
- `src/lib/attention.test.ts` (extend it) checks the exact
  `quietBuyersFilter` string.
- `src/lib/data/attention.test.ts` (new, node environment) runs
  `getAttentionSignals` on a recording fake client whose builder methods log
  their calls. It asserts:
  - every `from(...)` chain carried `eq("agent_id", <id>)`
  - a buyer with a viewing inside the window is excluded
  - `quietDays` counts from `created_at` when there is no contact
  - `neverContacted` is set
  - **a foreign row is dropped**: an offer viewing and a reservation whose
    embedded client has another `agent_id` produce no stalled offer, no key
    date and no name anywhere in the result, and `foreignRows` is 2
- **Live filter check**: `<scratchpad>/verify-quiet-filter.mjs`, one script,
  one `now`:
  - Load `@supabase/supabase-js` and `pg` through
    `createRequire("/Users/lepadatumihail/Documents/work/personal/lena/package.json")`
    (and the scratchpad for `pg`).
  - Import `quietBuyersFilter` from `src/lib/attention.ts`. Run the script
    with `node --experimental-strip-types --env-file=…`; the file has no
    imports.
  - Fix `now` once at the top and derive `staleBefore` from it.
  - For **every** agent id in `profiles`, count quiet buyers twice:
    - through PostgREST with the service-role key, `.eq("agent_id", id)` and
      the same filters as the app (before the window exclusion)
    - with SQL through `pg`, passing the same `staleBefore`:
      `select agent_id, count(*) from clients where side = 'buyer' and is_active and stage <> 'reserved' and coalesce(last_contacted_at, created_at) <= $1 group by agent_id`
  - Print one line per agent (id prefix and the two counts). Every pair must
    match. Don't compare against a number printed on an earlier day: buyers
    cross the 7-day line every day.
- `npm test` passes, and `nvm use 24 && npm test` passes too.

#### Step 11: Phase 1 claims, checks and ship

- Switch every phase 0 string to the **phase 1** wording in "Until this
  ships".
- Run `npm run typecheck && npm run lint && npm test && npm run build`.
- **Manual, signed in** (the founder, on production after the push), on a real
  iPhone and on a desktop.
  - **Setup**:
    - Create 5 test buyers, each with the founder's own phone number, named
      "Test 1" to "Test 5".
    - Book one meeting today with "Test 5", so the calendar reminder link
      shows.
    - A repeated tap on the same buyer and channel within 10 minutes sends
      nothing by design, so a lost beacon would look the same. Each tap
      below therefore uses a different buyer. The alternative is to wait
      more than 10 minutes between taps.
  - **Steps**:
    1. Tap once per surface, each on a different test buyer:
       - WhatsApp in the sheet (Test 1)
       - WhatsApp on the detail page (Test 2)
       - a WhatsApp send in the composer (Test 3)
       - the phone row on the detail page (Test 4; it records a call)
       - the calendar reminder (Test 5)

       Come back each time and note which surface the tap came from. Each
       buyer's "Last contact" must read "just now" (with "WhatsApp" or
       "Call" once the popover has loaded). At most one of the 5 may miss
       (see STOP), and the report names the surface that missed.
    2. Pick one of the founder's existing quiet buyers that has an **unread**
       follow-up in the bell (the founder has 3 active buyers and 11 unread
       nudges). Tap WhatsApp on it. The unread follow-up disappears from the
       bell.
    3. Tap Undo on that toast. The toast says "Contact removed", "Last
       contact" goes back to its previous value, and after the bell's next
       sync (open the bell) the follow-up is back, unread.
    4. Log a call dated yesterday with a note. The history popover shows it.
       Tomorrow can't be picked.
    5. Move a `new` test buyer to `contacted`. A `stage` entry appears.
    6. Check that the client list order and "Updated …" did **not** change
       after steps 1 and 4.
    7. Add a viewing from a client page: the reminder preselects 30 minutes
       (D14).
  - **Cleanup**: the founder deletes the 5 test buyers (their contacts
    cascade) and the test meeting.
- Update `plans/README.md` row 016: "phase 1 DONE".

### Phase 2: scheduled generation and the morning email

Start only when phase 1 is live, D5–D10 are confirmed, and the interview gate
in "Status → Gated by" has passed (or the founder says go in chat). Also check
the "phase 2" rows in "Prerequisites outside the code".

#### Step 12: The phase 2 migration: `supabase/migrations/<timestamp>_notification_digests.sql`

```sql
-- ============================================================
-- Morning digest: an agent-level email switch, and one row per agent per
-- local day so an hourly (best-effort, possibly duplicated) cron sends at
-- most one digest a day. Only the service role writes digest rows; the agent
-- can read their own.
--
-- The switch starts ON only for agents who signed in within the last 30
-- days (dormant and pre-rename accounts start OFF and get one bell prompt);
-- every account created after this migration starts ON.
-- ============================================================

alter table public.profiles
  add column if not exists email_digest boolean not null default false;

update public.profiles p
   set email_digest = true
  from auth.users u
 where u.id = p.id
   and u.last_sign_in_at > now() - interval '30 days';

alter table public.profiles
  alter column email_digest set default true;

-- The one-time bell prompt for agents whose switch starts off. Not usable
-- in this transaction (Postgres forbids using a new enum value before the
-- commit); nothing here uses it.
alter type public.notification_type add value if not exists 'digest_offer';

-- Agents cannot update their profile row directly (see profile_settings).
create or replace function public.update_my_notification_prefs(p_email_digest boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_email_digest is null then
    raise exception 'email_digest must be true or false' using errcode = '22023';
  end if;
  update public.profiles
     set email_digest = p_email_digest
   where id = auth.uid();
end;
$$;

revoke all on function public.update_my_notification_prefs(boolean) from public, anon;
grant execute on function public.update_my_notification_prefs(boolean) to authenticated;

create table public.notification_digests (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  status text not null default 'pending',
  -- the address fixed at claim time; a retry always resends to it
  recipient text,
  subject text,
  -- kept only while a retry may need them: nulled once the row is sent or
  -- skipped, and by the cron for rows older than 24 hours
  text_body text,
  html_body text,
  item_count integer not null default 0,
  provider_id text,
  error text,
  attempts integer not null default 0,
  attempted_at timestamptz,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint notification_digests_status_valid
    check (status in ('pending', 'sent', 'failed', 'skipped')),
  constraint notification_digests_error_len
    check (error is null or char_length(error) <= 500),
  constraint notification_digests_agent_day unique (agent_id, local_date)
);

create index notification_digests_agent_created_idx
  on public.notification_digests (agent_id, created_at desc);

alter table public.notification_digests enable row level security;

create policy "agent reads own digests" on public.notification_digests
  for select to authenticated
  using (agent_id = (select auth.uid()));
-- No insert/update/delete policy: only the service role (the cron) writes.
```

**Rehearse** (`<scratchpad>/rehearse-digests.mjs`, same skeleton as Step 3).
Check that:
- `email_digest` is true exactly for the profiles whose `auth.users.last_sign_in_at`
  is within 30 days. Print the on/off counts (7 on and 3 off on 16 Sep 2026;
  expect different numbers on the day).
- a profile inserted after the migration inside the transaction (through a
  test `auth.users` row, or by reading `column_default`) defaults to true
- `select 'digest_offer'::public.notification_type` fails inside the
  rehearsal transaction ("unsafe use of new value"). That is expected; after
  the live commit the same query must succeed.
- as the founder, `update_my_notification_prefs(false)` flips only their own
  row
- `has_function_privilege('anon', 'public.update_my_notification_prefs(boolean)', 'execute')`
  is false
- as the founder, inserting into `notification_digests` fails with a
  row-level security error, while selecting their own rows works
- after `reset role; set local role service_role`, an insert works, and a
  second insert for the same `(agent_id, local_date)` with
  `on conflict do nothing` returns 0 rows

A dry run of this SQL on 16 Sep 2026 (rolled back) passed the switch,
default, enum, RLS, prefs, claim and `anon` checks above, with 7 profiles on
and 3 off. Nothing was kept.

**Apply** as in Step 4. Then run the same checks:
- the history row is present
- `pg_policies` has 1 row for the table
- `prosecdef` is true for `update_my_notification_prefs`

**Types**:
- `email_digest: boolean` on `profiles`
- `"digest_offer"` added to the `notification_type` enum union
  (`types.ts:934`), with its icon and tone in `notification-item.tsx` and a
  `/settings` target in `notificationHref`
- `notification_digests` (Row, Insert, Update), including `recipient`
- `Functions.update_my_notification_prefs: { Args: { p_email_digest: boolean }; Returns: undefined }`

#### Step 13: Move generation out of the request: `src/lib/notify/generate.ts`

The folder is `notify`, not `notifications`: a `notifications/` folder next to
`src/lib/notifications.ts` would make `@/lib/notifications` imports
ambiguous to read.

- **Signature**:
  `generateForAgent(db: SupabaseClient<Database>, input: { agentId: string; locale: AppLocale; timeZone: string; now: Date; emailDigest?: boolean }): Promise<{ upserted: number; foreignRows: number; error: string | null }>`
- **Move the body** of `syncNotifications` (`notifications.ts:90-430`) here,
  with these changes:
  - **Translations**:
    `getTranslations({ locale, namespace: "server.notifications" })`, and the
    same for `server.appointments` and `crm`.
  - **Day and week**:
    - `todayKey = dateKeyInTimeZone(nowISO, timeZone)`
    - day range from `dayRangeInTimeZone`
    - `weekKey` from the **local** date:
      `getISOWeekYear(parseISO(todayKey))` and
      `getISOWeek(parseISO(todayKey))`
  - **Formatting**: every body uses `timeZone`. Appointment reminders, the
    today digest and task pings all share the one clock (`now`) and the one
    zone.
  - **Filter every query by agent**: add `.eq("agent_id", agentId)` to
    - the appointments, viewings and tasks reads
    - the 30-day prune
    - the task-ping select
    - the task-ping delete

    The upsert rows already carry `agent_id`.
  - **Guard every embed** (Current state 21). The `agent_id` filter on the
    top-level table isn't enough under the service role:
    - Select `agent_id` in each embed: `client:clients(agent_id, first_name, last_name)`
      on appointments, viewings and tasks, and
      `property:properties(agent_id, address, property_type)` on
      appointments.
    - A row whose `client_id` (or `property_id`) is set but whose embed is
      missing or belongs to another agent is **skipped entirely**: no
      reminder, no line in the `appointment_today` body, no task ping. It is
      never rendered as "a client" or without its property. Use
      `ownEmbed` from Step 10.
    - Count the skipped rows (plus `getAttentionSignals`' `foreignRows`) in
      `foreignRows`. The cron logs them, and any value above 0 is a STOP.
  - **Quiet signals**: call `getAttentionSignals(db, { agentId, nowISO, todayKey, timeZone })`.
  - **The digest prompt** (D7): when `emailDigest === false`, and the agent
    has no `notification_digests` row at all, upsert one row with
    `type: "digest_offer"`, `dedupe_key: "digest-offer"`, no client, and the
    title `server.notifications.digestOffer` ("Get a short morning summary
    by email" / "Recibe un resumen breve cada mañana por correo"). The body
    is `digestOfferBody` ("Turn it on in Settings → Notifications." / "Actívalo
    en Ajustes → Notificaciones."). Its key never changes, so it appears at
    most once. The bell wrapper passes `emailDigest` from the profile too.
  - **The 30-day prune** also skips `dedupe_key = 'digest-offer'`, as it
    already skips task pings; otherwise a read prompt would be pruned and
    come back a month later.
  - **Follow-up rows**: build them through `followUpRows(staleBuyers, { agentId, weekKey, nowISO, t, stageName })`
    in `src/lib/follow-ups.ts`.
    - If plan 012 has landed, that file exists: use it. Its digest row and
      its unread-row delete must also filter by `agent_id`.
    - If not, create the file with the same signature and today's
      per-client rows only, so 012's Step 10 changes just the body.
- **The bell becomes a thin wrapper**:
  - `syncNotifications()` takes **no arguments**.
  - It keeps today's `getSessionUser()` check (the local `getClaims()` read
    from `9bd2da3`; RLS still protects the data). Don't switch it to
    `getUser()`: that adds a Supabase Auth round-trip to every 5-minute poll
    in every open tab.
  - Then it reads `getSessionProfile()` for `locale`, `time_zone` and
    `email_digest`, and calls `generateForAgent(cookieClient, …)`.
  - `loadNotifications()` takes no arguments either.
  - In `notifications-bell.tsx`, delete `buildContext` and its date-fns
    imports.
  - Delete `SyncContext` and `syncContextSchema` (plan 003's validation of the
    browser context has nothing left to check).
- **Cleanup**: remove Step 10's `updated_at` fallback.

**Verify**: `src/lib/notify/generate.test.ts` (node environment) uses the
recording fake client from Step 10, with `next-intl/server` mocked. It
asserts:
- every read, the prune and the task cleanup carry `eq("agent_id", …)`
- **foreign rows leak nothing**: the fake data holds, for agent A, one
  appointment today whose client belongs to agent B ("Bianca Foreign"), one
  appointment at B's property ("Calle Ajena 1"), one viewing and one task on
  B's client, and one own appointment. The upserted rows contain neither
  string in any title or body, including the `appointment_today` body (which
  has no `client_id`); the own appointment is still there; `foreignRows` is 4
- the week key for `2026-09-20T23:30:00Z` in `Europe/Madrid` (already Monday
  21 Sep locally) is `2026-W39`
- the today digest key uses the profile zone
- a Spanish locale produces Spanish titles
- `emailDigest: false` with no digest rows writes one `digest-offer` row;
  with a digest row present it writes none; the prune excludes the key

`npm test` and `nvm use 24 && npm test` must pass.

#### Step 14: The cron route: `src/app/api/cron/notifications/route.ts`

```ts
export const maxDuration = 300;
export async function GET(request: Request) { … }
```

The handler takes these steps:
1. **Auth**:
   - Use the shared `authorizeCron(request)` helper in
     `src/lib/integrations/cron-auth.ts` (plan 013 D22). It and the
     `CRON_SECRET` env var (P7) are created by whichever of plans 013, 014,
     016 and 017 lands first, expected to be this phase; later plans reuse
     them. If the file already exists, reuse it as it is. An unset
     `CRON_SECRET` is logged as `cron_secret_missing` and answered with 401,
     and no work runs (aligned across 013, 014, 016 and 017 on 17 Sep 2026).
   - Compare `Authorization` with `Bearer ${secret}` using
     `crypto.timingSafeEqual` on equal-length buffers. On a mismatch, log
     `cron_secret_mismatch` and return 401; no work runs.
2. **Safety outside production**: when `process.env.VERCEL_ENV !== "production"`,
   require `?agent=<uuid>` and process only that agent. Otherwise return 400.
   This stops a local run (whose `.env.local` points at the live database)
   from touching every tenant.
3. **Walk the profiles**:
   - `admin = createAdminClient()`.
   - Page through `profiles` with
     `select("id, email, locale, time_zone, email_digest")`,
     `.order("id")` and `.range(from, from + 199)`.
4. **Generate for each agent**, 5 agents at a time with
   `Promise.allSettled`. This pass only talks to the database.
   - `locale = isLocale(p.locale) ? p.locale : DEFAULT_LOCALE`
   - `timeZone = resolveTimeZone(p.time_zone)`
   - `await generateForAgent(admin, { …, emailDigest: p.email_digest })`
   - Wrap each agent in its own try/catch. Log only
     `{ agent: id.slice(0, 8), step, message }`, never names or email
     addresses. If `foreignRows > 0`, log
     `{ agent, step: "foreign_rows", count }` at error level.
5. **Send digests one agent at a time**, after the generation pass:
   `await runDigest(admin, p, …)` (Step 17), then wait at least 150 ms
   before the next agent that actually sent.
   - Why: Resend allows 10 requests a second **per team**
     (https://resend.com/docs/api-reference/introduction, checked
     2026-09-16). The same team sends for torresmethod.com and, over SMTP,
     LeadWing's sign-in codes. Every agent is in Madrid, so all digests fall
     due in the same 08:00 run. Sequential sends stay near 6 a second and
     leave room for sign-in codes. (Whether SMTP sends count toward the API
     limit is unverified.)
   - Past about 1,000 recipients a day, switch to Resend's batch endpoint
     (up to 100 emails per call) instead.
6. **Housekeeping**, each run:
   - delete `notification_digests` rows older than 30 days
   - set `text_body` and `html_body` to null on rows older than 24 hours
     (Resend keeps an idempotency key for 24 hours, so an older row can't be
     resent safely anyway)

   Every statement has a WHERE clause, which keeps `safeupdate` happy.
7. **Response**:
   `Response.json({ agents, upserted, foreignRows, digests: { sent, skipped, failed, pending, off }, ms })`
   with `Cache-Control: no-store`.

**`vercel.json`**: first run Step 21b's "fallback active" check (another
plan may have landed a cron first and switched to it). If it is active,
schedule this route as a `cron.schedule` migration with Step 21b's recipe
(schedule `0 * * * *`, header `x-vercel-cron-schedule: 0 * * * *`) and skip
the rest of this paragraph. Otherwise **append** this entry to the `crons`
array, creating the array if it doesn't exist yet. Never write the whole file or replace the
block: plans 013, 014 and 017 add their own entries, and every other key
(today `$schema` and `regions: ["fra1"]`) stays as it is.

```json
{ "path": "/api/cron/notifications", "schedule": "0 * * * *" }
```

Check afterwards: `git diff vercel.json` shows only the added entry (plus
the `"crons": [` wrapper if this plan is the first).

Leave the proxy matcher alone. `updateSession` is harmless on this path, and
the handler authenticates itself.

**Verify**: `route.test.ts` (node environment) mocks
`@/lib/supabase/admin`, `next/cache`, `generateForAgent` and `runDigest`,
and checks:
- no header, or a wrong one, gets 401 (logged as `cron_secret_mismatch`),
  and neither `generateForAgent` nor `runDigest` is called
- an unset secret gets 401 (logged as `cron_secret_missing`), and no work
  runs
- in non-production with no `agent` gets 400
- a valid call processes exactly the paged profiles
- one agent throwing doesn't stop the others
- `runDigest` is never called concurrently (the mock records overlapping
  calls; there must be none)
- the housekeeping statements are one delete and one update, both with a
  WHERE on `created_at`

Then run `npm run dev` and use the local curl from "Commands" with the
founder's id: it returns 200 with `agents: 1` and `foreignRows: 0`.

#### Step 15: `sendEmail` grows up: `src/lib/email.ts`

- **Input**: extend `SendEmailInput` with optional `from`, `html`,
  `headers: Record<string, string>` and `idempotencyKey`.
- **Request**: send `html` and `headers` in the JSON body, and
  `Idempotency-Key` as a request header when given. `from` defaults to
  `SUPPORT_FROM`.
- **Result**: return `{ id: string | null }` from the response JSON.
- **Errors**: on failure, throw an `EmailSendError` with `status`, `name`
  (Resend's error `name` from the JSON body) and a message of at most 300
  characters. The support dialog callers ignore the return value and keep
  working. The names Step 17 acts on (Resend errors reference,
  https://resend.com/docs/api-reference/errors, checked 2026-09-16):
  - 409 `invalid_idempotent_request`: the key was used with a different
    payload
  - 409 `concurrent_idempotent_requests`: a request with the same key is
    still in progress; retrying later is safe
  - 429 `rate_limit_exceeded`: retry later
  - 429 `daily_quota_exceeded` / `monthly_quota_exceeded`: the plan's quota
    is used up, which also blocks sign-in codes (a STOP)
  - 403 `validation_error`: for example an unverified sending domain (a
    STOP if it names the sender)
- **`DIGEST_FROM`**:
  `process.env.DIGEST_FROM_EMAIL?.trim() || "LeadWing <reminders@leadwing.app>"`.
- **`.env.example`**: document these next to `RESEND_API_KEY`:
  - `CRON_SECRET`
  - `DIGEST_EMAILS` (`on` enables sending)
  - `DIGEST_ONLY_AGENT` (a profile id; when set, only that agent gets a
    digest; used for the first production send)
  - `DIGEST_FROM_EMAIL`

**Verify**: `src/lib/email.test.ts` stubs `fetch` and checks:
- the headers and body carry `Idempotency-Key`, `html` and
  `List-Unsubscribe`
- a 409 body `{ name: "invalid_idempotent_request" }` becomes an
  `EmailSendError` with that name, and so do
  `concurrent_idempotent_requests` and a 429 `rate_limit_exceeded`
- the existing support call shape is unchanged

#### Step 16: The digest content: `src/lib/notify/digest.ts` (pure)

**Signature**:
`buildDigest(input): { subject: string; text: string; html: string; itemCount: number } | null`

**Input**:
- `locale` and `timeZone`
- `t`, the new `server.digest` translator
- `agentName`
- `events`: time, title
- `tasks`: title, client name, days late (due today, or overdue by exactly
  1 day)
- `olderOverdueCount`: the number of tasks overdue by 2 days or more
- `keyDates`: label, client name, date
- `offers`: client name (only offers newly flagged since the last digest)
- `quietBuyers`: name, `quietDays`, `neverContacted`
- `isFirstDigest`: true when the agent has no earlier `sent` digest
- `homeUrl`, `settingsUrl`, `unsubscribeUrl`, `legalUrl`

**Rules**:
- **When to skip**: return `null` when `events`, `tasks`, `keyDates`,
  `offers` and `quietBuyers` are all empty. `olderOverdueCount` alone never
  triggers a send; it is shown as one line ("3 older overdue tasks" / "3
  tareas atrasadas de días anteriores") only when something else is in the
  email.
- **Section caps**: at most 8 events, 5 tasks, 5 key dates and 5 offers.
  Quiet buyers show at most 5, then "and {count} more".
- **First email**: when `isFirstDigest` is true, the email opens with one
  line: "New: your morning summary from LeadWing. Turn it off here:
  {unsubscribeUrl}" / "Novedad: tu resumen de la mañana de LeadWing. Puedes
  desactivarlo aquí: {unsubscribeUrl}".
- **Subject**: built from the counts, e.g. "Today: 2 viewings · 1 task due" /
  "Hoy: 2 visitas · 1 tarea pendiente". If only quiet buyers remain, use
  "3 buyers to follow up" / "3 compradores para hacer seguimiento".
- **What it may show**: client names, event titles, times and dates only.
  Never phones, emails, notes, budgets, prices or commission amounts.
- **No promotion of any kind**: no upgrade, referral or founding-offer blocks.
- **HTML**:
  - One column, system fonts, inline styles, no images and no tracking.
  - Escape every value with a local `escapeHtml`.
  - The text version holds the same content.
- **Footer**, in both formats and in the agent's language:
  - "You get this because the morning summary is on in LeadWing."
  - "Turn it off: {unsubscribeUrl} · or in Settings → Notifications
    ({settingsUrl})"
  - "LeadWing · {legalUrl}". This is the sender identification (LSSI art. 10
    and 20.1, via the legal notice page). It only identifies anyone once the
    legal-entity placeholders are filled, so P12 is required before
    `DIGEST_EMAILS=on`.
- **Copy**: add a new `digest` object under `messages/{en,es}/server.json`
  with the subject variants, section titles, "and {count} more", the footer
  lines and the unsubscribe page strings (Step 18).

**Verify**: `digest.test.ts` checks:
- empty input returns `null`
- the caps and the "more" line
- a name `<script>alert(1)</script>` is escaped in the HTML
- the input type has no phone, email, note or amount field. In
  `run-digest.test.ts`, a full client row (phone, email, notes, budget) goes
  through Step 17's mapper `toDigestInput`, and none of those values appear
  in the subject, text or HTML
- the EN and ES subjects
- the footer has all three links
- `olderOverdueCount: 3` with every list empty returns `null`; with one
  event it shows the "3 older overdue tasks" line
- `isFirstDigest: true` puts the "New:" line first, in both formats

#### Step 17: Sending: `src/lib/notify/run-digest.ts`

**Signature**:
`runDigest(admin, profile, { now, locale, timeZone }): Promise<"sent" | "skipped" | "failed" | "pending" | "off">`

It takes these steps in order:
1. **Gates**. Return `"off"` without writing anything when any of these
   holds:
   - `profile.email_digest === false`
   - `process.env.DIGEST_EMAILS !== "on"`
   - `process.env.DIGEST_ONLY_AGENT` is set and isn't `profile.id`
   - `!emailConfigured()`
   - `hourInTimeZone(nowISO, timeZone)` (`src/lib/home.ts:19`) is outside
     8–11
2. **The local day**: `localDate = dateKeyInTimeZone(nowISO, timeZone)`.
3. **Existing row**: read `notification_digests` for
   `(agent_id, local_date)`.
   - `sent` or `skipped`: return that status.
   - `pending` or `failed` with `attempts < 3`, whose
     `coalesce(attempted_at, created_at)` is at least 10 minutes old, and
     whose bodies are still stored: **resend the stored payload to the
     stored `recipient`** (step 6). Never rebuild it, and never re-read
     `profiles.email`: a changed address would change the payload and
     trigger `invalid_idempotent_request`.
   - Anything else: return that status.
4. **Build**:
   - Read the day's data with `.eq("agent_id", …)` and the embed guard from
     Step 13:
     - today's appointments and viewings
     - open tasks due today, tasks overdue by exactly 1 day, and the count
       of older overdue tasks
     - `getAttentionSignals` for key dates, offers and quiet buyers
   - The previous digest is the agent's newest `notification_digests` row
     with a `local_date` before today.
   - **Quiet buyers and offers** are limited to clients whose `follow_up` or
     `stalled_offer` row was **created** after that digest's `created_at`,
     or in the last 7 days if there is none. Both row kinds carry a weekly
     key, so a still-quiet buyer or still-stalled offer returns once a week.
   - `isFirstDigest`: no `sent` row exists for the agent.
   - Call `buildDigest`.
5. **Claim**:
   - Recipient: `profile.email`. If it is null, use
     `admin.auth.admin.getUserById(id)`. If there is still no address, insert
     `status: 'skipped', error: 'no_email'`.
   - If `buildDigest` returned `null`, insert `status: 'skipped'` (no
     bodies).
   - Otherwise insert `status: 'pending'` with `recipient`, subject, bodies
     and `item_count`, using
     `.upsert(row, { onConflict: "agent_id,local_date", ignoreDuplicates: true }).select("id")`.
     If no row comes back, another run owns this day: return `"pending"`.
6. **Send**, with the stored payload and the stored recipient:
   - `sendEmail({ from: DIGEST_FROM, to: row.recipient, subject, text, html, replyTo: SUPPORT_EMAIL, idempotencyKey: \`digest/${agentId}/${localDate}\`, headers })`
   - `headers` are:
     - `List-Unsubscribe: <${unsubscribeUrl}>`
     - `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
7. **Record the outcome**. Every update has a WHERE on `id`.
   - **Success**: set `status: 'sent'`, `sent_at`, `provider_id`,
     `attempted_at = now()`, `attempts + 1`, and null `text_body` and
     `html_body`.
   - **409 `invalid_idempotent_request`**: an earlier attempt got through
     with a different payload. Mark `sent` the same way and keep the error
     name.
   - **409 `concurrent_idempotent_requests`**: another run is sending this
     very email right now. **Write nothing** and return `"pending"`. The
     other run records the outcome.
   - **429 `rate_limit_exceeded`**: set `status: 'failed'`,
     `error: 'rate_limit_exceeded'` and `attempted_at = now()`, **without**
     incrementing `attempts`, so the next run retries.
   - **429 `daily_quota_exceeded` / `monthly_quota_exceeded`**: set
     `status: 'failed'` and the error name, and stop sending for the rest of
     this cron run. The route logs it at error level (a STOP: sign-in codes
     share the quota).
   - **Any other error**: set `status: 'failed'`, `error` (at most 500
     characters), `attempted_at = now()` and `attempts + 1`.
   - **Every failure update is conditional**: `.eq("id", id).neq("status", "sent")`,
     so a duplicate run can never overwrite a concurrent `sent` with
     `failed`.

**URLs**: always build them from `SITE_URL`, the `https://www.leadwing.app`
host, and never from the apex: the apex answers 308, and one-click
unsubscribe POSTs don't follow redirects. Note that `.env.local` sets
`NEXT_PUBLIC_SITE_URL` to localhost, so a local run must override it (Step
21).
- `homeUrl = ${SITE_URL}/home`
- `settingsUrl = ${SITE_URL}/settings`
- `legalUrl` is the legal notice route from `MARKETING_ROUTES` for the
  agent's language
- `unsubscribeUrl = ${SITE_URL}/api/unsubscribe/${unsubscribeToken(agentId)}`

**Verify**: `run-digest.test.ts` (node environment) uses a fake admin client
and a stubbed `sendEmail`. It checks:
- outside 8–11 nothing happens
- an empty day is `skipped` and nothing is sent
- a conflict on the claim sends nothing
- a `failed` row is resent with **byte-identical** subject and bodies, the
  same key and the **stored recipient**, even after `profile.email` changed
- after 3 attempts it stops
- a 409 `invalid_idempotent_request` becomes `sent`
- a 409 `concurrent_idempotent_requests` writes nothing and returns
  `pending`
- a 429 `rate_limit_exceeded` sets `failed` without incrementing `attempts`
- every failure update carries `.neq("status", "sent")`
- a successful send nulls both bodies
- `email_digest=false`, `DIGEST_EMAILS` unset, and `DIGEST_ONLY_AGENT` set to
  another id all return `off`
- the first-ever digest sets `isFirstDigest`; a stalled offer already listed
  in this ISO week's earlier digest isn't listed again

#### Step 18: Unsubscribe: token and route

**`src/lib/unsubscribe-token.ts`**:
- `unsubscribeToken(agentId)` returns `"<b64url id>.<b64url HMAC-SHA256('digest-unsubscribe:' + agentId)>"`,
  keyed with `SUPABASE_SERVICE_ROLE_KEY`.
- `verifyUnsubscribeToken(token)` returns the agent id or null, comparing
  with `timingSafeEqual` as `calendar-feed-token.ts` does.
- **Never import `feedToken` here.**

**`src/app/api/unsubscribe/[token]/route.ts`**. Check `params` against the
Next 16 route-handler docs; they are a Promise, as in
`api/calendar/[token]/route.ts:16-20`.
- **`GET`**:
  - Verify the token. On failure, return a 404 page.
  - Read `profiles.locale` with the admin client, filtered by id.
  - Return a small HTML page in that language: "Stop the morning summary?"
    with a `<form method="post">` button, plus a link to Settings.
  - Headers: `Content-Type: text/html; charset=utf-8`,
    `Cache-Control: no-store`, `X-Robots-Tag: noindex`.
  - **GET never changes anything**: link scanners fetch URLs.
- **`POST`**:
  - Verify the token.
  - `admin.from("profiles").update({ email_digest: false }).eq("id", agentId)`.
  - Return 200 with the "You won't get the morning summary any more. Turn it
    back on in Settings." page.
  - Mail clients send `List-Unsubscribe=One-Click` as a form body. Accept any
    body, with no cookies and no auth, per RFC 8058.
- Escape every string in both pages.

**Verify**:
- `unsubscribe-token.test.ts` checks:
  - a round trip works
  - a tampered signature fails
  - `verifyFeedToken(unsubscribeToken(id))` is null
  - `verifyUnsubscribeToken(feedToken(id))` is null
- `route.test.ts` checks:
  - GET with a valid token is 200 and makes no DB write
  - POST with a valid token makes exactly one update, filtered by id
  - a bad token gets 404 on both

#### Step 19: Settings "Notifications" panel

- **`saveNotificationPrefs(emailDigest: boolean)`** in
  `src/lib/actions/settings.ts`:
  1. Validate with zod.
  2. Call `rpc("update_my_notification_prefs", { p_email_digest })`.
  3. If the function is missing (`PGRST202`), return `errors.notReady`.
  4. Then `revalidatePath("/settings")`.
- **`NotificationsPanel`** (`src/components/settings/notifications-panel.tsx`):
  - A `Panel` with the `BellRing` icon, rendered right after
    `<PreferencesPanel />` (`settings-view.tsx:170`). Plan 011's Data panel
    goes after it.
  - **Row 1**: a "Morning summary" `Switch`, with the description "A short
    email around 08:00 ({zone}) on days with viewings, tasks or buyers to
    follow up. Sent to {email}." It saves optimistically and reverts with a
    toast on error.
  - **Row 2** (plain text): "In-app reminders appear in the bell while
    LeadWing is open."
- **Props**: `settings/page.tsx` passes `emailDigest={profile?.email_digest ?? true}`,
  `timeZone` and `email`.
- **Copy**: `settings.notifications.*`, EN and ES.

**Verify**: check the panel on a preview page in both languages, at 375 px and
at desktop width, with the switch toggled. Delete the preview folder.

#### Step 20: Privacy text

This step is what makes the morning email covered: today's "the reminders
you set" doesn't describe a summary the agent never set up.
- **EN**, `privacy.en.tsx:119-121`: after "the reminders you set", add
  "(including a morning summary email with your clients' names, which you can
  turn off)".
  - Resend cell (`:252`): "Sending sign-in codes and service emails,
    including the morning summary".
  - Section 10 (`:341-352`), a new list item: "Email delivery records at our
    email provider (Resend): up to 30 days. Our own copy of a morning
    summary's text is deleted once it has been sent, and within 24 hours at
    the latest."
- **ES**, the same in `privacy.es.tsx:122-124`, the Resend cell at `:262`
  and section 10 (`:355` onwards):
  - "(incluido un resumen por correo cada mañana con los nombres de tus
    clientes, que puedes desactivar)"
  - "Envío de códigos de acceso y emails del servicio, incluido el resumen de
    la mañana"
  - "Registros de envío de correo en nuestro proveedor (Resend): hasta 30
    días. Nuestra copia del texto de cada resumen de la mañana se borra en
    cuanto se envía y, como mucho, a las 24 horas."
- **Date**: set `LEGAL_UPDATED.privacy` to the day this ships.
- The 30 days come from Resend's pricing page ("30-day data retention" on
  every plan, https://resend.com/pricing, checked 2026-09-16).

**Verify**: `/privacy` and `/es/privacidad` render the new text and date.
`/es/privacidad` already has a known phone overflow, so don't make it worse:
compare `scrollWidth` before and after.

#### Step 21: Environment, deploy, and the first live run

This step needs at least two mornings: the founder test on day 1 inside
08:00–11:59 Madrid time, the first production send on day 2, and the widening
on day 3 at the earliest.

1. **Prerequisites**: confirm the "phase 2" rows below are done.
   - Link the repo once ("Commands": back up `.env.local` first).
   - `npx vercel@latest env ls production --scope lepadatumihails-projects`
     must list `RESEND_API_KEY` and `CRON_SECRET`.
   - Leave `DIGEST_EMAILS` and `DIGEST_ONLY_AGENT` **unset** for now.
2. **Apply** Step 12's migration if you haven't yet.
3. **Push** (with the operator's go-ahead) and wait for the deploy to be
   Ready.
4. **Test the cron**:
   `npx vercel@latest crons run /api/cron/notifications --scope lepadatumihails-projects`
   (or the founder presses **Run** in the dashboard: lena-crm → Settings →
   Cron Jobs). Then read the runtime logs for
   `requestPath:/api/cron/notifications`. The Vercel MCP runtime-logs tool
   works if the CLI can't show them.
   - **Expected**: a 200 from our handler, with `agents` equal to the profile
     count and `foreignRows: 0`.
   - **A 401 from Vercel's own auth page** (not our JSON), or no invocation
     at all, means Deployment Protection is in the way (D5). STOP and report
     with the fallback below; the founder chooses.
5. **Check the data** with a read-only DB probe:
   - `notifications` gained rows for agents who haven't opened the app since
     the deploy.
   - No row anywhere points at another agent's data. Every count must be 0:

   ```sql
   select
     (select count(*) from public.notifications n join public.clients c on c.id = n.client_id where c.agent_id <> n.agent_id) as notifications,
     (select count(*) from public.viewings v join public.clients c on c.id = v.client_id where c.agent_id <> v.agent_id) as viewings,
     (select count(*) from public.appointments a join public.clients c on c.id = a.client_id where c.agent_id <> a.agent_id) as appt_clients,
     (select count(*) from public.appointments a join public.properties p on p.id = a.property_id where p.agent_id <> a.agent_id) as appt_properties,
     (select count(*) from public.reservations r join public.clients c on c.id = r.client_id where c.agent_id <> r.agent_id) as reservations,
     (select count(*) from public.tasks t join public.clients c on c.id = t.client_id where c.agent_id <> t.agent_id) as tasks,
     (select count(*) from public.client_contacts k join public.clients c on c.id = k.client_id where c.agent_id <> k.agent_id) as contacts;
   ```

   The source tables matter because the `appointment_today` body has no
   `client_id`: a foreign client can only reach it through one of those
   rows.
6. **Founder-only test (day 1, between 08:00 and 11:59 Madrid time)**, from a
   local dev server. Preview deployments won't do: Vercel runs crons only on
   production, and preview URLs sit behind Vercel Authentication.
   - Start the server with production URLs and sending on, in this shell
     only (`process.env` wins over `.env.local` in Next's load order):
     `NEXT_PUBLIC_SITE_URL=https://www.leadwing.app DIGEST_EMAILS=on npm run dev`.
     Without the override, every link (home, settings, List-Unsubscribe)
     would point at `http://localhost:3000`, which Gmail's one-click POST
     can't reach, and RFC 8058 requires HTTPS.
   - Call the local route once with `?agent=<founder id>`.
   - The unsubscribe link points at production, which verifies the token
     with production's `SUPABASE_SERVICE_ROLE_KEY`. That key is assumed to
     match `.env.local`'s (same Supabase project; not checked). The next
     check proves it either way.
   - The founder gets one digest and checks:
     - it reads well in Gmail, and opens with the "New:" line
     - "Show original" shows SPF, DKIM and DMARC as `PASS`
     - Gmail shows its Unsubscribe link, and pressing it turns the Settings
       switch off on production
   - Turn the switch back on afterwards.
   - If Resend rejects the `reminders@leadwing.app` sender, STOP.
7. **Recipient list (P16)**, before any production send:
   - Show the founder, in chat only, every profile with `email_digest = true`:
     email, sign-up date, last sign-in.
   - The founder marks test accounts, for example the `d4ec…` founding
     checkout.
   - With the founder's OK, set `email_digest = false` for those ids only
     (`update … where id in (…)`, run as a script). Report the count.
8. **First production send (day 2)**: only after the founder says yes, and
   with P12 done:
   - Set `DIGEST_EMAILS=on` and `DIGEST_ONLY_AGENT=<founder id>` on
     Production, and redeploy (env changes need a new deployment).
   - That morning, check:
     - `notification_digests` has exactly one `sent` row, for the founder
     - the logs show no 429 and no `foreign_rows`
     - the founder confirms the email arrived
9. **Widen (day 3 at the earliest)**:
   - Remove `DIGEST_ONLY_AGENT` and redeploy.
   - The next morning, compare the counts in `notification_digests` with
     the logs.
   - The founder checks the Resend dashboard for bounces and complaints.
     Any complaint at this volume is above 0.1%, and so is a STOP.
10. **Claims**: switch every string to the **phase 2** wording in "Until
    this ships".
11. **Plans index**: update `plans/README.md` row 016 to "phase 2 DONE".

#### Step 21b (only if Step 21.4 shows a Vercel auth block and the founder picks it): `pg_cron` fallback

Supabase calls production on the custom domain, which Vercel Authentication
doesn't cover (scope "all except custom domains"). Rehearse inside
`begin … rollback` first, then apply with a history row, as in Step 4.
Pass the secret as a query parameter from `process.env.CRON_SECRET`; never
put it in a file or a log.

**The one accepted Vault exception.** No integration token (plans 007, 013,
017) uses Supabase Vault: each is one text blob from plan 013's
`src/lib/integrations/token-crypto.ts`. This fallback is the single exception: it stores
`CRON_SECRET` in Vault because `pg_net` has to send it from inside the
database. It is acceptable because:
- it is only used if Vercel Cron can't be used (Step 21.4 / P8)
- `CRON_SECRET` only triggers idempotent scheduled jobs and grants no data
  access
- after any exposure of `SUPABASE_DB_URL` (which can read
  `vault.decrypted_secrets`), rotate `CRON_SECRET`: a new value in Vercel
  Production (redeploy), `.env.local` and `vault.update_secret`.

**"Fallback active" check (every plan runs it before adding a cron
route).** Plans 013, 014, 016 and 017 all run this against the live
database before they add a cron route or schedule:

```sql
select exists (select 1 from pg_extension where extname = 'pg_cron') as has_pg_cron;
-- only if has_pg_cron is true (otherwise cron.job doesn't exist):
select jobname, schedule from cron.job where jobname like 'leadwing_%' order by jobname;
```

The fallback is **active** when `pg_cron` is installed and the second
query returns at least one row. In `like`, `_` matches any single
character, so the pattern also matches this recipe's `leadwing-…` names.
While it is active, a new cron route or schedule is added as a
`cron.schedule` migration built with the recipe below, **not** as a
`vercel.json` entry. That includes this plan's own Phase 3
`/api/cron/push`. When it isn't active, append to `vercel.json` as usual.

**Schedule every route/schedule pair as its own job.** Before running the
SQL, read `vercel.json`'s `crons` block. Plans 013, 014 and 017 may have
appended routes: 013's `/api/cron/calendar-sync`, 014's `/api/cron/inbox`
and 017's `/api/cron/whatsapp`, which has two entries on one path
(`*/5 * * * *` and the daily `15 3 * * *` retention run). Add one
`cron.schedule` call per entry, meaning one path plus one schedule string:
- **Job name**: unique per pair, `leadwing-<route>-<cadence>` (for example
  `leadwing-whatsapp-5min` and `leadwing-whatsapp-retention-daily`).
  `cron.schedule` with a name that already exists replaces that job, so two
  pairs on one path must never share a name.
- **Path and schedule**: the same path, and the schedule string copied
  exactly from `vercel.json`.
- **Headers**: every header the route reads. That is `Authorization` from
  Vault, plus `x-vercel-cron-schedule` set to the exact schedule string, as
  Vercel Cron sends it. Plan 017's route tells its two schedules apart by
  this header and runs retention only when it equals `15 3 * * *`, so a
  missing or reformatted value silently skips retention. Check each owning
  plan's cron step for any other header it reads.

The block below shows this plan's entry. Only then remove the block (see
Notes).

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- run from the script as: select vault.create_secret($1, 'leadwing_cron_secret', 'Bearer secret for the /api/cron/* routes')
-- (skip it if the secret already exists)
-- One cron.schedule per route/schedule pair in vercel.json's crons block:
-- a unique job name, the same path, the exact schedule string, and every
-- header the route reads (x-vercel-cron-schedule = that schedule string).
-- This plan's entry:

select cron.schedule(
  'leadwing-notifications-hourly',
  '0 * * * *',
  $job$
  select net.http_get(
    url := 'https://www.leadwing.app/api/cron/notifications',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'leadwing_cron_secret'),
      'x-vercel-cron-schedule',
      '0 * * * *'
    ),
    timeout_milliseconds := 300000
  );
  $job$
);

-- pg_cron doesn't clean its own run history
select cron.schedule(
  'leadwing-cron-history-cleanup',
  '30 3 * * *',
  $job$ delete from cron.job_run_details where end_time < now() - interval '7 days' $job$
);
```

Notes:
- `net.http_get(url, params, headers, timeout_milliseconds)` defaults to a
  2,000 ms timeout, and responses are kept in `net._http_response` for
  6 hours (https://supabase.com/docs/guides/database/extensions/pg_net,
  checked 2026-09-16). The docs state no maximum timeout. Whether the Vercel
  function keeps running if `pg_net` gives up first is unverified, so after
  the first run check both `net._http_response` and the Vercel logs.
- Then remove the `crons` block from `vercel.json` in its own commit, so
  Vercel stops calling a blocked URL, but **only after** `cron.job` lists a
  job for every route/schedule pair in that block, at the same cadence, and
  each has answered 200 once (017's daily retention job included).
- While the fallback is active (the check above), every new cron route or
  schedule, including this plan's Phase 3 `/api/cron/push`
  (`*/5 * * * *`), gets its own `cron.schedule` in a new migration built
  with this recipe (own job name, every header including
  `x-vercel-cron-schedule`, exact schedule string) instead of a
  `vercel.json` entry.
- Schedules run in GMT, like Vercel's in UTC. The route's hour gate uses
  each agent's zone, so nothing else changes.

### Phase 3 (conditional): web push when the app is closed

Don't start this phase until D11's gates all pass:
- the P15 interview answers show agents acting on phone notifications today:
  score K green in at least 3 of the first 8 solo agents at the Fri 9 Oct
  2026 checkpoint
- an iPhone in Spain showed that a Home Screen web app receives a test push
  (use any public web-push demo before building)
- the founder said go

1. **Worker**: add `public/push-sw.js`.
   - It has only `push` and `notificationclick` handlers, **no `fetch`
     handler** and no caches.
   - `push` shows `{ title, body, url }`.
   - `notificationclick` focuses an open tab or opens `url`.
   - Keep `public/sw.js`, the kill switch, as it is.
   - Add `push-sw.js` to the proxy matcher's exclusions (`src/proxy.ts:76`).
   - Serve it with `Cache-Control: no-cache, no-store, must-revalidate` and
     `Content-Type: application/javascript; charset=utf-8` through an
     `async headers()` entry for `source: "/push-sw.js"` in `next.config.ts`,
     as the bundled Next PWA guide shows for `/sw.js`
     (`node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md:606-660`).
     Keep the existing `experimental` block and the `withNextIntl` wrapper.
2. **`ServiceWorkerRegister`**: only unregister registrations whose script
   URL ends in `/sw.js`:
   `(r.active ?? r.waiting ?? r.installing)?.scriptURL`. Both scripts use
   scope `/`, and a scope holds one registration.
3. **Migration `<timestamp>_push_subscriptions.sql`**:
   - `push_subscriptions` has these columns:
     - `id`, `agent_id` (default `auth.uid()`)
     - `endpoint text unique not null`, `p256dh`, `auth`
     - `user_agent`, `created_at`, `last_success_at`
     - `failure_count int default 0`
   - RLS: the agent reads, inserts and deletes their own rows.
   - Add `notifications.pushed_at timestamptz` as the claim column.
   - Rehearse and apply as in Steps 3–4.
4. **`src/lib/push.ts`**: `sendPush(sub, payload)` wraps `web-push`
   (`npm install web-push`; version 3.6.7 was published 2024-01-16 and is
   MPL-2.0).
   - Keep payloads under 4 KB and without phone numbers.
   - `TTL` is 3600. Urgency is `high` for reminders.
   - The env vars are `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and
     `VAPID_SUBJECT=mailto:info@leadwing.app`.
5. **`src/app/api/cron/push/route.ts`**, scheduled every 5 minutes
   (`*/5 * * * *` in `vercel.json`, or, if Step 21b's "fallback active"
   check says so, a `cron.schedule` migration with Step 21b's recipe), with
   the same auth as Step 14.
   - It runs only for agents that have subscriptions.
   - First it calls `generateForAgent`.
   - **Appointment reminders**: it claims each `appointment_reminder` row
     with `due_at` between now − 30 min and now, once:
     `update … set pushed_at = now() where id = $1 and pushed_at is null`.
   - **Task pings need their own rule.** `task_due` rows carry `due_at` at
     the agent's local midnight (due today) or 06:00 on their due day
     (overdue) (`notifications.ts:366-371`), so the 30-minute window would
     only ever match just after midnight. Instead, in the run where the
     agent's local hour first reaches 9 (`hourInTimeZone`), claim every
     unread `task_due` row with `pushed_at is null` and send **one** push
     ("3 tasks due today"). A rescheduled task gets a new row and a new push
     the next morning.
   - It pushes to every subscription of that agent.
   - It deletes subscriptions that answer 404 or 410.
6. **Settings `PushPanel`**:
   - An "Allow notifications on this device" button. The permission request
     must come from the tap.
   - Outside standalone mode on iOS, show "Add LeadWing to your Home Screen
     first" with the Share → Add to Home Screen steps. Push needs iOS 16.4 or
     later.
   - Also show a "Send a test" button.
7. **Before shipping**:
   - Run the iOS regression pass from the memory note on the iOS Safari
     scroll failure: a simulator, a local production build and a proxy that
     delays responses and sends `no-store`. The landing page must still
     scroll and reveal on cold loads.
   - Test on a real iPhone in Spain: install, allow, then receive a reminder
     with the app closed.
8. **Claims**: only then may the copy say "on your phone, even when LeadWing
   is closed, if you add it to your home screen".

### Phase 4 (later, optional)

Each item is S–M on its own:
- **Plan 007**: its send loop inserts `client_contacts`
  (`channel 'email'`, `source 'email_send'`), and its `email_failed` type
  plugs into `generate.ts`.
- **WhatsApp coexistence (plan 017)**, if it gets built: its own migration
  widens the `source` check with `'whatsapp_phone'` and `'whatsapp_api'`.
  Its ingestion inserts `client_contacts` rows for **outbound** messages of
  linked contacts only, and only when a message is more than 1 hour after
  the client's current `last_contacted_at` (D15). It never updates the
  column directly. A 180-day history import therefore adds a handful of
  rows per client, not one per message.
- **Quiet sellers** at 14 days (D4).
- **A digest time picker**: a `digest_hour` column (D8).
- **A WhatsApp utility message to the agent**, once Meta verification and the
  legal entity exist.

## Until this ships

### What each phase allows the site to say

| Phase live | Quiet buyers | Reminders |
|---|---|---|
| none (today) | Only in the blurb and on the pricing card: "buyers whose details you haven't edited in a week". The hero names no mechanism: "drafts the follow-up in your client's language". | "set a reminder on any viewing and see it in LeadWing while the app is open" |
| 1 | "buyers with no contact logged in LeadWing for a week", always with the qualifier nearby (WhatsApp and email started from LeadWing, calls and meetings you log) | unchanged (new viewings now default to a 30-minute reminder, but "reminders you set" stays) |
| 2 | unchanged | + "on mornings with something on, a short email with the viewings booked for the day, tasks due and buyers to follow up" |
| 3 | unchanged | + "on your phone, even when LeadWing is closed, if you add it to your home screen" |

**Words never to use**:
- "reminds you before each one", or any "before each one", without the
  "while the app is open" / "reminders you set" qualifier (until phase 3)
- "sent" / "enviado" for a `wa.me` or `mailto:` hand-off, including in demos
- "automatic" / "automático" for follow-ups, and "LeadWing does / handles the
  follow-up": LeadWing drafts, the agent follows up
- "hablado" / "talked to": LeadWing only sees contact started from it or
  logged in it
- "every morning" / "cada mañana" for the email: it is skipped on empty days
  and can be switched off

### Interim wording (phase 0, before 21 Sep 2026)

Step 0.1 applies these tables together with all four other plans' tables
(013, 014, 015 and 017's U1), so all five plans' copy lands in one commit.
Where a row says "plan 013" or "Plan 017's U1 text", use that plan's text;
this plan adds nothing there.

**English**

| File · key or line | New text |
|---|---|
| `messages/en/landing.json:5` `hero.subtitle` | LeadWing keeps every buyer, seller, viewing, offer and document on one client card, and drafts the follow-up in your client's language, ready for you to edit and send. |
| `landing.json:15` `preview.toasts.reminderSent` | Plan 017's U1 text ("WhatsApp reminder ready for {name}") |
| `landing.json:23` `mock.sent` | Opened |
| `landing.json:29`, `:31` `onePlace.body`, `onePlace.srSummary` | Plan 017's U1 text |
| `landing.json:69` `howItWorks.body` | Add a client, move them through the pipeline, and LeadWing drafts the follow-up. The whole job, in the order you actually work it. |
| `landing.json:80` `howItWorks.steps.followUp.title` | Follow up in one tap |
| `landing.json:81` `howItWorks.steps.followUp.blurb` | LeadWing flags the buyers whose details you haven't edited in a week and opens a message in their language, ready for you to edit. You read it, change what you like, and send it from WhatsApp or email. |
| `landing.json:95` `howItWorks.tiles.followUp.sentToast` | Opened in WhatsApp |
| `landing.json:105` `deepDives.heading` | `Stop chasing. Follow up without the <nowrap>blank page.</nowrap>` |
| `landing.json:138` `deepDives.items.scheduler.body` | Book viewings and meetings on a clean calendar, set a reminder on any viewing and see it in LeadWing while the app is open, and send the client a WhatsApp confirmation in a tap. |
| `landing.json:140` `deepDives.items.scheduler.point2` | Reminders appear in the LeadWing bell while the app is open |
| `landing.json:277` `faq.items.calendar.a` | Plan 013's text (it drops "reminds you before each one") |
| `messages/en/billing.json:230-231` `pricingPage.features.autoEngage` | title: Follow-up nudges · body: Flags buyers whose details you haven't edited in a week and hands you a message ready to edit. |
| `billing.json:243` `pricingPage.features.calendar.body` | Month view with in-app reminders, a Google Calendar feed and one-tap WhatsApp confirmations. |
| `src/app/llms.txt/route.ts:49` | - Follow-up nudges: flags active buyers whose record hasn't been edited for 7 days, in the in-app bell and on Home, with a ready-to-edit message |
| `llms.txt/route.ts:52` | Plan 013's line (it already says "month calendar with in-app reminders") |
| `src/content/pages/crm-marbella.en.tsx:69-70` | …the viewing confirmation, and the follow-up draft when a buyer's details sit unedited for a week. Setting it when you create the card… (rest unchanged) |
| `crm-marbella.en.tsx:100-102` | Quiet clients are the expensive ones. LeadWing flags the buyers whose details haven't been edited in a week and opens a message already drafted, which is the difference between meaning to follow up and following up. |
| `crm-marbella.en.tsx:113` | "get a reminder before it" → "set a reminder you'll see in LeadWing while the app is open" |
| `crm-spain.en.tsx:102-104` | The leads you lose are usually the quiet ones. LeadWing flags the buyers whose details haven't been edited in a week and opens a message already drafted, so the decision is “send or not”, never “what do I write”. (rest unchanged) |
| `crm-spain.en.tsx:133` (the reminder part only; plan 013 leaves the feed wording) | "with a reminder before each one" → "with a reminder you can set on each one (shown in LeadWing while the app is open)" |
| `crm-spain.en.tsx:168` | "Reminders that reach you, the messages themselves, …" → "Reminders, the messages themselves, …" |
| `guide-idealista.en.tsx:236-238` | This is the part worth handing to a tool. {SITE_NAME} flags the buyers whose details haven't been edited in a week and prepares the next message in their language; you read it, change what you want, and send it yourself. |
| `guide-follow-up.en.tsx:551-553` | That is the part {SITE_NAME} helps with. It flags the buyers whose details haven't been edited in a week and surfaces them with a nudge that is already written, in the client’s language, … (rest unchanged) |

**Spanish** (a native review is welcome but doesn't block this)

| File · key or line | New text |
|---|---|
| `messages/es/landing.json:5` `hero.subtitle` | LeadWing reúne a cada comprador, vendedor, visita, oferta y documento en una sola ficha de cliente, y te redacta el seguimiento en el idioma del cliente, listo para revisar y enviar. |
| `landing.json:15` | Plan 017's U1 text ("Recordatorio de WhatsApp listo para {name}") |
| `landing.json:23` `mock.sent` | Abierto |
| `landing.json:24` `mock.quiet` | {days, plural, one {# día sin novedades} other {# días sin novedades}} |
| `landing.json:29`, `:31` | Plan 017's U1 text |
| `landing.json:69` | Añade un cliente, muévelo por el embudo y LeadWing te redacta el seguimiento. Todo el trabajo, en el orden en que lo haces de verdad. |
| `landing.json:80` | Seguimiento en un toque |
| `landing.json:81` | LeadWing te señala a los compradores cuyos datos no has editado en una semana y te abre un mensaje en su idioma, listo para editar. Tú lo lees, cambias lo que quieras y lo envías por WhatsApp o correo. |
| `landing.json:95` | Abierto en WhatsApp |
| `landing.json:105` | `Deja de perseguir. Haz el seguimiento sin página en <nowrap>blanco.</nowrap>` |
| `landing.json:138` | Agenda visitas y reuniones en un calendario limpio, pon un recordatorio en cada visita y lo verás en LeadWing mientras la app esté abierta, y envía al cliente una confirmación por WhatsApp con un toque. |
| `landing.json:140` | Los recordatorios aparecen en la campana de LeadWing mientras tienes la app abierta |
| `landing.json:277` | Plan 013's text |
| `messages/es/billing.json:230-231` | title: Avisos de seguimiento · body: Te señala a los compradores cuyos datos no has editado en una semana y te deja un mensaje listo para editar. |
| `billing.json:243` | Vista de mes con recordatorios en la app, feed para Google Calendar y confirmaciones por WhatsApp en un toque. |
| `src/content/pages/crm-marbella.es.tsx:68-69` | …la confirmación de la visita y el borrador de seguimiento cuando los datos de un comprador llevan una semana sin editarse. Son treinta segundos… (rest unchanged) |
| `crm-marbella.es.tsx:99-101` | Los clientes callados son los caros. {SITE_NAME} te señala a los compradores cuyos datos llevan una semana sin editarse y te los saca con el mensaje ya redactado, que es la diferencia entre pensar en hacer seguimiento y hacerlo. |
| `crm-marbella.es.tsx:112` | "recibe un aviso antes" → "ponle un recordatorio que verás en LeadWing mientras la app esté abierta" |
| `crm-spain.es.tsx:104-106` | Los leads que se pierden suelen ser los silenciosos. {SITE_NAME} te señala a los compradores cuyos datos llevan una semana sin editarse y te los pone delante con el mensaje ya redactado, … (rest unchanged) |
| `crm-spain.es.tsx:135` (the reminder part only) | "con un recordatorio antes de cada una" → "con un recordatorio que puedes poner en cada una (lo ves en LeadWing mientras la app está abierta)" |
| `crm-spain.es.tsx:170` | "Los recordatorios que de verdad te llegan, los mensajes, …" → "Los recordatorios, los mensajes, …" |
| `guide-idealista.es.tsx:240-242` | Esta es la parte que merece dejar en manos de una herramienta. {SITE_NAME} te señala a los compradores cuyos datos llevan una semana sin editarse y te prepara el siguiente mensaje en su idioma; … (rest unchanged) |
| `guide-follow-up.es.tsx:558-560` | Ahí es donde te ayuda {SITE_NAME}. Te señala a los compradores cuyos datos llevan una semana sin editarse y te los pone delante con un mensaje ya redactado, … (rest unchanged) |

Notes on the wording:
- **The hero names no mechanism.** The edit-based rule is weak and lasts
  only until phase 1, so it appears only in the blurb, the pricing card,
  `llms.txt` and the content pages.
- **"Details you haven't edited"**, not "card you haven't updated": adding a
  viewing, offer or reservation doesn't reset `clients.updated_at`.
- **Spanish subjects**: in the hero, LeadWing is the subject of
  "te redacta"; "mientras tienes la app abierta" can't be read as "the bell";
  "pon… y lo verás" avoids the ambiguous "ve".
- **Demo strings**: the button stays one short word ("Opened" / "Abierto")
  so the looping tile doesn't grow (landing demo layout feedback).

**No change needed**:
- `src/app/layout.tsx:49-56` `keywords` has no quiet-client or reminder term.
- `messages/en/templates.json:83` ("a lead who has gone quiet") is an AI
  template's purpose, not a product claim. The same goes for the ES twin and
  for `messages/es/marketing.json:44`.
- The guides' own advice about buyers who go quiet
  (`guide-follow-up.en.tsx:573`, `:590`; `guide-follow-up.es.tsx:13`,
  `:580`, `:597`) describes the market, not LeadWing.
- The EN `mock.quiet` ("# days quiet") is a neutral demo tag.
- `src/content/pages/about.{en,es}.tsx` makes no quiet-client or reminder
  claim (plans 013–015 edit other lines there).

**Then bump** `PUBLISHED.crmSpain`, `crmMarbella`, `guideIdealista`,
`guideFollowUp` and `about` (`src/lib/seo.ts:73-79`).

### Phase 1 wording (replace the interim text when phase 1 is live)

The qualifier stays next to every quiet-buyer claim: LeadWing only sees
WhatsApp and email started from it and the calls and meetings logged in it.
Most agents also message buyers straight from their phone, which LeadWing
can't see until plan 017 ships.

**Hero**:
- EN: "LeadWing keeps every buyer, seller, viewing, offer and document on one
  client card, shows which buyers have no contact logged in LeadWing for a
  week, and drafts the follow-up in their language."
- ES: "LeadWing reúne a cada comprador, vendedor, visita, oferta y documento
  en una sola ficha de cliente, te muestra qué compradores llevan una semana
  sin contacto registrado en LeadWing y te redacta el seguimiento en su
  idioma."

**Main line** (`followUp.blurb`):
- EN: "LeadWing notices the buyers with no contact logged in a week, counting
  the WhatsApp messages and emails you start from LeadWing and the calls and
  meetings you log, and opens a message in their language. You read it,
  change what you like, and send it."
- ES: "LeadWing detecta a los compradores que llevan una semana sin contacto
  registrado, contando los WhatsApp y correos que inicias desde LeadWing y
  las llamadas y reuniones que registras, y te abre un mensaje en su idioma.
  Tú lo lees, cambias lo que quieras y lo envías."

**Billing body**:
- EN: "Shows which buyers have no contact logged in LeadWing for a week and
  hands you a message ready to edit."
- ES: "Te muestra qué compradores llevan una semana sin contacto registrado
  en LeadWing y te deja un mensaje listo para editar."

**llms.txt:49**: "- Follow-up nudges: flags active buyers with no contact
logged in LeadWing for 7 days (WhatsApp and email started from LeadWing,
logged calls and meetings, nearby viewings), in the in-app bell and on Home,
with a ready-to-edit message"

**Content pages**:
- EN: "LeadWing notices the buyers with no contact logged in LeadWing for a
  week (WhatsApp and email you start from LeadWing, calls you log)"
- ES: "LeadWing detecta a los compradores que llevan una semana sin contacto
  registrado en LeadWing (los WhatsApp y correos que inicias desde LeadWing
  y las llamadas que registras)"

**Reminders**: unchanged. D14 makes new viewings default to a reminder, but
the copy keeps "set a reminder … while the app is open".

### Phase 2 wording (when the morning email is live)

- **`followUp.blurb`**, append:
  - EN: "On mornings with something on, it emails you a short summary: the
    viewings booked for the day, the tasks due, and the buyers to follow up."
  - ES: "Las mañanas en que tienes algo, te envía por correo un resumen
    breve: las visitas previstas para el día, las tareas pendientes y los
    compradores a los que hacer seguimiento."
- **`scheduler.point2`**:
  - EN: "Reminders in the LeadWing bell, plus a morning email with the
    viewings booked for the day"
  - ES: "Recordatorios en la campana de LeadWing y un correo por la mañana
    con las visitas previstas para el día"
- **`scheduler.body`**, middle clause:
  - EN: "set a reminder on any viewing and see it in LeadWing while the app is
    open, get a morning email with the viewings booked for the day"
  - ES: "pon un recordatorio en cada visita y lo verás en LeadWing mientras la
    app esté abierta, recibe por la mañana un correo con las visitas
    previstas para el día"
- **`faq.items.calendar.a`**: plan 013 owns the answer. Append one sentence,
  coordinated with plan 013's phase 5 wording:
  - EN: "LeadWing also sends you a morning email with the viewings booked for
    the day."
  - ES: "LeadWing también te envía por la mañana un correo con las visitas
    previstas para el día."
- **`llms.txt:52`**: add "and a morning email with the day's booked
  viewings" to plan 013's line.
- **`crm-spain.{en,es}.tsx:168/170`**: keep "Reminders" / "Los
  recordatorios". "That reach you" may return only in phase 3.
- A viewing booked after 08:00 for the same day isn't in that morning's
  email, which is why the copy says "booked for the day", not "all the
  day's viewings".

## Prerequisites outside the code

| # | What | Owner | Lead time | Phase |
|---|---|---|---|---|
| P1 | Approve the consolidated interim wording (D13), including plans 013, 014, 015 and 017's tables, and the "Follow-up nudges" rename (D12) | Founder | 30 min; by Thu 17 Sep 2026 | 0 |
| P2 | Native Spanish review of the interim and final wording | Founder (or a Spanish-speaking agent) | 1–3 days; doesn't block | 0–2 |
| P3 | Answer D1–D4, D14 and D15 | Founder | minutes; by Thu 17 Sep if phase 1 is to have any chance before outreach | 1 |
| P4 | Apply the phase 1 and phase 2 migrations live: rehearsed, history rows inserted, timestamps checked against every file and plan reservation. Not between Fri 18 and Mon 21 Sep. | Claude (founder's standing instruction) | 15–30 min each | 1, 2 |
| P5 | Real-iPhone beacon test (WhatsApp installed; the simulator has none), with 5 test buyers (Step 11) | Founder | 30 min | 1 |
| P6 | Add `RESEND_API_KEY` to Vercel `lena-crm` Production: link the repo ("Commands"), then `npx vercel@latest env add RESEND_API_KEY production --scope lepadatumihails-projects` (the value is piped from `.env.local`, never printed), then redeploy. This also fixes the support dialog in production. | Claude, with the founder's OK | 10 min | 2 |
| P7 | Generate `CRON_SECRET` (`openssl rand -hex 32`: 64 hex characters, no special characters), add it to Vercel Production the same way, and keep a copy in `.env.local` for local curl tests and the Step 21b fallback. It is created once for the batch by whichever of plans 013, 014, 016 and 017 lands first (expected: this phase 2), together with `cron-auth.ts`; if it already exists in Vercel, reuse it. | Claude, with the founder's OK | 5 min | 2 |
| P8 | After the first cron deploy, trigger it with `npx vercel@latest crons run …` (or the founder presses **Run**) and read the runtime logs. A block by Vercel's own auth is unlikely (crons gained Deployment Protection support before GA, 15 Nov 2023), but the project's `*.vercel.app` URLs are protected, so test it. If blocked, the founder chooses between the Step 21b `pg_cron` fallback and changing the protection scope. The fallback is the batch's one accepted Vault use (it stores `CRON_SECRET`, which only triggers idempotent jobs and grants no data access; rotate it after any `SUPABASE_DB_URL` exposure), and it must schedule every route/schedule pair in `vercel.json`'s `crons` block as its own job, at the same cadence and with `x-vercel-cron-schedule` set to the exact schedule string, before that block is removed. | Claude runs it; founder decides a fallback | 15 min | 2 |
| P9 | Check the Resend plan in the Resend dashboard. Free allows 3,000 emails a month, 100 a day and 3 domains, so the current two-domain account may well be on Free. The quota is shared with torresmethod.com and the Supabase sign-in codes. Upgrade to Pro ($20 a month, no daily cap) before about 50 daily digest recipients, or earlier if sign-in codes ever fail. | Founder (billing) | minutes | 2 |
| P10 | Add a DMARC record: `vercel dns add leadwing.app _dmarc TXT "v=DMARC1; p=none; rua=mailto:dmarc@leadwing.app" --scope lepadatumihails-projects`. The ImprovMX catch-all forwards the reports. In the Resend dashboard, confirm DKIM and the return path for leadwing.app still verify, and that open and click tracking are off: Domains → leadwing.app → Configuration ("Enable tracking metrics"; off by default). | Claude, with the founder's OK (a DNS change) | DNS minutes; reports within 1–2 days | 2 (strongly advised before the first send) |
| P11 | Confirm the sender `reminders@leadwing.app` (D9). Nothing to create: Resend sends from any address on a verified domain, and ImprovMX's catch-all takes replies. Reply-To is `info@`. | Founder | minutes | 2 |
| P12 | **Required before `DIGEST_EMAILS=on`**: fill the legal-entity placeholders in `src/lib/legal.ts`. The digest footer's sender identification is a link to the legal notice page, which still shows placeholders. Plan 017's D7 proposes filling them now with the founder's autónomo details; do it once for both plans. | Founder | depends on the entity (days if registering as autónomo) | 2 |
| P13 | Approve the first production send (`DIGEST_ONLY_AGENT`) and then the widening (Step 21) | Founder | minutes, on two different mornings | 2 |
| P14 | Generate VAPID keys (`npx web-push generate-vapid-keys`) into Vercel env. On the founder's iPhone (iOS 16.4+, in Spain), add a web app to the Home Screen and confirm push delivery before anyone claims it. | Claude (keys); founder (device) | 30 min | 3 |
| P15 | Interview evidence for phases 2 and 3. Propose these past-tense questions to the owner of `plans/validation-interview-script.md` (§3), without editing it here: "What told you about your last viewing change?", "Show me the phone notifications you acted on this week.", "Where do you look first in the morning: WhatsApp, email or calendar?" Read them together with score B and the existing "normal morning" question at the first 5 interviews and at the Fri 9 Oct 2026 checkpoint. The phase 3 answers are scored as **K (phone alerts)**; the gate is K green in at least 3 of the first 8 solo agents at that checkpoint (letters aligned 17 Sep 2026: A–E script, F–G plan 015, H 013, I 014, J 017, K this plan). | Founder (script owner) | questions: before 21 Sep; answers: 1–3 weeks | 2, 3 |
| P16 | Confirm the digest recipient list (Step 21.7): which accounts are real agents and which are test accounts | Founder | 10 min | 2 |

## Costs per agent per month

Free agents (up to 10 clients, "every feature included") get the morning
email too, and there are 0 real payers today (16 Sep pricing review). So the
email cost is shown per recipient **and** per paying agent.

| Item | Basis (checked 2026-09-16) | Per month |
|---|---|---|
| `client_contacts` rows, trigger, queries | Tiny rows inside the existing Supabase project | €0 extra |
| Hourly cron (generation + digest) | Pro, fra1: $0.184 per Active-CPU hour, $0.0152 per provisioned GB-hour (billed for the whole time a request is in flight, I/O included), $0.60 per million invocations (https://vercel.com/docs/functions/usage-and-pricing). Estimate at 100 agents: 720 runs × ~30 s × 2 GB (assumed instance size) ≈ 12 GB-hours ≈ $0.18, plus under 1 Active-CPU hour. | ≈ $0.1–0.4 **in total**; < €0.005 per agent |
| Digest email, Resend Free | 3,000 a month, 100 a day, 3 domains, 30-day data retention (https://resend.com/pricing). The 100 a day is shared with torresmethod.com and the sign-in codes; the STOP at about 60 digests a day protects the codes. | €0 while it fits |
| Digest email, Resend Pro | $20 a month for 50,000, no daily cap, $0.90 per 1,000 over (≈ €17; exchange rate not checked). At most about 30 digests per recipient a month, fewer since empty days are skipped. | ≈ €0.34 per recipient at 50 recipients. **Per paying agent**: ≈ €1.7–3.4 with 5–10 payers among 50 recipients; ≈ €0.2–0.4 once 50–100 agents pay. |
| Web push (phase 3) | Sending is free; a 5-minute cron (8,640 runs) costs roughly $0.1 a month in total | ≈ €0 |
| Rejected: a reminder email before each event | 3× the email volume | +€0.02–0.10 per recipient on Pro |
| Rejected: a WhatsApp utility message to the agent | ≈ €0.0166 each (1 Jul 2026 rate card, from the 16 Sep WhatsApp note, **not re-checked**) × 22 | ≈ €0.37 per recipient |

**Total for phases 1–2**:
- €0 while Resend Free holds (roughly under 60 daily recipients alongside
  the sign-in codes).
- Once Resend Pro is needed, the fixed €17 is at most about €3.4 per paying
  agent at today's likely early mix, and falls quickly as payers grow.

That stays under the "a few euros" ceiling and far below the €29 Pro price,
but at the low end of adoption the Pro upgrade is the one real cost. Keep
the upgrade for when sign-in codes or the ~60-a-day STOP require it.

## Test plan

- **New unit tests**:
  - `contacts`, `validation/contact`, `contact-beacon`, `data/contacts`
  - `api/contact-events/route`
  - `attention.test.ts` (extended), `data/attention.test.ts`
  - `notify/generate`, `notify/digest`, `notify/run-digest`
  - `api/cron/notifications/route`
  - `email`
  - `unsubscribe-token`, `api/unsubscribe/[token]/route`
- **Route tests** mock `next/cache` as well as the Supabase clients.
- **Cross-tenant guard**, in two layers:
  - The recording-client tests fail if any query in `getAttentionSignals`,
    `generateForAgent` or `runDigest` lacks `eq("agent_id", …)`.
  - The fake data also holds **foreign-client and foreign-property rows**
    (a viewing, a reservation, a task, an appointment by client and one by
    property, each owned by agent A but pointing at agent B). The tests fail
    if B's names or addresses appear in any title, body (including
    `appointment_today`) or digest, or if `foreignRows` isn't counted.
  - The phase 1 rehearsal proves the tightened policies reject such rows,
    and Step 21.5's SQL proves none exist live.
- **Undo followed by a sync**: the Step 3 rehearsal (delete the unread
  nudge, re-upsert, still unread), `data/contacts.test.ts` (a delete, not an
  update) and Step 11's manual steps 2–3.
- **Before each push**:
  `npm run typecheck && npm run lint && npm test && npm run build`, and
  `nvm use 24 && npm test` for phases 1 and 2 (their date and zone tests are
  ICU-sensitive; CI runs Node 24).
- **DB rehearsals** (Steps 3 and 12): every check line prints `ok`, and
  nothing is kept.
- **Manual phase 1**: Step 11's list, on a real iPhone and on a desktop.
- **Manual phase 2**:
  - the Step 21 list, across at least two mornings
  - an ES agent: temporarily set a test profile's locale to `es` inside a
    rolled-back transaction, and render its digest with `buildDigest` in a
    scratch script, without sending
  - a missed cron hour: the next hour inside 08–11 still sends exactly once
- **Load sanity**: time a cron run in the logs. Each agent should take well
  under 1 s. Record the figure in the README row.

## Done criteria

- **Phase 0**:
  - Both Step 0.1 product-claim greps print nothing, in both languages.
  - No page, JSON or `llms.txt` line claims that LeadWing does the
    follow-up, automatic engagement, contact-based quiet detection,
    reminders before every event, or reminders that reach a closed app.
  - No demo says "sent".
  - Plans 013, 014 and 015's interim copy is in the same commit.
  - Everything is live before Mon 21 Sep 2026.
- **Phase 1**:
  - Tapping WhatsApp, email or a calendar reminder, or logging a call or
    meeting, records a contact the agent can see and undo. Undo either
    removes the entry or says it couldn't.
  - Editing a client no longer silences a nudge, and recording contact no
    longer changes "Updated".
  - Home and the bell say "no contact in N days" or "no contact logged yet".
  - New viewings default to a 30-minute reminder.
  - Viewings, appointments and reservations can no longer point at another
    agent's client or property.
  - The live migration is applied with its history row.
- **Phase 2**:
  - Notifications are generated hourly for every agent, with no tab open,
    and never with another agent's data.
  - Agents with something new on get at most one morning email a day.
    Dormant accounts didn't get one unless they turned it on.
  - One-click unsubscribe and the Settings switch both work.
  - The privacy page mentions the summary and the provider's retention.
  - Resend and DMARC checks pass; the legal notice is filled.
  - The claims use the phase 2 wording.
- **CI passes** after each phase.
- **`plans/README.md`**: row 016 shows the phase status (and rows 013–015
  note phase 0's copy commit).

## STOP conditions

- **Another agent's data appears anywhere**: a test, a cron log
  (`foreign_rows`, or `foreignRows > 0` in the response), the Step 1 or
  Step 21.5 cross-agent queries, a bell or a digest. Stop at once, set
  `DIGEST_EMAILS` off and redeploy, and report.
- **The phase 1 rehearsal fails**, or a contact-only update still changes
  `updated_at`.
- **Migration clashes**:
  - The live database already has `client_contacts`, `email_digest` or
    `notification_digests`.
  - The chosen timestamp collides with a file or another plan's
    reservation.
  - The `viewings`, `appointments` or `reservations` policy names differ
    from Step 1's.
  - The live `clients_touch_updated_at` (only plan 015 B1 can have created
    it before this phase 1; plan 017 never creates it) is behind the trigger but its skip array can't be read, or the
    `clients_set_updated_at` trigger runs a function other than
    `set_updated_at` or `clients_touch_updated_at`. (Unknown keys in a
    readable array are not a STOP: merge them, Step 2.)
- **The history table changed**: `supabase_migrations.schema_migrations`
  doesn't have exactly `version`, `statements` and `name`.
- **Copy conflicts**: a plan 013, 014, 015 or 017 copy commit has already
  landed, and its wording for a line in Step 0.1 (for example
  `landing.json:277` or `llms.txt:52`) clashes with this plan's.
- **Hunks you can't separate** from another session's in a file you must
  commit.
- **The live filter counts (Step 10) differ** for any agent, both taken at
  the same `now`.
- **Beacons get lost**: on a real iPhone, more than 1 of the 5 distinct taps
  fails to record. Report which surface missed. Don't switch to awaiting a
  server action before opening WhatsApp (the popup blocker would eat the
  tap).
- **Cron is blocked**: the manual trigger shows the call blocked by Vercel
  authentication. Don't change Deployment Protection without the founder;
  report with the Step 21b fallback (D5).
- **Resend limits**:
  - The account is on the Free plan, and the expected daily digests plus
    sign-in codes would pass about 60 a day. Stop before setting
    `DIGEST_EMAILS=on`.
  - Any 429 (`rate_limit_exceeded`, `daily_quota_exceeded`,
    `monthly_quota_exceeded`) appears in the logs of the first live
    morning.
- **Deliverability**, on the first live mornings: any bounce, or any spam
  complaint (at this volume, one complaint is above the 0.1% limit). Set
  `DIGEST_EMAILS` off and report.
- **Sender rejected**: Resend refuses `reminders@leadwing.app` (for example
  a 403 `validation_error`).
- **Go-live gates missing**: the founder hasn't confirmed the recipient list
  (P16), or the legal-entity placeholders are still unfilled (P12).
- **Digest content**: a rendered digest contains a phone number, an email
  address, a note, an amount, or any promotional block.
- **Local safety**: anyone runs the cron route locally or on Preview without
  `?agent=`, or with `DIGEST_EMAILS=on` against the live database for agents
  other than the founder.
- **Phase 3 early**: anything in phases 0–2 seems to need a service worker,
  or a change to `ServiceWorkerRegister`.
- **Timing**: a cron run takes more than 60 s with fewer than 50 agents.
  Report it before raising `maxDuration`.

## Maintenance notes

- **Who writes which notification rows** (batch rule, 17 Sep 2026):
  - **Event rows** (for example plan 014's `lead_received`, plan 017's
    message events, plan 007's `email_failed`) are written by the owning
    plan at event time, respecting `notifications_agent_dedupe_idx`. They
    don't go through `generate.ts`.
  - **Time-based rows** (quiet clients, reminders, plan 014's
    `lead_unanswered`, plan 017's time-based rows) are producers inside this
    plan's `generate.ts`. If phase 2 hasn't landed, a plan may run its
    producer either from its own cron route or from the existing
    request-time `syncNotifications` (amendment to D-F, 17 Sep 2026, third
    pass). Either way it moves into `generate.ts` when phase 2 lands. For
    plan 017 this covers every time-based row: the pending digest, "paused:
    data deleted in 7 days", wa-idle after 10 days and wa-history-late after
    6 hours.
- **New time-based producer**: add it to `generate.ts` with an explicit
  `agent_id` filter and the embed guard, and add it to the recording-client
  test with a foreign row. Known candidates:
  - plan 008's matches
  - plan 012's digest row
  - plan 014's `lead_unanswered` (its `lead_received` event rows are
    014's own; both will want web push later)
  - plan 015's registration-expiry and expected-payment reminders
  - plan 017's pending digest, "paused: data deleted in 7 days", wa-idle
    (10 days) and wa-history-late (6 hours) rows

  In the bell and the morning email, those show names, counterparty and
  date only, **never amounts** (the D8 rule).
- **New contact source** (for example `whatsapp_api`): widen
  `client_contacts_source_valid` in a new migration, add it to
  `CONTACT_SOURCES` and add its label.
- **Who writes `last_contacted_at`** (D15): only the `client_contacts`
  trigger. Any feature that learns about contact inserts a
  `client_contacts` row. A direct update would be overwritten, or nulled,
  by the next contact insert or Undo.
- **The `clients` `updated_at` skip array** lives in one function,
  `clients_touch_updated_at`, shared by plans 015, 016 and 017. Whichever
  of 015 B1 or this phase 1 lands first creates it and binds the trigger. A
  plan that adds a bookkeeping column first reads the live function
  (`pg_get_functiondef`), then merges its key into the `skip` array in a new
  migration, never overwriting the array or re-binding the trigger.
- **Plan 011 (export)**:
  - Add `last_contacted_at` to both sides of the `columns.ts` contract.
  - Add `client-contacts.csv` to the ZIP and the workbook, and
    `email_digest` to `account.csv`.
  - Whichever plan lands second updates the contract and the README.
  - Because of the trigger change, the export's "Updated" column still means
    "edited".
- **Plan 012 (import)**:
  - Its Step 10 builds on `src/lib/follow-ups.ts` and the local-date
    `weekKey`.
  - Its digest row must be deleted when the count drops to 5 or fewer, and
    every delete filters by `agent_id`.
  - `import_clients()` must not write `last_contacted_at` directly. A mapped
    "Last contact" column becomes a `client_contacts` row with source
    `import`, whose agent owns the client (the trigger checks it).
  - Undo deletes clients, and their contacts cascade.
- **Plan 007 (email automation)**:
  - Reuse this plan's cron scaffolding, the extended `sendEmail` and the
    `DIGEST_EMAILS` style of kill switch.
  - Its send loop inserts a `client_contacts` row (`channel 'email'`,
    `source 'email_send'`, explicit `agent_id`) when it marks a row sent.
  - **Send client-facing mail from a separate subdomain** (for example
    `mail.leadwing.app`), so a buyer's spam complaint can't hurt the
    reputation that agents' sign-in codes and morning emails depend on.
  - The project is on Vercel Pro, so its daily-only concern is settled.
- **Plan 004 (ICS feed)** owns `calendar-feed-token.ts`. Never merge the two
  token kinds. Adding `VALARM` to the feed, so calendar apps alert before
  viewings, is an untested low-cost idea for plan 004.
- **Vercel rollbacks**: an Instant Rollback does not change active cron jobs,
  so a rolled-back deploy keeps calling `/api/cron/notifications` (Vercel
  docs, checked 2026-09-16). Keep the route backward-compatible, or disable
  the job in the dashboard.
- **Scale**: past a few hundred agents, move to a fan-out (one request per
  batch of agents), or move signal SQL into a function. The limits are the
  8 s statement timeout, the 1,000-row page cap, the 300 s duration and
  Resend's 10 requests a second per team (use the batch endpoint).
- **Resend Pro**: upgrade at about 50 daily recipients.
- **DMARC**: after 2–4 weeks of clean reports, move to `p=quarantine`.
- **`notification_digests`** is pruned to 30 days, and its bodies after
  24 hours, by the cron. If `pg_cron` is ever adopted (Step 21b), its
  history cleanup job is part of that step.
- **Watch the unread ratio**, but only on real agents. After launch, compare
  unread to total `follow_up` rows, **excluding** the `is_admin` account and
  known test accounts (for example `d4ec…`). The 16 Sep figure (17 of 19
  unread) is almost entirely the founder's own data and isn't a baseline. If
  the real-agent ratio stays high, the rule is still too noisy (agents who
  work entirely by phone); revisit D2 or push plan 017.
- **Copy moves with the code**: every phase changes the claims. Keep "Until
  this ships" as the single source of truth for what the site may say about
  nudges and reminders.
- **Reviewer notes** (16 Sep 2026 review, where this revision chose one of
  the offered options or went further):
  - *Undo and read rows*: took option (a). `clearFollowUps` deletes unread
    nudges instead of marking them read. Option (b), un-reading on Undo,
    would also have un-read rows the agent had dismissed themselves.
  - *Server-side beacon dedupe*: dropped, as suggested. The fallback
    ("Undo deletes the newest `app_link` row in the window") was not used:
    it could delete an entry from another tab.
  - *Hour gate for the founder test*: no `?force=1`. The plan uses a local
    run inside the 08:00–11:59 window plus a `DIGEST_ONLY_AGENT` production
    send; a force flag would be one more path that can send outside the
    window.
  - *Embed filtering*: used a code-level `ownEmbed` check rather than
    `!inner` + `.eq("client.agent_id", …)`, because appointments and tasks
    have nullable client ids. The policy tightening was added as well.
  - *Service-role contact writes*: went further than the review. The
    `client_contacts` trigger also rejects a row whose agent doesn't own the
    client, since plans 007, 012 and 017 write with the service role.
  - *Digest prompt for dormant accounts*: implemented as a one-time bell
    row (`digest_offer`), excluded from the 30-day prune so it can't
    reappear.
  - *Plans 013–015 on disk*: the review found them missing at ~20:35; they
    were on disk by ~21:00, so Step 0.1 names their "Until this ships"
    sections directly.
  - *`onePlace` copy*: the review asked the consolidated commit to cover it.
    Plan 017's revision claims it (U1), so Step 0.1 applies 017's text
    rather than writing a second version here.
  - *Plan 017 contract*: the review asked this plan to flag 017. 017's
    revision on disk already inserts `client_contacts` rows and no longer
    adds the column or writes it directly, so only the effort figure is
    flagged.
- 17 Sep 2026 (second pass): applied shared decisions D-A…D-I from the plan batch alignment. Third pass (same day, shared decisions E2–E5): Step 21b defines the "fallback active" check and schedules each route/schedule pair as its own job with `x-vercel-cron-schedule` (E2, E3); only plan 015 B1 can create `clients_touch_updated_at` before phase 1 (E4); time-based producers may also run from `syncNotifications` before phase 2 (E5, amending D-F); Interim wording names all five plans' tables; the stale 017 effort flag is gone.

## Overlaps

- **Plan 009 (GO design).** This plan is its build, with these deliberate
  deviations:
  1. The quiet rule stops using `updated_at`. 009's Q1 relied on the
     trigger, which keeps the overclaim.
  2. A `client_contacts` log sits in addition to the column.
  3. A new call-site map (Step 8).
  4. Revalidation targets `/home`, not `/`.
  5. Contact **deletes** unread `follow_up` rows instead of marking them
     read (Step 6).

  Kept from 009: leaving `stalled_offer` alone on contact.
- **Plan 012** edits the same follow-up loop (`notifications.ts:309-322`).
  Land Step 13's refactor first, or rebase 012 onto it. Its migration
  timestamp is `20260916150000`.
- **Plan 011**: see Maintenance notes. It is the brief's next item after
  the overclaims; phase 1 can run alongside it.
- **Plan 007**: see Maintenance notes (contact rows, separate sending
  subdomain).
- **Plan 008**: a future "new match" notification is one more producer in
  `generate.ts`. It shares the reserved-stage exclusion with `attention.ts`.
- **Plan 004**: see Maintenance notes.
- **Plan 002** (done) owns `src/lib/attention.test.ts`: extend it, don't
  fork it. Plan 003's `SyncContext` validation is removed in Step 13.
- **Plan 013 (Google Calendar sync)**:
  - It edits the same strings: `landing.json:73`, `:89`, `:276-277`,
    `llms.txt:52`, `crm-marbella.*`, `about.*` and `calendar.json`.
  - Its interim copy ships inside this plan's Step 0.1 commit. It owns
    `faq.items.calendar.a` and `llms.txt:52`.
  - Both plans need the first Vercel cron: share one `crons` block
    (entries are always appended, never replaced), one `CRON_SECRET` and
    one cron-auth helper, `src/lib/integrations/cron-auth.ts`
    (`authorizeCron`, 013 D22). Whichever of plans 013, 014, 016 and 017
    lands first creates the helper and the secret (expected: this plan's
    phase 2); the others reuse them.
  - Plan 013's Google popup reminders would cover calendar events when
    LeadWing is closed. If it ships first, the phase 3 claim can lean on it.
- **Plan 014 (portal lead inbox)**:
  - Its interim copy ships inside Step 0.1.
  - Its new-lead alerts are the most time-critical reminder. Plan 014
    writes the `lead_received` event rows itself at capture time
    (respecting `notifications_agent_dedupe_idx`); its time-based
    `lead_unanswered` rows are a producer in this plan's `generate.ts`
    (run from 014's own cron route until phase 2 lands). Both feed the
    morning email and, later, web push.
  - Captured leads are buyers, so they enter the quiet rule 7 days after
    `created_at` ("no contact logged yet") unless the agent contacts them
    from LeadWing.
- **Plan 015 (agencies and the buyer-registration log)**:
  - Its A0 copy ships inside Step 0.1.
  - It owns any headline change (D20). `hero.subtitle` stays with this plan
    until then.
  - Keep `client_contacts` (how recently you were in touch) separate from a
    registration record (proof of introduction), but reuse the log UI
    patterns.
  - Its registration-expiry and expected-payment reminders need exactly
    this plan's closed-app delivery. They become producers in `generate.ts`
    and lines in the morning email (dates and counterparties, no amounts).
  - Its B1 live migration avoids 18–21 Sep; so does this plan's.
- **Plan 017 (WhatsApp coexistence)**. The review found three conflicts.
  Plan 017's revision on disk (read 16 Sep 2026, ~21:15) already resolves
  them the D15 way; keep both plans to this contract:
  1. **The writer.** Only this plan's trigger writes
     `clients.last_contacted_at`, as a cache of
     `max(client_contacts.occurred_at)`. A direct write would be overwritten,
     or nulled, by the next contact insert or Undo. Plan 017 inserts
     `client_contacts` rows (outbound messages of linked contacts only,
     sources `whatsapp_phone` / `whatsapp_api`, explicit `agent_id`, one row
     only when a message is more than 1 hour after the current value). Its
     migration widens `client_contacts_source_valid` and depends on this
     plan's phase 1.
  2. **The column.** Plan 017 no longer adds it; this plan's phase 1 does.
  3. **The trigger.** One function, `clients_touch_updated_at`, with one
     `skip` array shared with plan 015. Whichever of 015 B1 or this
     phase 1 lands first creates it (017 hard-depends on this phase 1 and
     never creates it; its D15 self-create fallback is dropped); this plan's
     migration merges
     `['updated_at', 'last_contacted_at', 'wa_contact_id']` (017's keys
     included) into whatever array is live. 017's pre-flight looks for that
     skip array (not a WHEN clause), and its migration replaces the
     function with the union of the live array and its own.

  Also:
  - Plan 017 owns the `onePlace` and `reminderSent` copy (its U1); Step 0.1
    applies it.
  - It reuses this plan's `CRON_SECRET` (P7) and `cron-auth.ts` (or creates
    them, if it lands first). Its message-event notification rows are its
    own. Its time-based rows (the pending digest, "paused: data deleted in
    7 days", wa-idle after 10 days, wa-history-late after 6 hours) run from
    its own cron route or from the request-time `syncNotifications` until
    phase 2 lands, then move into `generate.ts` (see "Who writes which
    notification rows").

- **Plan 010 and the SEO content pages**: the rename and the wording touch
  the same content modules and `PUBLISHED` dates.
- **`plans/validation-interview-script.md`**: P15 proposes three questions
  to its owner; this plan doesn't edit it.

## Sources (checked 2026-09-16)

**Verified**:
- **Vercel Cron**:
  - limits: 100 jobs per project; Pro runs as often as once a minute,
    within the minute; Hobby runs once a day, within the hour.
    https://vercel.com/docs/cron-jobs/usage-and-pricing
  - a cron is an HTTP GET to "your project's production deployment URL"
    (example `https://*.vercel.app/api/cron`); schedules in UTC; production
    only; `vercel-cron/1.0` user agent; `x-vercel-cron-schedule` header
    (page last updated 2026-08-11): https://vercel.com/docs/cron-jobs ,
    https://vercel.com/kb/guide/troubleshooting-vercel-cron-jobs
  - `CRON_SECRET` sent as `Authorization: Bearer …`, at least 16 random
    characters; no retries; best-effort delivery with missed or duplicate
    runs; overlapping runs possible; redirects not followed; Instant Rollback
    doesn't update crons; duration limits equal the function limits:
    https://vercel.com/docs/cron-jobs/manage-cron-jobs
  - crons gained "support for Deployment Protection" during the beta (GA
    post, 15 Nov 2023):
    https://vercel.com/changelog/vercel-cron-jobs-are-now-generally-available
  - `vercel crons run <path>` triggers a deployed cron; `vercel crons` is
    beta (page last updated 2026-07-15): https://vercel.com/docs/cli/crons
  - `vercel link --yes --project <name>` (page last updated 2026-08-11):
    https://vercel.com/docs/cli/link
- **The project's Deployment Protection**: Vercel Authentication on, scope
  `all_except_custom_domains`; no password protection, no trusted IPs
  (Vercel API through the Vercel MCP connector, read 16 Sep 2026).
- **Vercel Functions**:
  - limits (Pro defaults to 300 s, with an 800 s maximum on Fluid compute):
    https://vercel.com/docs/functions/limitations
  - pricing (fra1: $0.184 per Active-CPU hour, $0.0152 per provisioned
    GB-hour billed while any request is in flight, $0.60 per million
    invocations; page last updated 2026-06-16):
    https://vercel.com/docs/functions/usage-and-pricing
- **Supabase**:
  - Cron (pg_cron: at most 8 concurrent jobs of at most 10 minutes each,
    schedules in GMT, `job_run_details` not cleaned up automatically,
    `pg_net` + Vault pattern): https://supabase.com/docs/guides/cron ,
    https://supabase.com/docs/guides/cron/quickstart ,
    https://supabase.com/docs/guides/functions/schedule-functions
  - `pg_net`: `net.http_get(url, params, headers, timeout_milliseconds)`,
    timeout default 2,000 ms, responses kept 6 hours:
    https://supabase.com/docs/guides/database/extensions/pg_net
- **Live database catalog** (extensions, role timeouts, `safeupdate`, row
  counts, account sign-in dates, cross-tenant counts, history columns): two
  read-only probes through `SUPABASE_DB_URL`, 16 Sep 2026.
- **Resend**:
  - pricing: Free = 3,000 a month, 100 a day, 3 domains; Pro = $20 for
    50,000 or $35 for 100,000, no daily cap, 10 domains, overage $0.90 per
    1,000; "30-day data retention" on both: https://resend.com/pricing
  - rate limit: "10 requests per second per team"; a 429 when exceeded:
    https://resend.com/docs/api-reference/introduction
  - `Idempotency-Key` (kept 24 h, 1–256 characters; 409
    `invalid_idempotent_request` when the payload differs; 409
    `concurrent_idempotent_requests` while the first request is still in
    progress, "safe to retry this request later"):
    https://resend.com/docs/dashboard/emails/idempotency-keys
  - error names (429 `rate_limit_exceeded`, `daily_quota_exceeded`,
    `monthly_quota_exceeded`; 403 `validation_error` for an unverified
    domain): https://resend.com/docs/api-reference/errors
  - open and click tracking: per domain, under the domain's Configuration
    tab, "disabled by default for all domains":
    https://resend.com/docs/dashboard/domains/tracking
  - batch sending (up to 100): https://resend.com/docs/api-reference/emails/send-batch-emails
  - `List-Unsubscribe` on transactional mail (read through a search snippet):
    https://resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails
  - Data Privacy Framework: Plus Five Five, Inc. (Resend) is a participant
    (seen in a search result; the participant page needs JavaScript and
    didn't render): https://www.dataprivacyframework.gov/participant/8907
- **RFC 8058** (one-click unsubscribe: an HTTPS URI, the
  `List-Unsubscribe-Post` value, no cookies or authorization on the POST,
  DKIM coverage): https://datatracker.ietf.org/doc/html/rfc8058
- **Gmail sender guidelines** (all senders: SPF or DKIM, TLS, spam rate under
  0.3%; DMARC and one-click unsubscribe only above 5,000 a day, and for
  marketing mail): https://support.google.com/a/answer/81126
- **LSSI, Ley 34/2002** (art. 20.1 identification; art. 21 unsolicited
  commercial email and the customer exemption with an opt-out):
  https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758
- **WebKit, web push for Home Screen web apps** (iOS/iPadOS 16.4+, user
  gesture, standalone manifest, no Apple Developer account):
  https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- **PostgREST**: values with reserved characters inside logical operators
  must be double-quoted.
  https://docs.postgrest.org/en/stable/references/api/tables_views.html
- **Bundled Next.js 16.2.6 docs**: `node_modules/next/dist/docs/01-app/…`
  (route handlers, `maxDuration`, `after`, backend-for-frontend `:556-590`
  and `:815`, progressive-web-apps `:84-460` and the `headers()` example at
  `:606-660`, environment-variables load order at `:266-276`: `process.env`
  first, then `.env.local`).
- **Migration drafts**: the Step 2 and Step 12 SQL ran on the live database
  inside rolled-back transactions on 16 Sep 2026; every check passed and
  nothing was kept.
- **Date arithmetic**: the `localNoonISO` expected values in Step 5 were
  computed with Node 22.20 on 16 Sep 2026.
- **npm**: `npm view web-push` (3.6.7, published 2024-01-16, MPL-2.0) and
  `npm view resend` (6.28.1, not needed).

**Not verified — treat with care**:
- **How Vercel Authentication treats cron requests** under the
  `all_except_custom_domains` scope. The GA post says crons support
  Deployment Protection, but no page spells out the behaviour. A block is
  unlikely; test it with `vercel crons run` (P8). Step 21b is the fallback.
  https://vercel.com/docs/deployment-protection ,
  https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection
- **Whether Vercel keeps running a function after `pg_net` times out**
  (Step 21b only).
- **Whether `vercel link` writes to `.env.local`**: only a changelog title
  ("Preserve local environment variables when linking with the Vercel CLI")
  was seen, hence the backup.
- **Whether Resend's SMTP sends (the Supabase sign-in codes) count toward
  the 10-per-second API limit.**
- **Whether production's `SUPABASE_SERVICE_ROLE_KEY` equals `.env.local`'s**
  (same project, so expected). Step 21.6's unsubscribe press proves it.
- **The instance memory size** behind the cron cost estimate (2 GB assumed).
- **Web push for Home Screen apps in the EU today.** Apple reversed the
  planned removal of Home Screen web apps in iOS 17.4 (1 Mar 2024), but no
  official source confirms push works for them in the EU. Test it on a device
  (P14).
  https://9to5mac.com/2024/03/01/apple-home-screen-web-apps-ios-17-eu/ ,
  https://developer.apple.com/support/dma-and-apps-in-the-eu/
- **Whether the digest is a "commercial communication"** under LSSI art. 21.
  This plan's reading is that an agent's own reminder summary, promised by
  the service and free of promotion, is a service email. That is a reading,
  not legal advice. The strict no-promotion rule is what it rests on. The
  AEPD reads "comunicación comercial" broadly (e.g.
  https://www.aepd.es/documento/a-00008-2019.pdf); no AEPD guide on
  transactional email was found.
- **The WhatsApp utility rate in Spain** (≈ €0.0166, 1 Jul 2026 rate card),
  taken from the 16 Sep WhatsApp research note and not re-checked.
- **Which Resend plan the founder's team is on**: not checked (P9). The
  Free plan's 3-domain allowance means it may well still be Free.
- **The euro amounts**: dollar prices converted at roughly €0.85 per $1; the
  rate wasn't checked.
