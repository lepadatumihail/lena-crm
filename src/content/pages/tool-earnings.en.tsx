import Link from "next/link";

import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { CuotaTable } from "@/components/tools/cuota-table";
import { EarningsCalculator } from "@/components/tools/earnings-calculator";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME } from "@/lib/site";
import { COTIZACION_YEAR } from "@/lib/tools/earnings";

/*
 * No commission rate or split appears anywhere on this page, not even as an
 * example: the worked example gives the agent's side of a fee in euros. The
 * only percentages are the tax and Social Security rates; pages.test.ts fails
 * on any other. The example's figures are asserted in earnings.test.ts, and
 * change with the cuota table each year.
 */

const SOURCES = {
  colegios: "https://www.boe.es/buscar/act.php?id=BOE-A-1974-289#a14",
  orden: "https://www.boe.es/buscar/act.php?id=BOE-A-2026-7296",
  lgss: "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724#a308",
  leta: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-13409#a3-5",
  withholding: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820#a95",
  advances: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820#a110",
  waiver: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820#a109",
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
      <h2>How the calculator works out what you earn</h2>
      <p>
        A self-employed agent earns their share of the fees on the sales they close. The
        calculator starts from the fee your agency agrees with each client, a percentage of the
        price or a fixed amount, and follows it down in five steps:
      </p>
      <ol>
        <li>
          <strong>Fees on your sales.</strong> The fee on one sale, before IVA, times your sales
          in a year. The IVA on your invoices belongs to the tax agency, so it never counts as
          income.
        </li>
        <li>
          <strong>Shared sales.</strong> When another agency brought the buyer, part of the fee
          is theirs, as your collaboration agreement says.
        </li>
        <li>
          <strong>Your agency or network.</strong> If you work under an agency or a network, it
          keeps part of your side and the rest is yours.
        </li>
        <li>
          <strong>The cuota de autónomos and your costs.</strong> Your monthly Social Security
          payment, and what you spend to work: portals, your car, your phone, a desk fee.
        </li>
        <li>
          <strong>IRPF.</strong> What is withheld from your invoices, or the quarterly advances
          you pay yourself.
        </li>
      </ol>
      <p>
        What is left, divided by twelve, is your take-home a month. Every field starts empty:
        there is no standard fee or split in Spain, and professional associations may not set
        or even recommend fees (
        <Source href={SOURCES.colegios}>article 14 of the Ley de Colegios Profesionales</Source>),
        so the numbers have to be yours.
      </p>

      <h2>A worked example</h2>
      <p>
        Say you close eight sales a year, and your side of each fee, after any split, is €5,000
        before IVA: €40,000 of fees. You spend €500 a month on portals, your car and your
        phone, and the agency you invoice withholds IRPF at 15%.
      </p>
      <ul>
        <li>
          For the cuota, your earnings are €40,000 less €6,000 of costs, less the 7% deduction
          for general expenses: about €2,635 a month. That is band 10 of the {COTIZACION_YEAR}{" "}
          table, whose minimum cuota is €427.21 a month, or €5,126.52 a year.
        </li>
        <li>IRPF withheld at 15% of €40,000 is €6,000.</li>
        <li>
          €40,000 less €6,000, €5,126.52 and €6,000 leaves €22,873.48 a year:{" "}
          <strong>€1,906.12 a month</strong>.
        </li>
      </ul>
      <p>
        The same numbers answer the opposite question. To take home €2,500 a month, choose
        “Sales I need”: nine sales leave €2,234.56 a month and ten leave €2,562.99, so the
        answer is ten. Extra sales also raise your cuota, because higher earnings move you into a
        higher band.
      </p>

      <h2>The cuota de autónomos in {COTIZACION_YEAR}</h2>
      <p>
        Since 2023 the cuota depends on what you earn. Your net earnings for the year, with the
        cuota itself added back and less a 7% deduction for general expenses (
        <Source href={SOURCES.lgss}>
          article 308 of the Ley General de la Seguridad Social
        </Source>
        ), are divided by twelve and fall in one of fifteen bands. Each band has a minimum
        contribution base, and the cuota is that base times 31.5%: the rates for common and
        professional contingencies, cessation of activity, vocational training and the
        intergenerational equity mechanism, set for {COTIZACION_YEAR} by the{" "}
        <Source href={SOURCES.orden}>Orden PJC/297/2026</Source>.
      </p>
      <CuotaTable locale="en" />
      <p>
        Through the year you pay a provisional cuota on the earnings you expect, and the Social
        Security settles the difference once your tax return shows the real figure: it charges
        what is missing or refunds what you overpaid. You may also choose a base above your
        band&apos;s minimum, which costs more and counts towards a higher pension. The calculator
        uses each band&apos;s minimum.
      </p>
      <p>
        In your first year as self-employed you may pay a reduced cuota instead, the{" "}
        <em>tarifa plana</em>, for twelve months, and for twelve more if your earnings stay below
        the minimum wage (
        <Source href={SOURCES.leta}>
          article 38 ter of the Ley del Estatuto del Trabajo Autónomo
        </Source>
        ). If that is you, choose “I&apos;ll type it” and enter what you pay.
      </p>
      <p>
        If you haven’t registered yet, here is{" "}
        <Link href={marketingPath("guideBecomeAgent", "en")}>
          how to become an estate agent in Spain and what each region requires
        </Link>
        , with the steps to register as self-employed.
      </p>

      <h2>IRPF: what is withheld and what you owe</h2>
      <p>
        When you invoice a business, such as the agency or network you work with, it withholds
        IRPF from your invoice: 15% of the base, or 7% in the year you start and the two after (
        <Source href={SOURCES.withholding}>article 95 of the IRPF regulation</Source>). Invoices
        to private clients carry no withholding. Then you pay advances yourself every quarter on
        modelo 130: 20% of your net earnings so far that year (
        <Source href={SOURCES.advances}>article 110</Source>), unless at least 70% of last
        year&apos;s income was withheld (<Source href={SOURCES.waiver}>article 109</Source>).
      </p>
      <p>
        Either way, it is an advance. Your income tax for the year is settled in your annual
        return and depends on your whole income, your region and your deductions, so it can come
        out higher or lower. The calculator takes off what is withheld or paid in advance,
        because that is what leaves your account during the year.
      </p>

      <h2>So how much does an estate agent earn in Spain?</h2>
      <p>
        There is no single honest figure. A self-employed agent&apos;s income moves with three
        numbers that change from one agent to the next: how many sales they close, the fee their
        agency agrees with each client, and how that fee is split. That is why this page gives
        you a calculator instead of an average. Put in your own numbers, then change one at a
        time to see what each is worth to you.
      </p>
      <p>
        For a single deal, with the IVA and the split between two agencies, use the{" "}
        <Link href={marketingPath("toolCommission", "en")}>commission calculator</Link>.
      </p>

      <h2>Keeping the sales coming</h2>
      <p>
        Every sale in this calculator started as an enquiry that someone followed up.{" "}
        <Link href={marketingPath("home", "en")}>{SITE_NAME}</Link> is a CRM for independent
        estate agents in Spain. It keeps every buyer and seller with their viewings, offers and
        the follow-ups that are due, so nobody goes quiet without you noticing. It works in
        English, Spanish and Russian, and it is free for up to {FREE_CLIENT_LIMIT} clients.
      </p>

      <p className="text-muted-foreground text-sm">
        This calculator does arithmetic; it isn&apos;t tax or legal advice.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "How much does an estate agent earn in Spain? Calculator",
  description:
    "Free earnings calculator for estate agents in Spain: your sales, fee and splits, less the cuota de autónomos, costs and IRPF. See what you take home a month.",
  kind: "tool",
  published: "2026-10-09",
  eyebrow: "Free tool",
  heading: "How much does an estate agent earn in Spain?",
  lead: "Put in your sales, your fee and your splits. The calculator takes off the cuota de autónomos, your costs and IRPF, and shows what you take home a month, or how many sales the income you want needs.",
  Body,
  faq: [
    {
      q: "How much does an estate agent earn in Spain?",
      a: "There is no standard figure: a self-employed agent's income depends on the sales they close, the fee their agency agrees with each client and how it is split. What they take home is their share of the fees, less the cuota de autónomos, their costs and income tax.",
    },
    {
      q: `How much is the cuota de autónomos in ${COTIZACION_YEAR}?`,
      a: "It depends on your net earnings a month. The minimum runs from €205.88 for earnings up to €670 to €607.35 above €6,000: each band's minimum base times 31.5% (Orden PJC/297/2026). The Social Security settles it the following year against the earnings in your tax return.",
    },
    {
      q: "How is an estate agent's commission taxed?",
      a: "A self-employed agent pays IRPF on their fees less their costs. A business that pays the invoice withholds 15%, or 7% in the year the activity starts and the two after. With nothing withheld, the agent pays 20% of their net earnings in quarterly advances (modelo 130). The annual return settles the real tax.",
    },
    {
      q: "How many sales does an estate agent need to make a living?",
      a: "Enough for your share of the fees to cover the cuota, your costs and income tax, plus what you need to live on. Choose “Sales I need”, enter that monthly figure with your fee and splits, and the calculator finds the fewest sales a year that get there.",
    },
    {
      q: "Does VAT count as an agent's income?",
      a: "No. The IVA on your invoices belongs to the tax agency: you collect it and pay it over each quarter. Enter your fees before IVA; the calculator never counts the tax as income.",
    },
  ],
  related: ["toolCommission", "guideBecomeAgent", "guideFollowUp", "pricing"],
  tool: {
    Component: EarningsCalculator,
    schema: { "@type": "WebApplication", applicationCategory: "FinanceApplication" },
  },
};
