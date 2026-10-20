import Link from "next/link";

import { intlTag } from "@/i18n/config";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { PRICES } from "@/lib/billing";
import { marketingPath } from "@/lib/routes";
import { CHECKED, PUBLISHED } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { SOURCES as S } from "@/content/pages/crm-comparison.sources";

const L = "en";

/** The day the page was first published, which stays its datePublished. */
const FIRST_PUBLISHED = PUBLISHED.guideBestCrm;

/**
 * The day every price and feature was last checked on the vendors' own sites.
 * It is also the "Updated" date, dateModified and the sitemap's lastmod, so
 * the quarterly re-check (plan 025) bumps CHECKED, never PUBLISHED.
 */
const LAST_CHECKED = CHECKED.guideBestCrm ?? FIRST_PUBLISHED;

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
      <Callout title={`Checked on ${AS_OF}`}>
        <ul>
          <li>
            Prices and features come from each vendor’s own site, linked where they’re used.
            Prices exclude VAT unless marked “VAT included”.
          </li>
          <li>
            {SITE_NAME} publishes this guide. It’s named where it fits, together with what it
            doesn’t do.
          </li>
        </ul>
      </Callout>

      <h2>Start with how you work</h2>
      <p>
        Most independent agents work in one of five ways, often more than one at a time. Each
        asks for a different kind of CRM.
      </p>

      <h3>1. You sell other agencies’ listings</h3>
      <p>
        Your work is the clients: the buyers you introduce, their viewings and offers, and the
        follow-ups. Agency CRMs are built around one agency’s listings, and the account usually
        belongs to that agency. What fits is a client book of your own:
      </p>
      <ul>
        <li>
          <strong>{SITE_NAME}</strong> is built for this. Each client is tagged with the agency
          it came through, so one book covers every agency you sell for. Free for{" "}
          {FREE_CLIENT_LIMIT} clients; Pro is €{PRICES.standard.monthly} a month (
          <Link href={marketingPath("pricing", L)}>pricing</Link>).
        </li>
        <li>
          <strong>A spreadsheet</strong> works for a few dozen clients if you keep it up to date,
          though it won’t remind you of anything or write a message. The{" "}
          <Link href={marketingPath("toolSpreadsheet", L)}>free client tracker</Link> imports
          into {SITE_NAME} if you move later.
        </li>
        <li>
          <strong>HubSpot or Zoho CRM</strong>, free for 2 and 3 users, if you’re happy to set up
          properties and viewings yourself (
          <Link href={marketingPath("guideFreeCrm", L)}>free CRMs compared</Link>).
        </li>
      </ul>
      <p>
        One caution: if an agency passed a client to you, your agreement with that agency decides
        whether you can keep their details in your own system.
      </p>

      <h3>2. You list your own properties and want them on the portals</h3>
      <p>
        Then you need portal gateways, a website and matching between buyers and listings, which
        is what Spain’s agency CRMs are built for. Their cheapest plans:
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">CRM</th>
            <th scope="col">Cheapest plan</th>
            <th scope="col">What sets it apart</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">inmoGesco</th>
            <td>Free without portals; PRO €29 a month billed yearly, 2 users</td>
            <td>Website and its own MLS on every plan; its portals page doesn’t list Fotocasa</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Witei</th>
            <td>€50 a month for contacts and properties</td>
            <td>No idealista for accounts opened since February 2022</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Sooprema</th>
            <td>€39 a month for 150 properties</td>
            <td>Unlimited users, 70+ portals, a 14-day trial</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Inmoweb</th>
            <td>€36 a month, 1 user</td>
            <td>idealista, Fotocasa and habitaclia in real time; its lead inbox from €59</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Mobilia</th>
            <td>€49 a month, 1 user</td>
            <td>WhatsApp through Meta’s official API</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Vesta CRM</th>
            <td>€44.90 a month, 2 users</td>
            <td>Website included; a WhatsApp number in its inbox €8.90 a month</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Inmovilla</th>
            <td>€79 a month, up to 7 users</td>
            <td>idealista, Fotocasa and pisos.com in real time; website included</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">InmoProCRM</th>
            <td>Free for 20 properties; €39 a month, VAT included</td>
            <td>About 40 portals; WhatsApp linked by QR code</td>
          </tr>
        </tbody>
      </table>
      <p>
        From each vendor’s site: <Source href={S.inmogescoPrices}>inmoGesco</Source>,{" "}
        <Source href={S.witeiPrices}>Witei</Source> (and{" "}
        <Source href={S.witeiIdealista}>idealista</Source>),{" "}
        <Source href={S.sooprema}>Sooprema</Source>,{" "}
        <Source href={S.inmowebPrices}>Inmoweb</Source>,{" "}
        <Source href={S.mobiliaPrices}>Mobilia</Source>,{" "}
        <Source href={S.vestaPrices}>Vesta CRM</Source>,{" "}
        <Source href={S.inmovillaPrices}>Inmovilla</Source>,{" "}
        <Source href={S.inmoprocrm}>InmoProCRM</Source>. If idealista is where your buyers find
        you, check the gateway before anything else.
      </p>

      <h3>3. You work the Costa del Sol’s shared listings</h3>
      <p>On the coast, agencies share listings through networks, and the CRM comes with the network:</p>
      <ul>
        <li>
          <strong>Resales Online:</strong> €190 a month for 4 users (
          <Source href={S.resalesFees}>fees</Source>), with 2,149 active agencies on its home page
          on {AS_OF} (<Source href={S.resalesHome}>Resales Online</Source>). When you book a
          viewing on another agent’s listing, they see only your client’s surname and the last
          four digits of their phone (<Source href={S.resalesViewings}>viewings</Source>). It
          asks for a corporate email on your own domain (
          <Source href={S.resalesLicence}>licence</Source>).
        </li>
        <li>
          <strong>PropertyList:</strong> its MLS and core CRM are free; moving a buyer into the
          buyer pipeline costs a credit after the first five, at €0.80 to €1 per credit. More
          than 1,040 agencies (<Source href={S.propertylistFree}>PropertyList</Source>).
        </li>
      </ul>

      <h3>4. Most of your conversations happen on WhatsApp</h3>
      <p>“WhatsApp integration” covers three different things, so ask which one you’re getting:</p>
      <ul>
        <li>
          <strong>A button that opens the chat.</strong> The CRM opens WhatsApp with the client’s
          number, sometimes with a message ready, and the conversation stays in WhatsApp. Witei,
          Inmoweb, Resales Online, inmoGesco and Fincta work this way (
          <Source href={S.witeiWhatsapp}>Witei</Source>,{" "}
          <Source href={S.inmowebWhatsapp}>Inmoweb</Source>,{" "}
          <Source href={S.resalesWhatsapp}>Resales</Source>). So does {SITE_NAME}, which first
          drafts the message in your client’s language.
        </li>
        <li>
          <strong>Your number linked by QR code</strong>, the way WhatsApp Web works: Inmovilla’s
          paid inbox and InmoProCRM. Messages land in the CRM, but Inmovilla’s own guide warns
          that WhatsApp can block a number it sees misused (
          <Source href={S.inmovillaFaqWhatsapp}>Inmovilla</Source>,{" "}
          <Source href={S.inmoprocrmWhatsapp}>InmoProCRM</Source>).
        </li>
        <li>
          <strong>Meta’s official WhatsApp Business Platform:</strong> Mobilia; Clientify, with
          Meta’s message fees on top; HubSpot from its Professional plans; and Zoho CRM on paid
          plans, with message credits (<Source href={S.mobiliaWhatsapp}>Mobilia</Source>,{" "}
          <Source href={S.clientifyPrices}>Clientify</Source>,{" "}
          <Source href={S.hubspotWhatsapp}>HubSpot</Source>,{" "}
          <Source href={S.zohoFeatures}>Zoho</Source>).
        </li>
      </ul>

      <h3>5. Your clients don’t speak Spanish</h3>
      <p>Two different things: the language of the CRM’s screens, and the language of what you send.</p>
      <ul>
        <li>
          <strong>Screens:</strong> Resales Online’s desktop comes in 13 languages, Russian
          included (<Source href={S.resalesLanguages}>Resales</Source>); Zoho CRM in 28 and
          Pipedrive in 24, both with Russian (<Source href={S.zohoPricing}>Zoho</Source>,{" "}
          <Source href={S.pipedrivePricing}>Pipedrive</Source>). Inmovilla is in Spanish, English
          and Portuguese (<Source href={S.inmovillaFaqLanguages}>Inmovilla</Source>), Inmoweb
          and Fincta in Spanish and English (<Source href={S.inmowebLanguages}>Inmoweb</Source>,{" "}
          <Source href={S.finctaPrices}>Fincta</Source>), and HubSpot has no Russian (
          <Source href={S.hubspotLanguages}>HubSpot</Source>). {SITE_NAME} is in English, Spanish
          and Russian.
        </li>
        <li>
          <strong>Messages:</strong> {SITE_NAME} drafts each follow-up in the client’s own
          language. Resales Online’s AI Translate fills in listing descriptions in missing
          languages (<Source href={S.resalesAiTranslate}>Resales</Source>), and Sooprema writes AI
          descriptions in 14 languages (<Source href={S.sooprema}>Sooprema</Source>).
        </li>
      </ul>

      <h2>What one agent pays</h2>
      <p>
        The cheapest way in for one agent, from each vendor’s price page, linked above or in the
        sources. Prices exclude VAT unless marked.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">CRM</th>
            <th scope="col">Free plan</th>
            <th scope="col">Cheapest paid plan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">Clientify</th>
            <td>No; a 7-day trial</td>
            <td>€39 a month billed yearly, 1 user</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Fincta</th>
            <td>Everything until 1 February 2027, then 12 clients</td>
            <td>€49 a month, up to 6 agents</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">HubSpot</th>
            <td>2 users, 1,000 contacts</td>
            <td>From €7 a month per user billed yearly, for new customers</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">inmoGesco</th>
            <td>Unlimited clients and properties, 1 user, no portals</td>
            <td>€29 a month billed yearly, 2 users</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">InmoProCRM</th>
            <td>20 properties, 1 user</td>
            <td>€39 a month, VAT included</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Inmovilla</th>
            <td>No; a 15-day trial</td>
            <td>€79 a month, up to 7 users</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Inmoweb</th>
            <td>No; a demo</td>
            <td>€36 a month, 1 user</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">{SITE_NAME}</th>
            <td>{FREE_CLIENT_LIMIT} clients, every feature</td>
            <td>€{PRICES.standard.monthly} a month, unlimited clients</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Mobilia</th>
            <td>No; a demo</td>
            <td>€49 a month, 1 user</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Pipedrive</th>
            <td>No; a 14-day trial</td>
            <td>€14 a month per user billed yearly</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">PropertyList</th>
            <td>Its MLS and core CRM</td>
            <td>Credits at €0.80 to €1 each</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Resales Online</th>
            <td>Standalone CRM “not currently billed”</td>
            <td>€190 a month, 4 users</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Sooprema</th>
            <td>No; a 14-day trial</td>
            <td>€39 a month for 150 properties</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Vesta CRM</th>
            <td>No; a trial</td>
            <td>€44.90 a month, 2 users</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Witei</th>
            <td>250 contacts, 10 properties, 1 user</td>
            <td>€25 a month per module</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Zoho CRM</th>
            <td>3 users, 5,000 records</td>
            <td>€14 a month per user billed yearly</td>
          </tr>
        </tbody>
      </table>

      <h2>Questions to ask before you move your clients in</h2>
      <ol>
        <li>Is it built around an agency’s listings, a network’s, or your own clients?</li>
        <li>Which portals does it publish to, idealista included, and from which plan?</li>
        <li>How do portal enquiries get in: forwarded emails, a direct connection, or by hand?</li>
        <li>How does it connect to WhatsApp: a button, a QR-linked session or the official API?</li>
        <li>What does one agent pay with VAT, and is there a minimum term?</li>
        <li>
          Can you export everything yourself, in what format, and what happens to your data when
          you leave?
        </li>
      </ol>

      <h2>Where {SITE_NAME} fits, and where it doesn’t</h2>
      <p>
        {SITE_NAME} is for the first situation: an independent agent who sells for several
        agencies and needs one place for their own buyers, sellers, viewings, offers and
        follow-ups. You paste a portal enquiry and it fills in the client card, it drafts each
        follow-up in the client’s language for you to send from WhatsApp, and it works in
        English, Spanish or Russian.
      </p>
      <p>
        It doesn’t publish listings to the portals, run a website, share an MLS or manage a team,
        and it handles sales, not rentals yet. If you need those, one of the CRMs above will serve
        you better. Free covers {FREE_CLIENT_LIMIT} clients with every feature; Pro is €
        {PRICES.standard.monthly} a month plus VAT (
        <Link href={marketingPath("pricing", L)}>pricing</Link>).
      </p>

      <h2>Sources</h2>
      <p>Each vendor’s own site, help centre or terms, checked on {AS_OF}.</p>
      <ul>
        <li>
          Agency CRMs: <Source href={S.inmogescoPrices}>inmoGesco</Source>,{" "}
          <Source href={S.witeiPrices}>Witei</Source>,{" "}
          <Source href={S.sooprema}>Sooprema</Source>,{" "}
          <Source href={S.inmowebPrices}>Inmoweb</Source>,{" "}
          <Source href={S.mobiliaPrices}>Mobilia</Source>,{" "}
          <Source href={S.vestaPrices}>Vesta CRM</Source>,{" "}
          <Source href={S.inmovillaPrices}>Inmovilla</Source>,{" "}
          <Source href={S.inmoprocrm}>InmoProCRM</Source>,{" "}
          <Source href={S.finctaPrices}>Fincta</Source>.
        </li>
        <li>
          Networks: Resales Online (<Source href={S.resalesFees}>fees</Source>,{" "}
          <Source href={S.resalesStandalone}>Standalone</Source>,{" "}
          <Source href={S.resalesViewings}>viewings</Source>,{" "}
          <Source href={S.resalesLicence}>licence</Source>), PropertyList (
          <Source href={S.propertylistFree}>free plan</Source>,{" "}
          <Source href={S.propertylistPrices}>prices</Source>).
        </li>
        <li>
          General CRMs: <Source href={S.hubspotCrm}>HubSpot</Source> (
          <Source href={S.hubspotStarter}>Starter</Source>), <Source href={S.zohoFree}>Zoho CRM</Source>{" "}
          (<Source href={S.zohoPricing}>prices</Source>),{" "}
          <Source href={S.pipedrivePricing}>Pipedrive</Source>,{" "}
          <Source href={S.clientifyPrices}>Clientify</Source>.
        </li>
      </ul>
      <p>
        Comparing free plans? See{" "}
        <Link href={marketingPath("guideFreeCrm", L)}>what each free real estate CRM includes</Link>
        . Leaving Witei or Inmovilla? See{" "}
        <Link href={marketingPath("guideCrmAlternatives", L)}>the alternatives and how to move</Link>
        .
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Best CRM for independent estate agents in Spain (2026)",
  description:
    "Which CRM suits an independent estate agent in Spain: selling across agencies, listing your own homes, the Costa del Sol MLS or WhatsApp, with vendors' prices.",
  kind: "article",
  published: FIRST_PUBLISHED,
  modified: LAST_CHECKED,
  eyebrow: "Guide · CRM",
  heading: "The best CRM for an independent estate agent in Spain depends on whose listings you sell",
  lead: `No single CRM is best for every independent agent in Spain: it depends on whose listings you sell and where your clients come from. If you sell other agencies’ listings, you need a client book of your own rather than listing software: ${SITE_NAME}, a spreadsheet or a free general CRM. If you list your own properties, you need portal gateways and a website: inmoGesco, Witei, Inmovilla, Sooprema, Inmoweb or Mobilia. On the Costa del Sol’s shared listings, Resales Online or PropertyList.`,
  Body,
  faq: [
    {
      q: "What is the best CRM for an estate agent in Spain?",
      a: `It depends on how you work. Agents who sell other agencies' listings need a client book of their own (${SITE_NAME}, a spreadsheet or a free general CRM). Agents who list their own properties need portal gateways and a website (inmoGesco, Witei, Inmovilla, Sooprema, Inmoweb, Mobilia). On the Costa del Sol, Resales Online and PropertyList come with a shared-listings network.`,
    },
    {
      q: "Which CRM works if I sell for several agencies?",
      a: `One that holds your clients rather than one agency's listings. ${SITE_NAME} tags each client with the agency it came through, so one book covers all of them; agency CRMs are built around a single agency's stock, and the account usually belongs to that agency.`,
    },
    {
      q: "Which real estate CRMs publish to idealista?",
      a: `Inmovilla and Inmoweb publish to idealista in real time, and Sooprema, Mobilia, Vesta, InmoProCRM and inmoGesco's paid plans list it among their portals. Witei can't activate new idealista gateways since February 2022. Fincta and ${SITE_NAME} don't publish listings.`,
    },
    {
      q: "Which real estate CRM uses the official WhatsApp API?",
      a: "Mobilia connects through Meta's official WhatsApp Business API, as do Clientify, HubSpot's Professional plans and Zoho CRM's paid plans. Inmovilla's WhatsApp inbox and InmoProCRM link your number by QR code instead, the way WhatsApp Web does.",
    },
    {
      q: "Is a spreadsheet enough for an independent agent?",
      a: "For a few dozen clients, yes, if you update it after every call and viewing. It won't remind you whom to follow up or draft the message, which is when a CRM starts to pay for itself.",
    },
  ],
  related: ["guideFreeCrm", "guideCrmAlternatives", "crmSpain"],
  topic: { "@type": "Thing", name: "Real estate CRM software in Spain" },
};
