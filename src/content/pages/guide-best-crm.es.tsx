import Link from "next/link";

import { intlTag } from "@/i18n/config";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { PRICES } from "@/lib/billing";
import { marketingPath } from "@/lib/routes";
import { CHECKED, PUBLISHED } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { SOURCES as S } from "@/content/pages/crm-comparison.sources";

const L = "es";

/** El día en que se publicó la página, que sigue siendo su datePublished. */
const FIRST_PUBLISHED = PUBLISHED.guideBestCrm;

/**
 * El día en que se comprobaron por última vez todos los precios y funciones en
 * las webs de los proveedores. Es también la fecha de "Actualizado", su
 * dateModified y el lastmod del sitemap, así que la revisión trimestral
 * (plan 025) sube CHECKED, nunca PUBLISHED.
 */
const LAST_CHECKED = CHECKED.guideBestCrm ?? FIRST_PUBLISHED;

const AS_OF = new Intl.DateTimeFormat(intlTag(L), {
  dateStyle: "long",
  timeZone: "UTC",
}).format(new Date(LAST_CHECKED));

function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function Body() {
  return (
    <>
      <Callout title={`Comprobado el ${AS_OF}`}>
        <ul>
          <li>
            Los precios y las funciones salen de la propia web de cada proveedor, enlazada donde
            se usa. Los precios son sin IVA salvo donde pone “IVA incluido”.
          </li>
          <li>
            {SITE_NAME} publica esta guía. Aparece donde encaja, junto con lo que no hace.
          </li>
        </ul>
      </Callout>

      <h2>Empieza por cómo trabajas</h2>
      <p>
        La mayoría de los agentes independientes trabajan de una de estas cinco formas, a menudo
        de más de una a la vez. Cada una pide un tipo de CRM distinto.
      </p>

      <h3>1. Vendes inmuebles de otras agencias</h3>
      <p>
        Tu trabajo son los clientes: los compradores que aportas, sus visitas y ofertas, y el
        seguimiento. Los CRM de agencia giran en torno a la cartera de una agencia, y la cuenta
        suele ser de esa agencia. Lo que encaja es tu propia cartera de clientes:
      </p>
      <ul>
        <li>
          <strong>{SITE_NAME}</strong> está hecho para esto. Cada cliente lleva la etiqueta de la
          agencia por la que llegó, así que una sola cartera cubre todas las agencias para las
          que vendes. Gratis hasta {FREE_CLIENT_LIMIT} clientes; Pro cuesta{" "}
          {PRICES.standard.monthly} € al mes (
          <Link href={marketingPath("pricing", L)}>precios</Link>).
        </li>
        <li>
          <strong>Una hoja de cálculo</strong> sirve para unas cuantas decenas de clientes si la
          mantienes al día, aunque no te recordará nada ni te escribirá un mensaje. La{" "}
          <Link href={marketingPath("toolSpreadsheet", L)}>plantilla Excel gratis para tus clientes</Link>{" "}
          se importa en {SITE_NAME} si te cambias más adelante.
        </li>
        <li>
          <strong>HubSpot o Zoho CRM</strong>, gratis para 2 y 3 usuarios, si no te importa
          configurar tú mismo los inmuebles y las visitas (
          <Link href={marketingPath("guideFreeCrm", L)}>comparativa de CRM gratis</Link>).
        </li>
      </ul>
      <p>
        Un aviso: si el cliente te lo pasó una agencia, tu acuerdo con esa agencia decide si
        puedes guardar sus datos en tu propio sistema.
      </p>

      <h3>2. Captas tus propios inmuebles y quieres publicarlos en los portales</h3>
      <p>
        Entonces necesitas pasarelas a portales, una web y cruce entre compradores e inmuebles,
        que es para lo que están hechos los CRM de agencia españoles. Sus planes más baratos:
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">CRM</th>
            <th scope="col">Plan más barato</th>
            <th scope="col">Qué lo distingue</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">inmoGesco</th>
            <td>Gratis sin portales; PRO 29 €/mes con pago anual, 2 usuarios</td>
            <td>Web y MLS propias en todos los planes; su página de portales no menciona Fotocasa</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Witei</th>
            <td>50 €/mes con contactos e inmuebles</td>
            <td>Sin idealista para las cuentas abiertas desde febrero de 2022</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Sooprema</th>
            <td>39 €/mes hasta 150 inmuebles</td>
            <td>Usuarios ilimitados, más de 70 portales, prueba gratuita de 14 días</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Inmoweb</th>
            <td>36 €/mes, 1 usuario</td>
            <td>idealista, Fotocasa y habitaclia en tiempo real; su bandeja de leads, desde 59 €</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Mobilia</th>
            <td>49 €/mes, 1 usuario</td>
            <td>WhatsApp con la API oficial de Meta</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Vesta CRM</th>
            <td>44,90 €/mes, 2 usuarios</td>
            <td>Web incluida; un número de WhatsApp en su bandeja de entrada, 8,90 €/mes</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Inmovilla</th>
            <td>79 €/mes, hasta 7 usuarios</td>
            <td>idealista, Fotocasa y pisos.com en tiempo real; web incluida</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">InmoProCRM</th>
            <td>Gratis hasta 20 inmuebles; 39 €/mes, IVA incluido</td>
            <td>Unos 40 portales; WhatsApp vinculado con código QR</td>
          </tr>
        </tbody>
      </table>
      <p>
        De la web de cada proveedor: <Source href={S.inmogescoPrices}>inmoGesco</Source>,{" "}
        <Source href={S.witeiPrices}>Witei</Source> (e{" "}
        <Source href={S.witeiIdealista}>idealista</Source>),{" "}
        <Source href={S.sooprema}>Sooprema</Source>,{" "}
        <Source href={S.inmowebPrices}>Inmoweb</Source>,{" "}
        <Source href={S.mobiliaPrices}>Mobilia</Source>,{" "}
        <Source href={S.vestaPrices}>Vesta CRM</Source>,{" "}
        <Source href={S.inmovillaPrices}>Inmovilla</Source>,{" "}
        <Source href={S.inmoprocrm}>InmoProCRM</Source>. Si tus compradores te encuentran en
        idealista, comprueba la pasarela antes que nada.
      </p>

      <h3>3. Trabajas con los inmuebles compartidos de la Costa del Sol</h3>
      <p>
        En la costa, las agencias comparten inmuebles a través de redes, y el CRM viene con la
        red:
      </p>
      <ul>
        <li>
          <strong>Resales Online:</strong> 190 € al mes para 4 usuarios (
          <Source href={S.resalesFees}>cuotas</Source>), con 2.149 agencias activas según su
          página de inicio el {AS_OF} (<Source href={S.resalesHome}>Resales Online</Source>).
          Cuando reservas una visita a un inmueble de otro agente, ese agente solo ve el apellido
          de tu cliente y los cuatro últimos dígitos de su teléfono (
          <Source href={S.resalesViewings}>visitas</Source>). Pide un correo corporativo con tu
          propio dominio (<Source href={S.resalesLicence}>licencia</Source>).
        </li>
        <li>
          <strong>PropertyList:</strong> su MLS y el CRM básico son gratis; pasar un comprador al
          embudo de compradores cuesta un crédito después de los cinco primeros, de 0,80 € a 1 €
          por crédito. Más de 1.040 agencias (
          <Source href={S.propertylistFree}>PropertyList</Source>).
        </li>
      </ul>

      <h3>4. La mayoría de tus conversaciones pasan por WhatsApp</h3>
      <p>
        “Integración con WhatsApp” puede querer decir tres cosas distintas, así que pregunta cuál
        te ofrecen:
      </p>
      <ul>
        <li>
          <strong>Un botón que abre el chat.</strong> El CRM abre WhatsApp con el número del
          cliente, a veces con un mensaje ya preparado, y la conversación se queda en WhatsApp.
          Así funcionan Witei, Inmoweb, Resales Online, inmoGesco y Fincta (
          <Source href={S.witeiWhatsapp}>Witei</Source>,{" "}
          <Source href={S.inmowebWhatsapp}>Inmoweb</Source>,{" "}
          <Source href={S.resalesWhatsapp}>Resales</Source>). También {SITE_NAME}, que primero
          redacta el mensaje en el idioma de tu cliente.
        </li>
        <li>
          <strong>Tu número vinculado con un código QR</strong>, igual que en WhatsApp Web:
          InmoProCRM y la bandeja de entrada de pago de Inmovilla. Los mensajes llegan al CRM,
          pero la propia guía de Inmovilla avisa de que WhatsApp puede bloquear un número si
          detecta un uso indebido (<Source href={S.inmovillaFaqWhatsapp}>Inmovilla</Source>,{" "}
          <Source href={S.inmoprocrmWhatsapp}>InmoProCRM</Source>).
        </li>
        <li>
          <strong>La plataforma oficial de WhatsApp Business de Meta:</strong> Mobilia;
          Clientify, con las tarifas por mensaje de Meta aparte; HubSpot desde sus planes
          Professional; y Zoho CRM en los planes de pago, con créditos de mensajes (
          <Source href={S.mobiliaWhatsapp}>Mobilia</Source>,{" "}
          <Source href={S.clientifyPrices}>Clientify</Source>,{" "}
          <Source href={S.hubspotWhatsapp}>HubSpot</Source>,{" "}
          <Source href={S.zohoFeatures}>Zoho</Source>).
        </li>
      </ul>

      <h3>5. Tus clientes no hablan español</h3>
      <p>
        Son dos cosas distintas: el idioma de las pantallas del CRM y el idioma de lo que envías.
      </p>
      <ul>
        <li>
          <strong>Pantallas:</strong> el panel de Resales Online está en 13 idiomas, ruso
          incluido (<Source href={S.resalesLanguages}>Resales</Source>); Zoho CRM está en 28 y
          Pipedrive en 24, los dos con ruso (<Source href={S.zohoPricing}>Zoho</Source>,{" "}
          <Source href={S.pipedrivePricing}>Pipedrive</Source>). Inmovilla está en español,
          inglés y portugués (<Source href={S.inmovillaFaqLanguages}>Inmovilla</Source>); Inmoweb
          y Fincta, en español e inglés (<Source href={S.inmowebLanguages}>Inmoweb</Source>,{" "}
          <Source href={S.finctaPrices}>Fincta</Source>); y HubSpot no está en ruso (
          <Source href={S.hubspotLanguages}>HubSpot</Source>). {SITE_NAME} está en inglés,
          español y ruso.
        </li>
        <li>
          <strong>Mensajes:</strong> {SITE_NAME} redacta cada seguimiento en el idioma del propio
          cliente. AI Translate, de Resales Online, completa las descripciones de los inmuebles en
          los idiomas que faltan (<Source href={S.resalesAiTranslate}>Resales</Source>), y
          Sooprema escribe descripciones con IA en 14 idiomas (
          <Source href={S.sooprema}>Sooprema</Source>).
        </li>
      </ul>

      <h2>Lo que paga un solo agente</h2>
      <p>
        La forma más barata de empezar para un solo agente, según la página de precios de cada
        proveedor, enlazada más arriba o en las fuentes. Los precios son sin IVA salvo que se
        indique lo contrario.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">CRM</th>
            <th scope="col">Plan gratuito</th>
            <th scope="col">Plan de pago más barato</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">Clientify</th>
            <td>No; una prueba gratuita de 7 días</td>
            <td>39 €/mes con pago anual, 1 usuario</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Fincta</th>
            <td>Todo hasta el 1 de febrero de 2027; después, 12 clientes</td>
            <td>49 €/mes, hasta 6 agentes</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">HubSpot</th>
            <td>2 usuarios, 1.000 contactos</td>
            <td>Desde 7 €/mes por usuario con pago anual, para clientes nuevos</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">inmoGesco</th>
            <td>Clientes e inmuebles ilimitados, 1 usuario, sin portales</td>
            <td>29 €/mes con pago anual, 2 usuarios</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">InmoProCRM</th>
            <td>20 inmuebles, 1 usuario</td>
            <td>39 €/mes, IVA incluido</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Inmovilla</th>
            <td>No; una prueba gratuita de 15 días</td>
            <td>79 €/mes, hasta 7 usuarios</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Inmoweb</th>
            <td>No; una demo</td>
            <td>36 €/mes, 1 usuario</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">{SITE_NAME}</th>
            <td>{FREE_CLIENT_LIMIT} clientes, todas las funciones</td>
            <td>{PRICES.standard.monthly} €/mes, clientes ilimitados</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Mobilia</th>
            <td>No; una demo</td>
            <td>49 €/mes, 1 usuario</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Pipedrive</th>
            <td>No; una prueba gratuita de 14 días</td>
            <td>14 €/mes por usuario con pago anual</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">PropertyList</th>
            <td>Su MLS y el CRM básico</td>
            <td>Créditos de 0,80 € a 1 € cada uno</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Resales Online</th>
            <td>CRM Standalone, que hoy no se factura</td>
            <td>190 €/mes, 4 usuarios</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Sooprema</th>
            <td>No; una prueba gratuita de 14 días</td>
            <td>39 €/mes hasta 150 inmuebles</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Vesta CRM</th>
            <td>No; una prueba gratuita</td>
            <td>44,90 €/mes, 2 usuarios</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Witei</th>
            <td>250 contactos, 10 inmuebles, 1 usuario</td>
            <td>25 €/mes por módulo</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Zoho CRM</th>
            <td>3 usuarios, 5.000 registros</td>
            <td>14 €/mes por usuario con pago anual</td>
          </tr>
        </tbody>
      </table>

      <h2>Qué preguntar antes de pasar tus clientes a un CRM</h2>
      <ol>
        <li>¿Gira en torno a la cartera de una agencia, a la de una red o a tus propios clientes?</li>
        <li>¿En qué portales publica, idealista incluido, y desde qué plan?</li>
        <li>
          ¿Cómo entran las consultas de los portales: con correos reenviados, con una conexión
          directa o a mano?
        </li>
        <li>
          ¿Cómo se conecta con WhatsApp: con un botón, con una sesión vinculada por QR o con la API
          oficial?
        </li>
        <li>¿Cuánto paga un agente con IVA, y hay permanencia mínima?</li>
        <li>
          ¿Puedes exportarlo todo tú mismo, en qué formato, y qué pasa con tus datos cuando te
          vas?
        </li>
      </ol>

      <h2>Dónde encaja {SITE_NAME} y dónde no</h2>
      <p>
        {SITE_NAME} es para el primer caso: un agente independiente que vende para varias
        agencias y necesita un solo sitio para sus propios compradores, vendedores, visitas,
        ofertas y seguimientos. Pegas una consulta de un portal y te rellena la ficha del
        cliente, te redacta cada seguimiento en el idioma del cliente para que lo envíes desde
        WhatsApp, y funciona en inglés, español o ruso.
      </p>
      <p>
        No publica inmuebles en los portales, no incluye una web, no comparte una MLS ni gestiona
        un equipo, y por ahora trabaja con ventas, no con alquileres. Si necesitas algo de eso, te
        servirá mejor uno de los CRM de arriba. El plan Gratis cubre hasta {FREE_CLIENT_LIMIT}{" "}
        clientes con todas las funciones; Pro cuesta {PRICES.standard.monthly} € al mes más IVA (
        <Link href={marketingPath("pricing", L)}>precios</Link>).
      </p>

      <h2>Fuentes</h2>
      <p>La web, el centro de ayuda o las condiciones de cada proveedor, comprobados el {AS_OF}.</p>
      <ul>
        <li>
          CRM de agencia: <Source href={S.inmogescoPrices}>inmoGesco</Source>,{" "}
          <Source href={S.witeiPrices}>Witei</Source>,{" "}
          <Source href={S.sooprema}>Sooprema</Source>,{" "}
          <Source href={S.inmowebPrices}>Inmoweb</Source>,{" "}
          <Source href={S.mobiliaPrices}>Mobilia</Source>,{" "}
          <Source href={S.vestaPrices}>Vesta CRM</Source>,{" "}
          <Source href={S.inmovillaPrices}>Inmovilla</Source>,{" "}
          <Source href={S.inmoprocrm}>InmoProCRM</Source>,{" "}
          <Source href={S.finctaPrices}>Fincta</Source>.
        </li>
        <li>
          Redes: Resales Online (<Source href={S.resalesFees}>cuotas</Source>,{" "}
          <Source href={S.resalesStandalone}>Standalone</Source>,{" "}
          <Source href={S.resalesViewings}>visitas</Source>,{" "}
          <Source href={S.resalesLicence}>licencia</Source>), PropertyList (
          <Source href={S.propertylistFree}>plan gratuito</Source>,{" "}
          <Source href={S.propertylistPrices}>precios</Source>).
        </li>
        <li>
          CRM generalistas: <Source href={S.hubspotCrm}>HubSpot</Source> (
          <Source href={S.hubspotStarter}>Starter</Source>), <Source href={S.zohoFree}>Zoho CRM</Source>{" "}
          (<Source href={S.zohoPricing}>precios</Source>),{" "}
          <Source href={S.pipedrivePricing}>Pipedrive</Source>,{" "}
          <Source href={S.clientifyPrices}>Clientify</Source>.
        </li>
      </ul>
      <p>
        ¿Comparas planes gratuitos? Mira{" "}
        <Link href={marketingPath("guideFreeCrm", L)}>qué incluye cada CRM inmobiliario gratis</Link>
        . ¿Dejas Witei o Inmovilla? Mira{" "}
        <Link href={marketingPath("guideCrmAlternatives", L)}>las alternativas y cómo cambiarte</Link>
        .
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Mejor CRM inmobiliario para agentes independientes (2026)",
  description:
    "Cuál es el mejor CRM inmobiliario si eres agente independiente en España: varias agencias, cartera propia, la MLS de la Costa del Sol o WhatsApp, con precios.",
  kind: "article",
  published: FIRST_PUBLISHED,
  modified: LAST_CHECKED,
  eyebrow: "Guía · CRM",
  heading: "El mejor CRM para un agente inmobiliario independiente depende de qué cartera vendes",
  lead: `Ningún CRM es el mejor para todos los agentes independientes en España: depende de qué cartera vendes y de dónde vienen tus clientes. Si vendes inmuebles de otras agencias, necesitas tu propia cartera de clientes en lugar de un programa de gestión de inmuebles: ${SITE_NAME}, una hoja de cálculo o un CRM generalista gratuito. Si captas tus propios inmuebles, necesitas pasarelas a portales y una web: inmoGesco, Witei, Inmovilla, Sooprema, Inmoweb o Mobilia. Para los inmuebles compartidos de la Costa del Sol, Resales Online o PropertyList.`,
  Body,
  faq: [
    {
      q: "¿Cuál es el mejor CRM inmobiliario en España?",
      a: `Depende de cómo trabajes. Los agentes que venden inmuebles de otras agencias necesitan su propia cartera de clientes (${SITE_NAME}, una hoja de cálculo o un CRM generalista gratuito). Los que captan sus propios inmuebles necesitan pasarelas a portales y una web (inmoGesco, Witei, Inmovilla, Sooprema, Inmoweb, Mobilia). En la Costa del Sol, Resales Online y PropertyList vienen con una red de inmuebles compartidos.`,
    },
    {
      q: "¿Qué CRM me sirve si vendo para varias agencias?",
      a: `Uno que guarde tus clientes en lugar de la cartera de una agencia. ${SITE_NAME} etiqueta cada cliente con la agencia por la que llegó, así que una sola cartera las cubre todas; los CRM de agencia giran en torno a los inmuebles de una sola agencia, y la cuenta suele ser de esa agencia.`,
    },
    {
      q: "¿Qué CRM inmobiliarios publican en idealista?",
      a: `Inmovilla e Inmoweb publican en idealista en tiempo real, y Sooprema, Mobilia, Vesta, InmoProCRM y los planes de pago de inmoGesco lo incluyen entre sus portales. Witei no puede activar pasarelas nuevas a idealista desde febrero de 2022. Fincta y ${SITE_NAME} no publican inmuebles.`,
    },
    {
      q: "¿Qué CRM inmobiliario usa la API oficial de WhatsApp?",
      a: "Mobilia se conecta con la API oficial de WhatsApp Business de Meta, igual que Clientify, los planes Professional de HubSpot y los planes de pago de Zoho CRM. InmoProCRM y la bandeja de WhatsApp de Inmovilla, en cambio, vinculan tu número con un código QR, como hace WhatsApp Web.",
    },
    {
      q: "¿Basta con una hoja de cálculo para un agente independiente?",
      a: "Para unas cuantas decenas de clientes, sí, si la actualizas después de cada llamada y cada visita. No te recordará a quién tienes que hacer seguimiento ni te redactará el mensaje, que es cuando un CRM empieza a amortizarse.",
    },
  ],
  related: ["guideFreeCrm", "guideCrmAlternatives", "crmSpain"],
  topic: { "@type": "Thing", name: "Software CRM inmobiliario en España" },
};
