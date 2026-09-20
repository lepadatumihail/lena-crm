# LeadWing Facebook playbook

Read this first on every run. It is the operator's memory: update it when a decision changes or you learn something, and commit it with the log.

## Identity and assets
- Page: LeadWing, id 1279663088571991, facebook.com/leadwingcrm. Ad account: act_173026079415266 (the founder's personal EUR account, Visa on file). Meta app "LeadWing" 1711705727055791, Published.
- The tokens also see the founder's other pages (Roldlab, NØVA Marbella, Prisma Clinic) and their ad accounts. Never touch them.
- Files in this folder: `launch-week.md` (captions + calendar), `scheduled.json` (post ids), `ads.json` (ad ids), `daily-log.md` (what happened, one entry per run), `news-digest-YYYY-MM-DD.md` (digest drafts + sources), `render.mjs` (branded 1080×1350 cards; run `node output/facebook/posts/render.mjs <out-dir>` from the repo root with Node 22+, after `npm ci` in a fresh clone; it uses the repo's Sharp, `assets/fonts/Geist-*.ttf` and the wing paths in `src/lib/brand-mark.ts`).
- Brand: orange #c0603f, ivory #faf8f3, ink #2b2926, muted #7b7469, Geist. Site copy lives in `messages/en/landing.json` and `src/content/pages`.

## Standing decisions (founder, Sep 2026)
- Everything is published on the LeadWing page only. No personal or group posts.
- English only for now.
- Weekly rhythm, all at 09:30 Europe/Madrid: Monday news digest, Wednesday product post, Friday news digest. A single big story may go out the day it breaks.
- Autonomy: do everything yourself, but three things wait for the founder's explicit yes in the run session: publishing or scheduling a post, replying or messaging anyone, and creating, editing, resuming or funding an ad. Batch them: the Sunday run lays out the whole week; mid-week runs only surface real comments, messages or breakages. Allowed without asking: pausing an ad that is clearly wasting money (more than half the spend on audience_network, or clicks under €0.05 with landing views below 30 percent of clicks), and any change to files in this folder.
- Creative rule (founder, 19 Sep): every product post or ad image names LeadWing and what it is (a CRM for independent real-estate agents on the Costa del Sol), says who it is for, shows a real screenshot of the app, has one hook question or plain benefit, a call to action and leadwing.app. Abstract typographic cards were rejected for ads and product posts. Digest cards may be typographic but must carry the LeadWing name.
- Claims never to make: Google Calendar sync (it is a one-way ICS feed), automatic portal lead capture, "one CRM for every agency", reminders while the app is closed, WhatsApp integration.
- Product facts: Free = 10 clients, forever, no card. Pro = €29/month or €276/year. Founding = €19/month or €180/year for life for the first 20 paying agents ("Founding Agent #n"). Excel/CSV import with preview and one-click undo; export on every plan; one client card with budget, viewings, offers, documents; a drafted follow-up on every buyer card; tasks; calendar of viewings; templates.
- Voice: plain, warm, specific, no hype, at most one emoji, no fake testimonials, no invented numbers. Replies in the language the person used.

## News digests
- Search: `GET https://www.searchapi.io/api/v1/search` with `engine=google_news`, `gl=es`, `time_period=last_week`, `link=resolved`, once with `hl=en` and once with `hl=es`; queries like "Costa del Sol property", "Marbella real estate", "Málaga vivienda precios", "alquiler turístico Andalucía", "Estepona Mijas Fuengirola Benalmádena vivienda". Send the key as `Authorization: Bearer`. At most 10 searches per run; check `GET https://www.searchapi.io/api/v1/me` and judge by `current_month_usage` (allowance 10,000; stay under 400 a month).
- Keep: market data, prices and rents, regulation and licences, new developments, infrastructure, agency and industry moves. Skip: crime, celebrities, portal listing pages, national stories without a coast angle, stories already used (check the log).
- Every number comes from the article, opened with WebFetch, never from a headline. surinenglish.com blocks fetches: use a second source or drop the item.
- Format: five items maximum, one or two sentences each in your own words, source in brackets; one line on what it means for an agent's buyers or sellers; sign-off "Curated by LeadWing, the CRM for independent agents on the Costa del Sol. leadwing.app". Source links go in the first comment after publishing, not in the post. Template: `news-digest-2026-09-21.md`.
- Card: typographic digest card via render.mjs: eyebrow "COSTA DEL SOL PROPERTY · WEEK OF …", headline = the strongest fact, sub "Five things agents should know this week", footer leadwing.app.

## Product posts and images
- Real screenshots: use files in `output/facebook/screenshots/` when they exist. Until then, the founder-made image `04-spreadsheets-founder.jpg` shows the accepted style (hook question, category line, audience line, dashboard, button, URL).
- OpenAI images: `POST https://api.openai.com/v1/images/generations` or `/v1/images/edits` (with a screenshot as the reference image), model `chatgpt-image-latest` (same as ChatGPT, which the founder liked) or `gpt-image-2.5-sunburst`, size 1024x1536, response_format b64_json. About €0.05–0.20 per image. Save PNGs in this folder.
- Publishing: `POST /{page}/photos` with `source` + `published=false`, then `POST /{page}/feed` with `message`, `attached_media[0]={"media_fbid": id}`, `published=false`, `scheduled_publish_time` (unix seconds, 10 minutes to 75 days ahead). Re-time with `POST /{post-id} scheduled_publish_time`. Publish a scheduled post now with `POST /{post-id} is_published=true`. Record ids in `scheduled.json`.

## Meta API notes (Graph v21.0)
- Page insights that work: page_post_engagements, page_daily_follows(_unique), page_follows, page_views_total, page_total_actions, page_media_view, page_video_views. Removed: page_impressions*, page_fans, post_impressions.
- Comments: `GET /{page}/posts?fields=id,message,created_time,permalink_url,comments.summary(true){id,from,message,created_time}`; reply with `POST /{comment-id}/comments {message}`. Inbox: `GET /{page}/conversations?fields=id,updated_time,snippet,unread_count,participants,messages.limit(5){from,message,created_time}`; reply with `POST /{page}/messages {recipient:{id}, messaging_type:"RESPONSE", message:{text}}`; replies to the public may be refused until App Review, report the error instead of retrying.
- Ads: campaigns need `is_adset_budget_sharing_enabled=false`; ad-set edits are rate limited to one call per 30 seconds (error 613); `degrees_of_freedom_spec.standard_enhancements` is deprecated (omit); `object_story_spec` creatives need the app Published (it is). Insights: `GET /{adset_id}/insights?fields=spend,reach,impressions,cpm,actions,cost_per_action_type&date_preset=maximum`, link clicks and landing_page_view inside `actions`; breakdowns `publisher_platform,platform_position`. Ad sets must stay on `publisher_platforms [facebook, instagram]`, `facebook_positions [feed]`, `instagram_positions [stream]`: automatic placements sent 99 percent of the first €5.63 to Audience Network junk clicks (19–20 Sep).
- Security: a burst of API edits triggered Meta's "authenticate your account" check on 20 Sep; keep edits few and spaced.

## Pending (keep current)
- Monday 21 Sep 09:30 digest: draft in `news-digest-2026-09-21.md`, founder asked to edit it before it is scheduled. Not scheduled yet.
- Wednesday 23 Sep product post ("Most leads don't say no", scheduled, id in scheduled.json) still carries a typographic card; propose a real-screenshot image before it publishes.
- Thursday 24 Sep founding-offer post scheduled (moved from Friday). Same image concern.
- Click ad (ids in ads.json): €25 lifetime, ends 24 Sep 23:59 Madrid, feed-only since 20 Sep 13:11, re-approved by the founder 19:23. Watch whether feed delivery actually starts; if zero feed impressions for a full day, propose a fix.
- Page has 0 followers, no comments or messages yet (20 Sep).

## Learnings (append, dated)
- 20 Sep 2026: Audience Network delivered 42k impressions and 165 "clicks" for €5 with 0 sign-ups; never leave placements automatic on a link-click ad set without a pixel. A Meta pixel on the site would let ads optimise for landing page views.
