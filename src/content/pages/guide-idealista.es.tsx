import Link from "next/link";

import { marketingPath } from "@/lib/routes";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import { TemplateBlock } from "@/components/marketing/template-block";
import { TemplateGroup } from "@/components/marketing/template-group";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";

const L = "es";

function Body() {
  return (
    <>
      <p>
        Cada contacto de portal son los mismos cinco minutos de trabajo: leerlo, contestarlo,
        decidir si es real y dejarlo donde vuelvas a verlo mañana. Si eso te sale mal un lunes con
        catorce esperando, pierdes justo los dos que importaban. Aquí tienes la rutina, con los
        mensajes escritos.
      </p>

      <h2>Por qué un contacto de portal no es un lead normal</h2>
      <p>
        Un cliente que llega por recomendación llega templado y viene solo. Un lead de portal
        llega frío, en grupo y no es tuyo en exclusiva: el mismo comprador ha pulsado “contactar”
        en varios anuncios de la misma zona, y algunos de esos anuncios son de otros agentes.
      </p>
      <p>De ahí salen tres consecuencias.</p>
      <ul>
        <li>
          <strong>El volumen va a rachas.</strong> Dos días sin nada y de repente once en una
          tarde, después de bajar un precio o de una newsletter del portal. Una rutina que solo
          funciona los días tranquilos no es una rutina.
        </li>
        <li>
          <strong>La intención está mezclada.</strong> Vecinos mirando cuánto vale su piso, gente
          que comprará dentro de tres años, inversores que mandan la misma línea a todo lo que
          baje de cierto precio, y dos o tres compradores que están buscando de verdad este mes.
          Del primer mensaje no se distinguen, y por eso contestas a todos.
        </li>
        <li>
          <strong>La rapidez pesa más que el discurso.</strong> Cuando varios agentes reciben al
          mismo comprador, la primera respuesta útil es la que se queda con la conversación, y la
          conversación es la que acaba en visita.
        </li>
      </ul>
      <Callout kind="tip" title="La única regla que no cambia">
        <p>
          Contesta todos los contactos el mismo día, también los que te huelen a basura. Dos
          minutos de criba hoy valen más que una respuesta perfecta escrita el jueves.
        </p>
      </Callout>

      <h2>Qué te da realmente un contacto</h2>
      <p>
        Antes de montar la rutina, ten claro qué te llega al móvil. Cambia según el portal, y
        merece la pena revisar una vez tus avisos para que nada se quede en un buzón web.
      </p>
      <h3>Idealista</h3>
      <p>
        Los contactos entran en el Inbox de idealista/tools, y además idealista te avisa por
        correo de los mensajes que recibes, con notificación en el móvil si usas la app. En cada
        contacto ves el nombre de la persona, su mensaje, su teléfono y el anuncio por el que
        escribe, y en la misma pantalla tienes las llamadas recibidas y perdidas con el anuncio
        que las provocó (
        <a
          href="https://www.idealista.com/tools/centrodeayuda/articulos/inbox/"
          target="_blank"
          rel="noreferrer"
        >
          ayuda de idealista/tools
        </a>
        ).
      </p>
      <h3>Fotocasa</h3>
      <p>
        Fotocasa Pro resume así su gestión de contactos: “ten control de tus contactos vía email
        y/o teléfono”, junto a las estadísticas de tus anuncios (
        <a href="https://pro.fotocasa.es/soluciones/" target="_blank" rel="noreferrer">
          Fotocasa Pro
        </a>
        ). Habitaclia es otro portal del mercado español que conviene revisar igual, una vez.
      </p>
      <h3>Kyero</h3>
      <p>
        Kyero manda los contactos a una dirección de correo que eliges tú: la cuenta admite varias
        y puedes cambiar cuál recibe las peticiones. El aviso incluye las preguntas del comprador,
        el inmueble y tu propia referencia, y al comprador se le dice que le responderás
        directamente a su correo (
        <a href="https://help.kyero.com/estate-agents" target="_blank" rel="noreferrer">
          ayuda de Kyero
        </a>
        ). Es un portal dirigido a compradores extranjeros, y su directorio de agentes permite
        filtrar por el idioma que habla cada uno, así que cuenta con contactos en inglés, alemán,
        neerlandés o en lenguas escandinavas, no solo en español. En la costa esa mezcla es tu
        semana normal:{" "}
        <Link href={marketingPath("crmMarbella", L)}>
          así trabajan los agentes de la Costa del Sol
        </Link>
        .
      </p>
      <p>
        Lo que ningún portal te da es un comprador cualificado. El nombre, el mensaje y la
        referencia son materia prima. El presupuesto, los plazos, la financiación y hasta si están
        en España lo tienes que preguntar tú.
      </p>
      <p>
        Y si estás decidiendo en qué portales pagar,{" "}
        <Link href={marketingPath("guidePortalPrices", L)}>
          esto es lo que cobra cada portal a una agencia
        </Link>
        , con los precios que son oficiales separados de los que no.
      </p>

      <h2>Paso 1: responde el mismo día y en su idioma</h2>
      <p>
        Contesta en el idioma en el que te han escrito, aunque después sigáis en otro. Un
        comprador que escribe en alemán y recibe una plantilla en español ya ha aprendido algo
        sobre cómo va a ir el resto de la compra.
      </p>
      <p>
        Una buena primera respuesta hace cuatro cosas y cabe en una pantalla de móvil: nombra el
        inmueble, contesta a lo que te han preguntado, añade un dato que no está en el anuncio y
        termina con una pregunta fácil de responder. El dossier, más adelante.
      </p>
      <TemplateGroup>
        <TemplateBlock lang="es" channel="whatsapp" title="Primera respuesta">
          {`Buenos días, {nombre}. Soy {tu nombre}, de {agencia}. Gracias por su mensaje sobre la referencia {referencia} en {zona}.

Respondo a su pregunta: {respuesta en una línea}. Algo que no aparece en el anuncio: {detalle — orientación, gastos de comunidad, año de la última reforma}.

¿Le viene bien que le llame hoy o mañana por la mañana? Si me cuenta qué busca exactamente, le preparo dos o tres opciones parecidas para la misma visita.

Un saludo,
{tu nombre}`}
        </TemplateBlock>
        <TemplateBlock lang="en" channel="whatsapp" title="Primera respuesta">
          {`Hello {first name}, I’m {your name} from {agency}. Thanks for your message about {reference} in {area}.

To answer your question: {one-line answer}. One thing the ad doesn’t mention: {detail — which way the terrace faces, the community fee, the year of the last renovation}.

Are you in {area} at the moment, or planning a trip? If you tell me roughly what you’re looking for, I’ll line up two or three similar properties for the same day so the trip is worth it.

{your name}`}
        </TemplateBlock>
        <TemplateBlock lang="de" channel="whatsapp" title="Primera respuesta">
          {`Guten Tag {Vorname}, ich bin {Ihr Name} von {Agentur}. Vielen Dank für Ihre Anfrage zu {Objektnummer} in {Ort}.

Zu Ihrer Frage: {Antwort in einem Satz}. Was im Inserat nicht steht: {Detail}.

Wann planen Sie, vor Ort zu sein? Ich stelle Ihnen gern zwei bis drei vergleichbare Objekte für denselben Tag zusammen.

Viele Grüße
{Ihr Name}`}
        </TemplateBlock>
      </TemplateGroup>
      <Callout kind="note">
        <p>
          Si ese idioma no lo dominas, escribe igualmente el primer párrafo en él y ofrece seguir
          en uno que compartáis: “Si le resulta más cómodo, podemos seguir en inglés”. En{" "}
          {SITE_NAME} el borrador sale en el idioma que tenga la ficha del cliente; lo lees, lo
          corriges y se abre en WhatsApp con el texto puesto.
        </p>
      </Callout>

      <h2>Paso 2: cualifica en los dos mensajes siguientes</h2>
      <p>
        No mandes un cuestionario. Dos preguntas por mensaje, cada una colgada de algo que puedas
        hacer por el comprador, y al tercer intercambio tienes la foto completa. Cinco cosas que
        saber antes de regalar un sábado.
      </p>
      <ol>
        <li>
          <strong>El presupuesto, y si incluye los gastos.</strong> En España los gastos de compra
          van por encima del precio: ITP o IVA, notaría, registro y abogado. Un comprador cuyo
          “máximo” no los ha contado está mirando una franja por encima de la que puede firmar.
        </li>
        <li>
          <strong>Los plazos.</strong> “¿Para cuándo le gustaría tener las llaves?” separa este
          trimestre del año que viene mucho mejor que preguntar si va en serio.
        </li>
        <li>
          <strong>La financiación.</strong> Contado, hipoteca en España o hipoteca en su país. Un
          comprador que paga al contado y otro que espera a un banco extranjero son dos calendarios
          distintos, y conviene saber en cuál estás antes de la segunda visita.
        </li>
        <li>
          <strong>La zona, de verdad.</strong> Casi todos los contactos nombran un anuncio, no una
          zona. Pregunta qué les llevó a ese: el colegio, el golf, el aeropuerto, las vistas. Muchas
          veces descubres que dos calles más allá les encaja mejor y además lo tienes en cartera.
        </li>
        <li>
          <strong>El papeleo que ya han empezado.</strong> Un comprador extranjero necesitará NIE,
          y normalmente cuenta bancaria en España y abogado. No es tu trabajo, pero saber si lo han
          empezado te dice a qué distancia real está la firma y si compran como no residentes.
        </li>
      </ol>
      <p>
        Apunta las respuestas según llegan, con las palabras del cliente. Dentro de cuatro semanas
        no vas a acordarte de cuál de los once contactos era la pareja neerlandesa con perro, y
        “presupuesto 450, terreno para el perro, vienen la tercera semana de octubre” es lo que
        hace que el siguiente mensaje valga la pena.
      </p>

      <h2>Paso 3: saca el lead del buzón del portal el mismo día</h2>
      <p>
        El buzón de un portal es una lista de mensajes, no un embudo. No te dice quién no te ha
        contestado, quién está más cerca de una visita ni a quién prometiste llamar en marzo. Si
        anuncias en dos portales tienes dos listas de mensajes y sigues sin tener una lista de
        compradores.
      </p>
      <p>
        Uses lo que uses — un CRM, una hoja de cálculo, una libreta — la regla es la misma: una
        sola lista, actualizada el día que entra el contacto y con una etapa al lado de cada
        nombre. El día que lo dejas para el fin de semana, la lista deja de ser cierta.
      </p>
      <p>
        En {SITE_NAME} eso es un pegado. Copias el contacto — el mensaje del portal, el aviso por
        correo o un WhatsApp reenviado —, lo pegas en la caja de leads y te vuelve como un
        formulario relleno: nombre, correo, teléfono, el idioma en el que escribe, la nacionalidad
        si la menciona y un resumen de lo que busca, con presupuesto, zona, tipo de inmueble,
        habitaciones y plazos. Lo revisas, corriges y guardas. A partir de ahí es una ficha que
        avanza por nuevo, contactado, cualificado, visita y reservado, que es lo que se le pide a
        un{" "}
        <Link href={marketingPath("crmSpain", L)}>CRM pensado para el mercado español</Link>.
      </p>

      <h2>Paso 4: un ritmo de seguimiento que aguanten</h2>
      <p>
        La mayoría de los leads de portal no se pierden contra un competidor: se caen. Se contestan
        una vez, no se les vuelve a escribir, y seis semanas después los reactiva quien sí escribe.
        La primera respuesta es la fácil. Las operaciones están en el cuarto mensaje.
      </p>
      <p>
        Un ritmo que le va bien a un contacto de portal: la respuesta el día cero, un mensaje corto
        al día siguiente si no han contestado, un tercero tres días después con algo nuevo — una
        bajada de precio, un inmueble que encaja mejor, un hueco para visitar —, otro en la segunda
        semana y, a partir de ahí, uno al mes con motivo.
      </p>
      <p>
        Dos reglas evitan que parezca spam: cada mensaje trae información nueva y cada mensaje
        termina con una pregunta. “Te escribo por si acaso” no es ninguna de las dos. La cadencia
        completa, con los mensajes en español, inglés y alemán, está en la{" "}
        <Link href={marketingPath("guideFollowUp", L)}>guía de seguimiento</Link>.
      </p>
      <p>
        Esta es la parte que merece automatizarse. El auto-engage de {SITE_NAME} detecta a los
        clientes que llevan tiempo callados y te prepara el siguiente mensaje en su idioma; tú lo
        lees, cambias lo que quieras y lo envías.
      </p>

      <h2>Paso 5: saber qué portal te da operaciones</h2>
      <p>
        Los portales son una cuota mensual y, al sexto mes, casi ningún agente sabe decir cuál le
        ha dado una firma. No hace falta una herramienta de informes para arreglarlo: hace falta
        una costumbre.
      </p>
      <p>
        Marca el origen en la ficha el mismo día que entra el lead. No hay un campo de portal: lo
        pones en la primera línea de las notas — “Idealista, 4 sep, ref 1234” — y, si vendes para
        varias agencias, dejas en el campo de agencia de quién era el anuncio. Luego, una vez por
        trimestre, cuentas tres números por portal: contactos, visitas y operaciones firmadas.
      </p>
      <p>
        El número del medio es el que nadie mira y el que dice la verdad. Cuarenta contactos al
        mes de los que sale una visita te cuestan más que la cuota; seis de los que salen cuatro
        visitas merecen tus mejores fotos.
      </p>

      <h2>Cinco errores que te cuestan operaciones</h2>
      <ol>
        <li>
          <strong>Contestar solo con una pregunta.</strong> “Hola, ¿cuándo puede visitarlo?” suena a
          carta tipo. Responde primero a lo que te han preguntado y luego pregunta tú.
        </li>
        <li>
          <strong>Contestar en el idioma equivocado.</strong> Responde en el idioma del contacto y
          déjalo anotado en la ficha, para que el siguiente mensaje no se vaya al tuyo.
        </li>
        <li>
          <strong>Llamar tres veces y rendirse.</strong> Un contacto escrito a las 23:40 es un
          mensaje, no una petición de llamada. Escribe primero y pide permiso para llamar: desde el
          extranjero casi nadie devuelve una llamada de un número español desconocido.
        </li>
        <li>
          <strong>Dejar el lead en el buzón del portal.</strong> En una semana lo habrán enterrado
          los contactos nuevos, y ahí dentro nada te recuerda nada.
        </li>
        <li>
          <strong>Borrar a los “ahora no”.</strong> Quien compra dentro de nueve meses es un buen
          lead con fecha. Apárcalo con esa fecha y con un motivo para volver a escribir.
        </li>
      </ol>
      <p>
        Los cinco pasos se pueden llevar en papel, y buenos agentes lo hacen. La razón para usar una
        herramienta es que los pasos tres, cuatro y cinco dejen de depender de tu memoria: mira{" "}
        <Link href={marketingPath("home", L)}>qué hace {SITE_NAME}</Link> y{" "}
        <Link href={marketingPath("pricing", L)}>cuánto cuesta</Link>.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Gestionar leads de Idealista: responder y cualificar",
  description:
    "Cómo gestionar los contactos de Idealista, Fotocasa y Kyero: responder el mismo día y en su idioma, cualificar en dos mensajes y tenerlos todos en una lista.",
  kind: "article",
  published: "2026-09-13",
  eyebrow: "Guía",
  heading: "Cómo gestionar los leads de Idealista sin perder ninguno",
  lead: "Los leads de portal llegan a rachas, la mayoría no está para comprar y el que sí lo está ha escrito a otros tres agentes antes de comer. Esta es la rutina que los retiene: contestar el mismo día en su idioma, cualificar en dos mensajes y sacar cada contacto del buzón del portal para llevarlo a una única lista que trabajas de verdad.",
  Body,
  faq: [
    {
      q: "¿En cuánto tiempo hay que responder a un contacto de Idealista?",
      a: "El mismo día, y dentro de la hora siguiente si llega en horario de trabajo. Varios agentes suelen recibir al mismo comprador y la primera respuesta útil es la que se convierte en conversación. Una respuesta corta hoy vale más que una completa mañana.",
    },
    {
      q: "¿Llamo o escribo primero a un lead de portal?",
      a: "Escribe primero y luego pide permiso para llamar. Muchos contactos se escriben por la noche, un mensaje se lee cuando el comprador puede, y desde el extranjero casi nadie devuelve una llamada de un número español desconocido.",
    },
    {
      q: "¿Qué hago con los contactos que claramente no son compradores?",
      a: "Contesta una vez, breve, y márcalos como fríos en lugar de borrarlos. El vecino que mira cuánto vale su piso es el vendedor del año que viene, y quien compra dentro de un año es un buen lead con fecha.",
    },
    {
      q: "¿Tengo que hablar el idioma del comprador?",
      a: "No hace falta dominarlo. Escribe la primera respuesta en el idioma en el que te han escrito y ofrece seguir en uno que compartáis. Lo importante es que el comprador no tenga que cambiar de idioma para que le contesten.",
    },
    {
      q: "¿Se pueden pasar los leads de Idealista a un CRM automáticamente?",
      a: `${SITE_NAME} no tiene integración con los portales, así que no entra nada solo. Copias el contacto — del mensaje del portal, del aviso por correo o de WhatsApp —, lo pegas en la caja de leads y te devuelve el nombre, los datos, el idioma y lo que busca, relleno para que lo revises y lo guardes.`,
    },
    {
      q: "¿Cómo sé qué portal me compensa?",
      a: "Anota el portal y la fecha en las notas de la ficha el día que entra el lead y, una vez por trimestre, cuenta contactos, visitas y operaciones firmadas de cada uno. La columna de visitas es la que distingue un portal que trae compradores de otro que solo trae tráfico.",
    },
  ],
  related: ["guideFollowUp", "guidePortalPrices", "crmSpain", "pricing"],
};
