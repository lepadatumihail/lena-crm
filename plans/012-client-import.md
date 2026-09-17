# Plan 012: Client import — CSV and Excel files into buyers or sellers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> "STOP conditions" item occurs, stop and report; do not improvise. When done,
> update this plan's row in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 9bad570..HEAD -- src/lib/actions/clients.ts src/lib/actions/notifications.ts src/lib/notifications.ts src/lib/validation/client.ts src/lib/crm.ts src/components/clients src/components/shell/app-bar.tsx src/lib/supabase/types.ts supabase/migrations`
> Plan 011 is expected to have landed first, so its files will show up. For
> anything else that changed, compare it against "Current state" first. A
> mismatch you can't reconcile is a STOP condition.
>
> **Shared working tree**: other Claude sessions may be editing this checkout at
> the same time. Stage only the files this plan names (`git add <path>`), never
> `git add -A`, and don't touch changes you didn't make.

## Amendments (review at `06222f5`, 2026-09-17)

These override the steps below wherever they disagree.

1. **Languages** (Step 4): `LANGUAGES` holds 20 entries since `d196f65`.
   The accepted-words table also covers Norwegian, Danish, Finnish,
   Portuguese, Ukrainian, Chinese, Turkish, Romanian, Czech and Hebrew.
2. **Nationality** (Steps 3–5): it is a vocabulary stored in English
   (`src/lib/nationalities.ts`) and exported in the UI language. Add
   `normalizeNationality(raw)`: `findNationality`, then the EN/ES labels in
   `crm.json` (`nationalities.<ISO>`), then the aliases; otherwise keep the
   text, trimmed to 50 characters.
3. **Agency spelling** (Step 5, Step 9): saves snap to the spelling the agent
   already uses (`pickSpelling`, `src/lib/agencies.ts`). `build.ts` runs every
   agency, the cell's and the wizard's default, through `pickSpelling` against
   `context.agencies` plus the agencies earlier rows of the same file used.
   `getImportContext` sends every distinct agency spelling, not the top 50.
4. **Undo** (Step 9):
   - `previewUndo` returns `{ total, edited, withWork }`. `withWork` counts
     clients that have a viewing, task, document, appointment, reservation or
     scheduled email.
   - `undoClientImport(importId, { keepWorked })`. With `keepWorked`, edited
     clients and clients with work stay; they keep their `import_id`.
   - Delete by `.in("id", chunk)` in chunks of 200, never one statement for
     the whole import (8 s timeout).
   - The migration also indexes `notifications (client_id)` and
     `scheduled_emails (client_id)`; both cascade from clients and neither has
     an index. The rehearsal times the delete as well as the insert.
5. **Digest** (Step 10): with 5 or fewer quiet buyers, delete this week's
   **unread** `followup-digest:${weekKey}` row, so the bell never shows the
   digest beside per-client rows.
6. **Reading Excel** (Step 2): `readImportFile(file, { readXlsx })` takes the
   workbook reader as an option, defaulting to a dynamic import of
   `read-excel-file/browser`. Tests pass `read-excel-file/node`. HTML cases go
   in `read-html.test.ts` (jsdom); workbook cases stay in `read.test.ts`
   (node). Real Excel files are the founder's manual check.
7. **Names**: the header folder is `foldHeader` (it builds on `fold` in
   `src/lib/utils.ts`). The template route reuses `src/lib/export/http.ts`.
8. **Stale anchors**: `deleteClient` is at `src/lib/actions/clients.ts:166`,
   the empty state at `clients-view.tsx:633`, the last-name field at
   `client-form.tsx:218`.

## Status

- **Priority**: P1
- **Effort**: L (about 3 days)
- **Risk**: MEDIUM. Bulk writes, plus a migration on the live database.
- **Depends on**: **plan 011 (data export) must be done first.** This plan
  reuses:
  - `src/lib/transfer/columns.ts`, `csv.ts` and `xlsx.ts`
  - `src/lib/download.ts`
  - the list toolbar's `ExportMenu`
  - the Settings "Your data" panel
  - `read-excel-file`, which 011 installed as a dev dependency
- **Category**: feature
- **Planned at**: commit `9bad570`, 2026-09-16

## Why this matters

- **Import is how switchers start.** An agent with 200 clients in Excel or in
  another CRM won't type them in again. Without import, anyone who isn't
  starting from zero never really tries LeadWing.
- **The landing already claims it.** It says spreadsheets "flow into LeadWing"
  (`messages/en/landing.json:31`), which is only true once import exists.
- **Rivals make switching easy** (see "What rivals do"). Their importers are
  fixed-template, slow or done by staff, and none of them documents an undo.
  A preview before import and a one-click undo after are things LeadWing can
  claim.
- **It feeds the founding-agent outreach** (from 21 Sep): "Send me your
  spreadsheet and I'll bring it in."

## Decisions (founder, 2026-09-16, unless marked as a default)

| Topic | Decision |
|---|---|
| Free plan | Every plan can import. Free agents run the whole wizard and see every row. Only as many rows as fit under `FREE_CLIENT_LIMIT` are imported, with "Upgrade to import all N" beside that button. Always read the constant: the cap is now 10 (commit `9bad570`). |
| What a row fills | Contact fields, agency and notes, plus a buyer's search (budget, bedrooms, bathrooms, property types, areas) or a seller's property (type, price, bedrooms, address, city, notes). One database function call per batch writes clients and their details together. |
| File types | CSV, TSV and TXT, **and Excel `.xlsx`**: agents use Excel a lot. A `.xls` that is really an HTML table is read too. A real legacy `.xls`, or a password-protected workbook, gets "open it in Excel and save it as `.xlsx`". |
| Existing clients | *Default.* A row whose email or phone matches a client on the same side is skipped. A switch lets the agent import it anyway. Merging into existing clients is **not** in this plan. |
| One-word names | *Default, open to veto.* Last name becomes optional in the client form as well as in import (the database already accepts `''`). Portal leads often arrive with only a first name. |
| Undo | *Default.* Every import is recorded, and its clients can be deleted in one step. |
| Mixed files | *Default.* An optional row filter ("only rows where Tipo de contacto is Comprador"). Each run imports one side. |
| Quiet-buyer nudges | *Default.* More than 5 quiet buyers become **one** bell notification. This ships with import, never after it. |

## What rivals do (research 2026-09-16; sources at the bottom)

| Product | Getting data in | Getting data out |
|---|---|---|
| Fincta | Clients from CSV [1]; offers to help bring data over [1] | CSV of all clients, any time [2] |
| Inmoweb | Contacts from CSV/XML, up to 15 MB. Has a template, column matching, skip-or-update on duplicates by email/phone, and a dry run; unmatched columns are saved as a note [4] | CSV/XML, admins with two-step login only [5] |
| Inmovilla | Contacts from CSV on a fixed template, no column matching [11]. Staff migration takes up to 5 working days, and they won't redo it if the source was wrong [12][15] | Pick fields, then Excel or XML [13] |
| Witei | Contacts with column matching. Rows over the plan limit are dropped, and emails arrive unsubscribed unless mapped [16] | Excel/CSV, admins only, up to 24 h, 10,000-row files [18] |
| ReSales Online | Properties by XML [21]; contact import isn't documented | Excel Workbook or CSV, admins only [20] |
| PropertyList | Properties by XML feed [9]; contact file import isn't documented | Listings as XML [9] |

**Column headers seen.** These seed the header dictionary in Step 3.
- **Inmoweb** [4]:
  - Name, type and personal: Nombre, Apellidos, Idioma, Sexo, Tipo de contacto,
    Empresa, NIF, Fecha de nacimiento, Procedencia, Estado Civil, IBAN,
    Nacionalidad
  - Address: Provincia, Dirección, Población, Código Postal, País
  - Contact: Email principal, Email secundario, Teléfono principal,
    Teléfono secundario, Móvil principal, Móvil secundario, WhatsApp
  - Other: GDPR, Agente, Observaciones
- **Witei** [16]:
  - Contact: Alias, Nombre, Email, "Email. alternativo" (sic),
    Email dado de baja, Teléfono, Teléfono alternativo, NIF, Notas
  - Address: Calle, Ciudad
  - People: Colaborador, Creador, Responsable comercial
  - Search:
    - Alquiler, Venta, Tipo
    - Altura máxima/mínima
    - Baños: máximo / Baños: mínimos, Dormitorios: máximo / Dormitorios: mínimos
    - Precio máximo/mínimo de Alquiler, Precio máximo/mínimo de Venta
    - Superficie máxima/mínima
- **Inmovilla** export picker [13]:
  - Client: Apellidos, Email Cliente, DNI/NIE, Estado Civil, Captado por,
    Aviso Importante Cliente
  - Address: Calle Cli, Calle Numero Cliente, Ciudad Cli, CP Cli
  - Spouse: Conyuge Email, Conyuge Nif, Conyuge Nombre
- **Google Contacts, current export**:
  - Name: First Name, Middle Name, Last Name, Name Prefix, Name Suffix,
    Nickname, File As
  - Organization: Organization Name, Organization Title
  - Other: Birthday, Notes, Photo, Labels
  - Repeated pairs: E-mail 1 - Label/Value, Phone 1 - Label/Value,
    Address 1 - Formatted…
  - Google's own help spells these "Email" as well.
- **Google Contacts, older export**: Name, Given Name, Additional Name,
  Family Name, Group Membership, E-mail 1 - Type/Value, Phone 1 - Type/Value,
  Organization 1 - Name.
- **Outlook**:
  - Name and title: First Name, Middle Name, Last Name, Title, Suffix
  - Email: E-mail Address, E-mail 2 Address, E-mail 3 Address
  - Phone: Mobile Phone, Home Phone, Business Phone, Other Phone,
    Primary Phone
  - Other: Company, Notes, Categories
  - A Spanish Outlook writes Spanish headings; their exact names are
    unverified.

## Current state (verified 2026-09-16 at `9bad570`)

1. **Schema** (`supabase/migrations/20260529120000_init.sql`):
   - `clients.first_name` and `last_name` are `not null` with no length
     checks. `stage` is checked per side: buyer stages are
     new/contacted/qualified/viewing/reserved; seller stages are
     pending/qualified.
   - `buyer_preferences` is 1:1 with a buyer: `property_types text[]`,
     `budget_min`/`budget_max numeric`, `bedrooms`/`bathrooms integer`,
     `area_notes`.
   - `properties` is many-per-seller: `price`, `bedrooms`, `property_type`,
     `address`, `city`, `notes`.
   - The client page shows both sections at every stage.
2. **Form caps**:
   - `src/lib/validation/client.ts`: names 100; phone, language and
     nationality 50; agency 120; notes 5000.
   - `src/lib/validation/buyer.ts`: area notes 2000.
   - `src/lib/validation/seller.ts`: address 300, city 120, notes 2000.
3. **Free plan**:
   - `FREE_CLIENT_LIMIT = 10` is in `src/lib/access.ts:16`; `clientLimit()` and
     `canAddClient()` are in the same file.
   - The database trigger `clients_enforce_free_limit`, redefined in
     `supabase/migrations/20260916120000_free_client_limit_ten.sql`, locks the
     profile row, counts the agent's clients and raises
     `client_limit_reached`. Pro and admin agents skip the count.
   - `createClient` turns that error into `limitReached: true`
     (`src/lib/actions/clients.ts:94-96`).
   - `/clients/new` (`src/app/(app)/clients/new/page.tsx`) reads the profile
     and the client count, and shows `UpgradePrompt`, which links to
     `/pricing`.
4. **Phones**:
   - `PhoneInput` stores `"+34 600123456"`.
   - `COUNTRIES`, `DEFAULT_DIAL = "+34"` and `parsePhone()` are in
     `src/lib/countries.ts`.
   - `normalizePhone()` (`src/lib/whatsapp.ts`) keeps only digits for
     wa.me, so a phone with no country code gives a **broken WhatsApp link**.
5. **Quiet-buyer nudges**:
   - `getAttentionSignals` (`src/lib/data/attention.ts:125`) lists every
     active, unreserved buyer whose `updated_at` is at least
     `STALE_AFTER_DAYS = 7` days old (`src/lib/attention.ts:13`).
   - `syncNotifications` writes **one** `follow_up` row per buyer per ISO week
     (`src/lib/actions/notifications.ts:309-322`, `dedupe_key`
     `followup:${id}:${weekKey}`, with `weekKey` at `:123`). The rows are
     upserted at `:382`.
   - Home caps its list at `ATTENTION_LIMIT = 8`
     (`src/components/home/home-panels.tsx:37`); the bell has no cap.
   - `notificationHref` (`src/lib/notifications.ts:11`) sends any row without
     a client to `/calendar`, and `src/lib/notifications.test.ts` asserts that.
     Today every `follow_up` row has a client: `notifications.client_id`
     cascades on delete.
   - **Importing 240 buyers would put 240 rows in the bell a week later.**
6. **Live database limits**:
   - The `authenticated` role has `statement_timeout=8s`.
   - `authenticator` preloads `safeupdate`, so an UPDATE or DELETE needs a
     WHERE.
   - Supabase's API returns at most 1,000 rows per request.
   - A Server Action body is capped at 1 MB
     (`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md`).
   - The largest client book today is 4 clients.
7. **Routing**:
   - `CLIENT_RECORD` (`src/lib/crm.ts:44`) treats `/clients/<anything>`
     other than buyers|sellers|new as a client record.
     - `app-bar.tsx:51` uses it.
     - `app-sidebar.tsx:147` uses it too.
   - The app bar titles `/clients/new` by side (`app-bar.tsx:64`).
   - `/clients/import` would currently be read as a client record.
8. **Deleting clients**: `deleteClient` (`src/lib/actions/clients.ts:137-187`)
   collects the storage paths of a client's documents, viewing attachments
   and property attachments, removes them in chunks of 100, then deletes the
   row. The rows cascade; bucket files don't.
9. **Names**:
   - `initialsOf` (`src/lib/home.ts:49-56`) already handles one-word names
     ("Hans" gives "HA"), and `clientFullName` trims.
   - Only `src/lib/validation/client.ts:12` requires a last name
     (`validation.lastNameRequired`).
10. **Vocabularies**:
    - `PROPERTY_TYPES` and `LANGUAGES` are in `src/lib/crm.ts`.
    - Their labels, plus stages, deal types and seller roles, are in
      `messages/{en,es}/crm.json`.
11. **From plan 011**:
    - `src/lib/transfer/columns.ts`: column keys, and en/es headers in the
      `transfer` namespace.
    - `buildCsv` and `buildWorkbook`, and `downloadFrom`
      (`src/lib/download.ts`).
    - `ExportMenu` in the list toolbar, and the Settings "Your data" panel.
12. **Migration conventions**:
    - The RLS policy shape follows `20260915120000_tasks.sql`.
    - The revoke/grant pattern follows `20260914120000_profile_settings.sql`.
    - `src/lib/supabase/types.ts` is **hand-written**; add new objects there
      by hand.
13. **`read-excel-file` 9.x**:
    - Entries: `/browser` (spawns its own Web Worker), `/universal` (no
      worker) and `/node`.
    - `readExcelFile(file, options)` returns every sheet as
      `[{ sheet, data }]`, and `readSheet(file, sheet)` returns one.
    - Cell values are `string | number | boolean | Date | null`. Strings come
      back trimmed.
    - With `parseNumber: (s) => s`, numbers stay as their exact text, so
      phones never pass through a float.
    - Formula cells return the value Excel last saved.
    - It throws `InvalidInputError` with `code` `XLS_FILE_NOT_SUPPORTED` for
      OLE2 files. Password-protected `.xlsx` files are OLE2 too.
    - It can also throw `FILE_NOT_SUPPORTED`, `INVALID_ZIP`, `NO_DATA`, or an
      `InvalidSpreadsheetError`.
14. **Tests**: Vitest runs in `jsdom`. Put `// @vitest-environment node` on
    tests that use `/node` entries or fflate.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 |
| Lint | `npm run lint` | exit 0 (existing warnings OK) |
| Tests | `npm test` | exit 0, all pass |
| Build | `npm run build` | exit 0 |

## Suggested executor toolkit

- Read `node_modules/next/dist/docs/01-app/02-guides/data-security.md`
  (Server Actions are public endpoints; check auth inside each one) and
  `01-getting-started/07-mutating-data.md` before Step 9.
- `read-excel-file` README at `node_modules/read-excel-file/README.md`. The
  9.x API differs from older blog posts: there is no `readSheetNames`, and the
  default export returns every sheet.
- **Live database**:
  - `.env.local` holds `SUPABASE_DB_URL`. There is no `psql`, so install `pg`
    in your session scratchpad and run scripts with
    `node --env-file=<repo>/.env.local <script>.mjs`.
  - Never print the URL.
  - The founder expects the executor to apply the migration itself, after
    rehearsing it (Step 8).
- **Seeing signed-in UI without signing in**:
  1. Render the component from a temporary page at
     `src/app/preview-tmp/<your-own-folder>/page.tsx` with mock props. Never
     use a `_`-prefixed folder: App Router treats it as private.
  2. Delete **only your own folder** afterwards.
  3. Radix menus and dialogs can freeze in the in-app browser pane; the
     chrome-devtools MCP works, and its `upload_file` can feed fixture files
     to the file input.

## Scope

**In scope** (create or modify only these):
- **Dependencies**: `package.json` and `package-lock.json`. Move
  `read-excel-file` to `dependencies`.
- **Import library**: `src/lib/import/`:
  - `read.ts`, `header-row.ts`, `fields.ts`, `synonyms.ts`, `auto-map.ts`
  - `normalize.ts`, `build.ts`, `dedupe.ts`, `batch.ts`
  - a `*.test.ts` for each, plus `round-trip.test.ts`
- **Validation**:
  - `src/lib/validation/import.ts` and its test
  - `src/lib/validation/client.ts`
- **Database and types**:
  - `supabase/migrations/<timestamp>_client_imports.sql`
  - `src/lib/supabase/types.ts`
- **Actions and storage**:
  - `src/lib/actions/import.ts`
  - `src/lib/storage/client-files.ts` (new shared helper)
  - `src/lib/actions/clients.ts` (only `deleteClient`, to use that helper)
- **Notifications**:
  - `src/lib/follow-ups.ts` and its test
  - `src/lib/actions/notifications.ts` (only the follow-up block)
  - `src/lib/notifications.ts` and its test
- **Pages and routes**:
  - `src/app/(app)/clients/import/page.tsx`
  - `src/app/(app)/clients/import/template/route.ts`
- **Components**:
  - `src/components/import/*` (new)
  - `src/components/clients/clients-view.tsx` (the Import button and the
    empty state)
  - `src/app/(app)/clients/new/page.tsx` (the link)
  - `src/components/settings/data-panel.tsx` (the import row)
- **Routing and shell**:
  - `src/lib/crm.ts` and `src/lib/crm.test.ts`
  - `src/components/shell/app-bar.tsx`
- **Copy**:
  - `messages/{en,es}/imports.json` (new), registered in `src/i18n/messages.ts`
  - `messages/{en,es}/clients.json`, `validation.json`, `server.json`,
    `settings.json`
- **Step 15 only**:
  - `src/lib/faq.ts`, `messages/{en,es}/landing.json`
  - `src/app/llms.txt/route.ts`
  - `src/components/marketing/pricing-page.tsx`, `messages/{en,es}/billing.json`
- **Index**: `plans/README.md`

**Out of scope** (all of these are follow-ups):
- updating or merging existing clients
- several files in one run
- reading legacy `.xls` or `.ods`
- vCard
- importing viewings, reservations or appointments
- property import from XML feeds (Kyero)
- AI column matching
- a marketing-consent field
- paging or virtualising the client list

## Git workflow

- Commit on the current branch; the founder ships from `main`. Don't push
  unless the operator asks.
- **Commit groups**:
  - `feat(import): parsing and mapping`
  - `feat(db): client imports`
  - `feat(import): actions and wizard`
  - `feat(notifications): quiet-buyer digest`
  - `feat(clients): last name optional`
  - `feat(marketing): import and export claims`
- End commit messages with the attribution line the session gives you.

## Steps

### Step 1: Check the dependencies

Plan 011 installed `papaparse`, `write-excel-file`, `fflate`, and
`read-excel-file` as a dev dependency. Promote the last one:

```bash
npm install read-excel-file
```

**Verify**: `npm ls read-excel-file` shows 9.3.x under `dependencies` in
`package.json`.

### Step 2: Reading files: `src/lib/import/read.ts` and `header-row.ts`

This code runs in the browser. The file never leaves the agent's device;
only mapped, validated rows are sent to the server.

```ts
export type Grid = string[][]; // trimmed cell text, every row padded to the same width
export type ReadResult =
  | { ok: true; kind: "text" | "xlsx" | "html"; sheets: { name: string; grid: Grid }[] }
  | { ok: false; reason: "tooBig" | "empty" | "legacyOrProtected" | "unreadable" };
export async function readImportFile(file: File): Promise<ReadResult>;
```

**Size**: a file over 5 MB returns `tooBig`.

**Pick the reader from the first bytes, not the file name**:

| First bytes | Kind |
|---|---|
| `50 4B 03 04` | `xlsx` |
| `D0 CF 11 E0 A1 B1 1A E1` | `legacyOrProtected`: an old `.xls`, or a password-protected workbook |
| first non-space character `<`, after a BOM | `html`: many CRMs save an HTML table as `.xls` |
| anything else | `text` |

**text**:
1. Decode with `new TextDecoder("utf-8", { fatal: true })`. If that throws,
   use `new TextDecoder("windows-1252")`: a plain "CSV" save from Spanish
   Excel uses it.
2. Strip a BOM.
3. Parse with `Papa.parse(text, { delimiter: "", delimitersToGuess: [",", ";", "\t", "|"], skipEmptyLines: "greedy" })`.
   The single sheet is named after the file.

**xlsx**:
- Load `read-excel-file/browser` with a dynamic `import()`, then call
  `readExcelFile(file, { parseNumber: (s) => s })`.
- Convert each value to text:
  - `Date` → `YYYY-MM-DD` from its UTC parts; xlsx dates carry no time zone.
  - `boolean` → `"true"` / `"false"`.
  - `null` → `""`.
- Errors: `XLS_FILE_NOT_SUPPORTED` → `legacyOrProtected`; anything else →
  `unreadable`. Log the error to the console for debugging.
- If the `/browser` entry fails to bundle or run under Turbopack (it spawns
  a worker), switch to `read-excel-file/universal`, which is fine at 5 MB. If
  that fails too, that is a STOP condition.

**html**: decode as for text, then parse with `new DOMParser()`. Take the
first `<table>`, one row per `<tr>`, and each `th`/`td` `textContent`.

**All kinds**:
- Drop rows whose cells are all empty.
- Pad short rows.
- A result with no rows is `empty`.

**Header row**: `findHeaderRow(grid): number` looks at the first 20 rows. It
returns the first row that meets all of these:
- it has at least 2 non-empty cells
- none of those cells is purely a number or a date
- it has at least as many non-empty cells as the next row

Otherwise it returns 0. Excel sheets often start with a title
("Clientes 2025") or blank rows, and the wizard lets the agent change the
row (Step 12).

**Row cap**: more than 5,000 data rows below the header gives a
`tooManyRows` error in the wizard. Check this after the sheet and header row
are chosen.

**Verify**, in `read.test.ts`:
- **Text files**: UTF-8, UTF-8 with a BOM, and windows-1252 bytes (ñ = `0xF1`,
  é = `0xE9`, € = `0x80`, built by hand as a `Uint8Array`)
- **Delimiters and quoting**: `;` and tab files, a newline inside quotes,
  blank rows
- **HTML**: a table saved as `.xls` is read
- **Refused files**: OLE bytes give `legacyOrProtected`, random bytes give
  `unreadable`
- **Workbook**, built with `write-excel-file/node` inside the test (node
  environment), with:
  - a numeric phone `34600123456`, which must come back as that exact text
  - a date cell, which comes back as `YYYY-MM-DD`
  - a formula
  - a title row above the headers
  - two sheets

In `header-row.test.ts`, `findHeaderRow` picks the right row for: a title
row, blank lines, and a header-only file.

### Step 3: Matching headers: `fields.ts`, `synonyms.ts`, `auto-map.ts`

**Import targets** (`fields.ts`):
- **Contact**: `first_name`, `middle_name` (appended to the first name),
  `last_name`, `second_last_name` (appended to the last name), `full_name`,
  `email`, `phone`, `language`, `nationality`, `agency`, `notes`
- **Flags**: `priority`, `is_active`, `is_inactive` (the inverse), `stage`,
  `deal_type` (buyers), `seller_role` (sellers)
- **Buyer search**: `budget_min`, `budget_max`, `budget` (one value or a
  range), `property_types`, `bedrooms`, `bathrooms`, `area_notes`
- **Seller property**: `property_type`, `price`, `property_bedrooms`,
  `address`, `city`, `property_notes`
- **Special**: `add_to_notes` and `ignore`

**Concepts and side.** Headers match to a *concept*, and the file's side picks
the target:

| Concept | Buyer file | Seller file |
|---|---|---|
| bedrooms | `bedrooms` | `property_bedrooms` |
| property type | `property_types` | `property_type` |
| price ("Precio", "Presupuesto", "Price", "Budget") | `budget` | `price` |
| zone ("Zona", "Area", "Ubicación") | `area_notes` | `city` |
| town ("Ciudad", "Población", "Localidad", "City") | `add_to_notes` (it is usually the client's home town) | `city` |
| address ("Dirección", "Calle", "Address") | `add_to_notes` | `address` |
| bathrooms | `bathrooms` | `add_to_notes` |
| description ("Descripción") | `add_to_notes` | `property_notes` |

**Folding.** `fold(h)` removes accents (NFD, then strip `\p{M}`), lowercases,
and turns every run of non-alphanumerics into one space, then trims.
"E-mail 1 - Value" becomes `e mail 1 value`, and "Dormitorios: mínimos"
becomes `dormitorios minimos`.

**Pass 1, exact dictionary.** Folded header → concept, built at module load.
The sources are:
- **LeadWing's own headers**: import `messages/en/transfer.json` and
  `messages/es/transfer.json` directly, so a LeadWing export maps back in
  either language.
  - `id`, `created_at`, `updated_at` and `viewing_count` map to `ignore`.
  - The reservation columns map to `add_to_notes`.
- **Every header set in "What rivals do"**, with these particular rules:

| Header(s) | Concept |
|---|---|
| Nombre, Name, Nom, Naam | *name, ambiguous*: first name if a last-name column exists and no first-name column does; `ignore` if both exist (Google's old "Name"); full name if neither exists (Witei) |
| Apellidos, Apellido, Primer apellido, Last Name, Family Name, Surname, Nachname | last name |
| Segundo apellido | second last name |
| Middle Name, Additional Name | middle name |
| Nombre completo, Nombre y apellidos, Full name, Contact name, Client name, Cliente, Contacto | full name |
| Email, E-mail, Email Address, E-mail Address, E-mail 1 - Value, Email 1 - Value, Email principal, Email Cliente, Correo, Correo electrónico | email (primary) |
| E-mail 2 Address, E-mail 3 Address, E-mail 2 - Value, Email secundario, Email. alternativo | `add_to_notes` |
| Móvil, Móvil principal, Mobile, Mobile Phone, Cell, Celular, WhatsApp, Handy | phone, rank 1 |
| Teléfono, Teléfono principal, Phone, Telephone, Tel, Phone 1 - Value, Primary Phone, Telefon | phone, rank 2 |
| Teléfono secundario, Móvil secundario, Teléfono alternativo, Home Phone, Business Phone, Other Phone, Phone 2 - Value | phone, rank 3 |
| Idioma, Language, Sprache, Langue, Taal | language |
| Nacionalidad, Nationality, Nationalität, Nationalité | nationality |
| Agencia, Agency, Inmobiliaria, Oficina, Office | agency |
| Notas, Notes, Observaciones, Comentarios, Comments, Remarks | notes |
| Prioridad, Priority, Starred, VIP | priority |
| Activo, Active | is_active |
| Oculto, Archivado, Inactivo, Hidden, Archived, Inactive | is_inactive |
| Etapa, Estado, Fase, Stage, Status | stage |
| Tipo de operación, Deal type | deal_type |
| Rol, Role, Seller role | seller_role |
| Precio mínimo de Venta, Presupuesto mínimo, Presupuesto mín. (€), Presupuesto desde, Budget min, Min budget, Price from | budget_min |
| Precio máximo de Venta, Presupuesto máximo, Presupuesto máx. (€), Presupuesto hasta, Budget max, Max budget, Price to | budget_max |
| Precio, Presupuesto, Price, Budget, Asking price, Precio de venta, Precio pedido | price concept |
| Dormitorios, Dormitorios: mínimos, Habitaciones, Bedrooms, Beds | bedrooms concept |
| Baños, Baños: mínimos, Bathrooms, Baths | bathrooms concept |
| Tipo, Tipo de inmueble, Tipo de propiedad, Tipos de propiedad, Tipología, Property type, Property types | property type concept |
| Precio máximo/mínimo de Alquiler, Alquiler, Venta, Dormitorios: máximo, Baños: máximo, Superficie…, Altura… | `add_to_notes` (LeadWing has no rentals or surfaces) |
| Calle Cli, Ciudad Cli, CP Cli, Calle Numero Cliente, Provincia, Código Postal, País, Address 1 - Formatted | `add_to_notes` (the client's own address) |
| Procedencia, Tipo de contacto, Agente, Responsable comercial, Captado por, Colaborador, Creador, Empresa, Company, Organization Name, Organization Title, Labels, Categories, Group Membership, Alias, Birthday, Aviso Importante Cliente | `add_to_notes` |
| Email dado de baja, GDPR | `add_to_notes`. These are consent flags, **never** an email address |
| NIF, DNI, DNI/NIE, IBAN, Pasaporte, Passport, Sexo, Estado Civil, Fecha de nacimiento | `ignore` by default (minimise ID, financial and personal data; the agent can switch any of them to notes) |
| Photo, Name Prefix, Name Suffix, Nickname, File As, Title, Phonetic…, and `… - Label` / `… - Type` columns | `ignore` |

**Pass 2, keywords.** For headers pass 1 didn't match, the first rule that
fits wins:
1. `conyuge`, `spouse`, `pareja` or `partner` → `add_to_notes`. This runs
   before the email and phone rules, because Inmovilla lists "Conyuge Email"
   before "Email Cliente".
2. `baja`, `unsubscrib`, `consent`, `gdpr` or `rgpd` → `add_to_notes`.
3. `nif`, `dni`, `nie`, `iban` or `pasaporte` → `ignore`.
4. `email`, `e mail`, `correo` or `mail` → email. It is rank 2 if the header
   also says `2`, `3`, `secundario`, `alternativo` or `other`.
5. `movil`, `mobile`, `cell`, `whatsapp` or `celular` → phone, rank 1.
6. `telefono`, `phone`, `tel` or `telefon` → phone, rank 2. It is rank 3 if
   the header also says `secundario`, `alternativo`, `home`, `business`,
   `work`, `other`, `2` or `3`.
7. `apellido` or `surname` → last name.
8. `presupuesto`, `budget` or `precio`:
   - with `min`, `desde` or `from` → budget min
   - with `max`, `hasta` or `to` → budget max
   - otherwise → the price concept
9. `dormitorio`, `bedroom` or `habitacion` → the bedrooms concept, or
   `add_to_notes` if the header also says `max`.
10. `bano` or `bathroom` → the bathrooms concept, or `add_to_notes` if the
    header also says `max`.
11. `nota`, `note`, `observacion` or `comentario` → notes.
12. Anything else → `add_to_notes`.

**Several columns for one field** (`auto-map.ts`):
- **Email**: exact-match primaries beat keyword matches; then the leftmost
  column wins.
- **Phone**: the lowest rank wins, then the leftmost column. Later non-empty
  values go to notes as `Header: value`.
- **Other single-value targets**: the first column keeps the target, and the
  others become `add_to_notes`.
- **Notes**: every notes column is kept.

**Check guessed values.** For `stage`, `deal_type`, `seller_role`, property
type, `language`, `priority`, `is_active` and `is_inactive`:
- Look at up to 50 non-empty sample values from the column.
- If fewer than half are recognised by Step 4, downgrade the column to
  `add_to_notes`.
- This catches Witei's "Tipo" or a custom "Estado" ("Caliente", "Frío").

**API**:
- `autoMap(headers, sampleRows, side)` returns one `{ target, rank? }` per
  column.
- `mappingSignature(headers)` returns the folded headers joined with `|`.
  Step 12 uses it as a `localStorage` key.

**Verify**, in `synonyms.test.ts` and `auto-map.test.ts`, one test per real
header set (in "What rivals do"), with these expectations:
- **Google Contacts**, current and older format: first name, last name,
  email and phone are mapped; `Labels` goes to notes; `… - Label` columns are
  ignored; the older format's `Name` is ignored because Given Name and Family
  Name both exist.
- **Outlook**: `Mobile Phone` beats `Home Phone`.
- **Inmoweb**: `Móvil principal` beats `Teléfono principal`; `NIF` and
  `IBAN` are ignored; `Email secundario` goes to notes.
- **Witei**:
  - `Nombre` becomes full name, since there is no Apellidos column.
  - `Email dado de baja` goes to notes, not email.
  - `Precio mínimo/máximo de Venta` map to budget min and max.
  - `Dormitorios: mínimos` maps to bedrooms.
  - `Tipo` is downgraded when its sample values aren't property types.
- **Inmovilla**: `Email Cliente` is the email, not `Conyuge Email`.
- **LeadWing exports**, en and es, buyers and sellers: every importable
  column maps to its own key.

### Step 4: Cleaning values: `src/lib/import/normalize.ts`

Every function is pure. Unrecognised input returns `null` plus a warning, and
the raw text goes to notes (Step 5). Write each table below as a
`it.each` in `normalize.test.ts`.

**Names**, `splitFullName(raw)` and `tidyName(raw)`:
- **Honorifics**: strip a leading one (mr, mrs, ms, miss, dr, sr, sra, srta,
  don, doña, dña, d., herr, frau, m., mme) when more words follow.
- **"Last, First"**: a comma means last name first.
- **Otherwise**: the first word is the first name and the rest is the last
  name, which keeps Spanish double surnames together.
- **ALL CAPS**: a value in all capitals and longer than 3 letters becomes
  title case (`toLocaleLowerCase("es")`, then capitalise each word).
  Particles (de, del, la, las, los, y, van, von, der, den, du, da, di) stay
  lowercase unless they start the value.

| Input | First | Last |
|---|---|---|
| `María García López` | María | García López |
| `García López, María` | María | García López |
| `Sr. Juan Pérez` | Juan | Pérez |
| `Hans` | Hans | *(empty)* |
| `MARÍA DE LA CRUZ` | María | de la Cruz |

**Email**, `pickEmail(raw)`:
- Split on whitespace, `,`, `;` and `<>`, and return the first token that
  passes `z.email()`.
- `Juan <juan@x.es>; otro@y.com` gives `juan@x.es`.
- No valid token gives `null` with the warning `emailUnreadable`.

**Phone**, `normalizePhone(raw, defaultDial)`, which returns
`{ phone, warning?, extra? }`:
1. Take the first number. Split on `/`, `,`, `;`, ` o ` and ` or `; the
   remaining numbers become `extra` and go to notes.
2. Strip a leading `'` and `tel:`, and drop everything except digits and a
   leading `+`.
3. Exponent form (`/^\d(\.\d+)?e\+?\d+$/i`) gives `null` with the warning
   `phoneUnreadable`. Excel has already lost digits there.
4. A leading `00` becomes `+`.
5. With a `+`: split with `parsePhone()` and return
   `` `${dial} ${digits}` ``.
6. Without a `+`, when the default is **+34**:
   - 9 digits starting with 6, 7, 8 or 9 → `+34 <digits>`
   - 11 digits starting with `34` and then 6–9 → `+34 <last 9>`
   - anything else → keep the digits as typed (no `+`), with the warning
     `phoneNoCountry`. A leading 0 is never Spanish; it is a foreign number
     with an unknown country.
7. Without a `+`, when the default is another code `+dd`:
   - digits that start with `dd` and are at least `dd.length + 8` long →
     `+dd <rest>`
   - otherwise, drop one leading `0` (except for +39, Italy) → `+dd <digits>`
8. The total must be 6–15 digits; otherwise return `phoneNoCountry` with the
   digits. Cap the result at 50 characters.

| Input | Default | Phone | Warning |
|---|---|---|---|
| `600 123 456` | +34 | `+34 600123456` | |
| `34600123456` | +34 | `+34 600123456` | |
| `0034 600-123-456` | +34 | `+34 600123456` | |
| `+44 7700 900123` | +34 | `+44 7700900123` | |
| `07700 900123` | +34 | `07700900123` | phoneNoCountry |
| `07700 900123` | +44 | `+44 7700900123` | |
| `3.46001E+10` | +34 | — | phoneUnreadable |
| `600123456 / 952123456` | +34 | `+34 600123456` | (extra: `952123456`) |

**Money**, `parseMoney(raw)`:
- Strip currency signs, spaces and words.
- A `k` suffix multiplies by 1,000; `m` or `M` by 1,000,000.
- **Separators**:
  - If both `.` and `,` appear, the last one is the decimal mark.
  - A single separator followed by exactly three digits is a thousands mark.
  - A separator that appears more than once is a thousands mark.
  - Otherwise it is the decimal mark.
- Anything negative, non-finite or with no digits gives `null`.

| Input | Result |
|---|---|
| `250000`, `250.000`, `250,000`, `€ 250.000` | 250000 |
| `250.000,50`, `250,000.50` | 250000.5 |
| `1.250.000` | 1250000 |
| `1,5M`, `1.5m` | 1500000 |
| `450k` | 450000 |
| `12,5` | 12.5 |
| `""`, `-`, `n/a`, `consultar` | null |

**Budget**, `parseBudget(raw)` returns `{ min, max }`. It swaps the two if
min is greater than max.

| Input | Min | Max |
|---|---|---|
| `300.000 - 450.000`, `300k–450k`, `de 300.000 a 450.000`, `between 300,000 and 450,000` | 300000 | 450000 |
| `hasta 450.000`, `up to 450k`, `max 450000`, `< 450.000` | — | 450000 |
| `desde 300.000`, `from 300k`, `min 300000`, `300.000+`, `> 300.000` | 300000 | — |
| `450.000` (a single value) | — | 450000 |

**Counts**, `parseCount(raw)`:
- `3`, `3+`, `3-4` (take the lowest) and `3 dormitorios` all give 3.
- Words (`tres`) give `null`.
- Any value over 50 gives `null`.

**Yes/no**, `parseYesNo(raw)`:
- Yes: yes, y, true, 1, x, sí, si, ja, oui, ✓, ✔, *.
- No: no, n, false, 0, nein, non.
- Empty gives `null`.

**Property types**, `parsePropertyTypes(raw)`:
- Split on `,`, `;`, `/`, `+`, ` y ` and ` and `.
- Match each part against the EN/ES labels in `crm.json` plus:

| Type | Words |
|---|---|
| apartment | piso, apartamento, flat, ático, penthouse, estudio, studio, dúplex, duplex, loft, wohnung |
| house | casa, finca, cortijo, bungalow, country house, haus, maison |
| villa | chalet, chalé, detached, independiente |
| townhouse | adosado, casa adosada, pareado, semi-detached, town house, reihenhaus |
| new_development | obra nueva, promoción, new build, off plan |
| plot | parcela, solar, terreno, land, grundstück |
| commercial | local, local comercial, oficina, office, shop, tienda, nave, warehouse, negocio, hotel |

- Unknown parts go to notes as `Property type: <part>`.
- A seller file keeps the first recognised type.

**Language**, `normalizeLanguage(raw)` returns a `LANGUAGES` value, or the
raw text trimmed to 50 characters. For each language, match its English
name, its Spanish name (`crm.json`), its native name, its ISO code, and
these variants:

| Language | Accepted |
|---|---|
| English | inglés, en, eng |
| Spanish | español, castellano, es |
| German | alemán, deutsch, de |
| French | francés, français, fr |
| Dutch | neerlandés, holandés, nederlands, nl |
| Swedish | sueco, svenska, sv |
| Russian | ruso, русский, ru |
| Arabic | árabe, العربية, ar |
| Italian | italiano, it |
| Polish | polaco, polski, pl |

For several languages ("English, Spanish"), take the first one recognised.

**Stage, deal type, seller role** (`normalizeStage(raw, side)`, and the same
pattern for the other two):
- Match the keys and the EN/ES labels from `crm.json`, plus these synonyms:

| Value | Synonyms |
|---|---|
| new | nuevo, nueva, lead |
| contacted | contactado |
| qualified | cualificado, calificado |
| viewing | visita, visitas |
| reserved | reservado, reserva, arras |
| pending | pendiente |
| collab (deal type) | colaboración, compartida, shared |
| owner (seller role) | propietario, dueño |
| representative (seller role) | representante, apoderado |

- A stage that doesn't belong to the file's side gives `null`, with the
  value moved to notes.

### Step 5: Building rows: `src/lib/import/build.ts`

```ts
type ImportSettings = {
  side: ClientSide;
  headerRow: number;
  agency: string | null;       // used when a row has no agency
  defaultDial: string;         // from COUNTRIES, default "+34"
  stage: Stage;                // must belong to side
  filter: { column: number; values: string[] } | null;
};
type RowOutcome =
  | { status: "ready"; lines: number[]; row: ImportRow; warnings: WarningCode[] }
  | { status: "skipped"; lines: number[]; reason: SkipCode; cells: string[] };
export function buildImport(grid: Grid, mapping: Mapping, settings: ImportSettings): RowOutcome[];
```

**Line numbers.** `lines` holds spreadsheet row numbers, 1-based and counting
the rows above the header, so the agent can find each row in their own file.

**Filter.** A row whose filter cell isn't one of the chosen values is
skipped as `filteredOut`.

**Names.**
- A row with no first name, no last name and no full name is skipped as
  `noName`.
- If only a last name exists, it becomes the first name. The database needs a
  non-empty first name.

**Notes**, joined with `\n` in this order:
1. The first mapped notes column, as plain text.
2. The other notes columns and every `add_to_notes` column, each as
   `Header: value`.
3. The values that couldn't be used, each as a localised label plus the raw
   text: `Email (not recognised): …`, `Phone (unreadable): …`,
   `Property type: …`, `Stage: …`, and extra phones and emails.

Cap notes at 5,000 characters. If they are cut, end with `…` and add the
warning `notesTruncated`.

**Other fields.**
- **Text caps** (from the form limits): names 100, language and nationality
  50, agency 120, areas 2000, address 300, city 120, property notes 2000.
  Truncating a value adds the warning `textTruncated`.
- **Agency**: the cell value, or `settings.agency`.
- **Stage**: the recognised cell value, or `settings.stage`.
- **Priority**: the cell value, or `false`.
- **Active**: the cell value, or `true`. The `is_inactive` target is inverted.
- **Buyer search**: `preferences` is `null` when every search field is empty.
  A `budget` column fills min and max through `parseBudget`, but only the
  bounds that no explicit `budget_min`/`budget_max` column provides.
- **Seller grouping**:
  - Rows that share an email, a phone, or (with neither) the same folded full
    name become **one** seller.
  - The first row's contact fields win, and later rows only fill empty ones.
  - Every row adds a property if it has any property field.
  - A seller keeps at most 20 properties; beyond that, add the warning
    `propertiesCapped`.
  - This mirrors plan 011's one-row-per-property export.

**Warning codes**: `emailUnreadable`, `phoneUnreadable`, `phoneNoCountry`,
`valueToNotes`, `notesTruncated`, `textTruncated`, `propertiesCapped`,
`mayDuplicate`.

**Skip codes**: `noName`, `filteredOut`, `duplicateInFile`,
`duplicateExisting`, `overCap`.

**Verify**, in `build.test.ts`:
- the notes order and the notes cap
- the agency and stage defaults
- the filter
- seller grouping, including the property cap
- a buyer with a `budget` range plus an explicit `budget_max` (the explicit
  column wins)
- line numbers when a title row sits above the header

### Step 6: Duplicates, the plan cap, and batches: `dedupe.ts`, `batch.ts`

**`dedupe.ts`**:
- `rowKeys(row)` returns `e:<lower-cased email>` and `p:<phone digits>`.
- `markDuplicates(outcomes, existingKeys, skipExisting)`:
  - A ready row that shares a key with an earlier ready row becomes
    `duplicateInFile`, always. For sellers, same-person rows were already
    merged in Step 5.
  - A row whose key is in `existingKeys` becomes `duplicateExisting` when
    `skipExisting` is on. Otherwise it stays ready and gets the warning
    `mayDuplicate`.
- `applyCapacity(outcomes, capacity)`: when `capacity` is `null`, nothing
  changes. Otherwise the first `capacity` ready rows stay, and the rest become
  `overCap`.

**`batch.ts`**: `toBatches(rows, { maxRows: 200, maxBytes: 500_000 })`.
Measure each row with `new TextEncoder().encode(JSON.stringify(row)).length`.
The 200-row cap is the database function's; the byte cap keeps each call well
under the 1 MB Server Action limit, since notes can reach 5 KB a row.

**Verify**, in `dedupe.test.ts` and `batch.test.ts`:
- a duplicate within the file and a duplicate of an existing client
- the switch turned off
- the plan cap at 0, 3 and `null`
- 450 small rows give 200, 200 and 50
- 150 rows of 5 KB each split by bytes

### Step 7: The row contract: `src/lib/validation/import.ts`

```ts
export const importRowSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().max(100),
  email: z.email().max(254).nullable(),
  phone: z.string().max(50).nullable(),
  language: z.string().max(50).nullable(),
  nationality: z.string().max(50).nullable(),
  agency: z.string().max(120).nullable(),
  notes: z.string().max(5000).nullable(),
  priority: z.boolean(),
  is_active: z.boolean(),
  stage: z.enum([...BUYER_STAGES, ...SELLER_STAGES]),
  deal_type: z.enum(["direct", "collab"]).nullable(),
  seller_role: z.enum(["owner", "representative"]).nullable(),
  preferences: z.object({
    property_types: z.array(z.enum(PROPERTY_TYPES)).max(PROPERTY_TYPES.length),
    budget_min: money, budget_max: money,      // z.number().finite().min(0).max(1e10).nullable()
    bedrooms: count, bathrooms: count,          // z.number().int().min(0).max(50).nullable()
    area_notes: z.string().max(2000).nullable(),
  }).nullable(),
  properties: z.array(z.object({
    property_type: z.enum(PROPERTY_TYPES).nullable(),
    price: money, bedrooms: count,
    address: z.string().max(300).nullable(),
    city: z.string().max(120).nullable(),
    notes: z.string().max(2000).nullable(),
  })).max(20),
});
export const importBatchSchema = z.array(importRowSchema).min(1).max(200);
export type ImportRow = z.infer<typeof importRowSchema>;
```

`checkRowForSide(row, side)` enforces these side rules:
- **Buyers**: `properties` is empty and `seller_role` is null.
- **Sellers**: `preferences` is null and `deal_type` is null.
- **Both**: the `stage` belongs to the side.

`build.ts` must output rows that pass this schema. Test that directly.

### Step 8: The database: `supabase/migrations/<timestamp>_client_imports.sql`

**File name.** Use the build day's timestamp. It must sort **after** the
newest file in `supabase/migrations/` (today that is `20260916120000`).
Before writing, check the live database has no `client_imports` table:
`select to_regclass('public.client_imports')` must return null.

```sql
-- ============================================================
-- Client imports — every spreadsheet import is recorded, so it can be
-- reviewed and undone.
--
-- import_clients() writes one batch (at most 200 rows) with the caller's
-- rights: RLS on clients, buyer_preferences and properties, and the
-- Free-plan trigger clients_enforce_free_limit, apply exactly as they do to a
-- client added by hand. One call is one transaction, so a batch lands whole
-- or not at all.
--
-- clients.import_id ties a client to its import; undo deletes by it. A
-- foreign-key check ignores RLS, so an agent could tag their own client with
-- another agent's import id through PostgREST. That is harmless: undo
-- deletes under RLS and only ever reaches the caller's own rows, and
-- import_clients() checks ownership itself.
-- ============================================================

create table public.client_imports (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  side public.client_side not null,
  file_name text not null,
  row_count integer not null default 0,
  imported_count integer not null default 0,
  skipped_count integer not null default 0,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  undone_at timestamptz,
  constraint client_imports_file_name_len check (char_length(file_name) <= 200),
  constraint client_imports_counts_valid
    check (row_count >= 0 and imported_count >= 0 and skipped_count >= 0)
);

-- the import page lists an agent's recent imports, newest first
create index client_imports_agent_created_idx
  on public.client_imports (agent_id, created_at desc);

alter table public.client_imports enable row level security;

create policy "agent owns client_imports" on public.client_imports
  for all to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));

alter table public.clients
  add column if not exists import_id uuid
    references public.client_imports (id) on delete set null;

-- undo reads and deletes an import's clients
create index if not exists clients_import_id_idx
  on public.clients (import_id)
  where import_id is not null;

create or replace function public.import_clients(p_import_id uuid, p_rows jsonb)
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_side public.client_side;
  v_row jsonb;
  v_prefs jsonb;
  v_client_id uuid;
  v_count integer := 0;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 200 then
    raise exception 'invalid_batch' using errcode = '22023';
  end if;

  select side into v_side
  from public.client_imports
  where id = p_import_id
    and agent_id = (select auth.uid())
    and undone_at is null;
  if not found then
    raise exception 'import_not_found' using errcode = 'P0002';
  end if;

  for v_row in select value from jsonb_array_elements(p_rows) loop
    insert into public.clients (
      side, first_name, last_name, email, phone, language, nationality,
      agency, notes, priority, is_active, stage, deal_type, seller_role, import_id
    ) values (
      v_side,
      v_row ->> 'first_name',
      coalesce(v_row ->> 'last_name', ''),
      v_row ->> 'email',
      v_row ->> 'phone',
      v_row ->> 'language',
      v_row ->> 'nationality',
      v_row ->> 'agency',
      v_row ->> 'notes',
      coalesce((v_row ->> 'priority')::boolean, false),
      coalesce((v_row ->> 'is_active')::boolean, true),
      coalesce(v_row ->> 'stage', case when v_side = 'buyer' then 'new' else 'pending' end),
      case when v_side = 'buyer' then (v_row ->> 'deal_type')::public.deal_type end,
      case when v_side = 'seller' then (v_row ->> 'seller_role')::public.seller_role end,
      p_import_id
    )
    returning id into v_client_id;

    v_prefs := v_row -> 'preferences';
    if v_side = 'buyer' and jsonb_typeof(v_prefs) = 'object' then
      insert into public.buyer_preferences (
        client_id, property_types, budget_min, budget_max, bedrooms, bathrooms, area_notes
      ) values (
        v_client_id,
        array(select jsonb_array_elements_text(coalesce(v_prefs -> 'property_types', '[]'::jsonb))),
        (v_prefs ->> 'budget_min')::numeric,
        (v_prefs ->> 'budget_max')::numeric,
        (v_prefs ->> 'bedrooms')::integer,
        (v_prefs ->> 'bathrooms')::integer,
        v_prefs ->> 'area_notes'
      );
    end if;

    if v_side = 'seller' and jsonb_typeof(v_row -> 'properties') = 'array' then
      insert into public.properties (
        client_id, price, bedrooms, property_type, address, city, notes
      )
      select
        v_client_id,
        (p.value ->> 'price')::numeric,
        (p.value ->> 'bedrooms')::integer,
        p.value ->> 'property_type',
        p.value ->> 'address',
        p.value ->> 'city',
        p.value ->> 'notes'
      from jsonb_array_elements(v_row -> 'properties') as p(value);
    end if;

    v_count := v_count + 1;
  end loop;

  update public.client_imports
     set imported_count = imported_count + v_count
   where id = p_import_id;

  return v_count;
end;
$$;

revoke all on function public.import_clients(uuid, jsonb) from public, anon;
grant execute on function public.import_clients(uuid, jsonb) to authenticated;
```

**Rehearse first, with nothing kept.** Save this as
`<scratchpad>/rehearse-client-imports.mjs` and run it with
`node --env-file=<repo>/.env.local rehearse-client-imports.mjs <migration path>`:

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
const expectError = async (label, run, text) => {
  await db.query("savepoint s");
  try { await run(); console.log(`FAIL ${label}: no error`); }
  catch (e) { console.log(e.message.includes(text) ? `ok   ${label}` : `FAIL ${label}: ${e.message}`); }
  await db.query("rollback to savepoint s");
};
const buyer = (i) => ({
  first_name: `Rehearsal${i}`, last_name: "", email: `r${i}@example.com`, phone: `+34 6000${String(i).padStart(5, "0")}`,
  language: "English", nationality: null, agency: "Rehearsal", notes: null, priority: false, is_active: true,
  stage: "new", deal_type: null, seller_role: null,
  preferences: { property_types: ["villa"], budget_min: 300000, budget_max: 450000, bedrooms: 3, bathrooms: 2, area_notes: "Nueva Andalucía" },
  properties: [],
});

await db.connect();
await db.query("begin");
try {
  await db.query(sql);
  const founder = (await db.query("select id from public.profiles where is_admin limit 1")).rows[0].id;
  const other = (await db.query("select id from public.profiles where id <> $1 limit 1", [founder])).rows[0].id;

  await as(founder);
  const imp = (await db.query("insert into public.client_imports (side, file_name, row_count) values ('buyer', 'rehearsal.csv', 200) returning id")).rows[0].id;
  const started = Date.now();
  const n = (await db.query("select public.import_clients($1, $2::jsonb) as n", [imp, JSON.stringify(Array.from({ length: 200 }, (_, i) => buyer(i)))])).rows[0].n;
  console.log(`200 buyers in ${Date.now() - started} ms (inserted ${n}; must stay far below 8000 ms)`);
  const prefs = (await db.query("select count(*)::int as c from public.buyer_preferences p join public.clients c on c.id = p.client_id where c.import_id = $1", [imp])).rows[0].c;
  console.log(prefs === 200 ? "ok   searches written" : `FAIL searches: ${prefs}`);

  const simp = (await db.query("insert into public.client_imports (side, file_name) values ('seller', 'rehearsal.csv') returning id")).rows[0].id;
  const seller = { ...buyer(900), stage: "pending", preferences: null, properties: [
    { property_type: "villa", price: 1250000, bedrooms: 4, address: "Calle Uno 1", city: "Marbella", notes: null },
    { property_type: "plot", price: 400000, bedrooms: null, address: null, city: "Benahavís", notes: null },
  ] };
  await db.query("select public.import_clients($1, $2::jsonb)", [simp, JSON.stringify([seller])]);
  const props = (await db.query("select count(*)::int as c from public.properties p join public.clients c on c.id = p.client_id where c.import_id = $1", [simp])).rows[0].c;
  console.log(props === 2 ? "ok   seller with two properties" : `FAIL properties: ${props}`);

  await expectError("batch over 200 rows", () => db.query("select public.import_clients($1, $2::jsonb)", [imp, JSON.stringify(Array.from({ length: 201 }, (_, i) => buyer(i)))]), "invalid_batch");

  await as(other);
  const foreign = (await db.query("insert into public.client_imports (side, file_name) values ('buyer', 'x.csv') returning id")).rows[0].id;
  await as(founder);
  await expectError("another agent's import", () => db.query("select public.import_clients($1, '[]'::jsonb)", [foreign]), "import_not_found");

  await db.query("reset role");
  await db.query("update public.profiles set is_admin = false, subscription_status = 'none', pro_until = null where id = $1", [founder]);
  await as(founder);
  await expectError("Free cap inside an import", () => db.query("select public.import_clients($1, $2::jsonb)", [imp, JSON.stringify([buyer(999)])]), "client_limit_reached");
} finally {
  await db.query("rollback");
  await db.end();
}
```

**Expected**:
- Every line prints `ok`.
- The 200-row time is well under 8,000 ms; a few hundred ms is normal.
- Nothing is kept: the script always rolls back.

**Apply it.** Only when the rehearsal passes, in one transaction:
1. Run the file.
2. Insert its history row into `supabase_migrations.schema_migrations`.
   First read the table's columns from `information_schema.columns`; today
   they are `version`, `name` and `statements`. Use the file's timestamp as
   `version` and the rest of the name as `name`.
3. Commit.

**Check afterwards**:
- `to_regclass('public.client_imports')` is not null.
- One policy exists on it in `pg_policies`.
- `pg_proc.prosecdef` is `false` for `import_clients`.
- `has_function_privilege('anon', 'public.import_clients(uuid,jsonb)', 'execute')`
  is `false`.
- The history row is present.

Report what ran. Never print the connection string.

**Types.** Add these to `src/lib/supabase/types.ts` by hand:
- `client_imports` (Row, Insert, Update)
- `import_id` on `clients` (Row, Insert, Update)
- `Functions.import_clients: { Args: { p_import_id: string; p_rows: Json }; Returns: number }`

### Step 9: Server actions: `src/lib/actions/import.ts` and `src/lib/storage/client-files.ts`

**Shared file helper.** `src/lib/storage/client-files.ts` is a plain server
module, not `"use server"`. Move the storage logic out of `deleteClient`:
- `collectClientFilePaths(supabase, clientIds)`: documents, viewing
  attachments (through viewings) and property attachments (through
  properties), with `.in()` in chunks of 100.
- `removeFilePaths(supabase, paths)`: in chunks of 100.

`deleteClient` then calls them with `[id]`, and must behave exactly as before.

**Actions.** `src/lib/actions/import.ts` is `"use server"`, and every export
starts with `supabase.auth.getUser()`.

**`getImportContext(side)`** returns
`{ capacity, limit, clientCount, existingKeys, agencies, recent }`:
- **Capacity**: read `subscription_status, pro_until, is_admin` and the client
  count, as `/clients/new` does. Then
  `capacity = clientLimit(profile) === null ? null : Math.max(0, limit - count)`.
  With no profile row, return `null` and let the trigger decide.
- **existingKeys**: the Step 6 keys for that side's `email, phone`, paged in
  1,000s. Build them on the server and send keys only, no names.
- **agencies**: distinct non-empty `agency` values, sorted, at most 50.
- **recent**: `client_imports` from the last 30 days where `undone_at` is
  null, newest first, at most 10.

**`startClientImport({ side, fileName, rowCount })`**:
- Validate with zod: file name 1–200 characters (trimmed), row count 0–5000.
- Insert the `client_imports` row and return `{ importId }`.

**`importClientBatch(importId, side, rows)`**:
1. Validate with `importBatchSchema` plus `checkRowForSide`.
2. On Free, recheck the capacity. If it is smaller than `rows.length`, return
   `{ error, limitReached: true }` without calling the database.
3. Call `supabase.rpc("import_clients", { p_import_id: importId, p_rows: rows })`.
4. Translate errors:
   - `client_limit_reached` → `limitReached`
   - `import_not_found` → "This import is closed"
   - `57014` (statement timeout) → "The database took too long; try again"
   - anything else → a generic message
   - Always `console.error` the raw error.
5. Return `{ imported }`.

**`finishClientImport(importId, { skipped })`**:
- Set `finished_at` and `skipped_count`.
- Call `revalidatePath("/clients")` once.

**`previewUndo(importId)`** returns `{ total, edited }`. `edited` counts
clients whose `updated_at` is later than their `created_at`. The update
trigger only bumps `updated_at` on a real edit.

**`undoClientImport(importId)`**:
1. Check the import is the agent's own and not undone.
2. Page through its client ids.
3. Call `collectClientFilePaths`, then `removeFilePaths`.
4. Delete with `.delete().eq("import_id", importId)`.
5. Set `undone_at`.
6. Call `revalidatePath("/clients")`.

**Verify**:
- `npm run typecheck`.
- After Step 12, exercise the actions through the wizard preview with stub
  actions; the real ones are exercised by the founder's signed-in pass.
- Run the existing `deleteClient` behaviour check by reading the diff: the
  same tables, the same chunking, the same order.

### Step 10: One bell notification for many quiet buyers

**`src/lib/follow-ups.ts`** (pure, tested):
- Export `FOLLOW_UP_DIGEST_MIN = 6`.
- `followUpRows(staleBuyers, { agentId, weekKey, nowISO, t, stageName })`:
  - **5 or fewer quiet buyers**: return today's per-client rows, unchanged.
  - **More than 5**: return **one** row:
    - `type: "follow_up"`, `client_id: null`
    - title `t("followUpDigest", { count })`
    - body: the three quietest names with `t("followUpDigestMore", { count: rest })`
    - `dedupe_key: followup-digest:${weekKey}`, `due_at: nowISO`
  - Order by `quietDays`, largest first.

**`src/lib/actions/notifications.ts:309-322`**:
- Replace the loop with `rows.push(...followUpRows(...))`.
- When a digest is written, also delete this week's **unread** per-client
  rows, so the bell doesn't show both:
  `.delete().eq("type", "follow_up").is("read_at", null).like("dedupe_key", \`followup:%:${weekKey}\`)`.
  The WHERE keeps `safeupdate` happy.

**`src/lib/notifications.ts:14`**: a `follow_up` row without a client now
links to `/clients/buyers`. Every other client-less row still goes to
`/calendar`. Update `src/lib/notifications.test.ts`: the "client-less
follow_up" case now expects `/clients/buyers`. No client-less follow-up rows
exist today, so nothing else moves.

**Copy**, in `messages/{en,es}/server.json` under `notifications`:

| Key | EN | ES |
|---|---|---|
| `followUpDigest` | "{count} buyers have gone quiet" | "{count} compradores sin novedades" |
| `followUpDigestMore` | "and {count} more" | "y {count} más" |

**Verify**:
- `follow-ups.test.ts` checks the rows at 5 and 6 buyers, the digest's
  order, its title and body, and its key.
- `notifications.test.ts` passes.
- The notifications page renders a client-less `follow_up` row. Check it on
  a preview page with a mock feed.

### Step 11: Make last name optional

1. In `src/lib/validation/client.ts:12`, change the rule to
   `last_name: z.string().trim().max(100)`.
2. Remove `lastNameRequired` from `messages/{en,es}/validation.json`.
3. Leave `src/components/clients/client-form.tsx` alone. Its labels carry no
   required markers (`:161-176`), and optional fields such as email and phone
   aren't labelled "optional" either, so the schema is the only change.
4. `createClient` and `updateClient` already store `v.last_name`; `''` is
   fine.

**Verify**:
- The form saves "Hans" with no last name.
- The avatar shows "HA", and lists, search and the quick view read normally.
- `npm test` passes.

### Step 12: The wizard: `src/app/(app)/clients/import/page.tsx` and `src/components/import/*`

**Page** (server component):
- Read `side` from `searchParams`: `seller` or `buyer`, defaulting to buyer.
- Call `getImportContext(side)` and render
  `<ImportWizard side={side} context={context} />`.
- `generateMetadata` sets the title from `imports.meta.title`.

**`import-wizard.tsx`** (`"use client"`):
- A step machine: `file → columns → review → run → done`.
- Takes an `actions` prop that defaults to the real server actions, so a
  preview page can pass stubs.
- While a run is in progress, a `beforeunload` guard warns before leaving.

**Step: file** (`file-step.tsx`):
- A drop zone and file input accepting `.csv,.tsv,.txt,.xlsx,.xls`, and a
  Buyers/Sellers segmented switch.
- "Download a template": Excel (the main button) and CSV. Both hit Step 13.
- **Short how-tos**:
  - Excel: upload the `.xlsx` as it is.
  - Google Sheets: File → Download → `.xlsx` or CSV.
  - Google Contacts: Export → Google CSV.
  - Another CRM: its contacts export.
- A note that cell colours aren't imported.
- A lawful-basis line: "Import people you work with. You are responsible
  for having a reason to hold their details." Terms §7 already puts this on
  the agent, and a Google Contacts export is a whole phone book.
- **Read errors**, one message each:
  - `tooBig`
  - `empty`
  - `legacyOrProtected`: "Open it in Excel, remove any password, and save it
    as .xlsx"
  - `unreadable`
  - `tooManyRows`: split the file
- **Recent imports** (`recent-imports.tsx`) below: date, file name, side,
  count, and Undo, which opens a confirm dialog with `previewUndo` counts.

**Step: columns** (`columns-step.tsx`):
- **Sheet**: a sheet picker when the workbook has more than one.
- **Header row**: "Headers are on row N", with a stepper. Changing it
  re-runs `autoMap`.
- **Column table**, one line per column:
  - the header
  - three non-empty example values
  - an "Import as" select, grouped as Contact / Buyer search (or Property) /
    Other ("Add to notes", "Don't import")
  - Below `md`, each column becomes a stacked card.
- **Settings**:
  - **Agency for every row**: `Input` with a `datalist` of
    `context.agencies`.
  - **Country for numbers without a country code**: a `Select` over
    `COUNTRIES`, default Spain +34.
  - **Stage**: a `Select` over `stagesForSide(side)`.
  - **Row filter**, optional: pick a column, then check its values, showing
    at most 30 distinct values with their counts.
- **Continue** stays disabled until a name target is mapped.
- **Remembering choices**: save the mapping, header row and settings to
  `localStorage` under
  `leadwing:import-mapping:${side}:${mappingSignature(headers)}`, and load
  them when the same headers come back. Wrap every read and write in
  `try/catch`. Only headers and choices are stored, never client data.

**Step: review** (`review-step.tsx`):
- **Counts**:
  - Ready
  - Ready with notes (rows that have warnings)
  - Already in LeadWing
  - Repeated in the file
  - Filtered out
  - No name
- **Switch**: "Skip clients already in LeadWing", on by default.
- **Preview table**, the first 50 rows exactly as they will be saved:
  - Buyers: name, email, phone, agency, stage, budget.
  - Sellers: name, phone, properties count and first city.
  - Warnings show as `Tag` chips.
- **"Rows that need a look"**, a collapsible list: line number, reason and
  the raw cells.
- **Plan line**:
  - Pro: button "Import {n} {side}".
  - Free, when `capacity < ready`:
    - A `Notice`: "Free holds {limit} clients and you have {count}:
      {capacity} of these {ready} fit."
    - A primary button, "Upgrade to import all {ready}", linking to
      `/pricing`, as `UpgradePrompt` does.
    - A secondary button, "Import {capacity} now", disabled at 0.

**Step: run** (`run-step.tsx`):
1. Call `startClientImport`.
2. Send the batches one after another, with a progress bar.
3. **Stop** finishes the current batch and then stops.
4. **On an error**: stop and show the message, then offer "Try the rest
   again" and "Download rows not imported".
5. When done, call `finishClientImport`.

**Step: done**:
- "Imported {n} · skipped {m}".
- **Download skipped rows**: build it in the browser with plan 011's
  `buildCsv` in the UI language. Add a localised "Reason" column plus the
  original cells.
- "View {side}", linking to `clientsPath(side)`.
- "Undo import".

**Copy**: `messages/{en,es}/imports.json`, registered in
`src/i18n/messages.ts`. It holds `meta`, `file`, `columns`, `targets`,
`settings`, `review`, `run`, `done`, `recent`, `warnings`, `skips`,
`notesLabels` and `errors`. Every count uses ICU plurals, and every side uses
`select`, as `clients.json` does.

**Verify**, on a preview page with stub actions:
- `capacity: null`, then `capacity: 2`.
- Feed these through the file input:
  - a Google Contacts CSV
  - a windows-1252 semicolon CSV
  - an `.xlsx` with a title row and two sheets
  - plan 011's buyer and seller exports
  - an OLE-signature file
- Check the automatic column choices, the review counts, the Free notice,
  the progress and the done screen.
- Check both languages, 375 px and desktop, and no console errors.
- Delete your preview folder.

### Step 13: The template route: `src/app/(app)/clients/import/template/route.ts`

Write `GET ?side=buyer|seller&format=xlsx|csv`:
- Check the session with `getUser()`. With no user, return 401.
- **Headers**: that side's importable columns from
  `src/lib/transfer/columns.ts`. Leave out `id`, `created_at`, `updated_at`,
  `viewing_count` and the reservation columns.
- **Two sample rows**, using the same made-up people as the OG image
  (`src/app/opengraph-image.tsx`, e.g. "Anna Karlsson", "James Holt").
  Localise the values; for example, Anna's phone is `+46 70 123 45 67`.
- **File**: build it with `buildWorkbook` or `buildCsv`. Name it
  `leadwing-import-template-<side word>.<ext>`, and send it as an attachment
  with `Cache-Control: no-store`.

**Verify**:
- Download both files for both sides.
- Re-importing each template maps every column automatically, with 2 ready
  rows each. Cover this in `round-trip.test.ts`.

### Step 14: Routing and entry points

**Routing**:
- `src/lib/crm.ts:44`: change the exclusion to
  `(?:buyers|sellers|new|import|export)`.
- Add `crm.test.ts` cases: `/clients/import`, `/clients/import/template` and
  `/clients/export` give `null`, and a real id still returns that id.
- `src/components/shell/app-bar.tsx:64`: also match `/clients/import`, which
  takes the side title the same way `/clients/new` does.

**Entry points**:
- **List toolbar** (`clients-view.tsx`): an `Upload` icon button labelled
  "Import", beside plan 011's `ExportMenu`, linking to
  `/clients/import?side=${side}`.
- **Empty state** (`clients-view.tsx:538`): a second, outline button,
  "Import from a spreadsheet".
- **`/clients/new`**: under the description, "Adding many? Import a
  spreadsheet".
- **Settings "Your data" panel**: an "Import clients" row with a link.

**Verify**:
- In a preview page, the app bar shows "Buyers" or "Sellers" on
  `/clients/import`, and the sidebar doesn't highlight a client record.
- The empty state shows both buttons.

### Step 15: Marketing claims (only after plans 011 and 012 are both live)

- **FAQ**: add `import` and `export` to `FAQ_KEYS` (`src/lib/faq.ts:9`) and
  `landing.faq.items.{import,export}.{q,a}` in en and es. The FAQPage schema
  follows on its own.
  - **import**
    - EN: "Can I bring my clients from Excel or another CRM?" — "Yes. Upload
      an Excel or CSV file (Google Contacts, Outlook and most CRMs export
      one), check how the columns match, preview every row, and import.
      Changed your mind? Undo the whole import in one click."
    - ES: "¿Puedo traer mis clientes desde Excel u otro CRM?" — "Sí. Sube un
      archivo de Excel o CSV (Google Contactos, Outlook y la mayoría de CRM
      lo exportan), revisa cómo encajan las columnas, previsualiza cada fila
      e impórtalo. ¿Te has equivocado? Deshaz toda la importación con un
      clic."
  - **export**
    - EN: "Can I take my data with me?" — "Always, on every plan. Export
      any list as Excel or CSV, or download your whole account from
      Settings, instantly."
    - ES: "¿Puedo llevarme mis datos?" — "Siempre, en todos los planes.
      Exporta cualquier lista a Excel o CSV, o descarga toda tu cuenta desde
      Ajustes, al instante."
- **`llms.txt`**: add a bullet under "What it does"
  (`src/app/llms.txt/route.ts`): "Import and export: bring clients in from
  Excel or CSV files (Google Contacts, Outlook, other CRMs), with a preview
  and one-click undo; export any list as Excel or CSV and the whole account
  as a ZIP, on every plan."
- **Pricing page**: add a `transfer` feature to the list in
  `src/components/marketing/pricing-page.tsx:62`, with the copy in
  `billing.pricingPage.features.transfer`:
  - EN: title "Import and export", body "Bring your book in from Excel or
    CSV, and take everything with you whenever you like."
  - ES: title "Importa y exporta", body "Trae tu cartera desde Excel o CSV y
    llévatelo todo cuando quieras."
- **`PUBLISHED`**: bump the dates in `src/lib/seo.ts` for the pages whose
  copy changed.
- **"We'll move it for you"**: rivals offer this as standard. No code is
  needed; it is a note for the founder's outreach.
  1. A founding agent emails their file.
  2. The founder reshapes it into the Step 13 template and sends it back.
     The template's own headers match every column automatically.
  3. The agent imports it in one click, and the founder never touches the
     agent's account.
  4. The founder deletes the emailed file afterwards: LeadWing handles it
     as processor under the DPA.

**Verify**:
- `/`, `/es`, `/pricing` and `/es/precios` show the new copy.
- `/llms.txt` has the bullet.
- The FAQPage JSON-LD lists the two new questions.

## Test plan

- **Unit tests**:
  - Steps 2–7: `read`, `header-row`, `synonyms`, `auto-map`, `normalize`,
    `build`, `dedupe`, `batch`, `validation/import`.
  - Step 10: `follow-ups`, `notifications`.
  - Step 14: `crm`.
- **`round-trip.test.ts`** (node environment): plan 011's `buildWorkbook`
  and `buildCsv` output, in en and es, for buyers and for sellers with two
  properties each, goes through `readImportFile`, `autoMap` and
  `buildImport`. The contact, search and property fields must come back
  unchanged. So must the templates.
- **Gates**: `npm run typecheck && npm run lint && npm test && npm run build`.
- **Database**: the Step 8 rehearsal prints only `ok` lines, then the
  checks after applying pass.
- **Wizard**: the Step 12 preview checks.
- **Founder, signed in** (Claude can't sign in):
  1. Import a small real Google Contacts CSV and an Excel file with a title
     row.
  2. Export buyers and re-import the file with the switch on. Every row
     should show as "Already in LeadWing".
  3. Undo one import, and check its clients and their files are gone.
  4. The Free path is covered by the rehearsal and by the preview with
     `capacity: 2`. The founder's own account is Pro.

## Done criteria

- An agent can import a CSV or `.xlsx` of buyers or sellers.
  - Columns are matched automatically for every header set above.
  - Every row is previewed before anything is saved.
  - Free agents import exactly what fits, with the upgrade offer.
- Duplicates are skipped by default.
- Imported phones carry a country code, or are flagged.
- Undo removes an import's clients and their files.
- More than 5 quiet buyers make one bell notification.
- Last name is optional.
- The migration is applied on the live database with its history row.
- CI passes.
- `plans/README.md` row 012 is marked DONE.

## STOP conditions

- A real export (Google Contacts, or a rival CRM) auto-matches fewer than
  about 80% of its useful columns. Grow the dictionary first; don't ship a
  wizard that makes agents match 20 columns by hand.
- The rehearsal's 200-row batch takes more than about 2 s, or any check
  fails. Lower the batch size or fix the function; never raise the 8 s
  timeout.
- The live database already has `client_imports`, or the migration
  timestamp collides with another file.
- Anything seems to need the service-role client or a trigger bypass. The
  design depends on the agent's own rights and the unchanged Free-cap
  trigger.
- A test or check shows another agent's rows.
- `read-excel-file` fails in the client bundle with both `/browser` and
  `/universal`.

## Maintenance notes

- **New client, search or property field**: add it to plan 011's
  `columns.ts`, the header dictionary, `importRowSchema`, `build.ts` and
  `import_clients()`.
- **A new rival export turns up**: add its headers to the dictionary, with a
  test.
- **When plan 009 adds `clients.last_contacted_at`**: make "Last contact"
  mappable, and consider starting the quiet clock from it for imported
  clients.
- **Before plan 007 sends email**: add a marketing-consent field, and map
  Witei's "Email dado de baja" and Inmoweb's "GDPR" to it.
- **First follow-up**: "update existing clients" (Inmoweb offers skip or
  update).

## Sources (checked 2026-09-16)

Column names come from help-article text and screenshots, not from
downloaded files.

- [1] https://landing.fincta.app/ (the Fincta CRM; fincta.com is an unrelated firm)
- [2] https://landing.fincta.app/crm-inmobiliario-gratuito/
- [4] https://ayuda.inmoweb.es/2021/07/13/importar-contactos/
- [5] https://ayuda.inmoweb.es/2020/05/20/como-puedo-descargar-mis-datos-copia-de-seguridad/
- [9] https://info.propertylist.es/docs/propertylist-mls-user-manual/core-workflow/import-properties/
- [11] https://inmovilla.freshdesk.com/support/solutions/articles/103000014673
- [12] https://inmovilla.freshdesk.com/support/solutions/articles/103000014925
- [13] https://inmovilla.freshdesk.com/support/solutions/articles/103000014699
- [15] https://inmovilla.freshdesk.com/support/solutions/articles/103000014928
- [16] https://faq.witei.com/es/articles/5081994-importar-contactos-a-witei
- [18] https://faq.witei.com/es/articles/3090216-realizar-una-exportacion-de-mis-datos
- [20] https://support.resales-online.com/en/articles/9352083-how-can-i-export-my-clients-contacts-to-excel
- [21] https://support.resales-online.com/en/articles/4046677-can-i-import-my-properties-into-resales-online
- Google Contacts import help: https://support.google.com/contacts/answer/15147365
- Outlook CSV headings must be in Outlook's language: https://support.microsoft.com/en-us/outlook/create-or-edit-csv-files-to-import-into-outlook

## As built (2026-09-18)

Built on top of `06222f5` with the amendments above. Typecheck, lint, 688
tests and the build pass under Node 24. The migration
`20260918120000_client_imports.sql` was rehearsed in a rolled-back transaction
(200 buyers in 204 ms, the undo delete in 80 ms) and applied on the live
database with its history row. The wizard was checked on a preview page with
stub actions: an `.xlsx` with a title row and two sheets, a Google Contacts
CSV, a windows-1252 semicolon CSV and an OLE file; the Free-plan cap, the row
filter, a failed batch with retry, undo, and 375 px. Step 15 (marketing
claims) is not done: it waits for the live check.

Where the code differs from the steps above:

- **`readImportFile(file, { readXlsx })`**: the workbook reader is an option
  (amendment 6). The `/browser` entry runs under Turbopack, so `/universal`
  was never needed. `ImportSheet` carries `rowNumbers`, the file's own row
  numbers, so `lines` stay right after empty rows are dropped.
- **Several email or phone columns stay mapped** with a `rank`; in each row
  the first usable value wins and the others go to the notes as
  `Header: value`. Auto-map turns only the *other* single-value targets into
  `add_to_notes`.
- **Unusable values** are kept as `<Header> (not recognised): <raw>`, in the
  file's own words, rather than per-field labels; `notesLabels` holds only
  `unreadable` and `column`.
- **`buildImport(sheet, mapping, settings, { agencies, labels })`** takes the
  agent's agency spellings and the two labels; outcomes carry `source`
  (the file's cells) as well as `lines`.
- **`previewUndo` returns `{ total, worked }`**, where `worked` is the union of
  edited clients and clients with any linked row; `undoClientImport(id,
  { keepWorked })` keeps those.
- **`src/lib/import/template.ts`** builds the template table; the route only
  serves it, and `round-trip.test.ts` imports both templates back.
- **Copy** is in `messages/{en,es}/imports.json` plus `clients.list.import`,
  `clients.list.empty.import`, `clients.new.importHint` and
  `settings.data.import*`.
- The columns step also lets the agent pick the sheet; the review step shows
  every ready row (not just 50) on request.
