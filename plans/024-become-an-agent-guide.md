# Plan 024: How to become an estate agent in Spain, region by region

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> "STOP conditions" item occurs, stop and report; do not improvise. When done,
> update this plan's row in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 75b76fa..HEAD -- src/lib/routes.ts src/lib/seo.ts src/components/landing/footer.tsx src/app/sitemap.ts src/app/llms.txt/route.ts messages/en/marketing.json messages/es/marketing.json messages/ru/marketing.json src/content/pages/guide-andalusia-register.es.tsx src/content/pages/tool-earnings.es.tsx`
>
> **Shared working tree**: stage only the files this plan names; never
> `git add -A`.

## Status

- **Priority**: P2
- **Effort**: M, about 1–1.5 days. The research is done (see "Facts as
  researched"). The work is re-checking the regional rows, three content
  modules, and the wiring.
- **Risk**: MEDIUM.
  - Regional rules move: Baleares changed in June 2026, and the
    Andalucía agreement reached the BOE on 19 Oct 2026.
  - Some requirements were annulled by a court.
  - So the page must be dated, sourced per row, and never say whether a
    given person qualifies.
- **Depends on**: nothing to build. It links to the Andalucía register guide,
  which must already reflect BOE-A-2026-21762 (see STOP conditions).
- **Gate**: every regional row is re-verified on build day. Title chosen:
  A (19 Oct 2026).
- **Planned at**: commit `75b76fa`, 2026-10-19

## Why this page

**Demand.** Keyword Planner, 18 Oct 2026 (Spain, Spanish, ranges only; memory
`project_keyword_planner_oct2026.md`):

| Search | Monthly searches | Notes |
|---|---|---|
| cómo ser agente inmobiliario | 100–1K | high competition; course sellers bid €1.16–3.15 |
| agente inmobiliario | 1K–10K | |
| asesor inmobiliario | 1K–10K | |
| agente inmobiliario que es | 100–1K | |
| curso agente inmobiliario | 100–1K | |
| curso api | 100–1K | |

About 15 more variants get 10–100 each:
- como hacerse agente inmobiliario
- como ser agente inmobiliario independiente
- como ser asesor inmobiliario
- requisitos para colegiarse como api
- agente inmobiliario autónomo
- asesor inmobiliario autonomo
- cuota autónomo agente inmobiliario
- contrato agente inmobiliario autónomo
- trabajar como agente inmobiliario autonomo

In English, "how to become an estate agent in Spain" gets 10–100.

**Who ranks** (google.es, 19 Oct 2026, via SearchAPI):
- "cómo ser agente inmobiliario":
  - recruiting networks: join-iad.es, remaxinmomas, luxinmo, gerah;
  - course sellers: masterd, davante, futurpiso;
  - a YouTube course.
- "requisitos para ser agente inmobiliario en españa":
  - aicat.barcelona (Catalonia only);
  - davante, iad, RE/MAX, floorfy, aprendemas, abini, indeed.
- In English: idealista, Engel & Völkers (recruiting), a Reddit thread,
  selfemployedspain, FEI business school, luxinmo.
- Every search shows an AI Overview.
- People also ask:
  - "¿Cómo ser API?"
  - "¿Cuál es el epigrafe de agente inmobiliario?"
  - "¿Qué tengo que estudiar para ser agente inmobiliario?"
  - "¿Cuánto dinero se necesita para abrir una inmobiliaria?"

**The opening**:
- Almost every result is written by someone who wants to recruit the reader
  or sell them a course.
- None gives a sourced, region-by-region answer to "what does the law actually
  require".
- None says that registration is voluntary in Madrid and Baleares, or that a
  court annulled part of Valencia's register.
- None gets the IAE heading right: several say 723, which is "Administradores
  de fincas".

**Why it's worth it for LeadWing**:
- The people searching are starting out, and they need a way to track buyers
  and sellers from day one.
- It links naturally to the earnings calculator (plan 021), the Andalucía
  guide (plan 020) and the portal-prices guide (plan 023).

## Decisions

| Topic | Decision |
|---|---|
| Form | A guide (`kind: "article"`) at `/es/guias/como-ser-agente-inmobiliario` ↔ `/guides/how-to-become-estate-agent-spain` ↔ `/ru/gaidy/kak-stat-rieltorom-v-ispanii`, route key `guideBecomeAgent`. Spanish is the main version; EN and RU are twins (RU is Claude's translation, as in plan 022). |
| No lawyer, no advice | Quote and link the law; describe what each text requires. Never say whether a reader qualifies, which route to take, or which region is "easier". One line near the top: "Esta página resume la normativa; no es asesoramiento jurídico ni fiscal". |
| No courses, no networks | Never recommend a course, school, franchise or network. The 200 hours appear only where a law or decree sets them. |
| CNMC | No commission %, split or "typical" earnings anywhere. Earnings questions link to the calculator. |
| Money facts | Cuota, tarifa plana, IRPF withholding and modelo 130 are already explained and sourced on the earnings calculator. Summarise each in one line and link there instead of repeating. **No 2026 tarifa plana amount**: no BOE text sets it (see Facts). |
| CTA | Honest about today's product: LeadWing is a CRM for independent agents, free up to 10 clients, with leads pasted in and no portal integration. Mention the free tools (client spreadsheet, commission and earnings calculators) as "what you need on day one". "Free" stays out of the headline. |
| Dated | "Situación a <date>" at the top. `PUBLISHED.guideBecomeAgent` = launch day. Each re-check bumps `CHECKED.guideBecomeAgent`, never `PUBLISHED`. |
| Structured data | `topic: { "@type": "Occupation", name: "Agente inmobiliario", occupationLocation: { "@type": "Country", name: "España" } }` (localised name per language). |

## Title options (≤ 60 characters)

**Founder's pick (19 Oct 2026): A.** ES "Cómo ser agente inmobiliario en
España: requisitos 2026", EN "How to become an estate agent in Spain: 2026
rules", RU "Как стать риелтором в Испании: требования 2026". The other options
are kept below for the record.

**Spanish**:
- **A (recommended):** "Cómo ser agente inmobiliario en España: requisitos 2026" (54 characters).
  It matches the 100–1K head term word for word and promises the answer.
- **B:** "Requisitos para ser agente inmobiliario en España (2026)" (55).
  It matches the "requisitos" searches where aicat.barcelona ranks.
- **C:** "Cómo ser agente inmobiliario: lo que exige cada comunidad" (57).
  It leads with the differentiator, the region table.
- **D:** "¿Hace falta título para ser agente inmobiliario? (2026)" (55).
  It leads with the misconception the course sellers rely on.

**English**:
- **A (recommended):** "How to become an estate agent in Spain: 2026 rules" (50)
- **B:** "Do you need a licence to be an estate agent in Spain?" (52)
- **C:** "Estate agent requirements in Spain, region by region" (52)

**Russian** (follows the Spanish pick): "Как стать риелтором в Испании: требования 2026" (46).

**H1 (ES)**: "Cómo ser agente inmobiliario en España: qué exige la ley, comunidad por
comunidad".

**Lead (ES), written so it can be quoted as is**:
- En España no hace falta título ni colegiarse para ser agente inmobiliario
  (Ley 10/2003, art. 3).
- Lo que cambia es la comunidad. Cataluña y la Comunitat Valenciana obligan a
  inscribirse en un registro. Andalucía lo exige en la ley, pero se ha
  comprometido a quitarlo. En Madrid, Baleares, Navarra, Canarias y el País
  Vasco el registro es voluntario.
- Aquí tienes qué pide cada una, con su fuente, y los pasos para empezar como
  autónomo.

## Steps

### Step 1: Re-verify the facts (build day)

Re-open every official link in "Facts as researched". Record the result in an
"As built" section at the end of this plan.
1. **The national rule.** Confirm Ley 10/2003 art. 3 and RDL 4/2000 art. 3 are
   unamended, and RD 1294/2007 art. 1.1.b and its preamble on voluntary
   colegiación.
2. **Each regional row**, against its official bulletin:
   - **Cataluña**: Ley 18/2007 art. 55 and Decreto 12/2010 arts. 8, 11 and 12
     plus the 200 hours. Check for any resolution updating the amounts.
   - **C. Valenciana**: Decreto 98/2022, and what TSJCV sentence 706/2024
     annulled. Read the sentence itself in CENDOJ, or the DOGV notice of its
     ruling. Only state as annulled what the sentence says.
   - **Baleares**: Ley 3/2024 DA 13ª and 14ª as rewritten by Ley 4/2026 DF 27.
     Settle whether DA 13ª's establishment, guarantee and RC duties bind agents
     who don't register (see STOP).
   - **Andalucía**: BOE-A-2026-21762 (19 Oct 2026), and whether an amending
     law has followed.
   - **Madrid**: Decreto 8/2018 art. 1 and the RAIN page. Check whether the
     announced move to a mandatory register has reached the BOCM.
   - **Navarra**: Decreto Foral 33/2019. **Canarias**: Decreto 11/2022, and
     pull its registration requirements.
   - **País Vasco**: Ley 3/2015 DA 1ª.3 and STC 97/2018. Check whether a
     decree now exists.
   - **The "none found" communities**: one search per community in its
     official bulletin (not only the web) for "agentes inmobiliarios" +
     "registro". Asturias and Aragón had announced plans.
3. **Autónomo facts**:
   - modelo 036 (037 abolished);
   - the IAE headings and the natural-person exemption;
   - the RETA deadline;
   - Orden PJC/297/2026 art. 18;
   - the tarifa plana status (is a 2026 amount in any BOE text yet?);
   - RIRPF art. 95;
   - Verifactu dates (has the announced postponement to 2028 reached the
     BOE?).
4. **Obligations**: Ley 10/2010 art. 2.1.l and the obligation articles; RD
   515/1989; Ley 12/2023 art. 31.

### Step 2: The copy, `src/content/pages/guide-become-agent.{es,en,ru}.tsx`

Write Spanish first, then the twins. Put sources in a shared
`guide-become-agent.sources.ts`, as plan 023 did.

**Sections**:
1. **Situación a <date>**, a callout:
   - no national title;
   - mandatory registers in two communities, one being removed in Andalucía;
   - voluntary in five;
   - "no es asesoramiento jurídico ni fiscal".
2. **Lo que dice la ley estatal**:
   - Ley 10/2003 art. 3.b, with a short quote, and RDL 4/2000 art. 3;
   - the API title and colegiación as an option, not a requirement (RD
     1294/2007);
   - who may call themselves "agente de la propiedad inmobiliaria" (art. 2.1).
3. **Comunidad por comunidad**, one narrow table (fits 320 px, as in plan
   023). Columns: Comunidad · Registro · Qué pide para inscribirse.
   - **Rows**: Cataluña, C. Valenciana, Andalucía, Illes Balears, Madrid,
     Navarra, Canarias, País Vasco.
   - Then one line listing the communities with no register found, with "how
     we checked" and the date.
   - Under the table, one short paragraph per row with its sources:
     - Valencia names the 2024 annulment.
     - Andalucía links the existing guide.
     - Baleares explains the 2026 change.
4. **Darte de alta como autónomo, paso a paso**:
   1. Alta censal with modelo 036, before you start (037 no longer exists).
   2. The IAE heading:
      - 721 if you are a colegiado;
      - otherwise, as the DGT has answered: 724 for sales from property
        developments, 799 for rentals, 834 only if it's a business activity;
      - individuals don't pay IAE (TRLRHL art. 82.1.c).
      - Note that 723 is "Administradores de fincas".
   3. Alta in RETA before you start, up to 60 days ahead (Import@ss).
   4. The cuota depends on your real income (Orden PJC/297/2026 art. 18).
      Link the earnings calculator. The tarifa plana exists (LETA art. 38
      ter); its amount is set by the budget law, so point to the Seguridad
      Social for the current figure.
   5. Invoices:
      - IVA 21%;
      - withholding 15% (7% in your first three tax years) when you bill a
        company;
      - no withholding from private clients, then modelo 130;
      - modelo 303 every quarter.
   6. Invoicing software (Verifactu): required for individuals before 1 July
      2027, per the BOE as of the check date.
5. **Si trabajas para una red o una agencia**, facts only:
   - autónomo vs employee;
   - TRADE if 75% or more of your income comes from one client;
   - the contract must be in writing and registered at the SEPE (worker
     within 10 working days);
   - no official source treats franchise agents specially, so don't imply
     one does.
6. **Lo que la ley te exige desde la primera operación**, one line each with a
   link:
   - **Ley 10/2010**: you are a "sujeto obligado" (art. 2.1.l). That means
     identifying the client and beneficial owner, a written risk analysis,
     reporting to SEPBLAC, keeping records for 10 years and training.
     Rentals count only from €10,000 a month.
   - **RD 515/1989**: information and advertising when offering homes to
     consumers, including that the price shown includes agency fees and IVA
     where applicable.
   - **Ley 12/2023 art. 31**: the information a buyer or tenant can ask for
     before paying anything.
   - **Don't** cover LAU art. 20 (who pays rental fees). It's in flux (RDL
     29/2026 not yet ratified) and belongs to the commission calculator's
     "who pays" section.
7. **¿Cuánto se gana?**: two lines and a link to the earnings calculator. No
   figures.
8. **Lo que necesitas el primer día**, the CTA:
   - a way to keep every buyer and seller with their next step;
   - the free spreadsheet;
   - LeadWing (free up to 10 clients, leads pasted in);
   - the portal-prices guide if you're choosing portals.
9. **Fuentes**, each with its check date.

**FAQ**, answered only from the facts, plain text:
- ¿Hace falta título para ser agente inmobiliario en España?
- ¿Tengo que ser API o colegiarme?
- ¿Qué epígrafe del IAE tiene un agente inmobiliario?
- ¿Hay que inscribirse en un registro de agentes inmobiliarios?
- ¿Qué hay que estudiar para ser agente inmobiliario? (Nothing nationally;
  for Cataluña's and Valencia's registers, the training their decrees set.)
- ¿Cuánto cuesta darse de alta como autónomo? (It depends on income: the
  2026 table, the tarifa plana under the budget law, and the calculator.)

**Related**: `toolEarnings`, `guideAndaluciaRegister`, `guidePortalPrices`.
Link back from the earnings calculator and the Andalucía guide (one sentence
each, plus `related`).

### Step 3: Wiring (mirror `guidePortalPrices`)

- **Route key `guideBecomeAgent`**: add it to `MARKETING_ROUTES`,
  `CONTENT_ROUTES` and `LINKED_ROUTES`.
- **Pages**: three files under `src/app/{es/guias,guides,ru/gaidy}/…/page.tsx`.
- **Dates**: `PUBLISHED.guideBecomeAgent` and `CHECKED.guideBecomeAgent`.
- **Copy**: label and blurb in `messages/{en,es,ru}/marketing.json`.
- **Sitemap**: 0.6, monthly.
- **llms.txt**: one line.
- **Footer**: add it to `GUIDE_LINKS` (it becomes the column's first entry:
  it's the broadest guide).
- **Tests**: the three paths in `routes.test.ts`.

### Step 4: Verify

As in plan 023:
- Typecheck, lint, test and build are green under Node 24.
- **Pages**:
  - All three return 200 on `next start`.
  - JSON-LD has Article, BreadcrumbList and FAQPage (plus the Occupation
    topic).
  - hreflang is present and the markdown twin renders GFM tables (no list
    inside a cell).
- **Layout**:
  - At 320 px, `scrollWidth` stays 320 and the table stays inside the
    column, in all three languages.
  - Russian brand and region names don't break mid-word.
  - Check 1280 px too.
- **Links and copy**:
  - Every source opens (bot walls checked in a browser).
  - No `</strong>[a-z]` glue in `<main>`.

## Done criteria

- **Pages**: all three are live, dated and sourced, region by region, and
  wired into the sitemap, llms.txt and the footer.
- **Cross-links**: the earnings calculator and the Andalucía guide link to the
  new page.
- **Record**: the "As built" section lists every regional fact with its URL
  and check date, and the README row is updated.

## STOP conditions

- **The Andalucía guide is out of date.** It doesn't yet mention
  BOE-A-2026-21762 (19 Oct 2026). Update it first, under plan 020's monthly
  re-check, so the two pages don't contradict each other.
- **Baleares is unclear.** You can't confirm from the text whether Baleares'
  DA 13ª duties (establishment, €60,000 guarantee, RC) bind agents who don't
  register. Write the row as "registro voluntario; la ley mantiene requisitos
  de actividad en su DA 13ª" only if the text supports it; otherwise report.
- **Valencia's annulment can't be read.** The TSJCV sentence's scope can't be
  read from an official source. Report rather than guess which requirements
  survive.
- **A region has changed.** Any regional rule changed after 19 Oct 2026 in a
  way the table can't describe in one row.
- **The copy drifts into advice.** It would have to say whether a reader
  qualifies, which IAE heading *they* should use, or recommend a course or
  network.

## Maintenance notes

- **Re-check every quarter**, and bump `CHECKED.guideBecomeAgent` each time.
- **Things to watch**:
  - Andalucía's amending law (plan 020's monthly check);
  - Madrid's announced mandatory register;
  - Asturias and Aragón;
  - a 2026–27 budget law setting the tarifa plana;
  - Verifactu dates;
  - the yearly cotización order.

## Notes for other plans

- **020 (Andalucía guide)**:
  - BOE-A-2026-21762 (19 Oct 2026) publishes the 17 Sep 2026 State–Andalucía
    agreement. The Junta commits to amend arts. 49–52 to "suprimir las
    referencias a la inscripción registral obligatoria para el acceso a la
    actividad", to make the art. 52 requirements alternatives, and to leave
    colegiación to State law.
  - The live guide still says the agreement was unpublished. Update it now.
- **018 (commission calculator, "who pays")**:
  - Its rentals answer cites LAU art. 20.1.
  - RDL 29/2026 (BOE 7 Oct 2026) rewrote LAU art. 20 after Congress repealed
    RDL 26/2026 on 2 Oct 2026, and it isn't ratified as of 19 Oct 2026.
  - Re-read art. 20 in its current consolidated text and check that the
    page's sentence and anchor still hold.
- **021 (earnings calculator)**: its tarifa plana paragraph names no amount,
  which is right. The Seguridad Social's guide still says €80, but no BOE text
  sets a 2026 figure.

## Facts as researched (19 Oct 2026; re-verify in Step 1)

### National rule

- **Ley 10/2003 art. 3.b**: anyone may work as an intermediary "sin necesidad
  de estar en posesión de título alguno, ni de pertenencia a ningún colegio",
  subject to consumer-protection rules. Art. 3.a keeps the API route.
  https://www.boe.es/eli/es/l/2003/05/20/10/con (never amended).
- **RDL 4/2000 art. 3**: the activities "podrán ser ejercidas libremente sin
  necesidad de estar en posesión de título alguno".
  https://www.boe.es/eli/es/rdl/2000/06/23/4/con (consolidated 11 Oct 2011).
- **RD 1294/2007**: art. 1.1.b lists the "Título Oficial de Agente de la
  Propiedad Inmobiliaria" as one route to colegiación; any university degree
  is another. Art. 2.1 reserves the name "agente de la propiedad
  inmobiliaria" for practising colegiados. The preamble says "la colegiación
  se alza sobre el principio de voluntariedad".
  https://www.boe.es/eli/es/rd/2007/09/28/1294/con
  - No recent ministry call for the API title was found, so don't say whether
    it's still issued.

### Regions

- **Cataluña: mandatory.**
  - Ley 18/2007:
    - art. 55.3: an establishment (or a physical address if online),
      capacitación, a guarantee and RC insurance;
    - art. 55.4: "debe crear un registro obligatorio de agentes
      inmobiliarios";
    - art. 56.4: not registering doesn't void contracts.
    - https://www.boe.es/eli/es-ct/l/2007/12/28/18/con (25 Mar 2026)
  - Decreto 12/2010:
    - art. 12: the register "es de carácter obligatorio";
    - annex 1: a related degree, or courses of at least 200 teaching hours;
    - art. 8: a €60,000 guarantee per establishment per year (€300,000
      online-only);
    - art. 11: RC of €100,000 per claim and €600,000 a year (€150,000 /
      €1,000,000 online).
    - https://portaljuridic.gencat.cat/eli/es-ct/d/2010/02/02/12
  - Procedure page:
    https://tramits.gencat.cat/es/tramits/tramits-temes/Registre_Agents_Immobiliaris_Catalunya
- **C. Valenciana: mandatory, partly annulled.**
  - Ley 2/2017 DA 6ª. Decreto 98/2022 art. 4.1: "gratuito y de carácter
    obligatorio".
    https://dogv.gva.es/es/eli/es-vc/d/2022/07/29/98/ (DOGV 9405, 16 Aug 2022)
  - Original art. 3: an address in the region, 200 hours, a €60,000
    guarantee (€300,000 online), RC of €600,000 (€1,000,000 online).
  - TSJCV sentence 706/2024 (13 Dec 2024), on a CNMC appeal, annulled:
    - the guarantee and RC amounts;
    - the duty for occasional agents to notify;
    - the proof required from agents registered elsewhere.
    - It called the online surcharge "desigual y notablemente
      discriminatorio".
    - Judiciary (CGPJ) press note, 17 Jan 2025:
      https://www.poderjudicial.es/cgpj/es/Poder-Judicial/Tribunales-Superiores-de-Justicia/TSJ-Comunidad-Valenciana/Oficina-de-Comunicacion/Archivo-de-notas-de-prensa/El-TSJCV-estima-un-recurso-de-la-CNMC-y-anula-varios-requisitos-del-Registro-de-Agentes-de-Intermediacion-Inmobiliaria-de-la-Comunidad-Valenciana
    - The CNMC marks it final: https://www.cnmc.es/expedientes/la032022
  - Whether "capacitación" (the 200 hours) was annulled too is unclear. A
    secondary source says all of art. 3.b; verify in Step 1.
- **Illes Balears: voluntary since 14 Jun 2026.**
  - Ley 4/2026 DF 27 rewrote Ley 3/2024 DA 14ª: "La inscripción en este tiene,
    en todo caso, carácter voluntario". It also emptied DA 13ª point 9
    (capacitación).
  - DA 13ª still lists an establishment or postal address (pt 8), a €60,000
    guarantee (pt 13) and RC of €100,000 / €600,000 (pt 16.1).
  - https://www.boe.es/buscar/act.php?id=BOE-A-2024-15575 (13 Jun 2026)
- **Andalucía: mandatory in the law, being removed.**
  - Ley 5/2025 art. 50.1: "público, administrativo, gratuito y obligatorio".
    BOE consolidated text unchanged:
    https://www.boe.es/buscar/act.php?id=BOE-A-2026-423
  - BOE-A-2026-21762 (19 Oct 2026) publishes the agreement to remove it.
    https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-21762
- **País Vasco: voluntary in effect, no decree found.**
  - Ley 3/2015 DA 1ª.3. https://www.boe.es/eli/es-pv/l/2015/06/18/3/con
  - STC 97/2018 FJ 7 c: the register "deberá establecer que la inscripción es
    voluntaria y con efectos meramente informativos".
    https://www.boe.es/diario_boe/txt.php?id=BOE-A-2018-13995
- **Madrid: voluntary.**
  - Decreto 8/2018 art. 1: "La inscripción en el mismo tendrá, en todo caso,
    carácter voluntario".
  - To register: a degree, 200 hours or 4 years' experience (art. 6), a
    €60,000 guarantee and RC of €100,000 / €600,000 (art. 7).
  - https://www.bocm.es/boletin/CM_Orden_BOCM/2018/02/16/BOCM-20180216-1.PDF
  - RAIN page: https://www.comunidad.madrid/vivienda/registro-agentes-inmobiliarios-rain
  - A mandatory plan (29 Jun 2026) appears only in the press.
- **Navarra: voluntary.**
  - Decreto Foral 33/2019 art. 4.1. To register: 200 hours (art. 8.d), a
    €30,000 guarantee, RC of €100,000 / €600,000 (art. 9).
  - https://bon.navarra.es/es/anuncio/-/texto/2019/92/0/
- **Canarias: voluntary.** Decreto 11/2022 art. 4.2.
  https://www.gobiernodecanarias.org/boc/2022/021/001.html (requirements not
  yet pulled).
- **None found** (web search per region, 19 Oct 2026): Galicia, Cantabria,
  Castilla-La Mancha, Castilla y León, Extremadura, Murcia, La Rioja.
  Asturias (decree announced Nov 2024) and Aragón (2024–25 bill) have nothing
  published.

### Becoming an autónomo

- **Modelo 036**:
  - Orden HAC/1526/2024 abolished modelo 037 from 3 Feb 2025:
    https://www.boe.es/boe/dias/2025/01/09/pdfs/BOE-A-2025-410.pdf
  - File it "antes de iniciar las correspondientes actividades":
    https://sede.agenciatributaria.gob.es/Sede/ayuda/calendario-contribuyente/calendario-contribuyente-2026/informacion-sobre-presentacion-modelos-no-periodicos/modelo-036.html
- **IAE** (RDLeg 1175/1990): https://www.boe.es/buscar/act.php?id=BOE-A-1990-23930
  - **Section 2, group 721**: "Agentes colegiados de la propiedad industrial y
    de la propiedad inmobiliaria".
  - **Section 2, group 723**: "Administradores de fincas" (not agents).
  - **Section 2, group 724**: "Intermediarios en la promoción de
    edificaciones".
  - **Section 2, group 799**: "Otros profesionales relacionados con las
    actividades financieras, jurídicas, de seguros y de alquileres".
  - **Section 1, group 834**: covers intermediaries "siempre que no deban
    clasificarse en la sección 2.ª".
  - **DGT rulings**:
    - V2188-21 (30 Jul 2021): a non-colegiado natural person goes under 724
      for sales from developments, 799 for rentals, and 834 only if it's a
      business activity.
    - V0113-23 (2 Feb 2023): a colegiado goes under 721.
    - Both were read through reproductions; open them in the DGT database
      (petete.tributos.hacienda.gob.es) on build day.
  - **Exemption**: TRLRHL art. 82.1.c, "Las personas físicas, sean o no
    residentes". https://www.boe.es/buscar/act.php?id=BOE-A-2004-4214
- **RETA**: "solicitar el alta antes de iniciar tu actividad", with an
  "antelación máxima de 60 días".
  https://portal.seg-social.gob.es/wps/portal/importass/importass/Categorias/Altas,+bajas+y+modificaciones/Altas+y+afiliacion+de+trabajadores/Alta_trabajo_autonomo
- **Cuota**: Orden PJC/297/2026 art. 18.
  https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-7296
- **Tarifa plana**:
  - LETA art. 38 ter.1: the amount "se establecerá en la respectiva Ley de
    Presupuestos Generales del Estado".
    https://www.boe.es/buscar/act.php?id=BOE-A-2007-13409
  - RDL 13/2022 DT 5ª set €80 for 2023–2025.
  - **No BOE text sets a 2026 amount**: the budget was rolled over, and RDL
    3/2026 doesn't mention it. Import@ss's undated guide still says €80. Don't
    publish an amount.
- **IVA**: 21% (LIVA art. 90).
- **Withholding** (RIRPF art. 95):
  - 15%, or 7% "en el período impositivo de inicio de actividades y en los dos
    siguientes" if there was no activity the year before and the agent tells
    the payer;
  - section 2 activities are professional;
  - so are comisionistas who "se limitan a acercar o a aproximar a las
    partes".
  - Private clients don't withhold (art. 76.1).
  - https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820
- **Modelos 130 and 303**:
  - modelo 130 at 20%, waived at 70% withheld (RIRPF arts. 109–110; AEAT
    procedure G601);
  - modelo 303 every calendar quarter (RIVA art. 71.3; AEAT procedure G414).
- **TRADE**:
  - LETA arts. 11.1 (at least 75% of income from one client) and 12.1 (a
    written contract, registered).
  - RD 197/2009 art. 6: the worker registers it within 10 working days.
    https://www.boe.es/buscar/act.php?id=BOE-A-2009-3673
  - SEPE service:
    https://sede.sepe.gob.es/portalSede/es/procedimientos-y-servicios/personas/contratos/TAED
- **Verifactu**:
  - RD 1007/2023 as rewritten by RDL 15/2025 DF 1ª: individuals before
    1 Jul 2027. https://www.boe.es/buscar/doc.php?id=BOE-A-2025-24446
  - Hacienda's note of 5 Oct 2026 announces a postponement to Oct 2028; it is
    not in the BOE.

### Obligations

- **Ley 10/2010 (anti-money-laundering)**:
  - art. 2.1.l covers "quienes ejerzan profesionalmente actividades de
    agencia, comisión o intermediación en la compraventa de bienes inmuebles";
    rentals only from €10,000 a month;
  - identification: arts. 3–6;
  - written risk analysis: art. 7.1;
  - reporting to SEPBLAC: arts. 17–18;
  - records kept 10 years: art. 25;
  - written policies: art. 26;
  - training: art. 29.
  - https://www.boe.es/eli/es/l/2010/04/28/10/con
- **RD 515/1989** (information when offering homes to consumers): arts. 1, 3,
  4 and 6.1.1º. The price shown includes "en su caso, los honorarios de Agente
  y el IVA". https://www.boe.es/eli/es/rd/1989/04/21/515/con
- **Ley 12/2023 art. 31**: the minimum information a buyer or tenant can ask
  for before paying; art. 31.3 adds the previous rent in stressed zones.
  https://www.boe.es/eli/es/l/2023/05/24/12/con

## Sources for the demand

- Keyword Planner, 18 Oct 2026; summary in memory as
  `project_keyword_planner_oct2026.md`.
- SearchAPI results pages (19 Oct 2026), kept in that session's scratchpad.

## As built (2026-10-19)

### Order

1. **Fixes first**, pushed as `d1e8c73`.
   - The Andalucía guide now quotes BOE-A-2026-21762 (plan 020's re-check
     note).
   - The commission calculator's rental "who pays" line cites LAU art. 20.2
     as worded by RDL 29/2026 (plan 018's re-check note).
2. **This guide** in its own commit.

### Step 1: the facts, re-verified on build day

All of these were checked against the official text.

**Confirmed as planned**:
- Cataluña: Decreto 12/2010 arts. 8, 11, 12 and annex 1; Ley 18/2007 arts.
  55.3–55.4 and 56.4.
- Madrid: Decreto 8/2018 arts. 1, 6 and 7. The guarantee is €60,000 per
  office, or per agent if online-only, with no online surcharge.
- Andalucía: BOE-A-2026-21762, plus Ley 5/2025 unchanged since 24 Dec 2025.
- DGT ruling V2188-21 (724 for sales of new developments, 799 for rentals,
  834 only for business-style activity) and V0113-23 (721 for colegiados),
  both read on petete.

**Corrected**:
- **Valencia**: the full TSJCV sentence 706/2024 (Roj STSJ CV 5929/2024,
  official PDF on poderjudicial.es) annuls:
  - art. 3.b, the whole training requirement, 200 hours included;
  - "las cuantías determinadas de los avales y seguros de caución";
  - the "in the Comunidad Valenciana" address for online agents;
  - art. 2.2 (notices from occasional and out-of-region agents);
  - art. 6 a), d) and e).

  Whether the RC amount was annulled is unclear: the sentence's reasoning
  argues against fixed insurance amounts, but its ruling (FJ 11) names
  only "avales y seguros de caución". The page doesn't claim the RC amount
  was annulled. Art. 4.1 (compulsory) wasn't challenged.
- **Baleares**:
  - DA 13ª applies to *every* agent working in Baleares ("las personas
    físicas o jurídicas que ejercen o tengan que ejercer como agentes
    inmobiliarios"), registered or not.
  - It requires premises, or a postal address in Baleares for online-only
    agents; a guarantee of "60.000 euros por año de cobertura" (not per
    office); and RC of €100,000 / €600,000.
  - DF 27.2 emptied the training point, which now applies only to
    registration (DA 14ª pt 15).
  - Not on the page: DA 13ª 7.1.a still lists "inscribirse en el Registro
    oficial" as a duty, a leftover the reform didn't touch.
- **Navarra**: art. 9.4 adds 50% for online-only agents.
- **Canarias** (Decreto 11/2022), pulled:
  - premises open to the public, or a physical address in Canarias for
    online agents (art. 6);
  - one of: API colegiado, 4 years' experience, a degree, or 200 hours
    (art. 7);
  - a €30,000 guarantee per office in the Caja de Depósitos, which RC
    insurance of at least that capital can replace (art. 8).
- **País Vasco**:
  - The plan's quote, "deberá establecer que la inscripción es voluntaria y
    con efectos meramente informativos", appears in STC 97/2018, but as part
    of the parties' arguments.
  - The Court's own holding (FJ 7 c) is to "excluir la interpretación de que
    … regule la inscripción registral como presupuesto o título habilitante
    del ejercicio de la actividad inmobiliaria en el País Vasco". The page
    quotes that.
  - No implementing decree exists (Decreto 55/2026 doesn't mention agents).
- **IAE**: neither DGT ruling sets a heading for brokering second-hand
  resales. The page and FAQ say so and point to the Agencia Tributaria.

**"None found"**: each region's official bulletin was searched (BOA, BOPA,
DOG, BOC, DOCM, BOCYL, DOE, BOR; BORM through web search because of a
captcha) for 2018–2026, and none has an agents' register.

### What shipped

- **Content**: `src/content/pages/guide-become-agent.{es,en,ru}.tsx` plus the
  shared `guide-become-agent.sources.ts`, with 33 sources, all returning 200
  on 19 Oct 2026.
- **Routes**: `/es/guias/como-ser-agente-inmobiliario` ↔
  `/guides/how-to-become-estate-agent-spain` ↔
  `/ru/gaidy/kak-stat-rieltorom-v-ispanii`.
- **Titles**:
  - ES (title A): "Cómo ser agente inmobiliario en España: requisitos 2026"
  - EN: "How to become an estate agent in Spain: 2026 rules"
  - RU: "Как стать риелтором в Испании: требования 2026"
- **Descriptions** trimmed to 149–153 characters (the test caps them at 160).
- **The region table** has two columns (region · register), with one section
  per region underneath; it fits a 320 px phone.
  - Russian region names opt out of the `overflow-wrap: anywhere` rule
    (`NAME_CELL`).
  - Numbers and units are held together with no-break spaces in ES and RU.
- **Structured data**: Article "about" is an `Occupation` with
  `occupationLocation` Spain, localised.
- **Wiring**:
  - `guideBecomeAgent` added to `MARKETING_ROUTES`, `CONTENT_ROUTES` and
    `LINKED_ROUTES`.
  - `PUBLISHED` and `CHECKED` both 2026-10-19; sitemap 0.6, monthly.
  - Label and blurb in the three `marketing.json` files, an llms.txt line,
    the first entry in the footer's Guides column, and three paths in
    `routes.test.ts`.
- **Cross-links**: the earnings calculator (after the tarifa plana paragraph,
  plus `related`) and the Andalucía guide (after "what applies today", plus
  `related`), in three languages.

### Verification, 2026-10-19 (Node 24)

- `npm run typecheck`: clean.
- `npx vitest run`: 1,151/1,151 (after trimming the three descriptions).
- `npm run lint`: 0 errors; the 10 warnings are in untouched files.
- `npm run build`: green, with the three new routes.
- **`next start`, all six touched pages** (the three new ones, the Andalucía
  guide, and the commission and earnings calculators):
  - all return 200 with valid JSON-LD;
  - no SWC glue;
  - cross-links and the BOE reference are present.
- **Discovery**: the markdown twin renders the region table as GFM;
  llms.txt and the sitemap list the new URLs.
- **Layout**:
  - At 320 px, all seven checked pages have `scrollWidth` 320, and every
    table ends at 304 px.
  - The RU region table renders whole names.
  - 1280 px checked in ES.

### Maintenance

- **Re-check quarterly**, and bump `CHECKED.guideBecomeAgent` each time.
- **Things to watch**:
  - Andalucía's amending law (plan 020's monthly check), and BOJA's
    publication of the agreement;
  - Madrid's reported plan for a mandatory register (press only so far);
  - Asturias and Aragón;
  - a budget law fixing the 2026–27 tarifa plana;
  - Verifactu (Hacienda announced a move to Oct 2028 on 5 Oct 2026; not in
    the BOE yet);
  - the yearly Orden de cotización;
  - Valencia's register forms, after the annulment.
