# Plan 025: Three CRM comparison guides (free plans, best for independent agents, Witei and Inmovilla alternatives)

> **Shared working tree**: stage only the files this plan names; never
> `git add -A`.

## Status

- **Priority**: P2
- **Effort**: M–L. Three guides × three languages, one shared sources file,
  the usual wiring.
- **Risk**: MEDIUM. These pages name rival products, so every compared fact
  has to be objective, relevant and verifiable (Ley 3/1991 de Competencia
  Desleal, art. 10), and prices move. Dated, sourced, re-checked quarterly.
- **Depends on**: nothing. Guides use the existing `"article"` kind.
- **Asked for**: 20 Oct 2026, the founder's "ok do this" on step 3 of the AI
  visibility answer (see memory `project_ai_visibility_check_oct2026.md`).
- **Planned at**: commit `9b67f20`, 2026-10-20

## Why these pages

A logged-out SearchAPI check on 20 Oct 2026 (google.es, bing):
- LeadWing appeared in none of six category searches: "mejor crm
  inmobiliario", "crm inmobiliario gratis", "crm para agentes inmobiliarios
  autónomos", "alternativas a witei", "best crm for real estate agents in
  spain", "best crm for estate agents marbella".
- Page one of "mejor crm inmobiliario" is eight roundups on software
  companies' own blogs, including rival CRMs (Vesta, Inmoweb).
- Proxera, an AI-assistant company that also sells to lawyers and gestorías,
  reaches page one in three of the six searches with a few posts. The bar is
  low.
- GetApp is #1 for "alternativas a witei"; Google's AI Overview for "crm
  inmobiliario gratis" cites InmoProCRM, Inmogesco, HubSpot, Capterra and
  Softr.

Demand (Keyword Planner, 18 Oct 2026, Spain, bucketed): "crm inmobiliario"
and "crm inmobiliario gratis" 100–1K a month each; "witei crm", "inmovilla
crm" and "inmopc crm" 100–1K each.

On 13 Sep 2026 the founder turned down "LeadWing vs X" pages because nobody
searches the brand yet. That still holds. These pages target the category and
the rivals' names instead.

## Decisions

- **Three pages, three intents**, so they don't read as near-duplicates
  (the doorway risk the founder raised on 13 Sep):
  1. `guideFreeCrm`: what each free plan includes, and its limit.
     /guides/free-real-estate-crm-spain ↔ /es/guias/crm-inmobiliario-gratis ↔
     /ru/gaidy/besplatnye-crm-dlya-rieltorov
  2. `guideBestCrm`: which CRM fits which way of working.
     /guides/best-crm-independent-agents-spain ↔
     /es/guias/mejor-crm-inmobiliario-agentes-independientes ↔
     /ru/gaidy/luchshaya-crm-dlya-rieltora
  3. `guideCrmAlternatives`: what Witei and Inmovilla are and cost, the
     alternatives, and how to move your clients out.
     /guides/witei-inmovilla-alternatives ↔
     /es/guias/alternativas-witei-inmovilla ↔
     /ru/gaidy/alternativy-witei-inmovilla
- **Facts only from the vendors' own pages**, checked on build day, linked
  from one shared file (`src/content/pages/crm-comparison.sources.ts`). A
  price a vendor doesn't publish is "on request"; no blog figures.
- **Describe, don't judge.** No "worse", no quality claims about a rival, no
  CNMC fines, no reviews. Say what each product is built for and who it fits.
- **Disclose.** Each page says LeadWing makes it and lists what LeadWing
  doesn't do (portal publishing, a website, an MLS, a WhatsApp inbox, teams,
  rentals, automatic portal import).
- **Client data**: the alternatives page says who owns client data depends on
  the agent's contract with each agency, and that moving it needs a lawful
  basis. Never suggest copying an agency's database.
- **No commission percentages anywhere** (the CNMC rule from plan 018).
- **Tables stay at three columns** so they fit a 320 px phone (`Prose` has no
  horizontal scroll for tables).

## Maintenance

Re-check every price and limit quarterly (next: January 2027) and bump
`CHECKED.guideFreeCrm`, `CHECKED.guideBestCrm` and
`CHECKED.guideCrmAlternatives` in `src/lib/seo.ts`. Fincta's "free until
February 2027" offer (if still stated) needs a check right after it ends.

## As built (2026-10-20)

**Homepage first.** `landing.onePlace.body` no longer says LeadWing "pulls" Notes,
Calendar, Drive and WhatsApp onto the card (EN/ES/RU now: you paste the enquiry,
log the call, attach the papers); `srSummary` describes the animation instead of
claiming sync. `llms.txt` said "Google Calendar sync"; it now says read-only
calendar feed, as the landing FAQ does.

**Research.** Four agents read every vendor's own pages with curl on build day
(notes stayed in that session's scratchpad). Inmovilla's site blocks curl, so its
pricing page was read in the Browser pane, as were Witei's rendered price table
and Resales Online's live agency counter. Facts that corrected our September
notes:
- Witei: free plan 250 contacts + 10 properties + 1 user, no gateways; paid
  modules €25/45/65 each + IVA; no idealista gateway for accounts opened since
  Feb 2022 (its help centre); owned by Fotocasa Group SL (ex Adevinta Real
  Estate), which Scout24 bought on 27 Feb 2026 (BORME + Scout24 Q1 report).
  Inmoweb is a sister brand.
- Inmovilla: 15-day trial (1 trial user); Full Edition €79/month or €790/year
  + IVA, 7 users, €12 per extra user; WhatsApp Inbox is a QR-linked session.
- Fincta's "free with no limits" is a promotion until 1 Feb 2027, then 1 agent,
  12 clients, 7 properties. PropertyList says itself its CRM is "not 100% free"
  (buyer pipeline: 1 credit after 5). HubSpot's free CRM is 2 users and 1,000
  contacts since autumn 2024 (Google's AI answer still says a million).
  Clientify and Pipedrive have trials, not free plans. Resales' €190 is Network +
  New Developments, 4 users. inmuebles.cloud is Mexican and was left out.

**Pages.** English written first, then six translator agents (ES ×3, RU ×3)
with one glossary; every Spanish page reviewed in full. Fixes after review:
«la MLS» (the site's gender), «titularidad» instead of «propiedad», a distinct
first FAQ question on the ES free page, «Нюанс» instead of «Подвох».

**Phones.** Russian tables may break words anywhere (globals.css), which shrank
the alternatives page's first column until «Цена» split in two; row labels in
every Russian comparison table use `BRAND_CELL` (no break inside a word). The
Spanish alternatives page's first table was 7 px wider than the column at 320
px; its data cells hyphenate (`[&_td]:hyphens-auto`). All nine pages: no
horizontal scroll at 320 px.

**Also fixed.** Two live Russian guides (portal prices, become an agent) ended a
sentence with `{AS_OF}.`, which renders «2026 г..».

**Guard.** `src/content/pages/crm-comparison.test.ts`: each translation prints
the same figures and cites the same sources as the English, every source in
`crm-comparison.sources.ts` is cited, all are https.

**Verified.** Typecheck, lint (0 errors), 1,201 tests on Node 24 (on the Mac's
default Node 22 one pre-existing import test fails: windows-1252 decodes 0x80
differently), `next build`, and all nine pages in the browser: titles, H1,
no glued links, Markdown twin, Article + Breadcrumb + FAQPage JSON-LD.

**Open.** Native review of the ES and RU copy; request indexing in Search
Console; re-check in January 2027 and right after Fincta's 1 Feb 2027 change.
