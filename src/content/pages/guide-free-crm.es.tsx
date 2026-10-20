import Link from "next/link";

import { intlTag } from "@/i18n/config";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES } from "@/lib/billing";
import { marketingPath } from "@/lib/routes";
import { CHECKED, PUBLISHED } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { SOURCES as S } from "@/content/pages/crm-comparison.sources";

const L = "es";

/** El día en que se publicó la página, que sigue siendo su datePublished. */
const FIRST_PUBLISHED = PUBLISHED.guideFreeCrm;

/**
 * El día en que se comprobó por última vez cada plan y cada límite en la web
 * de su proveedor. Es también la fecha de "Actualizado", su dateModified y el
 * lastmod del sitemap, así que la revisión trimestral (plan 025) sube CHECKED,
 * nunca PUBLISHED.
 */
const LAST_CHECKED = CHECKED.guideFreeCrm ?? FIRST_PUBLISHED;

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
            En esta guía, “gratis” quiere decir cuatro cosas distintas: un plan sin fecha de fin,
            una base gratuita con extras de pago, una promoción con fecha de fin y una prueba
            gratuita.
          </li>
          <li>
            Cada límite y cada precio sale de la web del propio proveedor, enlazada allí donde se
            cita. Los precios no incluyen IVA salvo que se indique “IVA incluido”.
          </li>
          <li>{SITE_NAME} publica esta guía y es uno de los CRM que aparecen en ella.</li>
        </ul>
      </Callout>

      <h2>Comparativa de planes gratuitos</h2>
      <p>
        Primero van los CRM hechos para agentes inmobiliarios en España y después dos CRM de
        ventas generalistas. La última columna es la forma más barata de pagar cuando el plan
        gratuito se te queda pequeño.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">CRM</th>
            <th scope="col">Plan gratuito</th>
            <th scope="col">Cuando se te queda pequeño</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">inmoGesco</th>
            <td>
              Sin fecha de fin: clientes e inmuebles ilimitados, 1 usuario y una web en un
              subdominio. Sin publicación en portales.
            </td>
            <td>PRO: 29 €/mes con pago anual o 35 €/mes con pago mensual, para 2 usuarios</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Witei</th>
            <td>
              Sin fecha de fin: 250 contactos, 10 inmuebles y 1 usuario. Sin pasarelas a portales,
              bandeja de leads ni web.
            </td>
            <td>25 €/mes por módulo; contactos e inmuebles juntos, 50 €</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">InmoProCRM</th>
            <td>
              Sin fecha de fin: 20 inmuebles, contactos ilimitados, 1 usuario y todas las
              funciones
            </td>
            <td>Premium: 39 €/mes, IVA incluido, para 200 inmuebles</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">PropertyList</th>
            <td>
              Sin fecha de fin para su MLS, su CRM básico, sus anuncios y su microsite; cada
              comprador que pasas al pipeline de compradores cuesta 1 crédito pasados los 5
              primeros
            </td>
            <td>Créditos de 0,80 € a 1 € cada uno</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">{SITE_NAME}</th>
            <td>
              Sin fecha de fin: {FREE_CLIENT_LIMIT} clientes, compradores y vendedores juntos,
              todas las funciones y 1 agente
            </td>
            <td>Pro: {PRICES.standard.monthly} €/mes, clientes ilimitados</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Fincta</th>
            <td>
              Todo hasta el 1 de febrero de 2027; después, 1 agente, 12 clientes y 7 inmuebles
            </td>
            <td>Agencia S: 49 €/mes, hasta 6 agentes</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">HubSpot</th>
            <td>Sin fecha de fin: 2 usuarios y 1.000 contactos, como CRM de ventas generalista</td>
            <td>Starter: desde 7 €/mes por usuario con pago anual, oferta para clientes nuevos</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Zoho CRM</th>
            <td>Sin fecha de fin: 3 usuarios y 5.000 registros, como CRM de ventas generalista</td>
            <td>Estándar: 14 €/mes por usuario con pago anual</td>
          </tr>
        </tbody>
      </table>

      <h2>Cada plan gratuito, en detalle</h2>

      <h3>inmoGesco</h3>
      <ul>
        <li>
          <strong>Qué es gratis:</strong> clientes e inmuebles sin límite, para un usuario y una
          oficina, con una web en un subdominio, la MLS propia de inmoGesco, cruces y alertas por
          correo a los compradores (<Source href={S.inmogescoPrices}>precios de inmoGesco</Source>
          ).
        </li>
        <li>
          <strong>Qué no es gratis:</strong> publicar en portales. Puedes probarlo 30 días si lo
          pides; después hace falta PRO o PREMIUM (
          <Source href={S.inmogescoPortals}>portales</Source>).
        </li>
        <li>
          <strong>La pega:</strong> una cuenta sin actividad durante 6 meses se desactiva.
        </li>
        <li>
          <strong>De pago:</strong> PRO cuesta 29 € al mes con pago anual o 35 € con pago mensual,
          para 2 usuarios, más 5 € por cada usuario extra; PREMIUM, 39 € o 47 €, para 7 usuarios.
        </li>
      </ul>

      <h3>Witei</h3>
      <ul>
        <li>
          <strong>Qué es gratis:</strong> 250 contactos, 10 inmuebles y un usuario, sin límite de
          tiempo, con cruce de contactos e inmuebles (
          <Source href={S.witeiPrices}>precios de Witei</Source>).
        </li>
        <li>
          <strong>Qué no es gratis:</strong> las pasarelas a portales, SmartInbox (que convierte
          en contactos los correos de los portales), los emails, Google Calendar y la web.
        </li>
        <li>
          <strong>La pega:</strong> las cuentas que solo tienen planes gratuitos pueden cerrarse
          por inactividad sin previo aviso, y para abrir una hay que pasar por una solicitud que
          revisa el equipo de Witei (<Source href={S.witeiHome}>Witei</Source>).
        </li>
        <li>
          <strong>De pago:</strong> cada módulo cuesta 25 €, 45 € o 65 € al mes. El módulo de
          contactos Normal cubre 5.000 contactos y 10 usuarios, y el de inmuebles Normal, 1.000
          inmuebles y 10 pasarelas a portales. Witei no puede publicar en idealista en las cuentas
          abiertas desde febrero de 2022 (<Source href={S.witeiIdealista}>ayuda de Witei</Source>
          ).
        </li>
      </ul>

      <h3>InmoProCRM</h3>
      <ul>
        <li>
          <strong>Qué es gratis:</strong> 20 inmuebles, contactos ilimitados, un usuario y una
          oficina, con todas las funciones, IA incluida; sin tarjeta (
          <Source href={S.inmoprocrm}>InmoProCRM</Source>).
        </li>
        <li>
          <strong>La pega:</strong> con más de 20 inmuebles pasas a un plan de pago. Su web es de
          mediados de 2026 y no explica cómo exportar tus datos.
        </li>
        <li>
          <strong>De pago:</strong> 39 € al mes para 200 inmuebles y 5 usuarios, 69 € para 500 y
          159 € sin límite, IVA incluido, por agencia.
        </li>
        <li>
          <strong>WhatsApp:</strong> se vincula con un código QR como un dispositivo más, igual
          que WhatsApp Web, y no a través de la API oficial (
          <Source href={S.inmoprocrmWhatsapp}>WhatsApp</Source>).
        </li>
      </ul>

      <h3>PropertyList</h3>
      <ul>
        <li>
          <strong>Qué es gratis:</strong> su MLS, la base del CRM, los anuncios en su portal y un
          microsite, sin tarjeta y sin contrato (
          <Source href={S.propertylistFree}>PropertyList</Source>).
        </li>
        <li>
          <strong>Qué no es gratis:</strong> como dice la propia PropertyList, el CRM no es 100%
          gratis. Pasar un comprador cualificado al pipeline de compradores cuesta 1 crédito
          pasados los 5 primeros (<Source href={S.propertylistPipelines}>pipelines</Source>), las
          fotos que pasen de 25 por anuncio cuestan un crédito cada una y el creador de webs
          cuesta 50 créditos al mes.
        </li>
        <li>
          <strong>De pago:</strong> créditos en paquetes, desde 20 € por 20 hasta 800 € por 1.000,
          más IVA, y no caducan (
          <Source href={S.propertylistPrices}>precios de PropertyList</Source>).
        </li>
        <li>
          <strong>A tener en cuenta:</strong> más de 1.040 agencias, sobre todo en la Costa del
          Sol. Tus anuncios se exportan en XML; en sus páginas no consta cómo exportar tus
          contactos.
        </li>
      </ul>

      <h3>{SITE_NAME}</h3>
      <ul>
        <li>
          <strong>Qué es gratis:</strong> {FREE_CLIENT_LIMIT} clientes, compradores y vendedores
          juntos, con todas las funciones, sin tarjeta y sin límite de tiempo.
        </li>
        <li>
          <strong>Al llegar al límite:</strong> no puedes añadir otro cliente, y no se borra nada.
        </li>
        <li>
          <strong>De pago:</strong> Pro cuesta {PRICES.standard.monthly} € al mes o{" "}
          {PRICES.standard.yearly} € al año con clientes ilimitados, y los primeros{" "}
          {FOUNDING_CAP} agentes de pago se quedan en {PRICES.founding.monthly} € al mes de por
          vida (<Link href={marketingPath("pricing", L)}>precios</Link>).
        </li>
        <li>
          <strong>Lo que no hace en ningún plan:</strong> publicar anuncios, gestionar una web ni
          compartir una MLS. Las consultas de los portales se añaden pegándolas.
        </li>
      </ul>

      <h3>Fincta</h3>
      <ul>
        <li>
          <strong>Gratis por ahora:</strong> todo está desbloqueado hasta el 1 de febrero de 2027,
          sin tarjeta, y durante la promoción no se pueden contratar planes de pago (
          <Source href={S.finctaPrices}>precios de Fincta</Source>).
        </li>
        <li>
          <strong>Después:</strong> un plan gratuito permanente con 1 agente, 12 clientes y 7
          inmuebles. Las condiciones de Fincta dicen que ninguna cuenta se bloquea ni pierde sus
          datos por no pagar (<Source href={S.finctaTerms}>condiciones</Source>), y la propia
          Fincta advierte de que darte de alta ahora no hace que el plan ilimitado sea gratis para
          siempre (<Source href={S.finctaFree}>Fincta</Source>).
        </li>
        <li>
          <strong>De pago:</strong> planes de agencia a 49 € al mes para hasta 6 agentes, 89 € para
          12 y 149 € sin límite de agentes.
        </li>
        <li>
          <strong>Lo que no hace:</strong> publicar en portales, como dice su propia tabla
          comparativa (<Source href={S.finctaCompare}>comparativa</Source>).
        </li>
      </ul>

      <h2>CRM generalistas gratis: HubSpot y Zoho</h2>
      <p>
        Los dos son gratis para siempre, pero son CRM de ventas generalistas: no publican en
        portales, no traen fichas de inmuebles listas para usar y WhatsApp solo está en los planes
        de pago.
      </p>

      <h3>HubSpot</h3>
      <ul>
        <li>
          <strong>Qué es gratis:</strong> hasta 2 usuarios y 1.000 contactos, sin tarjeta y sin
          fecha de fin (<Source href={S.hubspotCrm}>HubSpot CRM</Source>), además de la app móvil
          (<Source href={S.hubspotFreeTools}>herramientas gratuitas</Source>).
        </li>
        <li>
          <strong>Desfasado en otras fuentes:</strong> las respuestas que prometen hasta un millón
          de contactos describen el plan de antes de que HubSpot lo recortara a 1.000 en otoño de
          2024 (<Source href={S.hubspotCrm2024}>HubSpot, septiembre de 2024</Source>).
        </li>
        <li>
          <strong>Límites:</strong> 10 propiedades personalizadas, un pipeline por objeto y la
          marca de HubSpot en los correos y formularios (
          <Source href={S.hubspotFreeTools}>herramientas gratuitas</Source>). HubSpot tiene un
          objeto Listings para inmuebles, que tiene que activar un superadministrador (
          <Source href={S.hubspotListings}>objetos</Source>).
        </li>
        <li>
          <strong>WhatsApp e idioma:</strong> la bandeja de entrada de WhatsApp solo viene con
          Marketing Hub o Service Hub Professional (
          <Source href={S.hubspotWhatsapp}>WhatsApp</Source>). La interfaz está en español, inglés
          y otros 15 idiomas, pero no en ruso (<Source href={S.hubspotLanguages}>idiomas</Source>
          ).
        </li>
        <li>
          <strong>De pago:</strong> Starter desde 7 € al mes por usuario con pago anual o 10 € con
          pago mensual, una oferta para clientes nuevos frente a un precio de tarifa de 20 € (
          <Source href={S.hubspotStarter}>Starter</Source>).
        </li>
      </ul>

      <h3>Zoho CRM</h3>
      <ul>
        <li>
          <strong>Qué es gratis:</strong> hasta 3 usuarios y 5.000 registros, para siempre y sin
          tarjeta (<Source href={S.zohoFree}>CRM gratuito de Zoho</Source>).
        </li>
        <li>
          <strong>Límites:</strong> sin campos ni módulos personalizados, así que no hay módulo de
          inmuebles; un solo pipeline; sin correo masivo y sin WhatsApp (
          <Source href={S.zohoFeatures}>lista de funciones</Source>).
        </li>
        <li>
          <strong>De pago:</strong> Estándar cuesta 14 € al mes por usuario con pago anual o 20 €
          con pago mensual. La interfaz está en 28 idiomas, entre ellos el español y el ruso (
          <Source href={S.zohoPricing}>precios de Zoho</Source>).
        </li>
      </ul>

      <h2>Sin plan gratuito: pruebas y demos</h2>
      <ul>
        <li>
          <strong>Inmovilla:</strong> una prueba gratuita de 15 días con un usuario de prueba y una
          selección de funciones; Full Edition cuesta 79 € al mes o 790 € al año para hasta 7
          usuarios (<Source href={S.inmovillaPrices}>precios de Inmovilla</Source>).
        </li>
        <li>
          <strong>Sooprema:</strong> una prueba gratuita de 14 días con todas las funciones y sin
          tarjeta; desde 39 € al mes para 150 inmuebles (
          <Source href={S.soopremaTrial}>Sooprema</Source>).
        </li>
        <li>
          <strong>Vesta CRM:</strong> una prueba gratuita y garantía de devolución del dinero el
          primer mes; desde 44,90 € al mes para 2 usuarios (
          <Source href={S.vestaPrices}>precios de Vesta</Source>).
        </li>
        <li>
          <strong>Mobilia e Inmoweb:</strong> reservas una demo. Mobilia cuesta 49 € al mes con un
          usuario (<Source href={S.mobiliaPrices}>precios de Mobilia</Source>), e Inmoweb, desde
          36 € al mes para un usuario (<Source href={S.inmowebPrices}>precios de Inmoweb</Source>
          ).
        </li>
        <li>
          <strong>Clientify:</strong> una prueba gratuita de 7 días y después 39 € al mes con pago
          anual o 65 € con pago mensual para un usuario (
          <Source href={S.clientifyPrices}>precios de Clientify</Source>). La propia Clientify
          dice que no gestiona inmuebles, ni publica en portales ni tiene una MLS (
          <Source href={S.clientifyRealEstate}>Clientify</Source>).
        </li>
        <li>
          <strong>Pipedrive:</strong> una prueba gratuita de 14 días y después desde 14 € al mes
          por usuario con pago anual o 24 € con pago mensual (
          <Source href={S.pipedrivePricing}>precios de Pipedrive</Source>).
        </li>
        <li>
          <strong>Resales Online:</strong> su versión Standalone, un CRM sin la red de inmuebles
          compartidos, hoy no se factura (<Source href={S.resalesStandalone}>Standalone</Source>),
          pero su página de precios solo vende paquetes de pago, desde 190 € al mes para 4
          usuarios (<Source href={S.resalesPricing}>precios de Resales</Source>). Pregunta a
          Resales cómo abrir una cuenta Standalone.
        </li>
      </ul>

      <h2>Antes de meter a tus clientes en un plan gratuito</h2>
      <ol>
        <li>
          Dónde está el límite —en clientes, inmuebles, usuarios o créditos— y qué pasa cuando
          llegas a él.
        </li>
        <li>Si es gratis para siempre o hasta una fecha, como Fincta hasta el 1 de febrero de 2027.</li>
        <li>
          Si cierran las cuentas sin actividad: inmoGesco lo hace a los 6 meses, y Witei puede
          hacerlo con las cuentas gratuitas.
        </li>
        <li>Si puedes exportar tus clientes tú mismo, y en qué formato.</li>
        <li>
          De quién es la cuenta: si la abre una agencia, la agencia controla los clientes que hay
          en ella.
        </li>
        <li>Si incluye publicar en los portales que usas, sobre todo en idealista, y en qué plan.</li>
      </ol>

      <h2>Dónde encaja {SITE_NAME}</h2>
      <p>
        {SITE_NAME} es un CRM para los clientes propios de un agente, pensado para agentes que
        venden para varias agencias. Etiquetas cada cliente con la agencia por la que llegó, pegas
        la consulta de un portal para rellenar la ficha del cliente y recibes los seguimientos
        redactados en el idioma de tu cliente para enviarlos desde WhatsApp. El plan Gratis cubre{" "}
        {FREE_CLIENT_LIMIT} clientes con todas las funciones; Pro cuesta{" "}
        {PRICES.standard.monthly} € al mes más IVA (
        <Link href={marketingPath("pricing", L)}>precios</Link>).
      </p>
      <p>
        Si captas inmuebles y necesitas publicarlos en los portales, no es la herramienta
        adecuada: elige uno de los CRM de agencia de arriba. Y si todavía no es momento de un CRM,
        la{" "}
        <Link href={marketingPath("toolSpreadsheet", L)}>
          hoja de cálculo gratuita para llevar tus clientes
        </Link>{" "}
        se importa a {SITE_NAME} cuando lo sea.
      </p>

      <h2>Fuentes</h2>
      <p>La web, el centro de ayuda o las condiciones de cada proveedor, comprobados el {AS_OF}.</p>
      <ul>
        <li>
          inmoGesco: <Source href={S.inmogescoPrices}>precios</Source>,{" "}
          <Source href={S.inmogescoPortals}>portales</Source>. Witei:{" "}
          <Source href={S.witeiPrices}>precios</Source>, <Source href={S.witeiHome}>alta</Source>,{" "}
          <Source href={S.witeiIdealista}>idealista</Source>. InmoProCRM:{" "}
          <Source href={S.inmoprocrm}>planes</Source>,{" "}
          <Source href={S.inmoprocrmWhatsapp}>WhatsApp</Source>.
        </li>
        <li>
          PropertyList: <Source href={S.propertylistFree}>plan gratuito</Source>,{" "}
          <Source href={S.propertylistPipelines}>pipelines</Source>,{" "}
          <Source href={S.propertylistPrices}>precios</Source>. Fincta:{" "}
          <Source href={S.finctaPrices}>precios</Source>,{" "}
          <Source href={S.finctaTerms}>condiciones</Source>,{" "}
          <Source href={S.finctaFree}>página del CRM gratis</Source>,{" "}
          <Source href={S.finctaCompare}>comparativa</Source>.
        </li>
        <li>
          HubSpot: <Source href={S.hubspotCrm}>CRM</Source>,{" "}
          <Source href={S.hubspotFreeTools}>herramientas gratuitas</Source>,{" "}
          <Source href={S.hubspotLimits}>límites</Source>,{" "}
          <Source href={S.hubspotStarter}>Starter</Source>,{" "}
          <Source href={S.hubspotWhatsapp}>WhatsApp</Source>,{" "}
          <Source href={S.hubspotLanguages}>idiomas</Source>,{" "}
          <Source href={S.hubspotListings}>objetos</Source>,{" "}
          <Source href={S.hubspotCrm2024}>la página de 2024</Source>. Zoho:{" "}
          <Source href={S.zohoFree}>CRM gratuito</Source>,{" "}
          <Source href={S.zohoFeatures}>lista de funciones</Source>,{" "}
          <Source href={S.zohoPricing}>precios</Source>.
        </li>
        <li>
          <Source href={S.inmovillaPrices}>Inmovilla</Source>,{" "}
          <Source href={S.soopremaTrial}>Sooprema</Source>,{" "}
          <Source href={S.vestaPrices}>Vesta CRM</Source>,{" "}
          <Source href={S.mobiliaPrices}>Mobilia</Source>,{" "}
          <Source href={S.inmowebPrices}>Inmoweb</Source>,{" "}
          <Source href={S.clientifyPrices}>Clientify</Source> (y{" "}
          <Source href={S.clientifyRealEstate}>su artículo sobre inmobiliarias</Source>),{" "}
          <Source href={S.pipedrivePricing}>Pipedrive</Source> y Resales Online (
          <Source href={S.resalesStandalone}>Standalone</Source>,{" "}
          <Source href={S.resalesPricing}>precios</Source>).
        </li>
      </ul>
      <p>
        ¿También estás comparando CRM de pago? Mira{" "}
        <Link href={marketingPath("guideBestCrm", L)}>
          qué CRM encaja con tu forma de trabajar
        </Link>{" "}
        y{" "}
        <Link href={marketingPath("guideCrmAlternatives", L)}>
          las alternativas a Witei e Inmovilla
        </Link>
        .
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "CRM inmobiliario gratis: qué incluye cada plan (2026)",
  description:
    "Qué CRM inmobiliario gratis hay en España, cuántos clientes, inmuebles y usuarios admite cada plan, qué se paga aparte y cuándo empiezas a pagar. Con fuentes.",
  kind: "article",
  published: FIRST_PUBLISHED,
  modified: LAST_CHECKED,
  eyebrow: "Guía · CRM",
  heading: "CRM inmobiliario gratis: qué incluye cada plan gratuito y dónde se acaba",
  lead: `Cinco CRM hechos para agentes inmobiliarios en España tienen un plan gratuito sin fecha de fin: inmoGesco (clientes e inmuebles ilimitados, un usuario, sin publicación en portales), Witei (250 contactos y 10 inmuebles), InmoProCRM (20 inmuebles), PropertyList (su MLS y su CRM básico, con compradores que cuestan créditos pasados los cinco primeros) y ${SITE_NAME} (${FREE_CLIENT_LIMIT} clientes). Fincta es gratis con todo hasta el 1 de febrero de 2027 y después se queda en 12 clientes. HubSpot y Zoho CRM también son gratis, como CRM de ventas generalistas sin publicación en portales. Inmovilla, Sooprema y Vesta ofrecen, en cambio, pruebas gratuitas.`,
  Body,
  faq: [
    {
      q: "¿Hay algún CRM inmobiliario gratis en España?",
      a: `Sí. inmoGesco, Witei, InmoProCRM, PropertyList y ${SITE_NAME} tienen planes gratuitos sin fecha de fin, cada uno con un límite distinto, y Fincta es gratis con todo hasta el 1 de febrero de 2027. HubSpot y Zoho CRM son CRM de ventas generalistas gratuitos, sin herramientas para inmuebles.`,
    },
    {
      q: "¿Qué CRM inmobiliario gratis no tiene límite de clientes?",
      a: "El plan gratuito de inmoGesco no tiene límite de clientes ni de inmuebles, para un usuario y sin publicación en portales. PropertyList no limita los contactos, pero pasar un comprador a su pipeline de compradores cuesta un crédito pasados los cinco primeros.",
    },
    {
      q: "¿Witei es gratis?",
      a: "Witei tiene un plan gratuito sin límite de tiempo: 250 contactos, 10 inmuebles y un usuario, sin pasarelas a portales ni su SmartInbox. Los módulos de pago cuestan desde 25 € al mes cada uno, más IVA.",
    },
    {
      q: "¿Inmovilla es gratis?",
      a: "No. Inmovilla tiene una prueba gratuita de 15 días; su Full Edition cuesta 79 € al mes o 790 € al año más IVA, para hasta 7 usuarios.",
    },
    {
      q: "¿El CRM de HubSpot es gratis para agentes inmobiliarios?",
      a: "Sí, para hasta 2 usuarios y 1.000 contactos, sin fecha de fin. Es un CRM de ventas generalista: no publica en portales, y su bandeja de entrada de WhatsApp solo viene con los planes Professional, de pago.",
    },
  ],
  related: ["guideBestCrm", "guideCrmAlternatives", "toolSpreadsheet"],
  topic: { "@type": "Thing", name: "Software CRM inmobiliario gratuito en España" },
};
