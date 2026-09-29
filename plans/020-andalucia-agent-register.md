# Plan 020: Andalucía's agent register, explained (optional)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> "STOP conditions" item occurs, stop and report; do not improvise. When done,
> update this plan's row in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 96a58cf..HEAD -- src/lib/routes.ts src/lib/seo.ts src/components/landing/footer.tsx src/app/sitemap.ts src/app/llms.txt/route.ts messages/en/marketing.json messages/es/marketing.json`
>
> **Shared working tree**: stage only the files this plan names; never
> `git add -A`.

## Status

- **Priority**: P3, optional
- **Effort**: S, about half a day, most of it reading the law
- **Risk**: LOW–MEDIUM. The facts are still moving, so the page has to be
  dated, sourced and re-checked.
- **Depends on**: nothing. It's a guide and uses the existing `"article"`
  kind. If plan 018 has shipped, link the tools from it.
- **Gate**: re-verify the legal status on the day you build (Step 1).
- **Planned at**: commit `96a58cf`, 2026-09-29

## Why this changed (29 Sep 2026)

This started as "a register readiness checker" in the free-tools research.
The news of 18 Sep 2026 turned it into a plain explainer:
- **Ley 5/2025** (Vivienda de Andalucía, 16 Dec 2025, BOJA no. 247 of 24 Dec
  2025) created the "Registro de Agentes Inmobiliarios Especializados del
  Sector Residencial de Andalucía". Registration was a condition for working
  as an agent (arts. 50–52).
- **13 Apr 2026**: the central government disputed about 16 articles and
  opened talks to avoid a Constitutional Court appeal.
- **18 Sep 2026**: the two governments settled in the bilateral commission.
  For the register, the Junta will promote the legal changes needed to:
  - remove mandatory registration as a requirement for working as an agent;
  - make the requirements alternatives, rather than all required;
  - apply the state rules on professional associations (colegiación).

  Sources: Diario de Sevilla, El Correo de Andalucía, and the Junta's press
  release; see Sources.

So a readiness checker would now be advice on a moving target, and it's
dropped. What remains is worth half a day:
- Interest in "registro agentes inmobiliarios" over the last 12 months ran
  about twice its 5-year average (Trends, Spain).
- Google suggests "registro agentes inmobiliarios andalucía", "requisitos para
  ser agente inmobiliario en andalucía" and "curso agente inmobiliario
  andalucía".
- The pages that rank are small and out of date: inmobiliariaiberia.com, an
  Instagram post, easy-quizzz.com, oresybryan.com, faralexandria.com, and
  iberley.es (article 50 only). They still say registration is mandatory.
- In English there is nothing at all: English results are about
  tourist-rental registration.
- A dated, sourced explainer can take the first result, and it makes a
  timely, non-salesy post for the LeadWing Facebook page.

## Decisions

| Topic | Decision |
|---|---|
| Form | A guide (`kind: "article"`) at `/guides/andalusia-agent-register` ↔ `/es/guias/registro-agentes-inmobiliarios-andalucia`. No interactive checker. |
| No lawyer | Quote and link the law and the official announcements; never advise. Every claim has a source. The page never says whether a given person qualifies. |
| Dated | A "Situation as of <date>" line at the top, and `PUBLISHED` bumped on every update. |
| Tone | Plain and calm: "nothing to file today" only if the sources support it. |

## Steps

### Step 1: Re-verify the facts (build day)

Record every fact with its URL in an "As built" section at the end of this
plan.
1. **Ley 5/2025**, consolidated text on the BOE (BOE-A-2026-423):
   - arts. 50–52;
   - the transitional and final provisions: the date it came into force, and
     when the register must be running (24 Jan 2028 according to earlier
     research; verify);
   - the two error corrections (BOE-A-2026-6644, BOJA-b-2026-90047).
2. **The bilateral commission**:
   - BOE-A-2026-8197 (23 Mar 2026) published the agreement opening
     negotiations;
   - search the BOE for the agreement that closes them, published after
     18 Sep 2026, and quote its text on the register.
3. **Changes since**: search the BOJA and the BOE for any amending law or
   decree-law that removes the obligation.
   - If it has passed, the page says registration is no longer required,
     plainly.
   - If not, the page says the law still requires it and the Junta has
     committed to change it, with no date promised.
4. **Working without a title**: confirm on the BOE that estate agency work in
   Spain needs no title or association membership (Ley 10/2003, art. 3; RDL
   4/2000, art. 3), for the FAQ.

### Step 2: The copy, `src/content/pages/guide-andalusia-register.{en,es}.tsx`

**Sections**:
1. What the register is.
2. What Ley 5/2025 says today, with short quotes from arts. 50–52.
3. What changed on 18 Sep 2026.
4. What it means for you, without advice: what is required today, and what to
   watch for.
5. The requirements as the law writes them, in a table, noting that they are
   being turned into alternatives.
6. A timeline: December 2025 law, in force in January 2026, April 2026
   dispute, 18 Sep 2026 agreement, and the register deadline if it still
   applies.
7. Sources.

**FAQ**, answered only from the sources:
- Is registration mandatory in Andalucía?
- What are the requirements?
- When will the register open?
- Do I need to be an API or a member of a professional association to work as
  an agent?

**Titles**, at most 60 characters:
- ES: "Registro de agentes inmobiliarios de Andalucía: qué cambia"
- EN: "Andalusia estate agent register: what changed in 2026"

**Related**: `crmMarbella`, `guideFollowUp`, `about`, plus the tools if plan
018 has shipped.

### Step 3: Wiring

- Add a route key `guideAndaluciaRegister` to `MARKETING_ROUTES`,
  `CONTENT_ROUTES` and `LINKED_ROUTES`.
- Create the two page files.
- Add the `marketing.json` label and blurb, a `PUBLISHED` date, and sitemap
  entries (0.6, monthly).
- Add one line under `## Links` in llms.txt.
- Add it to the footer's Guides column.
- Add the two paths to the `routes.test.ts` cases.

### Step 4: Verify

- Typecheck, lint, test and build are green.
- Both pages render at 320 and 1280 px in both languages.
- The JSON-LD parses: Article, BreadcrumbList, FAQPage.
- The markdown twin works.
- Every source link opens.

## Done criteria

Both pages are live, sourced and dated, and wired into the sitemap, llms.txt
and the footer. The "As built" section lists every fact with its URL, and the
README row is updated.

## STOP conditions

- The sources disagree on whether registration is required today.
- The BOE agreement text contradicts the press reports.
- The page would have to say whether a particular person qualifies.

## Maintenance notes

- Re-check monthly until the amending law passes, then once more when the
  register opens. Bump `PUBLISHED` on each update.
- If the obligation is gone for good and interest fades, keep the page as
  history rather than deleting it: it will still be the accurate answer.

## Sources (checked 2026-09-29)

- Ley 5/2025, de 16 de diciembre, de Vivienda de Andalucía, consolidated:
  https://www.boe.es/buscar/act.php?id=BOE-A-2026-423
- BOE-A-2026-8197 (Resolución de 23 de marzo de 2026, publishing the
  bilateral commission's agreement of 11 Mar 2026):
  https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-8197
- Junta de Andalucía press release, 18 Sep 2026:
  https://www.juntadeandalucia.es/organismos/avra/servicios/actualidad/noticias/detalle/684223.html
- Diario de Sevilla, 18 Sep 2026:
  https://www.diariodesevilla.es/andalucia/junta-gobierno-resuelven-discrepancias-ley_0_2008006781.html
- El Correo de Andalucía, 18 Sep 2026:
  https://www.elcorreoweb.es/andalucia/2026/09/18/junta-andalucia-realiza-ajustes-tecnicos-ley-vivienda-constitucional-134429582.html
- Search research (Trends, autocomplete, google.es results), 29 Sep 2026;
  summary in memory as `project_free_tools_seo.md`.
