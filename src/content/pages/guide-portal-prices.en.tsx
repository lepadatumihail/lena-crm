import Link from "next/link";

import { intlTag } from "@/i18n/config";
import { marketingPath } from "@/lib/routes";
import { CHECKED, PUBLISHED } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { SOURCES as S } from "@/content/pages/guide-portal-prices.sources";

const L = "en";

/** The day the page was first published, which stays its datePublished. */
const FIRST_PUBLISHED = PUBLISHED.guidePortalPrices;

/**
 * The day every price was last checked against the portal's own site. It is
 * also the "Updated" date, dateModified and the sitemap's lastmod, so the
 * quarterly re-check bumps CHECKED.guidePortalPrices, never PUBLISHED.
 */
const LAST_CHECKED = CHECKED.guidePortalPrices ?? FIRST_PUBLISHED;

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
      <Callout title={`Prices checked on ${AS_OF}`}>
        <ul>
          <li>
            No Spanish national portal publishes its prices for agencies: Idealista, Fotocasa and
            habitaclia, pisos.com and yaencontre all quote on a sales call.
          </li>
          <li>
            Of the portals coast agencies use, only ThinkSpain, Properstar, Spainhouses and FINN.no
            publish prices for professionals.
          </li>
          <li>Kyero stopped being free for agencies on 31 December 2025.</li>
          <li>
            The figures you see online for Idealista come from blogs and other CRMs, with no
            source. We list them separately and label them for what they are.
          </li>
        </ul>
        <p>
          This page describes what each portal publishes. It doesn’t recommend one or judge
          the quality of its enquiries.
        </p>
      </Callout>

      <h2>Spain’s national portals: what they publish</h2>
      <p>
        They all sell agencies packs of listings, with extras such as featured or top positions.
        What differs is whether you see a price before you call. On {AS_OF}, none of the big ones
        showed one.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Portal</th>
            <th scope="col">Price for agencies</th>
            <th scope="col">Free for professionals</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">Idealista</th>
            <td>On request</td>
            <td>No: agencies must use a professional profile</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Fotocasa and habitaclia</th>
            <td>On request (Start, Basic and Premium packs, no published price)</td>
            <td>Not stated</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">pisos.com</th>
            <td>On request</td>
            <td>Not stated</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">yaencontre</th>
            <td>On request</td>
            <td>Not stated</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Milanuncios</th>
            <td>From the third listing, through Fotocasa Pro</td>
            <td>Yes: 2 property listings per category</td>
          </tr>
        </tbody>
      </table>

      <h3>Idealista</h3>
      <ul>
        <li>
          <strong>Price:</strong> its page for professionals mentions “different pricing
          and service options” and offers a phone number and a callback form, with no
          prices (<Source href={S.idealistaPro}>idealista, new professional</Source>).
        </li>
        <li>
          <strong>No free route:</strong> an agent has to advertise with a professional profile,
          and idealista may block a private account used by an agent (
          <Source href={S.idealistaAgentAccount}>idealista help</Source>).
        </li>
        <li>
          <strong>Careful with the prices quoted online:</strong> the €43.90 for 30 days featured
          or €11.90 for 24 hours that many blogs quote are prices for private sellers, as are the
          first two free listings (
          <Source href={S.idealistaPrivate}>pricing policy for private sellers</Source>).
        </li>
        <li>
          <strong>Enquiries:</strong> they land in the idealista/tools Inbox, with an email alert
          (<Source href={S.idealistaInbox}>idealista/tools help</Source>).
        </li>
        <li>
          <strong>Listings:</strong> idealista recommends its own idealista/tools and Inmovilla,
          which it also owns, as real-time integrations (
          <Source href={S.idealistaSoftware}>recommended software</Source>).
        </li>
      </ul>

      <h3>Fotocasa and habitaclia (Fotocasa Pro)</h3>
      <ul>
        <li>
          <strong>Price:</strong> three packs, Start, Basic and Premium, with no price, VAT or
          minimum term on the site. All of them publish without limit on Fotocasa, habitaclia and
          Milanuncios; Basic includes 20 featured listings on Milanuncios and Premium 40 (
          <Source href={S.fotocasaPacks}>Fotocasa Pro packs</Source>).
        </li>
        <li>
          <strong>Size they state:</strong> Fotocasa, 13,800 clients and 28 million visits a
          month; habitaclia, 5,600 clients and 18 million (
          <Source href={S.fotocasaAbout}>Fotocasa</Source>,{" "}
          <Source href={S.habitacliaAbout}>habitaclia</Source>).
        </li>
        <li>
          <strong>Enquiries:</strong> the “opportunity manager” emails the assigned
          agent about each call, missed ones included (
          <Source href={S.fotocasaLeads}>opportunity manager</Source>).
        </li>
        <li>
          <strong>Listings:</strong> your CRM connects with an InmoFactory key, and the same
          connection covers habitaclia (<Source href={S.witeiInmofactory}>Witei help</Source>).
        </li>
      </ul>

      <h3>pisos.com, yaencontre and Milanuncios</h3>
      <ul>
        <li>
          <strong>pisos.com</strong> sells “different publishing packs” through its
          sales team, alongside its own CRM and app (
          <Source href={S.pisosPro}>pisos.com, professionals</Source>).
        </li>
        <li>
          <strong>yaencontre</strong> also quotes on request; enquiries arrive as direct messages
          on the platform (<Source href={S.yaencontrePro}>yaencontre, new professional</Source>).
        </li>
        <li>
          <strong>Milanuncios</strong> lets professionals publish 2 property listings per category
          for free. For more, it sends you to Fotocasa Pro (
          <Source href={S.milanunciosPro}>Milanuncios help</Source>). Its general PRO plans are
          not property prices.
        </li>
      </ul>

      <h2>What others have published, unverified</h2>
      <p>
        Because the portals don’t publish their prices, the figures you’ll find online
        come from blogs, agencies and other CRMs. None says where its number comes from, and we
        couldn’t check them. We show them with their source and date because they’re
        the ones you’ll read elsewhere.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Portal</th>
            <th scope="col">What has been published</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">Idealista</th>
            <td>
              “From €60/month + VAT”, and over €300 depending on area and services (
              <Source href={S.reportInmogesco}>inmoGesco</Source>, updated April 2026)
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Idealista</th>
            <td>
              From €150/month (<Source href={S.reportInmolovers}>Inmolovers</Source>, 11
              February 2026)
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Idealista</th>
            <td>
              €200–500/month just to be there, averaging about €1,000 (
              <Source href={S.reportPsi}>Diario de un PSI</Source>, 25 June 2025, opinion
              piece)
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Fotocasa and habitaclia</th>
            <td>
              Fotocasa from €100/month and habitaclia from €80/month (
              <Source href={S.reportInmolovers}>Inmolovers</Source>, 11 February 2026)
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">pisos.com</th>
            <td>
              From €50/month (<Source href={S.reportInmolovers}>Inmolovers</Source>, 11 February
              2026)
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">yaencontre</th>
            <td>
              From €60/month (<Source href={S.reportInmolovers}>Inmolovers</Source>, 11 February
              2026)
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        There’s a reason the figures don’t agree: the price depends on the area, the
        number of listings, the extras (featured spots, other languages, the group’s other
        portals) and what you negotiate with the sales rep, minimum term included.
      </p>

      <h2>International portals</h2>
      <p>
        On the Costa del Sol and the Costa Blanca many buyers come from abroad, and here some
        portals do publish their prices.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Portal</th>
            <th scope="col">Price for agencies</th>
            <th scope="col">What they state</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">Kyero</th>
            <td>On request; no free listings since 1 January 2026</td>
            <td>3 million buyers and 70,000 enquiries a month</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">ThinkSpain</th>
            <td>Published: from €118 + VAT for 90 days (25 listings)</td>
            <td>Over 1 million visitors and 50,000 enquiries a month</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Properstar</th>
            <td>Published: from €132.50/month (20 listings, billed yearly)</td>
            <td>35 countries and 80+ partner portals</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Spainhouses</th>
            <td>Published: from €36/month (25 listings, Málaga offer)</td>
            <td>Discounts for paying quarterly, half-yearly or yearly</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">FINN.no</th>
            <td>Published: per listing, from NOK 2,360 down to NOK 571 + VAT</td>
            <td>Norway’s overseas property section</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Rightmove Overseas</th>
            <td>On request</td>
            <td>Over 26 million visitors a year</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Green-Acres</th>
            <td>On request; 30-day free trial</td>
            <td>70% of visitors from abroad</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">JamesEdition</th>
            <td>On request; homes from $490,000</td>
            <td>Over 2.4 million visits a month</td>
          </tr>
        </tbody>
      </table>

      <h3>Kyero</h3>
      <ul>
        <li>
          <strong>No longer free:</strong> it stopped publishing free listings on 31 December
          2025, and since 1 January 2026 only paying agencies appear (
          <Source href={S.kyeroEndsFree}>Kyero, November 2025</Source>).
        </li>
        <li>
          <strong>Price:</strong> a paid subscription with no published price list: you contact Kyero (
          <Source href={S.kyeroFeatures}>Kyero</Source>).
        </li>
        <li>
          <strong>VAT:</strong> the company is British (Portal 47 Ltd). It charges no Spanish VAT,
          and no UK VAT to EU-registered businesses (
          <Source href={S.kyeroVat}>Kyero help</Source>).
        </li>
        <li>
          <strong>Listings and enquiries:</strong> it imports your stock in its own XML format,
          which more than 50 systems can write, and emails you enquiries, to two addresses at most
          (<Source href={S.kyeroXml}>XML specification</Source>,{" "}
          <Source href={S.kyeroEmails}>enquiry emails</Source>).
        </li>
        <li>
          <strong>Audience:</strong> its 12-month unique visits come mostly from the UK (4.2
          million), Spain (3.25), the Netherlands (1.7), Germany (1.55), France (1.35) and the US
          (1.05) (<Source href={S.kyeroJoin}>Kyero for agents</Source>).
        </li>
      </ul>

      <h3>ThinkSpain</h3>
      <p>
        Introductory 90-day packs for new agencies, or those that haven’t advertised for over
        a year, excluding VAT. A fixed fee with no commission, and enquiries come by email and to
        the control panel (<Source href={S.thinkspain}>ThinkSpain for agents</Source>):
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Listings</th>
            <th scope="col">Price for 90 days</th>
            <th scope="col">Featured</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>25</td>
            <td>€118</td>
            <td>1</td>
          </tr>
          <tr>
            <td>50</td>
            <td>€161</td>
            <td>2</td>
          </tr>
          <tr>
            <td>100</td>
            <td>€227</td>
            <td>5</td>
          </tr>
          <tr>
            <td>250</td>
            <td>€377</td>
            <td>10</td>
          </tr>
          <tr>
            <td>500</td>
            <td>€625</td>
            <td>25</td>
          </tr>
        </tbody>
      </table>
      <p>
        The same page mentions “from as little as 25 euros per month” on the annual
        option, without publishing the annual table.
      </p>

      <h3>Properstar</h3>
      <p>
        Properstar, which now includes ListGlobally, publishes three plans in euros without saying
        whether VAT is included; above 100 listings, on request (
        <Source href={S.properstarPricing}>Properstar pricing</Source>):
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Plan</th>
            <th scope="col">Billed yearly</th>
            <th scope="col">Billed every 6 months</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Global 20</td>
            <td>€132.50/month</td>
            <td>€150/month</td>
          </tr>
          <tr>
            <td>Global 50</td>
            <td>€225/month</td>
            <td>€248.33/month</td>
          </tr>
          <tr>
            <td>Global 100</td>
            <td>€366.67/month</td>
            <td>€406.67/month</td>
          </tr>
        </tbody>
      </table>
      <p>
        It’s paid in advance and renews automatically: to cancel, give at least 30 days’
        notice before the renewal date (<Source href={S.properstarCancel}>Properstar help</Source>
        ). It reads Kyero’s XML among other formats, and sends enquiries by email or straight
        into your CRM.
      </p>

      <h3>Spainhouses.net</h3>
      <p>
        It publishes its prices through a calculator by province. With the Málaga offer, VAT not
        stated (<Source href={S.spainhouses}>Spainhouses pricing</Source>):
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Listings</th>
            <th scope="col">Monthly</th>
            <th scope="col">Billed yearly</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>25</td>
            <td>€36/month</td>
            <td>€345.60 (€28.80/month)</td>
          </tr>
          <tr>
            <td>50</td>
            <td>€54/month</td>
            <td>€518.40</td>
          </tr>
          <tr>
            <td>100</td>
            <td>€96/month</td>
            <td>€921.60</td>
          </tr>
          <tr>
            <td>250</td>
            <td>€126/month</td>
            <td>€1,209.60</td>
          </tr>
          <tr>
            <td>500</td>
            <td>€156/month</td>
            <td>€1,497.60</td>
          </tr>
        </tbody>
      </table>

      <p>Paying ahead lowers the price: 10% off quarterly, 15% half-yearly and 20% yearly.</p>

      <h3>FINN.no (Norway)</h3>
      <p>
        Norway’s biggest portal has an overseas property section where Spanish agencies
        advertise. It charges per listing, cheaper the more you publish, in Norwegian kroner
        excluding VAT, with new prices from 5 January 2027 (
        <Source href={S.finn}>FINN prices</Source>):
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Listings</th>
            <th scope="col">NOK per listing</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1–10</td>
            <td>2,360</td>
          </tr>
          <tr>
            <td>11–50</td>
            <td>1,636</td>
          </tr>
          <tr>
            <td>51–100</td>
            <td>1,319</td>
          </tr>
          <tr>
            <td>101–250</td>
            <td>821</td>
          </tr>
          <tr>
            <td>250–499</td>
            <td>726</td>
          </tr>
          <tr>
            <td>500 or more</td>
            <td>571</td>
          </tr>
        </tbody>
      </table>

      <h3>Rightmove Overseas, Green-Acres and JamesEdition</h3>
      <ul>
        <li>
          <strong>Rightmove Overseas</strong>: you fill in a form and an account manager calls you
          back within 3 to 5 working days (<Source href={S.rightmove}>Rightmove Overseas</Source>).
        </li>
        <li>
          <strong>Green-Acres</strong>: a 30-day free trial with no commitment, then a tailored
          price; 70% of its visitors are from abroad, mostly the Netherlands, Germany, the UK and
          Belgium (<Source href={S.greenAcres}>Green-Acres for professionals</Source>).
        </li>
        <li>
          <strong>JamesEdition</strong>, for luxury: Elite and Elite Plus plans with tailored
          pricing, and homes from $490,000 (
          <Source href={S.jamesEdition}>JamesEdition for professionals</Source>).
        </li>
      </ul>
      <p>
        And don’t forget idealista’s reach outside Spain: it has 18 versions in other
        languages and translates your listings into English automatically (
        <Source href={S.idealistaTranslate}>idealista/tools help</Source>).
      </p>

      <h2>What changed in 2025 and 2026</h2>
      <dl>
        <dt>June 2024</dt>
        <dd>
          The fund Cinven buys control of idealista (
          <Source href={S.newsCinven}>elDiario.es</Source>).
        </dd>
        <dt>March 2025</dt>
        <dd>
          Immobiliare.it buys pisos.com from Vocento (
          <Source href={S.newsPisos}>Online Marketplaces</Source>).
        </dd>
        <dt>September 2025</dt>
        <dd>
          Scout24, owner of ImmoScout24, agrees to buy Fotocasa and habitaclia; the deal closes in
          March 2026 and the brands stay separate (<Source href={S.newsScout24}>Scout24</Source>,{" "}
          <Source href={S.newsScout24Close}>Online Marketplaces</Source>). The same month,
          idealista drops its purchase of Kyero over the conditions set by Spain’s
          competition authority, the CNMC (<Source href={S.newsKyeroDeal}>Forbes</Source>).
        </dd>
        <dt>31 December 2025</dt>
        <dd>Kyero stops publishing free listings.</dd>
      </dl>

      <h2>Before you sign with a portal: what to ask</h2>
      <ol>
        <li>The price for your area and number of listings, in writing.</li>
        <li>The minimum term, whether it renews automatically, and how much notice you need to leave.</li>
        <li>Whether the price includes VAT.</li>
        <li>What the pack includes: featured spots, other languages, the group’s other portals.</li>
        <li>
          How enquiries reach you: email, app or calls, and whether you can forward them to another
          address.
        </li>
        <li>Which upload format it accepts, and whether your CRM already connects.</li>
        <li>How many enquiries listings like yours get a month in your area.</li>
      </ol>

      <h2>Every portal’s enquiries, in one list</h2>
      <p>
        With two or three portals, enquiries reach you through idealista’s Inbox,
        Fotocasa’s alerts, Kyero’s emails and WhatsApp, and none of those inboxes tells
        you whom to write to again. {SITE_NAME} is a CRM for independent agents that puts them in
        one list, each with its next step.
      </p>
      <p>
        Today it works by pasting: you copy the portal’s enquiry, paste it into the lead box
        and get the client card back filled in for you to check. There is no automatic connection
        to the portals. It’s free up to 10 clients; the details are on the{" "}
        <Link href={marketingPath("pricing", L)}>pricing page</Link> and in{" "}
        <Link href={marketingPath("guideIdealista", L)}>how to handle idealista leads</Link>.
      </p>

      <h2>Sources</h2>
      <p>The portals’ own sites, checked on {AS_OF}.</p>
      <ul>
        <li>
          Idealista: <Source href={S.idealistaPro}>professionals</Source>,{" "}
          <Source href={S.idealistaPrivate}>prices for private sellers</Source>,{" "}
          <Source href={S.idealistaAgentAccount}>agents’ accounts</Source>,{" "}
          <Source href={S.idealistaInbox}>Inbox</Source>,{" "}
          <Source href={S.idealistaSoftware}>recommended software</Source>,{" "}
          <Source href={S.idealistaTranslate}>automatic translation</Source>.
        </li>
        <li>
          Fotocasa Pro: <Source href={S.fotocasaPacks}>packs</Source>,{" "}
          <Source href={S.fotocasaAbout}>Fotocasa</Source>,{" "}
          <Source href={S.habitacliaAbout}>habitaclia</Source>,{" "}
          <Source href={S.fotocasaLeads}>opportunity manager</Source>; the InmoFactory
          connection, <Source href={S.witeiInmofactory}>Witei help</Source>.
        </li>
        <li>
          <Source href={S.pisosPro}>pisos.com</Source>,{" "}
          <Source href={S.yaencontrePro}>yaencontre</Source>,{" "}
          <Source href={S.milanunciosPro}>Milanuncios</Source>.
        </li>
        <li>
          Kyero: <Source href={S.kyeroEndsFree}>end of free listings</Source>,{" "}
          <Source href={S.kyeroFeatures}>plans</Source>, <Source href={S.kyeroVat}>VAT</Source>,{" "}
          <Source href={S.kyeroXml}>XML</Source>,{" "}
          <Source href={S.kyeroEmails}>enquiry emails</Source>,{" "}
          <Source href={S.kyeroJoin}>audience</Source>.
        </li>
        <li>
          <Source href={S.thinkspain}>ThinkSpain</Source>,{" "}
          <Source href={S.properstarPricing}>Properstar</Source> (and{" "}
          <Source href={S.properstarCancel}>its terms</Source>),{" "}
          <Source href={S.spainhouses}>Spainhouses.net</Source>,{" "}
          <Source href={S.finn}>FINN.no</Source>, <Source href={S.rightmove}>Rightmove Overseas</Source>
          , <Source href={S.greenAcres}>Green-Acres</Source>{" "}
          and <Source href={S.jamesEdition}>JamesEdition</Source>.
        </li>
        <li>
          Unverified figures: <Source href={S.reportInmogesco}>inmoGesco</Source>,{" "}
          <Source href={S.reportInmolovers}>Inmolovers</Source>,{" "}
          <Source href={S.reportPsi}>Diario de un PSI</Source>.
        </li>
        <li>
          News: <Source href={S.newsCinven}>elDiario.es</Source>,{" "}
          <Source href={S.newsPisos}>Online Marketplaces (pisos.com)</Source>,{" "}
          <Source href={S.newsScout24}>Scout24</Source>,{" "}
          <Source href={S.newsScout24Close}>Online Marketplaces (Fotocasa)</Source>,{" "}
          <Source href={S.newsKyeroDeal}>Forbes</Source>.
        </li>
      </ul>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "What Idealista, Fotocasa and Kyero charge agents (2026)",
  description:
    "Idealista and Fotocasa don't publish their prices for agencies. What each Spanish and international portal charges, which prices are official, with sources.",
  kind: "article",
  published: FIRST_PUBLISHED,
  modified: LAST_CHECKED,
  eyebrow: "Guide · Portals",
  heading: "What Idealista, Fotocasa and the international portals charge an agency in Spain",
  lead: "No Spanish national portal publishes its prices for professionals: Idealista, Fotocasa and habitaclia, pisos.com and yaencontre quote on a sales call, by area and number of listings. Of the portals coast agencies use, only ThinkSpain, Properstar, Spainhouses and FINN.no publish their prices. The figures quoted for Idealista come from blogs with no source, and Kyero stopped being free on 31 December 2025.",
  Body,
  faq: [
    {
      q: "How much does Idealista cost an estate agency?",
      a: "Idealista doesn't publish its prices for professionals: its sales team quotes by area, number of listings and services. The figures quoted online, from €60 or €150 a month up to averages of €1,000, come from blogs and other CRMs with no source and are unverified.",
    },
    {
      q: "Can an estate agent list on Idealista for free?",
      a: "No. Idealista requires agencies and agents to use a paid professional profile, and may block a private account used by an agent. The two free listings are for private sellers.",
    },
    {
      q: "How much does Fotocasa Pro cost?",
      a: "Fotocasa Pro sells three packs, Start, Basic and Premium, which publish on Fotocasa, habitaclia and Milanuncios, but it doesn't publish their prices: you ask its sales team.",
    },
    {
      q: "Is Kyero still free for estate agents?",
      a: "No. Kyero stopped publishing free listings on 31 December 2025, and since 1 January 2026 only agencies paying a subscription appear, priced on request.",
    },
    {
      q: "Which international portals publish their prices for agencies?",
      a: "Among those coast agencies use: ThinkSpain (90-day packs from €118 + VAT), Properstar (from €132.50 a month billed yearly), Spainhouses.net (from €36 a month with the Málaga offer) and Norway's FINN.no (per listing). Kyero, Rightmove Overseas, Green-Acres and JamesEdition price on request.",
    },
  ],
  related: ["guideIdealista", "crmMarbella", "toolCommission"],
};
