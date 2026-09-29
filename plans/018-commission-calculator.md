# Plan 018: Commission and split calculator, the first free public tool

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> "STOP conditions" item occurs, stop and report; do not improvise. When done,
> update this plan's row in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 96a58cf..HEAD -- src/lib/routes.ts src/lib/routes.test.ts src/lib/marketing.ts src/lib/seo.ts src/components/marketing/marketing-page.tsx src/components/marketing/sign-up-dialog.tsx src/components/landing/footer.tsx src/app/sitemap.ts src/app/llms.txt/route.ts src/lib/site-events.ts src/lib/site-events-server.ts src/i18n/messages.ts messages/en/marketing.json messages/es/marketing.json supabase/migrations`
> Compare anything that changed against "Current state". A mismatch you can't
> reconcile is a STOP condition.
>
> **Shared working tree**: other Claude sessions may be editing this checkout at
> the same time. Stage only the files this plan names (`git add <path>`), never
> `git add -A`, and don't touch changes you didn't make.
>
> **Next.js 16**: not the Next.js in your training data (see `AGENTS.md`). Read
> the relevant guide in `node_modules/next/dist/docs/` before writing route or
> page code.

## Status

- **Priority**: P1 (the first free tool)
- **Effort**: M, about 2 days:
  - Phase A, tool pages in the shell: 0.5–1 day
  - Phase B, the calculator: 1 day
  - copy in two languages: 0.5 day
- **Risk**: LOW. One small live-database migration (it widens a CHECK
  constraint). No legal text: the page does arithmetic and cites two tax facts
  from official sources.
- **Depends on**: nothing. Plan 019 builds on Phase A.
- **Category**: growth / SEO
- **Planned at**: commit `96a58cf`, 2026-09-29

## Why this matters

- **Tools still get clicks.** 37 of the 38 Google results pages checked on
  29 Sep 2026 showed an AI Overview. An overview can explain what a commission
  is, but it can't work out an agent's own numbers.
- **The results are weak** (google.es, 29 Sep 2026):
  - "calculadora comisión inmobiliaria": calculator farms (calculadoraspro.com,
    invercalc.es), an American site (calk-usa.com), Instagram, and a Madrid
    agency's article.
  - "cómo calcular comisión inmobiliaria": omnicalculator.com, inmoversion.es,
    and Sooprema's calculator, which is price × % and nothing else (checked).
  - None of them handles VAT, a split with another agency, the agent's share
    of their agency's side, or IRPF withholding. Those are the questions a
    co-broking agent actually has.
- **People search for it.**
  - Google suggests "calculadora comisión inmobiliaria alquiler", "cómo
    calcular comisión inmobiliaria", "cómo calcular comisión más IVA" and
    "cuánto gana un agente inmobiliario por venta".
  - In Trends, "comisión inmobiliaria" and "honorarios inmobiliaria" each get
    over 100× the interest of "nota de encargo". Many of those searchers are
    clients, and the calculator answers them too.
- **Nobody owns it yet.** The competitive brief (16 Sep 2026) named a split
  calculator as a content gap no rival owns, and plan 015 Phase C takes the
  product toward money between agencies.
- **It spreads between agents.** "Copy the split" puts a LeadWing link in
  front of the second agent on every co-broked deal.

## Decisions (defaults; the founder can veto any line)

| Topic | Decision |
|---|---|
| Commission rates (CNMC) | **No commission percentage anywhere.** That means no default, no placeholder, no example rate, and no "typical", "usual" or "standard" wording, in the tool, the copy, the FAQ or the JSON-LD. The fee and split fields start empty. Published worked examples give the fee in euros and state no price, so no rate can be inferred. Why: on 9 Dec 2021 the CNMC fined Idealista, RE/MAX, Inmovilla, Witei and three others €1.25M for coordinating commissions, including a fixed 50% split between the listing office and the closing office. |
| No lawyer | The page explains arithmetic and two tax facts, each linked to an official source. It gives no legal or tax advice, and one line says so. |
| Tax | IVA 21% is the default. IGIC 7% (Canary Islands) and a custom rate are the alternatives. The fee is entered before tax by default; a switch says the amount already includes it. |
| IRPF withholding | None (the default), 15% or 7%, with one help line. Withholding applies only when you invoice a business or professional and your activity is registered as a professional one. Invoices to private clients carry none (DGT V2188-21; RIRPF art. 95). |
| Split | Two optional switches, both off by default. "Shared with another agency" reveals the other agency's share (%), starting empty. "My agency keeps part of our side" reveals your share (%), starting empty. With both off, your side is 100% of the fee. |
| Share | The inputs live in the URL (`history.replaceState`, debounced), so a calculation can be sent as a link. The canonical stays the clean path. "Copy the split" copies plain text: the fee and each agency's side, never your personal share, plus one LeadWing line. |
| Sign-up | Tool pages' calls to action open `SignUpDialog`, so `profiles.signup_source.landing` records the tool's path. The other written pages keep their `/login` links; changing those is out of scope. |
| Tracking | Anonymous `site_events` rows: `tool_view`, `tool_use` (the first complete result in a page view) and `tool_share` (either copy button). This needs a migration, because the table checks event names. |
| Storage | Nothing leaves the browser except those anonymous events. No cookie, no localStorage. |
| Rentals | Phase C, optional: the fee as a number of months of rent, or as a % of the annual rent. |

## Current state (verified 2026-09-29 at `96a58cf`)

1. **Routes** (`src/lib/routes.ts`):
   - `MARKETING_ROUTES` (line 42) holds one path per language: English at the
     root, Spanish under `/es`.
   - `UNLISTED_ROUTES` (:70) are the ad landings (noindex, left out of the
     sitemap).
   - `CONTENT_ROUTES` (:85) are the pages the shared shell renders with a
     publication date.
   - `LINKED_ROUTES` (:105) are the routes with a label and a blurb in
     `marketing.json` (footer links, "Keep reading" cards).
   - `routes.test.ts:149` fails when a path has no `page.tsx`.
   - New routes get two things for free: the proxy pins each page's language
     from the route map (`src/proxy.ts:28,49`), and the markdown twin for AI
     agents (`src/app/markdown/[[...path]]/route.ts`) serves any
     `marketingRouteAt` path.
2. **Content shell**:
   - `MarketingPageContent` (`src/lib/marketing.ts`) has
     `kind: "article" | "page" | "about"`, `Body` (rendered inside `<Prose>`),
     `faq`, `related` and `published`.
   - `MarketingPage` (`src/components/marketing/marketing-page.tsx`) renders,
     in order:
     - a header (:76) with two buttons linking to `/login` (:86);
     - `<Prose><Body/></Prose>` (:98);
     - the FAQ and the related cards;
     - a closing call-to-action band (:153, also linking to `/login`);
     - the footer.
   - Page files are one-liners; see
     `src/app/guides/real-estate-lead-follow-up/page.tsx`.
3. **SEO**:
   - In `src/lib/seo.ts`:
     - `PUBLISHED` (:73) is a `Record<ContentRoute, string>`, so TypeScript
       forces a date for every content route.
     - `PAGE_TYPES` (:247) maps `kind` to a schema.org type.
     - `pageJsonLd` (:259) builds the page node, a breadcrumb and the
       FAQPage. The breadcrumb (:278) is Home › page, with no middle level
       until a hub page exists.
   - `src/app/sitemap.ts`: `PRIORITY` (:17) and `CHANGE_FREQUENCY` (:30) are
     `Record<ListedRoute, …>`, so TypeScript forces entries.
   - `src/app/llms.txt/route.ts` is English only; its `## Links` list starts
     at :62.
4. **Footer** (`src/components/landing/footer.tsx`): `PRODUCT_LINKS` (:13) and
   `GUIDE_LINKS` (:15) fill two `FooterColumn`s in `grid grid-cols-2` (:46).
   Column headings come from `marketing.footer.*`.
5. **Messages**:
   - There is one JSON file per namespace and language, registered by hand in
     `src/i18n/messages.ts`, in both the `en` and the `es` object.
   - English types every `t()` call.
   - The root layout's `NextIntlClientProvider` passes every namespace to
     client components.
6. **Sign-up attribution**:
   - `SignUpDialog` (`src/components/marketing/sign-up-dialog.tsx`) renders
     `SignInForm` with `track`.
   - At sign-up, the form reads the utm tags and the current path
     (`readSignupSource`, `src/lib/signup-source.ts`), so a dialog on a tool
     page records the tool's path.
   - `SignInForm` takes a `next` prop (default `/home`,
     `src/components/auth/sign-in-form.tsx:67`); `SignUpDialog` doesn't pass
     one through.
7. **Events**:
   - `SITE_EVENTS` (`src/lib/site-events.ts:11`) lists the six ad-landing
     steps. `recordSiteEvent` drops any other name.
   - The live table checks the name:
     `supabase/migrations/20260924120000_signup_source_site_events.sql` has
     `event text not null check (event in (...))`.
   - `LandingViewBeacon` (`src/components/marketing/landing-view-beacon.tsx`)
     is the once-per-page-load pattern to copy.
   - **Local dev writes to the live database** (there is no local Supabase),
     so test events have to be deleted afterwards.
8. **Parsing and formatting**:
   - `parseMoney` (`src/lib/import/normalize.ts:205`) reads "450.000",
     "450,000.50", "1,5M" and "450k". Reuse it; don't write a second money
     parser.
   - `INTL_TAGS` (`src/i18n/config.ts:24`) maps en to en-GB and es to es-ES.
   - `Money` (`src/components/ui/money.tsx`) rounds to whole euros. That's
     fine for a price but wrong for invoice lines, which need cents.
9. **UI kit**: `Input`, `Label`, `Switch`, `ChoiceChips`
   (`src/components/ui/choice-chips.tsx`), `Button` and `sonner` toasts. The
   look is the mono redesign (`b948413`): use existing tokens and add no new
   colours.

## Commands

```bash
set -o pipefail
npm run typecheck
npm run lint
npm test
npm run build
```

Start the dev server with `preview_start`, never with `npm run dev` from Bash.

## Scope

- **In**:
  - Phase A: tool pages in the shell (route kind, tool slot, JSON-LD,
    events, footer column, llms.txt)
  - the calculator in English and Spanish, with its copy and tests
  - the live migration
- **Out**:
  - the `/tools` hub (plan 019 adds it once there are two tools)
  - saving calculations
  - commission tracking in the app (plan 015 Phase C)
  - the other pages' `/login` links
  - any document generator: those need a lawyer, and the founder chose
    lawyer-free tools only on 29 Sep 2026

## Git workflow

- Work on `main`, as the repo does today. **Commit, but push only when the
  founder says so.** Stage only the files this plan names.
- Suggested commits:
  1. `feat(tools): tool pages in the marketing shell` (Phase A, with the
     migration file)
  2. `feat(tools): commission and split calculator` (Phase B)
  3. optionally, `feat(tools): rental fees in the commission calculator`
     (Phase C)
- Apply the migration to the live database **before** the first push of code
  that sends the new events.

## Steps

### Phase A: tool pages in the marketing shell

#### Step 1: Routes

In `src/lib/routes.ts`:
- Add this to `MARKETING_ROUTES`:
  `toolCommission: { en: "/tools/commission-calculator", es: "/es/herramientas/calculadora-comision-inmobiliaria" }`
- Add `"toolCommission"` to `CONTENT_ROUTES` and to `LINKED_ROUTES`.
- Add `export const TOOL_ROUTES = ["toolCommission"] as const satisfies readonly LinkedRoute[];`
  and an `isToolRoute()` guard next to the others. The footer, llms.txt and
  plan 019's hub read them.
- In `routes.test.ts`, add both paths to the "identifies each page and its
  language" cases.

`routes.test.ts:149` will fail until Step 10 adds the page files. That is
expected.

#### Step 2: The content type

In `src/lib/marketing.ts`:
- `kind` gains `"tool"`.
- Add an optional field:
  ```ts
  /**
   * Tool pages only: the interactive part, rendered between the header and
   * the article, and how structured data describes it.
   */
  tool?: {
    Component: ComponentType;
    schema: { "@type": "WebApplication"; applicationCategory: string };
  };
  ```
  Plan 019 widens `schema` to cover a spreadsheet file.
- The rule, enforced by a test in Step 11: `kind === "tool"` if and only if
  `tool` is set.

#### Step 3: The shell

In `MarketingPage`, when `content.tool` is set:
- Don't render the two header buttons (:86–93). On a phone they push the tool
  below the fold, and the closing band still makes the ask.
- Render the tool right after the header and outside `<Prose>`, because Prose
  styles every `table`, `ul` and `p` inside it:
  ```tsx
  <section aria-label={content.heading} className="mx-auto w-full max-w-3xl px-4 pb-12">
    <Tool />
  </section>
  ```
- Render `<ToolViewBeacon />` (Step 5).
- In the closing band, replace the `/login` link with
  `<SignUpDialog>{t("cta.primary")} <ArrowRight /></SignUpDialog>`. Keep the
  pricing link.
- Keep the lead to one sentence. At 375×812 the first input must be visible
  without scrolling. If it isn't, reduce the header's top padding for tool
  pages only.

Other kinds must render exactly as before. Save the HTML of
`/guides/real-estate-lead-follow-up` before and after, and compare them: they
must be identical.

#### Step 4: Structured data

In `src/lib/seo.ts`:
- Set `PAGE_TYPES.tool = "WebPage"`.
- In `pageJsonLd`, when `content.tool` is set, add this node:
  ```ts
  {
    "@type": "WebApplication",
    "@id": `${pageUrl}#tool`,
    name: content.heading,
    url: pageUrl,
    description: content.description,
    applicationCategory: content.tool.schema.applicationCategory,
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    inLanguage: locale,
    publisher: { "@id": ORGANIZATION_ID },
  }
  ```
- On the WebPage node, set `mainEntity` and `about` to
  `{ "@id": `${pageUrl}#tool` }`. The page is about the tool, not about the CRM.
- The calculator's `applicationCategory` is `"FinanceApplication"`.
- The breadcrumb stays Home › page; plan 019 adds the Tools level together
  with the hub.

#### Step 5: Anonymous tool events

1. Read the live constraint first:
   ```sql
   select conname, pg_get_constraintdef(oid)
   from pg_constraint
   where conrelid = 'public.site_events'::regclass and contype = 'c';
   ```
   If the event check differs from the 2026-09-24 migration, **STOP**.
2. Create the migration
   `supabase/migrations/<timestamp>_site_events_tools.sql`. Pick a timestamp
   later than every file in the folder; at planning time the latest was
   `20260925140000`. Use the constraint name the query returned:
   ```sql
   -- Free tools (plans 018–019) report three anonymous steps: the page was
   -- seen, the tool produced a result (or a file was downloaded), and a result
   -- was copied to share. Same rules as the ad-landing steps: no user id, IP
   -- or cookie.
   alter table public.site_events drop constraint <conname>;
   alter table public.site_events add constraint <conname> check (
     event in ('landing_view', 'signup_open', 'google_start', 'code_sent',
               'signed_in', 'whatsapp_click', 'tool_view', 'tool_use', 'tool_share')
   );
   comment on table public.site_events is
     'Anonymous funnel steps on the ad landings and the free tools. No user id, IP or cookie; service role only.';
   ```
3. Apply it to the live database yourself. This is the founder's standing
   rule; the method is in memory under "Run DB migrations yourself".
   - Install `pg` in the scratchpad and run it with
     `node --env-file=.env.local`.
   - Run the file in a transaction, then insert its row into
     `supabase_migrations.schema_migrations`: the version is the timestamp,
     the name is the file name without `.sql`.
   - Never print the connection URL.
   - Re-read the constraint to confirm the change.
4. In `src/lib/site-events.ts`, add the three names to `SITE_EVENTS` and
   update the header comment to cover ad landings and free tools.
5. Create `src/components/marketing/tool-view-beacon.tsx`, a copy of
   `LandingViewBeacon` that fires `tool_view`.
6. Test: add `src/lib/site-events.test.ts`. `isSiteEvent` accepts the three
   new names and rejects anything else.

#### Step 6: Footer, sitemap, llms.txt

- **Footer**:
  - Add a third column. Its heading is `marketing.footer.tools` ("Free tools"
    / "Herramientas gratis") and its routes are `TOOL_ROUTES`.
  - Try `grid-cols-2 sm:grid-cols-3` for the grid.
  - Check 320, 375, 768 and 1280 px in both languages: no horizontal
    scrolling, and no columns running into each other. Spanish runs wider
    (see the `/es` overflow fixes of 15 Sep 2026).
- **`marketing.json`**, both languages:
  - `footer.tools`
  - `routes.toolCommission.label` ("Commission calculator" / "Calculadora de
    comisión")
  - `routes.toolCommission.blurb`, one sentence
- **`sitemap.ts`**: `toolCommission` gets priority `0.7`, `"monthly"`.
- **`llms.txt`**: add a `## Free tools` section after `## Links`:
  `- [Real estate commission calculator](<English URL>): fee, VAT or IGIC, the split between two agencies, your share and IRPF withholding, for Spain`

### Phase B: the calculator

#### Step 7: The arithmetic, `src/lib/tools/commission.ts`

Pure functions with no React. Amounts are integer cents internally, euros at
the edges.

```ts
export type FeeBasis =
  | { kind: "percent"; percent: number }
  | { kind: "amount"; amount: number };

export type CommissionInput = {
  /** Sale price in euros; required when the fee is a percentage. */
  price: number | null;
  fee: FeeBasis;
  /** The fee as entered already includes the tax. */
  feeIncludesTax: boolean;
  /** 0.21 for IVA, 0.07 for IGIC, or a custom rate between 0 and 1. */
  taxRate: number;
  /** Percent of the fee that goes to the other agency; null when not shared. */
  otherAgencyPercent: number | null;
  /** Your percent of your agency's side; null when you keep all of it. */
  agentPercent: number | null;
  /** IRPF withheld from your invoice. */
  withholding: 0 | 0.07 | 0.15;
};

export type CommissionBreakdown = {
  feeNet: number;
  feeTax: number;
  feeGross: number;
  /** feeNet ÷ price when the price is known; for display only. */
  feeShareOfPrice: number | null;
  /** null when the fee isn't shared. */
  otherAgencyNet: number | null;
  ourSideNet: number;
  /** null when agentPercent is null. */
  agencyKeepsNet: number | null;
  /** Your base: our whole side, or your share of it. */
  yourNet: number;
  yourTax: number;
  yourWithholding: number;
  /** yourNet + yourTax − yourWithholding */
  yourInvoiceTotal: number;
};

export function computeCommission(input: CommissionInput): CommissionBreakdown | null;

/** "3,5" → 3.5, "3.5 %" → 3.5; "" and anything outside 0–100 → null. */
export function parsePercent(raw: string): number | null;
```

Rules:
- Work in cents (`Math.round(x * 100)`) and return euros.
- Split lines so they always add up exactly:
  - `otherAgency = round(feeNet × p)`, then `ourSide = feeNet − otherAgency`
  - `you = round(ourSide × a)`, then `agencyKeeps = ourSide − you`
- When the fee is entered with tax included: `feeNet = round(gross ÷ (1 + rate))`
  and `feeTax = gross − feeNet`.
- Withholding is taken from the base, never from the tax.
- Your invoice carries the same tax as the fee: a freelance agent charges IVA
  on their share.
- Return `null`, not zeros, when anything required is missing or out of
  range: a percentage fee with no price or a price ≤ 0, a percent outside
  0–100, a negative amount, or a tax rate outside 0–1.

Tests go in `src/lib/tools/commission.test.ts`. Numbers in tests are code, not
published copy, so any values are fine there.
- A fixed €18,000 before 21% tax gives 3,780 tax and 21,780 gross. Entered as
  21,780 including tax, it gives 18,000 + 3,780.
- IGIC 7%.
- 50% to the other agency gives 9,000 / 9,000. A fee of €10,000.01 still
  splits into cents that add up.
- 70% of a 9,000 side is 6,300, and the agency keeps 2,700. Tax 1,323, 15%
  IRPF 945, invoice total 6,678.
- 7% withholding; withholding with a custom tax rate of 0.
- A percentage fee without a price gives `null`.
- `parsePercent` on "3,5", "3.5%", " 3 ", "", "abc", "101" and "-1".
- An invariant loop: 500 seeded random inputs, where every returned breakdown
  adds up exactly in cents.

#### Step 8: The component, `src/components/tools/commission-calculator.tsx`

A client component (`"use client"`). One column on a phone; from `md` up,
inputs on the left and results on the right in one card, still inside
`max-w-3xl`.

**Inputs, in this order** (labels from `tools.commission.*`):
1. Sale price (€): `Input inputMode="decimal"`, parsed with `parseMoney` and
   formatted on blur.
2. Agency fee: `ChoiceChips` [% of the price | Fixed amount], then one `Input`.
   It starts empty, with no number in the placeholder.
3. A `Switch`: "This amount already includes {tax}".
4. Tax: `ChoiceChips` [IVA 21% | IGIC 7% (Canarias) | Other]. "Other" shows a %
   input.
5. A `Switch`: "Shared with another agency". It reveals "The other agency's
   share of the fee (%)", starting empty.
6. A `Switch`: "My agency keeps part of our side". It reveals "My share of our
   side (%)", starting empty.
7. IRPF on my invoice: `ChoiceChips` [None | 15% | 7% (first three years)], with
   the help line from Decisions.

**Results** (`aria-live="polite"`). Each block shows only when it applies, and
shows dashes, not zeros, until the inputs are complete:
- **The client pays**: fee, tax and total. When the price is known, add "that
  is {x} of the price".
- **The split**: the other agency's side and ours.
- **Your invoice**: base, plus tax, minus IRPF, equals what you receive. One
  muted line: "The IRPF withheld is an advance on your income tax, not a
  cost."
- A thin stacked bar (`aria-hidden`) showing where the client's total goes:
  tax, the other agency, your agency, you. Use existing tokens (the
  foreground at different opacities), no new colours.

**Buttons**:
- "Copy the split", shown only when the fee is shared.
- "Copy link": the URL with the inputs.

**Copy text** for "Copy the split": plain lines built from
`tools.commission.copy.*` with ICU placeholders. The shape in Spanish (these
numbers are only for this plan, never for the page):
```
Precio: 437.500,00 €
Honorarios: 16.250,00 € + IVA 21 % = 19.662,50 €
Reparto: vuestra agencia 8.125,00 € · nuestra agencia 8.125,00 € (+ IVA)
Calculado con LeadWing: https://www.leadwing.app/es/herramientas/calculadora-comision-inmobiliaria
```

**URL state**:
- Keys:
  - `p`: price
  - `ft`: `pct` or `eur`
  - `f`: fee
  - `inc`: `1` when the fee includes tax
  - `tax`: `iva`, `igic` or a number
  - `o`: the other agency's %
  - `a`: your %
  - `w`: `0`, `7` or `15`
- Read them once on mount, ignoring bad values.
- Write them with `history.replaceState` 400 ms after the last change.
- None of it is personal data, and the canonical doesn't change.

**Events**: `tool_use` once per page load, at the first complete breakdown;
`tool_share` on either copy button.

**Formatting**:
- Money:
  `new Intl.NumberFormat(intlTag(locale), { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 })`,
  with tabular figures.
- Percents: `Intl.NumberFormat` with `style: "percent"` and
  `maximumFractionDigits: 2`.

**Accessibility**:
- Every input has a `Label`, and every switch has visible text.
- Results read as text; the bar is decoration.
- Focus order follows the visual order.
- Touch targets are 44 px on phones.

**Strings**: a new namespace, `tools`, in `messages/en/tools.json` and
`messages/es/tools.json`, registered in `src/i18n/messages.ts` in both
objects. Address agents as "tú" in Spanish, like the rest of the site's agent
copy.

#### Step 9: The copy, `src/content/pages/tool-commission.{en,es}.tsx`

**Head and header**:
- `kind: "tool"`, with
  `tool: { Component: CommissionCalculator, schema: { "@type": "WebApplication", applicationCategory: "FinanceApplication" } }`.
- Title, at most 60 characters, keyword first:
  - ES: "Calculadora de comisión inmobiliaria con IVA y reparto"
  - EN: "Real estate commission calculator for Spain: VAT and splits"
- Description: 140–160 characters in each language.
- Eyebrow: "Free tool" / "Herramienta gratuita".
- Heading:
  - ES: "Calculadora de comisión inmobiliaria: honorarios, IVA y reparto entre agencias"
  - EN: "Real estate commission calculator: fee, VAT and the split between agencies"
- Lead: one sentence.

**Body**: about 800–1,100 words per language, plain HTML under the tool, in
this order:
1. **How the commission is worked out**: a percentage of the price or a fixed
   fee, then tax. The worked example gives a fee in euros only.
2. **VAT on the fee**:
   - IVA is 21%; in the Canary Islands, IGIC is 7%.
   - Explain "más IVA" versus "IVA incluido".
   - Link the AEAT page for IVA and the Canary Islands tax agency's page for
     IGIC.
3. **How a shared commission flows**, who invoices whom:
   - the client pays the agency it signed with;
   - the other agency invoices its share;
   - a freelance agent invoices their agency for their cut.
   Give no rates; say every agreement sets its own split.
4. **IRPF withholding on your invoice**:
   - when it's 15%, when it's 7%, and when there's none;
   - it's an advance on income tax, not a cost;
   - link DGT V2188-21 and RIRPF art. 95.
5. **How much does an agent earn per sale?** Answer with the calculator: it
   depends on the fee your agency agrees, the split and your share. No
   averages and no salary figures.
6. **One short paragraph on LeadWing** that claims only what exists today:
   clients tagged by agency, viewings, offers and follow-ups. Don't claim
   commission tracking; it doesn't exist yet (plan 015 Phase C).
7. **One muted line**: "This calculator does arithmetic; it isn't tax or legal
   advice."

**FAQ** (4–5 entries, plain text):
- How is a real estate commission calculated?
- Does the commission carry VAT?
- How is a commission split between two agencies?
- What IRPF withholding goes on an agent's invoice?
- Is there a standard commission rate in Spain? Answer: no. Each agency agrees
  its fee with its client, and professional associations may not recommend
  fees (Ley 2/1974 de Colegios Profesionales, art. 14, as amended in 2009).
  Confirm the article on the BOE before writing the answer.

**The rest**:
- `related`: `guideFollowUp`, `crmSpain`, `pricing`.
- `PUBLISHED.toolCommission` is the ship date.
- Keywords, used naturally and never stuffed:
  - ES: "calculadora comisión inmobiliaria", "calcular comisión
    inmobiliaria", "comisión más IVA", "comisión compartida", "cuánto gana un
    agente inmobiliario por venta"
  - EN: "real estate commission calculator", "Spain", "commission split",
    "VAT"

#### Step 10: Page files

Create `src/app/tools/commission-calculator/page.tsx` and
`src/app/es/herramientas/calculadora-comision-inmobiliaria/page.tsx`. They are
one-liners like the guide pages, with `ROUTE = "toolCommission"`.

#### Step 11: Tests

- `commission.test.ts` (Step 7).
- `routes.test.ts` passes now that the page files exist.
- A content test, `src/content/pages/pages.test.ts`. For every content route
  and language:
  - `kind === "tool"` if and only if `tool` is set;
  - the title is at most 60 characters;
  - the description is 140–160 characters.
- A CNMC guard. The tool's content modules and `messages/{en,es}/tools.json`
  contain no percentage (`/\d+(?:[.,]\d+)?\s?%/`) other than 21, 7, 15 and
  100.
- `pageJsonLd` for the tool page returns a WebPage, a WebApplication with id
  `#tool`, a BreadcrumbList and a FAQPage, and the WebPage's `mainEntity`
  points at the tool.

#### Step 12: Verify

- Run the Commands block and get it green.
- On the dev server, check both URLs:
  - The page renders with no buttons in the header, and the tool is above the
    fold on a 375 px phone.
  - Results update as you type; dashes show until the inputs are complete.
  - The copy buttons work: paste the text and read it back.
  - A shared link restores every input.
  - No console errors.
  - No horizontal scroll at 320 px in either language.
  - Dark mode is readable.
- `curl -s -H "Accept: text/markdown" http://localhost:<port>/tools/commission-calculator`
  returns the page as markdown with the copy (the tool shows up as its labels).
- The JSON-LD parses. `/sitemap.xml` lists both URLs with hreflang,
  `/llms.txt` lists the tool, and the footer shows "Free tools".
- Events: one manual run shows `tool_view`, `tool_use` and `tool_share`
  arriving (the endpoint returns 204). Then delete exactly those test rows
  from the live table by id, and say so in the report.
- The sign-up dialog opens from the closing band. Use the chrome-devtools MCP
  for this, because the Browser pane freezes Radix overlays.
- Take screenshots for the founder: phone and desktop, English and Spanish,
  light and dark.

### Phase C (optional): rentals

- The fee basis gains "months of rent" (monthly rent × N) and "% of the annual
  rent". The split and invoice logic doesn't change.
- Add one FAQ entry: on a housing rental (arrendamiento de vivienda), the law
  puts agency fees on the landlord (LAU art. 20.1, as amended by Ley 12/2023;
  link the consolidated LAU on the BOE). Say nothing about seasonal or
  holiday lets.
- This targets "calculadora comisión inmobiliaria alquiler", Google's first
  suggestion for the calculator query.

## After it ships (founder)

- In Search Console, inspect both URLs and request indexing, then resubmit
  the sitemap.
- Post it where agents are, starting with the LeadWing Facebook page. The
  tool is the post; don't pitch.
- Check at 4 and 8 weeks:
  - Search Console impressions for "calculadora comisión inmobiliaria" and
    "commission calculator spain";
  - `site_events` counts by path;
  - sign-ups whose `signup_source.landing` is a tool path.

## Done criteria

- Both URLs are live and indexable, in the sitemap with hreflang, and listed
  in llms.txt and the footer.
- The calculator's tests pass, including the invariant loop.
- No commission percentage appears in the copy, the defaults, the
  placeholders or the JSON-LD.
- The migration is applied on the live database with its history row, and the
  three events arrive.
- Typecheck, lint, tests and build are green, and this plan's row in
  `plans/README.md` is updated.

## STOP conditions

- The shell, SEO or routes files have changed in ways "Current state" doesn't
  describe.
- The live `site_events` check constraint isn't the one the 2026-09-24
  migration created.
- Anything would need a default, example or "typical" commission percentage
  to work.
- The copy would need tax rules beyond the ones in Decisions, which would
  drift into advice.
- `npm run build` fails for a reason the Next.js 16 docs in `node_modules`
  don't explain.

## Maintenance notes

- Check the tax rates every January, after the budget laws: IVA 21%, IGIC 7%,
  IRPF 15% and 7%. Update the chips and the copy together.
- Bump `PUBLISHED.toolCommission` only when the copy really changes.
- If plan 015 Phase C ships commission tracking in the app, add one line and a
  call to action to the page.

## Sources (checked 2026-09-29)

- Search research (google.es results, autocomplete, Trends) via SearchAPI,
  29 Sep 2026; summary in memory as `project_free_tools_seo.md`.
- DGT binding ruling V2188-21 (an individual agent's IAE group, and IRPF
  withholding on their invoices):
  https://www.supercontable.com/informacion/IAE/Consulta_Vinculante_V2188-21.Epigrafe_para_agente_.html
  (the DGT's own database: https://petete.tributos.hacienda.gob.es)
- AEAT on withholding on professional income (15% in general, 7% for new
  professionals):
  https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/folleto-actividades-economicas/7-otras-obligaciones-fiscales-retenciones.html
- The CNMC fine for coordinated commissions (9 Dec 2021, €1.25M, including a
  fixed 50% split):
  https://www.20minutos.es/noticia/4919742/0/la-cnmc-multa-a-idealista-y-otras-6-empresas-inmobiliarias-con-1-25-millones-por-pactar-comisiones/
- LAU art. 20.1 (landlord pays agency fees on housing rentals):
  https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003
- Sooprema's calculator (price × % only):
  https://www.sooprema.com/calculadora_comision.html

## As built (2026-09-29)

Commits on `main`: `773a79d` (Phase A), `0d86830` (Phase B), `6a22d2a`
(Phase C). Before `main` moved, each exact tree passed `npm ci`, typecheck,
lint, tests and build (Node 24, CI env) in a throwaway detached worktree:
the shared working tree also held other sessions' uncommitted work.

**Live on 29 Sep 2026.** Pushed as merge `c034cd5`, which brought in
`3b1d9aa` from origin; the merged tree passed the same checks first, 886
tests included. GitHub Actions CI run 36595925855 is green. The Vercel
production deployment `dpl_Bz2ZW5tbL3BDqYgHeD6J6RY7HYG9` is READY on
www.leadwing.app. On production:
- Both URLs answer 200, `index, follow`, with the canonical, hreflang
  en/es/x-default and JSON-LD WebPage → WebApplication `#tool`,
  BreadcrumbList and FAQPage.
- The only percentages on the pages are the tax rates.
- The markdown twin, `sitemap.xml` and `llms.txt` list the tool.
- A phone visit to the Spanish page computed the same figures as the
  local build.
- Its `tool_view` and `tool_use` reached the live table (ids 196–197) and
  were deleted by id.

**Live database.** `20260929150000_site_events_tools.sql` was applied on
29 Sep 2026 in one transaction, with its history row (`site_events_tools`).
The constraint was `site_events_event_check` and matched the 24 Sep
migration. Checked afterwards: nine events, the new table comment, RLS on.
Local testing wrote 39 rows (ids 142–164 and 173–188, the tool events and one
`signup_open` on a tool path), deleted by id the same day.

**Deviations from the steps:**
- `parseMoney` and `parseBudget` moved unchanged to `src/lib/import/money.ts`
  and are re-exported from `normalize.ts`. Importing `normalize.ts` would put
  its module-level zod schema and the country and nationality lists into the
  tool page's client bundle.
- The form state, the query string and the arithmetic's input map to each
  other in `src/lib/tools/commission-query.ts`, which has its own tests. The
  form reads a link with `useSyncExternalStore` and fills in once after
  hydration, because the lint forbids setState in an effect.
- The arithmetic works in parts per million with BigInt half-up rounding
  (`mulDiv`). With floats, 150 cents × 21% comes out as 31.4999… instead of
  31.5.
- Shell: the tool shares the article's slot in `<main>`, so the other pages
  keep their React tree. A first version shifted `useId` values on the
  guides. `<main>`, the head tags and the JSON-LD of five other pages were
  compared byte for byte, before and after.
- Footer: below `lg`, the link grid takes its own row. Squeezed between the
  brand and the contact line, three columns were about 73 px wide at 768 px.
- The CNMC guard in `pages.test.ts` also scans the component. It leaves the
  lib files out, because this plan's own doc comment for `parsePercent`
  reads "3.5 %".
- Results: "Your agency keeps" and "You" are indented under "Our agency" when
  the fee is shared. Money inputs show cents only when there are any. Copy
  feedback is a toast plus an icon swap, so the buttons keep their width.
- Phase C: a "Sale | Rental" choice leads the form (`d=rent` in a link). A
  rental offers months of rent (0–120, scaled exactly), a % of a year's
  rent, or a fixed amount. The share of the price shows on sales only.

**Facts, checked 29 Sep 2026:**
- IVA general rate 21%:
  https://sede.agenciatributaria.gob.es/Sede/iva/calculo-iva-repercutido-clientes/tipos-impositivos-iva.html
- IGIC general rate 7%: the ATC's IGIC page is linked, and the ATC's rate
  sheet of 1 Jan 2026 still applies 7%:
  https://www3.gobiernodecanarias.org/tributos/atc/w/igic-impuesto-general-indirecto-canario-
- RIRPF art. 95.1: withholding is 15%, or 7% in the year the activity
  starts and the two after, if there was no professional activity the
  year before and the payer is told in writing:
  https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820#a95
- DGT V2188-21 (30 Jul 2021): an individual, non-collegiate agent working
  personally registers in IAE section two (groups 724 and 799). Withholding
  applies when the payer must withhold (RIRPF art. 76), and private clients
  withhold nothing. The page links
  https://petete.tributos.hacienda.gob.es/consultas/?num_consulta=V2188-21.
  The DGT server answered 502 to every request on the build day, so the text
  was read on supercontable.com, and the URL follows the format Google
  indexes for other rulings. **Click it once to confirm it opens.**
- Ley 2/1974 art. 14 (added by Ley 25/2009, in force 27 Dec 2009):
  colegios may not set fee scales or recommend fees:
  https://www.boe.es/buscar/act.php?id=BOE-A-1974-289#a14
- LAU art. 20.1, last sentence (Ley 12/2023, in force 26 May 2023): "Los
  gastos de gestión inmobiliaria y los de formalización del contrato serán a
  cargo del arrendador":
  https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a20

**Checks:**
- Pages: both URLs render with no header buttons. At 375×812 the first
  input sits above the fold, and nothing overflows at 320 px in either
  language, including the fullest rental state. Light and dark were checked
  on phone and desktop.
- Behaviour: results update as you type, with dashes until the inputs are
  complete. A link restores every field. The copy texts were read back from
  the page; the Browser pane has no clipboard access. The sign-up dialog
  opens from the closing band, checked in the Browser pane with animations
  off, because the chrome-devtools MCP was locked by another session's
  Chrome profile.
- Head, twins and lists: the JSON-LD parses (WebPage → WebApplication
  `#tool`, BreadcrumbList, FAQPage), the markdown twin serves the page, and
  the sitemap lists both URLs with hreflang. `llms.txt` and the footer list
  the tool.
- Events: `/api/site-event` answers 204.

**For plan 019:**
- A tool is a content module with `kind: "tool"` and `tool: { Component,
  schema }`. Add its route to `TOOL_ROUTES`: the footer column reads that
  list, and `TOOL_LINES` in `src/app/llms.txt/route.ts` is a
  `Record<ToolRoute, string>`, so TypeScript asks for its line.
- `pages.test.ts` checks every module in `src/content/pages`.

**Notes for the founder:**
- Vercel Web Analytics records the URL of a page view. For a page opened
  from a shared link, that includes the calculator's query string (numbers
  only). Our own events and storage stay as the Decisions say.
- The signed-in profit calculator (`/calculator`) defaults its agency fee to
  "5" (`src/components/calculator/calculator-screen.tsx`). That's outside
  this plan, but it is the kind of default the CNMC rule avoids.
