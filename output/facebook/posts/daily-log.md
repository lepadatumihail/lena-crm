# LeadWing Facebook daily log

## Thu 24 Sep 2026 (noon brief, run 12:10 Madrid)

Published: the Thursday founding-offer post went out on time at 09:30 Madrid (1279663088571991_122107059153476753), 0 reactions and 0 comments at 12:10. Queue is now Fri 25 and Wed 30, both verified via /scheduled_posts.

Numbers: followers 0, comments 0 and reactions 0 on every page post, inbox empty (0 conversations). Dark posts: both click ads minted NEW ones at 00:21 Madrid (click …122110668759476753, quiet …122110668771476753, new creative ids, same image, link and copy) — not an operator change; the new click dark post carries the 1 reaction, all six are comment-free. Page insights for 23 Sep: 29 post engagements and 20 page views (the page's best day so far), 0 follows.

Ads, all three ACTIVE — the quiet-leads /quiet re-review and the post-boost review both cleared. Click ad 23 Sep full day €3.57 / 1,492 imp / 22 clicks / 16 LPV (73% of clicks, €0.22 each); 24 Sep to 12:10 €1.24 / 497 imp / 9 clicks / 6 LPV; lifetime €22.78 of €25, €2.22 left, ends tonight 23:59 on option A. Quiet-leads ad started delivering at 05:00 today: €1.04 / 509 imp / 7 clicks / 3 LPV, feed-only, €23.97 left, ends 28 Sep. Post boost: €10 intact, first delivery 25 Sep 10:00, empty insights row is correct. Waste test fires on neither. Account status 1, no disable reason.

Checked, no swap: two searches (EN + ES) found nothing on 24 Sep that displaces Friday's digest — today's coast news is crime, a wildfire death and a wealth-migration feature.

Skipped in one line: Vercel analytics — VERCEL_TOKEN is missing AND api.vercel.com still refuses the proxy CONNECT (403); www.leadwing.app is refused too. Meta's landing_page_view stays the only funnel number.

Surfaced, not acted on: the outreach sheet still carries the rejected v1 message in all 50 rows (Status: 50 × "Not sent", #9 Skip), and the founder's own 01:26 homepage commit puts "client card" back into public copy. Nothing paused, nothing edited, nothing sent.

## Wed 23 Sep 2026 (22:15-22:35, founder: "do what you think is best")

Site: built `/quiet` + `/es/seguimiento`, the landing for the quiet-leads hook (same ad-landing component, now with a `variant`; catalogs `marketing.quiet`), and removed every "card" from `/start` + `/es/empezar`. typecheck, lint (0 errors) and 699 tests green; commit 83e3e16, Vercel production READY at 22:26, pages verified live with noindex + canonical.
Facebook: the 09:30 product post (image still said "every buyer card", 0 reactions / 0 comments) deleted and replaced at 22:28 by post 1279663088571991_122110619499476753 with `10-ad-quiet-leads.png` (re-rendered to print leadwing.app/quiet) and a caption linking leadwing.app/quiet. The €10 boost re-created on it: ad 6996512397894 (creative 1627298505638074), IN_PROCESS, 25 Sep 10:00 - 1 Oct. The quiet-leads click ad 6996508363294 re-pointed from /start to /quiet (creative 1299284655540840, image hash d548b0…), back in review. Interim ad 6996510974094 deleted.
Research: Meta's housing Special Ad Category confirmed as the digest-boost rejection cause; rule recorded in Learnings. Paid budget unchanged: €25 + €10 + the original ad's last €4.58.

## Wed 23 Sep 2026 (22:05-22:15, review outcomes)

Quiet-leads ad 6996508363294 cleared review and is ACTIVE. The digest boost ad was DISAPPROVED with generic policy feedback — most likely Meta's housing-ad rule (the digest names homes for sale with prices and a deadline; the ad set targets by age and job title). Founder: "ok do that" → 5b: new creative 1453312266699209 on today's 'quiet leads' page post, new ad 6996510974094 in the same €10 ad set (25 Sep 10:00 - 1 Oct), rejected ad deleted, campaign and ad set renamed "Post boost". Ad PENDING_REVIEW. Lesson recorded: never boost a digest without the HOUSING special ad category.

## Wed 23 Sep 2026 (night, founder: "yeah i want both 4 and 5")

Created via the API, all copied from ad set 6995417079494's targeting, feed-only: (4) campaign 6996508235894 / ad set 6996508321694 / ad 6996508363294 — "Quiet leads", €25 lifetime, 23-28 Sep, LANDING_PAGE_VIEWS, creative 29434012246199370 on `10-ad-quiet-leads.png`, link /start?utm_campaign=quiet-leads-sep26, ad PENDING_REVIEW; (5) campaign 6996508248894 / ad set 6996508580294 / ad 6996508595494 — €10 boost of the Friday digest post, POST_ENGAGEMENT on the post, 25 Sep 10:00 - 1 Oct 23:59, ad PENDING_REVIEW. Account status 1, €1.41 balance. Three API lessons in ads.json (promoted_object immutable, ON_POST destination needed, `+0200` in a form field must be URL-encoded). One empty ad set was created and deleted on the way. Total committed paid budget this week: €25 + €10, plus the ~€4.58 left on the original ad, which ends Thu 24 23:59.

## Wed 23 Sep 2026 (late evening, content review with the founder)

Founder's calls: "card" is banned from public copy (internal jargon); digest cards get their own look, not the terracotta background. Built `compose-digest.mjs` (photo theme: OpenAI editorial photo on top, type below) and re-made Friday's card; made the "quiet leads" ad creative (`10-ad-quiet-leads.png`, /start) as the one to fund instead of the import creative; mocked the engagement boost (`mock-engagement-ad.png`). Outreach message rewritten by the founder (final in PLAYBOOK) and 50-agency sheet delivered to Drive.
Applied on "do both": Friday's scheduled digest deleted and re-created with the photo card (new post 1279663088571991_122110562607476753, photo 122110562553476753, same text, 25 Sep 09:30); today's live post text edited to drop "every buyer card". Queue verified: Thu 24, Fri 25, Wed 30. Open: "go 4" (quiet-leads ad, wait for auth log), "go 5" (€10 engagement boost on Friday's digest), link-preview card rewrite (site code).

## Wed 23 Sep 2026 (evening, founder answered "post all, go 3")

Scheduled: Fri 25 Sep 09:30 digest (1279663088571991_122110445859476753) and Wed 30 Sep 09:30 import post (1279663088571991_122110445967476753); text exactly as approved. The queue, checked via /scheduled_posts, is Thu 24, Fri 25 and Wed 30.
Outreach: 8 SearchAPI Google Maps queries across Marbella, San Pedro, Nueva Andalucía, Estepona, Mijas, Fuengirola and Benalmádena gave 135 places. Big brands, franchises, lawyers and rental-only shops were removed, and the 50 smallest were ranked into a Google Sheet in the founder's Drive (id in PLAYBOOK Pending), each with an EN or ES message from Mihail naming their town and 25 with one-click WhatsApp links. #9 is marked Skip (Svensk Fast franchise). Nothing was sent; the founder sends. Contact data is not stored in the repo.
Not answered: option 4 (second ad).

## Wed 23 Sep 2026 (evening, in session, at the founder's request to make content and plan growth)

Drafted Friday 25 Sep's digest (`news-digest-2026-09-25.md`, card `08-digest-2026-09-25.png`): Marbella PGOM approval (~18,000 homes to regularise), Andalucía's record appraised price, Málaga's 38% rent-to-income, the 25 Golden Mile protected homes (registration closes 1 Oct), and the Málaga mayor on foreign buyers and rent caps. 9 SearchAPI calls (6 news, 3 maps). News sites are blocked by this environment's network policy, so figures were checked through WebSearch against two sources each; the single-source Málaga €3,083.5/m² was dropped.
Drafted Wednesday 30 Sep's product post on the Excel/CSV import (`09-wed30-import.png`, caption in `launch-week.md`, links to /start). The background came from OpenAI (chatgpt-image-latest, one image) and was darkened for contrast. The card checks against the creative rule: LeadWing named, "the CRM for independent agents on the Costa del Sol", a real screenshot, a hook, a CTA and a URL.
Checked outreach feasibility: Google Maps search via SearchAPI returns ~20 small local agencies per query with website and phone. No list stored.
Sign-ups are still unreadable from here (no DB access, Vercel analytics 404s). Nothing published, scheduled, sent or edited; everything is waiting on the founder.

## Wed 23 Sep 2026 (evening check, run 18:10 Madrid)

Nothing to answer: 0 comments on every page post and on both ad dark posts, inbox empty (0 conversations). The current dark post `…122109116961476753` now shows 1 reaction, up from 0 at noon — the first engagement of the run, and not something to reply to. Ad healthy: ad + ad set ACTIVE, no issues_info, no ad_review_feedback. Today to 18:10 €2.45 / 1,080 imp / CPM €2.27 / CTR 1.48% / 14 clicks / 10 LPV (71% of clicks, €0.25 per landing view); feed-only, zero Audience Network, delivery in every hour but 02:00 with the afternoon picking up. Lifetime €20.42 of €25, €4.58 left, ends Thu 24 Sep 23:59 as decided (option A, no top-up). Waste test does not fire. Nothing paused, nothing edited, nothing sent.

## Wed 23 Sep 2026 (noon brief, run 12:05 Madrid)

Published: the Wednesday product post went out on time at 09:30 Madrid (1279663088571991_122107059069476753), 0 reactions and 0 comments at 12:05. Queue is now 1 — Thu 24 Sep 09:30, founding offer, timestamp verified.

Numbers: followers 0, comments 0 and reactions 0 across every page post and both ad dark posts (the 22 Sep swap post created 22 Sep 14:54 and the orphaned one), inbox empty (0 conversations). Page insights for 22 Sep: 18 post engagements, 0 page views, 0 follows — down from 42 / 5 on 21 Sep, tracking the lower ad spend.

Ad healthy: ad + ad set ACTIVE, no issues_info, no ad_review_feedback, link still leadwing.app/start?utm_campaign=spreadsheets-sep26 on both link_data.link and the call_to_action, placements feed-only. 22 Sep full day €4.29 / 2,049 imp / CPM €2.09 / CTR 1.56% / 26 clicks / 18 LPV — 69% of clicks, €0.24 per landing view, the run's best full day on quality. 23 Sep to 12:05: €1.41 / 636 imp / 5 clicks / 4 LPV, delivery in every hour but 02:00, zero Audience Network. Lifetime €19.37 of €25, €5.63 left.

Not paused: the waste test fires on no reading — lifetime AN share 26%, lifetime cost per click €0.087, today €0.28 per click with LPV at 80% of clicks.

Noticed: only about 10 landing views have reached /start since the 16:50 swap (6 on 22 Sep after 17:00, 4 today), too few to judge the page; the auth log is the founder's read. €0.25 of lifetime spend leaked to Reels/Stories/right-hand column, all historical, none today.

Surfaced, not acted on: the runway decision again (€5.63, ends Thu 24 Sep 23:59), with three options. Nothing paused, nothing edited, nothing sent. Next Wednesday's product post left for the Sunday 27 Sep sitting per the batching decision.

Answered in session: runway = **option A**, no top-up and no follow-on budget. The ad set spends out its €5.63 and ends Thu 24 Sep 23:59; ~€1 may expire unspent, accepted. Nothing applied — A is the do-nothing option, no ad or ad set call was made. The runway question is closed; the Thursday evening check and Friday noon brief report the run's final totals.

## Tue 22 Sep 2026 (evening check, run 18:10 Madrid)

Nothing to answer: 0 comments, 0 reactions, 0 inbox conversations, including on both of the ad's dark posts. Ad healthy: the /start re-review cleared, ad + ad set ACTIVE, link verified as leadwing.app/start?utm_campaign=spreadsheets-sep26, feed-only, no Audience Network. 22 Sep to 18:00: €2.59 / 1,256 imp / 19 clicks / 12 LPV (63% of clicks, €0.22 each); lifetime €16.26 of €25, €8.74 left. Waste test does not fire on any reading. Noted: the creative swap minted a new dark post 1279663088571991_122109116961476753 (the old one, …122105682405476753, is orphaned — check both for comments); delivery dipped to €0.01/13 imp in the 17:00 hour during re-review and was recovering by 18:00. Nothing paused, nothing edited, nothing sent.

## Tue 22 Sep 2026 (local session with the founder, 15:45–16:55 Madrid)

Numbers at 15:45: 0 comments, 0 messages, 0 followers. Ad on LANDING_PAGE_VIEWS: 21 Sep €8.02 / 6,993 imp / 21 clicks / 10 LPV; 22 Sep to 15:45 €2.27 / 1,082 imp / 17 clicks / 11 LPV (€0.21 per LPV), no Audience Network, €9.06 left. Sign-ups still 10. Pixel last fired 21 Sep 19:16 (Claude's own test), so no ad visitor accepts the cookie notice; Meta counts LPVs through its in-app browser regardless.

Finding: auth.audit_log_entries has 0 rows in 4 days and 0 one-time tokens — about 21 ad landings on the home page produced not one sign-in attempt. The bottleneck is the page, not the ad. (Vercel Web Analytics is enabled — 193 visitors / 481 views / 77% bounce over 7 days in the founder's dashboard — but Claude's connector gets a 404 for it.)

Built and shipped /start + /es/empezar (8e5470d): the ad's headline, the live board, three steps starting with the spreadsheet import, one CTA, noindex. Founder re-pointed the running ad at it from the terminal at ~16:50 (creative 1140361055322528, same image and text); ad IN_PROCESS for re-review.

## Tue 22 Sep 2026 (noon brief, run 12:05 Madrid)

Numbers: followers 0, comments 0 and reactions 0 across every post including the ad's dark post, inbox empty (0 conversations), queue = 2 (Wed 23 + Thu 24 Sep 09:30, timestamps verified). Page insights for 21 Sep: 42 post engagements and 5 page views — the first non-zero page views the page has had, both ad-driven.

Ad: the LANDING_PAGE_VIEWS switch worked. Ad and ad set ACTIVE, re-review cleared, no issues_info, no review feedback. 21 Sep full day €8.00 / 6,987 imp / 6,875 reach / CPM €1.14 / 21 clicks / 10 LPV, of which €4.77 came after the 19:35 switch. 22 Sep to 12:05 €1.60 / 740 imp / 676 reach / CPM €2.16 / 11 clicks / 7 LPV — landing views are 64% of clicks, against 22% on Audience Network junk. Zero Audience Network on both days; FB feed and IG feed only. Hourly shows delivery in every hour of today, no stall. Lifetime €15.25 of €25, €9.75 left.

Not paused, and the waste test no longer fires on any reading: lifetime AN share is down to 33% and lifetime cost per click is €0.075, both outside the test; today's own cost per click is €0.145.

Drafted: nothing to reply to. No digest or product post needed — Wednesday is queued and Friday's digest belongs to the Thursday run.

Surfaced, not acted on: €9.75 and ~60 hours to Thu 24 Sep 23:59, so roughly €1–2 may expire unspent. Whether to fund a follow-on budget is the founder's call; asked, not applied.

## Mon 21 Sep 2026 (local session with the founder, 17:20–19:15 Madrid)

Ad at 17:20: REACH had restarted delivery from ~13:00 — €2.73 / 3,362 imp / 3,024 reach / 3 real feed clicks / 1 LPV, CTR 0.09%, €0.91 per click; €8.38 spent, €16.62 left; sign-ups still 10 (last 7 Sep).

Founder: "install the pixel now and use the left money to improve hunts." Built and shipped the Meta Pixel on the site (f512d57, a19b77f): loads only on marketing URLs and only after a cookie notice is accepted (Spanish law), page views only, footer Cookies link to change the answer, privacy policy §8 rewritten in EN + ES (the old "no cookie banner" promise is gone). Meta's API refused to create a pixel with the page token, so the founder created dataset LEADWING in Events Manager: pixel 1625109429125373 (he first sent the app id by mistake; advanced matching left off on request). Vercel's connector cannot set production env vars, so the pixel id is a host-based default in src/lib/site.ts. Verified live on www.leadwing.app at 19:10: PageView fires for / and /pricing after Accept, nothing on /login.

Ad set switched at ~19:35 by the founder from the terminal (Claude's tooling is blocked from editing ad sets): optimization_goal LANDING_PAGE_VIEWS, end_time Thu 24 Sep 23:59, €15.47 left; first attempt with promoted_object {pixel_id} was rejected (subcode 1885014), second without it succeeded. Ad and ad set IN_PROCESS for re-review. Day total before the edit: €3.67 / 4,717 imp / 6 clicks / 1 LPV.

## Mon 21 Sep 2026 (evening check, run 18:05 Madrid)

Nothing to answer: 0 comments and 0 reactions on all 6 posts (the 09:30 digest included), inbox empty (0 conversations). Nothing drafted, nothing sent.

Ad: the REACH switch worked. Ad and ad set both ACTIVE, review cleared, no issues_info. 21 Sep so far €3.23 / 4,089 impressions / 3,791 reach / CPM €0.79 / 4 link clicks / 1 LPV — all of it Facebook feed (€2.89, 3,596 imp) and Instagram feed (€0.34, 493 imp), **zero Audience Network today**. Delivery ran 14:00–18:00 Madrid, peaking 15:00 (€1.65 / 1,830 imp) then tapering as lifetime pacing takes over. Lifetime €8.85 of €25, €16.15 left.

Not paused: lifetime AN share is 58% (€5.13 of €8.85) and lifetime cost per click €0.051, so the letter of the waste test is borderline — but every AN cent predates the 20 Sep 13:11 placement fix, and today's real cost per click is €0.81. Nothing is being wasted now.

Flagged, not acted on: the ad set still ends Tue 22 Sep 23:59 with €16.15 unspent, and no pixel exists on the account yet (`/adspixels` empty), so the founder's 17:30 plan — LANDING_PAGE_VIEWS + pixel + end_time back to Thu 24 — cannot be applied. Roughly 30 hours to absorb €16.15 at today's ~€0.65/h. Ad set untouched per the playbook.

Account healthy: status 1, no disable reason, Visa *1984, €1.45 balance.

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
