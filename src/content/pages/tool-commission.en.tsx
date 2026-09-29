import Link from "next/link";

import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { CommissionCalculator } from "@/components/tools/commission-calculator";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME } from "@/lib/site";

const home = marketingPath("home", "en");

/*
 * No commission rate or split appears anywhere on this page, not even as an
 * example: the worked examples give the fee in euros and never a price.
 * pages.test.ts fails on any percentage other than the tax rates.
 */

const SOURCES = {
  iva: "https://sede.agenciatributaria.gob.es/Sede/iva/calculo-iva-repercutido-clientes/tipos-impositivos-iva.html",
  igic: "https://www3.gobiernodecanarias.org/tributos/atc/en/w/igic-impuesto-general-indirecto-canario-",
  rirpf: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820#a95",
  ruling: "https://petete.tributos.hacienda.gob.es/consultas/?num_consulta=V2188-21",
  colegios: "https://www.boe.es/buscar/act.php?id=BOE-A-1974-289#a14",
} as const;

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
      <h2>How the commission is worked out</h2>
      <p>
        An agency&apos;s commission (its fee, or <em>honorarios</em>) is set in the agreement
        it signs with its client, usually the listing agreement, the <em>nota de encargo</em>.
        It takes one of two shapes: a percentage of the sale price, or a fixed amount in
        euros. Either way, the number in the agreement is normally the fee before tax, and the
        tax goes on top.
      </p>
      <p>
        There is no official or standard rate. Each agency agrees its own fee with its own
        client, and professional associations may not set or even recommend fees (
        <Source href={SOURCES.colegios}>article 14 of the Ley de Colegios Profesionales</Source>).
        That is why the calculator starts empty: the numbers are yours.
      </p>
      <p>
        Say an agreement sets a fee of €12,000 plus IVA. The €12,000 is the base. IVA at 21%
        adds €2,520, so the client pays €14,520. When the fee is a percentage, the calculator
        first multiplies the sale price by it, then does exactly the same.
      </p>
      <p>
        Everything after that is division: how much of the base goes to another agency when
        the sale is shared, how much of your agency&apos;s side is yours, and what your own
        invoice says once IRPF is withheld. The calculator above does each step in cents, so
        the parts always add up to the whole.
      </p>

      <h2>VAT on the fee: “más IVA” or “IVA incluido”</h2>
      <p>
        An estate agency&apos;s fee carries IVA at the general rate, which is 21% (see the{" "}
        <Source href={SOURCES.iva}>Agencia Tributaria&apos;s page on IVA rates</Source>). In the
        Canary Islands there is no IVA: the tax is IGIC, and its general rate is 7% (see the{" "}
        <Source href={SOURCES.igic}>Canary Islands tax agency&apos;s page on IGIC</Source>). For
        any other rate, choose “Other” and type it in.
      </p>
      <p>Fees are quoted in two ways, and they are easy to mix up:</p>
      <ul>
        <li>
          <strong>“Más IVA”</strong> (plus VAT): the amount quoted is the base, and the tax is
          added on top. €12,000 más IVA means the client pays €14,520.
        </li>
        <li>
          <strong>“IVA incluido”</strong> (VAT included): the amount already contains the tax.
          To find the base, divide by 1.21. €14,520 IVA incluido is €12,000 of fee and €2,520
          of IVA.
        </li>
      </ul>
      <p>
        If the number you have is the second kind, switch on “This fee already includes IVA”
        and the calculator takes the tax out before splitting anything.
      </p>

      <h2>How a shared commission flows between two agencies</h2>
      <p>
        On a shared sale, one agency usually holds the listing and another brings the buyer.
        The fee is still one fee, and it moves in steps:
      </p>
      <ol>
        <li>The client pays the agency they signed with: the whole fee, plus tax.</li>
        <li>The other agency invoices that agency for its share of the fee, plus tax.</li>
        <li>
          A freelance agent who works with an agency invoices the agency for their cut, plus
          tax, usually with IRPF withheld (see the next section).
        </li>
      </ol>
      <p>
        There is no set split. Every collaboration agreement sets its own, and the calculator
        takes whatever yours says. Each side is worked out on the fee before tax; each agency
        then adds tax to its own invoice.
      </p>
      <p>
        When you are done, “Copy the split” gives you a short message for the other agency: the
        fee, the tax and the two sides in euros. It never includes your personal share.
      </p>

      <h2>IRPF withholding on your invoice</h2>
      <p>
        If you are self-employed and your activity is registered as a professional one, a
        business or a professional who pays your invoice withholds IRPF from it and pays it to
        the tax agency for you. The rate is 15% in general, or 7% in the year you start and
        the two years after, as long as you had no professional activity the year before; you
        tell the payer in writing that the lower rate applies (
        <Source href={SOURCES.rirpf}>article 95 of the IRPF regulation</Source>).
      </p>
      <p>
        Invoices to private clients carry no withholding: a person buying a home for themselves
        does not withhold anything. The tax authority confirmed both points for an individual
        estate agent in binding ruling{" "}
        <Source href={SOURCES.ruling}>V2188-21</Source>.
      </p>
      <p>
        Withholding comes off the base, never off the tax. On a base of €4,000 with IVA at 21%,
        the invoice adds €840 of IVA and withholds €600 at 15%, so you receive €4,240. The
        €600 is not lost: it is an advance on your income tax, and it counts towards what you
        owe when you file your return.
      </p>

      <h2>How much does an agent earn per sale?</h2>
      <p>
        There is no single answer, because it rests on three numbers that change from deal to
        deal: the fee your agency agrees with its client, the split with another agency when
        there is one, and your own share of your agency&apos;s side. Put your numbers into the
        calculator and change one at a time to see what each is worth to you.
      </p>
      <p>
        The figure the calculator gives you is what your invoice says. It comes before your own
        income tax and your costs, which only you can work out.
      </p>

      <h2>Keeping track of the deals behind the numbers</h2>
      <p>
        <Link href={home}>{SITE_NAME}</Link> is a CRM for independent estate agents in Spain.
        It keeps every client with the agency they came through, with their viewings, their
        offers and the follow-ups that are due, so when a sale closes the deal is already in
        one place. It works in English and Spanish, and it is free for up to{" "}
        {FREE_CLIENT_LIMIT} clients.
      </p>

      <p className="text-muted-foreground text-sm">
        This calculator does arithmetic; it isn&apos;t tax or legal advice.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Real estate commission calculator for Spain: VAT and splits",
  description:
    "Free real estate commission calculator for Spain: the fee with VAT or IGIC, the split between two agencies, your share and the IRPF withheld on your invoice.",
  kind: "tool",
  published: "2026-09-29",
  eyebrow: "Free tool",
  heading: "Real estate commission calculator: fee, VAT and the split between agencies",
  lead: "Work out the fee with VAT, the split between two agencies and your own invoice, from the numbers you agreed.",
  Body,
  faq: [
    {
      q: "How is a real estate commission calculated?",
      a: "As a percentage of the sale price or as a fixed fee, whichever the agency agreed with its client, with tax added on top: IVA at 21%, or IGIC at 7% in the Canary Islands. When two agencies share a sale, the fee before tax is split between them as their collaboration agreement says.",
    },
    {
      q: "Does the commission carry VAT?",
      a: "Yes. An agency's fee carries IVA at the general rate of 21%, or IGIC at 7% in the Canary Islands. A fee quoted “más IVA” has the tax added on top; one quoted “IVA incluido” already contains it, so the fee before tax is the amount divided by 1.21.",
    },
    {
      q: "How is a commission split between two agencies?",
      a: "However the two agencies agree: there is no standard split. The client pays the agency it signed with, and the other agency invoices that agency for its share plus tax. Each side is worked out on the fee before tax.",
    },
    {
      q: "What IRPF withholding goes on an agent's invoice?",
      a: "When a self-employed agent whose activity is registered as a professional one invoices a business or a professional, the payer withholds 15% of the base, or 7% in the year the activity starts and the two years after. Invoices to private clients carry no withholding.",
    },
    {
      q: "Is there a standard commission rate in Spain?",
      a: "No. Each agency agrees its fee with its own client, and professional associations may not set or recommend fees (Ley 2/1974 de Colegios Profesionales, article 14, added by Ley 25/2009).",
    },
  ],
  related: ["guideFollowUp", "crmSpain", "pricing"],
  tool: {
    Component: CommissionCalculator,
    schema: { "@type": "WebApplication", applicationCategory: "FinanceApplication" },
  },
};
