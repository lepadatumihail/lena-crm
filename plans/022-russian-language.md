# Plan 022: Russian, the third language

## Status

- **Built**: 2026-10-09, on the founder's call ("I know a bunch of Russian
  agents, so let's just do it anyway"). Search demand for Russian in Spain was
  checked first and is near zero (see Why). The reason is outreach to
  Russian-speaking agents, not search.
- **Scope**: everything. The signed-in app, every public page (17 routes
  under `/ru`), the legal pages, the client tracker workbook, the importer
  and the calculator PDF.

## Why

The founder knows Russian-speaking agents on the coast. Google Spain, checked
the same day via SearchAPI Trends (5 years, weekly): "crm для риэлтора" and
"риэлтор испания" have no data. Even the bare word "риэлтор" registers in 3
of 262 weeks, against 11 for "real estate crm". So the Russian pages are for
sending to agents, not for ranking. Russian searchers on the CRM topic get
Russian and Ukrainian sites.

## What changed

- **Locale**: `LOCALES` = en, es, ru; `INTL_TAGS.ru` = "ru-RU"; date-fns `ru`;
  OG locale `ru_RU`. Catalogs are in `messages/ru/*.json` (26 namespaces), deep-merged
  over English like Spanish.
- **Public URLs**: `/ru/...` with transliterated Latin slugs, so links stay
  readable when pasted into WhatsApp. The list is in `MARKETING_ROUTES`. The
  proxy forwards a Russian browser or cookie from an English URL, as it does
  for Spanish.
- **Language switcher**: the marketing header's EN/ES buttons became a
  dropdown (`LocaleMenu`). The app's sidebar select, account menu and
  settings read `LOCALES`, so Russian appears there unchanged.
- **Database**: migration `20261009120000_profile_locale_ru.sql` widens
  `profiles_locale_check`. Applied live on 2026-10-09 with its history row.
- **Display font**: Instrument Serif has no Cyrillic. Russian pages use Noto
  Serif Display on its width axis (`font-stretch: 70%`, weight 350), loaded
  without preload and switched by `html:lang(ru)` in globals.css. Russian
  article tables and phone headings may hyphenate. Every `/ru` page fits at
  375 and 320 px.
- **Content**: Russian modules for every written page
  (`src/content/pages/*.ru.tsx`) and legal page (`src/content/legal/*.ru.tsx`).
  The legal translations say they are provided for convenience and that the
  English version prevails. The contract languages stay English and Spanish.
- **Importer and export**: `synonyms.ts` and `normalize.ts` read the Russian
  transfer and crm catalogs, and yes/no accept «да»/«нет». Russian CSV uses
  ";" and ",", like Spanish. The money parser now reads space-grouped
  thousands («5 000», no-break or narrow space). Without this, ru-RU
  formatting broke every calculator amount over 999.
- **Client tracker**: a Russian workbook, `leadwing-tablitsa-klientov.xlsx`,
  built from the Russian catalogs. Its column names import as they are.
- **Calculator PDF**: Helvetica has no Cyrillic. A PDF with any letter
  beyond WinAnsi is set in Geist (`public/fonts/Geist-Regular.ttf`, the OFL
  TTF Next ships for OG images, regular weight only). English and Spanish
  PDFs are unchanged; bold now goes through `fontWeight` (Helvetica-Bold).
- **Copy**: "English and Spanish" claims on the site and in llms.txt now
  include Russian.

## Not done

- **No native Russian review.** Claude translated everything (glossary:
  «риелтор», «вы», «»), like the Spanish, which also still awaits one. A
  Russian-speaking agent should read the home page, pricing, a tool and the
  app.
- **Signed-in app screens not seen in Russian.** Claude can't sign in, so
  they are covered by the catalog checker (keys, ICU, four-form plurals) and
  tests only.
- **Film**: no Russian cut. `/ru` plays the English film.
- **Client message templates**: built-in templates are English and Spanish
  (`TEMPLATE_LANGUAGES`). Russian ones would help agents with Russian
  buyers.
- **Ad landings** `/ru/nachat` and `/ru/povtornyi-kontakt` exist, noindex,
  like the others.

## Checks (2026-10-09)

- The catalog checker passes for all 26 namespaces (keys, ICU arguments,
  tags, four-form plurals).
- Typecheck, lint (0 errors), 1,051 tests and `next build` pass on Node 24.
- In the browser: /ru home, header dropdown, earnings calculator (worked
  example € 1 906,12 from a shared link), head tags, hreflang en/es/ru,
  Russian JSON-LD, sitemap, Russian workbook and the Russian sign-in page.
- Local testing wrote site_events 523–566 to the live table; they were
  deleted by id.
