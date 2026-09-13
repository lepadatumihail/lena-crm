import Link from "next/link";

import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES } from "@/lib/billing";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";

const LOCALE = "es";
const pricing = marketingPath("pricing", LOCALE);
const spain = marketingPath("crmSpain", LOCALE);
const idealista = marketingPath("guideIdealista", LOCALE);
const home = marketingPath("home", LOCALE);

function Body() {
  return (
    <>
      <p>
        Vender en Marbella no se parece a vender en una capital de provincia del interior. Tus
        compradores viven en otro país, la mitad de los inmuebles que enseñas son de otra
        agencia y la conversación de verdad ocurre por WhatsApp, muchas veces en un idioma que
        no es el tuyo. Esta página va de lo que eso le exige a un CRM inmobiliario y de cómo
        lo resuelve {SITE_NAME}.
      </p>

      <h2>Cómo es de verdad el mercado de Marbella</h2>
      <p>
        La demanda llega de fuera. Británicos, suecos, noruegos, daneses, alemanes, holandeses
        y belgas son los que más te vas a encontrar, y con ellos muchas otras nacionalidades.
        Casi ninguno se muda por trabajo: compran una segunda residencia. Eso condiciona todo
        lo que viene después, porque la decisión tarda meses, detrás hay una pareja o una
        familia entera, el viaje se organiza alrededor de tu día de visitas y tu primera
        respuesta se lee en un móvil, en otro huso horario.
      </p>
      <p>
        El producto es igual de variado que el comprador. Una villa en Nueva Andalucía, un
        piso en la Milla de Oro, un adosado en San Pedro, obra nueva en Benahavís o algo más
        reciente y mejor de precio hacia Estepona. El mismo cliente quiere ver tres de esas
        cosas en una tarde, y lo que dice que busca cambia después de la segunda visita.
      </p>

      <h2>Vendes para más de una agencia</h2>
      <p>
        Un agente independiente en esta costa casi nunca vende solo sus propios encargos.
        Enseñas lo que le encaja al comprador, sea de quien sea el anuncio, y compartes
        comisión con la agencia que tiene el encargo. Nombres como Norma Frank, Solvilla o
        Drumelia son el tipo de agencia que acaba en esas etiquetas: ejemplos de un ecosistema
        local muy poblado, no socios nuestros ni un aval en ninguna dirección.
      </p>
      <p>
        Por eso en {SITE_NAME} cada lead lleva la agencia por la que entró. Una sola cartera
        cubre todas las agencias con las que trabajas, la ficha del cliente nunca pierde de
        vista de quién es el inmueble que persigue y ves qué relación te está dando
        operaciones y no solo visitas.
      </p>

      <h2>Tus compradores no hablan todos el mismo idioma</h2>
      <p>
        La ficha de cliente guarda el idioma y la nacionalidad junto al presupuesto, las notas
        y la marca de caliente o frío, porque aquí esos dos campos deciden cómo escribes todo
        lo que viene detrás. Cuando toca hacer seguimiento, {SITE_NAME} redacta el WhatsApp o
        el correo en el idioma del cliente. Tú lo lees, cambias lo que quieras y lo envías: no
        sale nada sin que lo apruebes.
      </p>
      <Callout kind="tip" title="Rellena el idioma lo primero">
        <p>
          Todo lo demás lee ese campo: la primera respuesta, la confirmación de la visita y el
          aviso cuando un comprador se queda en silencio. Son treinta segundos al crear la
          ficha que te ahorran escribir en otro idioma durante toda la temporada.
        </p>
      </Callout>

      <h2>Los leads llegan por los portales</h2>
      <p>
        Idealista y Fotocasa te traen las consultas en español; Kyero, las internacionales,
        casi siempre escritas en inglés, alemán, neerlandés o alguna lengua escandinava. Caen
        en el correo, varias a la vez y mezcladas con todo lo demás, y la visita suele ser del
        primero que contesta.
      </p>
      <p>
        Pega la consulta —de un portal, de un correo o de un WhatsApp— en {SITE_NAME} y te la
        devuelve como un lead listo para guardar, con el nombre, el teléfono, el idioma y el
        presupuesto ya rellenos. A partir de ahí está en tu embudo y no en la bandeja de
        entrada. Si los portales son la mayor parte de tu día, la{" "}
        <Link href={idealista}>guía para gestionar los leads de Idealista</Link> lo explica
        paso a paso.
      </p>

      <h2>El WhatsApp es donde se cierra de verdad</h2>
      <p>
        Nadie que venga un fin de semana a ver casas se queda esperando un correo. Te escriben
        a deshoras, desde un número con prefijo extranjero. {SITE_NAME} redacta el mensaje y
        lo abre en WhatsApp, así que sale de tu número y la conversación se queda donde el
        cliente ya la tiene. Y los mensajes que mandas siempre —la confirmación, cómo llegar,
        el gracias después de la visita— guárdalos como plantillas y deja de reescribirlos.
      </p>
      <p>
        Los clientes callados son los caros. {SITE_NAME} vigila a los compradores que llevan
        semanas en silencio desde el viaje y te los saca con el mensaje ya redactado, que es
        la diferencia entre pensar en hacer seguimiento y hacerlo.
      </p>

      <h2>El día de visitas</h2>
      <p>
        El cliente aterriza el viernes, tienes el sábado por la tarde, cuatro inmuebles en
        tres municipios, y todo lo que venga después depende de lo que recuerdes de ese día.{" "}
        {SITE_NAME} lo mantiene junto:
      </p>
      <ul>
        <li>
          Agenda cada visita en un calendario mensual, recibe un aviso antes y mándale al
          cliente la confirmación por WhatsApp con un toque la noche anterior.
        </li>
        <li>
          Sincroniza el calendario con Google Calendar, para que el día aparezca donde ya
          miras.
        </li>
        <li>
          Registra con fotos cada inmueble que el comprador ha visto de verdad, y así la
          semana siguiente sabes cuál era «el de la terraza grande».
        </li>
        <li>
          Anota cada oferta frente al precio de salida y guarda el pasaporte, el NIE y el
          contrato de reserva o las arras en la misma ficha.
        </li>
        <li>
          Cuando entra un anuncio nuevo, mira a qué compradores les encaja por presupuesto,
          tipo y dormitorios, en vez de repasarlo de memoria.
        </li>
      </ul>

      <h2>Lo que no hace</h2>
      <p>
        Los alquileres todavía no están. {SITE_NAME} está construido alrededor del embudo de
        venta, así que si el alquiler de temporada o de larga duración es una parte real de
        tus ingresos, de momento seguirás llevándolo por otro lado. Tampoco hay bandeja de
        entrada de WhatsApp: los mensajes se redactan y se abren en WhatsApp, pero las
        conversaciones no entran en la aplicación y nunca se envía nada en tu nombre. Y no es
        un back office de agencia: no publica tus anuncios en los portales ni gestiona un
        equipo. Es la cartera de un agente, aislada de la de cualquier otro.
      </p>

      <h2>Cuánto cuesta y por dónde seguir</h2>
      <p>
        El plan Gratis llega hasta {FREE_CLIENT_LIMIT} clientes con todas las funciones, sin
        tarjeta y sin límite de tiempo, que da de sobra para llevar a un comprador real de
        principio a fin de un viaje de visitas antes de decidir nada. Pro cuesta{" "}
        {PRICES.standard.monthly} € al mes o {PRICES.standard.yearly} € al año, más IVA, con
        clientes ilimitados, y los primeros {FOUNDING_CAP} agentes de pago se quedan con el
        precio fundador de {PRICES.founding.monthly} € al mes mientras sigan suscritos. En la{" "}
        <Link href={pricing}>página de precios</Link> están los dos planes uno al lado del
        otro.
      </p>
      <p>
        Para la foto completa más allá de esta costa —portales, compradores extranjeros,
        comisión compartida y en qué se diferencia de las alternativas— tienes la página de{" "}
        <Link href={spain}>CRM inmobiliario para España</Link>. Y si lo que quieres es ver el
        producto, la <Link href={home}>página de inicio</Link> recorre una ficha de cliente,
        el embudo y los borradores de seguimiento. {SITE_NAME} no está hecho en una ciudad,
        pero sí para la forma de trabajar de los agentes de la Costa del Sol.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "CRM inmobiliario en Marbella y la Costa del Sol",
  description:
    "Un CRM inmobiliario para agentes de Marbella: compradores extranjeros en su idioma, inmuebles de varias agencias, WhatsApp, leads de portales y días de visitas.",
  kind: "page",
  published: "2026-09-13",
  eyebrow: "Marbella y Costa del Sol",
  heading: "Un CRM inmobiliario para agentes de Marbella y la Costa del Sol",
  lead: "Compradores extranjeros, inmuebles que compartes con otras tres agencias y un día de visitas que decide la venta. Esto es lo que un agente en Marbella necesita de un CRM, y cómo lo resuelve LeadWing.",
  Body,
  faq: [
    {
      q: "¿Puedo llevar inmuebles de varias agencias en un mismo sitio?",
      a: "Sí. Cada lead se etiqueta con la agencia por la que entró, así que una sola cartera cubre todas las agencias con las que vendes y sigues viendo cuál te da las operaciones.",
    },
    {
      q: "¿Sirve para alquileres en la Costa del Sol?",
      a: "Todavía no. LeadWing está construido alrededor del embudo de venta, para compradores y vendedores. Los alquileres de larga y corta duración están previstos, pero hoy no están en el producto.",
    },
    {
      q: "¿Tengo que conectar mi cuenta de WhatsApp?",
      a: "No. LeadWing redacta el mensaje y lo abre en WhatsApp para que lo envíes desde tu propio número. No hay bandeja de entrada de WhatsApp dentro de la aplicación y no se envía nada sin ti.",
    },
    {
      q: "¿Le escribe a un comprador sueco o alemán en su idioma?",
      a: "Sí. Indica el idioma en la ficha del cliente y los borradores de seguimiento para WhatsApp y correo se escriben en ese idioma. Tú lees y apruebas cada mensaje antes de que salga.",
    },
    {
      q: "¿Es un sistema para una agencia o para un agente?",
      a: "Para un agente. Los clientes de cada agente están completamente aislados, que es justo lo que lo hace viable cuando vendes inmuebles de varias agencias a la vez.",
    },
    {
      q: "¿Está la aplicación en español?",
      a: "Sí. La interfaz está en español y en inglés, y se instala en la pantalla de inicio del móvil como una app, que es donde transcurre casi todo un día de visitas.",
    },
  ],
  related: ["crmSpain", "guideIdealista", "pricing"],
};
