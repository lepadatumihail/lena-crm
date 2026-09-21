# LeadWing Facebook daily log

## Mon 21 Sep 2026 (noon brief, run 12:05 Madrid)

Numbers: followers 0, comments 0 across all posts, inbox empty (0 conversations), queue = 2 (Wed 23 + Thu 24 Sep 09:30, verified). Page insights for 20 Sep: 3 post engagements, 0 page views, 0 follows.

Published: the Monday digest went out on time at 09:30 Madrid (post 1279663088571991_122107041849476753). No reactions, no comments yet. The source-links first comment is drafted and waiting on the founder's yes.

Ad: €5.65 of €25 spent, €19.35 left, ad and ad set both ACTIVE, no review issues, account healthy (status 1, Visa on file). Lifetime 42,405 imp / 6,691 reach / 171 reported clicks / 37 LPV. Real in-platform lifetime: Facebook feed 356 imp / 4 clicks / 1 LPV, Instagram feed 39 imp / 0 clicks; Audience Network still 89% of spend (€5.05), all of it before the 20 Sep 13:11 placement fix.

Finding: the pacing fix did not work. Hourly shows delivery stopped after 20 Sep 13:00; 24 impressions and €0.01 in the 17 h after the fix, and **zero impressions and zero spend for all of 21 Sep** (12 h so far) — no insights row for today at all. The ad set ends Tue 22 Sep 23:59, so on the current path €19.35 expires unspent.

Not paused: the playbook's waste test fires on lifetime AN share (89%), but that spend all predates the placement fix and the ad now spends ~€0.01/day, so pausing would save nothing and only freeze the budget. Reasoning surfaced to the founder instead; one fix proposed, not applied.

Noticed: the Wed creative's screenshot shows "Mon 21 Sep" inside the app on a post that publishes Wednesday; left as is, not worth a re-render. SearchAPI is at 65 remaining_credits — founder says that is fine, so it stops being a talking point.

Approved and done: fix A. Ad set 6995417079494 `optimization_goal` LINK_CLICKS → REACH (billing_event was already IMPRESSIONS, so one edit); placements, audience, €25 lifetime budget and the Tue 22 Sep 23:59 end time untouched. Verified after: REACH, ACTIVE, €19.35 remaining; the ad went IN_PROCESS for re-review, same as after the 20 Sep edit. Evening check to confirm it clears and that feed impressions start.

Declined: the source-links first comment. Founder asked for no links at all, so the digest's attribution stays as the publication names in brackets and the rule is now in the playbook. URLs stay in `news-digest-*.md` for the founder's own checking.

## Sun 20 Sep 2026 (run 23:45 Madrid — weekly sitting, fired off-cycle, treated as a noon brief)

Numbers: followers 0, comments 0 on all 5 posts, inbox empty (0 conversations), queue = 2 (Wed 23 + Thu 24 Sep 09:30, timestamps verified against scheduled.json).

Ad: spend still €5.64 of €25, €19.36 left — unchanged since the 19:22 reading. Ad and ad set both ACTIVE, no review issues, placements confirmed feed-only. Lifetime totals 42,391 imp / 6,674 reach / 170 link clicks / 37 LPV. Placement split over the whole run: Audience Network €5.05 / 41,875 imp / 165 clicks; Facebook feed €0.32 / 342 imp / 3 clicks / 1 LPV; Instagram feed 36 imp.

Finding: removing Audience Network stopped delivery rather than redirecting it. Hourly for 20 Sep: nothing from 14:00 to 21:00, then 3 imp at 22:00 and 7 at 23:00 — 10 impressions and €0.00 in the 4.5 h since the ad went ACTIVE at 19:23. Diagnosed as pacing: LOWEST_COST_WITHOUT_CAP + standard pacing spreading €19.36 over four days will not bid up for a narrow feed audience. Not a full day of zero yet, so nothing paused or edited; a fix is proposed to the founder, not applied.

Drafted: nothing new to reply to. Monday's digest re-checked against this week's news (2 searches, en + es) — no story displaces the five items, so the text stands. Built the missing digest card `05-digest-2026-09-21.png`.

Fixed: `render.mjs` had the founder's Mac path hardcoded and could not run in a cloud checkout — it now derives the repo root itself and falls back to `SHARP_DIR`. Added the digest card, driven by env vars so each week is one command.

Noticed: `npm ci` fails repo-wide (lockfile out of sync, missing @swc/helpers) — not touched, it is outside marketing. SearchAPI `remaining_credits` is down to 65 despite only 274 searches used this month. No app screenshots exist anywhere in the repo, so the creative rule cannot be met for Wed/Thu without the founder sending one.

Approved/posted: nothing — waiting on the founder for the Monday digest, the ad fix and the image decision.

## Sun 20 Sep 2026 (run 19:22 Madrid, late catch-up of the noon task)

Numbers: page followers 0, no comments (0 on both live posts), inbox empty, queue = 2 (Wed 23 + Fri 25 Sep 09:30). Page insights still show 0 views / 0 engagements through 19 Sep.

Ad (campaign 6995417076094, ad set 6995417079494, ad 6995418317094): €5.64 of €25 spent, €19.36 left, reach 6,668, 42,381 impressions, 170 reported link clicks, 37 landing page views, CPM €0.13, cost per link click €0.03.

Finding: 97% of impressions and 89% of spend (€5.05, 41,872 imp, 165 clicks, 36 LPV) went to **Audience Network / an_classic** — third-party mobile apps, not Facebook or Instagram — even though the ad set now lists only facebook/feed + instagram/stream. Real in-platform delivery was tiny: Facebook feed €0.32 / 335 imp / 3 clicks, Instagram €0.15 / 113 imp / 1 click. Treat the 170 clicks as junk; the honest read is ~4 real link clicks. All delivery was ES, mobile_app, 35–64 skew.

Ad set was edited 20 Sep 13:11 and the ad 19:20; hourly data shows delivery stopped after 13:00 (13:00 hour = €0.01 / 99 imp) and the ad is now PENDING_REVIEW with €19.36 unspent and the ad set ending Wed 24 Sep 23:59. Not touched by this run.

Drafted: nothing — no comments, no messages, queue already at 2. Approved/posted: nothing.

Noticed: ads.json creative_id (4655037744778453) is stale; the live ad serves creative 1083235867424577 (effective_object_story_id 1279663088571991_122105682405476753).

Update 19:24: placement fix confirmed — ad set targeting is now publisher_platforms [facebook, instagram], facebook_positions [feed], instagram_positions [stream], no audience_network entry. Review cleared: ad 6995418317094 is ACTIVE again (was PENDING_REVIEW at 19:22). No Audience Network impressions since 13:00. €19.36 left, ad set still ends Wed 24 Sep 23:59.

## 2026-09-20 — click ad, day 1–2
- Ad ACTIVE, no review feedback. Spend €5.64 of €25; €19.36 left.
- Totals: 42,381 impressions, 6,668 reach, freq 6.36, 170 link clicks, €0.033/click, link CTR 0.40%, 37 landing-page views.
- Daily: 19 Sep €1.50 / 1,467 imp / 15 clicks; 20 Sep €4.14 / 40,914 imp / 155 clicks.
- Placements: Audience Network (an_classic) took 41,872 imp and 165 clicks for €5.05 — junk. FB feed only 335 imp, 3 clicks, €0.32 (0.90% CTR, 1 LPV).
- Landing-page views are 22% of reported clicks — consistent with accidental AN taps.
- Age/gender (AN-dominated): women 35–54 = 71 of 170 clicks; men flat across ages.
