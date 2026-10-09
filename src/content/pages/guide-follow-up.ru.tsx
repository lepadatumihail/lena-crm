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
      <h2>Почему лиды остывают</h2>
      <p>
        Лид редко теряется по какой-то драматической причине. Его губит тишина. Покупатель,
        который во вторник написал вам о квартире с двумя спальнями в Нуэва-Андалусии, не
        отказался от вас: он просто не получил ответа, на той же неделе поговорил с другим
        агентом, и к тому моменту, когда вы о нём вспомнили, уже ездил на показы с кем-то ещё.
      </p>
      <p>Лид губят четыре вещи, и все четыре зависят от вас:</p>
      <ul>
        <li>
          <strong>Тишина.</strong> Вы ждёте, что клиент вернётся сам. Он ждёт ровно того же,
          а пока ждёт, общается с другими агентами.
        </li>
        <li>
          <strong>Безликие сообщения.</strong> «Просто напоминаю о себе» заставляет покупателя
          самому придумывать повод для разговора. У большинства людей есть дела поважнее, и
          сообщение так и остаётся непрочитанным.
        </li>
        <li>
          <strong>Не тот канал.</strong> Ответ по электронной почте на запрос, пришедший в
          WhatsApp, попадает в папку, которую в отпуске никто не открывает.
        </li>
        <li>
          <strong>Не тот язык.</strong> Покупатель из Германии, которому приходится дважды
          перечитать ваше сообщение на английском, чтобы его понять, не ответит быстро, а
          часто не ответит вовсе.
        </li>
      </ul>
      <p>
        Всё, что ниже, — лекарство от этих четырёх бед: пишите первым, пишите с поводом,
        пишите туда, откуда написали вам, и пишите на языке клиента.
      </p>

      <h2>График: семь касаний, затем раз в месяц</h2>
      <p>
        Это ритм повторных контактов с лидами в недвижимости, который можно вести с телефона
        между показами. В начале он плотный — пока интерес живой и решения принимаются, — а
        потом намеренно становится реже.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Когда</th>
            <th scope="col">Зачем вы пишете</th>
            <th scope="col">Где</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">День 0, в течение часа</th>
            <td>Подтвердите, что получили запрос, и задайте один вопрос, от которого зависит всё остальное</td>
            <td>WhatsApp</td>
          </tr>
          <tr>
            <th scope="row">День 1</th>
            <td>Отправьте обещанное: два-три объекта, которые действительно подходят</td>
            <td>WhatsApp и почта</td>
          </tr>
          <tr>
            <th scope="row">День 3</th>
            <td>Если ответа нет, спросите, что не так с отправленными вариантами</td>
            <td>WhatsApp</td>
          </tr>
          <tr>
            <th scope="row">Неделя 1</th>
            <td>Новый объект, снижение цены, освободившееся время для показа — новость, а не напоминание</td>
            <td>WhatsApp</td>
          </tr>
          <tr>
            <th scope="row">Неделя 2</th>
            <td>Вопрос о сроках: покупка сейчас или в следующем году?</td>
            <td>WhatsApp</td>
          </tr>
          <tr>
            <th scope="row">Месяц 1</th>
            <td>Развилка: продолжать поиск или отложить его, пока клиент не будет готов</td>
            <td>WhatsApp или почта</td>
          </tr>
          <tr>
            <th scope="row">Каждый месяц после этого</th>
            <td>Одна строка, один объект — и только когда есть что-то стоящее</td>
            <td>WhatsApp</td>
          </tr>
        </tbody>
      </table>
      <Callout kind="tip" title="Ответ отменяет график">
        <p>
          График нужен на случай тишины. Как только покупатель отвечает, расписание
          останавливается и начинается разговор — к графику вы возвращаетесь, только если
          клиент снова пропадёт.
        </p>
      </Callout>

      <h2>Шаблоны на каждый момент</h2>
      <p>
        Каждое сообщение ниже можно отправить как есть — достаточно заменить{" "}
        <code>{"{поля}"}</code> в фигурных скобках. Для каждого момента есть версия для
        WhatsApp на английском, испанском и немецком, а там, где письмо действительно
        оправдано, — ещё и вариант для электронной почты. Испанские и немецкие сообщения
        остаются формальными — на <em>usted</em> и <em>Sie</em>, — пока покупатель сам не
        перейдёт на «ты».
      </p>

      <h3>День 0 — первый ответ</h3>
      <p>
        Здесь почти всё решает скорость, особенно если запрос пришёл с портала: отвечайте,
        пока покупатель ещё смотрит объявление. Только один вопрос — и пусть это будет вопрос,
        от которого зависит, что вы отправите дальше.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="День 0 · первый ответ">
          {`Hi {name}, this is {agent} from {agency}. Thanks for your enquiry about {property} — I have the full details and the photos ready to send you.
Are you able to see it this week, or are you looking from home for now?`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="День 0 · первый ответ">
          {`Hola {nombre}, soy {agente}, de {agencia}. Gracias por su consulta sobre {propiedad}: tengo las fotos y toda la información preparadas para enviárselas.
¿Le vendría bien verla esta semana o de momento prefiere mirar desde casa?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="День 0 · первый ответ">
          {`Hallo {Name}, hier ist {Agent} von {Agentur}. Vielen Dank für Ihre Anfrage zu {Objekt} — ich habe alle Unterlagen und Fotos für Sie bereit.
Möchten Sie die Immobilie diese Woche besichtigen, oder schauen Sie sich vorerst von zu Hause aus um?`}
        </TemplateBlock>
      </TemplateGroup>
      <p>
        Запросам с порталов нужен свой порядок работы: они приходят пачками, и намерения у
        авторов очень разные. Для них есть{" "}
        <Link href={marketingPath("guideIdealista", "ru")}>
          отдельное руководство о том, как отвечать на лиды с Idealista, Fotocasa и Kyero и
          отбирать перспективные
        </Link>
        .
      </p>

      <h3>День 1 — обещанная подборка</h3>
      <p>
        Никогда не отправляйте всё подряд. Три объекта, к каждому — одна строка о том, почему
        он в списке, работают лучше, чем ссылка на портал с сорока результатами.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="День 1 · подборка">
          {`{name}, here are the three that fit what you told me: {property 1}, {property 2} and {property 3} — all in {area}, all inside your budget.
The second one has the terrace you asked about. Shall I arrange viewings for {day}?`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="День 1 · подборка">
          {`{nombre}, estas son las tres que encajan con lo que me contó: {propiedad 1}, {propiedad 2} y {propiedad 3}, todas en {zona} y dentro de su presupuesto.
La segunda tiene la terraza que buscaba. ¿Le organizo las visitas para el {día}?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="День 1 · подборка">
          {`{Name}, hier sind die drei Objekte, die zu Ihren Angaben passen: {Objekt 1}, {Objekt 2} und {Objekt 3} — alle in {Gebiet} und in Ihrem Budgetrahmen.
Das zweite hat die Terrasse, nach der Sie gefragt haben. Soll ich die Besichtigungen für {Tag} einplanen?`}
        </TemplateBlock>
      </TemplateGroup>
      <p>
        Здесь письмо стоит лишних двух минут: в нём есть ссылки, оно не теряется в ленте
        переписки, и именно его покупатель перешлёт тому, с кем вместе покупает.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="email" title="День 1 · подборка письмом">
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
        <TemplateBlock lang="es" channel="email" title="День 1 · подборка письмом">
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
        <TemplateBlock lang="de" channel="email" title="День 1 · подборка письмом">
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

      <h3>День 3 — если ответа нет</h3>
      <p>
        Тишина после подборки обычно означает, что не подошло что-то одно, а не всё сразу.
        Спросите именно об этом — и ответ заодно станет вашим заданием на поиск.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="День 3 · ответа пока нет">
          {`{name}, no pressure from my side. If those three missed the mark, what would you change about them — the area, the size or the price?
Tell me the one thing and I will send better ones.`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="День 3 · ответа пока нет">
          {`{nombre}, sin ninguna prisa por mi parte. Si esas tres no le han convencido, ¿qué cambiaría: la zona, el tamaño o el precio?
Dígame solo eso y le mando opciones mejores.`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="День 3 · ответа пока нет">
          {`{Name}, ganz ohne Druck: Falls die drei nicht das Richtige waren — was würden Sie ändern, die Lage, die Größe oder den Preis?
Sagen Sie mir nur das eine, dann schicke ich Ihnen Passenderes.`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>Неделя 1 — пишите, только когда есть новости</h3>
      <p>
        К этому моменту нужен повод, связанный с рынком, а не с вашей воронкой: новый объект,
        снижение цены, освободившееся время для показа. Если повода нет, пропустите эту неделю.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="Неделя 1 · новости">
          {`{name}, something came on this morning that is closer to what you described: {property}, {price}, in {area} — and it has {the thing they asked for}.
Worth a look on {day}?`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="Неделя 1 · новости">
          {`{nombre}, esta mañana ha entrado algo que se acerca más a lo que me describió: {propiedad}, {precio}, en {zona}, y con {lo que pedía}.
¿Le organizo una visita el {día}?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Неделя 1 · новости">
          {`{Name}, heute Morgen ist etwas hereingekommen, das Ihrer Beschreibung näher kommt: {Objekt}, {Preis}, in {Gebiet} — und es hat {gewünschtes Merkmal}.
Sollen wir uns das am {Tag} ansehen?`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>Неделя 2 — вопрос о сроках</h3>
      <p>
        Это сообщение экономит вам месяцы. Покупатель, который на самом деле переезжает
        следующей весной, — не потерянный лид, а лид, который живёт по другим часам. И он сам
        вам об этом скажет, если признаться в этом будет легко.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="Неделя 2 · сроки">
          {`Hi {name}, one practical question so I write to you at the right rhythm: is the purchase for the next few months, or more of a next-year plan?
Either is completely fine — it only changes how often you hear from me.`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="Неделя 2 · сроки">
          {`Hola {nombre}, una pregunta práctica para escribirle en el momento adecuado: ¿la compra es para los próximos meses o más bien para el año que viene?
Cualquiera de las dos me vale; solo cambia cada cuánto le escribo.`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Неделя 2 · сроки">
          {`Hallo {Name}, eine praktische Frage, damit ich Sie im richtigen Rhythmus informiere: Ist der Kauf für die nächsten Monate geplant oder eher für nächstes Jahr?
Beides ist völlig in Ordnung — es ändert nur, wie oft Sie von mir hören.`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>Месяц 1 — продолжать или отложить</h3>
      <p>
        Через месяц станьте тем агентом, который говорит вслух то, о чём другие молчат.
        Именно предложение остановиться заставляет людей ответить «нет, продолжайте», а если
        они и правда хотят остановиться, вы только что сэкономили себе год сообщений без
        ответа.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="Месяц 1 · продолжать или отложить">
          {`{name}, it is a month since we spoke about {area}. I would rather send you one good property a month than ten average ones, so I have stopped sending you everything.
Shall I keep looking for you, or park it until your plans are firmer?`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="Месяц 1 · продолжать или отложить">
          {`{nombre}, ha pasado un mes desde que hablamos de {zona}. Prefiero enviarle una buena opción al mes antes que diez normales, así que he dejado de mandarle todo.
¿Sigo buscando para usted o lo dejamos en pausa hasta que tenga los planes más claros?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Месяц 1 · продолжать или отложить">
          {`{Name}, seit unserem Gespräch über {Gebiet} ist ein Monat vergangen. Mir ist ein gutes Objekt im Monat lieber als zehn mittelmäßige, deshalb schicke ich Ihnen nicht mehr alles.
Soll ich weiter für Sie suchen, oder pausieren wir, bis Ihre Pläne konkreter sind?`}
        </TemplateBlock>
      </TemplateGroup>
      <p>
        То же сообщение письмом — если покупатель за границей, очень занят или покупает
        вместе с партнёром, который вас никогда не видел:
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="email" title="Месяц 1 · продолжать или отложить, письмом">
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
        <TemplateBlock lang="es" channel="email" title="Месяц 1 · продолжать или отложить, письмом">
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
        <TemplateBlock lang="de" channel="email" title="Месяц 1 · продолжать или отложить, письмом">
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

      <h3>Каждый месяц после этого — одна строка, один объект</h3>
      <p>
        Долгосрочных покупателей выигрывает агент, который по-прежнему рядом — спокойно и без
        навязчивости. Один объект, одна причина, один вопрос.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="Ежемесячно · один объект">
          {`{name}, my one for you this month: {property}, {price} — {the single reason it fits}. Photos here: {link}.
Want me to arrange a look, or shall I keep watching?`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="Ежемесячно · один объект">
          {`{nombre}, mi propuesta del mes: {propiedad}, {precio} — {el motivo por el que encaja}. Fotos aquí: {enlace}.
¿Le organizo una visita o sigo atento?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Ежемесячно · один объект">
          {`{Name}, mein Vorschlag für diesen Monat: {Objekt}, {Preis} — {der eine Grund, warum es passt}. Fotos hier: {Link}.
Soll ich eine Besichtigung vereinbaren, oder halte ich weiter die Augen offen?`}
        </TemplateBlock>
      </TemplateGroup>

      <h2>Три момента важнее любого графика</h2>
      <p>
        Дата в расписании — слабый повод написать. То, что только что произошло, — сильный.
        Эти три момента важнее любой строки в таблице выше.
      </p>

      <h3>Вечер после показа</h3>
      <p>
        Пишите в тот же день, пока комнаты ещё свежи в памяти, и высказывайте своё мнение.
        Агенты, которые спрашивают «Как вам?», получают «Неплохо, спасибо». Агенты, которые
        говорят, что думают сами, получают настоящий ответ.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="После показа">
          {`{name}, thanks for your time today. My honest read: {property} was the strongest of the three on light and location, and the kitchen is the work you would be taking on.
Before I speak to the owner — where does it sit for you: yes, maybe, or no?`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="После показа">
          {`{nombre}, gracias por su tiempo de hoy. Mi opinión sincera: {propiedad} era la mejor de las tres en luz y ubicación, y la cocina es la reforma que habría que asumir.
Antes de hablar con la propiedad, ¿cómo la ve: sí, quizá o no?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="После показа">
          {`{Name}, vielen Dank für Ihre Zeit heute. Meine ehrliche Einschätzung: {Objekt} hat von den drei Objekten die beste Lage und das beste Licht, und die Küche ist die Arbeit, die Sie übernehmen würden.
Bevor ich mit der Eigentümerseite spreche: Wie sehen Sie es — ja, vielleicht oder nein?`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>Пока предложение у продавца</h3>
      <p>
        Ожидание — это время, когда покупатели начинают нервничать и снова смотрят
        объявления. Рассказывайте, что происходит, даже когда ничего не происходит.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="Предложение у продавца">
          {`{name}, your offer of {amount} is with the owner. They have asked until {day} to answer and I have said we would like a decision by then.
I will call you the moment I hear anything. Is there anything you want me to add while it is open?`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="Предложение у продавца">
          {`{nombre}, su oferta de {importe} ya está con la propiedad. Han pedido hasta el {día} para responder y les he dicho que esperamos una decisión para entonces.
Le llamo en cuanto sepa algo. ¿Quiere que añada algo mientras tanto?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Предложение у продавца">
          {`{Name}, Ihr Angebot über {Betrag} liegt der Eigentümerseite vor, die bis {Tag} um Bedenkzeit gebeten hat. Ich habe deutlich gemacht, dass wir bis dahin eine Entscheidung erwarten.
Ich melde mich, sobald ich etwas höre. Möchten Sie in der Zwischenzeit noch etwas ergänzen?`}
        </TemplateBlock>
      </TemplateGroup>

      <h3>Когда наконец появляется подходящий объект</h3>
      <p>
        Это сообщение, ради которого «отложенный» лид просыпается, поэтому сохраняйте то, что
        клиент вам рассказал: бюджет, тип недвижимости, число спален и то единственное, что не
        обсуждается.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="en" channel="whatsapp" title="Подходящий объект">
          {`{name}, this one matches your list almost exactly: {property}, {price}, {bedrooms} bedrooms in {area} — and it has {the non-negotiable}.
It came on this morning. Can you see it {day} at {time}?`}
        </TemplateBlock>
        <TemplateBlock lang="es" channel="whatsapp" title="Подходящий объект">
          {`{nombre}, esta encaja casi punto por punto con lo que buscaba: {propiedad}, {precio}, {dormitorios} dormitorios en {zona}, y con {lo innegociable}.
Ha salido esta mañana. ¿Puede verla el {día} a las {hora}?`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Подходящий объект">
          {`{Name}, dieses Objekt trifft Ihre Wünsche fast punktgenau: {Objekt}, {Preis}, {Anzahl} Schlafzimmer in {Gebiet} — und es hat {Ihr Muss-Kriterium}.
Es ist heute Morgen hereingekommen. Passt Ihnen eine Besichtigung am {Tag} um {Uhrzeit}?`}
        </TemplateBlock>
      </TemplateGroup>

      <h2>Шесть правил, от которых зависит, ответят ли вам</h2>
      <ol>
        <li>
          <strong>Одна мысль на сообщение.</strong> Объект, вопрос или новость — но не всё
          сразу.
        </li>
        <li>
          <strong>Повод, который касается клиента.</strong> «На вашей улице выставили новую
          виллу» — это повод. «Давно не общались» — это говорит ваш календарь.
        </li>
        <li>
          <strong>Заканчивайте вопросом, на который можно ответить в три слова.</strong>{" "}
          «Четверг или пятница?», «Да, возможно или нет?», «Ещё ищете?»
        </li>
        <li>
          <strong>Никаких «просто напоминаю о себе».</strong> Эта фраза перекладывает на
          покупателя работу — придумать ответ, — и именно её на этой неделе пишут все остальные
          агенты.
        </li>
        <li>
          <strong>Сообщение должно читаться на экране блокировки.</strong> Если в WhatsApp его
          приходится прокручивать, ему место в письме.
        </li>
        <li>
          <strong>Возвращайте клиенту его же слова.</strong> Если он сказал «пешком до
          пляжа», так и пишите, а не «недалеко от побережья».
        </li>
      </ol>
      <Callout kind="warning" title="Заполняйте все поля">
        <p>
          Шаблон, в котором осталось незаполненное <code>{"{area}"}</code>, хуже, чем
          отсутствие сообщения: он прямо показывает покупателю, как мало внимания вы ему
          уделили. Перечитывайте каждое сообщение перед отправкой — поле в скобках нужно, чтобы
          заставить вас добавить конкретную деталь, а не чтобы избавить от необходимости её
          писать.
        </p>
      </Callout>

      <h2>На каком языке писать</h2>
      <p>
        Отвечайте на языке запроса. На Коста-дель-Соль и на островах за одну неделю могут
        написать британцы, немцы, голландцы, скандинавы и испанцы, и язык вашего ответа —
        первый сигнал того, сколько внимания они от вас получат.
      </p>
      <ul>
        <li>
          Сохраняйте формальный тон, пока клиент сам от него не откажется: <em>usted</em>{" "}
          по-испански, <em>Sie</em> по-немецки.
        </li>
        <li>
          Храните язык клиента в его карточке, а не в голове, чтобы и сообщение через месяц
          ушло на нужном языке.
        </li>
        <li>
          Если вы владеете языком недостаточно, чтобы писать тепло, пишите коротко. Неуклюжее
          длинное сообщение читается хуже, чем ясное в три строки.
        </li>
      </ul>
      <p>
        В {SITE_NAME} язык хранится в карточке клиента, и черновики сообщений пишутся на этом
        языке. Это одна из причин, почему{" "}
        <Link href={marketingPath("crmSpain", "ru")}>CRM для испанского рынка</Link>{" "}
        — не то же самое, что универсальная CRM для продаж с переведённым интерфейсом.
      </p>

      <h2>Когда остановиться и как отложить лид</h2>
      <p>
        Остановиться — это решение, а не медленное угасание. Достаточно двух сигналов:
        покупатель просит больше не писать или два сообщения подряд вроде шаблона «Месяц 1»
        остаются совсем без ответа.
      </p>
      <p>Правильно отложить лид — значит сделать три вещи:</p>
      <ul>
        <li>
          Пометьте его как холодный, чтобы он ушёл из рабочего списка, но сохраните карточку:
          бюджет, район, то, что не обсуждается, и последнее, что клиент сказал.
        </li>
        <li>
          Запишите себе причину. «Ждёт продажи своего дома в Гамбурге» — это дата в вашем
          ежедневнике; «пропал» — нет.
        </li>
        <li>
          Пишите снова, только когда объект действительно подходит. Это то самое сообщение
          выше, и именно поэтому отложить лучше, чем удалить.
        </li>
      </ul>
      <p>
        А если вас просят больше не писать — перестаньте и отметьте это в карточке, чтобы
        пометка пережила смену телефона.
      </p>

      <h2>Как сделать, чтобы график работал без вас</h2>
      <p>
        Никто не удержит в голове по семь касаний на лид для сорока покупателей. Работа не в
        том, чтобы писать сообщения — они у вас уже есть, — а в том, чтобы помнить, кому из
        клиентов пора написать.
      </p>
      <p>
        Эту часть берёт на себя {SITE_NAME}. Функция Auto-engage замечает клиентов, которые
        пропали, и показывает их вам вместе с уже написанным сообщением — на языке клиента и
        с учётом того, что есть в его карточке: бюджета, последнего просмотренного объекта,
        предложения, которое ещё в силе. Вы читаете, меняете что хотите и отправляете — без
        вас ничего не уходит, а сообщение открывается в WhatsApp, где и так идёт переписка.
        Ваши самые удачные сообщения можно держать рядом как сохранённые шаблоны.
      </p>
      <p>
        Остальная часть проблемы повторных контактов — на самом деле проблема учёта, и для
        этого есть воронка, карточки клиентов и календарь показов. Вот{" "}
        <Link href={marketingPath("home", "ru")}>короткий обзор того, как всё это связано</Link>;
        для первых клиентов это бесплатно, а на{" "}
        <Link href={marketingPath("pricing", "ru")}>странице тарифов</Link> видно, сколько
        стоит безлимит, когда ваша база перерастёт бесплатный тариф.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Повторный контакт с лидами в недвижимости: график и шаблоны",
  description:
    "График повторных контактов для покупателей, которые перестали отвечать, и готовые шаблоны для WhatsApp и почты на английском, испанском и немецком.",
  kind: "article",
  published: "2026-09-13",
  eyebrow: "Руководство",
  heading: "Повторный контакт с лидами в недвижимости: график и готовые шаблоны",
  lead: "Большинство покупателей никогда не говорят «нет» — они просто перестают отвечать. Вот ритм повторных контактов, который можно вести с телефона между показами, с сообщениями для WhatsApp и письмами на каждый момент — на английском, испанском и немецком.",
  Body,
  faq: [
    {
      q: "Как часто напоминать о себе лиду по недвижимости?",
      a: "Часто в начале, редко потом. Ответьте в тот же день, на следующий день отправьте подборку и напишите ещё дважды за первые две недели; после первого месяца достаточно раза в месяц, если писать только тогда, когда есть что-то стоящее. Как только покупатель отвечает, график останавливается и начинается разговор.",
    },
    {
      q: "WhatsApp или почта: как лучше напоминать о себе покупателям?",
      a: "Через тот канал, которым клиент связался с вами, а дальше — WhatsApp для всего короткого и срочного. Письмо оправдано, когда вы отправляете несколько объектов со ссылками, документы или что-то, что покупатель захочет найти через месяц.",
    },
    {
      q: "Что написать покупателю, который пропал после показа?",
      a: "Дайте честную оценку объекта, включая его недостаток, и закончите вопросом, на который можно ответить одним словом: да, возможно или нет. На мнение реагировать проще, чем на «Как вам?», а ответ покажет, продолжать ли поиск.",
    },
    {
      q: "Стоит ли писать иностранным покупателям на их языке?",
      a: "Да, если вы можете сделать это грамотно, и поначалу — формально: usted по-испански, Sie по-немецки. Если письменный немецкий или нидерландский у вас слабый, лучше короткое и правильное сообщение, чем длинное и приблизительное.",
    },
    {
      q: "Когда перестать напоминать о себе лиду?",
      a: "Когда клиент сам об этом просит или когда два сообщения подряд, отправленные с интервалом, остаются совсем без ответа. Не удаляйте его: пометьте как холодного, запишите причину и что он искал, и напишите снова, только когда появится действительно подходящий объект.",
    },
    {
      q: "Не делают ли шаблоны сообщения безликими?",
      a: "Только если отправлять их без изменений. Шаблон задаёт структуру — одна мысль, один повод написать, один вопрос, — а каждое поле в скобках заставляет добавить что-то конкретное для этого покупателя: его район, его бюджет, то, без чего он не готов покупать.",
    },
  ],
  related: ["guideIdealista", "crmSpain", "pricing"],
};
