# Plan 011: Data export — client lists as Excel or CSV, the whole account as a ZIP

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> "STOP conditions" item occurs, stop and report; do not improvise. When done,
> update this plan's row in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 9bad570..HEAD -- src/components/clients/clients-view.tsx src/components/settings/settings-view.tsx src/content/legal src/lib/legal.ts src/i18n/messages.ts src/lib/supabase/types.ts package.json`
> If any of these changed since the plan was written, compare the "Current
> state" notes against the live code first. A mismatch you can't reconcile is
> a STOP condition.
>
> **Shared working tree**: other Claude sessions may be editing this checkout at
> the same time. Stage only the files this plan names (`git add <path>`), never
> `git add -A`, and don't touch changes you didn't make.

## Status

- **Priority**: P1
- **Effort**: M (about 1–1.5 days)
- **Risk**: LOW. Read-only feature, no schema change.
- **Depends on**: nothing. **Plan 012 (import) depends on this plan**: it reuses `src/lib/transfer/` for its template and its round-trip tests.
- **Category**: feature
- **Planned at**: commit `9bad570`, 2026-09-16

## Why this matters

- **The legal pages promise it.**
  - Terms §7 and Privacy §9 promise "a full copy of your data" on request, and
    Terms §13 tells agents to "export anything you need first".
  - No export exists, so today the founder would have to build one by hand.
  - As processor (Terms, art. 28 annex), LeadWing must be able to hand the
    data back.
- **It is a switching argument.**
  - Fincta lets anyone download a CSV of all clients at any time, for free.
  - Witei, ReSales and Inmoweb limit exports to admins, and Witei can take up
    to 24 hours.
  - An instant export on every plan backs LeadWing's "no lock-in" edge.
- **Agents work in Excel**, so the default format is a real `.xlsx` workbook.
  A CSV double-clicked in Spanish Excel can land in one column or show broken
  accents; a workbook opens cleanly in any language.
- **Plan 012 needs it.** The importer must read this plan's files back
  unchanged.

## Decisions (founder, 2026-09-16)

| Topic | Decision |
|---|---|
| Who can export | Every plan, always: Free, Pro, and after a downgrade. Never gate it. |
| List export | Exports the rows on screen: the selection if there is one, otherwise the filtered list. Excel (`.xlsx`) is the default; CSV is the other choice. |
| Full export | A ZIP of CSVs (one per table), plus one workbook with a sheet per table, plus a README. Uploaded files are **listed** in `files.csv` but not included; they stay a by-request job. |

## Current state (verified 2026-09-16 at `9bad570`)

1. **Client list**, `src/components/clients/clients-view.tsx`:
   - `visible` (`:119`) drops inactive rows unless they are shown.
   - `filtered` (`:133`) applies search, stage, priority and type.
   - `selectedIds` (`:151`) holds the ticked rows that are still in view.
   - The toolbar's right cluster is `ViewToggle` plus the New button (`:309-319`).
   - `Summary` (`:424`) is the strip under the table: while rows are ticked it
     shows Move to / Flag / Hide / Clear.
   - `EmptyState` is at `:538`.
   - Rows are `ClientRow` (`src/lib/data/clients.ts`), which carry headline
     figures only. **The export must re-read full records on the server.**
2. **Settings**, `src/components/settings/settings-view.tsx`: panels use
   `Panel` from `@/components/shell/panel` (`title`, `icon`, `action`,
   `footer`). The profile panel starts at `:87`, and `<PreferencesPanel />`
   renders at `:170`.
3. **Tables to export.** All are defined in the hand-written
   `src/lib/supabase/types.ts`:
   - `clients`, `buyer_preferences`, `reservations`, `properties`
   - `viewings`, `appointments`, `tasks`, `task_notes`
   - `email_templates` (columns `name`, `subject`, `body`), `deal_analyses`
   - file tables: `documents`, `viewing_attachments`, `property_attachments`
   - `profiles`
4. **Data access.**
   - `createClient()` in `src/lib/supabase/server.ts` is cookie-scoped, so
     every read runs under RLS (`agent_id = auth.uid()`).
   - `getSessionUser()` in `src/lib/data/session.ts` uses `getClaims()`, which
     does not notice a session ended on another device. **The export handlers
     must call `supabase.auth.getUser()`** instead.
   - Supabase's API returns **at most 1,000 rows per request** by default, so
     every read must page with `.range()`.
5. **Sign-in guard.**
   - The proxy sends anonymous requests for `/clients/*` and `/settings/*` to
     `/login` (`src/lib/supabase/middleware.ts:48-53`). A `fetch` sees that as
     a redirect.
   - The handlers must still check the session themselves: see
     `node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md`,
     "Do not rely on proxy alone".
6. **Route handlers** (`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`):
   - They are not cached by default (`:49-51`).
   - A `route.ts` can't sit in the same segment as a `page.tsx` (`:39`).
   - `/clients/export` and `/settings/export` are both free segments, and a
     static segment beats `/clients/[id]`.
   - Layouts don't wrap route handlers.
7. **i18n.**
   - Namespaces are registered in `src/i18n/messages.ts`: import both the en
     and es JSON files, then add them to the `en` and `es` objects. English
     types every key.
   - Enum labels come from `src/i18n/labels.ts`: `stageLabel`,
     `propertyTypeLabel`, `dealTypeLabel`, `sellerRoleLabel`, `languageLabel`,
     `taskStatusLabel`, `taskPriorityLabel`, `appointmentTypeLabel`.
   - `getTranslations()` and `getLocale()` resolve the cookie language inside
     route handlers too (`src/i18n/request.ts`).
   - Settings is "Ajustes" in Spanish (`messages/es/nav.json:75`).
8. **Dates.**
   - The agent's zone comes from `resolveTimeZone(profile.time_zone)` in
     `src/lib/time-zones.ts`.
   - `dateKeyInTimeZone` and `formatInTimeZone` live in `src/lib/home.ts` and
     `src/lib/attention.ts`.
9. **Legal text to change** (all in `src/content/legal/`):
   - `terms.en.tsx:114-116` (§7) and `:165-167` (§13)
   - `terms.es.tsx:117-119` and `:170-171`
   - `privacy.en.tsx:320-328` (§9)
   - `privacy.es.tsx:335-344`
   - `LEGAL_UPDATED` (`src/lib/legal.ts:26-30`) feeds the page date and the
     sitemap.
10. **Browser download pattern**: `downloadDealPdf` in
    `src/components/calculator/deal-pdf-document.tsx:293` creates a Blob, an
    object URL and a temporary `<a download>`, then clicks it.
11. **Tooling**:
    - No CSV, Excel or ZIP package is installed yet.
    - Vitest runs in `jsdom` (`vitest.config.ts`). Tests that use Node-only
      entries need `// @vitest-environment node` on their first line.
    - CI runs typecheck → lint → test → build (`.github/workflows/ci.yml`).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 |
| Lint | `npm run lint` | exit 0 (existing warnings OK) |
| Tests | `npm test` | exit 0, all pass |
| Build | `npm run build` | exit 0 |

## Suggested executor toolkit

- Read before Step 6: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  and `02-guides/backend-for-frontend.md` (Public Endpoints, authentication).
- `write-excel-file` 4.x API. The node README is at
  `node_modules/write-excel-file/README.md` after install.
  - Write a buffer with `await writeExcelFile(sheetData, options).toBuffer()`,
    importing from `write-excel-file/node`.
  - For several sheets, pass one array of `{ data, sheet, columns, stickyRowsCount }`.
  - Cells are `{ value, type: String | Number | Date | Boolean, format, fontWeight: "bold" }`.
    Column widths go in `columns: [{ width }]`.
  - 4.x changed this API. Ignore older examples that use `schema` or
    `buffer: true`.
- Papa Parse `unparse(data, { delimiter, newline, escapeFormulae })`.
- fflate `zipSync({ "name.csv": Uint8Array, ... }, { level: 6 })`.
- **Seeing signed-in UI without signing in**:
  1. Render the component from a temporary page at
     `src/app/preview-tmp/<your-own-folder>/page.tsx` with mock props. Never
     use a `_`-prefixed folder: App Router treats it as private.
  2. Delete **only your own folder** afterwards. Other sessions use
     `preview-tmp` too.
  3. Radix menus can freeze in the in-app browser pane; the chrome-devtools
     MCP works.

## Scope

**In scope** (the only files to create or modify):
- `package.json`, `package-lock.json`: `papaparse`, `write-excel-file`,
  `fflate`, and as dev dependencies `@types/papaparse` and `read-excel-file`
- `src/lib/transfer/columns.ts`, `format.ts`, `csv.ts`, `xlsx.ts`, plus a
  `*.test.ts` for each
- `src/lib/export/load.ts`, `archive.ts`, `archive.test.ts`
- `src/app/(app)/clients/export/route.ts`, `route.test.ts`
- `src/app/(app)/settings/export/route.ts`
- `src/components/clients/export-menu.tsx`,
  `src/components/clients/clients-view.tsx`
- `src/components/settings/data-panel.tsx`,
  `src/components/settings/settings-view.tsx`
- `src/lib/download.ts` (the shared fetch-then-save helper)
- `messages/{en,es}/transfer.json` (new), `messages/{en,es}/clients.json`,
  `messages/{en,es}/settings.json`, `src/i18n/messages.ts`
- `src/content/legal/terms.{en,es}.tsx`, `src/content/legal/privacy.{en,es}.tsx`,
  `src/lib/legal.ts`
- `plans/README.md`

**Out of scope** (plan 012 or later):
- anything about import, including `clientRecordId` and the "Import clients"
  link in the new Settings panel
- putting uploaded files inside the ZIP
- paging or virtualising the client list UI
- any database migration
- landing, FAQ, pricing and `llms.txt` claims (plan 012's last step does them
  once both plans have shipped)

## Git workflow

- Commit on the current branch; the founder ships from `main`. Don't push
  unless the operator asks.
- Commit style: `feat(export): …`, `docs(legal): …`, one commit per step
  group.
- End commit messages with the attribution line the session gives you.

## Steps

### Step 1: Add the dependencies

```bash
npm install papaparse write-excel-file fflate
npm install -D @types/papaparse read-excel-file
```

`read-excel-file` is only needed by this plan's workbook test. Plan 012
promotes it to a normal dependency.

**Verify**:
- `npm ls papaparse write-excel-file fflate read-excel-file` shows
  papaparse 5.7.x, write-excel-file 4.1.x, fflate 0.8.x and
  read-excel-file 9.3.x.
- `npm run typecheck` passes.

### Step 2: One column model: `src/lib/transfer/columns.ts`

This file is the contract between export (this plan) and import (plan 012).

- Export a `TransferColumnKey` union and two ordered lists: `BUYER_COLUMNS`
  and `SELLER_COLUMNS`.
- Give each key a `kind`:
  - `text`
  - `number` (money)
  - `integer`
  - `date` (a calendar day)
  - `instant` (a timestamp)
  - `boolean`
  - `enum:stage`, `enum:deal_type`, `enum:seller_role`
  - `language`
  - `property_types` (a list), `property_type`
- Headers live in the new `transfer` namespace under `columns.<key>`.
  They reuse the labels the client form and detail page already show, so
  agents recognise them:

| key | kind | EN header | ES header | Buyers | Sellers |
|---|---|---|---|---|---|
| `first_name` | text | First name | Nombre | ✓ | ✓ |
| `last_name` | text | Last name | Apellidos | ✓ | ✓ |
| `email` | text | Email | Email | ✓ | ✓ |
| `phone` | text | Phone | Teléfono | ✓ | ✓ |
| `language` | language | Language | Idioma | ✓ | ✓ |
| `nationality` | text | Nationality | Nacionalidad | ✓ | ✓ |
| `agency` | text | Agency | Agencia | ✓ | ✓ |
| `stage` | enum:stage | Stage | Etapa | ✓ | ✓ |
| `deal_type` | enum:deal_type | Deal type | Tipo de operación | ✓ | |
| `seller_role` | enum:seller_role | Role | Rol | | ✓ |
| `priority` | boolean | Priority | Prioridad | ✓ | ✓ |
| `is_active` | boolean | Active | Activo | ✓ | ✓ |
| `budget_min` | number | Budget min (€) | Presupuesto mín. (€) | ✓ | |
| `budget_max` | number | Budget max (€) | Presupuesto máx. (€) | ✓ | |
| `property_types` | property_types | Property types | Tipos de propiedad | ✓ | |
| `bedrooms` | integer | Bedrooms | Dormitorios | ✓ | |
| `bathrooms` | integer | Bathrooms | Baños | ✓ | |
| `area_notes` | text | Area notes | Notas de zona | ✓ | |
| `property_type` | property_type | Property type | Tipo de propiedad | | ✓ |
| `price` | number | Price (€) | Precio (€) | | ✓ |
| `property_bedrooms` | integer | Bedrooms | Dormitorios | | ✓ |
| `address` | text | Address | Dirección | | ✓ |
| `city` | text | City / area | Ciudad / zona | | ✓ |
| `property_notes` | text | Property notes | Notas de la propiedad | | ✓ |
| `notes` | text | Notes | Notas | ✓ | ✓ |
| `down_payment` | number | Down payment (€) | Señal (€) | ✓ | |
| `down_payment_date` | date | Down payment date | Fecha de la señal | ✓ | |
| `ppc` | number | PPC (€) | Contrato de arras (€) | ✓ | |
| `ppc_date` | date | PPC date | Fecha de las arras (PPC) | ✓ | |
| `notary_date` | date | Notary date | Fecha de notaría | ✓ | |
| `notary_notes` | text | Notary notes | Notas de notaría | ✓ | |
| `commission` | number | Commission (€) | Comisión (€) | ✓ | |
| `closed_at` | date | Closed date | Fecha de cierre | ✓ | |
| `viewing_count` | integer | Viewings | Visitas | ✓ | |
| `created_at` | instant | Created | Creado | ✓ | ✓ |
| `updated_at` | instant | Updated | Actualizado | ✓ | ✓ |
| `id` | text | LeadWing ID | ID de LeadWing | ✓ | ✓ |

The column order in each file is the table order, filtered by side.
"Bedrooms" appears on both sides on purpose: plan 012 decides the meaning
from the file's side.

Sellers get **one row per property**:
- The seller's columns repeat on every row.
- A seller with no property gets one row with the property cells empty.
- Order the rows by seller, then by property `created_at`.

The other tables in the ZIP use `transfer.tables.<table>.<column>` headers.
The columns are listed in Step 5. For the Spanish text, use the word the
Spanish UI already uses for that field (namespaces `tasks`, `calendar`,
`templates`, `calculator`, `clientDetail`); never invent a new term.

**Verify**: `columns.test.ts` checks that:
- every key in both lists has an en and an es header
- no two columns on the same side share a header in either language
- the buyer and seller lists match the table above

### Step 3: Cell values: `src/lib/transfer/format.ts`

Write one function, `cellFor(kind, raw, ctx)`, where
`ctx = { locale, timeZone, t }` and `t` is the `crm` translator. It returns a
typed value that both writers use:

| kind | Value written |
|---|---|
| `text` | the trimmed string, or empty |
| `number`, `integer` | the number, or empty |
| `date` | the `YYYY-MM-DD` string as stored |
| `instant` | `YYYY-MM-DD HH:mm` in the agent's time zone |
| `boolean` | `transfer.values.yes` / `transfer.values.no` ("Yes"/"No", "Sí"/"No") |
| `enum:*`, `property_type` | the label via `src/i18n/labels.ts` |
| `language` | `languageLabel` (English → "Inglés" in Spanish) |
| `property_types` | the labels joined with ", " |

The README (Step 5) names the time zone once, so no instant cell needs a zone
suffix.

**Verify**: `format.test.ts` covers every kind in both languages, including
`null`.

### Step 4: The two writers

**`src/lib/transfer/xlsx.ts`**: `buildWorkbook(sheets)` returns a `Buffer`.
- Import from `write-excel-file/node`.
- Each sheet is `{ name, headers, rows: Cell[][] }`, where `name` is the
  localised sheet name.
- Header row:
  - Bold (`fontWeight: "bold"`) and frozen with `stickyRowsCount: 1`.
  - Column widths: `Math.min(60, Math.max(header length, longest value) + 2)`.
- Cell types:
  - Money: `type: Number` with `format: "#,##0"`, or `"#,##0.00"` when the
    value has cents. Excel shows the thousands mark of the agent's own locale.
  - `integer`: `type: Number`.
  - `date`: `type: Date` with `format: "yyyy-mm-dd"`.
  - `instant`: `type: String`, so the agent's time zone survives.
  - Everything else: `type: String`. A phone like `+34 600…` stays text, and
    a note starting with `=` is never evaluated: xlsx cells are typed, so this
    format needs no formula escaping.
- Sheet names: 31 characters at most, with none of ``: \ / ? * [ ]``.

**`src/lib/transfer/csv.ts`**: `buildCsv({ headers, rows, locale })` returns a
string.
- Start the file with a UTF-8 BOM (`"﻿"`), so Excel shows accents.
- `delimiter`: `";"` when `locale === "es"` (Spanish Excel splits on
  semicolons), otherwise `","`. Use `newline: "\r\n"`.
- Numbers: no thousands separator. The decimal mark is `","` in es and `"."`
  in en. Spanish Excel reads `250000.5` as a thousands-grouped number.
- `escapeFormulae: /^[=@\t\r]|^[+-](?![\d\s().\/-]*$)/`:
  - A leading `'` goes on any cell that starts with `=`, `@`, a tab or a CR.
  - It also goes on any cell that starts with `+` or `-` unless the rest looks
    like a phone or a number.
  - Lead notes are pasted from portal emails, so treat them as untrusted.

**Verify**, in `csv.test.ts` and `xlsx.test.ts` (the latter needs
`// @vitest-environment node`):
- CSV
  - The file starts with the BOM, and the delimiter follows the locale.
  - The decimal mark follows the locale.
  - `=HYPERLINK("x")`, `@SUM(1)` and `-foo` are escaped.
  - `+34 600 123 456`, `-5` and `+44 (0)20 7946 0958` are not escaped.
  - Quoted newlines survive a `Papa.parse` round trip.
- Workbook
  - It opens with `read-excel-file/node` (the dev dependency from Step 1).
  - It has the expected sheet names and headers.
  - A phone comes back as a string, and a money cell as a number.

### Step 5: Loading and packing

**`src/lib/export/load.ts`** takes the cookie Supabase client, so RLS applies.

**Paging**: `fetchAll(build)` pages `.range(from, from + 999)` until a page
comes back with fewer than 1,000 rows. Always order by a unique key
(`.order("id")`) so pages don't overlap.

**`loadClientExport(supabase, side, ids)`**:
- Read the `clients` rows for `ids` in chunks of 100 with `.in("id", chunk)`,
  which keeps each URL well under proxy limits.
- Then read their details:
  - Buyers: `buyer_preferences`, `reservations`, and a viewing count from
    `viewings(count)`, as `getClientRows` already embeds it.
  - Sellers: `properties`.
- Return rows in the order of `ids`. The client sends them in on-screen order.

**`loadAccountExport(supabase, userId)`** reads everything with `fetchAll`.
Each output file and its columns:

| File | Columns |
|---|---|
| `buyers.csv`, `sellers.csv` | the Step 2 shape |
| `viewings.csv` | client name, client ID, title, description, scheduled at, had offer, offer (€), property price (€), created, ID |
| `appointments.csv` | type, title, client name, client ID, property (address or label), starts at, ends at, location, notes, reminder (minutes), created, ID |
| `tasks.csv` | title, description, status, priority, due on, completed at, client name, client ID, created, ID |
| `task-notes.csv` | task title, task ID, note, created, ID |
| `templates.csv` | name, subject, body, created, updated, ID (from `email_templates`) |
| `deal-analyses.csv` | title, analysis date, property type, and every numeric input column of `deal_analyses`, notes, created, ID |
| `files.csv` | see below |
| `account.csv` | one row, see below |

`files.csv` has one row per uploaded file across `documents`,
`viewing_attachments` and `property_attachments`, with these columns:
- client name and client ID
- attached to: `document`, `viewing` or `property`, localised
- the viewing or property ID
- file name, type and size in bytes
- uploaded date
- ID

`account.csv` is one row: name, email, language, time zone, plan
(Free / Pro), Pro until, founding number, member since. Take the plan from
`planState()` in `src/lib/access.ts`.

**`src/lib/export/archive.ts`**: `buildAccountZip(data, ctx)` returns a
`Uint8Array`. It uses fflate `zipSync` at level 6 and contains:
- the nine CSVs above
- `leadwing-export.xlsx`: the same tables as sheets
  - EN names: Buyers, Sellers, Viewings, Calendar, Tasks, Task notes,
    Templates, Deal analyses, Files, Account.
  - ES names: take them from the `nav` namespace where one exists, e.g.
    "Compradores", "Vendedores", "Visitas", "Calendario", "Tareas".
- `README.txt` in the UI language, which:
  - says what each file holds
  - names the time zone used for times
  - says the CSVs use UTF-8, and which delimiter and decimal mark
  - says uploaded files are listed in `files.csv` and can be requested by
    email (`SUPPORT_EMAIL` from `src/lib/site.ts`)

Keep the file names in English: they are stable for scripts and other CRMs.
Headers and the README follow the UI language.

**Verify**: `archive.test.ts` (node environment) unzips the result with
fflate `unzipSync` and checks:
- every file is present
- a buyer row round-trips through `Papa.parse`
- the README mentions the time zone

### Step 6: The list export route: `src/app/(app)/clients/export/route.ts`

Write `export async function POST(request: Request)`. It takes these steps in
order:

1. **Origin**: if the `Origin` header is present and its host differs from
   `new URL(request.url).host`, return 403.
2. **Body**: parse it with zod as
   `{ side: "buyer" | "seller", format: "xlsx" | "csv", ids: z.array(z.uuid()).min(1).max(5000) }`.
   Bad input returns 400 with `{ error }`.
3. **Session**: `const supabase = await createClient()`, then
   `supabase.auth.getUser()`. With no user, return 401.
4. **Context**:
   - `locale = await getLocale()`
   - the `crm` and `transfer` translators via `getTranslations`
   - `timeZone` from the profile (`select time_zone`)
5. **Build**: call `loadClientExport`, then `buildWorkbook` or `buildCsv`.
6. **Respond** with `new Response(body, { headers })`:
   - `Content-Type`:
     - `.xlsx`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
     - CSV: `text/csv; charset=utf-8`
   - `Content-Disposition: attachment; filename="<ascii>"; filename*=UTF-8''<encoded>`
   - `Cache-Control: no-store`
7. **File name**: `leadwing-<side>-<YYYY-MM-DD>.<ext>`.
   - Take the side word and the date from the UI language and the agent's
     zone.
   - Examples: `leadwing-buyers-2026-09-16.xlsx`,
     `leadwing-compradores-2026-09-16.csv`.
8. **Errors**: return `{ error }` JSON with a friendly, localised message.
   Log the raw Supabase error on the server; never send it to the client.

**Verify**: `route.test.ts` mocks `@/lib/supabase/server` and
`next-intl/server` with `vi.mock` and checks:
- a foreign Origin gets 403
- a malformed body gets 400
- no user gets 401
- a valid request gets 200 with the xlsx content type and an attachment
  filename

### Step 7: The full export route: `src/app/(app)/settings/export/route.ts`

Write `export async function GET(request: Request)` with the same session,
context and error rules as Step 6.
- Call `loadAccountExport`, then `buildAccountZip`.
- Respond with `Content-Type: application/zip` and
  `leadwing-export-<YYYY-MM-DD>.zip`. The name stays English in both
  languages.
- A solo agent's account is kilobytes to a few MB. If a real export ever
  passes about 50 MB, switch to fflate's streaming `Zip`. Don't do that
  pre-emptively.

**Verify**: run `npm run dev` and request both routes signed out:

```bash
curl -si -X POST http://localhost:3000/clients/export | head -1
curl -si http://localhost:3000/settings/export | head -1
```

Each should print a 307 to `/login`, from the proxy.

### Step 8: A shared download helper: `src/lib/download.ts`

Write `downloadFrom(url, init, fallbackName)` for client-side use:

1. Call `fetch(url, { ...init, redirect: "manual" })`.
2. If `res.type === "opaqueredirect"`, the session has ended: throw a
   `SessionEndedError`.
3. If `!res.ok`, read `{ error }` and throw it.
4. Otherwise take the file name from `Content-Disposition`, falling back to
   `fallbackName`.
5. Save the file: `res.blob()`, then object URL, then a temporary
   `<a download>`, click it, and revoke the URL. This mirrors
   `downloadDealPdf`.

Callers show `toast.error` with the message. For `SessionEndedError`, show
"Your session has ended. Sign in again." (new copy, see Step 9).

### Step 9: List UI: `src/components/clients/export-menu.tsx` and `clients-view.tsx`

**`ExportMenu`** (client component):
- Props: `{ side, ids, disabled }`.
- Trigger: an icon button (`Download` icon) with the accessible label
  `clients.export.label`.
- Menu items, both calling `downloadFrom("/clients/export", { method: "POST", … })`:
  - "Excel (.xlsx)", marked as the default
  - "CSV"
- A menu label shows the count: "Export 24 buyers".
- While the download runs, the trigger shows a spinner and is disabled.

**In `clients-view.tsx`**:
- Render `<ExportMenu side={side} ids={filtered.map((c) => c.id)} />` just
  before `ViewToggle` (`:309`). Disable it when `filtered` is empty.
- In `Summary`'s selected state, add an "Export" dropdown (the same two
  formats) beside Hide. It exports `selectedIds`, passed down as a new
  `onBulkExport(format)` prop. Don't clear the selection after exporting.
- On phones the toolbar wraps, so keep the menu trigger icon-only there.

**Copy**: add `clients.export.*` in en and es:
- label, count line (ICU plural per side), `excel`, `csv`
- `failed`, `sessionEnded`, `selected`

**Verify**:
- Render `ClientsView` on a preview-tmp page with 3 mock rows (see toolkit).
- Open the menu in both languages and check the count.
- Tick a row and check the bulk bar shows Export.
- Stub `fetch` to return a small blob and check a download starts, with no
  console errors.
- Delete your preview folder.

### Step 10: Settings UI: `src/components/settings/data-panel.tsx`

A new panel, rendered after `<PreferencesPanel />` (`settings-view.tsx:170`).

**`Panel`**: `title = settings.data.title` ("Your data" / "Tus datos"), icon
`DatabaseBackup` from lucide.

**Row, same `ROW` grid as the other panels**:
- Left: "Download all your data", plus the description: "Clients,
  searches, viewings, reservations, properties, calendar, tasks, templates
  and analyses, as an Excel workbook and CSV files."
- Right: a button that calls
  `downloadFrom("/settings/export", {}, "leadwing-export.zip")` with a spinner.

**Footnote**: "Uploaded files and account deletion: email {email}". Use
`SUPPORT_EMAIL`.

**Copy**: add `settings.data.*` in en and es.

**Verify**: check the panel on a preview-tmp page in both languages, at 375 px
and at desktop width, then delete the preview folder.

### Step 11: Legal copy

The new paragraphs, EN / ES:

- **Terms §7**, replacing "You can delete clients… within 30 days." in each
  language:
  - EN: "You can delete clients, documents and analyses at any time, and
    download a copy of your data whenever you like from Settings → Your data,
    as an Excel workbook and CSV files. For a copy of the files you
    uploaded, ask us and we will send it within 30 days."
  - ES: "Puedes borrar clientes, documentos y análisis en cualquier momento y
    descargar una copia de tus datos cuando quieras desde Ajustes → Tus
    datos, en un libro de Excel y en archivos CSV. Si quieres una copia de
    los archivos que subiste, pídenosla y te la enviaremos en un plazo de 30
    días."
- **Terms §13**, last sentence:
  - EN: "Export anything you need first (Settings → Your data)."
  - ES: "Exporta antes lo que necesites (Ajustes → Tus datos)."
- **Privacy §9**, a new second sentence after the list of rights:
  - EN: "You can download a copy of your data yourself at any time from
    Settings → Your data."
  - ES: "Puedes descargar tú mismo una copia de tus datos en cualquier
    momento desde Ajustes → Tus datos."
- **`LEGAL_UPDATED`**: set `terms` and `privacy` to the day this ships.

**Verify**:
- `/terms`, `/es/terminos`, `/privacy` and `/es/privacidad` render the new
  text.
- The updated date changed.
- The sitemap `lastmod` for those four pages moved.

## Test plan

- New unit tests: `columns`, `format`, `csv`, `xlsx`, `archive`, and the
  export route (Steps 2–6).
- `npm run typecheck && npm run lint && npm test && npm run build` all pass.
- **Manual, signed in** (the founder, or anyone with a session), on local dev
  or production:
  1. Export buyers as Excel and as CSV, in English and in Spanish.
  2. Open each in Excel (Spanish and English), Google Sheets and Numbers.
     Check that:
     - accents are intact
     - phones read `+34 …`
     - money reads as numbers, and dates as dates
     - the Spanish CSV splits into columns in Spanish Excel
  3. Download the full ZIP. Open the workbook and two CSVs, and read the
     README.

## Done criteria

- Both routes return files only to their signed-in owner.
- The list export respects filters and selection.
- The ZIP contains every file in Step 5.
- Excel and CSV open cleanly in both languages.
- The legal pages describe self-serve export.
- CI passes.
- `plans/README.md` row 011 is marked DONE.

## STOP conditions

- `write-excel-file/node` fails inside the Next route handler runtime.
  Report it; don't switch to generating the workbook in the browser without
  sign-off.
- Any test or manual check shows a row that belongs to another agent. That
  means RLS is broken; stop at once.
- Anything seems to need the service-role client. Exports must run under the
  agent's own session.
- The founder's real ZIP comes out larger than 20 MB. That is unexpected;
  report it before streaming.

## Maintenance notes

- **New table**: add it to `loadAccountExport`, the ZIP, the workbook and the
  README.
- **Column keys and headers are a contract with plan 012.**
  - When renaming a header, keep the old wording as an import synonym.
  - When adding a column, decide how the importer treats it: map it, or add
    it to notes.

## As built (2026-09-17)

Built on top of `d196f65`. Typecheck, lint, 467 tests and the build pass under
Node 24. The signed-in manual check in the Test plan is still open.

Where the code differs from the steps above (plan 012 should read this first):

- **`nationality` is its own kind**, not `text`. Commit `d196f65` made the app
  show nationalities in the UI language, so the export does too, through
  `nationalityLabel` ("British" → "Británica"). Import must map the label back
  to the stored English word, as it does for `language`.
- **Names in `src/lib/transfer/format.ts`**: `Cell` (`text`, `number`,
  `integer`, `date`, or `null`), `Table` (`headers` + `rows`),
  `TransferContext` (`locale`, `timeZone`, `t` = `crm`, `tt` = `transfer`),
  `cellFor` and `clientTable(side, records, ctx)`. Records are `ClientRecord`
  from `columns.ts`.
- **`loadClientExport(supabase, userId, side, ids)`** takes the user id and
  filters on `agent_id` as well as relying on RLS. `fetchAll` asks for
  `{ count: "exact" }` and reads until that many rows are in, so a server page
  size under 1,000 can't cut an export short.
- **`src/lib/export/http.ts`** (new, not in the scope list) holds what both
  routes share: `isSameOrigin` (also refuses `Sec-Fetch-Site: cross-site`),
  `exportSession`, `attachment`, `jsonError`.
- **`src/lib/transfer/testing.ts`** (new) gives tests a `TransferContext` on
  the real catalogs.
- **CSV formula guard**: the character class also allows `,`, so a negative
  Spanish decimal (`-5,5`) isn't escaped. A header-only CSV has no trailing
  line break.
- **Bulk export**: `Summary` renders `<ExportMenu variant="bulk">` with
  `selectedIds` instead of taking an `onBulkExport` prop.
- **Order**: the file follows the list's own order (priority, then latest
  update). A column sort chosen in the table lives inside `ClientsTable` and is
  not carried over.
- **`read-excel-file` 9**: the default export returns every sheet as
  `{ sheet, data }[]`; there is no `readSheetNames`.
- The ZIP holds ten CSVs (buyers and sellers are two files), the workbook and
  the README.
