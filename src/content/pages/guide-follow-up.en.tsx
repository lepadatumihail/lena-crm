import Link from "next/link";

import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { Callout } from "@/components/marketing/callout";
import { TemplateBlock } from "@/components/marketing/template-block";
import { TemplateGroup } from "@/components/marketing/template-group";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME } from "@/lib/site";

function Body() {
  return (
    <>
      <h2>Why leads go cold</h2>
      <p>
        A lead rarely dies for a dramatic reason. It dies of silence. The buyer who wrote
        on Tuesday about a two-bedroom in Nueva Andalucía did not decide against you — they
        heard nothing back, spoke to another agent that week, and by the time you remembered
        them they were already viewing with someone else.
      </p>
      <p>Four things kill a lead, and all four are inside your control:</p>
      <ul>
        <li>
          <strong>Silence.</strong> You wait for them to come back to you. They are waiting
          for exactly the same thing, and they have other agents to wait with.
        </li>
        <li>
          <strong>Generic messages.</strong> “Just checking in” asks the buyer to invent the
          reason for the conversation. Most people have better things to do, so they leave it
          unread.
        </li>
        <li>
          <strong>The wrong channel.</strong> An enquiry that arrived by WhatsApp answered by
          email lands in a folder nobody opens on holiday.
        </li>
        <li>
          <strong>The wrong language.</strong> A German buyer who reads your English message
          twice before understanding it will not answer it quickly, and often does not answer
          it at all.
        </li>
      </ul>
      <p>
        Everything below is the cure for those four: write first, write with a reason, write
        where they wrote to you, and write in their language.
      </p>

      <h2>The cadence: seven touches, then once a month</h2>
      <p>
        This is a real estate lead follow-up rhythm you can run from a phone between
        viewings. It is dense at the start, when interest is real and decisions get made,
        and it thins out on purpose.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">When</th>
            <th scope="col">Why you are writing</th>
            <th scope="col">Where</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Day 0, within the hour</th>
            <td>Confirm you have their enquiry and ask the one question that shapes everything else</td>
            <td>WhatsApp</td>
          </tr>
          <tr>
            <th scope="row">Day 1</th>
            <td>Send what you promised: two or three properties that genuinely fit</td>
            <td>WhatsApp and email</td>
          </tr>
          <tr>
            <th scope="row">Day 3</th>
            <td>If there is no answer, ask what was wrong with the ones you sent</td>
            <td>WhatsApp</td>
          </tr>
          <tr>
            <th scope="row">Week 1</th>
            <td>A new listing, a price change, a cancelled viewing slot — news, not a nudge</td>
            <td>WhatsApp</td>
          </tr>
          <tr>
            <th scope="row">Week 2</th>
            <td>The timing question: is this a purchase for now or for next year?</td>
            <td>WhatsApp</td>
          </tr>
          <tr>
            <th scope="row">Month 1</th>
            <td>The fork: keep looking for them, or park the search until they are ready</td>
            <td>WhatsApp or email</td>
          </tr>
          <tr>
            <th scope="row">Every month after</th>
            <td>One line, one property, only when you have something real</td>
            <td>WhatsApp</td>
          </tr>
        </tbody>
      </table>
      <Callout kind="tip" title="A reply cancels the calendar">
        <p>
          The cadence exists for silence. The moment a buyer answers, the schedule stops and
          the conversation takes over — you go back to the calendar only when they go quiet
          again.
        </p>
      </Callout>

      <h2>The templates, moment by moment</h2>
      <p>
        Every message below is written to be sent as it is, once you replace the{" "}
        <code>{"{placeholders}"}</code>. Each moment has a WhatsApp version in English,
        Spanish and German, and an email version where email genuinely earns its place. The
        Spanish and German ones stay formal — <em>usted</em> and <em>Sie</em> — until the
        buyer drops it first.
      </p>

      <h3>Day 0 — the first reply</h3>
      <p>
        Speed is most of the job here, especially on a portal enquiry: answer while they are
        still on the listing page. One question only, and make it the question that decides
        what you send next.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="Day 0 · first reply">
          {`Hi {name}, this is {agent} from {agency}. Thanks for your enquiry about {property} — I have the full details and the photos ready to send you.
Are you able to see it this week, or are you looking from home for now?`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="Day 0 · first reply">
          {`Hola {nombre}, soy {agente}, de {agencia}. Gracias por su consulta sobre {propiedad}: tengo las fotos y toda la información preparadas para enviárselas.
¿Le vendría bien verla esta semana o de momento prefiere mirar desde casa?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Day 0 · first reply">
          {`Hallo {Name}, hier ist {Agent} von {Agentur}. Vielen Dank für Ihre Anfrage zu {Objekt} — ich habe alle Unterlagen und Fotos für Sie bereit.
Möchten Sie die Immobilie diese Woche besichtigen, oder schauen Sie sich vorerst von zu Hause aus um?`}
        </TemplateBlock>
      </TemplateGroup>
      <p>
        Portal enquiries deserve their own routine, because they arrive in bulk and with
        mixed intent — there is a{" "}
        <Link href={marketingPath("guideIdealista", "en")}>
          separate guide to answering and qualifying Idealista, Fotocasa and Kyero leads
        </Link>
        .
      </p>

      <h3>Day 1 — the shortlist you promised</h3>
      <p>
        Never send everything. Three properties, each with one line saying why it is on the
        list, beats a portal link with forty results.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="Day 1 · shortlist">
          {`{name}, here are the three that fit what you told me: {property 1}, {property 2} and {property 3} — all in {area}, all inside your budget.
The second one has the terrace you asked about. Shall I arrange viewings for {day}?`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="Day 1 · shortlist">
          {`{nombre}, estas son las tres que encajan con lo que me contó: {propiedad 1}, {propiedad 2} y {propiedad 3}, todas en {zona} y dentro de su presupuesto.
La segunda tiene la terraza que buscaba. ¿Le organizo las visitas para el {día}?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Day 1 · shortlist">
          {`{Name}, hier sind die drei Objekte, die zu Ihren Angaben passen: {Objekt 1}, {Objekt 2} und {Objekt 3} — alle in {Gebiet} und in Ihrem Budgetrahmen.
Das zweite hat die Terrasse, nach der Sie gefragt haben. Soll ich die Besichtigungen für {Tag} einplanen?`}
        </TemplateBlock>
      </TemplateGroup>
      <p>
        Email is worth the extra two minutes here: it carries the links, survives the scroll
        and is the message they forward to whoever is buying with them.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="email" title="Day 1 · shortlist by email">
          {`Subject: Three in {area} that fit — {name}

Hi {name},

Good to speak yesterday. Based on what you told me — {budget}, {bedrooms} bedrooms, {area} — these three are worth your time:

1. {property 1}, {price} — {why it fits}: {link}
2. {property 2}, {price} — {why it fits}: {link}
3. {property 3}, {price} — {why it fits}: {link}

I left out everything above your budget and everything that needs major work, but say the word and I will send those too.

I can show you all three on the same morning. Which day suits you better, {day} or {day}?

Best regards,
{agent}
{phone} · WhatsApp`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="email" title="Day 1 · shortlist by email">
          {`Asunto: Tres opciones en {zona} que encajan — {nombre}

Hola {nombre}:

Un placer hablar con usted ayer. Con lo que me comentó — {presupuesto}, {dormitorios} dormitorios, {zona} — estas tres merecen su tiempo:

1. {propiedad 1}, {precio} — {por qué encaja}: {enlace}
2. {propiedad 2}, {precio} — {por qué encaja}: {enlace}
3. {propiedad 3}, {precio} — {por qué encaja}: {enlace}

He dejado fuera lo que se pasa de presupuesto y lo que necesita reforma completa, pero si quiere verlo también, me lo dice y se lo envío.

Puedo enseñarle las tres la misma mañana. ¿Qué día le viene mejor, el {día} o el {día}?

Un saludo,
{agente}
{teléfono} · WhatsApp`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="email" title="Day 1 · shortlist by email">
          {`Betreff: Drei passende Objekte in {Gebiet} — {Name}

Sehr geehrte/r {Name},

vielen Dank für das Gespräch gestern. Nach Ihren Angaben — {Budget}, {Anzahl} Schlafzimmer, {Gebiet} — lohnen sich diese drei Objekte:

1. {Objekt 1}, {Preis} — {warum es passt}: {Link}
2. {Objekt 2}, {Preis} — {warum es passt}: {Link}
3. {Objekt 3}, {Preis} — {warum es passt}: {Link}

Alles über Ihrem Budget und alles mit größerem Sanierungsbedarf habe ich weggelassen; wenn Sie es trotzdem sehen möchten, schicke ich es Ihnen gern.

Ich kann Ihnen alle drei an einem Vormittag zeigen. Welcher Tag passt Ihnen besser, {Tag} oder {Tag}?

Mit freundlichen Grüßen
{Agent}
{Telefon} · WhatsApp`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>Day 3 — when there is no answer</h3>
      <p>
        Silence after a shortlist usually means one thing was wrong, not everything. Ask for
        that one thing and you get a reply that is also a briefing.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="Day 3 · no answer yet">
          {`{name}, no pressure from my side. If those three missed the mark, what would you change about them — the area, the size or the price?
Tell me the one thing and I will send better ones.`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="Day 3 · no answer yet">
          {`{nombre}, sin ninguna prisa por mi parte. Si esas tres no le han convencido, ¿qué cambiaría: la zona, el tamaño o el precio?
Dígame solo eso y le mando opciones mejores.`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Day 3 · no answer yet">
          {`{Name}, ganz ohne Druck: Falls die drei nicht das Richtige waren — was würden Sie ändern, die Lage, die Größe oder den Preis?
Sagen Sie mir nur das eine, dann schicke ich Ihnen Passenderes.`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>Week 1 — write only when you have news</h3>
      <p>
        By now you need a reason that is about the market, not about your pipeline: a new
        listing, a reduction, a viewing slot that came free. If you have none, skip the week.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="Week 1 · news">
          {`{name}, something came on this morning that is closer to what you described: {property}, {price}, in {area} — and it has {the thing they asked for}.
Worth a look on {day}?`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="Week 1 · news">
          {`{nombre}, esta mañana ha entrado algo que se acerca más a lo que me describió: {propiedad}, {precio}, en {zona}, y con {lo que pedía}.
¿Le organizo una visita el {día}?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Week 1 · news">
          {`{Name}, heute Morgen ist etwas hereingekommen, das Ihrer Beschreibung näher kommt: {Objekt}, {Preis}, in {Gebiet} — und es hat {gewünschtes Merkmal}.
Sollen wir uns das am {Tag} ansehen?`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>Week 2 — the timing question</h3>
      <p>
        This is the message that saves you months. A buyer who is really moving next spring
        is not a lost lead; they are a lead on a different clock, and they will tell you so
        if you make it easy to admit.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="Week 2 · timing">
          {`Hi {name}, one practical question so I write to you at the right rhythm: is the purchase for the next few months, or more of a next-year plan?
Either is completely fine — it only changes how often you hear from me.`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="Week 2 · timing">
          {`Hola {nombre}, una pregunta práctica para escribirle en el momento adecuado: ¿la compra es para los próximos meses o más bien para el año que viene?
Cualquiera de las dos me vale; solo cambia cada cuánto le escribo.`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Week 2 · timing">
          {`Hallo {Name}, eine praktische Frage, damit ich Sie im richtigen Rhythmus informiere: Ist der Kauf für die nächsten Monate geplant oder eher für nächstes Jahr?
Beides ist völlig in Ordnung — es ändert nur, wie oft Sie von mir hören.`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>Month 1 — keep looking, or park it</h3>
      <p>
        A month in, be the agent who says the quiet part out loud. Offering to stop is what
        makes people say “no, keep going” — and if they do want to stop, you have just saved
        yourself a year of unanswered messages.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="Month 1 · keep or park">
          {`{name}, it is a month since we spoke about {area}. I would rather send you one good property a month than ten average ones, so I have stopped sending you everything.
Shall I keep looking for you, or park it until your plans are firmer?`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="Month 1 · keep or park">
          {`{nombre}, ha pasado un mes desde que hablamos de {zona}. Prefiero enviarle una buena opción al mes antes que diez normales, así que he dejado de mandarle todo.
¿Sigo buscando para usted o lo dejamos en pausa hasta que tenga los planes más claros?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Month 1 · keep or park">
          {`{Name}, seit unserem Gespräch über {Gebiet} ist ein Monat vergangen. Mir ist ein gutes Objekt im Monat lieber als zehn mittelmäßige, deshalb schicke ich Ihnen nicht mehr alles.
Soll ich weiter für Sie suchen, oder pausieren wir, bis Ihre Pläne konkreter sind?`}
        </TemplateBlock>
      </TemplateGroup>
      <p>
        The same message by email when the buyer is abroad, busy, or buying with a partner
        who has never met you:
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="email" title="Month 1 · keep or park, by email">
          {`Subject: Still looking in {area}?

Hi {name},

It is a month since we spoke about {area}, so here is where things stand.

What has changed: {a real thing — a reduction on {property}, new stock coming out of {development}, a seller who will now consider offers}.

What I still have not found: {the thing they want that is genuinely scarce}.

If you are still looking, I will keep watching and write when something real turns up — once a month at most, never a newsletter. If your plans have changed, tell me and I will stop, with no hard feelings.

Which of the two is it?

Best regards,
{agent}
{phone} · WhatsApp`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="email" title="Month 1 · keep or park, by email">
          {`Asunto: ¿Sigue buscando en {zona}?

Hola {nombre}:

Ha pasado un mes desde que hablamos de {zona}, así que le cuento cómo está la cosa.

Lo que ha cambiado: {algo real — una bajada de precio en {propiedad}, obra nueva que sale en {promoción}, un propietario que ahora sí escucha ofertas}.

Lo que aún no he encontrado: {eso que busca y que escasea de verdad}.

Si sigue buscando, mantengo el ojo puesto y le escribo cuando aparezca algo que merezca la pena: una vez al mes como mucho, y nada de boletines. Y si sus planes han cambiado, dígamelo y lo dejo, sin ningún problema.

¿Cuál de las dos?

Un saludo,
{agente}
{teléfono} · WhatsApp`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="email" title="Month 1 · keep or park, by email">
          {`Betreff: Suchen Sie weiterhin in {Gebiet}?

Sehr geehrte/r {Name},

seit unserem Gespräch über {Gebiet} ist ein Monat vergangen — hier der aktuelle Stand.

Was sich geändert hat: {etwas Konkretes — eine Preisreduzierung bei {Objekt}, neue Einheiten in {Projekt}, ein Eigentümer, der jetzt über Angebote spricht}.

Was ich noch nicht gefunden habe: {das Gesuchte, das wirklich selten ist}.

Wenn Sie weiter suchen, behalte ich den Markt im Auge und melde mich, sobald es etwas Passendes gibt — höchstens einmal im Monat und ganz sicher kein Newsletter. Falls sich Ihre Pläne geändert haben, sagen Sie mir gern Bescheid, dann höre ich auf.

Was von beidem trifft zu?

Mit freundlichen Grüßen
{Agent}
{Telefon} · WhatsApp`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>Every month after that — one line, one property</h3>
      <p>
        Long-term buyers are won by being the agent who is still there, quietly, without
        nagging. One property, one reason, one question.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="Monthly · one property">
          {`{name}, my one for you this month: {property}, {price} — {the single reason it fits}. Photos here: {link}.
Want me to arrange a look, or shall I keep watching?`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="Monthly · one property">
          {`{nombre}, mi propuesta del mes: {propiedad}, {precio} — {el motivo por el que encaja}. Fotos aquí: {enlace}.
¿Le organizo una visita o sigo atento?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Monthly · one property">
          {`{Name}, mein Vorschlag für diesen Monat: {Objekt}, {Preis} — {der eine Grund, warum es passt}. Fotos hier: {Link}.
Soll ich eine Besichtigung vereinbaren, oder halte ich weiter die Augen offen?`}
        </TemplateBlock>
      </TemplateGroup>

      <h2>Three moments that matter more than any calendar</h2>
      <p>
        A date on a schedule is a weak reason to write. Something that just happened is a
        strong one. These three beat every entry in the table above.
      </p>

      <h3>The evening after a viewing</h3>
      <p>
        Write the same day, while the rooms are still in their head, and give an opinion.
        Agents who say “what did you think?” get “nice, thanks”. Agents who say what they
        think get a real answer.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="After a viewing">
          {`{name}, thanks for your time today. My honest read: {property} was the strongest of the three on light and location, and the kitchen is the work you would be taking on.
Before I speak to the owner — where does it sit for you: yes, maybe, or no?`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="After a viewing">
          {`{nombre}, gracias por su tiempo de hoy. Mi opinión sincera: {propiedad} era la mejor de las tres en luz y ubicación, y la cocina es la reforma que habría que asumir.
Antes de hablar con la propiedad, ¿cómo la ve: sí, quizá o no?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="After a viewing">
          {`{Name}, vielen Dank für Ihre Zeit heute. Meine ehrliche Einschätzung: {Objekt} hat von den drei Objekten die beste Lage und das beste Licht, und die Küche ist die Arbeit, die Sie übernehmen würden.
Bevor ich mit der Eigentümerseite spreche: Wie sehen Sie es — ja, vielleicht oder nein?`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>While an offer sits with the seller</h3>
      <p>
        Waiting is when buyers get nervous and start looking again. Tell them what is
        happening even when nothing is happening.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="Offer with the seller">
          {`{name}, your offer of {amount} is with the owner. They have asked until {day} to answer and I have said we would like a decision by then.
I will call you the moment I hear anything. Is there anything you want me to add while it is open?`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="Offer with the seller">
          {`{nombre}, su oferta de {importe} ya está con la propiedad. Han pedido hasta el {día} para responder y les he dicho que esperamos una decisión para entonces.
Le llamo en cuanto sepa algo. ¿Quiere que añada algo mientras tanto?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Offer with the seller">
          {`{Name}, Ihr Angebot über {Betrag} liegt der Eigentümerseite vor, die bis {Tag} um Bedenkzeit gebeten hat. Ich habe deutlich gemacht, dass wir bis dahin eine Entscheidung erwarten.
Ich melde mich, sobald ich etwas höre. Möchten Sie in der Zwischenzeit noch etwas ergänzen?`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>When a listing finally matches</h3>
      <p>
        This is the message a parked lead wakes up for, so keep what they told you: budget,
        property type, bedrooms, and the one thing that was non-negotiable.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="A matching listing">
          {`{name}, this one matches your list almost exactly: {property}, {price}, {bedrooms} bedrooms in {area} — and it has {the non-negotiable}.
It came on this morning. Can you see it {day} at {time}?`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="A matching listing">
          {`{nombre}, esta encaja casi punto por punto con lo que buscaba: {propiedad}, {precio}, {dormitorios} dormitorios en {zona}, y con {lo innegociable}.
Ha salido esta mañana. ¿Puede verla el {día} a las {hora}?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="A matching listing">
          {`{Name}, dieses Objekt trifft Ihre Wünsche fast punktgenau: {Objekt}, {Preis}, {Anzahl} Schlafzimmer in {Gebiet} — und es hat {Ihr Muss-Kriterium}.
Es ist heute Morgen hereingekommen. Passt Ihnen eine Besichtigung am {Tag} um {Uhrzeit}?`}
        </TemplateBlock>
      </TemplateGroup>

      <h2>Six rules that decide whether a message gets answered</h2>
      <ol>
        <li>
          <strong>One idea per message.</strong> A property, a question, or a piece of news —
          not all three.
        </li>
        <li>
          <strong>A reason that is about them.</strong> “A new villa in your street came on”
          is a reason. “I wanted to touch base” is your calendar talking.
        </li>
        <li>
          <strong>End with a question they can answer in three words.</strong> “Thursday or
          Friday?”, “yes, maybe or no?”, “still looking?”
        </li>
        <li>
          <strong>Never “just checking in”.</strong> It hands the buyer the work of inventing
          a reply, and it is the phrase every other agent is using that week.
        </li>
        <li>
          <strong>Short enough to read on a lock screen.</strong> If it needs scrolling on
          WhatsApp, it belongs in an email.
        </li>
        <li>
          <strong>Their words, back to them.</strong> If they said “walking distance to the
          beach”, use that phrase, not “close to the coast”.
        </li>
      </ol>
      <Callout kind="warning" title="Fill in every placeholder">
        <p>
          A template with one <code>{"{area}"}</code> left in it is worse than no message at
          all: it tells the buyer exactly how little thought went in. Read each message once
          before it goes out — the placeholder is there to force a specific detail, not to
          save you from writing one.
        </p>
      </Callout>

      <h2>Which language to write in</h2>
      <p>
        Answer in the language of the enquiry. On the Costa del Sol and the islands a single
        week can bring British, German, Dutch, Scandinavian and Spanish buyers, and the
        language you reply in is the first signal of how much attention they will get from
        you.
      </p>
      <ul>
        <li>Stay formal until they are not: <em>usted</em> in Spanish, <em>Sie</em> in German.</li>
        <li>
          Keep the language on the client card, not in your head, so the next message a month
          later is still in the right one.
        </li>
        <li>
          If you do not speak it well enough to write warmly, write short. A clumsy long
          message reads worse than a clear three-line one.
        </li>
      </ul>
      <p>
        In {SITE_NAME} the language sits on the client card, and the drafts it writes come out
        in that language — one of the reasons a{" "}
        <Link href={marketingPath("crmSpain", "en")}>CRM built for the Spanish market</Link>{" "}
        is not the same thing as a generic sales CRM with a Spanish interface.
      </p>

      <h2>When to stop, and how to park a lead</h2>
      <p>
        Stopping is a decision, not a slow fade. Two signals are enough: the buyer tells you
        to stop, or two month-one style messages in a row get no answer at all.
      </p>
      <p>Parking a lead properly means three things:</p>
      <ul>
        <li>
          Mark them cold so they leave your working list, but keep the card — budget, area,
          the non-negotiable, the last thing they said.
        </li>
        <li>
          Write yourself the reason. “Waiting for their house in Hamburg to sell” is a date in
          your diary; “went quiet” is not.
        </li>
        <li>
          Write once more only when a property genuinely matches. That message is the one
          above, and it is the reason parking beats deleting.
        </li>
      </ul>
      <p>
        And if someone asks you to stop writing, stop, and note it on the card so it survives
        your next phone.
      </p>

      <h2>Making the cadence run without you</h2>
      <p>
        Nobody keeps seven touches per lead in their head across forty buyers. The work is
        not writing the messages — you have them now — it is remembering who is due one.
      </p>
      <p>
        That is the part {SITE_NAME} takes over. Auto-engage watches for clients who have gone
        quiet and surfaces them with a nudge that is already written, in the client’s
        language, using what is on their card: their budget, the last property they saw, the
        offer that is still open. You read it, change what you want and send it — nothing
        goes out without you, and it opens in WhatsApp, where the conversation already lives.
        Your own best-performing messages can sit alongside them as saved templates.
      </p>
      <p>
        The rest of the follow-up problem is really a record-keeping problem, which is what
        the pipeline, the client cards and the viewing calendar are for. There is a{" "}
        <Link href={marketingPath("home", "en")}>short tour of how it fits together</Link>, it
        is free for your first clients, and the{" "}
        <Link href={marketingPath("pricing", "en")}>pricing page</Link> shows what unlimited
        costs when your book outgrows the free plan.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Real estate lead follow-up: cadence and templates",
  description:
    "A follow-up cadence for buyers who go quiet, and the WhatsApp and email templates that go with it — in English, Spanish and German, ready to send.",
  kind: "article",
  published: "2026-09-13",
  eyebrow: "Guide",
  heading: "Real estate lead follow-up: a cadence and templates you can send",
  lead: "Most buyers never say no — they simply stop replying. Here is a follow-up rhythm you can run from your phone between viewings, with the WhatsApp and email messages for every moment in it, in English, Spanish and German.",
  Body,
  faq: [
    {
      q: "How often should I follow up with a property lead?",
      a: "Often at the start, rarely later. Reply the same day, send the shortlist the next day, and write twice more in the first two weeks; after the first month, once a month is enough if you only write when you have something real. The moment the buyer answers, the schedule stops and the conversation takes over.",
    },
    {
      q: "WhatsApp or email for following up with buyers?",
      a: "Whichever they used to reach you, and then WhatsApp for anything short or time-sensitive. Email earns its place when you are sending several properties with links, documents, or anything the buyer will want to find again in a month.",
    },
    {
      q: "What do I write when a buyer goes quiet after a viewing?",
      a: "Give them your honest read of the property, including the drawback, and end with a question they can answer in one word: yes, maybe or no. An opinion is easier to react to than “what did you think?”, and the answer tells you whether to keep the search open.",
    },
    {
      q: "Should I write to foreign buyers in their own language?",
      a: "Yes, whenever you can do it properly, and formally at first — usted in Spanish, Sie in German. If your written German or Dutch is shaky, keep the message short and correct rather than long and approximate.",
    },
    {
      q: "When should I stop following up on a lead?",
      a: "When they ask you to, or when two spaced-out messages in a row get no answer at all. Instead of deleting them, mark them cold with the reason and what they were looking for, and write once more only when a property genuinely matches.",
    },
    {
      q: "Do templates not make the messages sound generic?",
      a: "Only if you send them unchanged. A template should carry the structure — one idea, one reason to write, one question — while every placeholder forces you to add something specific to that buyer: their area, their budget, the thing they said they could not live without.",
    },
  ],
  related: ["guideIdealista", "crmSpain", "pricing"],
};
