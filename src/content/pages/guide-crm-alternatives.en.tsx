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
const FIRST_PUBLISHED = PUBLISHED.guideCrmAlternatives;

/**
 * The day every price and limit was last checked on the vendors' own sites.
 * It is also the "Updated" date, dateModified and the sitemap's lastmod, so
 * the quarterly re-check (plan 025) bumps CHECKED, never PUBLISHED.
 */
const LAST_CHECKED = CHECKED.guideCrmAlternatives ?? FIRST_PUBLISHED;

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
            Every price, limit and feature below comes from the vendor’s own site or help
            centre, linked where it’s used. Where a vendor doesn’t say, we say so.
          </li>
          <li>Prices exclude VAT unless marked “VAT included”.</li>
          <li>{SITE_NAME} publishes this guide and is one of the alternatives in it.</li>
        </ul>
      </Callout>

      <h2>Witei and Inmovilla at a glance</h2>
      <p>
        Both are CRMs for estate agencies: they hold the agency’s listings, publish them to the
        portals, run its website and file the enquiries that come back. Where they differ is the
        price model, idealista, and working with other agencies.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Feature</span>
            </th>
            <th scope="col">Witei</th>
            <th scope="col">Inmovilla</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">Owner</th>
            <td>Witei Solutions SL, part of Fotocasa Group (Scout24)</td>
            <td>Aplicaciones Inmovilla SL, owned by idealista</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Free plan</th>
            <td>Yes: 250 contacts, 10 properties, 1 user</td>
            <td>No; a 15-day free trial</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Price</th>
            <td>€25, €45 or €65 a month per module; contacts and properties together from €50</td>
            <td>€79 a month or €790 a year</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Users</th>
            <td>1 free, 10 on the Normal contacts module; €5 a month per extra user</td>
            <td>Up to 7 included; €12 a month per extra user</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">idealista</th>
            <td>No new gateways since February 2022</td>
            <td>Real-time gateway</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Portal enquiries</th>
            <td>SmartInbox reads forwarded emails, from the Normal plan</td>
            <td>Emails to its own mailbox can create the client and the demand</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">WhatsApp</th>
            <td>Opens a chat with the contact</td>
            <td>Opens a chat; a paid inbox linked by QR code</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Other agencies</th>
            <td>No sharing between independent agencies</td>
            <td>Circles (MLS groups) and collaboration agreements</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Export</th>
            <td>Excel or CSV</td>
            <td>Excel, CSV or XML</td>
          </tr>
        </tbody>
      </table>

      <h3>Witei</h3>
      <ul>
        <li>
          <strong>Plans:</strong> priced by module, per workspace rather than per user: contacts,
          properties and a website. Normal costs €25 a month per module, Premium €45 and
          Enterprise €65; the website €19, €29 or €49. No tie-in, no setup fee and a 15-day
          refund guarantee (<Source href={S.witeiPrices}>Witei prices</Source>). An extra user
          costs €5 a month (<Source href={S.witeiAddOns}>add-ons</Source>).
        </li>
        <li>
          <strong>Free plan:</strong> no time limit, with 250 contacts, 10 properties, one user
          and matching between them. No portal gateways, no SmartInbox, no emails and no Google
          Calendar. Accounts on free plans only can be closed for inactivity without notice (
          <Source href={S.witeiPrices}>Witei prices</Source>).
        </li>
        <li>
          <strong>Portals:</strong> Fotocasa Pro (which covers fotocasa, habitaclia and
          milanuncios), pisos.com, Kyero, Rightmove, Zoopla, thinkSPAIN, Green-Acres and others (
          <Source href={S.witeiPortals}>gateways</Source>). Not idealista: since February 2022
          Witei can’t activate new idealista gateways, although older ones still work (
          <Source href={S.witeiIdealista}>Witei help</Source>).
        </li>
        <li>
          <strong>Enquiries:</strong> each workspace gets a SmartInbox address, and portal emails
          sent or forwarded there become contacts. The automatic reply needs the Normal contacts
          plan or higher (<Source href={S.witeiSmartInbox}>SmartInbox</Source>).
        </li>
        <li>
          <strong>Other agencies:</strong> Witei offers no tools for collaboration between
          independent agencies, and its terms forbid it. Workspaces can only be linked within one
          company (<Source href={S.witeiNoCollaboration}>Witei help</Source>).
        </li>
        <li>
          <strong>Who can sign up:</strong> businesses whose professional activity is registered
          in an EU country (<Source href={S.witeiTerms}>terms</Source>).
        </li>
        <li>
          <strong>Owner:</strong> Witei Solutions SL belongs to Fotocasa Group, the former
          Adevinta Real Estate, which Scout24 bought on 27 February 2026 (
          <Source href={S.bormeWitei2025}>BORME 2025</Source>,{" "}
          <Source href={S.scout24Q1}>Scout24</Source>,{" "}
          <Source href={S.bormeFotocasaGroup}>BORME 2026</Source>). Inmoweb is in the same group (
          <Source href={S.fotocasaGroupBrands}>Fotocasa Group</Source>).
        </li>
      </ul>

      <h3>Inmovilla</h3>
      <ul>
        <li>
          <strong>Price:</strong> one plan, Full Edition, at €79 a month or €790 a year, for up
          to 7 users with unlimited properties, a website and 50 GB of storage. The free trial
          lasts 15 days, with one trial user and a selection of features (
          <Source href={S.inmovillaPrices}>Inmovilla prices</Source>). An extra user costs €12 a
          month, and the first import of your data from another CRM is free (
          <Source href={S.inmovillaFaqPrice}>Inmovilla help</Source>).
        </li>
        <li>
          <strong>MLS-only licence:</strong> members of an MLS can take a limited version at €15
          a month per MLS, to see its shared listings and send them to clients (
          <Source href={S.inmovillaFaqShare}>Inmovilla help</Source>).
        </li>
        <li>
          <strong>Portals:</strong> real-time gateways to idealista, fotocasa and pisos.com (
          <Source href={S.inmovillaFaqPortals}>Inmovilla help</Source>). Enquiries emailed to its
          own mailbox can create the client and the demand by themselves (
          <Source href={S.inmovillaFaqLeads}>Inmovilla help</Source>).
        </li>
        <li>
          <strong>WhatsApp:</strong> a paid inbox, bought per agent, that you link by scanning a
          QR code from WhatsApp’s linked devices, as you would WhatsApp Web. Its price isn’t
          published, and Inmovilla’s own guide warns that WhatsApp can block a number it sees
          misused (<Source href={S.inmovillaFaqWhatsapp}>Inmovilla help</Source>).
        </li>
        <li>
          <strong>Other agencies:</strong> circles (MLS groups) you create or join, and
          collaboration agreements between two agencies (
          <Source href={S.inmovillaFaqCircles}>Inmovilla help</Source>).
        </li>
        <li>
          <strong>Interface:</strong> Spanish, English and Portuguese (
          <Source href={S.inmovillaFaqLanguages}>Inmovilla help</Source>).
        </li>
        <li>
          <strong>Owner:</strong> idealista bought it in June 2022 (
          <Source href={S.idealistaBuysInmovilla}>idealista</Source>,{" "}
          <Source href={S.bormeInmovilla}>BORME</Source>). Inmovilla says it works with more than
          4,000 agencies (<Source href={S.inmovillaFaqAgencies}>Inmovilla help</Source>).
        </li>
      </ul>

      <h2>Why agents look for an alternative</h2>
      <p>Usually for one of these reasons, and each one points to a different kind of tool.</p>

      <h3>You don’t list properties of your own</h3>
      <p>
        If you sell other agencies’ stock, much of what a listing CRM charges for goes unused:
        the gateways, the website, the property pages. And your clients sit in an account that
        may be the agency’s. What you need is a client book of your own.
      </p>

      <h3>You need idealista and you’re on Witei</h3>
      <p>
        A Witei account can’t activate a new idealista gateway, so an agency that joined after
        February 2022 can’t publish to idealista from Witei. Inmovilla and Inmoweb publish to it
        in real time, and Sooprema, Mobilia, Vesta and inmoGesco’s paid plans list it among
        their portals.
      </p>

      <h3>You want to share listings with other agencies</h3>
      <p>
        Witei keeps sharing inside one company. If co-broking is how you work, look at tools
        built as networks: Inmovilla’s circles, the Resales Online network on the Costa del Sol,
        or PropertyList.
      </p>

      <h3>You want more room on a free plan</h3>
      <p>
        Witei’s free plan stops at 250 contacts and 10 properties, without portal gateways, and
        Inmovilla only has a trial. inmoGesco’s free plan has no limit on clients or properties,
        for one user and without portals.
      </p>

      <h3>You’d rather your CRM didn’t belong to a portal</h3>
      <p>
        Inmovilla belongs to idealista, and Witei and Inmoweb to Fotocasa Group, Scout24’s
        company in Spain. Some agents prefer a CRM from a company that doesn’t also sell them
        listings.
      </p>

      <h3>Your business is registered outside the EU</h3>
      <p>
        Witei only takes clients whose professional activity is registered in an EU country,
        which leaves out, for example, an agency registered in the UK.
      </p>

      <h2>The alternatives</h2>
      <p>Prices are each vendor’s cheapest plan, plus VAT unless marked.</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Alternative</th>
            <th scope="col">Best for</th>
            <th scope="col">From</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">inmoGesco</th>
            <td>A free plan with no limit on clients or properties</td>
            <td>Free; €29 a month billed yearly with portals</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Sooprema</th>
            <td>Many listings and any number of users</td>
            <td>€39 a month for 150 properties</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Inmoweb</th>
            <td>Real-time idealista and Fotocasa on a small plan</td>
            <td>€36 a month, 1 user</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Mobilia</th>
            <td>WhatsApp through Meta’s official API</td>
            <td>€49 a month, 1 user</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Vesta CRM</th>
            <td>Website, shared inbox and AI in one</td>
            <td>€44.90 a month, 2 users</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">InmoProCRM</th>
            <td>A free plan with every feature, for a small portfolio</td>
            <td>Free for 20 properties; €39 a month, VAT included</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Resales Online</th>
            <td>The Costa del Sol’s shared listings</td>
            <td>€190 a month, 4 users</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">PropertyList</th>
            <td>A free MLS, paying per use</td>
            <td>Free core; credits from €0.80</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">{SITE_NAME}</th>
            <td>One agent’s clients across several agencies</td>
            <td>
              Free for {FREE_CLIENT_LIMIT} clients; €{PRICES.standard.monthly} a month
            </td>
          </tr>
        </tbody>
      </table>

      <h3>inmoGesco</h3>
      <ul>
        <li>
          <strong>Free for good:</strong> unlimited clients and properties for one user, with a
          website on a subdomain, its own MLS, matching and email alerts to buyers. Idle accounts
          are switched off after 6 months (<Source href={S.inmogescoPrices}>inmoGesco prices</Source>
          ).
        </li>
        <li>
          <strong>Portals:</strong> not on the free plan, apart from a 30-day trial on request (
          <Source href={S.inmogescoPortals}>portals</Source>). PRO costs €29 a month billed
          yearly or €35 monthly, for 2 users, and publishes to idealista, pisos.com, Kyero,
          thinkSPAIN and others; its portals page doesn’t list Fotocasa or habitaclia.
        </li>
        <li>
          <strong>Day to day:</strong> it runs in the browser, with no app. To cancel, you
          contact its team (<Source href={S.inmogescoHome}>inmoGesco</Source>).
        </li>
      </ul>

      <h3>Sooprema</h3>
      <ul>
        <li>
          <strong>Priced by active properties</strong>, with unlimited users: €39 a month for 150
          up to €99 for 2,500 (<Source href={S.sooprema}>Sooprema</Source>). A 14-day trial with
          every feature and no card (<Source href={S.soopremaTrial}>CRM page</Source>), and no
          tie-in (<Source href={S.soopremaFaq}>FAQ</Source>).
        </li>
        <li>
          <strong>Portals:</strong> more than 70, including idealista, Fotocasa, Kyero and
          pisos.com (<Source href={S.soopremaPortals}>portals</Source>).
        </li>
        <li>
          <strong>Enquiries:</strong> its inbox reads your mailbox, and you import each portal
          enquiry with a click. The website is a separate product with a setup fee.
        </li>
      </ul>

      <h3>Inmoweb</h3>
      <ul>
        <li>
          <strong>Plans:</strong> Starter €36 a month for 1 user, Evolution €59 for 3 and
          Enterprise €79 for 10, plus taxes, with 20% off yearly (
          <Source href={S.inmowebPrices}>Inmoweb prices</Source>).
        </li>
        <li>
          <strong>Portals:</strong> around 30, with idealista, Fotocasa and habitaclia in real
          time (<Source href={S.inmowebPortals}>portals</Source>). Onebox, which turns portal
          emails into clients, starts on Evolution (<Source href={S.inmowebOnebox}>Onebox</Source>
          ).
        </li>
        <li>
          <strong>Good to know:</strong> it runs in the browser, in Spanish or English. You cancel
          from the panel at least 15 days before renewal (
          <Source href={S.inmowebTerms}>terms</Source>). It belongs to the same group as Witei.
        </li>
      </ul>

      <h3>Mobilia</h3>
      <ul>
        <li>
          <strong>Price:</strong> €49 a month with one user; extra users cost €20 each, up to
          five. The basic setup is free with a 3-month minimum for the first user, or €349 for
          the premium setup (<Source href={S.mobiliaPrices}>Mobilia prices</Source>). No free plan
          and no trial: you book a demo.
        </li>
        <li>
          <strong>WhatsApp:</strong> the official WhatsApp Business API, connected through Meta,
          with each client’s conversation kept in the CRM; the cost is given in the demo (
          <Source href={S.mobiliaWhatsapp}>WhatsApp</Source>).
        </li>
        <li>
          <strong>Portals and enquiries:</strong> around 50 portals, including idealista,
          Fotocasa, Kyero, Rightmove and the Russian-language Prian.ru; portal enquiries arrive as
          requests you confirm as clients (<Source href={S.mobiliaCrm}>CRM</Source>).
        </li>
      </ul>

      <h3>Vesta CRM</h3>
      <ul>
        <li>
          <strong>Plans:</strong> Starter €44.90 a month for 2 users, Básico €99.90 and
          Profesional €149.90 for 5, with a website on every plan; yearly billing charges ten
          months (<Source href={S.vestaPrices}>Vesta prices</Source>).
        </li>
        <li>
          <strong>Trying it:</strong> a free trial, plus a money-back guarantee on the first
          month (<Source href={S.vestaTerms}>terms</Source>). A WhatsApp number in its inbox
          costs €8.90 a month, included in Profesional (
          <Source href={S.vestaPrices}>Vesta prices</Source>); how it connects to WhatsApp isn’t
          stated.
        </li>
      </ul>

      <h3>InmoProCRM</h3>
      <ul>
        <li>
          <strong>Free for good</strong> for 20 properties, unlimited contacts and one user, with
          every feature; then €39, €69 or €159 a month per agency, VAT included (
          <Source href={S.inmoprocrm}>InmoProCRM</Source>).
        </li>
        <li>
          <strong>Portals and WhatsApp:</strong> about 40 portals (
          <Source href={S.inmoprocrmFeatures}>features</Source>). WhatsApp is linked by QR code as
          a device, like WhatsApp Web, rather than through the official API (
          <Source href={S.inmoprocrmWhatsapp}>WhatsApp</Source>).
        </li>
        <li>
          <strong>Good to know:</strong> its site dates from mid-2026 and doesn’t say how to
          export your data.
        </li>
      </ul>

      <h3>Resales Online</h3>
      <ul>
        <li>
          <strong>Price:</strong> Network and New Developments at €190 a month for 4 users, less
          if you pay 6 or 12 months ahead; €15 per extra user (
          <Source href={S.resalesFees}>subscription fees</Source>). It asks for a corporate email
          on your own domain (<Source href={S.resalesLicence}>licence</Source>).
        </li>
        <li>
          <strong>The network:</strong> 2,149 active agencies on its home page on {AS_OF} (
          <Source href={S.resalesHome}>Resales Online</Source>). When you book a viewing on
          another agent’s listing, they see only your client’s surname and the last four digits
          of their phone (<Source href={S.resalesViewings}>viewings</Source>).
        </li>
        <li>
          <strong>Enquiries:</strong> from your website and its PropExtra portal; others are
          forwarded by email and attached by hand (<Source href={S.resalesEmails}>Resales help</Source>
          ). Its Standalone version, a CRM without the network, is “not currently billed” (
          <Source href={S.resalesStandalone}>Standalone</Source>).
        </li>
      </ul>

      <h3>PropertyList</h3>
      <ul>
        <li>
          <strong>Free core:</strong> its MLS, CRM, listings and a microsite. Moving a buyer into
          the buyer pipeline costs 1 credit after the first 5, and credits cost €0.80 to €1 plus
          VAT (<Source href={S.propertylistPrices}>PropertyList prices</Source>).
        </li>
        <li>
          <strong>Network:</strong> more than 1,040 agencies, centred on the Costa del Sol (
          <Source href={S.propertylistFree}>PropertyList</Source>).
        </li>
        <li>
          <strong>Leaving:</strong> no contract, and your listings export as XML (
          <Source href={S.propertylistPrices}>PropertyList prices</Source>); its pages don’t
          document an export of your contacts.
        </li>
      </ul>

      <h3>{SITE_NAME}</h3>
      <ul>
        <li>
          <strong>For one agent’s own clients</strong> across every agency they sell for: each
          client is tagged with the agency it came through. Free for {FREE_CLIENT_LIMIT} clients
          with every feature; Pro is €{PRICES.standard.monthly} a month, and the first{" "}
          {FOUNDING_CAP} paying agents keep €{PRICES.founding.monthly} for life (
          <Link href={marketingPath("pricing", L)}>pricing</Link>).
        </li>
        <li>
          <strong>What it doesn’t do:</strong> publish listings, run a website or share an MLS.
          You paste a portal enquiry and it fills in the client card; it drafts WhatsApp messages
          in your client’s language for you to send from your phone.
        </li>
      </ul>

      <h2>Taking your clients with you</h2>

      <h3>From Witei</h3>
      <p>
        An admin, or a user with the export permission, can export properties, contacts and the
        website to Excel or CSV, including photos, documents, offers, tasks and conversations.
        It can take up to 24 hours, files are split every 10,000 rows, and the downloads stay
        available for 30 days (<Source href={S.witeiExport}>Witei help</Source>). Export before
        you cancel: Witei’s product page says it keeps your data for 30 days in case you come
        back (<Source href={S.witeiCrm}>Witei</Source>), but its help article on cancelling says
        access to the account, data, domain and email ends as soon as you confirm (
        <Source href={S.witeiCancel}>Witei help</Source>).
      </p>

      <h3>From Inmovilla</h3>
      <p>
        Properties, demands and contacts export to Excel, CSV or XML, and the XML carries the
        photos. An unfiltered export of everything notifies the agency’s manager (
        <Source href={S.inmovillaFaqExport}>Inmovilla help</Source>). To cancel, the manager
        profile goes to Mi oficina › Configuración › Solicitar baja; the website is suspended a
        few days after the cancellation is confirmed (
        <Source href={S.inmovillaFaqCancel}>Inmovilla help</Source>).
      </p>

      <h3>Into the new CRM</h3>
      <p>
        Most of the CRMs above import an Excel or CSV file. Inmovilla imports your first data for
        free, Vesta prices a migration at €500 (half with a 12-month commitment, free with 24)
        and Fincta imports clients but not properties or documents. {SITE_NAME} imports Excel or
        CSV, shows how each column matches and lets you undo the whole import in one click.
      </p>

      <Callout kind="warning" title="Whose clients are they?">
        <p>
          If the Witei or Inmovilla account is an agency’s, the client records in it are the
          agency’s data too. Take only what your agreement with that agency lets you take: moving
          personal data needs a legal basis under the GDPR.
        </p>
      </Callout>

      <h2>Sources</h2>
      <p>Each vendor’s own site, help centre or terms, checked on {AS_OF}.</p>
      <ul>
        <li>
          Witei: <Source href={S.witeiPrices}>prices</Source>,{" "}
          <Source href={S.witeiAddOns}>add-ons</Source>, <Source href={S.witeiTerms}>terms</Source>,{" "}
          <Source href={S.witeiPortals}>gateways</Source>,{" "}
          <Source href={S.witeiIdealista}>idealista</Source>,{" "}
          <Source href={S.witeiSmartInbox}>SmartInbox</Source>,{" "}
          <Source href={S.witeiNoCollaboration}>other agencies</Source>,{" "}
          <Source href={S.witeiExport}>export</Source>,{" "}
          <Source href={S.witeiCancel}>cancelling</Source>; ownership:{" "}
          <Source href={S.bormeWitei2025}>BORME 7 April 2025</Source>,{" "}
          <Source href={S.bormeScout24}>BORME 17 March 2026</Source>,{" "}
          <Source href={S.bormeFotocasaGroup}>BORME 21 July 2026</Source>,{" "}
          <Source href={S.scout24Q1}>Scout24 Q1 2026</Source>,{" "}
          <Source href={S.fotocasaGroupBrands}>Fotocasa Group</Source>.
        </li>
        <li>
          Inmovilla: <Source href={S.inmovillaPrices}>prices</Source>,{" "}
          <Source href={S.inmovillaFaqPrice}>users and import</Source>,{" "}
          <Source href={S.inmovillaFaqShare}>MLS licence</Source>,{" "}
          <Source href={S.inmovillaFaqPortals}>portals</Source>,{" "}
          <Source href={S.inmovillaFaqLeads}>enquiries</Source>,{" "}
          <Source href={S.inmovillaFaqWhatsapp}>WhatsApp</Source>,{" "}
          <Source href={S.inmovillaFaqCircles}>circles</Source>,{" "}
          <Source href={S.inmovillaFaqLanguages}>languages</Source>,{" "}
          <Source href={S.inmovillaFaqExport}>export</Source>,{" "}
          <Source href={S.inmovillaFaqCancel}>cancelling</Source>; ownership:{" "}
          <Source href={S.idealistaBuysInmovilla}>idealista</Source>,{" "}
          <Source href={S.bormeInmovilla}>BORME 21 July 2022</Source>.
        </li>
        <li>
          <Source href={S.inmogescoPrices}>inmoGesco</Source>,{" "}
          <Source href={S.sooprema}>Sooprema</Source>,{" "}
          <Source href={S.inmowebPrices}>Inmoweb</Source>,{" "}
          <Source href={S.mobiliaPrices}>Mobilia</Source>,{" "}
          <Source href={S.vestaPrices}>Vesta CRM</Source>,{" "}
          <Source href={S.inmoprocrm}>InmoProCRM</Source>,{" "}
          <Source href={S.resalesFees}>Resales Online</Source>,{" "}
          <Source href={S.propertylistPrices}>PropertyList</Source>, and the pages linked in each
          section above.
        </li>
      </ul>
      <p>
        Comparing free plans in more depth? See{" "}
        <Link href={marketingPath("guideFreeCrm", L)}>what each free real estate CRM includes</Link>
        , or <Link href={marketingPath("guideBestCrm", L)}>which CRM fits how you work</Link>.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Witei and Inmovilla alternatives for agents (2026)",
  description:
    "What Witei and Inmovilla cost and include in 2026, the alternatives for agents in Spain, from free plans to the Costa del Sol MLS, and how to take your clients.",
  kind: "article",
  published: FIRST_PUBLISHED,
  modified: LAST_CHECKED,
  eyebrow: "Guide · CRM",
  heading: "Alternatives to Witei and Inmovilla, and how to take your clients with you",
  lead: `Witei and Inmovilla are agency CRMs built around listings and portal publishing. Witei is free for 250 contacts, with paid modules from €25 a month plus VAT, and belongs to Scout24’s Fotocasa Group. Inmovilla costs €79 a month plus VAT for up to 7 users and belongs to idealista. The right alternative depends on why you’re looking: a bigger free plan (inmoGesco), another agency suite (Sooprema, Inmoweb, Mobilia, Vesta), the Costa del Sol’s shared listings (Resales Online, PropertyList), or one agent’s clients across agencies (${SITE_NAME}). Both let you export your data to Excel or CSV.`,
  Body,
  faq: [
    {
      q: "What is a good alternative to Witei?",
      a: `It depends on why you're leaving. For a bigger free plan, inmoGesco has no limit on clients or properties for one user. For another agency suite, Sooprema starts at €39 a month and Inmoweb at €36, both plus VAT, and Inmoweb publishes to idealista in real time. If you sell for several agencies and don't list, ${SITE_NAME} keeps your own clients in one place.`,
    },
    {
      q: "Is there a free alternative to Inmovilla?",
      a: "Inmovilla itself has only a 15-day trial. inmoGesco is free for good with unlimited clients and properties for one user, without portal publishing; Witei is free for 250 contacts and 10 properties; InmoProCRM for 20 properties; PropertyList's MLS and core CRM are free, with credits for some actions.",
    },
    {
      q: "Who owns Witei and Inmovilla?",
      a: "Inmovilla has belonged to idealista since June 2022. Witei Solutions SL belongs to Fotocasa Group, the former Adevinta Real Estate, which Scout24 bought on 27 February 2026; Inmoweb is in the same group.",
    },
    {
      q: "Can Witei publish to idealista?",
      a: "Not for new accounts. Since February 2022 no new idealista gateway can be activated from Witei, although gateways opened before then still work. idealista enquiries can still be forwarded to Witei's SmartInbox.",
    },
    {
      q: "How do I export my clients from Inmovilla?",
      a: "Inmovilla exports properties, demands and contacts to Excel, CSV or XML, and the XML includes photos. An unfiltered export of everything notifies the agency's manager, so if the account belongs to an agency, check what your agreement lets you take.",
    },
  ],
  related: ["guideFreeCrm", "guideBestCrm", "guidePortalPrices"],
  topic: { "@type": "Thing", name: "Real estate CRM software in Spain" },
};
