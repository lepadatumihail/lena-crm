import Link from "next/link";

import { intlTag } from "@/i18n/config";
import { marketingPath } from "@/lib/routes";
import { CHECKED, PUBLISHED } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";

const L = "en";

/** The page was first published on this day, which stays its datePublished. */
const FIRST_PUBLISHED = PUBLISHED.guideAndaluciaRegister;

/**
 * The day every fact below was last checked against its source. It is also
 * the page's "Updated" date, its dateModified and its sitemap lastmod, so a
 * monthly re-check bumps CHECKED.guideAndaluciaRegister, never PUBLISHED.
 */
const LAST_CHECKED = CHECKED.guideAndaluciaRegister ?? FIRST_PUBLISHED;

const AS_OF = new Intl.DateTimeFormat(intlTag(L), {
  dateStyle: "long",
  timeZone: "UTC",
}).format(new Date(LAST_CHECKED));

// Ley 5/2025 on the BOE, consolidated; the anchors are the BOE's own.
const LAW = "https://www.boe.es/buscar/act.php?id=BOE-A-2026-423";
const ART_49 = `${LAW}#a4-11`;
const ART_50 = `${LAW}#a5-2`;
const ART_51 = `${LAW}#a5-3`;
const ART_52 = `${LAW}#a5-4`;
const ART_53 = `${LAW}#a5-5`;
const ADDITIONAL_1 = `${LAW}#da`;
const FINAL_7 = `${LAW}#df-7`;
const FINAL_8 = `${LAW}#df-8`;
const LAW_BOJA = "https://www.juntadeandalucia.es/boja/2025/247/1";
const TALKS_BOE = "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-8197";
const TALKS_BOJA = "https://www.juntadeandalucia.es/boja/2026/69/32";
const JUNTA_NEWS =
  "https://www.juntadeandalucia.es/organismos/avra/servicios/actualidad/noticias/detalle/684223.html";
const DECREE_197 = "https://www.juntadeandalucia.es/boja/2026/515/9";
const LEY_10_2003 = "https://www.boe.es/buscar/act.php?id=BOE-A-2003-10185#a3";
const BOJA_SEARCH =
  "https://www.juntadeandalucia.es/eboja/buscador/search.do?eboja=on&q=%22Agentes+Inmobiliarios+Especializados%22";

function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

/** Our translation first, the Spanish original under it, and where to read it. */
function Quote({
  where,
  href,
  original,
  children,
}: {
  where: string;
  href: string;
  original: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <blockquote>“{children}”</blockquote>
      <div className="text-muted-foreground mt-2 text-sm">
        <Source href={href}>{where}</Source>, our translation. The original:{" "}
        <span lang="es">“{original}”</span>
      </div>
    </>
  );
}

function Body() {
  return (
    <>
      <Callout title={`Situation as of ${AS_OF}`}>
        <ul>
          <li>
            The law in force still says that registration is required to work as an estate
            agent in Andalusia (art. 50.3).
          </li>
          <li>
            There is no register to join yet: its rules and its forms have not been published,
            and the law gives the Junta until 24 January 2028 to set it up.
          </li>
          <li>
            On 18 September 2026 the Junta announced it will change the law so that registration
            is no longer a condition for working. No amending text and no date have been
            published.
          </li>
        </ul>
        <p>This page quotes and links the official texts. It is not legal advice.</p>
      </Callout>

      <h2>What the register is</h2>
      <p>
        Ley 5/2025, Andalusia’s housing law, created the{" "}
        <em lang="es">
          Registro de Agentes Inmobiliarios Especializados del Sector Residencial de Andalucía
        </em>
        , a register of the estate agents who work with homes in Andalusia. The law was
        published in the BOJA on 24 December 2025 and in the BOE on 8 January 2026, and it has
        been in force since 24 January 2026 (<Source href={FINAL_8}>final provision eight</Source>
        ).
      </p>
      <p>
        The law calls the register public, administrative, free of charge and compulsory, and
        places it under the Junta’s housing department (<Source href={ART_50}>art. 50</Source>).
        It is meant for anyone who, habitually and for pay, as a professional or a business,
        provides intermediation, advice and management services for buying, renting, exchanging
        or assigning residential property (<Source href={ART_49}>art. 49.1</Source>).
      </p>
      <p>
        Joining would work through a <em lang="es">declaración responsable</em>: a signed
        statement, made before starting work, that the requirements are met; the authorities can
        ask for proof at any time. It would have to be renewed periodically (
        <Source href={ART_51}>art. 51</Source>).
      </p>

      <h2>What Ley 5/2025 says today</h2>
      <p>
        The text has not changed since it was published: the BOE’s consolidated version is still
        the original, and the only correction printed since, in March 2026, fixes a slip in the
        list of repealed rules. These are the passages that matter to an agent.
      </p>
      <Quote
        where="Art. 49.1"
        href={ART_49}
        original="…y que deberá inscribirse obligatoriamente en el registro que se creará al efecto por la Consejería competente en materia de vivienda."
      >
        …and who must register in the register that the department responsible for housing will
        create for that purpose.
      </Quote>
      <Quote
        where="Art. 50.3"
        href={ART_50}
        original="La inscripción en el Registro será requisito necesario para el ejercicio de la actividad en el ámbito de la Comunidad Autónoma de Andalucía."
      >
        Registration in the Register will be a necessary requirement for carrying out the
        activity in the Autonomous Community of Andalusia.
      </Quote>
      <Quote
        where="Art. 50.4"
        href={ART_50}
        original="Reglamentariamente, se determinarán y desarrollarán los requisitos y las normas de organización y funcionamiento."
      >
        The requirements and the rules on organisation and operation will be set out and
        developed by regulation.
      </Quote>
      <Quote
        where="Final provision seven"
        href={FINAL_7}
        original="En el plazo máximo de dos años desde la entrada en vigor de la presente ley, la Consejería competente en materia de vivienda adoptará las medidas necesarias para la creación, regulación y puesta en funcionamiento del Registro…"
      >
        Within two years at most of this law coming into force, the department responsible for
        housing will take the measures needed to create, regulate and open the Register…
      </Quote>
      <p>
        So the law makes registration compulsory, but leaves the register itself, its detailed
        rules and its forms for later. The two years run from 24 January 2026, which puts the
        deadline at 24 January 2028. The forms are to be approved by a resolution of the Junta’s
        Secretaría General de Vivienda (
        <Source href={ADDITIONAL_1}>additional provision one</Source>), and a July 2026 decree
        put that same office in charge of the register’s “development and coordination” (
        <Source href={DECREE_197}>Decreto 197/2026, art. 6.2.n</Source>). On {AS_OF}, a{" "}
        <Source href={BOJA_SEARCH}>search of the BOJA for the register’s name</Source> returned
        those two texts and nothing else.
      </p>

      <h2>What changed on 18 September 2026</h2>
      <p>
        The Spanish government raised objections to parts of the law, and the two governments
        agreed to negotiate over 16 of its articles and one final provision. Arts. 49 to 52 are
        among them: four of the register’s five articles, the fifth being art. 53 on the
        guarantee and insurance. That agreement was published in the{" "}
        <Source href={TALKS_BOE}>BOE</Source> and the <Source href={TALKS_BOJA}>BOJA</Source> on
        13 April 2026.
      </p>
      <p>
        On 18 September 2026 the Junta announced that the talks had ended in an agreement, which
        it says closes the dispute without an appeal to the Constitutional Court. On the register,{" "}
        <Source href={JUNTA_NEWS}>its announcement</Source> says:
      </p>
      <Quote
        where="Junta de Andalucía, 18 September 2026"
        href={JUNTA_NEWS}
        original="…la Junta promoverá los ajustes legislativos necesarios para eliminar la inscripción obligatoria como requisito para acceder a la actividad y adecuar su regulación a los principios de proporcionalidad y unidad de mercado. Asimismo, se precisará el carácter alternativo de los requisitos establecidos y la aplicación de la normativa estatal en materia de colegiación."
      >
        …the Junta will promote the legislative adjustments needed to remove compulsory
        registration as a requirement for access to the activity, and to bring its rules into
        line with the principles of proportionality and market unity. It will also be made clear
        that the requirements laid down are alternatives, and that state rules on membership of
        professional associations apply.
      </Quote>
      <p>Put plainly, three changes are announced:</p>
      <ul>
        <li>registration would no longer be a condition for working as an agent in Andalusia;</li>
        <li>the law would say clearly that its requirements are alternatives;</li>
        <li>the state rules on membership of professional associations would apply.</li>
      </ul>
      <p>
        The announcement gives no date and no draft text. On {AS_OF}, neither the agreement nor
        any law amending Ley 5/2025 had been published in the BOE or the BOJA.
      </p>

      <h2>What it means for you</h2>
      <p>
        This section only restates the texts above. It does not say whether any particular person
        meets the requirements.
      </p>
      <h3>What applies today</h3>
      <ul>
        <li>
          The law’s text still makes registration a requirement (
          <Source href={ART_50}>art. 50.3</Source>), and it has not been amended.
        </li>
        <li>
          The register has not been set up, so there is no register to join and no declaration
          form to file.
        </li>
        <li>
          National law still allows estate agency work to be done by individuals and companies
          “without needing to hold any title, nor to belong to any official college”, without
          prejudice to the consumer-protection requirements set by the rules that regulate the
          activity (<Source href={LEY_10_2003}>Ley 10/2003, art. 3</Source>, our translation).
        </li>
      </ul>
      <h3>What to watch for</h3>
      <ol>
        <li>
          <strong>The agreement’s text</strong>, published in the BOE and the BOJA. It is the
          formal record of what the two governments agreed; the announcement is a summary.
        </li>
        <li>
          <strong>A law or decree-law amending arts. 49 to 52</strong>, published in the BOJA.
          Until one is published, the current text stands.
        </li>
        <li>
          <strong>The decree that creates and regulates the register</strong>, and the resolution
          approving its forms.
        </li>
        <li>
          <strong>24 January 2028</strong>, the deadline in final provision seven, unless the
          amendment changes it.
        </li>
      </ol>
      <p>
        This page is dated. When any of these is published, we update it and the date at the
        top.
      </p>

      <h2>The requirements, as the law writes them</h2>
      <p>
        These are the conditions for joining the register in arts. 51 to 53, as published. The
        Junta has announced that the amended law will make clear that the requirements are
        alternatives and that state rules on professional association membership apply, so read
        this as the current text, not as the final list.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Requirement</th>
            <th scope="col">What the law says</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">
              Qualification, <Source href={ART_52}>art. 52.1</Source>
            </th>
            <td>
              Four are listed: (a) the official <em lang="es">Agente de la Propiedad
              Inmobiliaria</em> (API) title; (b) a university degree in social and legal
              sciences, engineering or architecture; (c) at least four years’ experience in
              estate agency work immediately before applying, shown by a work-history report,
              self-employed registration or a property franchise contract covering those years;
              (d) membership of an official college of APIs.
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Companies, <Source href={ART_52}>art. 52.1</Source>
            </th>
            <td>
              At least one director or board member, and the person in charge of the premises open
              to the public, must meet the requirements.
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Training, <Source href={ART_52}>art. 52.2</Source>
            </th>
            <td>
              At least 100 teaching hours of official training in residential intermediation and
              protected housing, taken within the four years before the declaration, for the
              business holder and 50% of its employees. In person, distance or online, from the
              kinds of centre the article lists.
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Guarantee or insurance, <Source href={ART_53}>arts. 52.3 and 53</Source>
            </th>
            <td>
              One of: a financial guarantee covering the money received in the course of the
              work, or professional civil liability insurance. The minimum amounts are left to a
              regulation, based on business volume.
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Criminal record, <Source href={ART_52}>art. 52.4</Source>
            </th>
            <td>
              No criminal record related to property intermediation. This and the guarantee or
              insurance must be kept up for as long as the agent is registered (art. 52.5).
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Declaration, <Source href={ART_51}>art. 51</Source>
            </th>
            <td>
              A <em lang="es">declaración responsable</em> before starting work, covering minimum
              qualification, solvency, civil liability insurance and a code of good practice,
              renewed periodically under rules still to be written.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Timeline</h2>
      <dl>
        <dt>24 December 2025</dt>
        <dd>
          Ley 5/2025, dated 16 December, is published in the{" "}
          <Source href={LAW_BOJA}>BOJA, no. 247</Source>.
        </dd>
        <dt>8 January 2026</dt>
        <dd>
          It is published in the BOE as <Source href={LAW}>BOE-A-2026-423</Source>.
        </dd>
        <dt>24 January 2026</dt>
        <dd>It comes into force, a month after its publication in the BOJA.</dd>
        <dt>13 April 2026</dt>
        <dd>
          The BOE and the BOJA publish the agreement to negotiate over 16 articles, arts. 49 to
          52 among them.
        </dd>
        <dt>31 July 2026</dt>
        <dd>
          Decreto 197/2026 puts the Secretaría General de Vivienda in charge of developing the
          register.
        </dd>
        <dt>18 September 2026</dt>
        <dd>The Junta announces the agreement: compulsory registration is to be removed.</dd>
        <dt>24 January 2028</dt>
        <dd>
          Deadline for the register to be created and opened, unless the amendment changes it.
        </dd>
      </dl>

      <h2>Sources</h2>
      <p>All checked on {AS_OF}.</p>
      <ul>
        <li>
          <Source href={LAW}>Ley 5/2025, de 16 de diciembre, de Vivienda de Andalucía</Source>,
          consolidated text on the BOE (BOE-A-2026-423).
        </li>
        <li>
          <Source href={LAW_BOJA}>The same law as published in the BOJA</Source>, no. 247, 24
          December 2025.
        </li>
        <li>
          <Source href={TALKS_BOE}>BOE-A-2026-8197</Source>, the agreement to open negotiations,
          BOE no. 90, 13 April 2026, and <Source href={TALKS_BOJA}>the same agreement in the
          BOJA</Source>, no. 69, 13 April 2026.
        </li>
        <li>
          <Source href={JUNTA_NEWS}>
            Junta de Andalucía: “Junta y Gobierno alcanzan un acuerdo que resuelve las
            discrepancias sobre la Ley de Vivienda de Andalucía”
          </Source>
          , 18 September 2026.
        </li>
        <li>
          <Source href={DECREE_197}>Decreto 197/2026, de 30 de julio</Source>, on the structure of
          the Junta’s housing department, BOJA extraordinary no. 15, 31 July 2026 (art. 6.2.n).
        </li>
        <li>
          <Source href={LEY_10_2003}>Ley 10/2003, de 20 de mayo, art. 3</Source>, on the BOE.
        </li>
        <li>
          <Source href={BOJA_SEARCH}>The BOJA search for the register’s name</Source>, to see
          anything published since.
        </li>
      </ul>
      <p>
        {SITE_NAME} is a CRM for independent estate agents in Spain, not a law firm. The rest of
        our guides are about the daily work, such as{" "}
        <Link href={marketingPath("guideFollowUp", L)}>following up leads</Link>.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Andalusia estate agent register: what changed in 2026",
  description:
    "Ley 5/2025 made registration compulsory for estate agents in Andalusia, and in September 2026 the Junta agreed to change that. What the law says, sourced.",
  kind: "article",
  published: FIRST_PUBLISHED,
  modified: LAST_CHECKED,
  eyebrow: "Guide · Andalusia",
  heading: "Andalusia’s estate agent register: what the law says, and what changed",
  lead: "Ley 5/2025, Andalusia’s housing law, created a register of estate agents and made joining it a condition for working. On 18 September 2026 the Junta de Andalucía announced it will change the law so that it no longer is. This page sets out what the law says today, what was announced and what to watch for, with a link to every source.",
  Body,
  faq: [
    {
      q: "Is registration compulsory for estate agents in Andalusia?",
      a: `The law in force says it is: Ley 5/2025 makes registration a requirement for working as an estate agent in Andalusia (art. 50.3). But the register has not been set up yet, and on 18 September 2026 the Junta announced it will change the law so that registration is no longer a condition for working. As of ${AS_OF}, no amending law had been published.`,
    },
    {
      q: "What are the requirements for the Andalusia agent register?",
      a: "As the law is written: the qualifications listed in art. 52.1 (an API title, a university degree in certain fields, four years’ experience, membership of an API college), 100 hours of official training in the previous four years, a financial guarantee or professional liability insurance, and no criminal record related to property intermediation (arts. 52 and 53). The Junta has announced that the amended law will make clear that the requirements are alternatives.",
    },
    {
      q: "When will the Andalusia agent register open?",
      a: "No date has been announced. The law gives the Junta until 24 January 2028, two years from its entry into force, to create, regulate and open the register, and a July 2026 decree put its Secretaría General de Vivienda in charge of developing it.",
    },
    {
      q: "Do I need to be an API or a member of a professional association to work as an estate agent?",
      a: "National law requires neither: Ley 10/2003 (art. 3) allows individuals and companies to do estate agency work without any title and without belonging to an official college, subject to the consumer-protection requirements set by the rules that regulate the activity. Ley 5/2025, as written, lists an API title and membership of an API college among the qualifications for its register, and the Junta has announced that the amended law will apply the state rules on professional association membership.",
    },
    {
      q: "Who would have to register?",
      a: "As the law is written, anyone who habitually and for pay, as a professional or a business, provides intermediation, advice and management services for buying, renting, exchanging or assigning residential property in Andalusia (art. 49.1). The announced change would remove registration as a condition for working.",
    },
  ],
  related: ["crmMarbella", "guideFollowUp", "about"],
  topic: {
    "@type": "Legislation",
    name: "Ley 5/2025, de 16 de diciembre, de Vivienda de Andalucía",
    legislationIdentifier: "https://www.boe.es/eli/es-an/l/2025/12/16/5",
    legislationDate: "2025-12-16",
    legislationJurisdiction: "ES-AN",
    url: LAW,
    inLanguage: "es",
  },
};
