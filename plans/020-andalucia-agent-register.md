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

## As built

### Step 1: the facts, re-verified on 2026-09-29 (build day)

Read on the BOE, the BOJA and the Junta's own pages that day. Quotes are
verbatim; every URL opened (HTTP 200) and every BOE anchor exists.

**Ley 5/2025, de 16 de diciembre, de Vivienda de Andalucía**
- Published in the BOJA no. 247, 24 Dec 2025
  (https://www.juntadeandalucia.es/boja/2025/247/1), and the BOE no. 7,
  8 Jan 2026, as BOE-A-2026-423
  (https://www.boe.es/buscar/act.php?id=BOE-A-2026-423; ELI
  https://www.boe.es/eli/es-an/l/2025/12/16/5).
- In force since **24 Jan 2026**. Final provision eight: "entrará en vigor al
  mes de su publicación en el «Boletín Oficial de la Junta de Andalucía»"
  (`#df-8`); the BOE header says "Entrada en vigor: 24/01/2026".
- **Not amended.** The BOE consolidated text reads "Última actualización,
  publicada el 24/12/2025", and the BOE's analysis lists only the two error
  corrections as later references.
- Art. 49.1 (`#a4-11`): every person who habitually and for pay provides
  intermediation, advice and management services in residential property
  "deberá inscribirse obligatoriamente en el registro que se creará al efecto
  por la Consejería competente en materia de vivienda".
- Art. 50 (`#a5-2`): 50.1 "de carácter público, administrativo, gratuito y
  obligatorio"; 50.2 attached to the housing department; **50.3 "La
  inscripción en el Registro será requisito necesario para el ejercicio de la
  actividad en el ámbito de la Comunidad Autónoma de Andalucía."**; 50.4
  "Reglamentariamente, se determinarán y desarrollarán los requisitos y las
  normas de organización y funcionamiento."
- Art. 51 (`#a5-3`): a declaración responsable made before starting work,
  covering minimum qualification, solvency, civil liability insurance and a
  code of good practice; periodic renewal; the authorities can ask for proof
  at any time.
- Art. 52 (`#a5-4`): 52.1 lists (a) the API title, (b) a university degree in
  social and legal sciences, engineering or architecture, (c) four years'
  experience immediately before the application (vida laboral, autónomo
  registration or a franchise contract), (d) membership of a COAPI. The text
  does not say whether (a)–(d) are alternatives or cumulative; the 18 Sep
  announcement says the amendment will make clear they are alternatives. For
  companies: one director or board member and the person running the premises
  open to the public. 52.2: 100 teaching hours of
  official training in the 4 years before the declaration, for the holder and
  50% of employees. 52.3: guarantee or insurance. 52.4: no criminal record
  related to property intermediation. 52.5: 52.3 and 52.4 must be kept up.
- Art. 53 (`#a5-5`): "alguno de" a financial guarantee or professional civil
  liability insurance; amounts to be set by regulation by business volume.
- Additional provision one (`#da`): the declaration forms are approved by a
  resolution of the Secretaría General de Vivienda.
- Final provision seven (`#df-7`): "En el plazo máximo de dos años desde la
  entrada en vigor de la presente ley, la Consejería competente en materia de
  vivienda adoptará las medidas necesarias para la creación, regulación y
  puesta en funcionamiento del Registro…". The deadline is **24 Jan 2028**
  (confirmed; it is arithmetic from 24 Jan 2026, not a date in the text).
- Arts. 113–114 (offences and fines) name no offence specific to the
  register. The page does not discuss sanctions, because saying what applies
  to whom would be advice.

**The two error corrections** only fix letter f) of the repeal provision
("5 de la disposición adicional segunda" → "5, la disposición adicional
segunda"); the register is untouched.
- BOJA no. 49, 12 Mar 2026, BOJA-b-2026-90047:
  https://www.boe.es/buscar/doc.php?id=BOJA-b-2026-90047
- BOE no. 72, 23 Mar 2026, BOE-A-2026-6644:
  https://www.boe.es/buscar/doc.php?id=BOE-A-2026-6644

**The agreement to open negotiations** (bilateral commission,
Subcomisión de Seguimiento Normativo, Prevención y Solución de
Controversias). Its text is identical in both gazettes: discrepancies over arts.
4, 13, 14, 24, 31, 40, **49, 50, 51, 52**, 63, 64, 66, 89, 90 and 96 and final
provision three; a working group; notified to the Constitutional Court under
art. 33.2 LOTC.
- BOE-A-2026-8197, BOE no. 90, **13 Apr 2026** (Resolución de 23 de marzo de
  2026): https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-8197
- BOJA no. 69, **13 Apr 2026** (Resolución de 17 de marzo de 2026):
  https://www.juntadeandalucia.es/boja/2026/69/32
- ⚠ **Date discrepancy, not a STOP:** the BOE dates the agreement 11 Mar
  2026, the BOJA 25 Feb 2026. The substance is identical, so the page gives
  only the publication date both agree on (13 Apr 2026) and never an
  adoption date.

**The 18 Sep 2026 agreement**, announced by the Junta (consejera Rocío Díaz,
at an Ideal breakfast in Granada):
- Junta (AVRA) news, 18/09/2026:
  https://www.juntadeandalucia.es/organismos/avra/servicios/actualidad/noticias/detalle/684223.html
- Same text from the Junta's press office (Portavoz), 18/09/2026:
  https://www.juntadeandalucia.es/presidencia/portavoz/infraestructuras/218789/LeydeViviendadeAndalucia/acuerdo/resolucion/discrepancias/normativaestatal/GobiernodeEspana/ConsejeriadeVivienda/JuventudyOrdenaciondelTerritorio
- Verbatim, on the register: "la Junta promoverá los ajustes legislativos
  necesarios para eliminar la inscripción obligatoria como requisito para
  acceder a la actividad y adecuar su regulación a los principios de
  proporcionalidad y unidad de mercado. Asimismo, se precisará el carácter
  alternativo de los requisitos establecidos y la aplicación de la normativa
  estatal en materia de colegiación."
- Also: the agreement "permite dar por concluida la controversia … sin
  judicializarla mediante un recurso al Tribunal Constitucional".
- Diario de Sevilla and El Correo de Andalucía (Sources above) carry the same
  wording. No statement from the central government was found.
- **Its text is not published yet.** The BOE daily summaries for 18–29 Sep
  2026 (open-data API `https://www.boe.es/datosabiertos/api/boe/sumario/YYYYMMDD`)
  have no item on it, and neither do BOJA issues 181–189 (17–29 Sep, sections
  1 and 3). There has been no extraordinary BOJA after no. 17 of 31 Jul 2026.
  Precedent for the lag: the 4 Jun 2026 agreement on Ley 1/2026 reached the
  BOE on 6 Jul 2026 (BOE-A-2026-14634).

**Changes since 18 Sep:** no amending law or decree-law in the BOE or the
BOJA from 18 to 29 Sep 2026, and the consolidated text is unchanged. So the
page says the law still requires registration and the Junta has committed to
change it, with no date promised (Step 1.3, second branch).

**The register has not been set up.** A BOJA full-text search (from 10 May
2012 onwards) for "Agentes Inmobiliarios Especializados", and for "registro
de agentes inmobiliarios", returns exactly two documents: the law, and
Decreto 197/2026, de 30 de julio (BOJA extraordinary no. 15, 31 Jul 2026,
https://www.juntadeandalucia.es/boja/2026/515/9), whose art. 6.2.n gives the
Secretaría General de Vivienda "El desarrollo y coordinación del Registro de
Agentes Inmobiliarios Especializados del Sector Residencial de Andalucía".
No decree creating it, no forms, no amendment. Search:
https://www.juntadeandalucia.es/eboja/buscador/search.do?eboja=on&q=%22Agentes+Inmobiliarios+Especializados%22
(A 2018–19 prior consultation on a "Registro de Personas y Agencias
Intermediarias Inmobiliarias" belongs to the repealed Ley 1/2018 and is
irrelevant.)

**Working without a title (for the FAQ):**
- Ley 10/2003, de 20 de mayo, art. 3 (BOE-A-2003-10185, unamended):
  https://www.boe.es/buscar/act.php?id=BOE-A-2003-10185#a3. The activity may
  be carried out "b) Por personas físicas o jurídicas sin necesidad de estar
  en posesión de título alguno, ni de pertenencia a ningún colegio oficial,
  sin perjuicio de los requisitos que, por razones de protección a los
  consumidores, establezca la normativa reguladora de esta actividad."
- Real Decreto-ley 4/2000, de 23 de junio, art. 3 (BOE-A-2000-11834):
  https://www.boe.es/buscar/act.php?id=BOE-A-2000-11834#a3. The same rule
  without the consumer-protection proviso ("podrán ser ejercidas libremente
  sin necesidad de estar en posesión de título alguno ni de pertenencia a
  ningún Colegio oficial"). The page quotes Ley 10/2003, the later text and
  the one that carries the proviso regional rules rely on.

**STOP conditions: none triggered.**
- The sources agree on today's status: the law requires registration, the
  register does not exist yet, and the Junta has committed to change the law.
- The closing agreement is not in the BOE yet, so there is nothing to
  contradict the press reports; the page cites the Junta's own announcement.
- The page never says whether a given person qualifies.

### What shipped

- Route `guideAndaluciaRegister`: `/guides/andalusia-agent-register` ↔
  `/es/guias/registro-agentes-inmobiliarios-andalucia`, in `MARKETING_ROUTES`,
  `CONTENT_ROUTES` and `LINKED_ROUTES`. It also goes in the sitemap (0.6,
  monthly), llms.txt `## Links`, the footer's Guides column, `marketing.json`
  (label + blurb, both languages) and the `routes.test.ts` cases.
- `src/content/pages/guide-andalusia-register.{en,es}.tsx` (`kind:
  "article"`). A "Situation as of" box, then the plan's seven sections, five
  FAQs, and related `crmMarbella`, `guideFollowUp`, `about` (plan 018 had not
  shipped). English quotes give our translation first and the Spanish
  original under it; Spanish quotes are verbatim.
- **One date.** `PUBLISHED.guideAndaluciaRegister` drives "Updated", the
  "Situation as of" box, the date inside FAQ 1, the JSON-LD dates and the
  sitemap's lastmod. The content modules read it rather than repeating it.
- **`MarketingPageContent.topic`** (new, optional). The page's JSON-LD
  `about` is a schema.org `Legislation` node for Ley 5/2025 (ELI identifier,
  date, `ES-AN`) instead of the app; other pages are unchanged
  (`content.topic ?? subject`).
- Table row headers are top-aligned locally (`align-top` on `th scope="row"`);
  `Prose` is untouched.

### Verification, 2026-09-29

- **This commit alone** (HEAD e8630b3 + this plan, in a throwaway detached
  checkout, Node 24.15 as in CI, CI's placeholder env): typecheck ✓; lint ✓
  (0 errors; the 10 warnings are pre-existing and none is in these files);
  vitest ✓, 61 files and 745 tests; `next build` ✓; `next start` serves both
  pages (200). The sitemap lists 22 URLs, including both with hreflang
  twins, lastmod 2026-09-29, monthly, 0.6, and llms.txt has the line.
- **Rendering** (dev server, EN + ES at 320 px with mobile emulation and at
  1280 px): no horizontal overflow (scrollWidth = clientWidth), and the table
  is 288 px at 320. The JSON-LD parses into Article (`about`: Legislation),
  BreadcrumbList and FAQPage (5). Canonical and hreflang en/es/x-default are
  correct, and `index, follow`. The markdown twin (`Accept: text/markdown`)
  answers 200 `text/markdown` with `Vary: Accept`.
- **Links**: all 16 external source URLs answer 200 and every BOE anchor
  exists; the internal links answer 200.
- Seen, pre-existing, not fixed here: the markdown twin of every written
  page drops the page header (H1 + lead).

### Monthly re-check (until the amending law passes, then once when the register opens)

1. BOE consolidated text: does "Última actualización" still say 24/12/2025,
   and do the "Referencias posteriores" list anything new?
2. BOE daily summaries since the last check (open-data API, see above): any
   "Comisión Bilateral … Andalucía" item on Ley 5/2025?
3. BOJA search for "Agentes Inmobiliarios Especializados" (two results on
   2026-09-29), and "Comisión Bilateral" + "Vivienda de Andalucía" (only the
   April agreement).
4. Junta news (AVRA and Portavoz) for "agentes inmobiliarios".
5. If anything changed, update the situation box, sections 3–4, the
   timeline, the FAQ and the Sources in both languages. Bump
   `PUBLISHED.guideAndaluciaRegister` either way, and re-run the link check.
6. When the agreement's text appears, compare it with the press release
   (STOP condition 2) before quoting it on the page.
