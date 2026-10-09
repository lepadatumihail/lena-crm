# Plan 021: Agent earnings calculator, the third free tool

## Status

- **Priority**: P2
- **Effort**: S–M, built in one session
- **Depends on**: 018 (built): the tool page kind, `TOOL_ROUTES`, the tool
  events and `computeCommission`
- **Built**: 2026-10-09, on the founder's pick from three options (see Why)

## Why

On 9 Oct 2026 the founder's Search Console export (last three months) showed
the commission calculator as the site's only non-brand traction: the Spanish
page had 31 impressions at an average position of 12, and every visible
non-brand query was about fees. Three next tools were proposed (agent
earnings, follow-up message templates, nota simple in English). The founder
picked earnings, along with a "who pays estate agent fees" FAQ on the
commission calculator (shipped separately as `baed311`).

- **Demand:** "cuanto gana un agente inmobiliario" scored 4 on Google Trends
  (Spain, 12 months), against 1 for "nota de encargo" and 0 for the other
  candidates. Autocomplete suggests "…en españa", "…al mes" and "…por venta".
- **Competition:** the results page is all articles (iad, E&V, Indeed,
  Glassdoor, inmoGesco); no calculator ranks.

## What it is

`/tools/agent-earnings-calculator` ↔
`/es/herramientas/calculadora-ingresos-agente-inmobiliario`.

- **Inputs:** sales a year (or the take-home a month you want), the average
  price, the fee per sale before IVA (a % or euros), the share of sales that
  are shared and the other agency's %, your share of your agency's side, the
  cuota de autónomos (estimated, or typed), other costs a month, and the IRPF
  withheld (none, 15 or 7).
- **Output:** the year's fees, the splits, your fees, the cuota, costs, IRPF
  and the take-home a year and a month. "Sales I need" mode returns the
  fewest sales a year that reach a monthly take-home.
- **With nothing withheld**, the calculator sets aside the quarterly IRPF
  advances (modelo 130, 20% of net earnings), so take-home figures stay
  comparable across the three choices.
- **CNMC rule:** every field starts empty. `pages.test.ts` scans the page,
  the component and the table for any % except 21, 7, 15, 100, 31.5, 20 and 70.

## Code

- `src/lib/tools/earnings.ts`: the arithmetic. Each sale goes through
  `computeCommission` (`mulDiv` and `PPM` are now exported from
  `commission.ts`), so the cuota table, its rate and the year live here.
- `src/lib/tools/earnings-query.ts`: the form fields and the link format.
- `src/components/tools/earnings-calculator.tsx`, `cuota-table.tsx`, and
  `tool-parts.tsx`. The commission calculator's private form pieces moved to
  `tool-parts.tsx`; markup unchanged.
- Content modules `tool-earnings.{en,es}.tsx`; route `toolEarnings` in the
  route lists, sitemap, `PUBLISHED`, llms.txt and the hub. The hub and the
  commission page link to it, and `CHECKED` moves their Updated dates.

## Facts, checked 2026-10-09

- **Cuota table and rates:** Orden PJC/297/2026, BOE 31 Mar 2026, article
  18.1 (bands and minimum bases), 18.2 (common 28.30, professional 1.30, MEI
  0.90) and 37.5–6 (cessation 0.90, training 0.10). That makes 31.50%. The
  minimum cuota runs from €205.88 (band 1) to €607.35 (band 15).
  https://www.boe.es/buscar/act.php?id=BOE-A-2026-7296
- **Earnings for the table:** LGSS article 308.1.c. Net earnings with the
  cuota added back, less 7% for general expenses (3% for corporate
  self-employed, not modelled).
  https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724#a308
- **Tarifa plana:** LETA article 38 ter (anchor `#a3-5`). The amount is set by
  each budget law. The Seguridad Social's page gives no general figure, so the
  page names no amount and tells people to type what they pay.
- **Quarterly advances:** RIRPF article 110.1.a (20% of net earnings).
  Article 109.2 waives them for professionals when at least 70% of the
  previous year's income was withheld.
- **Withholding:** RIRPF article 95 (15%, or 7% in the first three years),
  as in plan 018.

## Every year

When the new Orden de cotización is in the BOE (2026's came on 31 March),
update `COTIZACION_BANDS`, `COTIZACION_RATE` and `COTIZACION_YEAR` in
`earnings.ts`. Then re-run `earnings.test.ts`: the page's worked example
(8 sales × €5,000, €500 costs, 15% → €1,906.12 a month; 10 sales for
€2,500) is asserted there and quoted in both content modules, so update the
prose with the new figures. Bump `CHECKED.toolEarnings`.

## Checks (2026-10-09)

- Typecheck, lint (0 errors) and 999 tests pass on Node 24, the pinned
  version. On Node 22 one importer test (windows-1252 decoding) fails; this
  work doesn't touch the importer.
- `next build` passes.
- In the Browser pane: the worked example, "Sales I need" (10 sales) and a
  link with splits restoring every field in Spanish.
- No overflow at 375 or 320 px. Dark mode checked in Chrome. JSON-LD:
  WebPage → WebApplication `#tool`, BreadcrumbList under Tools, FAQPage.
- Sitemap, llms.txt and the markdown twin list the page.
- Local testing wrote site_events 503–522 to the live table; they were
  deleted by id.
