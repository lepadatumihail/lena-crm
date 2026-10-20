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
const FIRST_PUBLISHED = PUBLISHED.guideCrmAlternatives;

/**
 * El día en que se comprobó por última vez cada precio y límite en la web de
 * cada proveedor. Es también la fecha de "Actualizado", su dateModified y el
 * lastmod del sitemap, así que la revisión trimestral (plan 025) sube CHECKED,
 * nunca PUBLISHED.
 */
const LAST_CHECKED = CHECKED.guideCrmAlternatives ?? FIRST_PUBLISHED;

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
            Cada precio, límite y función que aparece abajo sale de la web o del centro de ayuda
            del propio proveedor, con su enlace allí donde se cita. Si un proveedor no lo dice, lo
            indicamos.
          </li>
          <li>Los precios no incluyen IVA salvo que se indique “IVA incluido”.</li>
          <li>{SITE_NAME} publica esta guía y es una de las alternativas que aparecen en ella.</li>
        </ul>
      </Callout>

      <h2>Witei e Inmovilla de un vistazo</h2>
      <p>
        Los dos son CRM para agencias inmobiliarias: guardan la cartera de la agencia, la
        publican en los portales, gestionan su web y registran las consultas que les llegan. Se
        diferencian en el modelo de precios, en idealista y en el trabajo con otras agencias.
      </p>
      {/* Las celdas pueden partir palabras con guion: sin eso, «independientes» y
          «colaboración» ensanchan la tabla 7 px más que la columna en un móvil de 320 px. */}
      <table className="[&_td]:hyphens-auto">
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Característica</span>
            </th>
            <th scope="col">Witei</th>
            <th scope="col">Inmovilla</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">Dueño</th>
            <td>Witei Solutions SL, integrada en Fotocasa Group (Scout24)</td>
            <td>Aplicaciones Inmovilla SL, propiedad de idealista</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Plan gratuito</th>
            <td>Sí: 250 contactos, 10 inmuebles, 1 usuario</td>
            <td>No; prueba gratuita de 15 días</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Precio</th>
            <td>25, 45 o 65 €/mes por módulo; contactos e inmuebles juntos, desde 50 €</td>
            <td>79 €/mes o 790 €/año</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Usuarios</th>
            <td>
              1 en el plan gratuito, 10 con el módulo de contactos Normal; 5 €/mes por usuario
              adicional
            </td>
            <td>Hasta 7 incluidos; 12 €/mes por usuario adicional</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">idealista</th>
            <td>Sin pasarelas nuevas desde febrero de 2022</td>
            <td>Pasarela en tiempo real</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Consultas de portales</th>
            <td>SmartInbox lee los correos reenviados, a partir del plan Normal</td>
            <td>Los correos a su propio buzón pueden crear el cliente y la demanda</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">WhatsApp</th>
            <td>Abre un chat con el contacto</td>
            <td>Abre un chat; una bandeja de entrada de pago vinculada con código QR</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Otras agencias</th>
            <td>Sin colaboración entre agencias independientes</td>
            <td>Círculos (grupos MLS) y acuerdos de colaboración</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Exportación</th>
            <td>Excel o CSV</td>
            <td>Excel, CSV o XML</td>
          </tr>
        </tbody>
      </table>

      <h3>Witei</h3>
      <ul>
        <li>
          <strong>Planes:</strong> se paga por módulo y por espacio de trabajo, no por usuario;
          los módulos son contactos, inmuebles y web. Normal cuesta 25 € al mes por módulo,
          Premium 45 € y Enterprise 65 €; la web, 19 €, 29 € o 49 €. Sin permanencia, sin cuota
          de alta y con garantía de reembolso de 15 días (
          <Source href={S.witeiPrices}>precios de Witei</Source>). Un usuario adicional cuesta 5 €
          al mes (<Source href={S.witeiAddOns}>precios adicionales</Source>).
        </li>
        <li>
          <strong>Plan gratuito:</strong> sin límite de tiempo, con 250 contactos, 10 inmuebles,
          un usuario y cruce entre ellos. Sin pasarelas a portales, sin SmartInbox, sin correos y
          sin Google Calendar. Las cuentas que solo tienen planes gratuitos se pueden cerrar por
          inactividad sin previo aviso (<Source href={S.witeiPrices}>precios de Witei</Source>).
        </li>
        <li>
          <strong>Portales:</strong> Fotocasa Pro (que cubre fotocasa, habitaclia y
          milanuncios), pisos.com, Kyero, Rightmove, Zoopla, thinkSPAIN, Green-Acres y otros (
          <Source href={S.witeiPortals}>pasarelas</Source>). Falta idealista: desde febrero de
          2022, Witei no puede activar pasarelas nuevas con este portal, aunque las anteriores
          siguen funcionando (<Source href={S.witeiIdealista}>ayuda de Witei</Source>).
        </li>
        <li>
          <strong>Consultas:</strong> cada espacio de trabajo tiene una dirección de SmartInbox, y
          los correos de los portales que se envían o reenvían a ella se convierten en contactos.
          La respuesta automática requiere el plan Normal de contactos o uno superior (
          <Source href={S.witeiSmartInbox}>SmartInbox</Source>).
        </li>
        <li>
          <strong>Otras agencias:</strong> Witei no ofrece herramientas para la colaboración
          entre agencias independientes, y sus condiciones la prohíben. Los espacios de trabajo
          solo se pueden vincular dentro de una misma empresa (
          <Source href={S.witeiNoCollaboration}>ayuda de Witei</Source>).
        </li>
        <li>
          <strong>Quién puede darse de alta:</strong> negocios cuya actividad profesional esté
          registrada en un país de la UE (<Source href={S.witeiTerms}>condiciones</Source>).
        </li>
        <li>
          <strong>Dueño:</strong> Witei Solutions SL pertenece a Fotocasa Group, la antigua
          Adevinta Real Estate, que Scout24 compró el 27 de febrero de 2026 (
          <Source href={S.bormeWitei2025}>BORME 2025</Source>,{" "}
          <Source href={S.scout24Q1}>Scout24</Source>,{" "}
          <Source href={S.bormeFotocasaGroup}>BORME 2026</Source>). Inmoweb es del mismo grupo (
          <Source href={S.fotocasaGroupBrands}>Fotocasa Group</Source>).
        </li>
      </ul>

      <h3>Inmovilla</h3>
      <ul>
        <li>
          <strong>Precio:</strong> un solo plan, Full Edition, a 79 € al mes o 790 € al año, para
          hasta 7 usuarios, con inmuebles ilimitados, web y 50 GB de almacenamiento. La prueba
          gratuita dura 15 días, con un usuario de prueba y una selección de funciones (
          <Source href={S.inmovillaPrices}>precios de Inmovilla</Source>). Un usuario adicional
          cuesta 12 € al mes, y la primera importación de tus datos desde otro CRM es gratis (
          <Source href={S.inmovillaFaqPrice}>ayuda de Inmovilla</Source>).
        </li>
        <li>
          <strong>Licencia solo para MLS:</strong> los miembros de una MLS pueden contratar una
          versión limitada por 15 € al mes por MLS, para ver los inmuebles que se comparten en
          ella y enviárselos a sus clientes (
          <Source href={S.inmovillaFaqShare}>ayuda de Inmovilla</Source>).
        </li>
        <li>
          <strong>Portales:</strong> pasarelas en tiempo real con idealista, fotocasa y pisos.com (
          <Source href={S.inmovillaFaqPortals}>ayuda de Inmovilla</Source>). Las consultas que
          llegan por correo a su propio buzón pueden crear por sí solas el cliente y la demanda (
          <Source href={S.inmovillaFaqLeads}>ayuda de Inmovilla</Source>).
        </li>
        <li>
          <strong>WhatsApp:</strong> una bandeja de entrada de pago, que se contrata por agente y
          que vinculas escaneando un código QR desde los dispositivos vinculados de WhatsApp, como
          harías con WhatsApp Web. Su precio no se publica, y la propia guía de Inmovilla advierte
          de que WhatsApp puede bloquear un número si detecta un uso indebido (
          <Source href={S.inmovillaFaqWhatsapp}>ayuda de Inmovilla</Source>).
        </li>
        <li>
          <strong>Otras agencias:</strong> círculos (grupos MLS) que creas o a los que te unes, y
          acuerdos de colaboración entre dos agencias (
          <Source href={S.inmovillaFaqCircles}>ayuda de Inmovilla</Source>).
        </li>
        <li>
          <strong>Interfaz:</strong> en español, inglés y portugués (
          <Source href={S.inmovillaFaqLanguages}>ayuda de Inmovilla</Source>).
        </li>
        <li>
          <strong>Dueño:</strong> idealista la compró en junio de 2022 (
          <Source href={S.idealistaBuysInmovilla}>idealista</Source>,{" "}
          <Source href={S.bormeInmovilla}>BORME</Source>). Inmovilla dice que trabaja con más de
          4.000 agencias (<Source href={S.inmovillaFaqAgencies}>ayuda de Inmovilla</Source>).
        </li>
      </ul>

      <h2>Por qué los agentes buscan una alternativa</h2>
      <p>
        Normalmente por uno de estos motivos, y cada uno lleva a un tipo de herramienta distinto.
      </p>

      <h3>No tienes cartera propia</h3>
      <p>
        Si vendes inmuebles de otras agencias, buena parte de lo que cobra un CRM centrado en los
        inmuebles se queda sin usar: las pasarelas, la web, las fichas de los inmuebles. Y tus
        clientes están en una cuenta que puede ser de la agencia. Lo que necesitas es una cartera
        de clientes propia.
      </p>

      <h3>Necesitas idealista y usas Witei</h3>
      <p>
        Una cuenta de Witei no puede activar una pasarela nueva con idealista, así que una
        agencia que se dio de alta después de febrero de 2022 no puede publicar en idealista
        desde Witei. Inmovilla e Inmoweb publican en este portal en tiempo real, y Sooprema,
        Mobilia, Vesta y los planes de pago de inmoGesco lo incluyen entre sus portales.
      </p>

      <h3>Quieres compartir inmuebles con otras agencias</h3>
      <p>
        Witei solo permite compartir dentro de una misma empresa. Si trabajas compartiendo
        operaciones, mira herramientas pensadas como redes: los círculos de Inmovilla, la red de
        Resales Online en la Costa del Sol o PropertyList.
      </p>

      <h3>Quieres un plan gratuito con más margen</h3>
      <p>
        El plan gratuito de Witei se queda en 250 contactos y 10 inmuebles, sin pasarelas a
        portales, e Inmovilla solo ofrece una prueba. El plan gratuito de inmoGesco no tiene
        límite de clientes ni de inmuebles, para un usuario y sin portales.
      </p>

      <h3>Prefieres que tu CRM no sea de un portal</h3>
      <p>
        Inmovilla es de idealista, y Witei e Inmoweb, de Fotocasa Group, la empresa de Scout24 en
        España. Algunos agentes prefieren un CRM de una empresa que no les venda también
        anuncios.
      </p>

      <h3>Tu negocio está registrado fuera de la UE</h3>
      <p>
        Witei solo acepta clientes cuya actividad profesional esté registrada en un país de la
        UE, lo que deja fuera, por ejemplo, a una agencia registrada en el Reino Unido.
      </p>

      <h2>Las alternativas</h2>
      <p>
        Los precios son los del plan más barato de cada proveedor, más IVA salvo que se indique
        lo contrario.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Alternativa</th>
            <th scope="col">Ideal para</th>
            <th scope="col">Desde</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">inmoGesco</th>
            <td>Un plan gratuito sin límite de clientes ni de inmuebles</td>
            <td>Gratis; con portales, 29 €/mes en pago anual</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Sooprema</th>
            <td>Muchos inmuebles y usuarios ilimitados</td>
            <td>39 €/mes por 150 inmuebles</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Inmoweb</th>
            <td>idealista y Fotocasa en tiempo real con un plan pequeño</td>
            <td>36 €/mes, 1 usuario</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Mobilia</th>
            <td>WhatsApp con la API oficial de Meta</td>
            <td>49 €/mes, 1 usuario</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Vesta CRM</th>
            <td>Web, bandeja de entrada compartida e IA, todo en uno</td>
            <td>44,90 €/mes, 2 usuarios</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">InmoProCRM</th>
            <td>Un plan gratuito con todas las funciones, para una cartera pequeña</td>
            <td>Gratis hasta 20 inmuebles; 39 €/mes, IVA incluido</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Resales Online</th>
            <td>Los inmuebles compartidos de la Costa del Sol</td>
            <td>190 €/mes, 4 usuarios</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">PropertyList</th>
            <td>Una MLS gratuita, con pago por uso</td>
            <td>Lo básico, gratis; créditos desde 0,80 €</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">{SITE_NAME}</th>
            <td>Los clientes de un agente que trabaja con varias agencias</td>
            <td>
              Gratis hasta {FREE_CLIENT_LIMIT} clientes; {PRICES.standard.monthly} €/mes
            </td>
          </tr>
        </tbody>
      </table>

      <h3>inmoGesco</h3>
      <ul>
        <li>
          <strong>Gratis para siempre:</strong> clientes e inmuebles ilimitados para un usuario,
          con web en un subdominio, MLS propia, cruces y avisos por correo a los compradores. Las
          cuentas inactivas se desactivan a los 6 meses (
          <Source href={S.inmogescoPrices}>precios de inmoGesco</Source>).
        </li>
        <li>
          <strong>Portales:</strong> no entran en el plan gratuito, salvo una prueba de 30 días a
          petición (<Source href={S.inmogescoPortals}>portales</Source>). PRO cuesta 29 € al mes
          con pago anual o 35 € con pago mensual, para 2 usuarios, y publica en idealista,
          pisos.com, Kyero, thinkSPAIN y otros; su página de portales no menciona Fotocasa ni
          habitaclia.
        </li>
        <li>
          <strong>En el día a día:</strong> funciona en el navegador, sin app. Para darte de baja,
          hay que contactar con su equipo (<Source href={S.inmogescoHome}>inmoGesco</Source>).
        </li>
      </ul>

      <h3>Sooprema</h3>
      <ul>
        <li>
          <strong>Precio según los inmuebles activos</strong>, con usuarios ilimitados: de 39 € al
          mes por 150 hasta 99 € por 2.500 (<Source href={S.sooprema}>Sooprema</Source>). Prueba de
          14 días con todas las funciones y sin tarjeta (
          <Source href={S.soopremaTrial}>página del CRM</Source>), y sin permanencia (
          <Source href={S.soopremaFaq}>preguntas frecuentes</Source>).
        </li>
        <li>
          <strong>Portales:</strong> más de 70, entre ellos idealista, Fotocasa, Kyero y pisos.com
          (<Source href={S.soopremaPortals}>portales</Source>).
        </li>
        <li>
          <strong>Consultas:</strong> su bandeja de entrada lee tu buzón de correo, e importas cada
          consulta de un portal con un clic. La web es un producto aparte, con cuota de alta.
        </li>
      </ul>

      <h3>Inmoweb</h3>
      <ul>
        <li>
          <strong>Planes:</strong> Starter cuesta 36 € al mes para 1 usuario, Evolution 59 € para
          3 y Enterprise 79 € para 10, más impuestos, con un 20% de descuento en pago anual (
          <Source href={S.inmowebPrices}>precios de Inmoweb</Source>).
        </li>
        <li>
          <strong>Portales:</strong> unos 30, con idealista, Fotocasa y habitaclia en tiempo real (
          <Source href={S.inmowebPortals}>portales</Source>). Onebox, que convierte los correos de
          los portales en clientes, está disponible a partir de Evolution (
          <Source href={S.inmowebOnebox}>Onebox</Source>).
        </li>
        <li>
          <strong>A tener en cuenta:</strong> funciona en el navegador, en español o inglés. Te das
          de baja desde el panel al menos 15 días antes de la renovación (
          <Source href={S.inmowebTerms}>condiciones</Source>). Es del mismo grupo que Witei.
        </li>
      </ul>

      <h3>Mobilia</h3>
      <ul>
        <li>
          <strong>Precio:</strong> 49 € al mes con un usuario; cada usuario adicional cuesta 20 €,
          hasta cinco. La implantación básica es gratis con una permanencia de 3 meses para el
          primer usuario; la premium cuesta 349 € (
          <Source href={S.mobiliaPrices}>precios de Mobilia</Source>). Sin plan gratuito ni
          prueba: hay que reservar una demo.
        </li>
        <li>
          <strong>WhatsApp:</strong> la API oficial de WhatsApp Business, conectada a través de
          Meta, con la conversación de cada cliente guardada en el CRM; el precio te lo dan en la
          demo (<Source href={S.mobiliaWhatsapp}>WhatsApp</Source>).
        </li>
        <li>
          <strong>Portales y consultas:</strong> unos 50 portales, entre ellos idealista,
          Fotocasa, Kyero, Rightmove y el portal en ruso Prian.ru; las consultas de los portales
          llegan como solicitudes que confirmas como clientes (
          <Source href={S.mobiliaCrm}>CRM</Source>).
        </li>
      </ul>

      <h3>Vesta CRM</h3>
      <ul>
        <li>
          <strong>Planes:</strong> Starter cuesta 44,90 € al mes para 2 usuarios, y Básico 99,90 €
          y Profesional 149,90 € para 5, con web en todos los planes; con pago anual se cobran
          diez meses (<Source href={S.vestaPrices}>precios de Vesta</Source>).
        </li>
        <li>
          <strong>Para probarlo:</strong> una prueba gratuita y, además, garantía de reembolso del
          primer mes (<Source href={S.vestaTerms}>condiciones</Source>). Un número de WhatsApp en
          su bandeja de entrada cuesta 8,90 € al mes, incluido en Profesional (
          <Source href={S.vestaPrices}>precios de Vesta</Source>); no se indica cómo se conecta a
          WhatsApp.
        </li>
      </ul>

      <h3>InmoProCRM</h3>
      <ul>
        <li>
          <strong>Gratis para siempre</strong> hasta 20 inmuebles, con contactos ilimitados, un
          usuario y todas las funciones; después, 39 €, 69 € o 159 € al mes por agencia, IVA
          incluido (<Source href={S.inmoprocrm}>InmoProCRM</Source>).
        </li>
        <li>
          <strong>Portales y WhatsApp:</strong> unos 40 portales (
          <Source href={S.inmoprocrmFeatures}>funciones</Source>). WhatsApp se vincula como
          dispositivo con un código QR, igual que WhatsApp Web, y no a través de la API oficial (
          <Source href={S.inmoprocrmWhatsapp}>WhatsApp</Source>).
        </li>
        <li>
          <strong>A tener en cuenta:</strong> su web es de mediados de 2026 y no explica cómo
          exportar tus datos.
        </li>
      </ul>

      <h3>Resales Online</h3>
      <ul>
        <li>
          <strong>Precio:</strong> la suscripción Network and New Developments cuesta 190 € al mes
          para 4 usuarios, menos si pagas 6 o 12 meses por adelantado; 15 € por usuario adicional (
          <Source href={S.resalesFees}>cuotas de suscripción</Source>). Pide un correo
          corporativo con tu propio dominio (<Source href={S.resalesLicence}>licencia</Source>).
        </li>
        <li>
          <strong>La red:</strong> 2.149 agencias activas según su página de inicio el {AS_OF} (
          <Source href={S.resalesHome}>Resales Online</Source>). Cuando reservas una visita en un
          inmueble de otro agente, el otro agente solo ve el apellido de tu cliente y los cuatro
          últimos dígitos de su teléfono (<Source href={S.resalesViewings}>visitas</Source>).
        </li>
        <li>
          <strong>Consultas:</strong> entran desde tu web y desde su portal PropExtra; las demás
          se reenvían por correo y se adjuntan a mano (
          <Source href={S.resalesEmails}>ayuda de Resales</Source>). Su versión Standalone, un CRM
          sin la red, hoy no se factura (<Source href={S.resalesStandalone}>Standalone</Source>).
        </li>
      </ul>

      <h3>PropertyList</h3>
      <ul>
        <li>
          <strong>Lo básico, gratis:</strong> su MLS, el CRM, tus inmuebles y un micrositio. Pasar
          un comprador al embudo de compradores cuesta 1 crédito después de los 5 primeros, y los
          créditos cuestan de 0,80 € a 1 € más IVA (
          <Source href={S.propertylistPrices}>precios de PropertyList</Source>).
        </li>
        <li>
          <strong>Red:</strong> más de 1.040 agencias, concentradas en la Costa del Sol (
          <Source href={S.propertylistFree}>PropertyList</Source>).
        </li>
        <li>
          <strong>Si te vas:</strong> sin contrato, y tus inmuebles se exportan en XML (
          <Source href={S.propertylistPrices}>precios de PropertyList</Source>); sus páginas no
          documentan ninguna exportación de tus contactos.
        </li>
      </ul>

      <h3>{SITE_NAME}</h3>
      <ul>
        <li>
          <strong>Para los clientes propios de un agente</strong> en todas las agencias para las
          que vende: cada cliente se etiqueta con la agencia por la que llegó. Gratis hasta{" "}
          {FREE_CLIENT_LIMIT} clientes con todas las funciones; Pro cuesta{" "}
          {PRICES.standard.monthly} € al mes, y los primeros {FOUNDING_CAP} agentes de pago se
          quedan en {PRICES.founding.monthly} € al mes de por vida (
          <Link href={marketingPath("pricing", L)}>precios</Link>).
        </li>
        <li>
          <strong>Lo que no hace:</strong> publicar anuncios, llevar una web ni compartir una MLS.
          Pegas una consulta de un portal y rellena la ficha del cliente; redacta mensajes de
          WhatsApp en el idioma de tu cliente para que los envíes desde tu móvil.
        </li>
      </ul>

      <h2>Cómo llevarte tus clientes</h2>

      <h3>Desde Witei</h3>
      <p>
        Un administrador, o un usuario con permiso de exportación, puede exportar inmuebles,
        contactos y la web a Excel o CSV, incluidas fotos, documentos, ofertas, tareas y
        conversaciones. Puede tardar hasta 24 horas, los archivos se dividen cada 10.000 filas y
        las descargas siguen disponibles durante 30 días (
        <Source href={S.witeiExport}>ayuda de Witei</Source>). Exporta antes de darte de baja: la
        página de producto de Witei dice que guarda tus datos 30 días por si vuelves (
        <Source href={S.witeiCrm}>Witei</Source>), pero su artículo de ayuda sobre la baja dice
        que el acceso a la cuenta, los datos, el dominio y el correo termina en cuanto la
        confirmas (<Source href={S.witeiCancel}>ayuda de Witei</Source>).
      </p>

      <h3>Desde Inmovilla</h3>
      <p>
        Los inmuebles, las demandas y los contactos se exportan a Excel, CSV o XML, y el XML
        incluye las fotos. Una exportación de todo sin filtros avisa al gerente de la agencia (
        <Source href={S.inmovillaFaqExport}>ayuda de Inmovilla</Source>). Para dar de baja la
        cuenta, el perfil de gerente va a Mi oficina › Configuración › Solicitar baja; la web se
        suspende unos días después de que se confirme la baja (
        <Source href={S.inmovillaFaqCancel}>ayuda de Inmovilla</Source>).
      </p>

      <h3>Al nuevo CRM</h3>
      <p>
        La mayoría de los CRM anteriores importan un archivo Excel o CSV. Inmovilla importa
        gratis tus primeros datos, Vesta cobra 500 € por la migración (la mitad con una
        permanencia de 12 meses, gratis con 24) y Fincta importa clientes, pero no inmuebles ni
        documentos. {SITE_NAME} importa Excel o CSV, te enseña cómo encaja cada columna y te
        deja deshacer toda la importación con un clic.
      </p>

      <Callout kind="warning" title="¿De quién son los clientes?">
        <p>
          Si la cuenta de Witei o Inmovilla es de una agencia, las fichas de clientes que contiene
          también son datos de la agencia. Llévate solo lo que te permita tu acuerdo con esa
          agencia: para mover datos personales hace falta una base jurídica según el RGPD.
        </p>
      </Callout>

      <h2>Fuentes</h2>
      <p>La web, el centro de ayuda o las condiciones de cada proveedor, comprobados el {AS_OF}.</p>
      <ul>
        <li>
          Witei: <Source href={S.witeiPrices}>precios</Source>,{" "}
          <Source href={S.witeiAddOns}>precios adicionales</Source>,{" "}
          <Source href={S.witeiTerms}>condiciones</Source>,{" "}
          <Source href={S.witeiPortals}>pasarelas</Source>,{" "}
          <Source href={S.witeiIdealista}>idealista</Source>,{" "}
          <Source href={S.witeiSmartInbox}>SmartInbox</Source>,{" "}
          <Source href={S.witeiNoCollaboration}>otras agencias</Source>,{" "}
          <Source href={S.witeiExport}>exportación</Source>,{" "}
          <Source href={S.witeiCancel}>baja</Source>; titularidad:{" "}
          <Source href={S.bormeWitei2025}>BORME del 7 de abril de 2025</Source>,{" "}
          <Source href={S.bormeScout24}>BORME del 17 de marzo de 2026</Source>,{" "}
          <Source href={S.bormeFotocasaGroup}>BORME del 21 de julio de 2026</Source>,{" "}
          <Source href={S.scout24Q1}>Scout24 (primer trimestre de 2026)</Source>,{" "}
          <Source href={S.fotocasaGroupBrands}>Fotocasa Group</Source>.
        </li>
        <li>
          Inmovilla: <Source href={S.inmovillaPrices}>precios</Source>,{" "}
          <Source href={S.inmovillaFaqPrice}>usuarios e importación</Source>,{" "}
          <Source href={S.inmovillaFaqShare}>licencia MLS</Source>,{" "}
          <Source href={S.inmovillaFaqPortals}>portales</Source>,{" "}
          <Source href={S.inmovillaFaqLeads}>consultas</Source>,{" "}
          <Source href={S.inmovillaFaqWhatsapp}>WhatsApp</Source>,{" "}
          <Source href={S.inmovillaFaqCircles}>círculos</Source>,{" "}
          <Source href={S.inmovillaFaqLanguages}>idiomas</Source>,{" "}
          <Source href={S.inmovillaFaqExport}>exportación</Source>,{" "}
          <Source href={S.inmovillaFaqCancel}>baja</Source>; titularidad:{" "}
          <Source href={S.idealistaBuysInmovilla}>idealista</Source>,{" "}
          <Source href={S.bormeInmovilla}>BORME del 21 de julio de 2022</Source>.
        </li>
        <li>
          <Source href={S.inmogescoPrices}>inmoGesco</Source>,{" "}
          <Source href={S.sooprema}>Sooprema</Source>,{" "}
          <Source href={S.inmowebPrices}>Inmoweb</Source>,{" "}
          <Source href={S.mobiliaPrices}>Mobilia</Source>,{" "}
          <Source href={S.vestaPrices}>Vesta CRM</Source>,{" "}
          <Source href={S.inmoprocrm}>InmoProCRM</Source>,{" "}
          <Source href={S.resalesFees}>Resales Online</Source>,{" "}
          <Source href={S.propertylistPrices}>PropertyList</Source> y las páginas enlazadas en
          cada sección de arriba.
        </li>
      </ul>
      <p>
        ¿Quieres comparar más a fondo los planes gratuitos? Mira{" "}
        <Link href={marketingPath("guideFreeCrm", L)}>qué incluye cada CRM inmobiliario gratis</Link>{" "}
        o <Link href={marketingPath("guideBestCrm", L)}>qué CRM encaja con tu forma de trabajar</Link>.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Alternativas a Witei e Inmovilla para agentes (2026)",
  description:
    "Alternativas a Witei e Inmovilla para agentes: qué cuestan e incluyen en 2026, de planes gratis a la MLS de la Costa del Sol, y cómo llevarte tus clientes.",
  kind: "article",
  published: FIRST_PUBLISHED,
  modified: LAST_CHECKED,
  eyebrow: "Guía · CRM",
  heading: "Alternativas a Witei e Inmovilla, y cómo llevarte tus clientes",
  lead: `Witei e Inmovilla son CRM para agencias, pensados para gestionar la cartera y publicarla en los portales. Witei es gratis hasta 250 contactos, con módulos de pago desde 25 € al mes más IVA, y pertenece a Fotocasa Group, de Scout24. Inmovilla cuesta 79 € al mes más IVA para hasta 7 usuarios y es de idealista. La alternativa adecuada depende de por qué buscas otra: un plan gratuito más amplio (inmoGesco), otro software de gestión para agencias (Sooprema, Inmoweb, Mobilia, Vesta), los inmuebles compartidos de la Costa del Sol (Resales Online, PropertyList) o los clientes de un agente que trabaja con varias agencias (${SITE_NAME}). Los dos te permiten exportar tus datos a Excel o CSV.`,
  Body,
  faq: [
    {
      q: "¿Qué alternativa hay a Witei?",
      a: `Depende de por qué te vas. Para un plan gratuito más amplio, inmoGesco no tiene límite de clientes ni de inmuebles para un usuario. Si buscas otro software de gestión para agencias, Sooprema empieza en 39 € al mes e Inmoweb en 36 €, los dos más IVA, e Inmoweb publica en idealista en tiempo real. Si vendes para varias agencias y no tienes cartera propia, ${SITE_NAME} reúne tus propios clientes en un solo sitio.`,
    },
    {
      q: "¿Hay una alternativa gratis a Inmovilla?",
      a: "La propia Inmovilla solo tiene una prueba de 15 días. inmoGesco es gratis para siempre, con clientes e inmuebles ilimitados para un usuario y sin publicación en portales; Witei es gratis hasta 250 contactos y 10 inmuebles; InmoProCRM, hasta 20 inmuebles; la MLS y el CRM básico de PropertyList son gratis, con créditos para algunas acciones.",
    },
    {
      q: "¿De quién son Witei e Inmovilla?",
      a: "Inmovilla es de idealista desde junio de 2022. Witei Solutions SL pertenece a Fotocasa Group, la antigua Adevinta Real Estate, que Scout24 compró el 27 de febrero de 2026; Inmoweb es del mismo grupo.",
    },
    {
      q: "¿Witei publica en idealista?",
      a: "En cuentas nuevas, no. Desde febrero de 2022 no se puede activar ninguna pasarela nueva con idealista desde Witei, aunque las que se abrieron antes siguen funcionando. Las consultas de idealista se pueden seguir reenviando al SmartInbox de Witei.",
    },
    {
      q: "¿Cómo exporto mis clientes de Inmovilla?",
      a: "Inmovilla exporta inmuebles, demandas y contactos a Excel, CSV o XML, y el XML incluye las fotos. Una exportación de todo sin filtros avisa al gerente de la agencia, así que, si la cuenta es de una agencia, comprueba qué te permite llevarte tu acuerdo.",
    },
  ],
  related: ["guideFreeCrm", "guideBestCrm", "guidePortalPrices"],
  topic: { "@type": "Thing", name: "Software CRM inmobiliario en España" },
};
