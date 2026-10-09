import Link from "next/link";

import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES } from "@/lib/billing";
import { marketingPath } from "@/lib/routes";
import { SITE_FOUNDED, SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/site";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";

const LOCALE = "es";
const home = marketingPath("home", LOCALE);
const pricing = marketingPath("pricing", LOCALE);
const spain = marketingPath("crmSpain", LOCALE);
/** El dominio a secas ("www.leadwing.app"), para cuando se nombra la web sin enlazarla. */
const domain = new URL(SITE_URL).host;

function Body() {
  return (
    <>
      <h2>{SITE_NAME} en pocas palabras</h2>
      <dl>
        <dt>Qué es</dt>
        <dd>
          Un CRM (software de gestión de clientes) para agentes inmobiliarios independientes.
          Funciona en el navegador y se instala en la pantalla de inicio del móvil como una app.
        </dd>
        <dt>Para quién</dt>
        <dd>
          Agentes independientes, también los que venden para varias agencias a la vez. Los
          clientes de cada agente son solo suyos.
        </dd>
        <dt>Mercado</dt>
        <dd>
          Pensado para vender inmuebles en España: consultas de Idealista, Fotocasa y Kyero,
          contratos de reserva y precios con IVA.
        </dd>
        <dt>Idiomas</dt>
        <dd>Español, inglés y ruso</dd>
        <dt>Lanzamiento</dt>
        <dd>{SITE_FOUNDED}</dd>
        <dt>Precios</dt>
        <dd>
          Gratis hasta {FREE_CLIENT_LIMIT} clientes. Pro cuesta {PRICES.standard.monthly} € al
          mes o {PRICES.standard.yearly} € al año, más IVA.
        </dd>
        <dt>Web</dt>
        <dd>
          <Link href={home}>{domain}</Link>
        </dd>
        <dt>Contacto</dt>
        <dd>
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </dd>
      </dl>

      <h2>Qué hace {SITE_NAME}</h2>
      <p>
        Cada cliente tiene una ficha que guarda toda la operación, desde la primera consulta
        hasta la entrega de llaves:
      </p>
      <ul>
        <li>
          <strong>Un embudo para compradores y vendedores.</strong> Los compradores avanzan por
          nuevo, contactado, cualificado, visitas y reservado; los vendedores tienen su propio
          flujo, con cada anuncio adjunto.
        </li>
        <li>
          <strong>Fichas de cliente.</strong> Teléfono, idioma, nacionalidad, presupuesto y
          notas, con los leads calientes marcados y los fríos ocultos.
        </li>
        <li>
          <strong>Propiedades, visitas y ofertas.</strong> Cada propiedad que ha visto un
          comprador, cada visita en un calendario que se sincroniza con Google Calendar y cada
          oferta frente al precio de salida.
        </li>
        <li>
          <strong>Documentos.</strong> Pasaportes, NIE y contratos de reserva, guardados en la
          ficha del cliente que toca.
        </li>
        <li>
          <strong>Etiquetas de agencia.</strong> Cada lead lleva la agencia por la que entró, así
          que una sola cartera cubre todas las agencias con las que vende el agente.
        </li>
        <li>
          <strong>Seguimientos en el idioma del cliente.</strong> {SITE_NAME} redacta el
          WhatsApp o el correo; el agente lee y aprueba cada mensaje antes de que salga.
        </li>
        <li>
          <strong>Captura de leads de portales.</strong> Pega una consulta de Idealista,
          Fotocasa, Kyero, un correo o un WhatsApp y vuelve convertida en un lead listo para
          guardar.
        </li>
        <li>
          <strong>Emparejamiento de compradores.</strong> Muestra qué anuncios propios del
          agente encajan con el presupuesto, el tipo de inmueble y los dormitorios de cada
          comprador.
        </li>
      </ul>

      <h2>Por qué existe</h2>
      <p>
        Un agente independiente casi nunca vende para una sola agencia. Enseña lo que le encaja
        al comprador, comparte comisión con quien tiene el encargo y acaba con los clientes
        repartidos entre notas, hojas de cálculo, calendarios y conversaciones de WhatsApp.{" "}
        {SITE_NAME} reúne toda esa cartera en un solo sitio, con cada lead etiquetado por la
        agencia a la que pertenece, y le quita la página en blanco al seguimiento.
      </p>

      <h2>Lo que no es</h2>
      <p>
        {SITE_NAME} no es un back office de agencia: no publica anuncios en los portales ni
        gestiona un equipo, y la cartera de cada agente es solo suya. Nunca envía un mensaje por
        su cuenta: cada borrador espera a que el agente lo apruebe. Y todavía no lleva
        alquileres: el embudo de venta ya funciona, y los alquileres de larga y corta duración
        están previstos.
      </p>

      <h2>El nombre</h2>
      <p>
        Lead, por el lead con el que trabaja el agente. Wing, por wingman: el compañero que va a
        tu lado y hace que cada lead siga avanzando. El nombre no es solo nuestro: la Leadwing
        Coachman es una mosca clásica de pesca, y empresas sin relación de otros sectores usan
        la misma palabra. {SITE_NAME}, el CRM inmobiliario de {domain}, no tiene ninguna
        relación con ellas.
      </p>

      <h2>Contacto</h2>
      <p>
        Agentes, prensa y colaboradores pueden escribir a{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Si antes quieres ver el
        producto, la <Link href={home}>página de inicio</Link> recorre una ficha de cliente, el
        embudo y los borradores de seguimiento. En la{" "}
        <Link href={pricing}>página de precios</Link> están los dos planes uno al lado del otro,
        con el precio fundador de {PRICES.founding.monthly} € al mes para los primeros{" "}
        {FOUNDING_CAP} agentes de pago, y la página de{" "}
        <Link href={spain}>CRM inmobiliario para España</Link> explica lo que tiene que resolver
        un CRM en el mercado español.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: `Sobre ${SITE_NAME}, el CRM para agentes inmobiliarios`,
  description: `${SITE_NAME} es un CRM para agentes inmobiliarios independientes: una ficha por comprador o vendedor y todas tus agencias juntas. Qué hace, para quién y contacto.`,
  kind: "about",
  published: "2026-09-15",
  eyebrow: "Sobre nosotros",
  heading: `Sobre ${SITE_NAME}`,
  lead: `${SITE_NAME} es un CRM para agentes inmobiliarios independientes. Reúne en una ficha a cada comprador y vendedor, con sus visitas, ofertas y documentos, de todas las agencias con las que trabaja el agente, y redacta cada seguimiento en el idioma del cliente. Se lanzó en ${SITE_FOUNDED} y funciona en el navegador, en español, inglés y ruso.`,
  Body,
  faq: [
    {
      q: `¿Para quién es ${SITE_NAME}?`,
      a: `Para agentes inmobiliarios independientes, sobre todo los que venden para varias agencias a la vez. Cada agente tiene su propia cartera privada: ${SITE_NAME} no es un sistema de agencia compartido por un equipo.`,
    },
    {
      q: `¿Cuándo se lanzó ${SITE_NAME}?`,
      a: `${SITE_NAME} se lanzó en ${SITE_FOUNDED}. El embudo de venta para compradores y vendedores ya funciona; los alquileres de larga y corta duración están previstos.`,
    },
    {
      q: `¿Tiene ${SITE_NAME} relación con otras empresas llamadas Leadwing?`,
      a: `No. ${SITE_NAME} es el CRM inmobiliario de ${domain} y no tiene relación con otras empresas o productos que usan el nombre Leadwing, ni con la mosca de pesca Leadwing Coachman.`,
    },
    {
      q: `¿Cómo contacto con ${SITE_NAME}?`,
      a: `Escribe a ${SUPPORT_EMAIL}. La misma dirección atiende dudas sobre el producto y la facturación, y también solicitudes de privacidad o legales.`,
    },
  ],
  related: ["pricing", "crmSpain", "guideFollowUp"],
};
