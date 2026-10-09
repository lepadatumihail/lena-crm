import Link from "next/link";

import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES } from "@/lib/billing";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";

const LOCALE = "en";
const pricing = marketingPath("pricing", LOCALE);
const spain = marketingPath("crmSpain", LOCALE);
const idealista = marketingPath("guideIdealista", LOCALE);
const home = marketingPath("home", LOCALE);

function Body() {
  return (
    <>
      <p>
        Selling property between Marbella and Estepona is not the same job as selling in a
        provincial capital inland. Your buyers live in another country, half your listings
        belong to someone else’s agency, and the real conversation happens on WhatsApp in a
        language that may not be yours. This page is about what that asks of a CRM, and how{" "}
        {SITE_NAME} answers it.
      </p>

      <h2>The reality of the Marbella market</h2>
      <p>
        Demand here arrives from abroad. British, Swedish, Norwegian, Danish, German, Dutch
        and Belgian buyers are the ones you meet most often, with plenty of others alongside
        them, and most are buying a second home rather than relocating for a job. That shapes
        everything downstream: the decision takes months rather than weeks, a partner or a
        family is involved, the trip is booked around your viewing day, and your first reply
        is read on a phone in another time zone.
      </p>
      <p>
        The stock is just as varied as the buyers. A villa in Nueva Andalucía, an apartment on
        the Golden Mile, a townhouse in San Pedro, a new build up in Benahavís, something
        newer and better value heading west towards Estepona. The same buyer often wants to
        see three of those in an afternoon, and what they say they want usually changes after
        the first two.
      </p>

      <h2>You sell for more than one agency</h2>
      <p>
        An independent agent on this coast rarely sells only their own listings. You show what
        fits the buyer, wherever it sits, and you share the commission with the agency that
        holds the mandate. Names like Norma Frank, Solvilla or Drumelia are the kind of agency
        that ends up on those tags — examples of a crowded local ecosystem, not partners of
        ours and not an endorsement in either direction.
      </p>
      <p>
        So in {SITE_NAME} every lead carries the agency it came through. One book covers every
        agency you work with, a client card never loses track of whose listing the buyer is
        chasing, and you can see which relationship is actually producing deals rather than
        just producing viewings.
      </p>

      <h2>Your buyers do not all speak the same language</h2>
      <p>
        A client card holds the language and the nationality next to the budget, the notes and
        the hot or cold flag, because on this coast those two fields decide how you write
        every message that follows. When it is time to follow up, {SITE_NAME} drafts the
        WhatsApp message or the email in the client’s own language. You read it, change what
        you want, and send it — nothing leaves without your approval.
      </p>
      <Callout kind="tip" title="Fill in the language first">
        <p>
          Everything downstream reads that field: the first reply, the viewing confirmation,
          and the nudge when a buyer goes quiet. Setting it when you create the card is thirty
          seconds that saves you writing in a second language all season.
        </p>
      </Callout>

      <h2>The leads come from portals</h2>
      <p>
        Idealista and Fotocasa bring the Spanish-language enquiries; Kyero brings the
        international ones, often written in English, German, Dutch or a Scandinavian
        language. They land in an inbox, several at a time, mixed in with the rest of your
        email, and the agent who answers first usually gets the viewing.
      </p>
      <p>
        Paste an enquiry — from a portal, an email or a WhatsApp — into {SITE_NAME} and it
        comes back as a ready-to-save lead with the name, phone, language and budget already
        filled in. Then it is in your pipeline rather than in your inbox. If portal enquiries
        are most of your day, the{" "}
        <Link href={idealista}>guide to managing Idealista leads</Link> goes through answering
        and qualifying them step by step.
      </p>

      <h2>WhatsApp is where the deal actually happens</h2>
      <p>
        Nobody flying in for a weekend of viewings waits for an email. They message you, at
        odd hours, from a number with a foreign prefix. {SITE_NAME} writes the message and
        opens it in WhatsApp, so it goes from your own number and the thread stays where your
        client already keeps it. For the messages you send constantly — the confirmation, the
        directions, the thank-you after a viewing — save them as templates and stop retyping.
      </p>
      <p>
        Quiet clients are the expensive ones. Auto-engage watches for the buyer who has gone
        silent since the trip and surfaces them with a message already drafted, which is the
        difference between meaning to follow up and following up.
      </p>

      <h2>The viewing day</h2>
      <p>
        A client flies in Friday, you have a Saturday afternoon and four properties across
        three municipalities, and everything after that depends on what you remember about it.{" "}
        {SITE_NAME} keeps that day together:
      </p>
      <ul>
        <li>
          Book each viewing on a month calendar, get a reminder before it, and send the client
          a WhatsApp confirmation in one tap the night before.
        </li>
        <li>
          Sync the calendar to Google Calendar, so the day shows up wherever you already look.
        </li>
        <li>
          Log every property the buyer actually saw, with photos, so next week you know which
          villa they meant by “the one with the big terrace”.
        </li>
        <li>
          Record each offer against the asking price, and keep the passport, the NIE paperwork
          and the reservation contract filed on the same client card.
        </li>
        <li>
          When a new listing comes in, see which of your buyers it fits on budget, property
          type and bedrooms, instead of scrolling your own memory.
        </li>
      </ul>

      <h2>What it does not do</h2>
      <p>
        Rentals are not in it yet. {SITE_NAME} is built around sales pipelines, so if long or
        short-term lets are a real part of your income you will still be handling those
        somewhere else for now. There is no WhatsApp inbox either: messages are drafted for
        you and open in WhatsApp, but conversations are not pulled into the app and nothing is
        ever sent automatically on your behalf. And it is not an agency back office — it does
        not publish your listings to the portals or run a team’s administration. It is one
        agent’s book, isolated from every other agent’s.
      </p>

      <h2>What it costs, and where to go next</h2>
      <p>
        Free covers up to {FREE_CLIENT_LIMIT} clients with every feature included, no card and
        no time limit, which is enough to run a real buyer through a full viewing trip before
        you decide anything. Pro is €{PRICES.standard.monthly} a month or €
        {PRICES.standard.yearly} a year plus IVA for unlimited clients, and the first{" "}
        {FOUNDING_CAP} paying agents keep the founding price of €{PRICES.founding.monthly} a
        month for as long as they stay subscribed. The{" "}
        <Link href={pricing}>pricing page</Link> has both plans side by side.
      </p>
      <p>
        For the wider picture beyond this coast — portals, foreign buyers, co-broking and how
        the alternatives compare — read{" "}
        <Link href={spain}>the real estate CRM for Spain page</Link>. To see the product
        itself, the <Link href={home}>home page</Link> walks through a client card, the
        pipeline and the follow-up drafts. {SITE_NAME} is not built in one city, but it is
        built for the way agents on the Costa del Sol work.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "CRM for Marbella and Costa del Sol estate agents",
  description:
    "A CRM for the way Marbella agents work: international buyers in their own language, listings from several agencies, WhatsApp, portal leads and viewing days.",
  kind: "page",
  published: "2026-09-13",
  eyebrow: "Marbella & Costa del Sol",
  heading: "A CRM for Marbella and Costa del Sol estate agents",
  lead: "International buyers, listings you share with three other agencies, and a viewing day that decides the sale. Here is what agents in Marbella need from a CRM, and how LeadWing handles it.",
  Body,
  faq: [
    {
      q: "Can I keep listings from several agencies in one place?",
      a: "Yes. Every lead is tagged with the agency it came through, so one book covers every agency you sell for and you can still see which one produces your deals.",
    },
    {
      q: "Does it work for rentals on the Costa del Sol?",
      a: "Not yet. LeadWing is built around sales pipelines for buyers and sellers. Long and short-term rentals are planned, but they are not in the product today.",
    },
    {
      q: "Do I have to connect my WhatsApp account?",
      a: "No. LeadWing drafts the message and opens it in WhatsApp so you send it from your own number. There is no WhatsApp inbox inside the app and nothing is sent without you.",
    },
    {
      q: "Will it write to a Swedish or German buyer in their own language?",
      a: "Yes. Set the client's language on their card and follow-up drafts for WhatsApp and email are written in that language. You read and approve every message before it goes.",
    },
    {
      q: "Is it a system for an agency or for one agent?",
      a: "For one agent. Each agent's clients are fully isolated, which is what makes it workable when you sell listings from several agencies at the same time.",
    },
    {
      q: "Is there a Spanish version of the app?",
      a: "Yes. The interface is available in English, Spanish and Russian, and it installs on a phone's home screen like an app, which is where most of a viewing day happens.",
    },
  ],
  related: ["crmSpain", "guideIdealista", "pricing"],
};
