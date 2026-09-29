# Plan 019: A free client-tracker spreadsheet that imports into LeadWing, plus the /tools hub

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> "STOP conditions" item occurs, stop and report; do not improvise. When done,
> update this plan's row in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 96a58cf..HEAD -- src/lib/import src/lib/transfer src/components/import src/components/marketing src/lib/marketing.ts src/lib/seo.ts src/lib/routes.ts src/components/landing/footer.tsx src/app/sitemap.ts src/app/llms.txt/route.ts package.json`
> Plan 018's changes are expected. Compare anything else against "Current
> state"; a mismatch you can't reconcile is a STOP condition.
>
> **Shared working tree**: other Claude sessions may be editing this checkout at
> the same time. Stage only the files this plan names (`git add <path>`), never
> `git add -A`, and don't touch changes you didn't make.
>
> **Next.js 16**: read `node_modules/next/dist/docs/` before writing the route
> handler (see `AGENTS.md`).

## Status

- **Priority**: P1
- **Effort**: S–M, about 1–1.5 days:
  - workbook and route: 0.5 day
  - page and hub: 0.5 day
  - copy: 0.25 day
  - the Google Sheets copies are a short step for the founder
- **Risk**: LOW. No migration. One small importer change: three header words.
- **Depends on**:
  - **plan 018 Phase A (hard)**: this plan uses the `"tool"` kind, the shell's
    tool slot, `TOOL_ROUTES`, the tool events and the footer column;
  - plan 012 (client import, built).
- **Category**: growth / SEO
- **Planned at**: commit `96a58cf`, 2026-09-29

## Why this matters

- **Spreadsheets are the real competitor.** Spreadsheets and WhatsApp are what
  agents use instead of a CRM (GTM strategy, June 2026). The `/start` ad
  landing already sells "Move your spreadsheet into LeadWing".
- **People search for templates.** On 29 Sep 2026 Google suggested:
  - "excel para inmobiliarias", "excel para inmobiliarias gratis"
  - "plantilla excel inmobiliaria", "plantillas excel para inmobiliarias gratis"
  - "base de datos inmobiliaria gratis", "base de datos inmobiliaria ejemplo"
- **The results are weak.** For "plantilla excel clientes inmobiliaria" they
  are:
  - Etsy, selling a paid CRM spreadsheet
  - slidesdocs.com template pages
  - flowestate.app, a CRM with Excel templates
  - justexw.com
  - Facebook and Instagram posts
- **The file leads straight into the product.** Import (plan 012) is live, and
  a tracker built from LeadWing's own headers imports with no column matching
  at all. After signing up from this page, an agent lands on the import
  wizard.

## Decisions (defaults; the founder can veto any line)

| Topic | Decision |
|---|---|
| One workbook per language | An English file with English headers and a Spanish file with Spanish headers. LeadWing's own headers in both languages are exact matches in the importer (`synonyms.ts` loads both `transfer.json` catalogs). |
| Sheets | Buyers first, Sellers second, "How to use" last. The import wizard opens the first sheet and shows a sheet picker when there are more (`src/components/import/columns-step.tsx:139`). Sheet names come from `transfer.sheets.buyers` and `.sellers` ("Compradores" and "Vendedores" in Spanish). |
| Columns | Each side's import-template columns (the `headers` of `templateTable(side, ctx)`, `src/lib/import/template.ts`), then three tracker columns at the end: Last contact (a date), Next follow-up (a date) and Days since contact (a formula). |
| No sample rows | The Buyers and Sellers sheets have headers only, so a forgotten example never becomes a client. The How-to sheet shows one filled-in example as a small table. |
| Tracker columns on import | Last contact and Next follow-up are imported as "Header: value" note lines. Days since contact is ignored. Both are set by explicit dictionary entries, not keyword guesses: "contacto" could otherwise be guessed as something else. Importing Last contact into `last_contacted_at` is out of scope; that column is written only by the contact-log trigger (see plan 016). |
| Highlights | Conditional formatting over rows 2–501: a row turns amber when its Next follow-up is today or earlier, and grey when Days since contact is `STALE_AFTER_DAYS` or more (`src/lib/attention.ts:13`, 7 today, the same "quiet" threshold the app uses; read the constant, don't hard-code 7). Soft pastels that fit the mono look. |
| Dropdowns | List validation with exact labels the importer accepts:<br>• Stage: the side's stages from `crm.json`<br>• Deal type (buyers) and Role (sellers)<br>• Priority and Active: `transfer.values.yes` and `.no`, which `parseYesNo` accepts<br>• Property type (sellers only; the buyers' column holds several types)<br>Built with `@onparallel/write-excel-file-data-validation` 1.0.0, whose peer is `write-excel-file ^4.1.1`, the installed version. If the file then opens in Excel with a repair prompt, drop the dropdowns and list the allowed values on the How-to sheet instead (see STOP conditions). |
| Built from code | A prerendered route builds both workbooks at build time from the same modules as the in-app template, so the headers can't drift from the importer. No binary files in git. |
| Google Sheets | "Make a copy in Google Sheets" appears once each file has been uploaded to the founder's Drive, converted and shared view-only. The `/copy` URLs go in a constant; until then the button is hidden. Sharing makes the files public, so it needs the founder's yes. |
| No email wall | Downloads are free and count as `tool_use` (plan 018's event). |
| Sign-up | This page's `SignUpDialog` sends new agents to `/clients/import` through a new `next` prop. |
| Hub | `/tools` ↔ `/es/herramientas` lists both tools. The tool pages' breadcrumb gains a Tools level, which Google accepts now that the level is a real page. |

## Current state (verified 2026-09-29 at `96a58cf`, plus plan 018)

1. **The in-app import template**:
   - `src/app/(app)/clients/import/template/route.ts` serves it to signed-in
     agents.
   - `templateTable(side, ctx)` returns the export's headers minus 12 columns
     the app fills in (`NOT_IN_TEMPLATE`), plus two sample rows per side.
     This plan uses **only its `headers`**.
2. **Excel writing**:
   - `buildWorkbook` (`src/lib/transfer/xlsx.ts`) writes a bold, frozen
     header row and typed cells, with no formulas, validation or conditional
     formatting. Export files must stay that way, so the tracker gets its own
     builder that calls `write-excel-file/node` directly.
   - `write-excel-file` 4.1.1 supports formula cells
     (`type: "Formula"`, `value: "=…"`) and conditional formatting (the
     `conditionalFormatting` option, including formula rules like
     `{ formula: '=$A2<>""' }`); see its README around line 685. Data
     validation needs the plugin above.
3. **`TransferContext`** is `{ locale, timeZone, t, tt }`
   (`src/lib/transfer/format.ts:50`), where `t` is the `crm` translator and
   `tt` the `transfer` translator. Outside a request, build it with
   `getTranslations({ locale, namespace: … })` and `timeZone: "Europe/Madrid"`
   (a template has no instants).
4. **The importer**:
   - It reads every sheet (`src/lib/import/read.ts`) and drops empty rows.
   - `autoMap(headers, rows, side)` (`src/lib/import/auto-map.ts:61`) maps
     each header through `matchHeader`. Unknown headers become
     `add_to_notes`.
   - The `ignore` concept lists live at `synonyms.ts:205-206`.
   - `normalizeStage` accepts the English and Spanish stage labels from
     `crm.json`.
   - `parseYesNo` accepts "Yes", "Sí" and "No".
5. **Route handlers can be prerendered** with `generateStaticParams`
   (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md:337`).
   The app doesn't use Cache Components: `src/app/llms.txt/route.ts` sets
   `dynamic = "force-static"`.
6. **Sign-up**: `SignInForm` takes `next` (`sign-in-form.tsx:67`), but
   `SignUpDialog` doesn't pass it through yet.
7. **From plan 018**: `kind: "tool"`, `content.tool`, `TOOL_ROUTES`,
   `tool_view` / `tool_use` / `tool_share`, the "Free tools" footer column and
   the WebApplication JSON-LD.

## Commands

```bash
set -o pipefail
npm run typecheck
npm run lint
npm test
npm run build
npm run start   # after build: check the prerendered downloads with curl
```

## Scope

- **In**:
  - the two workbooks and their route
  - three importer header words
  - the tool page and the hub, in English and Spanish
  - the `SignUpDialog` `next` prop
  - tests
- **Out**:
  - importing Last contact as real contact history
  - a CSV version (CSV can't hold sheets, formulas or dropdowns)
  - a Numbers-specific file
  - viewings or tasks sheets (the importer only reads clients)

## Git workflow

Work on `main`, and commit without pushing until the founder says so. Stage
only the files this plan names. Suggested commits:
1. `feat(tools): client tracker workbooks built from the import headers`
2. `feat(tools): client tracker page and the tools hub`

## Steps

### Step 1: Dependency

Install `@onparallel/write-excel-file-data-validation@1.0.0` as a regular
dependency (the route runs during `next build`). Read its README before using
it, and confirm its peer range still includes the installed `write-excel-file`.

### Step 2: The builder, `src/lib/tools/tracker.ts`

`export async function buildTracker(locale: AppLocale): Promise<Buffer>`.

**For each side (buyer, then seller)**:
- Headers: `templateTable(side, ctx).headers`, then the three tracker headers
  from `tools.tracker.columns.{lastContact,nextFollowUp,daysSince}`:
  - EN: "Last contact", "Next follow-up", "Days since contact"
  - ES: "Último contacto", "Próximo seguimiento", "Días sin contacto"
- Rows 2–501:
  - the two date columns are formatted `yyyy-mm-dd`, like the export;
  - Days since contact holds
    `=IF(<last contact cell>="","",TODAY()-<last contact cell>)`;
  - every other cell is empty.
- The header row is bold and frozen; freeze the first column too.
- Column widths come from the header lengths, as in `xlsx.ts`.
- Conditional formatting, with formula rules over the whole row range:
  - amber when Next follow-up is set and is today or earlier;
  - grey when Days since contact is at least `STALE_AFTER_DAYS`.
- Data validation as listed under Decisions.

**The How-to sheet** (a sheet name from `tools.tracker.howToSheet`):
- a title and six short steps: one row per client; stage from the list;
  update Last contact whenever you speak; set Next follow-up; what the colours
  mean; adding columns is fine (they come into LeadWing as notes);
- a small example table;
- the line "Move it into LeadWing: leadwing.app → Clients → Import", with the
  page's URL.

**Formula cells and the importer**: formula cells get no cached value until a
spreadsheet app saves the file. After an agent saves in Excel or Sheets, an
empty row's formula caches `""`, and the importer drops the row as empty.
Step 4's test covers the file as built; the founder's manual import check
covers a file saved by Excel.

### Step 3: Three importer words

In `src/lib/import/synonyms.ts`, add explicit dictionary entries:
- `add_to_notes`: "Last contact", "Último contacto", "Next follow-up",
  "Próximo seguimiento"
- `ignore`: "Days since contact", "Días sin contacto"

In `synonyms.test.ts`, check that all six headers match `exact: true` to those
concepts.

### Step 4: Tests, `src/lib/tools/tracker.test.ts` (node environment)

Build both workbooks, then read them back with `read-excel-file/node`, as the
import tests do. Check:
- Sheet order and names: buyers, sellers, how-to, in the file's language.
- The Buyers and Sellers sheets hold a header row and no data rows.
- `findHeaderRow` finds row 1.
- `autoMap(headers, [], side)`:
  - every template header maps to its own target, never `add_to_notes`;
  - the two date columns map to `add_to_notes`;
  - Days since contact maps to `ignore`.
- The raw XML (unzip the buffer with `fflate`, which `write-excel-file`
  already depends on) contains `<conditionalFormatting` and, unless the
  dropdowns were dropped, `<dataValidation`.

### Step 5: The route, `src/app/downloads/[file]/route.ts`

- Use `generateStaticParams` with
  `[{ file: "leadwing-client-tracker.xlsx" }, { file: "plantilla-clientes-inmobiliaria-leadwing.xlsx" }]`
  and set `dynamicParams = false`.
- `GET` maps the file name to a locale, calls `buildTracker`, and returns it
  with these headers:
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="<file>"`
- `/downloads` isn't a protected prefix; leave `PROTECTED_PREFIXES` alone, and
  robots.txt needs no change.
- Verify after `npm run build && npm run start`: `curl -sI` on both files
  returns 200 with the xlsx type and `attachment`, and a third name returns
  404.
- If Next 16 can't prerender a binary route handler, don't improvise.
  Document the problem, then fall back to `scripts/generate-client-tracker.ts`
  writing `public/downloads/*.xlsx`, with the same test reading the committed
  files.

### Step 6: Routes

- In `MARKETING_ROUTES`:
  - `toolSpreadsheet: { en: "/tools/client-spreadsheet", es: "/es/herramientas/plantilla-excel-inmobiliaria" }`
  - `tools: { en: "/tools", es: "/es/herramientas" }` (the hub)
- Put `toolSpreadsheet` in `CONTENT_ROUTES`, `LINKED_ROUTES` and
  `TOOL_ROUTES`. Put `tools` in `CONTENT_ROUTES` and `LINKED_ROUTES`, but not
  in `TOOL_ROUTES`.
- Add page files for all four paths, one-liners like plan 018's.
- Add the four paths to the `routes.test.ts` cases.

### Step 7: Widen the tool schema

In `src/lib/marketing.ts`, `tool.schema` becomes a union:
```ts
| { "@type": "WebApplication"; applicationCategory: string }
| { "@type": "SpreadsheetDigitalDocument"; encodingFormat: string; contentPath: string }
```
`pageJsonLd` emits the spreadsheet as:
```ts
{
  "@type": "SpreadsheetDigitalDocument",
  "@id": `${pageUrl}#tool`,
  name: content.heading,
  url: pageUrl,
  contentUrl: absoluteUrl(contentPath),
  encodingFormat,
  isAccessibleForFree: true,
  inLanguage: locale,
  publisher: { "@id": ORGANIZATION_ID },
}
```
`contentPath` is the file for the page's language.

### Step 8: The component, `src/components/tools/tracker-download.tsx`

- **A preview**: a real HTML table with a caption, showing the Buyers columns
  (scrolling sideways inside its own box on a phone, never the page) and two
  illustrative rows, one amber and one grey, matching the file.
- **"Download for Excel"**: links to the file in the page's language, with a
  small link to the other language's file.
- **"Make a copy in Google Sheets"**: shown only when
  `TRACKER_SHEETS_COPY_URL[locale]` in `src/lib/tools.ts` isn't null.
- **"Outgrown it? Import it into LeadWing"**: a `SignUpDialog` with
  `next="/clients/import"`.
- **Events**: `tool_use` on each download or copy click.

### Step 9: `SignUpDialog` passes `next` through

Add an optional `next?: string` prop to `SignUpDialog`, passed to
`SignInForm`. Existing callers don't change.

### Step 10: The copy, `src/content/pages/tool-spreadsheet.{en,es}.tsx`

**Head and header**:
- `kind: "tool"`, with
  `tool: { Component: TrackerDownload, schema: { "@type": "SpreadsheetDigitalDocument", encodingFormat: <xlsx type>, contentPath: <file for this language> } }`.
- Title, at most 60 characters:
  - ES: "Plantilla Excel gratis para agentes inmobiliarios"
  - EN: "Free client tracker spreadsheet for estate agents"
- Description: 140–160 characters.
- Heading:
  - ES: "Plantilla Excel gratis para llevar tus clientes inmobiliarios"
  - EN: "A free spreadsheet to track your buyers and sellers"

**Body** (about 600–900 words):
- What's inside, column by column.
- How the colours work.
- Using it in Excel, Google Sheets and Numbers.
- "When a spreadsheet stops being enough", honestly: no reminders on your
  phone, no drafted follow-ups, one file per device.
- Moving it into LeadWing in three steps, matching the `/start` page's steps.
- Keywords, used naturally: "plantilla excel inmobiliaria", "excel para
  inmobiliarias gratis", "base de datos de clientes inmobiliaria".

**FAQ**:
- Is it free?
- Does it work in Google Sheets?
- Can I add my own columns?
- How do I import it into LeadWing?
- What do the colours mean?

**The rest**: `related` is `toolCommission`, `guideFollowUp` and `pricing`.
Add `PUBLISHED` dates, sitemap entries (priority 0.7, monthly) and the
`marketing.json` labels and blurbs.

### Step 11: The hub, `src/content/pages/tools.{en,es}.tsx`

- `kind: "page"`.
- Heading: "Free tools for estate agents" / "Herramientas gratis para agentes
  inmobiliarios".
- Body: a card per `TOOL_ROUTES` entry, using the same label and blurb as the
  footer, and one line linking the follow-up templates guide.
- A short FAQ (2–3 entries).
- Breadcrumb: in `pageJsonLd`, tool routes get
  `{ position: 2, name: t("breadcrumb.tools"), item: <hub URL> }` before the
  page. Add `marketing.breadcrumb.tools` in both languages.
- Footer: the "Free tools" column gets the hub as its `lead` link.
- llms.txt: the `## Free tools` section gains the tracker and the hub.

### Step 12: Verify

- **Automated**: run the Commands block and get it green.
- **In the browser** (EN and ES, 320 / 375 / 1280 px, light and dark):
  - both tool pages and the hub render;
  - the preview table scrolls inside its box;
  - the downloads work;
  - the sign-up dialog opens (use the chrome-devtools MCP);
  - no console errors.
- **Excel**: open each file with `read-excel-file/node` in a scratch script
  and list the sheets and headers.
- **Founder's manual check**, a tick list to include in the report:
  - opens in Excel for Mac with no repair prompt;
  - the dropdowns work;
  - typing a past date in Next follow-up turns the row amber;
  - a Last contact 8 days ago turns the row grey;
  - Days since contact computes;
  - the same in Google Sheets (File → Import) and in Numbers;
  - fill one row on each sheet, save, and import both sheets into LeadWing:
    every column is matched in the preview.
- **Events**: one manual download shows a `tool_use` row with the page's
  path. Delete that test row afterwards and report it.

### Step 13: Google Sheets copies (founder's yes first)

With the founder's explicit approval, because the files become public:
1. Upload both xlsx files to his Google Drive with conversion to Sheets, using
   the Google Drive connector or by hand.
2. Check that the formatting and dropdowns survived.
3. Share each file as "Anyone with the link: Viewer".
4. Put `https://docs.google.com/spreadsheets/d/<id>/copy` into
   `TRACKER_SHEETS_COPY_URL` in `src/lib/tools.ts`.

Without approval, leave the constant `null`; the button stays hidden.

## After it ships (founder)

- Request indexing for the two tool pages and the hub, and resubmit the
  sitemap.
- The tracker makes a good Facebook post: "a free spreadsheet for your
  clients".
- Check at 4 and 8 weeks: impressions for "plantilla excel inmobiliaria";
  `tool_use` counts on the page; imports by agents whose
  `signup_source.landing` is the tracker page.

## Done criteria

- Both workbooks download, open cleanly, and import into LeadWing with every
  column matched.
- The tool pages and the hub are live in both languages, in the sitemap,
  llms.txt and the footer, and the breadcrumb has the Tools level.
- Tests, typecheck, lint and build are green; the founder's tick list is in
  the report, and the README row is updated.

## STOP conditions

- A template header doesn't auto-map to its own target. The import contract
  has broken; report it rather than patching synonyms blindly.
- The validation plugin produces a file that Excel repairs or that loses its
  formatting. Remove the dropdowns, keep everything else, and note it in the
  README row; that is a documented fallback, not a failure.
- Plan 018 Phase A isn't merged.
- The Google Sheets step would be taken without the founder's approval.

## Maintenance notes

- Headers follow `transfer.json` automatically, and the highlight threshold
  follows `STALE_AFTER_DAYS` at build time.
- If the importer ever supports Last contact as real contact history, drop
  the `add_to_notes` entries from Step 3 and say so on the page.
- Re-upload the Google Sheets copies whenever the columns change.

## Sources (checked 2026-09-29)

- Search research: autocomplete and google.es results via SearchAPI, 29 Sep
  2026; summary in memory as `project_free_tools_seo.md`.
- `write-excel-file` README, sections "Conditional Formatting" and
  third-party features:
  `node_modules/write-excel-file/README.md`
- `@onparallel/write-excel-file-data-validation` 1.0.0 (npm), peer
  `write-excel-file ^4.1.1`.
- Next.js 16 route handlers with `generateStaticParams`:
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`

## As built (2026-09-29)

Commits on `main`: `e5d2a39` (the workbooks, `/downloads/[file]` and the
importer words) and `1ea8de4` (the page, the hub and the shared pieces).
Before `main` moved, each exact tree passed `npm ci`, typecheck, lint, tests
and build (Node 24, CI's placeholder env) in a throwaway detached worktree:
the shared working tree also held another session's film work.

**Live on 29 Sep 2026.** Pushed as `ce96ec6..1ea8de4` (a fast-forward).
GitHub Actions CI run 36627060907 is green. The Vercel production deployment
`dpl_AmRsSjjoPAo8kZ7tvmdogmhjty3n` is READY on www.leadwing.app. On
production:
- `/tools`, `/es/herramientas` and both tracker pages answer 200,
  `index, follow`, with the canonical and hreflang en/es/x-default. The
  JSON-LD is WebPage → SpreadsheetDigitalDocument (its `contentUrl` is the
  file in the page's language), BreadcrumbList Home › Tools › page, FAQPage.
- Both downloads answer 200 from the prerender cache
  (`x-vercel-cache: PRERENDER`) with the xlsx type and `attachment`; any
  other name is a 404. Read back with `read-excel-file`: Buyers | Sellers |
  How to use (Compradores | Vendedores | Cómo usarla), 21 headers per client
  sheet, nothing under them.
- `sitemap.xml` and `llms.txt` list the tracker and the hub.

**Live database.** No migration. Local testing wrote 21 rows to the live
`site_events` (ids 238–258: tool views, one `signup_open`, one `tool_use`
from a download click, which confirmed the event carries the page's path).
They were deleted by id the same day; the real Facebook rows around them
(236, 237, 259) were left alone.

**Deviations from the steps:**
- **No dropdowns (the documented fallback).** The plugin inserts
  `<dataValidations>` after the *first* `<conditionalFormatting>` it finds,
  and write-excel-file writes one `<conditionalFormatting>` per rule, so the
  two colour rules came out as CF, DV, CF: an order CT_Worksheet forbids,
  which Excel answers with a repair prompt. The plugin isn't installed. The
  How-to sheet lists the words LeadWing reads instead ("Words LeadWing
  reads"), and `tracker.test.ts` checks every sheet's parts against the
  ECMA-376 order and every listed word against the importer's normalizers.
  To bring dropdowns back later: merge the two rules into one
  `<conditionalFormatting>` before the plugin runs (a small custom feature),
  or write the list validations ourselves; either way the order test must
  stay green.
- **Formulas.** write-excel-file writes a formula as given (`<f>=IF…</f>`),
  and a file stores it without the "=" (openpyxl and xlsxwriter strip it
  too), so no formula here has one. Formula cells carry no cached result, so
  a small feature sets `<calcPr fullCalcOnLoad="1"/>`.
- The client-safe constants (file names, `XLSX_TYPE`,
  `TRACKER_SHEETS_COPY_URL`) live in `src/lib/tools/tracker-files.ts`, not
  `src/lib/tools.ts`: `src/lib/tools/` is already a folder, and the page's
  buttons must not import the Excel writer.
- `buildTracker` builds its translators with `createTranslator` over
  `messagesFor(locale)`, so it needs no request and the test no mock.
- Colours: amber is `AND($T2<>"",$T2<=TODAY())`, grey is
  `AND(ISNUMBER($U2),$U2>=STALE_AFTER_DAYS)`; amber comes first, so it wins
  where both match. Fills only: `#FFF7C9` (the app's amber pill) and
  `#EBEBEB`.
- The How-to sheet's example rows are dated from `TODAY()` and carry the same
  rules, so their colours stay true whenever the file opens. The import line
  uses the app's own words ("open Buyers, choose Import from a spreadsheet"),
  not "Clients → Import", which isn't what the app says. The last line
  links the page with `HYPERLINK`.
- Commit 1 has no link from the How-to sheet to the page: the route only
  arrives with the pages in commit 2.
- The preview table is rendered on the server from the import template's own
  sample clients (Anna, James), dated from the page's `PUBLISHED_ON`; only
  the buttons are a client component (`tracker-actions.tsx`). Its visible
  label sits above the scrolling box, and the table's `<caption>` stays for
  screen readers.
- The hub's cards (`tool-cards.tsx`) sit inside the article, so they use
  spans and two `!` overrides against the article's link styles. The footer
  lists the hub first through `TOOL_LINKS = ["tools", ...TOOL_ROUTES]`
  instead of the `lead` prop, which is meant for entries with no catalog
  label.
- `ToolViewBeacon` now counts once per path, not once per page load: the hub
  and the related cards move between tools without a reload.
- Next 16.2.6's SWC drops the leading space of a JSX text that spans lines
  and holds an entity such as `&apos;` (`<strong>Sign in</strong> with …
  There&apos;s …` rendered "Sign inwith"). Two spots take an explicit
  `{" "}`; a scan of every `.tsx` in `src` found no other text of that shape.
- Numbers wasn't checked (driving it would need a macOS automation prompt),
  so the page says its rows "may stay white" there. LibreOffice opened both
  files cleanly: formulas computed and the example rows were amber and grey.
- The "Outgrown it?" button wraps: at 320 px its label pushed the page 20 px
  sideways.

**Checks:** nothing overflows at 320 or 375 px on the four pages (or the
calculator's, whose footer changed); light and dark on phone and desktop in
both languages; no console errors; the sign-up dialog opens from "Outgrown
it?" and its form's `next` is `/clients/import`; the markdown twin serves
the page.

**Not done:**
- Step 13, the Google Sheets copies: the founder said "not now", so
  `TRACKER_SHEETS_COPY_URL` stays `null` and the button stays hidden.
- The founder's manual tick list (Excel for Mac, Google Sheets, Numbers,
  and an import of a saved file).

**Notes for the founder:**
- The import wizard opens a workbook's first sheet, so sellers have to pick
  the Sellers sheet themselves (the page and the How-to sheet say so). A
  small follow-up could preselect the sheet named after the side.
- The H1s lead with "free" ("A free spreadsheet to track your buyers and
  sellers", "Plantilla Excel gratis para llevar tus clientes
  inmobiliarios"), as this plan's Step 10 specified for search.
