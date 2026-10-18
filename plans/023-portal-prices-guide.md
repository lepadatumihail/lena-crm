# Plan 023: What the property portals charge agents, a dated and sourced guide

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> "STOP conditions" item occurs, stop and report; do not improvise. When done,
> update this plan's row in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 3cfca71..HEAD -- src/lib/routes.ts src/lib/seo.ts src/components/landing/footer.tsx src/app/sitemap.ts src/app/llms.txt/route.ts messages/en/marketing.json messages/es/marketing.json messages/ru/marketing.json`
>
> **Shared working tree**: stage only the files this plan names; never
> `git add -A`.

## Status

- **Priority**: P2
- **Effort**: S–M, about a day. The research is done (see "Facts as
  researched"). What's left is re-checking it on build day, three content
  modules, and the wiring.
- **Risk**: LOW–MEDIUM. Prices change and most are quote-only, so the page has
  to be dated, sourced and re-checked every quarter.
- **Depends on**: nothing. It's a guide and uses the existing `"article"`
  kind, like plan 020.
- **Gate**: re-verify every published price on the day you build (Step 1).
- **Planned at**: commit `3cfca71`, 2026-10-18

## Why this page

Keyword Planner, 18 Oct 2026 (LeadWing Ads account, Spain, Spanish). The
account doesn't spend, so volumes are ranges. Details are in memory as
`project_keyword_planner_oct2026.md`.
- "tarifas idealista profesionales": 100–1K a month.
- 10–100 a month each: "idealista profesionales precio", "idealista tarifas
  profesionales", "precio idealista (para) profesionales", "idealista precios
  anuncios profesionales", "tarifas fotocasa profesionales", "idealista vs
  fotocasa", "tarifas portales inmobiliarios", "portales inmobiliarios
  gratuitos para profesionales", and "portales inmobiliarios internacionales /
  para extranjeros".
- "portales inmobiliarios" is 1K–10K, but that audience is mixed.

Only agents search these, and they search with money in mind. That makes this
rare among the topics with demand: most fee searches come from home sellers.

**Who ranks today** (google.es, 18 Oct 2026, via SearchAPI):
- For "tarifas idealista profesionales", idealista.com holds positions 1, 3
  and 6–9.
- Two pages give agency figures:
  - inmoGesco (#2), a rival CRM: "desde 60 €/mes + IVA", undated and
    unsourced.
  - temploconsulting.com (#4) quotes €43.90 and €11.90. Those are
    **private-seller** prices.
- The portal-list searches are full of CRM blogs: Witei, Inmovilla, Sooprema,
  Inmoweb, inmoPC, 1001portales and helpmycash ("ranking, tarifas").
- Every target search shows an AI Overview.

**The opening**:
- Nobody says plainly that no national portal publishes agency prices.
- Nobody separates official numbers from reported ones.
- Nobody has noticed that Kyero ended its free listings on 31 Dec 2025.

A dated table with a source on every cell is what AI answers and the honest
reader both want. It also leads into LeadWing's real problem to solve:
enquiries arriving from five portals at once.

## Decisions

| Topic | Decision |
|---|---|
| Form | A guide (`kind: "article"`) at `/es/guias/tarifas-portales-inmobiliarios-profesionales` ↔ `/guides/property-portal-prices-spain` ↔ `/ru/gaidy/tseny-portalov-nedvizhimosti-ispanii`. Spanish is the main version; EN and RU are twins (plan 022 keeps every public page in three languages; RU stays Claude's translation). |
| Honesty rule | Each price gets one of three labels: **official** (on the portal's own site, with link and check date), **reported** (a third party's figure, its date, labelled "sin verificar"), or **quote only**. Never present a reported figure as the price. |
| What we never publish | Obsolete figures (e.g. the 2009 Idealista €70–100). JamesEdition's old cached USD tiers. The Fotocasa "Pack Basic al 50%" offer (its page is 404). Milanuncios' general PRO plans presented as property prices. Anything without a URL. |
| No ranking | No "best portal" and no claims about lead quality. The page describes; it doesn't recommend. |
| No lawyer | Price and terms facts only. The optional rental-ad item (Step 1.5) quotes the law and gives no advice. |
| CNMC | Not affected: these are supplier prices, not commission rates. Still no commission % anywhere on the page. |
| CTA | Honest about today's product: "Paste each portal's enquiry into one list" ("Pegar un lead" exists). Never promise automatic portal import; that's plan 014, not built. |
| Dated | "Precios comprobados el <date>" at the top. `PUBLISHED.guidePortalPrices` = launch day. Each quarterly re-check bumps `CHECKED.guidePortalPrices`, never `PUBLISHED` (same rule as plan 020). |

**Titles** (≤ 60 characters; the founder picks before build):
- ES, A (recommended): "Tarifas de Idealista y Fotocasa para profesionales (2026)"
- ES, B: "Cuánto cuesta Idealista a una inmobiliaria en 2026"
- EN: "What Idealista, Fotocasa and Kyero charge agents (2026)"
- RU: "Сколько стоят Idealista, Fotocasa и Kyero для агентов"

**H1 (ES)**: "Cuánto cobran Idealista, Fotocasa y los portales internacionales a una
inmobiliaria".

**Lead paragraph (ES, written so it can be quoted as is)**:
- Ningún portal nacional publica tarifas para profesionales.
- Idealista, Fotocasa/habitaclia, pisos.com y yaencontre dan precio por
  llamada comercial, según zona y número de anuncios.
- Entre los portales que usan las agencias de la costa, solo ThinkSpain,
  Properstar, Spainhouses y FINN.no publican precios para agencias.
- Las cifras que circulan para Idealista vienen de blogs sin fuente.
- Kyero dejó de ser gratis el 31 de diciembre de 2025.

## Steps

### Step 1: Re-verify the facts (build day)

Re-open every "official" URL in "Facts as researched" and confirm the figure.
Record each check in an "As built" section at the end of this plan.
1. **National portals**: confirm Idealista, Fotocasa Pro, pisos.com and
   yaencontre still show no agency prices.
   - If any now publishes them, use the official figures and drop the
     reported ones for that portal.
   - Idealista, yaencontre, pisos.com and the help centres block direct
     fetches. Read them in the built-in browser and click nothing.
2. **Published international prices**: re-read ThinkSpain's 90-day packs,
   Properstar's three plans, Spainhouses' Málaga calculator and FINN's 2026
   table. Note VAT wherever the page states it.
3. **Kyero**: confirm free listings are gone and pricing is still quote-only.
4. **A Place in the Sun**: its site timed out for research, and its facts came
   from search-engine copies. Open it in the browser. If it still won't load,
   list it as "precio bajo consulta" with no audience figures.
5. **Optional rental-ad item**: open RDL 29/2026 on the BOE and read art. 20.
   It was approved on 6 Oct 2026 per Infobae / FACUA (15 Oct 2026).
   - If the text matches (rental ads in stressed zones must show rent type,
     whether the landlord is a large holder, the reference index, the maximum
     rent and the unit's identifier), add the short section in Step 2.
   - If you can't confirm it on the BOE, drop the section; don't STOP.
6. **Reported figures**: keep only those with a date in 2025–2026, plus
   inmoGesco's undated one (label it undated; it ranks #2, so readers will
   have seen it). Drop the rest.

### Step 2: The copy, `src/content/pages/guide-portal-prices.{es,en,ru}.tsx`

Write Spanish first, then the twins.

**Sections**:
1. **Short answer**: the lead paragraph above, plus the check date.
2. **Portales nacionales**, one table. Columns: portal · precio para agencias
   (official / quote only) · gratis para profesionales · cómo te llegan los
   contactos · cómo se suben los anuncios (feed/CRM). Rows: Idealista,
   Fotocasa + habitaclia (Fotocasa Pro), pisos.com, yaencontre, Milanuncios.
3. **Lo que se publica por ahí (sin verificar)**: reported agency figures for
   Idealista and Fotocasa/habitaclia, each with its source and date in the
   cell. One line explains why they disagree: zone, number of listings,
   extras, negotiation.
4. **Portales internacionales**, one table, same columns plus "público al que
   llega" where the portal states it. Rows: Kyero, ThinkSpain, Rightmove
   Overseas, A Place in the Sun, Green-Acres, Properstar (with ListGlobally),
   JamesEdition, Spainhouses, FINN.no. Then a sentence on idealista's own
   language versions (18; English auto-translation).
5. **Qué ha cambiado en 2025–2026**:
   - Kyero dropped free listings (31 Dec 2025).
   - Scout24 bought Fotocasa and habitaclia (agreed 18 Sep 2025, closed in
     about March 2026).
   - Immobiliare.it bought pisos.com (March 2025).
   - Idealista dropped its Kyero purchase over CNMC conditions (Sep 2025).
   - Cinven took control of Idealista (2024).
   - The rental-ad rule from Step 1.5, only if verified.
6. **Antes de firmar con un portal: qué preguntar**, a checklist with no
   advice:
   - price for your zone and number of listings;
   - minimum term, automatic renewal and notice period;
   - whether VAT is included;
   - what's included (destacados, other languages, other portals in the pack);
   - how enquiries reach you, and whether they can be forwarded by email;
   - which feed or CRM it accepts;
   - the history of enquiries per listing in your zone.
7. **Tus contactos de cada portal, en una lista**, the LeadWing paragraph:
   - Agents end up with enquiries in idealista's inbox, Fotocasa's opportunity
     manager, Kyero emails and WhatsApp.
   - LeadWing keeps them in one list with the next step for each.
   - Today you paste each enquiry in ("Pegar un lead").
   - Free for 10 clients.
   - Don't mention automatic import.
8. **Fuentes**, every URL with its check date.

**FAQ**, answered only from the facts:
- ¿Cuánto cuesta Idealista para una inmobiliaria?
- ¿Puede un agente publicar gratis en Idealista?
- ¿Cuánto cuesta Fotocasa Pro?
- ¿Kyero sigue siendo gratis para agencias?
- ¿Qué portales internacionales publican sus precios?

**Related**: `guideIdealista`, `crmMarbella`, `toolCommission`.

Also add a link to this guide from `guide-idealista.{es,en,ru}.tsx`:
- in its `related` list;
- one sentence in the body where it talks about Idealista leads.

### Step 3: Wiring (mirror `guideAndaluciaRegister`)

- **Route key `guidePortalPrices`**: in `MARKETING_ROUTES` (three paths),
  `CONTENT_ROUTES` and `LINKED_ROUTES` (`src/lib/routes.ts`).
- **Pages**: three files.
  - `src/app/es/guias/tarifas-portales-inmobiliarios-profesionales/page.tsx`
  - `src/app/guides/property-portal-prices-spain/page.tsx`
  - `src/app/ru/gaidy/tseny-portalov-nedvizhimosti-ispanii/page.tsx`
- **Dates**: `PUBLISHED.guidePortalPrices` and `CHECKED.guidePortalPrices`
  (`src/lib/seo.ts`).
- **Copy**: label and blurb in `messages/{en,es,ru}/marketing.json`.
- **Sitemap**: entries at 0.6, monthly.
- **llms.txt**: one line under `## Links`.
- **Footer**: add it to `GUIDE_LINKS` in `src/components/landing/footer.tsx`.
- **Tests**: the three paths in `routes.test.ts` and whatever
  `page-dates.test.ts` expects for a new content route.

### Step 4: Verify

- Typecheck, lint, test and build are green.
- Run each check on its own: never pipe them or chain them with `git push`
  (memory: verify before push).
- Pages:
  - All three render at 320 and 1280 px.
  - Both tables scroll sideways on a phone; the page itself never does.
  - Light and dark mode both work.
- JSON-LD parses: Article, BreadcrumbList, FAQPage.
- The markdown twin works.
- Every source link opens.
- Scan for the SWC dropped-space bug (memory: `project_swc_jsx_entity_space`).

## Done criteria

- All three pages are live, sourced and dated.
- They're wired into the sitemap, llms.txt and the footer.
- The Idealista guide links to them.
- The "As built" section lists every price with its URL and check date.
- The README row is updated.

## STOP conditions

- An official price you're about to publish differs from the plan's figure by
  more than a typo. Report both and wait.
- Two official sources disagree on a portal's terms.
- The copy would have to rank portals or recommend one.
- Idealista or Fotocasa now publishes agency prices that contradict the
  reported ranges. Report it: the angle changes.

## Optional Phase B: first-hand prices (gated, no build)

The page would be much stronger with real numbers from agents. Cheapest
route:
- The founder adds one question to his WhatsApp outreach: "¿Cuánto pagas al
  mes por Idealista, y en qué zona?"
- Once there are at least 5 answers from at least 2 zones, add a section "Lo
  que nos dicen agentes de la Costa del Sol (n = …, <month>)".
- Show ranges only, with no names or agencies.

An on-page anonymous form would need a table, moderation and a privacy-policy
update. Only build it if the outreach answers show people want to share.

## Maintenance notes

- Re-check quarterly, and bump `CHECKED.guidePortalPrices` each time.
- Dates to watch:
  - FINN.no's new prices from 5 Jan 2027;
  - ThinkSpain's packs are introductory and may change;
  - Kyero and Fotocasa offers.
- If a national portal starts publishing agency prices, update that row the
  same week. It's the page's whole point.

## Notes for other plans

- **014 (portal lead inbox)**: idealista/tools already gives each customer a
  `…@toolsleads.com` address that imports lead emails forwarded from
  pisos.com, Fotocasa, habitaclia, Kyero, TuCasa and thinkSPAIN.
  - Source:
    https://www.idealista.com/tools/centrodeayuda/articulos/importacion-de-leads-de-portales-inmobiliarios/
    (updated 24 Nov 2025).
  - So the idea isn't new. It's an Idealista-CRM feature, and it ties the
    agent to idealista/tools.
  - Sender facts for the parser list:
    - Kyero sends enquiries to at most two addresses.
    - Properstar sends from `noreply@properstar.com`.
    - ThinkSpain emails enquiries and copies them to its control panel.
    - Fotocasa's "Gestor de oportunidades" emails call alerts.
- **Competitive brief**: the Fotocasa group owns the Witei and Inmoweb CRMs.
  Idealista owns Inmovilla and idealista/tools, and has a stake in yaencontre.

## Facts as researched (18 Oct 2026; re-verify in Step 1)

Every fact below was seen on 18 Oct 2026 unless it carries another date.
"Official" = the portal's own site.

### National portals

**Idealista**
- **Agency pricing: quote only.** The professional page says "Distintas
  opciones de precios y servicios". It gives a phone number (917 886 092) and
  a callback form, with no prices. The presentation PDF it links to (Nov 2022)
  has none either. https://www.idealista.com/nuevo-profesional (official)
- **Agents must use a professional profile.** A private account used by an
  agent may be blocked. idealista.com/ayuda, article "qué ocurre si tengo una
  cuenta como usuario particular y soy agente" (official)
- **Private sellers only** (not agencies): the first 2 listings are free.
  Idealista charges for more than 2, for duplicates, for sales over €1M and
  for rentals over €3,000/month.
  https://www.idealista.com/ayuda/articulos/politica-precios-y-cobros-particulares/
  (official)
  - The "destacado" prices on blogs (€43.90 for 30 days, €11.90 for 24 h) are
    these private-seller prices.
  - Sources: helpmycash (updated 31 Aug 2026); temploconsulting (undated).
- **Reported agency figures** (unverified):
  - "desde 60 €/mes + IVA", can pass 300: https://inmogesco.com/blog/idealista/
    (undated, CRM vendor)
  - "desde 150 EUR/mes":
    https://inmolovers.com/portales/mejores-portales-inmobiliarios-espana
    (11 Feb 2026)
  - €200–500/month "solo por tener presencia", average about €1,000:
    https://diariodeunpsi.substack.com/p/como-acabar-con-idealista (25 Jun
    2025, opinion piece)
  - €150–400 for a small agency, €400–1,200 for 50–100 listings, 12 months
    "negotiable": https://tumetodosaas.com/en/idealista-vs-fotocasa-agents-guide/
    (undated, affiliate site; probably drop in Step 1.6)
- **Leads**: the idealista/tools Inbox with email alerts.
  https://www.idealista.com/tools/centrodeayuda/articulos/inbox/ (official)
- **Feeds**: idealista/tools and Inmovilla are the "recommended" real-time
  integrations.
  https://www.idealista.com/tools/software-recomendado-para-inmobiliarias
  (official)
- **Ownership and news**:
  - Cinven bought 70% for €2.9bn (eldiario.es, 28 Jun 2024).
  - 2025 revenue was €346M, Spain €186M (onlinemarketplaces.com, 11 Aug 2026).
  - Idealista dropped its Kyero purchase over CNMC conditions (forbes.es,
    24 Sep 2025).
  - Audience: about 10.9M unique users, Aug 2026, GfK DAM (pressdigital.es,
    1 Oct 2026).

**Fotocasa + habitaclia (Fotocasa Pro)**
- **Packs: Start, Basic and Premium**, with no prices, VAT, term or trial
  shown. Each pack publishes without limit on Fotocasa, habitaclia and
  Milanuncios. Basic adds 20 Milanuncios priority listings and Premium 40.
  https://pro.fotocasa.es/soluciones-packs/ (official)
- **Size claims**:
  - Fotocasa: 13.8K clients and 28M visits a month.
  - habitaclia: 5,600 clients and 18M visits a month.
  - Sources: pro.fotocasa.es/fotocasa/ and /habitaclia/ (official).
  - Fotocasa audience: over 5M unique users, Aug 2026, GfK DAM.
- **Free listings**: Fotocasa allows 2 free listings per category; the help
  page doesn't say whether that's only for private sellers.
  https://ayuda.fotocasa.es/hc/es/articles/31569862539805 (official)
- **Reported** (unverified): Fotocasa "desde 100", habitaclia "desde 80
  EUR/mes" (inmolovers, 11 Feb 2026).
- **Leads**: the "Gestor de oportunidades" emails a call alert to the
  assigned agent, plus missed calls and an inbox.
  https://pro.fotocasa.es/soluciones-gestor-de-oportunidades/ (official)
- **Feeds**: a CRM connects with an InmoFactory API key, and the same key
  covers habitaclia. https://faq.witei.com/en/articles/118353 (5 May 2026,
  third-party)
- **Ownership**: Scout24 agreed to buy both from EQT on 18 Sep 2025, at about
  €153M EV (scout24.com investor relations PDF). It closed around 2 Mar 2026
  (onlinemarketplaces.com, 6 Mar 2026).

**Milanuncios**
- Professionals can publish 2 property listings per category for free. More
  needs Fotocasa Pro.
  https://ayuda.milanuncios.com/hc/es/articles/360002512720-Inmobiliaria
  (official)
- Its general PRO plans (€34.95, €54.95 and €72.75 a month before tax) are
  **not** property pricing. Don't use them.

**pisos.com**
- Packs on quote only, through the sales team (91 922 77 62).
  https://www.pisos.com/es/login/profesionales (official)
- Immobiliare.it bought it from Vocento for €22.5M in March 2025. It has
  about 8,500 agencies and over 450K listings; the group also runs Indomio.es
  and Enalquiler (onlinemarketplaces.com, Mar 2025).
- Audience: over 2.4M unique users (Aug 2026).
- Reported: "desde 50 EUR/mes" (inmolovers, Feb 2026).

**yaencontre**
- Quote only (917 010 251); enquiries arrive as direct messages.
  https://www.yaencontre.com/inmobiliarias/nuevo-profesional (official)
- Idealista took a stake in February 2020.
- Reported: "desde 60 €/mes" (inmolovers).

### International portals

**Kyero**
- **Paid only since 1 Jan 2026**; free listings ended on 31 Dec 2025.
  https://www.kyero.com/en/join/market-insight/spain/kyero-ends-free (11 Nov
  2025, official)
- **Plan**: a "PrimeAI" subscription with Prime slots. The price comes from a
  quote form, with no price list. kyero.com/en/join/features (official)
- **VAT**: the operator is Portal 47 Ltd (UK). It charges no Spanish IVA, and
  no UK VAT to EU VAT-registered businesses.
  help.kyero.com, "will I be charged VAT" (official)
- **Reported price**: €6 per listing per month at 25 listings (€450 per
  3 months), down to €0.80 at 1,000 listings (€2,400 per 3 months).
  https://luxinmo.com/portals/kyero (undated)
- **Feed**: Kyero XML v3.9, processed daily. It integrates with more than 50
  systems, including Resales-Online, Inmovilla, idealista/tools, Witei and
  thinkSPAIN. help.kyero.com XML import specification;
  kyero.com/en/join/features/integrations (official)
- **Leads**: by email, to at most 2 addresses.
- **Audience**: 3M visits and 70,000 enquiries a month. 12-month unique
  visits: UK 4.2M, Spain 3.25M, NL 1.7M, DE 1.55M, FR 1.35M, US 1.05M.
  https://www.kyero.com/en/join (official)

**ThinkSpain**
- **Introductory 90-day packs, before VAT**, for new advertisers (or those
  away more than 12 months).
  https://www.thinkspain.com/advertise/property-agent (official)

  | Listings | Price | Featured listings |
  |---|---|---|
  | 25 | €118 | 1 |
  | 50 | €161 | 2 |
  | 100 | €227 | 5 |
  | 250 | €377 | 10 |
  | 500 | €625 | 25 |

- "From as little as 25 euros per month" on the annual option; no annual
  table is shown.
- **Terms**: fixed fee, no commission.
- **Leads**: emailed to you and copied to the control panel.
- **Audience**: 1M+ visitors and 50,000+ enquiries a month, in 12 languages.

**Rightmove Overseas**
- **Quote only.** You fill in a form and an account manager calls back within
  3–5 working days.
  https://www.rightmove.co.uk/overseas-property/advertise/estate-agent
  (official)
- **Audience**: 26M+ visits a year; "over 5 million searches for overseas
  property every month".
- The only third-party price is from Sep 2024, which is old. Don't use it.

**A Place in the Sun**
- **Agents: contact sales.** Private owners pay £149, £299 or £349 for
  6 months.
- These come from search-engine copies of the site, which didn't load for us.
  Verify in Step 1.4.

**Green-Acres**
- **30-day free trial** with no commitment, and no published prices. The
  sign-up form asks the agency to enter its budget.
  https://www.green-acres.es/en/pro (official)
- **Audience**: 70% of visitors are foreign: NL 12%, DE 11%, UK 10%, BE 9%,
  US 7%.
- **Feed**: Green-Acres' own XML.

**Properstar (ListGlobally is now part of it)**
- **Prices in EUR; VAT not stated.** Larger volumes are quote only.
  https://dashboard.properstar.com/pricing (official)

  | Plan | Billed yearly | Billed every 6 months |
  |---|---|---|
  | Global 20 | €132.50/month | €150/month |
  | Global 50 | €225 | €248.33 |
  | Global 100 | €366.67 | €406.67 |

- **Terms**: paid in advance, renews automatically. Cancel at least 30 days
  before the renewal date. help.properstar.com (official)
- **Reach**: 35 countries plus "80+ additional portals".
- **Feeds**: Kyero, RightMove, OpenImmo and IDX formats, and 38 Spanish CRMs.
- **Leads**: emailed from `noreply@properstar.com`, or straight into an
  integrated CRM.

**JamesEdition**
- **Elite and Elite Plus** say "Get my pricing" and show no figures.
  https://www.jamesedition.com/professional_seller/real_estate (official)
- **Minimum price**: residential homes from $490,000.
- **Audience**: 2.4M+ visits a month; 7 in 10 enquiries come from abroad.
- **Integrations**: 96 CRMs, including Resales Online, Inmovilla and
  idealista/tools.

**Spainhouses.net**
- **Prices from its calculator** ("Málaga special offer"); VAT not stated.
  Quarterly and 6-month discounts exist.
  https://www.spainhouses.net/en/real-estates/plans-and-prices.html
  (official)

  | Listings | Monthly | Billed yearly |
  |---|---|---|
  | 25 | €36 | €345.60 (= €28.80/month) |
  | 50 | €54 | €518.40 |
  | 100 | €96 | €921.60 |
  | 250 | €126 | €1,209.60 |
  | 500 | €156 | €1,497.60 |

- **Feeds**: publishes automatically from Inmovilla, Inmoweb, Witei and
  others.
- **Reach**: 12 languages.

**FINN.no (Norway, "Bolig i utlandet")**
- **2026 price per listing, before VAT**, falling with volume. The billing
  period isn't stated.
  https://www.finn.no/eiendom/prisoversikt (official)

  | Listings | NOK per listing |
  |---|---|
  | 1–10 | 2,360 |
  | 11–50 | 1,636 |
  | 51–100 | 1,319 |
  | 101–250 | 821 |
  | 250–499 | 726 |
  | 500+ | 571 |

- New prices start on 5 Jan 2027.
- Spanish agencies (S.L. companies) do list there: there were 1,688 Costa del
  Sol listings on 18 Oct 2026.

**Idealista abroad**
- 18 language versions. Listings are auto-translated from Spanish into
  English.
  https://www.idealista.com/tools/centrodeayuda/articulos/traduccion-automatica-de-tus-anuncios
  (updated 27 Nov 2025, official)

**Not included** (couldn't confirm that Spanish agents list directly):
- Hemnet only links out to agencies.
- Funda, ImmoScout24 and Immowelt. ImmoScout24's overseas page shows Spanish
  listings "mit fotocasa".

### Gaps (say "no publicado" rather than guess)

- No official agency price, VAT treatment or minimum term at Idealista,
  Fotocasa/habitaclia, pisos.com or yaencontre.
- No professional prices for destacados at any national portal.
- How leads are delivered at Rightmove Overseas, A Place in the Sun and
  Spainhouses.
- Kyero XML acceptance is officially confirmed only by Kyero and Properstar.

## Sources for the demand (18 Oct 2026)

- Keyword Planner export notes and SearchAPI results pages: kept in that
  session's scratchpad, not the repo. Summary in memory as
  `project_keyword_planner_oct2026.md`.

## As built (2026-10-18)

### Step 1: the facts, re-verified on build day

Every official figure was re-opened the same day. Pages that block scripted
fetches (idealista, yaencontre, Milanuncios, Kyero, Spainhouses, JamesEdition)
were read in a real browser. Spainhouses' prices came from its own calculator
endpoint for Málaga.

**Confirmed as planned**:
- ThinkSpain: the five 90-day packs, "Prices exclude VAT", and "from as
  little as 25 euros per month" on the annual option.
- Properstar:
  - €132.50 / €225 / €366.67 a month, billed yearly.
  - The 6-month prices (€150 / €248.33 / €406.67) follow exactly from the
    page's "save 210/280/480 EUR".
  - No VAT mention.
  - Cancel 30 days before renewal:
    https://help.properstar.com/knowledge/cancel-your-subscription
- Spainhouses: all five Málaga tiers. Yearly −20%, half-yearly −15%,
  quarterly −10%; no VAT mention.
- FINN.no: all six tiers; "Alle priser er eks. mva"; new prices from
  5 Jan 2027.
- Kyero:
  - Free listings ended 31 Dec 2025 (article dated 11 Nov 2025).
  - "3 million buyers visit Kyero.com every month"; "70,000 property
    enquiries".
  - Portal 47 Ltd, no Spanish IVA.
  - Two enquiry email addresses.
- idealista: no agency prices, only a callback form or phone. The
  private-seller rules are as planned.
- Fotocasa Pro: Start, Basic and Premium have no prices, and all three
  include unlimited publishing on the three portals. Client and visit
  figures as planned.
- pisos.com and yaencontre: quote only. Milanuncios: 2 property listings
  per category.
- Green-Acres: 30-day trial and the visitor shares as planned.
- JamesEdition: Elite and Elite Plus show no figures; "priced from
  $490,000"; "2.4M+ visits per month".

**Corrected in the copy**:
- Kyero:
  - "3 million buyers", not visits.
  - No UK VAT for EU-*registered* businesses; the help page doesn't say
    "VAT-registered".
  - Its pricing is a paid subscription with no published price; the
    features page shows "Get started" / "Contact", no quote form.
- Fotocasa: the Milanuncios extras are *featured* listings ("Destacados
  Milanuncios", 20 / 40 "por prioritario"), not "priority listings".
- Rightmove's estate-agent page says "over 26 million visitors each year"
  (visitors, not visits).
- inmoGesco's page was modified on 15 Apr 2026, so it now says "updated
  April 2026" rather than "undated".
- The Spainhouses row states its prepayment discounts instead of "12
  languages", which this check didn't re-verify.

**Dropped**:
- **A Place in the Sun.** Its site didn't open in curl or in the browser,
  so it isn't on the page: every link on the page has to open.
- **The rental-ad item (Step 1.5)**, a deliberate skip:
  - RDL 29/2026 exists: BOE-A-2026-20823, of 6 Oct 2026, BOE no. 249 of
    7 Oct, in force since 8 Oct. Ratification by Congress wasn't found.
  - Art. 20 doesn't say what the press reported. It covers "toda oferta o
    publicidad de arrendamiento" (all rental ads, not just stressed zones).
  - It requires the reference price index (only in a zona tensionada), the
    legal rent cap where one applies, and "cuando proceda" the unit's
    identifier and whether the landlord is a gran tenedor.
  - It doesn't require a "rent type", and it doesn't name agencies.
  - If it's ever covered, quote the article itself, not FACUA.

**idealista/tools lead import** (for plan 014): the `xxx@toolsleads.com`
import page (updated 24 Nov 2025) lists these portals: pisos.com, vibbo,
Vivados, rightmove, Luxuryestate, TuCasa.com, Thinkspain, Globaliza,
fotocasa, Kyero, habitaclia, GreenAcres, subito.it and Trovimap.

### What shipped

- **Three pages**, `src/content/pages/guide-portal-prices.{es,en,ru}.tsx`,
  sharing one sources module, `guide-portal-prices.sources.ts`, so the
  quarterly re-check fixes a moved URL once.
- **Routes**: `/es/guias/tarifas-portales-inmobiliarios-profesionales` ↔
  `/guides/property-portal-prices-spain` ↔
  `/ru/gaidy/tseny-portalov-nedvizhimosti-ispanii`.
- **Titles**: ES "Tarifas de Idealista y Fotocasa para profesionales (2026)"
  (founder's pick, A); EN "What Idealista, Fotocasa and Kyero charge agents
  (2026)"; RU "Цены Idealista, Fotocasa и Kyero для агентств (2026)".
- **Narrow tables** of two or three columns, not the planned five, plus one
  section per portal: five columns overflow a 320 px phone and the prose
  styles have no scroll wrapper.
  - The unverified-figures table has one row per source. A list inside a
    cell made the markdown twin fall back to raw HTML.
- **Typography**:
  - The English module uses typographic ’ “ ” (as the register guide does),
    so the SWC dropped-space bug can't apply.
  - Prices and currency are held together with no-break spaces in ES and
    RU.
  - Russian brand names in the first column opt out of
    `html:lang(ru) article :is(td, th)`'s `overflow-wrap: anywhere`
    (`BRAND_CELL`); otherwise "Rightmove Overseas" broke inside the word.
- **Wiring**:
  - `guidePortalPrices` added to `MARKETING_ROUTES`, `CONTENT_ROUTES` and
    `LINKED_ROUTES`.
  - `PUBLISHED` and `CHECKED` both 2026-10-18; sitemap 0.6, monthly.
  - Label and blurb in the three `marketing.json` files.
  - The llms.txt line, the footer's Guides column, and the three paths in
    `routes.test.ts`.
- **The Idealista guide** (three languages) links here in the body, after
  "what no portal gives you", and in `related`.

### Verification, 2026-10-18

- `npm run typecheck`: clean.
- `npm run lint`: 0 errors. The 10 warnings are all in untouched files.
- **Tests**:
  - `npx vitest run` under Node 24 (the version CI pins): 1,136/1,136.
  - Under the Mac's default Node 22, `import/read.test.ts` fails on
    windows-1252, a Node 22 TextDecoder quirk unrelated to this work.
- `npm run build`: green, with all three routes.
- **Production server** (`next start`):
  - All three pages return 200.
  - JSON-LD: Article, BreadcrumbList and FAQPage.
  - hreflang en/es/ru/x-default; the markdown twin renders GFM tables; the
    sitemap, llms.txt and footer carry the link.
  - No `</strong>[a-z]` or `<!-- -->` glue in `<main>`.
- **Layout**:
  - At 320 px, all three pages have `scrollWidth` = 320, and tables end at
    the 304 px column (one is 1 px wider in EN).
  - 1280 px checked in ES.
- **Source links**: every URL in the sources module answers.
  - idealista, yaencontre, Milanuncios, Kyero's main site, Spainhouses and
    JamesEdition return 403 to curl (bot walls) but open in a browser.
    Kyero, JamesEdition and Spainhouses were spot-checked again.
