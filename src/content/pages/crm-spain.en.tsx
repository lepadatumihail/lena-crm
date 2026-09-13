import Link from "next/link";

import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES } from "@/lib/billing";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";

const home = marketingPath("home", "en");
const pricing = marketingPath("pricing", "en");
const marbella = marketingPath("crmMarbella", "en");
const idealista = marketingPath("guideIdealista", "en");
const followUp = marketingPath("guideFollowUp", "en");

function Body() {
  return (
    <>
      <p>
        A real estate CRM for Spain has a specific job. Your leads arrive as text in a portal
        inbox, the conversation happens on WhatsApp, half your buyers are writing to you in
        English, German or Dutch, and the listing you are showing on Thursday belongs to
        another agency. A CRM designed for a software sales team handles none of that on its
        own. This page sets out what the work really asks for, and how {SITE_NAME} answers
        each part of it.
      </p>

      <h2>Who this is for</h2>
      <p>
        Independent agents: the person who finds the buyer, shows the property, negotiates
        the offer and keeps the file. Most are autónomos, and many carry listings from
        several agencies at once, plus a few of their own.
      </p>
      <p>
        It is not an agency back office. There is no feed that publishes your listings to the
        portals, no per-seat licence for an office of ten, no branch reporting. If that is
        what you are shopping for, the comparison further down says which category to look
        in. If what you need is one place holding every buyer, seller, viewing, offer and
        document you are carrying right now, this is the right shape of tool — the{" "}
        <Link href={home}>home page</Link> shows it as screens rather than prose.
      </p>

      <h2>What selling property in Spain asks of a CRM</h2>
      <p>Seven things come up in almost every agent’s week here:</p>
      <ul>
        <li>
          <strong>Portals produce the leads.</strong> Idealista, Fotocasa, Kyero and
          Habitaclia send an enquiry as a message, not as a record you can file.
        </li>
        <li>
          <strong>WhatsApp is the channel.</strong> Not email threads, not call logs — a chat
          that has to be answered today.
        </li>
        <li>
          <strong>Your buyers are often foreign.</strong> British, German, Dutch, Belgian,
          Scandinavian. They ask about the NIE, buying as a non-resident, and what the
          purchase costs on top of the price.
        </li>
        <li>
          <strong>You sell for more than one agency.</strong> Whose listing it is decides who
          holds the keys and how the commission splits.
        </li>
        <li>
          <strong>A viewing day is logistics.</strong> Several properties, one car, a client
          who may have flown in for two days.
        </li>
        <li>
          <strong>The paperwork starts early.</strong> Passport or NIE, the reservation
          contract, the arras: all of it belongs to a client, not to a folder on your laptop.
        </li>
        <li>
          <strong>You are a business.</strong> Whatever software you pay for is an invoice
          with IVA on it, and it should be worth the line.
        </li>
      </ul>

      <h2>Portal leads: from an enquiry to a client card</h2>
      <p>
        The work is not receiving the enquiry, it is getting it out of the portal inbox the
        same day. In {SITE_NAME} you paste the enquiry — from Idealista, Fotocasa, Kyero, an
        email or a forwarded WhatsApp — and it is read into a ready-to-save lead with the
        name, phone, language and budget already filled in. You correct what it got wrong and
        save. No retyping, so there is no excuse to leave it for later.
      </p>
      <p>
        <strong>Do this today:</strong> file every portal enquiry as a client the moment you
        read it, and tag it with the portal it came from. After a month you can see which
        portal actually produced viewings rather than which one produced messages. The{" "}
        <Link href={idealista}>guide to managing Idealista leads</Link> walks through
        answering and qualifying them.
      </p>

      <h2>WhatsApp, and clients who don’t speak Spanish</h2>
      <p>
        Every client card carries a language and a nationality, and that is not decoration:
        it is what the follow-up is written in. Open a client and {SITE_NAME} drafts the
        WhatsApp message or the email for you, in that client’s language, referring to their
        budget, the properties they have seen and where they are in the process. You read it,
        change what you want, and it opens in WhatsApp for you to send.
      </p>
      <p>
        The leads you lose are usually the quiet ones. Auto-engage watches for clients who
        have gone silent and surfaces them with a message already drafted, so the decision is
        “send or not”, never “what do I write”. The{" "}
        <Link href={followUp}>follow-up guide</Link> has the cadence and the templates behind
        it, in English, Spanish and German.
      </p>
      <Callout kind="note" title="What this is not">
        <p>
          {SITE_NAME} does not connect to your WhatsApp account and does not read your
          conversations. It writes the message and hands it to WhatsApp; sending stays with
          you, and so does the phone number.
        </p>
      </Callout>

      <h2>One pipeline across every agency you sell for</h2>
      <p>
        Tag each lead with the agency it came through and your whole book lives in one place,
        whoever owns the property. Buyers move through new, contacted, qualified, viewing and
        reserved; sellers have their own short flow from pending to qualified with every
        listing attached to them.
      </p>
      <p>
        Because both sides sit in the same book, {SITE_NAME} can show you which of your own
        listings fit a buyer’s budget, property type and bedroom count — the match you would
        otherwise make from memory on a Sunday evening. For co-broking, the agency tag is
        what tells you, three weeks later, whose listing it was and whose commission you are
        splitting.
      </p>

      <h2>Viewings, offers and the paperwork that follows</h2>
      <p>
        Viewings go on a month calendar with a reminder before each one, a Google Calendar
        feed so they appear where you already look, and a one-tap WhatsApp confirmation to
        the client. Each property a buyer has seen is logged with photos, each offer is
        recorded against the asking price, and the contract, the passport or NIE and the
        reservation papers sit on the client’s card rather than in your downloads folder.
      </p>
      <p>
        That is what makes the reserved stage mean something: when a client asks in March
        what they offered in January, the answer is on the card. Agents running several
        viewings a day for clients flying in are a case of their own —{" "}
        <Link href={marbella}>the Marbella and Costa del Sol page</Link> goes into that day
        in detail.
      </p>

      <h2>Spreadsheets, general CRMs and agency suites</h2>
      <p>
        There are three honest alternatives, and each is built for a different job. What
        follows is about the category, not about any one product’s price or quality.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">What it is built for</th>
            <th scope="col">What you would be adding yourself</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Spreadsheets and note apps</th>
            <td>
              A list you control completely: Excel, Google Sheets, Notes, Notion. Free,
              instant, and shaped however you like.
            </td>
            <td>
              Reminders that reach you, the messages themselves, documents, and the
              discipline to update it after a viewing rather than a week later.
            </td>
          </tr>
          <tr>
            <th scope="row">General sales CRMs</th>
            <td>
              Repeatable B2B sales processes — HubSpot, Pipedrive and the like: deals,
              stages, quotas, reporting for a team.
            </td>
            <td>
              The property side (viewings, offers against an asking price, documents), the
              client’s language, and anything that knows what a portal enquiry is.
            </td>
          </tr>
          <tr>
            <th scope="row">Spanish agency suites</th>
            <td>
              Running an agency: Inmovilla, Witei, Inmoweb and others are built around
              listing management, portal publishing and an office of several agents.
            </td>
            <td>
              Nothing, if you are the agency. If you are one agent selling for several
              agencies, the book you need spans all of them rather than sitting inside one.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        {SITE_NAME} is the fourth shape: one agent, every agency they work with, built around
        the client rather than the listing.
      </p>

      <h2>What it costs, and what it doesn’t do yet</h2>
      <p>
        Free covers up to {FREE_CLIENT_LIMIT} clients, buyers and sellers together, with
        every feature included, no card and no time limit — enough to run a real lead through
        it before deciding. Pro is €{PRICES.standard.monthly} a month or €
        {PRICES.standard.yearly} a year plus IVA for unlimited clients; add your NIF at
        checkout and the invoice comes with it. The first {FOUNDING_CAP} paying agents keep
        Pro at €{PRICES.founding.monthly} a month for life, and referring another agent earns
        you both a free month once you are both on Pro. The{" "}
        <Link href={pricing}>pricing page</Link> has both plans side by side and what happens
        if you cancel.
      </p>
      <h3>What it doesn’t do yet</h3>
      <ul>
        <li>
          <strong>Rentals.</strong> Sales pipelines are live today; long and short-term
          rentals are planned, not built.
        </li>
        <li>
          <strong>Portal publishing.</strong> Leads come in by paste; listings do not go out.
        </li>
        <li>
          <strong>Team management.</strong> Every agent’s data is isolated, which is the
          point — there are no shared team pipelines or per-seat roles.
        </li>
      </ul>
      <p>
        Everything else is on both plans, in English or Spanish, on the web and installed on
        your phone’s home screen.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Real estate CRM for Spain, for solo agents",
  description: `What a real estate CRM has to handle in Spain: portal leads, WhatsApp, foreign buyers and several agencies at once — and how ${SITE_NAME} handles each of them.`,
  kind: "page",
  published: "2026-09-13",
  eyebrow: "Real estate CRM · Spain",
  heading: "A real estate CRM built for agents working in Spain",
  lead: `Portal enquiries, WhatsApp, buyers who write in four languages and listings from three agencies. Here is what that asks of a CRM, and how ${SITE_NAME} answers it.`,
  Body,
  faq: [
    {
      q: "Is there a free real estate CRM for Spain?",
      a: `${SITE_NAME} is free for up to ${FREE_CLIENT_LIMIT} clients, buyers and sellers together, with every feature included, no card and no time limit. Beyond that, Pro is €${PRICES.standard.monthly} a month or €${PRICES.standard.yearly} a year plus IVA for unlimited clients.`,
    },
    {
      q: "Does it work if I sell for several agencies at once?",
      a: "Yes. Every lead is tagged with the agency it came through, so one book covers every agency you work with, and you can still see at a glance whose listing a buyer is looking at.",
    },
    {
      q: "Can it pull leads from Idealista automatically?",
      a: "No, there is no direct portal integration. You paste the enquiry — from Idealista, Fotocasa, Kyero, an email or a WhatsApp — and it is read into a pre-filled lead you check and save, which takes seconds rather than retyping.",
    },
    {
      q: "Does it send WhatsApp messages for me?",
      a: "It drafts them in the client's language and opens WhatsApp with the message ready. You read it, edit it and send it yourself. There is no WhatsApp inbox inside the app and your conversations are never read.",
    },
    {
      q: "Is the app in Spanish?",
      a: "The interface is in English and Spanish, and you switch at any time. Messages drafted for a client are written in that client's own language, which is often neither of those.",
    },
    {
      q: "Does it handle rentals as well as sales?",
      a: "Not yet. Sales pipelines for buyers and sellers are live today; long and short-term rentals are planned.",
    },
  ],
  related: ["crmMarbella", "guideIdealista", "guideFollowUp", "pricing"],
};
