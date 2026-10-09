import Link from "next/link";

import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES } from "@/lib/billing";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";

const home = marketingPath("home", "es");
const pricing = marketingPath("pricing", "es");
const marbella = marketingPath("crmMarbella", "es");
const idealista = marketingPath("guideIdealista", "es");
const followUp = marketingPath("guideFollowUp", "es");

function Body() {
  return (
    <>
      <p>
        Un CRM inmobiliario para España tiene un trabajo muy concreto. Los leads entran como
        texto en el buzón de un portal, la conversación ocurre en WhatsApp, la mitad de tus
        compradores te escriben en inglés, alemán u holandés, y el chalet que enseñas el
        jueves es de otra agencia. Un CRM pensado para un equipo comercial de software no
        resuelve nada de eso por su cuenta. Aquí tienes lo que pide de verdad este trabajo y
        cómo responde {SITE_NAME} a cada parte.
      </p>

      <h2>Para quién es</h2>
      <p>
        Para el agente inmobiliario independiente: quien encuentra al comprador, enseña el
        inmueble, negocia la oferta y guarda el expediente. La mayoría son autónomos y muchos
        llevan anuncios de varias agencias a la vez, más alguno propio.
      </p>
      <p>
        No es un back office de agencia. No hay publicación automática de anuncios en los
        portales, ni licencias por usuario para una oficina de diez, ni informes por sucursal.
        Si es eso lo que buscas, la comparativa de más abajo te dice en qué categoría mirar.
        Si lo que necesitas es un sitio donde estén todos los compradores, vendedores,
        visitas, ofertas y documentos que llevas ahora mismo, esta es la forma correcta de
        herramienta: la <Link href={home}>página de inicio</Link> lo enseña en pantallas en
        vez de en prosa.
      </p>

      <h2>Qué le pide a un CRM vender en España</h2>
      <p>Siete cosas aparecen casi todas las semanas:</p>
      <ul>
        <li>
          <strong>Los leads vienen de los portales.</strong> Idealista, Fotocasa, Kyero y
          Habitaclia te mandan el contacto como un mensaje, no como una ficha que puedas
          archivar.
        </li>
        <li>
          <strong>El canal es WhatsApp.</strong> No hilos de correo ni registros de llamadas:
          un chat que hay que contestar hoy.
        </li>
        <li>
          <strong>Muchos compradores son extranjeros.</strong> Británicos, alemanes,
          holandeses, belgas, escandinavos. Preguntan por el NIE, por comprar siendo no
          residente y por lo que cuesta la compra además del precio.
        </li>
        <li>
          <strong>Vendes para más de una agencia.</strong> De quién sea el inmueble decide
          quién tiene las llaves y cómo se reparte la comisión.
        </li>
        <li>
          <strong>Un día de visitas es logística.</strong> Varios inmuebles, un coche y un
          cliente que quizá ha volado para dos días.
        </li>
        <li>
          <strong>El papeleo empieza pronto.</strong> Pasaporte o NIE, el contrato de reserva,
          las arras: todo eso pertenece a un cliente, no a una carpeta del portátil.
        </li>
        <li>
          <strong>Eres una empresa.</strong> El software que pagas es una factura con IVA y
          tiene que merecer esa línea.
        </li>
      </ul>

      <h2>Leads de portales: del contacto a la ficha de cliente</h2>
      <p>
        Lo difícil no es recibir el contacto, es sacarlo del buzón del portal el mismo día. En{" "}
        {SITE_NAME} pegas el mensaje —de Idealista, Fotocasa, Kyero, un correo o un WhatsApp
        reenviado— y se convierte en un lead listo para guardar, con el nombre, el teléfono,
        el idioma y el presupuesto ya rellenados. Corriges lo que haga falta y guardas. Como
        no hay que teclear nada, tampoco hay excusa para dejarlo para luego.
      </p>
      <p>
        <strong>Empieza por aquí:</strong> guarda cada contacto de portal como cliente en
        cuanto lo leas y etiquétalo con el portal del que viene. En un mes sabrás qué portal
        te trae visitas y no solo mensajes. La{" "}
        <Link href={idealista}>guía para gestionar los leads de Idealista</Link> explica cómo
        responderlos y cualificarlos.
      </p>

      <h2>WhatsApp y los clientes que no hablan español</h2>
      <p>
        Cada ficha de cliente lleva su idioma y su nacionalidad, y no es un adorno: es el
        idioma en el que se escribe el seguimiento. Abres el cliente y {SITE_NAME} te redacta
        el mensaje de WhatsApp o el correo en el idioma de esa persona, con su presupuesto,
        los inmuebles que ha visto y el punto del proceso en el que está. Tú lo lees, cambias
        lo que quieras y se abre en WhatsApp para que lo envíes.
      </p>
      <p>
        Los leads que se pierden suelen ser los silenciosos. El seguimiento automático detecta
        a los clientes que llevan tiempo callados y te los pone delante con el mensaje ya
        redactado, así la decisión es «lo envío o no» y nunca «qué le escribo». La{" "}
        <Link href={followUp}>guía de seguimiento de leads</Link> tiene la cadencia y las
        plantillas que hay detrás, en español, inglés y alemán.
      </p>
      <Callout kind="note" title="Lo que no es">
        <p>
          {SITE_NAME} no se conecta a tu cuenta de WhatsApp ni lee tus conversaciones. Escribe
          el mensaje y se lo pasa a WhatsApp; enviarlo sigue siendo cosa tuya, y el número
          también.
        </p>
      </Callout>

      <h2>Un solo embudo para todas las agencias con las que vendes</h2>
      <p>
        Etiqueta cada lead con la agencia por la que llegó y toda tu cartera queda en un mismo
        sitio, sea de quien sea el inmueble. Los compradores avanzan por nuevo, contactado,
        cualificado, visitas y reservado; los vendedores tienen su propio flujo corto, de
        pendiente a cualificado, con cada anuncio colgando de su ficha.
      </p>
      <p>
        Como las dos partes están en la misma cartera, {SITE_NAME} te enseña cuáles de tus
        anuncios encajan con el presupuesto, el tipo de inmueble y los dormitorios de un
        comprador: ese cruce que si no harías de memoria un domingo por la noche. Y cuando
        compartes operación con otra agencia, la etiqueta es lo que te recuerda tres semanas
        después de quién era el anuncio y con quién repartes la comisión.
      </p>

      <h2>Visitas, ofertas y el papeleo que viene después</h2>
      <p>
        Las visitas van a un calendario mensual con un recordatorio antes de cada una, una
        suscripción a Google Calendar para que aparezcan donde ya miras y una confirmación de
        WhatsApp al cliente en un toque. Cada inmueble que ve un comprador queda registrado
        con fotos, cada oferta se anota frente al precio de salida, y el contrato, el
        pasaporte o el NIE y los papeles de la reserva viven en la ficha del cliente y no en
        la carpeta de descargas.
      </p>
      <p>
        Eso es lo que hace que la etapa «reservado» signifique algo: cuando en marzo un
        cliente te pregunta qué ofreció en enero, la respuesta está en su ficha. Y quien
        encadena visitas con clientes que vienen en avión tiene su propio caso: la{" "}
        <Link href={marbella}>página de Marbella y la Costa del Sol</Link> entra en ese día.
      </p>

      <h2>Hojas de cálculo, CRM genéricos y software de agencia</h2>
      <p>
        Hay tres alternativas honestas, cada una pensada para un trabajo distinto. Lo que sigue
        habla de la categoría, no del precio ni de la calidad de ningún producto concreto.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Categoría</th>
            <th scope="col">Para qué está pensada</th>
            <th scope="col">Qué tendrías que poner tú</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Hojas de cálculo y apps de notas</th>
            <td>
              Una lista que controlas del todo: Excel, Google Sheets, Notas, Notion. Gratis,
              inmediata y con la forma que tú le des.
            </td>
            <td>
              Los recordatorios que de verdad te llegan, los mensajes, los documentos y la
              disciplina de actualizarla al salir de una visita y no una semana después.
            </td>
          </tr>
          <tr>
            <th scope="row">CRM comerciales genéricos</th>
            <td>
              Procesos de venta B2B repetibles —HubSpot, Pipedrive y similares—: oportunidades,
              etapas, objetivos e informes de equipo.
            </td>
            <td>
              Toda la parte inmobiliaria (visitas, ofertas frente al precio de salida,
              documentos), el idioma del cliente y algo que entienda qué es un contacto de
              portal.
            </td>
          </tr>
          <tr>
            <th scope="row">Software de agencia español</th>
            <td>
              Llevar una agencia: Inmovilla, Witei, Inmoweb y otros giran alrededor de la
              gestión de anuncios, la publicación en portales y una oficina con varios agentes.
            </td>
            <td>
              Nada, si la agencia eres tú. Si eres un agente que vende para varias agencias, la
              cartera que necesitas las abarca todas en vez de vivir dentro de una.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        {SITE_NAME} es la cuarta forma: un agente, todas las agencias con las que trabaja y el
        cliente en el centro en lugar del anuncio.
      </p>

      <h2>Cuánto cuesta y qué todavía no hace</h2>
      <p>
        El plan Gratis cubre hasta {FREE_CLIENT_LIMIT} clientes, compradores y vendedores
        juntos, con todas las funciones incluidas, sin tarjeta y sin límite de tiempo:
        suficiente para pasar un lead real por dentro antes de decidir. Pro cuesta{" "}
        {PRICES.standard.monthly} € al mes o {PRICES.standard.yearly} € al año más IVA, con
        clientes ilimitados; pon tu NIF al pagar y la factura sale con él. Los primeros{" "}
        {FOUNDING_CAP} agentes de pago se quedan Pro en {PRICES.founding.monthly} € al mes de
        por vida, y si recomiendas a otro agente os lleváis un mes gratis cada uno en cuanto
        los dos estéis en Pro. En la <Link href={pricing}>página de precios</Link> tienes los
        dos planes uno al lado del otro y qué pasa si cancelas.
      </p>
      <h3>Qué todavía no hace</h3>
      <ul>
        <li>
          <strong>Alquileres.</strong> Hoy funcionan los embudos de venta; el alquiler de larga
          y corta temporada está previsto, no construido.
        </li>
        <li>
          <strong>Publicar en portales.</strong> Los leads entran pegando el mensaje; los
          anuncios no salen.
        </li>
        <li>
          <strong>Gestión de equipos.</strong> Los datos de cada agente están aislados, que es
          justo la idea: no hay embudos compartidos ni permisos por usuario.
        </li>
      </ul>
      <p>
        Todo lo demás está en los dos planes, en español, inglés o ruso, en el navegador y
        instalado en la pantalla de inicio del móvil.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "CRM inmobiliario para agentes independientes",
  description: `Qué tiene que resolver un CRM inmobiliario en España: leads de portales, WhatsApp, compradores extranjeros y varias agencias a la vez. Gratis hasta ${FREE_CLIENT_LIMIT} clientes.`,
  kind: "page",
  published: "2026-09-13",
  eyebrow: "CRM inmobiliario · España",
  heading: "Un CRM inmobiliario hecho para agentes que venden en España",
  lead: `Contactos de portales, WhatsApp, compradores que escriben en cuatro idiomas y anuncios de tres agencias distintas. Esto es lo que le pide ese trabajo a un CRM y cómo lo resuelve ${SITE_NAME}.`,
  Body,
  faq: [
    {
      q: "¿Hay algún CRM inmobiliario gratis?",
      a: `${SITE_NAME} es gratis hasta ${FREE_CLIENT_LIMIT} clientes, compradores y vendedores juntos, con todas las funciones, sin tarjeta y sin límite de tiempo. A partir de ahí, Pro cuesta ${PRICES.standard.monthly} € al mes o ${PRICES.standard.yearly} € al año más IVA, con clientes ilimitados.`,
    },
    {
      q: "Soy autónomo y vendo para varias agencias, ¿me sirve?",
      a: "Sí. Cada lead se etiqueta con la agencia por la que llegó, así que una sola cartera cubre todas las agencias con las que trabajas y sigues viendo de un vistazo de quién es el inmueble que mira cada comprador.",
    },
    {
      q: "¿Se conecta con Idealista para traer los leads solo?",
      a: "No, no hay integración directa con los portales. Pegas el contacto —de Idealista, Fotocasa, Kyero, un correo o un WhatsApp— y se convierte en un lead prerrellenado que revisas y guardas en segundos, sin teclear nada.",
    },
    {
      q: "¿Envía los mensajes de WhatsApp por mí?",
      a: "Los redacta en el idioma del cliente y abre WhatsApp con el mensaje listo. Tú lo lees, lo ajustas y lo envías. No hay bandeja de WhatsApp dentro de la aplicación y tus conversaciones no se leen nunca.",
    },
    {
      q: "¿Está en español?",
      a: "La interfaz está en español, inglés y ruso, y cambias de idioma cuando quieras. Los mensajes que se redactan para un cliente van en el idioma de ese cliente, que muchas veces no es ninguno de los dos.",
    },
    {
      q: "¿Sirve también para alquileres?",
      a: "Todavía no. Hoy están los embudos de venta para compradores y vendedores; el alquiler de larga y corta temporada está previsto.",
    },
  ],
  related: ["crmMarbella", "guideIdealista", "guideFollowUp", "pricing"],
};
