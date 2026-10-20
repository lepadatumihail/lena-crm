import Link from "next/link";

import { intlTag } from "@/i18n/config";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES } from "@/lib/billing";
import { marketingPath } from "@/lib/routes";
import { CHECKED, PUBLISHED } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { SOURCES as S } from "@/content/pages/crm-comparison.sources";

const L = "en";

/** The day the page was first published, which stays its datePublished. */
const FIRST_PUBLISHED = PUBLISHED.guideFreeCrm;

/**
 * The day every plan and limit was last checked on the vendors' own sites.
 * It is also the "Updated" date, dateModified and the sitemap's lastmod, so
 * the quarterly re-check (plan 025) bumps CHECKED, never PUBLISHED.
 */
const LAST_CHECKED = CHECKED.guideFreeCrm ?? FIRST_PUBLISHED;

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
            “Free” means four different things below: a plan with no end date, a free core with
            paid extras, a promotion with an end date, and a trial.
          </li>
          <li>
            Every limit and price comes from the vendor’s own site, linked where it’s used.
            Prices exclude VAT unless marked “VAT included”.
          </li>
          <li>{SITE_NAME} publishes this guide and is one of the CRMs in it.</li>
        </ul>
      </Callout>

      <h2>Free plans side by side</h2>
      <p>
        The CRMs built for estate agents in Spain come first, then two general sales CRMs. The
        last column is the cheapest way to pay once you outgrow the free plan.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">CRM</th>
            <th scope="col">Free plan</th>
            <th scope="col">When you outgrow it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">inmoGesco</th>
            <td>
              No end date: unlimited clients and properties, 1 user, a website on a subdomain. No
              portal publishing.
            </td>
            <td>PRO: €29 a month billed yearly, or €35 monthly, for 2 users</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Witei</th>
            <td>
              No end date: 250 contacts, 10 properties, 1 user. No portal gateways, lead inbox or
              website.
            </td>
            <td>€25 a month per module; contacts and properties together €50</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">InmoProCRM</th>
            <td>No end date: 20 properties, unlimited contacts, 1 user, every feature</td>
            <td>Premium: €39 a month, VAT included, for 200 properties</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">PropertyList</th>
            <td>
              No end date for its MLS, core CRM, listings and microsite; each buyer moved into the
              buyer pipeline costs 1 credit after the first 5
            </td>
            <td>Credits at €0.80 to €1 each</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">{SITE_NAME}</th>
            <td>
              No end date: {FREE_CLIENT_LIMIT} clients, buyers and sellers together, every
              feature, 1 agent
            </td>
            <td>Pro: €{PRICES.standard.monthly} a month, unlimited clients</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Fincta</th>
            <td>Everything until 1 February 2027; then 1 agent, 12 clients and 7 properties</td>
            <td>Agency S: €49 a month for up to 6 agents</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">HubSpot</th>
            <td>No end date: 2 users and 1,000 contacts, as a general sales CRM</td>
            <td>Starter: from €7 a month per user billed yearly, a new-customer offer</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Zoho CRM</th>
            <td>No end date: 3 users and 5,000 records, as a general sales CRM</td>
            <td>Standard: €14 a month per user billed yearly</td>
          </tr>
        </tbody>
      </table>

      <h2>Each free plan in detail</h2>

      <h3>inmoGesco</h3>
      <ul>
        <li>
          <strong>What’s free:</strong> clients and properties without limit, for one user and
          one office, with a website on a subdomain, inmoGesco’s own MLS, matching and email
          alerts to buyers (<Source href={S.inmogescoPrices}>inmoGesco prices</Source>).
        </li>
        <li>
          <strong>What isn’t:</strong> publishing to portals. You can try it for 30 days on
          request; after that it needs PRO or PREMIUM (
          <Source href={S.inmogescoPortals}>portals</Source>).
        </li>
        <li>
          <strong>The catch:</strong> an account with no activity for 6 months is switched off.
        </li>
        <li>
          <strong>Paying:</strong> PRO costs €29 a month billed yearly or €35 monthly, for 2 users
          and €5 per extra user; PREMIUM €39 or €47, for 7 users.
        </li>
      </ul>

      <h3>Witei</h3>
      <ul>
        <li>
          <strong>What’s free:</strong> 250 contacts, 10 properties and one user, with no time
          limit, and matching between contacts and properties (
          <Source href={S.witeiPrices}>Witei prices</Source>).
        </li>
        <li>
          <strong>What isn’t:</strong> portal gateways, SmartInbox (which turns portal emails into
          contacts), emails, Google Calendar and a website.
        </li>
        <li>
          <strong>The catch:</strong> accounts on free plans only can be closed for inactivity
          without notice, and opening one goes through a request that Witei’s team checks (
          <Source href={S.witeiHome}>Witei</Source>).
        </li>
        <li>
          <strong>Paying:</strong> each module costs €25, €45 or €65 a month. The Normal contacts
          module covers 5,000 contacts and 10 users, and the Normal properties module 1,000
          properties and 10 portal gateways. Witei can’t publish to idealista for accounts opened
          since February 2022 (<Source href={S.witeiIdealista}>Witei help</Source>).
        </li>
      </ul>

      <h3>InmoProCRM</h3>
      <ul>
        <li>
          <strong>What’s free:</strong> 20 properties, unlimited contacts, one user and one
          office, with every feature, AI included; no card (
          <Source href={S.inmoprocrm}>InmoProCRM</Source>).
        </li>
        <li>
          <strong>The catch:</strong> above 20 properties you move to a paid plan. Its site dates
          from mid-2026 and doesn’t say how to export your data.
        </li>
        <li>
          <strong>Paying:</strong> €39 a month for 200 properties and 5 users, €69 for 500 and
          €159 for unlimited, VAT included, per agency.
        </li>
        <li>
          <strong>WhatsApp:</strong> linked by QR code as a device, like WhatsApp Web, rather than
          through the official API (<Source href={S.inmoprocrmWhatsapp}>WhatsApp</Source>).
        </li>
      </ul>

      <h3>PropertyList</h3>
      <ul>
        <li>
          <strong>What’s free:</strong> its MLS, the core of the CRM, listings on its portal and a
          microsite, with no card and no contract (
          <Source href={S.propertylistFree}>PropertyList</Source>).
        </li>
        <li>
          <strong>What isn’t:</strong> in its own words, the CRM isn’t 100% free. Moving a
          qualified buyer into the buyer pipeline costs 1 credit after the first 5 (
          <Source href={S.propertylistPipelines}>pipelines</Source>), photos beyond 25 per listing
          cost a credit each, and the website builder costs 50 credits a month.
        </li>
        <li>
          <strong>Paying:</strong> credits in packs, from €20 for 20 to €800 for 1,000, plus VAT,
          and they don’t expire (<Source href={S.propertylistPrices}>PropertyList prices</Source>
          ).
        </li>
        <li>
          <strong>Good to know:</strong> more than 1,040 agencies, centred on the Costa del Sol.
          Your listings export as XML; its pages don’t document an export of your contacts.
        </li>
      </ul>

      <h3>{SITE_NAME}</h3>
      <ul>
        <li>
          <strong>What’s free:</strong> {FREE_CLIENT_LIMIT} clients, buyers and sellers together,
          with every feature, no card and no time limit.
        </li>
        <li>
          <strong>At the limit:</strong> you can’t add another client, and nothing is deleted.
        </li>
        <li>
          <strong>Paying:</strong> Pro is €{PRICES.standard.monthly} a month or €
          {PRICES.standard.yearly} a year for unlimited clients, and the first {FOUNDING_CAP}{" "}
          paying agents keep €{PRICES.founding.monthly} a month for life (
          <Link href={marketingPath("pricing", L)}>pricing</Link>).
        </li>
        <li>
          <strong>What it doesn’t do on any plan:</strong> publish listings, run a website or
          share an MLS. Portal enquiries come in by pasting them.
        </li>
      </ul>

      <h3>Fincta</h3>
      <ul>
        <li>
          <strong>Free for now:</strong> everything is unlocked until 1 February 2027, with no
          card, and paid plans can’t be bought during the promotion (
          <Source href={S.finctaPrices}>Fincta prices</Source>).
        </li>
        <li>
          <strong>Afterwards:</strong> a permanent free plan with 1 agent, 12 clients and 7
          properties. Fincta’s terms say no account gets blocked or loses its data for not paying
          (<Source href={S.finctaTerms}>terms</Source>), and Fincta itself warns that signing up
          now doesn’t make the unlimited plan free for good (
          <Source href={S.finctaFree}>Fincta</Source>).
        </li>
        <li>
          <strong>Paying:</strong> agency plans at €49 a month for up to 6 agents, €89 for 12 and
          €149 for any number.
        </li>
        <li>
          <strong>What it doesn’t do:</strong> publish to portals, as its own comparison table
          says (<Source href={S.finctaCompare}>comparison</Source>).
        </li>
      </ul>

      <h2>Free general CRMs: HubSpot and Zoho</h2>
      <p>
        Both are free for good, but they’re general sales CRMs: no portal publishing, no property
        records ready to use, and WhatsApp only on paid plans.
      </p>

      <h3>HubSpot</h3>
      <ul>
        <li>
          <strong>What’s free:</strong> up to 2 users and 1,000 contacts, with no card and no end
          date (<Source href={S.hubspotCrm}>HubSpot CRM</Source>), plus the mobile app (
          <Source href={S.hubspotFreeTools}>free tools</Source>).
        </li>
        <li>
          <strong>Out of date elsewhere:</strong> answers that promise up to a million contacts
          describe the plan before HubSpot cut it to 1,000 in autumn 2024 (
          <Source href={S.hubspotCrm2024}>HubSpot, September 2024</Source>).
        </li>
        <li>
          <strong>Limits:</strong> 10 custom properties, one pipeline per object and HubSpot
          branding on emails and forms (<Source href={S.hubspotFreeTools}>free tools</Source>).
          HubSpot has a Listings object for properties, which a super admin has to switch on (
          <Source href={S.hubspotListings}>objects</Source>).
        </li>
        <li>
          <strong>WhatsApp and language:</strong> the WhatsApp inbox comes only with Marketing Hub
          or Service Hub Professional (<Source href={S.hubspotWhatsapp}>WhatsApp</Source>). The
          interface is in Spanish, English and 15 more languages, not Russian (
          <Source href={S.hubspotLanguages}>languages</Source>).
        </li>
        <li>
          <strong>Paying:</strong> Starter from €7 a month per user billed yearly or €10 monthly,
          an offer for new customers against a €20 list price (
          <Source href={S.hubspotStarter}>Starter</Source>).
        </li>
      </ul>

      <h3>Zoho CRM</h3>
      <ul>
        <li>
          <strong>What’s free:</strong> up to 3 users and 5,000 records, for good, with no card (
          <Source href={S.zohoFree}>Zoho free CRM</Source>).
        </li>
        <li>
          <strong>Limits:</strong> no custom fields or custom modules, so no property module; one
          pipeline; no mass email and no WhatsApp (
          <Source href={S.zohoFeatures}>feature list</Source>).
        </li>
        <li>
          <strong>Paying:</strong> Standard costs €14 a month per user billed yearly or €20
          monthly. The interface comes in 28 languages, Spanish and Russian among them (
          <Source href={S.zohoPricing}>Zoho prices</Source>).
        </li>
      </ul>

      <h2>No free plan: trials and demos</h2>
      <ul>
        <li>
          <strong>Inmovilla:</strong> a 15-day trial with one trial user and a selection of
          features; Full Edition costs €79 a month or €790 a year for up to 7 users (
          <Source href={S.inmovillaPrices}>Inmovilla prices</Source>).
        </li>
        <li>
          <strong>Sooprema:</strong> a 14-day trial with every feature and no card; from €39 a
          month for 150 properties (<Source href={S.soopremaTrial}>Sooprema</Source>).
        </li>
        <li>
          <strong>Vesta CRM:</strong> a free trial and a money-back guarantee on the first month;
          from €44.90 a month for 2 users (<Source href={S.vestaPrices}>Vesta prices</Source>).
        </li>
        <li>
          <strong>Mobilia and Inmoweb:</strong> you book a demo. Mobilia costs €49 a month with
          one user (<Source href={S.mobiliaPrices}>Mobilia prices</Source>), Inmoweb from €36 a
          month for one user (<Source href={S.inmowebPrices}>Inmoweb prices</Source>).
        </li>
        <li>
          <strong>Clientify:</strong> a 7-day trial, then €39 a month billed yearly or €65 monthly
          for one user (<Source href={S.clientifyPrices}>Clientify prices</Source>). Clientify
          itself says it doesn’t manage properties, publish to portals or run an MLS (
          <Source href={S.clientifyRealEstate}>Clientify</Source>).
        </li>
        <li>
          <strong>Pipedrive:</strong> a 14-day trial, then from €14 a month per user billed yearly
          or €24 monthly (<Source href={S.pipedrivePricing}>Pipedrive prices</Source>).
        </li>
        <li>
          <strong>Resales Online:</strong> its Standalone version, a CRM without the shared-listings
          network, is “not currently billed” (
          <Source href={S.resalesStandalone}>Standalone</Source>), but its pricing page sells only
          paid packages, from €190 a month for 4 users (
          <Source href={S.resalesPricing}>Resales prices</Source>). Ask Resales how to open one.
        </li>
      </ul>

      <h2>Before you put your clients into a free plan</h2>
      <ol>
        <li>
          Where the limit sits, in clients, properties, users or credits, and what happens when
          you reach it.
        </li>
        <li>Whether it’s free for good or until a date, like Fincta’s 1 February 2027.</li>
        <li>
          Whether an idle account gets closed: inmoGesco does it after 6 months, and Witei can for
          free accounts.
        </li>
        <li>Whether you can export your clients yourself, and in what format.</li>
        <li>Whose account it is: if an agency opens it, the agency controls the clients in it.</li>
        <li>Whether publishing to the portals you use is included, idealista above all, and on which plan.</li>
      </ol>

      <h2>Where {SITE_NAME} fits</h2>
      <p>
        {SITE_NAME} is a CRM for one agent’s own clients, built for agents who sell for several
        agencies. You tag each client with the agency it came through, paste a portal enquiry to
        fill in the client card, and get follow-ups drafted in your client’s language to send from
        WhatsApp. Free covers {FREE_CLIENT_LIMIT} clients with every feature; Pro is €
        {PRICES.standard.monthly} a month plus VAT (
        <Link href={marketingPath("pricing", L)}>pricing</Link>).
      </p>
      <p>
        If you list properties and need them on the portals, it isn’t the right tool: pick one of
        the agency CRMs above. And if you’re not ready for a CRM, the{" "}
        <Link href={marketingPath("toolSpreadsheet", L)}>free client tracker spreadsheet</Link>{" "}
        imports into {SITE_NAME} when you are.
      </p>

      <h2>Sources</h2>
      <p>Each vendor’s own site, help centre or terms, checked on {AS_OF}.</p>
      <ul>
        <li>
          inmoGesco: <Source href={S.inmogescoPrices}>prices</Source>,{" "}
          <Source href={S.inmogescoPortals}>portals</Source>. Witei:{" "}
          <Source href={S.witeiPrices}>prices</Source>, <Source href={S.witeiHome}>sign-up</Source>
          , <Source href={S.witeiIdealista}>idealista</Source>. InmoProCRM:{" "}
          <Source href={S.inmoprocrm}>plans</Source>,{" "}
          <Source href={S.inmoprocrmWhatsapp}>WhatsApp</Source>.
        </li>
        <li>
          PropertyList: <Source href={S.propertylistFree}>free plan</Source>,{" "}
          <Source href={S.propertylistPipelines}>pipelines</Source>,{" "}
          <Source href={S.propertylistPrices}>prices</Source>. Fincta:{" "}
          <Source href={S.finctaPrices}>prices</Source>, <Source href={S.finctaTerms}>terms</Source>
          , <Source href={S.finctaFree}>free CRM page</Source>,{" "}
          <Source href={S.finctaCompare}>comparison</Source>.
        </li>
        <li>
          HubSpot: <Source href={S.hubspotCrm}>CRM</Source>,{" "}
          <Source href={S.hubspotFreeTools}>free tools</Source>,{" "}
          <Source href={S.hubspotLimits}>limits</Source>,{" "}
          <Source href={S.hubspotStarter}>Starter</Source>,{" "}
          <Source href={S.hubspotWhatsapp}>WhatsApp</Source>,{" "}
          <Source href={S.hubspotLanguages}>languages</Source>,{" "}
          <Source href={S.hubspotListings}>objects</Source>,{" "}
          <Source href={S.hubspotCrm2024}>the 2024 page</Source>. Zoho:{" "}
          <Source href={S.zohoFree}>free CRM</Source>,{" "}
          <Source href={S.zohoFeatures}>feature list</Source>,{" "}
          <Source href={S.zohoPricing}>prices</Source>.
        </li>
        <li>
          <Source href={S.inmovillaPrices}>Inmovilla</Source>,{" "}
          <Source href={S.soopremaTrial}>Sooprema</Source>,{" "}
          <Source href={S.vestaPrices}>Vesta CRM</Source>,{" "}
          <Source href={S.mobiliaPrices}>Mobilia</Source>,{" "}
          <Source href={S.inmowebPrices}>Inmoweb</Source>,{" "}
          <Source href={S.clientifyPrices}>Clientify</Source> (and{" "}
          <Source href={S.clientifyRealEstate}>its real estate post</Source>),{" "}
          <Source href={S.pipedrivePricing}>Pipedrive</Source>, Resales Online (
          <Source href={S.resalesStandalone}>Standalone</Source>,{" "}
          <Source href={S.resalesPricing}>prices</Source>).
        </li>
      </ul>
      <p>
        Choosing between paid CRMs too? See{" "}
        <Link href={marketingPath("guideBestCrm", L)}>which CRM fits how you work</Link> and{" "}
        <Link href={marketingPath("guideCrmAlternatives", L)}>
          the alternatives to Witei and Inmovilla
        </Link>
        .
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Free real estate CRMs in Spain: what each plan includes",
  description:
    "Which real estate CRMs in Spain have a free plan, how many clients, properties and users each allows, what costs extra and when you start to pay. With sources.",
  kind: "article",
  published: FIRST_PUBLISHED,
  modified: LAST_CHECKED,
  eyebrow: "Guide · CRM",
  heading: "Free real estate CRMs in Spain: what each free plan includes, and where it stops",
  lead: `Five CRMs built for estate agents in Spain have a free plan with no end date: inmoGesco (unlimited clients and properties, one user, no portal publishing), Witei (250 contacts and 10 properties), InmoProCRM (20 properties), PropertyList (its MLS and core CRM, with buyers costing credits after the first five) and ${SITE_NAME} (${FREE_CLIENT_LIMIT} clients). Fincta is free for everything until 1 February 2027, then 12 clients. HubSpot and Zoho CRM are free too, as general sales CRMs without portal publishing. Inmovilla, Sooprema and Vesta offer trials instead.`,
  Body,
  faq: [
    {
      q: "Is there a free real estate CRM in Spain?",
      a: `Yes. inmoGesco, Witei, InmoProCRM, PropertyList and ${SITE_NAME} have free plans with no end date, each with a different limit, and Fincta is free for everything until 1 February 2027. HubSpot and Zoho CRM are free general sales CRMs, without property tools.`,
    },
    {
      q: "Which free real estate CRM has no client limit?",
      a: "inmoGesco's free plan has no limit on clients or properties, for one user and without portal publishing. PropertyList doesn't cap contacts, but moving a buyer into its buyer pipeline costs a credit after the first five.",
    },
    {
      q: "Is Witei free?",
      a: "Witei has a free plan with no time limit: 250 contacts, 10 properties and one user, without portal gateways or its SmartInbox. Paid modules cost from €25 a month each, plus VAT.",
    },
    {
      q: "Is Inmovilla free?",
      a: "No. Inmovilla has a 15-day free trial; its Full Edition costs €79 a month or €790 a year plus VAT, for up to 7 users.",
    },
    {
      q: "Is HubSpot's CRM free for estate agents?",
      a: "Yes, for up to 2 users and 1,000 contacts, with no end date. It's a general sales CRM: no portal publishing, and its WhatsApp inbox comes only with paid Professional plans.",
    },
  ],
  related: ["guideBestCrm", "guideCrmAlternatives", "toolSpreadsheet"],
  topic: { "@type": "Thing", name: "Free real estate CRM software in Spain" },
};
