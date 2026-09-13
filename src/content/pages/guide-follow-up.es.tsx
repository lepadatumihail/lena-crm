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
      <h2>Por qué se enfrían los leads</h2>
      <p>
        Un lead casi nunca se pierde por un motivo dramático. Se pierde por silencio. El
        comprador que escribió el martes preguntando por un dos dormitorios en Nueva Andalucía
        no te descartó: no recibió respuesta, esa semana habló con otro agente y, cuando te
        acordaste de él, ya estaba visitando con otra persona.
      </p>
      <p>Hay cuatro cosas que matan un lead, y las cuatro dependen de ti:</p>
      <ul>
        <li>
          <strong>El silencio.</strong> Tú esperas a que vuelva él. Él espera exactamente lo
          mismo, y tiene otros agentes con los que esperar.
        </li>
        <li>
          <strong>Los mensajes genéricos.</strong> «¿Cómo lo llevas?» obliga al comprador a
          inventarse el motivo de la conversación. Casi nadie tiene ganas, así que lo deja sin
          leer.
        </li>
        <li>
          <strong>El canal equivocado.</strong> Una consulta que llega por WhatsApp y se
          responde por correo acaba en una carpeta que nadie abre de vacaciones.
        </li>
        <li>
          <strong>El idioma equivocado.</strong> Un comprador alemán que tiene que leer tu
          mensaje en inglés dos veces para entenderlo no contesta rápido, y muchas veces no
          contesta.
        </li>
      </ul>
      <p>
        Todo lo que viene después es el antídoto a esas cuatro: escribe tú primero, escribe con
        un motivo, escribe por donde te escribieron y escribe en su idioma.
      </p>

      <h2>El ritmo: siete contactos y, después, uno al mes</h2>
      <p>
        Este es un ritmo de seguimiento que puedes llevar desde el móvil entre visita y visita.
        Es denso al principio, cuando el interés está vivo y se toman las decisiones, y se va
        espaciando a propósito.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Cuándo</th>
            <th scope="col">Por qué escribes</th>
            <th scope="col">Dónde</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Día 0, en la primera hora</th>
            <td>Confirmas que tienes su consulta y haces la única pregunta que condiciona todo lo demás</td>
            <td>WhatsApp</td>
          </tr>
          <tr>
            <th scope="row">Día 1</th>
            <td>Le mandas lo que prometiste: dos o tres inmuebles que encajen de verdad</td>
            <td>WhatsApp y correo</td>
          </tr>
          <tr>
            <th scope="row">Día 3</th>
            <td>Si no contesta, le preguntas qué falló en lo que le enviaste</td>
            <td>WhatsApp</td>
          </tr>
          <tr>
            <th scope="row">Semana 1</th>
            <td>Un inmueble nuevo, una bajada de precio, un hueco de visita: novedades, no recordatorios</td>
            <td>WhatsApp</td>
          </tr>
          <tr>
            <th scope="row">Semana 2</th>
            <td>La pregunta de plazos: ¿compra ahora o el año que viene?</td>
            <td>WhatsApp</td>
          </tr>
          <tr>
            <th scope="row">Mes 1</th>
            <td>La bifurcación: sigues buscando para él o aparcas la búsqueda hasta que lo tenga claro</td>
            <td>WhatsApp o correo</td>
          </tr>
          <tr>
            <th scope="row">Cada mes a partir de ahí</th>
            <td>Una línea, un inmueble y solo cuando tengas algo real</td>
            <td>WhatsApp</td>
          </tr>
        </tbody>
      </table>
      <Callout kind="tip" title="Si contesta, se acabó el calendario">
        <p>
          El ritmo existe para el silencio. En cuanto el comprador responde, el calendario se
          para y manda la conversación: solo vuelves a la tabla si se queda callado otra vez.
        </p>
      </Callout>

      <h2>Las plantillas, momento a momento</h2>
      <p>
        Cada mensaje está escrito para enviarse tal cual, en cuanto sustituyas los{" "}
        <code>{"{campos}"}</code> entre llaves. Cada momento tiene su versión de WhatsApp en
        español, inglés y alemán, y una versión de correo donde el correo aporta algo. Las
        plantillas en español están en <em>usted</em>, y las alemanas en <em>Sie</em>, hasta
        que sea el cliente quien tutee primero.
      </p>

      <h3>Día 0 — la primera respuesta</h3>
      <p>
        Aquí casi todo es velocidad, sobre todo si la consulta viene de un portal: contesta
        mientras el comprador sigue mirando el anuncio. Una sola pregunta, y que sea la que
        decide qué le mandas después.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="es" channel="whatsapp" title="Día 0 · primera respuesta">
          {`Hola {nombre}, soy {agente}, de {agencia}. Gracias por su consulta sobre {propiedad}: tengo las fotos y toda la información preparadas para enviárselas.
¿Le vendría bien verla esta semana o de momento prefiere mirar desde casa?`}
        </TemplateBlock>
        <TemplateBlock lang="en" channel="whatsapp" title="Día 0 · primera respuesta">
          {`Hi {name}, this is {agent} from {agency}. Thanks for your enquiry about {property} — I have the full details and the photos ready to send you.
Are you able to see it this week, or are you looking from home for now?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Día 0 · primera respuesta">
          {`Hallo {Name}, hier ist {Agent} von {Agentur}. Vielen Dank für Ihre Anfrage zu {Objekt} — ich habe alle Unterlagen und Fotos für Sie bereit.
Möchten Sie die Immobilie diese Woche besichtigen, oder schauen Sie sich vorerst von zu Hause aus um?`}
        </TemplateBlock>
      </TemplateGroup>
      <p>
        Los leads de portal merecen su propia rutina, porque llegan en bloque y con intenciones
        muy distintas: hay una{" "}
        <Link href={marketingPath("guideIdealista", "es")}>
          guía aparte para responder y cualificar los contactos de Idealista, Fotocasa y Kyero
        </Link>
        .
      </p>

      <h3>Día 1 — la selección que prometiste</h3>
      <p>
        No le mandes todo. Tres inmuebles, cada uno con una línea explicando por qué está en la
        lista, funcionan mucho mejor que un enlace al portal con cuarenta resultados.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="es" channel="whatsapp" title="Día 1 · la selección">
          {`{nombre}, estas son las tres que encajan con lo que me contó: {propiedad 1}, {propiedad 2} y {propiedad 3}, todas en {zona} y dentro de su presupuesto.
La segunda tiene la terraza que buscaba. ¿Le organizo las visitas para el {día}?`}
        </TemplateBlock>
        <TemplateBlock lang="en" channel="whatsapp" title="Día 1 · la selección">
          {`{name}, here are the three that fit what you told me: {property 1}, {property 2} and {property 3} — all in {area}, all inside your budget.
The second one has the terrace you asked about. Shall I arrange viewings for {day}?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Día 1 · la selección">
          {`{Name}, hier sind die drei Objekte, die zu Ihren Angaben passen: {Objekt 1}, {Objekt 2} und {Objekt 3} — alle in {Gebiet} und in Ihrem Budgetrahmen.
Das zweite hat die Terrasse, nach der Sie gefragt haben. Soll ich die Besichtigungen für {Tag} einplanen?`}
        </TemplateBlock>
      </TemplateGroup>
      <p>
        Aquí el correo compensa los dos minutos extra: lleva los enlaces, no se pierde en el
        scroll y es el mensaje que el comprador reenvía a quien compra con él.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="es" channel="email" title="Día 1 · la selección por correo">
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
        <TemplateBlock lang="en" channel="email" title="Día 1 · la selección por correo">
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
        <TemplateBlock lang="de" channel="email" title="Día 1 · la selección por correo">
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

      <h3>Día 3 — cuando no hay respuesta</h3>
      <p>
        El silencio después de una selección suele significar que falló una cosa, no todas.
        Pregunta por esa cosa y la respuesta te llega convertida en briefing.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="es" channel="whatsapp" title="Día 3 · sin respuesta">
          {`{nombre}, sin ninguna prisa por mi parte. Si esas tres no le han convencido, ¿qué cambiaría: la zona, el tamaño o el precio?
Dígame solo eso y le mando opciones mejores.`}
        </TemplateBlock>
        <TemplateBlock lang="en" channel="whatsapp" title="Día 3 · sin respuesta">
          {`{name}, no pressure from my side. If those three missed the mark, what would you change about them — the area, the size or the price?
Tell me the one thing and I will send better ones.`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Día 3 · sin respuesta">
          {`{Name}, ganz ohne Druck: Falls die drei nicht das Richtige waren — was würden Sie ändern, die Lage, die Größe oder den Preis?
Sagen Sie mir nur das eine, dann schicke ich Ihnen Passenderes.`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>Semana 1 — escribe solo si tienes novedades</h3>
      <p>
        A estas alturas necesitas un motivo que hable del mercado, no de tu embudo: un anuncio
        nuevo, una bajada, un hueco de visita que se ha liberado. Si no tienes ninguno, sáltate
        la semana.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="es" channel="whatsapp" title="Semana 1 · novedades">
          {`{nombre}, esta mañana ha entrado algo que se acerca más a lo que me describió: {propiedad}, {precio}, en {zona}, y con {lo que pedía}.
¿Le organizo una visita el {día}?`}
        </TemplateBlock>
        <TemplateBlock lang="en" channel="whatsapp" title="Semana 1 · novedades">
          {`{name}, something came on this morning that is closer to what you described: {property}, {price}, in {area} — and it has {the thing they asked for}.
Worth a look on {day}?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Semana 1 · novedades">
          {`{Name}, heute Morgen ist etwas hereingekommen, das Ihrer Beschreibung näher kommt: {Objekt}, {Preis}, in {Gebiet} — und es hat {gewünschtes Merkmal}.
Sollen wir uns das am {Tag} ansehen?`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>Semana 2 — la pregunta de los plazos</h3>
      <p>
        Este es el mensaje que te ahorra meses. Un comprador que en realidad se muda en
        primavera no es un lead perdido: es un lead con otro reloj, y te lo dirá si se lo pones
        fácil.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="es" channel="whatsapp" title="Semana 2 · plazos">
          {`Hola {nombre}, una pregunta práctica para escribirle en el momento adecuado: ¿la compra es para los próximos meses o más bien para el año que viene?
Cualquiera de las dos me vale; solo cambia cada cuánto le escribo.`}
        </TemplateBlock>
        <TemplateBlock lang="en" channel="whatsapp" title="Semana 2 · plazos">
          {`Hi {name}, one practical question so I write to you at the right rhythm: is the purchase for the next few months, or more of a next-year plan?
Either is completely fine — it only changes how often you hear from me.`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Semana 2 · plazos">
          {`Hallo {Name}, eine praktische Frage, damit ich Sie im richtigen Rhythmus informiere: Ist der Kauf für die nächsten Monate geplant oder eher für nächstes Jahr?
Beides ist völlig in Ordnung — es ändert nur, wie oft Sie von mir hören.`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>Mes 1 — seguir buscando o aparcarlo</h3>
      <p>
        Al mes, sé el agente que dice en voz alta lo que los demás callan. Ofrecerte a parar es
        justo lo que hace que la gente conteste «no, sigue» y, si de verdad quiere parar, te
        acabas de ahorrar un año de mensajes sin respuesta.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="es" channel="whatsapp" title="Mes 1 · seguir o aparcar">
          {`{nombre}, ha pasado un mes desde que hablamos de {zona}. Prefiero enviarle una buena opción al mes antes que diez normales, así que he dejado de mandarle todo.
¿Sigo buscando para usted o lo dejamos en pausa hasta que tenga los planes más claros?`}
        </TemplateBlock>
        <TemplateBlock lang="en" channel="whatsapp" title="Mes 1 · seguir o aparcar">
          {`{name}, it is a month since we spoke about {area}. I would rather send you one good property a month than ten average ones, so I have stopped sending you everything.
Shall I keep looking for you, or park it until your plans are firmer?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Mes 1 · seguir o aparcar">
          {`{Name}, seit unserem Gespräch über {Gebiet} ist ein Monat vergangen. Mir ist ein gutes Objekt im Monat lieber als zehn mittelmäßige, deshalb schicke ich Ihnen nicht mehr alles.
Soll ich weiter für Sie suchen, oder pausieren wir, bis Ihre Pläne konkreter sind?`}
        </TemplateBlock>
      </TemplateGroup>
      <p>
        El mismo mensaje por correo cuando el comprador está fuera, va con prisas o compra con
        una pareja que no te conoce de nada:
      </p>
      <TemplateGroup>
        <TemplateBlock lang="es" channel="email" title="Mes 1 · seguir o aparcar, por correo">
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
        <TemplateBlock lang="en" channel="email" title="Mes 1 · seguir o aparcar, por correo">
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
        <TemplateBlock lang="de" channel="email" title="Mes 1 · seguir o aparcar, por correo">
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

      <h3>Cada mes a partir de ahí — una línea, un inmueble</h3>
      <p>
        A los compradores de largo plazo se les gana estando ahí, sin dar la lata. Un inmueble,
        un motivo y una pregunta.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="es" channel="whatsapp" title="Cada mes · un inmueble">
          {`{nombre}, mi propuesta del mes: {propiedad}, {precio} — {el motivo por el que encaja}. Fotos aquí: {enlace}.
¿Le organizo una visita o sigo atento?`}
        </TemplateBlock>
        <TemplateBlock lang="en" channel="whatsapp" title="Cada mes · un inmueble">
          {`{name}, my one for you this month: {property}, {price} — {the single reason it fits}. Photos here: {link}.
Want me to arrange a look, or shall I keep watching?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Cada mes · un inmueble">
          {`{Name}, mein Vorschlag für diesen Monat: {Objekt}, {Preis} — {der eine Grund, warum es passt}. Fotos hier: {Link}.
Soll ich eine Besichtigung vereinbaren, oder halte ich weiter die Augen offen?`}
        </TemplateBlock>
      </TemplateGroup>

      <h2>Tres momentos que valen más que cualquier calendario</h2>
      <p>
        Una fecha en una tabla es un motivo débil para escribir. Algo que acaba de pasar es un
        motivo fuerte. Estos tres momentos se saltan la tabla entera.
      </p>

      <h3>La tarde de la visita</h3>
      <p>
        Escribe el mismo día, con las estancias todavía frescas, y mójate. Al agente que
        pregunta «¿qué le ha parecido?» le contestan «bien, gracias». Al que da su opinión le
        contestan de verdad.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="es" channel="whatsapp" title="Después de la visita">
          {`{nombre}, gracias por su tiempo de hoy. Mi opinión sincera: {propiedad} era la mejor de las tres en luz y ubicación, y la cocina es la reforma que habría que asumir.
Antes de hablar con la propiedad, ¿cómo la ve: sí, quizá o no?`}
        </TemplateBlock>
        <TemplateBlock lang="en" channel="whatsapp" title="Después de la visita">
          {`{name}, thanks for your time today. My honest read: {property} was the strongest of the three on light and location, and the kitchen is the work you would be taking on.
Before I speak to the owner — where does it sit for you: yes, maybe, or no?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Después de la visita">
          {`{Name}, vielen Dank für Ihre Zeit heute. Meine ehrliche Einschätzung: {Objekt} hat von den drei Objekten die beste Lage und das beste Licht, und die Küche ist die Arbeit, die Sie übernehmen würden.
Bevor ich mit der Eigentümerseite spreche: Wie sehen Sie es — ja, vielleicht oder nein?`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>Mientras la oferta está en manos del vendedor</h3>
      <p>
        La espera es justo cuando el comprador se pone nervioso y vuelve a mirar anuncios.
        Cuéntale qué está pasando incluso cuando no pasa nada.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="es" channel="whatsapp" title="Oferta pendiente">
          {`{nombre}, su oferta de {importe} ya está con la propiedad. Han pedido hasta el {día} para responder y les he dicho que esperamos una decisión para entonces.
Le llamo en cuanto sepa algo. ¿Quiere que añada algo mientras tanto?`}
        </TemplateBlock>
        <TemplateBlock lang="en" channel="whatsapp" title="Oferta pendiente">
          {`{name}, your offer of {amount} is with the owner. They have asked until {day} to answer and I have said we would like a decision by then.
I will call you the moment I hear anything. Is there anything you want me to add while it is open?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Oferta pendiente">
          {`{Name}, Ihr Angebot über {Betrag} liegt der Eigentümerseite vor, die bis {Tag} um Bedenkzeit gebeten hat. Ich habe deutlich gemacht, dass wir bis dahin eine Entscheidung erwarten.
Ich melde mich, sobald ich etwas höre. Möchten Sie in der Zwischenzeit noch etwas ergänzen?`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>Cuando por fin sale algo que encaja</h3>
      <p>
        Este es el mensaje por el que un lead aparcado se despierta, así que guarda lo que te
        dijo: presupuesto, tipo de inmueble, dormitorios y eso que era innegociable.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="es" channel="whatsapp" title="Un anuncio que encaja">
          {`{nombre}, esta encaja casi punto por punto con lo que buscaba: {propiedad}, {precio}, {dormitorios} dormitorios en {zona}, y con {lo innegociable}.
Ha salido esta mañana. ¿Puede verla el {día} a las {hora}?`}
        </TemplateBlock>
        <TemplateBlock lang="en" channel="whatsapp" title="Un anuncio que encaja">
          {`{name}, this one matches your list almost exactly: {property}, {price}, {bedrooms} bedrooms in {area} — and it has {the non-negotiable}.
It came on this morning. Can you see it {day} at {time}?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Un anuncio que encaja">
          {`{Name}, dieses Objekt trifft Ihre Wünsche fast punktgenau: {Objekt}, {Preis}, {Anzahl} Schlafzimmer in {Gebiet} — und es hat {Ihr Muss-Kriterium}.
Es ist heute Morgen hereingekommen. Passt Ihnen eine Besichtigung am {Tag} um {Uhrzeit}?`}
        </TemplateBlock>
      </TemplateGroup>

      <h2>Seis reglas que deciden si te contestan</h2>
      <ol>
        <li>
          <strong>Una idea por mensaje.</strong> Un inmueble, una pregunta o una novedad; no
          las tres cosas juntas.
        </li>
        <li>
          <strong>Un motivo que hable de él.</strong> «Ha salido una villa en su misma calle»
          es un motivo. «Quería saber cómo iba todo» es tu agenda hablando.
        </li>
        <li>
          <strong>Termina con una pregunta de tres palabras.</strong> «¿Jueves o viernes?»,
          «¿sí, quizá o no?», «¿sigue buscando?».
        </li>
        <li>
          <strong>Nada de «¿cómo lo llevas?».</strong> Le pasas al comprador el trabajo de
          inventarse la respuesta, y es la frase que están usando todos los agentes esa misma
          semana.
        </li>
        <li>
          <strong>Que se lea en la pantalla de bloqueo.</strong> Si hay que hacer scroll en
          WhatsApp, ese mensaje era un correo.
        </li>
        <li>
          <strong>Sus palabras, devueltas.</strong> Si dijo «andando a la playa», escribe eso,
          no «cerca de la costa».
        </li>
      </ol>
      <Callout kind="warning" title="Rellena todos los campos">
        <p>
          Una plantilla con un <code>{"{zona}"}</code> sin sustituir es peor que no escribir:
          le dice al comprador exactamente cuánto has pensado en él. Relee cada mensaje antes
          de enviarlo; los campos entre llaves están para obligarte a poner un detalle concreto,
          no para ahorrártelo.
        </p>
      </Callout>

      <h2>En qué idioma escribir</h2>
      <p>
        Contesta en el idioma de la consulta. En la Costa del Sol o en las islas, una sola
        semana te trae compradores británicos, alemanes, holandeses, escandinavos y españoles,
        y el idioma en el que respondes es la primera señal de cuánta atención van a recibir.
      </p>
      <ul>
        <li>
          Mantén el trato formal hasta que lo rompan ellos: <em>usted</em> en español,{" "}
          <em>Sie</em> en alemán.
        </li>
        <li>
          Guarda el idioma en la ficha del cliente, no en tu cabeza, para que el mensaje de
          dentro de un mes siga saliendo en el idioma correcto.
        </li>
        <li>
          Si no lo dominas lo suficiente para sonar cercano, escribe corto. Un mensaje largo y
          torpe queda peor que tres líneas claras.
        </li>
      </ul>
      <p>
        En {SITE_NAME} el idioma vive en la ficha del cliente y los borradores salen en ese
        idioma. Es una de las razones por las que un{" "}
        <Link href={marketingPath("crmSpain", "es")}>
          CRM pensado para el mercado español
        </Link>{" "}
        no es lo mismo que un CRM de ventas genérico con la interfaz traducida.
      </p>

      <h2>Cuándo parar y cómo aparcar un lead</h2>
      <p>
        Parar es una decisión, no un desvanecerse poco a poco. Con dos señales basta: que el
        comprador te pida que pares, o que dos mensajes espaciados seguidos se queden sin
        ninguna respuesta.
      </p>
      <p>Aparcar bien un lead son tres cosas:</p>
      <ul>
        <li>
          Márcalo como frío para que salga de tu lista de trabajo, pero conserva la ficha:
          presupuesto, zona, lo innegociable y lo último que te dijo.
        </li>
        <li>
          Escribe el motivo. «Espera a vender su piso en Hamburgo» es una fecha en tu agenda;
          «se quedó callado» no es nada.
        </li>
        <li>
          Vuelve a escribir solo cuando un inmueble encaje de verdad. Ese mensaje es el de
          arriba, y es la razón por la que aparcar es mejor que borrar.
        </li>
      </ul>
      <p>
        Y si alguien te pide que dejes de escribirle, déjalo y anótalo en su ficha, para que
        siga ahí cuando cambies de móvil.
      </p>

      <h2>Cómo hacer que el ritmo funcione solo</h2>
      <p>
        Nadie lleva en la cabeza siete contactos por lead multiplicados por cuarenta
        compradores. El trabajo no es escribir los mensajes —ya los tienes— sino acordarse de a
        quién le toca.
      </p>
      <p>
        De eso se encarga {SITE_NAME}. El auto-engage detecta a los clientes que llevan tiempo
        en silencio y te los pone delante con un mensaje ya redactado, en el idioma del cliente
        y con lo que hay en su ficha: su presupuesto, la última propiedad que vio, la oferta
        que sigue abierta. Tú lo lees, cambias lo que quieras y lo envías: no sale nada sin ti,
        y se abre directamente en WhatsApp, que es donde está la conversación. Tus mensajes que
        mejor funcionan pueden vivir al lado como plantillas guardadas.
      </p>
      <p>
        El resto del problema del seguimiento es, en realidad, un problema de registro: para eso
        están el embudo, las fichas de cliente y el calendario de visitas. Aquí tienes un{" "}
        <Link href={marketingPath("home", "es")}>resumen de cómo encaja todo</Link>, es gratis
        para tus primeros clientes y en la{" "}
        <Link href={marketingPath("pricing", "es")}>página de precios</Link> ves cuánto cuesta
        pasar a ilimitado cuando tu cartera crezca.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Seguimiento de leads inmobiliarios: ritmo y plantillas",
  description:
    "Un ritmo de seguimiento para los leads que se quedan en silencio y las plantillas de WhatsApp y correo de cada momento, en español, inglés y alemán.",
  kind: "article",
  published: "2026-09-13",
  eyebrow: "Guía",
  heading: "Seguimiento de leads inmobiliarios: cuándo escribir y qué decir",
  lead: "Casi nadie te dice que no: simplemente deja de contestar. Aquí tienes un ritmo de seguimiento que puedes llevar desde el móvil entre visita y visita, con los mensajes de WhatsApp y los correos de cada momento, en español, inglés y alemán.",
  Body,
  faq: [
    {
      q: "¿Cada cuánto hay que hacer seguimiento a un lead inmobiliario?",
      a: "Mucho al principio y poco después. Contesta el mismo día, manda la selección al día siguiente y escribe dos veces más durante las dos primeras semanas; pasado el primer mes, con una vez al mes basta si solo escribes cuando tienes algo real. En cuanto el cliente responde, el calendario se para y manda la conversación.",
    },
    {
      q: "¿WhatsApp o correo para hacer seguimiento a un comprador?",
      a: "Por donde te escribió él, y a partir de ahí WhatsApp para todo lo breve o urgente. El correo compensa cuando mandas varias propiedades con enlaces, documentos o cualquier cosa que el comprador vaya a querer encontrar dentro de un mes.",
    },
    {
      q: "¿Qué le escribo a un comprador que se queda callado después de una visita?",
      a: "Dale tu opinión sincera del inmueble, con su pega incluida, y termina con una pregunta que se conteste en una palabra: sí, quizá o no. Reaccionar a una opinión es más fácil que responder a un «qué te ha parecido», y la respuesta te dice si sigues buscando o no.",
    },
    {
      q: "¿Escribo a los compradores extranjeros en su idioma?",
      a: "Sí siempre que puedas hacerlo bien, y de usted al principio (Sie en alemán). Si tu alemán o tu neerlandés escritos flojean, manda un mensaje corto y correcto antes que uno largo y aproximado.",
    },
    {
      q: "¿Cuándo dejo de hacer seguimiento a un lead?",
      a: "Cuando te lo pida, o cuando dos mensajes espaciados seguidos no reciban ninguna respuesta. En vez de borrarlo, márcalo como frío con el motivo y lo que buscaba, y vuelve a escribirle solo cuando salga algo que encaje de verdad.",
    },
    {
      q: "¿Las plantillas no hacen que los mensajes suenen genéricos?",
      a: "Solo si las envías tal cual. Una plantilla aporta la estructura (una idea, un motivo para escribir y una pregunta) mientras que cada campo entre llaves te obliga a añadir algo concreto de ese comprador: su zona, su presupuesto o eso sin lo que no va a comprar.",
    },
  ],
  related: ["guideIdealista", "crmSpain", "pricing"],
};
