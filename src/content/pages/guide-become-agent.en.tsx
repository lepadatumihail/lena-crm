import Link from "next/link";

import { intlTag } from "@/i18n/config";
import { marketingPath } from "@/lib/routes";
import { CHECKED, PUBLISHED } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { SOURCES as S } from "@/content/pages/guide-become-agent.sources";

const L = "en";

/** The day the page was first published, which stays its datePublished. */
const FIRST_PUBLISHED = PUBLISHED.guideBecomeAgent;

/**
 * The day every requirement was last checked against its law. It is also the
 * "Updated" date, dateModified and the sitemap's lastmod, so the quarterly
 * re-check bumps CHECKED.guideBecomeAgent, never PUBLISHED.
 */
const LAST_CHECKED = CHECKED.guideBecomeAgent ?? FIRST_PUBLISHED;

const AS_OF = new Intl.DateTimeFormat(intlTag(L), {
  dateStyle: "long",
  timeZone: "UTC",
}).format(new Date(LAST_CHECKED));

function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function Body() {
  return (
    <>
      <Callout title={`Situation on ${AS_OF}`}>
        <ul>
          <li>Spain requires no title or professional association to work as an estate agent.</li>
          <li>
            Catalonia and the Valencia region require agents to join a register. Andalusia’s law
            requires it too, but the register was never set up and the Junta has committed to
            removing the requirement.
          </li>
          <li>
            In Madrid, the Balearic Islands, Navarre, the Canary Islands and the Basque Country
            the register is voluntary.
          </li>
        </ul>
        <p>
          This page summarises the rules and links every text. It is not legal or tax advice, and
          it doesn’t say whether any particular person meets the requirements.
        </p>
      </Callout>

      <h2>What national law says</h2>
      <p>
        Estate agency is a free activity in Spain. Ley 10/2003 lets any individual or company
        do it “without needing to hold any title, nor to belong to any official college”,
        subject to the consumer-protection rules (
        <Source href={S.ley10_2003}>Ley 10/2003, art. 3</Source>, our translation).{" "}
        <Source href={S.rdl4_2000}>Real Decreto-ley 4/2000, art. 3</Source> said the same before
        it.
      </p>
      <p>
        The Agente de la Propiedad Inmobiliaria (API) title and the API colleges still exist, but
        they are optional: the colleges’ regulation says membership rests “on the principle of
        voluntariness”. What it does reserve is the name: only members may call themselves
        “agente de la propiedad inmobiliaria” (
        <Source href={S.rd1294_2007}>Real Decreto 1294/2007</Source>).
      </p>

      <h2>Region by region</h2>
      <p>
        What changes with where you work is whether you must join an agents’ register, and what
        it asks of you.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Region</th>
            <th scope="col">Agents’ register</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">
              Catalonia
            </th>
            <td>Compulsory</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Valencia region
            </th>
            <td>Compulsory; a court struck down part of its requirements in 2024</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Andalusia
            </th>
            <td>Compulsory in the law, but never set up, and the requirement is being removed</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Balearic Islands
            </th>
            <td>Voluntary since 14 June 2026, but the law asks every agent for a guarantee and insurance</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Madrid
            </th>
            <td>Voluntary</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Navarre
            </th>
            <td>Voluntary</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Canary Islands
            </th>
            <td>Voluntary</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Basque Country
            </th>
            <td>Can’t be compulsory, per the Constitutional Court; no decree has created it</td>
          </tr>
        </tbody>
      </table>
      <p>
        In Galicia, Cantabria, Castilla-La Mancha, Castilla y León, Extremadura, Murcia and La
        Rioja we found no agents’ register. Asturias and Aragón have announced one, but none had
        been published on {AS_OF}.
      </p>

      <h3>Catalonia</h3>
      <p>
        Catalonia’s housing law requires agents to have premises open to the public (or a
        physical address if they only work online), professional training, a guarantee and
        liability insurance, and creates a compulsory register (
        <Source href={S.catLaw}>Ley 18/2007, arts. 55.3 and 55.4</Source>). Not registering
        doesn’t void contracts (art. 56.4). <Source href={S.catDecree}>Decreto 12/2010</Source>{" "}
        sets the details:
      </p>
      <ul>
        <li>training: a related degree or courses of at least 200 teaching hours (annex 1);</li>
        <li>
          guarantee: €60,000 per office per year, or €300,000 if you only work online (art. 8);
        </li>
        <li>
          liability insurance: €100,000 per claim and €600,000 a year, or €150,000 and €1,000,000
          online (art. 11).
        </li>
      </ul>
      <p>
        The application is on the <Source href={S.catProcedure}>Generalitat’s website</Source>.
      </p>

      <h3>Valencia region</h3>
      <p>
        <Source href={S.valDecree}>Decreto 98/2022</Source> created the Registro de Agentes de
        Intermediación Inmobiliaria, “free and compulsory” (art. 4.1), with requirements on
        address, training, guarantee and insurance in its art. 3. In December 2024 the Valencia
        High Court, on an appeal by the competition authority (CNMC), struck down several of them
        (<Source href={S.valSentence}>judgment 706/2024</Source>, final according to the{" "}
        <Source href={S.valCnmc}>CNMC</Source>):
      </p>
      <ul>
        <li>the whole professional-training requirement, including the 200 hours;</li>
        <li>the amounts of the guarantees and surety insurance;</li>
        <li>the rule that online-only agents have their address in the region;</li>
        <li>
          and the notice that occasional agents and agents registered in other regions had to
          give.
        </li>
      </ul>
      <p>
        The duty to register wasn’t challenged and still stands. Before you register, check with
        the register itself which documents it asks for now (
        <Source href={S.valRuling}>the court’s press note</Source>).
      </p>

      <h3>Andalusia</h3>
      <p>
        <Source href={S.andLaw}>Ley 5/2025</Source> created a “public, administrative, free and
        compulsory” register (art. 50.1, our translation), but it hasn’t been set up. In the{" "}
        <Source href={S.andAgreement}>agreement published in the BOE on 19 October 2026</Source>
        , the Junta commits to changing the law to remove compulsory registration. We explain it
        in <Link href={marketingPath("guideAndaluciaRegister", L)}>our Andalusia register guide</Link>
        .
      </p>

      <h3>Balearic Islands</h3>
      <p>
        Ley 3/2024 made the register compulsory, but Ley 4/2026 changed that from 14 June 2026:
        “registration in it is, in every case, voluntary” (
        <Source href={S.balLaw}>Ley 3/2024, fourteenth additional provision</Source>, our
        translation). Even so, the thirteenth additional provision applies to everyone working as
        an agent in the Balearics, registered or not, and asks them for premises (or a postal
        address in the Balearics if they only work online), a €60,000 guarantee per year and
        liability insurance of €100,000 per claim and €600,000 a year. Training is now only asked
        of agents who join the register.
      </p>

      <h3>Madrid, Navarre, the Canary Islands and the Basque Country</h3>
      <ul>
        <li>
          <strong>Madrid</strong>: registration is “in every case, voluntary”. To join, you need a
          degree, 200 hours of training or four years’ experience, a €60,000 guarantee and
          insurance of €100,000 per claim and €600,000 a year (
          <Source href={S.madDecree}>Decreto 8/2018, arts. 1, 6 and 7</Source>;{" "}
          <Source href={S.madRegister}>the RAIN register</Source>).
        </li>
        <li>
          <strong>Navarre</strong>: a voluntary, public and free register. To join, 200 hours of
          training (or API membership, a degree or four years’ experience), a €30,000 guarantee
          and insurance of €100,000 per claim and €600,000 a year, 50% more if you only work
          online (<Source href={S.navDecree}>Decreto Foral 33/2019, arts. 4, 8 and 9</Source>).
        </li>
        <li>
          <strong>Canary Islands</strong>: registration “is voluntary”. To join, you need premises
          open to the public (or a physical address in the Canaries if you work online), API
          membership, a degree, four years’ experience or 200 hours of training, and a €30,000
          guarantee per office, which liability insurance of at least that amount can replace (
          <Source href={S.canDecree}>Decreto 11/2022, arts. 4 to 8</Source>).
        </li>
        <li>
          <strong>Basque Country</strong>: the housing law provides for a register (
          <Source href={S.pvLaw}>Ley 3/2015, first additional provision</Source>), and the
          Constitutional Court ruled out reading registration as a precondition or licence for
          working as an estate agent in the Basque Country (
          <Source href={S.pvRuling}>STC 97/2018</Source>). We found no decree creating it.
        </li>
      </ul>

      <h2>Registering as self-employed, step by step</h2>
      <p>
        If you’ll work for yourself, these are the national steps, in the order you take them.
        First, check in the table above whether your region asks you to register.
      </p>
      <ol>
        <li>
          <strong>Register with the tax agency on modelo 036</strong>, before you start. Modelo 037
          no longer exists: since February 2025 everything goes on the 036 (
          <Source href={S.modelo036}>Agencia Tributaria</Source>).
        </li>
        <li>
          <strong>Your IAE business-tax heading.</strong> Agents who belong to an API college go
          under group 721 of section two. For an agent who doesn’t, the tax directorate (DGT) has
          answered in binding rulings that brokering sales of new developments goes under 724,
          rentals under 799, and section one’s 834 only for a business-style activity. For other
          cases, such as resales, those rulings set no heading: confirm it with the Agencia
          Tributaria. Note that 723, which many sites quote, is for property managers (
          <Source href={S.iae}>the IAE tariffs</Source>). Individuals don’t pay the tax; the
          heading goes on the modelo 036 (
          <Source href={S.iaeExemption}>Ley de Haciendas Locales, art. 82.1.c</Source>).
        </li>
        <li>
          <strong>Join the RETA</strong>, the Social Security scheme for the self-employed, before
          you start and up to 60 days ahead (<Source href={S.reta}>Import@ss</Source>).
        </li>
        <li>
          <strong>Your monthly cuota</strong> depends on your real earnings, by bands (
          <Source href={S.cotizacion}>Orden PJC/297/2026, art. 18</Source>). There is a reduced
          cuota for newcomers, the tarifa plana (
          <Source href={S.leta}>Ley del Estatuto del Trabajo Autónomo, art. 38 ter</Source>),
          whose amount is set by the budget law: check the current figure with the Seguridad
          Social. Our <Link href={marketingPath("toolEarnings", L)}>earnings calculator</Link>{" "}
          works out your cuota from your own figures.
        </li>
        <li>
          <strong>Your invoices</strong> carry 21% VAT (IVA) (
          <Source href={S.liva}>Ley del IVA, art. 90</Source>). When you bill a company, such as
          the agency or network you work with, it withholds 15% income tax (IRPF), or 7% in the
          year you start and the two after (
          <Source href={S.rirpf}>IRPF regulation, art. 95</Source>). Private clients don’t
          withhold, so you pay quarterly advances yourself on modelo 130. VAT is declared every
          quarter on modelo 303.
        </li>
        <li>
          <strong>Your invoicing software</strong> will have to meet the invoicing-systems rules
          (Verifactu): for the self-employed, before 1 July 2027 according to{" "}
          <Source href={S.verifactu}>Real Decreto-ley 15/2025</Source>.
        </li>
      </ol>

      <h2>If you work for a network or an agency</h2>
      <p>
        Many networks and agencies work with self-employed agents. If at least 75% of your income
        comes from a single client, the law treats you as an economically dependent
        self-employed worker (TRADE): the contract must be in writing and registered with the
        public employment service, and it’s up to you to register it within ten working days of
        signing (
        <Source href={S.leta}>Ley del Estatuto del Trabajo Autónomo, arts. 11 and 12</Source>;{" "}
        <Source href={S.trade}>Real Decreto 197/2009, art. 6</Source>;{" "}
        <Source href={S.tradeSepe}>the SEPE procedure</Source>).
      </p>

      <h2>What the law asks of you from your first deal</h2>
      <ul>
        <li>
          <strong>Anti-money-laundering.</strong> Anyone who professionally brokers property sales
          is an obliged entity (art. 2.1.l), and for rentals from €10,000 a month. That means
          identifying the client and their beneficial owner, a written risk assessment, reporting
          suspicious transactions to SEPBLAC, keeping records for ten years, and training (
          <Source href={S.aml}>Ley 10/2010</Source>).
        </li>
        <li>
          <strong>Information when offering homes.</strong> Advertising must not mislead and what
          you advertise is binding; you must keep the home’s details available to the buyer, and
          the total price includes, where applicable, your fee and VAT (
          <Source href={S.rd515}>Real Decreto 515/1989</Source>).
        </li>
        <li>
          <strong>What clients can ask before paying.</strong> A buyer or tenant can ask for
          minimum information about the deal, the home and who is involved before signing or
          handing over money (<Source href={S.ley12_2023}>Ley 12/2023, art. 31</Source>).
        </li>
      </ul>

      <h2>How much do agents earn?</h2>
      <p>
        It depends on how many deals you close, the fees you agree with each client and how you
        share them with other agencies or your network. The{" "}
        <Link href={marketingPath("toolEarnings", L)}>estate agent earnings calculator</Link> runs
        the numbers with your figures, including the cuota, income tax and your costs.
      </p>

      <h2>What you need on day one</h2>
      <p>
        From your first client you need one place to keep every buyer and seller with their next
        step. It can be a <Link href={marketingPath("toolSpreadsheet", L)}>spreadsheet</Link> or
        a CRM. {SITE_NAME} is a CRM for independent agents: you paste in each enquiry and it
        becomes a client card, free up to 10 clients. If you’ll advertise on portals, see{" "}
        <Link href={marketingPath("guidePortalPrices", L)}>what each portal charges</Link> first.
      </p>

      <h2>Sources</h2>
      <p>All checked on {AS_OF}.</p>
      <ul>
        <li>
          National law: <Source href={S.ley10_2003}>Ley 10/2003</Source>,{" "}
          <Source href={S.rdl4_2000}>Real Decreto-ley 4/2000</Source>,{" "}
          <Source href={S.rd1294_2007}>Real Decreto 1294/2007</Source>.
        </li>
        <li>
          Catalonia: <Source href={S.catLaw}>Ley 18/2007</Source>,{" "}
          <Source href={S.catDecree}>Decreto 12/2010</Source>,{" "}
          <Source href={S.catProcedure}>application</Source>. Valencia region:{" "}
          <Source href={S.valDecree}>Decreto 98/2022</Source>,{" "}
          <Source href={S.valSentence}>judgment 706/2024</Source>,{" "}
          <Source href={S.valRuling}>court press note</Source>,{" "}
          <Source href={S.valCnmc}>CNMC case file</Source>.
        </li>
        <li>
          Andalusia: <Source href={S.andLaw}>Ley 5/2025</Source>,{" "}
          <Source href={S.andAgreement}>BOE-A-2026-21762</Source>. Balearic Islands:{" "}
          <Source href={S.balLaw}>Ley 3/2024</Source>. Madrid:{" "}
          <Source href={S.madDecree}>Decreto 8/2018</Source>,{" "}
          <Source href={S.madRegister}>RAIN</Source>. Navarre:{" "}
          <Source href={S.navDecree}>Decreto Foral 33/2019</Source>. Canary Islands:{" "}
          <Source href={S.canDecree}>Decreto 11/2022</Source>. Basque Country:{" "}
          <Source href={S.pvLaw}>Ley 3/2015</Source>, <Source href={S.pvRuling}>STC 97/2018</Source>
          .
        </li>
        <li>
          Registration and tax: <Source href={S.modelo036}>modelo 036</Source>,{" "}
          <Source href={S.iae}>IAE tariffs</Source>,{" "}
          <Source href={S.iaeExemption}>Ley de Haciendas Locales</Source>,{" "}
          <Source href={S.reta}>RETA registration</Source>,{" "}
          <Source href={S.cotizacion}>Orden PJC/297/2026</Source>,{" "}
          <Source href={S.leta}>Estatuto del Trabajo Autónomo</Source>,{" "}
          <Source href={S.liva}>Ley del IVA</Source>,{" "}
          <Source href={S.rirpf}>IRPF regulation</Source>,{" "}
          <Source href={S.trade}>Real Decreto 197/2009</Source>,{" "}
          <Source href={S.tradeSepe}>TRADE contract register</Source>,{" "}
          <Source href={S.verifactu}>Real Decreto-ley 15/2025</Source>.
        </li>
        <li>
          Obligations: <Source href={S.aml}>Ley 10/2010</Source>,{" "}
          <Source href={S.rd515}>Real Decreto 515/1989</Source>,{" "}
          <Source href={S.ley12_2023}>Ley 12/2023</Source>.
        </li>
      </ul>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "How to become an estate agent in Spain: 2026 rules",
  description:
    "Spain needs no title to work as an estate agent. What each region requires, which agent registers are compulsory and how to register as self-employed.",
  kind: "article",
  published: FIRST_PUBLISHED,
  modified: LAST_CHECKED,
  eyebrow: "Guide · Getting started",
  heading: "How to become an estate agent in Spain: what the law requires, region by region",
  lead: "Spain requires no title or professional association to work as an estate agent. What changes is the region: Catalonia and the Valencia region make agents join a register, Andalusia’s law requires it but the Junta has committed to removing it, and in Madrid, the Balearics, Navarre, the Canaries and the Basque Country the register is voluntary. Here is what each one asks, with its source, and the steps to start out as self-employed.",
  Body,
  faq: [
    {
      q: "Do you need a licence to be an estate agent in Spain?",
      a: "No. Ley 10/2003 (art. 3) lets anyone work as a property intermediary without any title and without belonging to a professional college, subject to consumer-protection rules. Some regions do require agents to join a register.",
    },
    {
      q: "Do I have to be an API or join a college?",
      a: "No. The Agente de la Propiedad Inmobiliaria title and the API colleges exist, but membership is voluntary. Only members may use the name agente de la propiedad inmobiliaria.",
    },
    {
      q: "Which IAE heading does an estate agent use?",
      a: "Agents who belong to an API college go under group 721 of section two. For those who don't, the tax directorate has ruled that brokering sales of new developments goes under 724, rentals under 799, and section one's 834 only for a business-style activity; for other cases, such as resales, those rulings set no heading. Group 723 is for property managers. Individuals are exempt from paying the tax.",
    },
    {
      q: "Do I have to join an estate agents' register?",
      a: "It depends on the region. It is compulsory in Catalonia and the Valencia region. Andalusia's law requires it, but the register was never set up and the Junta has committed to removing the requirement. In Madrid, the Balearic Islands, Navarre, the Canary Islands and the Basque Country it is voluntary.",
    },
    {
      q: "What do you need to study to become an estate agent in Spain?",
      a: "National law requires no studies. Some regions ask for training to join their register: Catalonia asks for a related degree or courses of at least 200 teaching hours, and Madrid and Navarre ask for 200 hours for their voluntary registers.",
    },
    {
      q: "How much does it cost to register as a self-employed estate agent?",
      a: "Registering with the tax agency and Social Security is free. The monthly self-employed cuota depends on your real earnings, by bands, and newcomers can pay a reduced cuota, the tarifa plana, whose amount is set by the budget law.",
    },
  ],
  related: ["toolEarnings", "guideAndaluciaRegister", "guidePortalPrices"],
  topic: {
    "@type": "Occupation",
    name: "Estate agent",
    occupationLocation: { "@type": "Country", name: "Spain" },
  },
};
