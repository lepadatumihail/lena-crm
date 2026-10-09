import Link from "next/link";

import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES } from "@/lib/billing";
import { marketingPath } from "@/lib/routes";
import { SITE_FOUNDED, SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/site";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";

const LOCALE = "en";
const home = marketingPath("home", LOCALE);
const pricing = marketingPath("pricing", LOCALE);
const spain = marketingPath("crmSpain", LOCALE);
/** The bare host ("www.leadwing.app"), for where the site is named rather than linked. */
const domain = new URL(SITE_URL).host;

function Body() {
  return (
    <>
      <h2>{SITE_NAME} at a glance</h2>
      <dl>
        <dt>What it is</dt>
        <dd>
          A CRM (customer relationship management software) for independent real-estate
          agents. It runs in the browser and installs on a phone’s home screen like an app.
        </dd>
        <dt>Who it is for</dt>
        <dd>
          Independent agents, including agents who sell for several agencies at once. Every
          agent’s clients are private to that agent.
        </dd>
        <dt>Market</dt>
        <dd>
          Built around selling property in Spain: enquiries from Idealista, Fotocasa and Kyero,
          reservation contracts, prices with IVA.
        </dd>
        <dt>Languages</dt>
        <dd>English, Spanish and Russian</dd>
        <dt>Launched</dt>
        <dd>{SITE_FOUNDED}</dd>
        <dt>Pricing</dt>
        <dd>
          Free for up to {FREE_CLIENT_LIMIT} clients. Pro is €{PRICES.standard.monthly} a month
          or €{PRICES.standard.yearly} a year, plus VAT.
        </dd>
        <dt>Website</dt>
        <dd>
          <Link href={home}>{domain}</Link>
        </dd>
        <dt>Contact</dt>
        <dd>
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </dd>
      </dl>

      <h2>What {SITE_NAME} does</h2>
      <p>
        Each client gets one card that holds the whole deal, from the first enquiry to the day
        the keys change hands:
      </p>
      <ul>
        <li>
          <strong>A pipeline for buyers and sellers.</strong> Buyers move through new,
          contacted, qualified, viewing and reserved; sellers have their own flow, with every
          listing attached.
        </li>
        <li>
          <strong>Client cards.</strong> Phone, language, nationality, budget and notes, with hot
          leads starred and cold ones hidden.
        </li>
        <li>
          <strong>Properties, viewings and offers.</strong> Every property a buyer has seen,
          every viewing on a calendar that syncs to Google Calendar, every offer against the
          asking price.
        </li>
        <li>
          <strong>Documents.</strong> Passports, NIE paperwork and reservation contracts, filed
          on the right client.
        </li>
        <li>
          <strong>Agency tags.</strong> Each lead carries the agency it came through, so one
          book covers every agency an agent sells for.
        </li>
        <li>
          <strong>Follow-ups in the client’s language.</strong> {SITE_NAME} drafts the WhatsApp
          message or the email; the agent reads and approves every one before it goes.
        </li>
        <li>
          <strong>Portal lead capture.</strong> Paste an enquiry from Idealista, Fotocasa,
          Kyero, an email or a WhatsApp, and it comes back as a ready-to-save lead.
        </li>
        <li>
          <strong>Buyer matching.</strong> It shows which of the agent’s own listings fit each
          buyer’s budget, property type and bedrooms.
        </li>
      </ul>

      <h2>Why it exists</h2>
      <p>
        Independent agents rarely sell for a single agency. They show whatever fits the buyer,
        share the commission with whoever holds the listing, and end up with clients spread
        across notes, spreadsheets, calendars and WhatsApp threads. {SITE_NAME} puts that whole
        book in one place, with every lead tagged by the agency it belongs to, and takes the
        blank page out of following up.
      </p>

      <h2>What it is not</h2>
      <p>
        {SITE_NAME} is not an agency back office: it does not publish listings to the portals
        or run a team, and every agent’s book stays private to that agent. It never sends a
        message on its own; every draft waits for the agent’s approval. And it does not do
        rentals yet: sales pipelines are live today, and long and short-term rentals are
        planned.
      </p>

      <h2>The name</h2>
      <p>
        Lead, as in the lead an agent is working. Wing, as in wingman: the one at your side who
        keeps every lead moving. The name is shared, though. The Leadwing Coachman is a
        traditional fly-fishing pattern, and unrelated businesses in other industries use the
        word too. {SITE_NAME}, the real-estate CRM at {domain}, has no connection to any of
        them.
      </p>

      <h2>Contact</h2>
      <p>
        Agents, press and partners can write to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. To see the product first, the{" "}
        <Link href={home}>home page</Link> walks through a client card, the pipeline and the
        follow-up drafts. The <Link href={pricing}>pricing page</Link> has both plans side by
        side, including the founding price of €{PRICES.founding.monthly} a month for the first{" "}
        {FOUNDING_CAP} paying agents, and the{" "}
        <Link href={spain}>real estate CRM for Spain page</Link> covers what a CRM has to handle
        in the Spanish market.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: `About ${SITE_NAME}, the CRM for independent real-estate agents`,
  description: `${SITE_NAME} is a CRM for independent real-estate agents: one card per buyer or seller, every agency in one place. What it does, who it is for, how to reach us.`,
  kind: "about",
  published: "2026-09-15",
  eyebrow: "About",
  heading: `About ${SITE_NAME}`,
  lead: `${SITE_NAME} is a CRM for independent real-estate agents. It keeps every buyer, seller, viewing, offer and document on one client card, across all the agencies an agent works with, and drafts each follow-up in the client's own language. It launched in ${SITE_FOUNDED} and runs in the browser, in English, Spanish and Russian.`,
  Body,
  faq: [
    {
      q: `Who is ${SITE_NAME} for?`,
      a: `Independent real-estate agents, especially agents who sell for several agencies at once. Each agent keeps a private book of clients; ${SITE_NAME} is not an agency system shared by a team.`,
    },
    {
      q: `When did ${SITE_NAME} launch?`,
      a: `${SITE_NAME} launched in ${SITE_FOUNDED}. Sales pipelines for buyers and sellers are live today; long and short-term rentals are planned.`,
    },
    {
      q: `Is ${SITE_NAME} connected to other companies called Leadwing?`,
      a: `No. ${SITE_NAME} is the real-estate CRM at ${domain}. It has no connection to other businesses or products that use the Leadwing name, or to the Leadwing Coachman fishing fly.`,
    },
    {
      q: `How do I contact ${SITE_NAME}?`,
      a: `Email ${SUPPORT_EMAIL}. The same address takes product and billing questions as well as privacy and legal requests.`,
    },
  ],
  related: ["pricing", "crmSpain", "guideFollowUp"],
};
