import Link from "next/link";

import { marketingPath } from "@/lib/routes";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import { TemplateBlock } from "@/components/marketing/template-block";
import { TemplateGroup } from "@/components/marketing/template-group";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";

const L = "en";

function Body() {
  return (
    <>
      <p>
        Every portal enquiry is the same five minutes of work: read it, answer it, decide
        whether it is real, and put it where you will see it again tomorrow. Do that badly on a
        Monday with fourteen waiting and you lose the two that mattered. Here is the routine,
        with the messages.
      </p>

      <h2>Why a portal enquiry is not a normal lead</h2>
      <p>
        A referral arrives warm and on its own. A portal lead arrives cold, in a crowd, and it
        is not yours alone: the same buyer usually clicked “contact” on several listings in the
        same area, and some of those listings belong to other agents.
      </p>
      <p>Three things follow from that.</p>
      <ul>
        <li>
          <strong>The volume is lumpy.</strong> Nothing for two days, then eleven in one evening
          after a price change or a portal newsletter. A routine that only works on quiet days
          is not a routine.
        </li>
        <li>
          <strong>The intent is mixed.</strong> Neighbours checking what their own flat is worth,
          people who will buy in three years, investors sending one line to every listing under a
          certain price, and two or three buyers who are genuinely looking this month. You cannot
          tell them apart from the first message, which is why everyone gets an answer.
        </li>
        <li>
          <strong>Speed decides more than the pitch.</strong> When several agents receive the same
          buyer, the first useful reply is usually the one that gets the conversation, and the
          conversation is what gets the viewing.
        </li>
      </ul>
      <Callout kind="tip" title="The only rule that never changes">
        <p>
          Answer every enquiry the same day, including the ones you suspect are junk. Two minutes
          of triage on the day beats a perfect reply written on Thursday.
        </p>
      </Callout>

      <h2>What an enquiry actually gives you</h2>
      <p>
        Before you build a routine, know what lands on your phone. It differs by portal, and it
        is worth checking your notification settings once so nothing sits unseen in a web inbox.
      </p>
      <h3>Idealista</h3>
      <p>
        Contacts arrive in the Inbox inside idealista/tools, and idealista also emails you an
        alert about the messages you receive, plus a push notification if you use the app. A
        contact shows the person’s name, their message, their phone number and the listing they
        wrote about, and the same screen lists the calls you received or missed with the ad that
        prompted them (
        <a
          href="https://www.idealista.com/tools/centrodeayuda/articulos/inbox/"
          target="_blank"
          rel="noreferrer"
        >
          idealista/tools help
        </a>
        ).
      </p>
      <h3>Fotocasa</h3>
      <p>
        Fotocasa Pro describes its own contact handling as “ten control de tus contactos vía email
        y/o teléfono” — your contacts reach you by email and/or phone, next to the statistics for
        your listings (
        <a href="https://pro.fotocasa.es/soluciones/" target="_blank" rel="noreferrer">
          Fotocasa Pro
        </a>
        ). Habitaclia is another Spanish-market portal worth the same one-off check.
      </p>
      <h3>Kyero</h3>
      <p>
        Kyero sends enquiries to an email address you choose: an account can hold more than one,
        and you can change which address receives them. The enquiry carries the buyer’s questions,
        the property, and your own reference number for it, and the buyer is told you will reply
        to their email directly (
        <a href="https://help.kyero.com/estate-agents" target="_blank" rel="noreferrer">
          Kyero help
        </a>
        ). It is a portal aimed at buyers abroad, and its agent directory lets a visitor filter for
        agents who speak their language — so expect enquiries in English, German, Dutch and the
        Scandinavian languages, not only in Spanish. On the coast that mix is the normal week; see{" "}
        <Link href={marketingPath("crmMarbella", L)}>how agents on the Costa del Sol work</Link>.
      </p>
      <p>
        What no portal gives you is a qualified buyer. The name, the message and the listing
        reference are raw material. Budget, timing, financing, whether they are even in the
        country — all of that you have to ask for.
      </p>

      <h2>Step 1: answer the same day, in their language</h2>
      <p>
        Answer in the language the enquiry was written in, even if you then continue in another
        one. A buyer who wrote in German and got a Spanish template back has already learned
        something about how the rest of the purchase will go.
      </p>
      <p>
        A good first reply does four things and still fits on a phone screen: it names the
        property, it answers the question that was asked, it adds one thing that is not in the
        ad, and it ends with a question that is easy to answer. Keep the brochure for later.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="First reply">
          {`Hello {first name}, I’m {your name} from {agency}. Thanks for your message about {reference} in {area}.

To answer your question: {one-line answer}. One thing the ad doesn’t mention: {detail — which way the terrace faces, the community fee, the year of the last renovation}.

Are you in {area} at the moment, or planning a trip? If you tell me roughly what you’re looking for, I’ll line up two or three similar properties for the same day so the trip is worth it.

{your name}`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="First reply">
          {`Buenos días, {nombre}. Soy {tu nombre}, de {agencia}. Gracias por su mensaje sobre la referencia {referencia} en {zona}.

Respondo a su pregunta: {respuesta en una línea}. Algo que no aparece en el anuncio: {detalle — orientación, gastos de comunidad, año de la última reforma}.

¿Le viene bien que le llame hoy o mañana por la mañana? Si me cuenta qué busca exactamente, le preparo dos o tres opciones parecidas para la misma visita.

Un saludo,
{tu nombre}`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="First reply">
          {`Guten Tag {Vorname}, ich bin {Ihr Name} von {Agentur}. Vielen Dank für Ihre Anfrage zu {Objektnummer} in {Ort}.

Zu Ihrer Frage: {Antwort in einem Satz}. Was im Inserat nicht steht: {Detail}.

Wann planen Sie, vor Ort zu sein? Ich stelle Ihnen gern zwei bis drei vergleichbare Objekte für denselben Tag zusammen.

Viele Grüße
{Ihr Name}`}
        </TemplateBlock>
      </TemplateGroup>
      <Callout kind="note">
        <p>
          If you do not really speak the language, write the first paragraph in it anyway and
          offer to continue in one you share: “I can write to you in English if that is easier.”
          In {SITE_NAME} the draft comes back in the language on the client’s card; you read and
          edit it, then it opens in WhatsApp with the text ready.
        </p>
      </Callout>

      <h2>Step 2: qualify in the next two messages</h2>
      <p>
        Never send a questionnaire. Two questions per message, each attached to something you can
        do for the buyer, and you have the whole picture by the third exchange. Five things to
        know before you give up a Saturday.
      </p>
      <ol>
        <li>
          <strong>The budget, and whether it includes costs.</strong> In Spain the purchase costs
          sit on top of the price: transfer tax or VAT, notary, land registry, lawyer. A buyer
          whose “maximum” has not counted them is shopping one bracket above what they can sign.
        </li>
        <li>
          <strong>The timing.</strong> “When would you like to have the keys?” separates this
          quarter from next year far better than asking how serious they are.
        </li>
        <li>
          <strong>The financing.</strong> Cash, a mortgage in Spain, or a mortgage at home. A
          buyer paying cash and a buyer waiting on a bank abroad are two different timelines, and
          you want to know which one you are on before the second viewing.
        </li>
        <li>
          <strong>The area, honestly.</strong> Most enquiries name a listing, not an area. Ask
          what took them to that one — the school, the golf, the airport run, the sea view — and
          you will often find that two streets away suits them better and is still on your books.
        </li>
        <li>
          <strong>The paperwork they have started.</strong> A foreign buyer will need an NIE, and
          usually a Spanish bank account and a lawyer. None of that is your job, but whether they
          have started tells you how far away a completion really is, and whether they are buying
          as a non-resident.
        </li>
      </ol>
      <p>
        Write the answers down as they arrive, in the client’s own words. In four weeks you will
        not remember which of eleven enquiries was the Dutch couple with the dog, and “budget 450,
        outdoor space for the dog, flying in the third week of October” is what makes the next
        message worth reading.
      </p>

      <h2>Step 3: get the lead out of the portal inbox the same day</h2>
      <p>
        A portal inbox is a message list, not a pipeline. It cannot tell you who has not replied
        to you, who is closest to a viewing, or who you promised to call back in March. Advertise
        on two portals and you have two message lists and still no single list of buyers.
      </p>
      <p>
        Whatever you use — a CRM, a spreadsheet, a notebook — the rule is the same: one list,
        updated the day the enquiry arrives, with a stage against every name. The day it slips to
        “I’ll do it at the weekend”, the list stops being true.
      </p>
      <p>
        In {SITE_NAME} that is one paste. Copy the enquiry — the portal message, the email alert
        or a forwarded WhatsApp — into the paste-a-lead box and it comes back as a filled-in form:
        name, email, phone, the language they wrote in, nationality if they mentioned it, and a
        summary of what they want, with budget, area, property type, bedrooms and timing. Check
        it, fix what is wrong, save. From there it is a client card moving through new, contacted,
        qualified, viewing and reserved — which is what a{" "}
        <Link href={marketingPath("crmSpain", L)}>CRM built for the Spanish market</Link> is for.
      </p>

      <h2>Step 4: a follow-up rhythm portal leads survive</h2>
      <p>
        Most portal leads are not lost to a competitor. They are dropped: answered once, never
        written to again, and quietly re-activated by whoever does write, six weeks later. The
        first reply is the easy one. The fourth message is where the deals are.
      </p>
      <p>
        A rhythm that suits portal enquiries: the answer on day zero, a short second message the
        next day if there was no reply, a third three days later carrying something new — a price
        change, a listing that fits better, a viewing slot — then week two, then once a month with
        a reason to write.
      </p>
      <p>
        Two rules keep it from reading as spam: every message carries new information, and every
        message ends with a question. “Just checking in” is neither. The full cadence, with the
        messages in English, Spanish and German, is in the{" "}
        <Link href={marketingPath("guideFollowUp", L)}>follow-up guide</Link>.
      </p>
      <p>
        This is the part worth automating. {SITE_NAME}’s auto-engage watches for the clients who
        have gone quiet and prepares the next message in their language; you read it, change what
        you want, and send it yourself.
      </p>

      <h2>Step 5: know which portal actually pays</h2>
      <p>
        Portals are a monthly subscription, and by month six most agents cannot say which one
        produced a signed deal. You do not need a reporting tool to fix that, you need one habit.
      </p>
      <p>
        Tag the source on the card the day the lead arrives. There is no portal field to fill in:
        put it in the first line of the notes — “Idealista, 4 Sep, ref 1234” — and if you sell for
        more than one agency, put whose listing it was in the agency field. Then once a quarter
        count three numbers per portal: enquiries, viewings, signed deals.
      </p>
      <p>
        The middle number is the one nobody tracks and the one that tells the truth. Forty
        enquiries a month that turn into one viewing cost you more than the subscription; six that
        turn into four viewings deserve your better photographs.
      </p>

      <h2>Five mistakes that quietly cost deals</h2>
      <ol>
        <li>
          <strong>Replying with only a question.</strong> “Hi, when can you view?” reads as a form
          letter. Answer what they asked first; then ask.
        </li>
        <li>
          <strong>Answering in the wrong language.</strong> Match the language of the enquiry, and
          record it on the card so the next message does not fall back to yours.
        </li>
        <li>
          <strong>Calling first, three times, then giving up.</strong> An enquiry written at 23:40
          is a message, not a call request. Write first, then ask permission to call — an unknown
          Spanish number is rarely called back from abroad.
        </li>
        <li>
          <strong>Leaving the lead in the portal inbox.</strong> It will be buried under new
          enquiries within a week, and nothing there reminds you of anything.
        </li>
        <li>
          <strong>Deleting the “not now” buyers.</strong> Someone nine months away is a good lead
          with a date on it. Park it with the date and a reason to write again.
        </li>
      </ol>
      <p>
        You can run all five steps on paper, and plenty of good agents do. The reason to use a
        tool is that steps three to five stop depending on your memory: see{" "}
        <Link href={marketingPath("home", L)}>what {SITE_NAME} does</Link> and{" "}
        <Link href={marketingPath("pricing", L)}>what it costs</Link>.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Idealista lead management: answer, qualify, follow up",
  description:
    "Handle Idealista, Fotocasa and Kyero leads properly: answer the same day in the buyer’s language, qualify in two messages, and keep every enquiry in one list.",
  kind: "article",
  published: "2026-09-13",
  eyebrow: "Guide",
  heading: "How to manage Idealista leads before they go cold",
  lead: "Portal leads arrive in bursts, most of them are not ready to buy, and the one that is has written to three other agents before lunch. This is the routine that keeps them: answer the same day in the buyer’s own language, qualify in two messages, and get every enquiry out of the portal inbox and into one list you actually work.",
  Body,
  faq: [
    {
      q: "How fast should I reply to an Idealista enquiry?",
      a: "The same day, and within the hour during working hours if you can. Several agents often receive the same buyer, and the first useful reply is usually the one that turns into a conversation. A short answer now beats a complete one tomorrow.",
    },
    {
      q: "Should I call or message a portal lead first?",
      a: "Message first, then ask whether you can call. Many enquiries are written late in the evening, a message can be read whenever the buyer is free, and an unknown Spanish number is rarely called back from abroad.",
    },
    {
      q: "What should I do with enquiries that are obviously not buyers?",
      a: "Answer once, briefly, and mark them as cold rather than deleting them. Neighbours checking what their flat is worth are next year’s sellers, and a buyer who is a year away is a good lead with a date on it.",
    },
    {
      q: "Do I need to speak the buyer’s language?",
      a: "Not fluently. Write the first reply in the language the enquiry came in, then offer to continue in a language you share. What matters is that the buyer does not have to switch language to get an answer.",
    },
    {
      q: "Can Idealista send leads into a CRM automatically?",
      a: `${SITE_NAME} has no portal integration, so nothing arrives by itself. You copy the enquiry — from the portal message, the email alert or WhatsApp — paste it into the lead box, and the name, contact details, language and what they are looking for come back filled in for you to check and save.`,
    },
    {
      q: "How do I tell which portal is worth its subscription?",
      a: "Note the portal and the date in the client’s notes the day the lead arrives, then once a quarter count enquiries, viewings and signed deals for each one. The viewings column is the one that separates a portal that brings buyers from a portal that brings traffic.",
    },
  ],
  related: ["guideFollowUp", "crmSpain", "pricing"],
};
