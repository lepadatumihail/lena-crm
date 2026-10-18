import Link from "next/link";

import { intlTag } from "@/i18n/config";
import { marketingPath } from "@/lib/routes";
import { CHECKED, PUBLISHED } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { SOURCES as S } from "@/content/pages/guide-portal-prices.sources";

const L = "es";

/** El día en que se publicó la página, que sigue siendo su datePublished. */
const FIRST_PUBLISHED = PUBLISHED.guidePortalPrices;

/**
 * El día en que se comprobó por última vez cada precio frente a la web del
 * portal. Es también la fecha de "Actualizado", su dateModified y el lastmod
 * del sitemap, así que la revisión trimestral sube CHECKED.guidePortalPrices,
 * nunca PUBLISHED.
 */
const LAST_CHECKED = CHECKED.guidePortalPrices ?? FIRST_PUBLISHED;

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
      <Callout title={`Precios comprobados el ${AS_OF}`}>
        <ul>
          <li>
            Ningún portal nacional publica sus tarifas para agencias: Idealista, Fotocasa y
            habitaclia, pisos.com y yaencontre dan el precio en una llamada comercial.
          </li>
          <li>
            De los portales que usan las agencias de la costa, solo ThinkSpain, Properstar,
            Spainhouses y FINN.no publican precios para profesionales.
          </li>
          <li>Kyero dejó de ser gratis para agencias el 31 de diciembre de 2025.</li>
          <li>
            Las cifras que circulan para Idealista vienen de blogs y de otros CRM, sin fuente. Las
            recogemos aparte y marcadas como lo que son.
          </li>
        </ul>
        <p>
          Esta página describe lo que publica cada portal. No recomienda ninguno ni opina sobre la
          calidad de sus contactos.
        </p>
      </Callout>

      <h2>Portales nacionales: qué publican</h2>
      <p>
        Todos venden a las agencias por paquetes de anuncios, con extras como destacados o
        posiciones preferentes. Lo que cambia es si te enseñan el precio antes de llamar. A{" "}
        {AS_OF}, ninguno de los grandes lo hacía.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Portal</th>
            <th scope="col">Precio para agencias</th>
            <th scope="col">Gratis para profesionales</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">Idealista</th>
            <td>Bajo consulta</td>
            <td>No: las agencias deben usar un perfil profesional</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Fotocasa y habitaclia</th>
            <td>Bajo consulta (packs Start, Basic y Premium, sin precio publicado)</td>
            <td>No consta</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">pisos.com</th>
            <td>Bajo consulta</td>
            <td>No consta</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">yaencontre</th>
            <td>Bajo consulta</td>
            <td>No consta</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Milanuncios</th>
            <td>A partir del tercer anuncio, con Fotocasa Pro</td>
            <td>Sí: 2 anuncios de inmuebles por categoría</td>
          </tr>
        </tbody>
      </table>

      <h3>Idealista</h3>
      <ul>
        <li>
          <strong>Precio:</strong> su página para profesionales habla de “distintas opciones de
          precios y servicios” y ofrece un teléfono y un formulario para que te llamen, sin
          tarifas (<Source href={S.idealistaPro}>idealista, nuevo profesional</Source>).
        </li>
        <li>
          <strong>Sin vía gratuita:</strong> un agente tiene que anunciarse con un perfil
          profesional, e idealista puede bloquear una cuenta de particular que use un agente (
          <Source href={S.idealistaAgentAccount}>ayuda de idealista</Source>).
        </li>
        <li>
          <strong>Ojo con los precios que circulan:</strong> los 43,90 € por 30 días de anuncio
          destacado o los 11,90 € por 24 horas que citan muchos blogs son tarifas para
          particulares, igual que los dos primeros anuncios gratis (
          <Source href={S.idealistaPrivate}>política de precios para particulares</Source>).
        </li>
        <li>
          <strong>Contactos:</strong> entran en el Inbox de idealista/tools, con aviso por correo (
          <Source href={S.idealistaInbox}>ayuda de idealista/tools</Source>).
        </li>
        <li>
          <strong>Anuncios:</strong> idealista recomienda como integraciones en tiempo real su
          propio idealista/tools e Inmovilla, que también es suyo (
          <Source href={S.idealistaSoftware}>software recomendado</Source>).
        </li>
      </ul>

      <h3>Fotocasa y habitaclia (Fotocasa Pro)</h3>
      <ul>
        <li>
          <strong>Precio:</strong> tres packs, Start, Basic y Premium, sin precio, IVA ni
          permanencia en la web. Todos publican sin límite en Fotocasa, habitaclia y Milanuncios;
          Basic incluye 20 destacados en Milanuncios y Premium, 40 (
          <Source href={S.fotocasaPacks}>Fotocasa Pro, packs</Source>).
        </li>
        <li>
          <strong>Tamaño que declaran:</strong> Fotocasa, 13.800 clientes y 28 millones de visitas
          al mes; habitaclia, 5.600 clientes y 18 millones (
          <Source href={S.fotocasaAbout}>Fotocasa</Source>,{" "}
          <Source href={S.habitacliaAbout}>habitaclia</Source>).
        </li>
        <li>
          <strong>Contactos:</strong> el “gestor de oportunidades” avisa por correo al agente
          asignado de cada llamada, incluidas las perdidas (
          <Source href={S.fotocasaLeads}>gestor de oportunidades</Source>).
        </li>
        <li>
          <strong>Anuncios:</strong> tu CRM se conecta con una clave de InmoFactory, y la misma
          conexión sirve para habitaclia (<Source href={S.witeiInmofactory}>ayuda de Witei</Source>
          ).
        </li>
      </ul>

      <h3>pisos.com, yaencontre y Milanuncios</h3>
      <ul>
        <li>
          <strong>pisos.com</strong> vende “diferentes packs de publicación” a través de su equipo
          comercial, junto con un CRM y una app propios (
          <Source href={S.pisosPro}>pisos.com, profesionales</Source>).
        </li>
        <li>
          <strong>yaencontre</strong> también da precio bajo consulta; los contactos llegan como
          mensajes directos en la plataforma (
          <Source href={S.yaencontrePro}>yaencontre, nuevo profesional</Source>).
        </li>
        <li>
          <strong>Milanuncios</strong> deja a los profesionales publicar 2 anuncios de inmuebles
          gratis por categoría. Para más, te manda a Fotocasa Pro (
          <Source href={S.milanunciosPro}>ayuda de Milanuncios</Source>). Sus planes PRO generales
          no son tarifas de inmobiliaria.
        </li>
      </ul>

      <h2>Lo que se publica por ahí, sin verificar</h2>
      <p>
        Como los portales no publican sus tarifas, las cifras que encontrarás en internet son de
        blogs, de agencias y de otros CRM. Ninguna dice de dónde sale, y no las hemos podido
        comprobar. Las ponemos con su fuente y su fecha porque son las que vas a leer en otras
        páginas.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Portal</th>
            <th scope="col">Lo que se ha publicado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">Idealista</th>
            <td>
              “Desde 60 €/mes + IVA”, y más de 300 € según zona y servicios (
              <Source href={S.reportInmogesco}>inmoGesco</Source>, actualizado en abril de 2026)
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Idealista</th>
            <td>
              Desde 150 €/mes (<Source href={S.reportInmolovers}>Inmolovers</Source>, 11 de
              febrero de 2026)
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Idealista</th>
            <td>
              Entre 200 y 500 €/mes solo por estar, con una media de unos 1.000 € (
              <Source href={S.reportPsi}>Diario de un PSI</Source>, 25 de junio de 2025,
              artículo de opinión)
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Fotocasa y habitaclia</th>
            <td>
              Fotocasa desde 100 €/mes y habitaclia desde 80 €/mes (
              <Source href={S.reportInmolovers}>Inmolovers</Source>, 11 de febrero de 2026)
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">pisos.com</th>
            <td>
              Desde 50 €/mes (<Source href={S.reportInmolovers}>Inmolovers</Source>, 11 de febrero
              de 2026)
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">yaencontre</th>
            <td>
              Desde 60 €/mes (<Source href={S.reportInmolovers}>Inmolovers</Source>, 11 de febrero
              de 2026)
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Que las cifras no cuadren entre sí tiene explicación: el precio depende de la zona, del
        número de anuncios, de los extras (destacados, otros idiomas, otros portales del mismo
        grupo) y de lo que se negocie con el comercial, permanencia incluida.
      </p>

      <h2>Portales internacionales</h2>
      <p>
        En la Costa del Sol y la Costa Blanca buena parte de los compradores llega desde fuera, y
        aquí sí hay portales que publican sus precios.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Portal</th>
            <th scope="col">Precio para agencias</th>
            <th scope="col">Lo que declaran</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">Kyero</th>
            <td>Bajo consulta; sin anuncios gratis desde el 1 de enero de 2026</td>
            <td>3 millones de compradores y 70.000 consultas al mes</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">ThinkSpain</th>
            <td>Publicado: desde 118 € + IVA por 90 días (25 anuncios)</td>
            <td>Más de 1 millón de visitantes y 50.000 consultas al mes</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Properstar</th>
            <td>Publicado: desde 132,50 €/mes (20 anuncios, pago anual)</td>
            <td>35 países y más de 80 portales asociados</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Spainhouses</th>
            <td>Publicado: desde 36 €/mes (25 anuncios, oferta Málaga)</td>
            <td>Descuentos por pago trimestral, semestral y anual</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">FINN.no</th>
            <td>Publicado: por anuncio, de 2.360 a 571 coronas noruegas + IVA</td>
            <td>Sección de viviendas en el extranjero de Noruega</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Rightmove Overseas</th>
            <td>Bajo consulta</td>
            <td>Más de 26 millones de visitantes al año</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">Green-Acres</th>
            <td>Bajo consulta; prueba gratis de 30 días</td>
            <td>70% de visitantes extranjeros</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">JamesEdition</th>
            <td>Bajo consulta; viviendas desde 490.000 $</td>
            <td>Más de 2,4 millones de visitas al mes</td>
          </tr>
        </tbody>
      </table>

      <h3>Kyero</h3>
      <ul>
        <li>
          <strong>Ya no es gratis:</strong> dejó de publicar anuncios gratuitos el 31 de diciembre
          de 2025, y desde el 1 de enero de 2026 solo aparecen las agencias que pagan (
          <Source href={S.kyeroEndsFree}>Kyero, noviembre de 2025</Source>).
        </li>
        <li>
          <strong>Precio:</strong> una suscripción de pago, sin tarifa publicada: hay que contactar con Kyero (<Source href={S.kyeroFeatures}>Kyero</Source>).
        </li>
        <li>
          <strong>IVA:</strong> la empresa es británica (Portal 47 Ltd). No cobra IVA español, ni IVA británico a empresas registradas en la UE (
          <Source href={S.kyeroVat}>ayuda de Kyero</Source>).
        </li>
        <li>
          <strong>Anuncios y contactos:</strong> importa tu cartera en su formato XML, que leen
          más de 50 programas, y te manda las consultas por correo, a dos direcciones como máximo
          (<Source href={S.kyeroXml}>especificación XML</Source>,{" "}
          <Source href={S.kyeroEmails}>direcciones de correo</Source>).
        </li>
        <li>
          <strong>Público:</strong> sus visitas únicas de 12 meses vienen sobre todo del Reino
          Unido (4,2 millones), España (3,25), Países Bajos (1,7), Alemania (1,55), Francia (1,35) y
          Estados Unidos (1,05) (<Source href={S.kyeroJoin}>Kyero para agencias</Source>).
        </li>
      </ul>

      <h3>ThinkSpain</h3>
      <p>
        Packs de introducción de 90 días para agencias nuevas o que llevan más de un año sin
        anunciarse, IVA no incluido. Cuota fija, sin comisión, y las consultas te llegan por
        correo y al panel (<Source href={S.thinkspain}>ThinkSpain para agencias</Source>):
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Anuncios</th>
            <th scope="col">Precio por 90 días</th>
            <th scope="col">Destacados</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>25</td>
            <td>118 €</td>
            <td>1</td>
          </tr>
          <tr>
            <td>50</td>
            <td>161 €</td>
            <td>2</td>
          </tr>
          <tr>
            <td>100</td>
            <td>227 €</td>
            <td>5</td>
          </tr>
          <tr>
            <td>250</td>
            <td>377 €</td>
            <td>10</td>
          </tr>
          <tr>
            <td>500</td>
            <td>625 €</td>
            <td>25</td>
          </tr>
        </tbody>
      </table>
      <p>
        La misma página habla de “desde 25 euros al mes” con pago anual, sin publicar la tabla
        anual.
      </p>

      <h3>Properstar</h3>
      <p>
        Properstar, que ya integra ListGlobally, publica tres planes en euros, sin decir si el IVA
        está incluido; por encima de 100 anuncios, bajo consulta (
        <Source href={S.properstarPricing}>precios de Properstar</Source>):
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Plan</th>
            <th scope="col">Pago anual</th>
            <th scope="col">Pago semestral</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Global 20</td>
            <td>132,50 €/mes</td>
            <td>150 €/mes</td>
          </tr>
          <tr>
            <td>Global 50</td>
            <td>225 €/mes</td>
            <td>248,33 €/mes</td>
          </tr>
          <tr>
            <td>Global 100</td>
            <td>366,67 €/mes</td>
            <td>406,67 €/mes</td>
          </tr>
        </tbody>
      </table>
      <p>
        Se paga por adelantado y se renueva solo: para darte de baja, avisa al menos 30 días antes
        de la renovación (<Source href={S.properstarCancel}>ayuda de Properstar</Source>). Lee el
        XML de Kyero, entre otros formatos, y te manda los contactos por correo o directamente a
        tu CRM.
      </p>

      <h3>Spainhouses.net</h3>
      <p>
        Publica sus precios en una calculadora por provincia. Con la oferta de Málaga, sin indicar
        IVA (<Source href={S.spainhouses}>precios de Spainhouses</Source>):
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Anuncios</th>
            <th scope="col">Pago mensual</th>
            <th scope="col">Pago anual</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>25</td>
            <td>36 €/mes</td>
            <td>345,60 € (28,80 €/mes)</td>
          </tr>
          <tr>
            <td>50</td>
            <td>54 €/mes</td>
            <td>518,40 €</td>
          </tr>
          <tr>
            <td>100</td>
            <td>96 €/mes</td>
            <td>921,60 €</td>
          </tr>
          <tr>
            <td>250</td>
            <td>126 €/mes</td>
            <td>1.209,60 €</td>
          </tr>
          <tr>
            <td>500</td>
            <td>156 €/mes</td>
            <td>1.497,60 €</td>
          </tr>
        </tbody>
      </table>

      <p>
        Pagando por adelantado baja el precio: un 10% menos por trimestre, un 15% por semestre y
        un 20% por año.
      </p>

      <h3>FINN.no (Noruega)</h3>
      <p>
        El gran portal noruego tiene una sección de viviendas en el extranjero en la que se
        anuncian agencias españolas. Cobra por anuncio, más barato cuanto más publicas, en coronas
        noruegas y sin IVA, con tarifas nuevas a partir del 5 de enero de 2027 (
        <Source href={S.finn}>tarifas de FINN</Source>):
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Anuncios</th>
            <th scope="col">Coronas por anuncio</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1–10</td>
            <td>2.360</td>
          </tr>
          <tr>
            <td>11–50</td>
            <td>1.636</td>
          </tr>
          <tr>
            <td>51–100</td>
            <td>1.319</td>
          </tr>
          <tr>
            <td>101–250</td>
            <td>821</td>
          </tr>
          <tr>
            <td>250–499</td>
            <td>726</td>
          </tr>
          <tr>
            <td>500 o más</td>
            <td>571</td>
          </tr>
        </tbody>
      </table>

      <h3>Rightmove Overseas, Green-Acres y JamesEdition</h3>
      <ul>
        <li>
          <strong>Rightmove Overseas</strong>: rellenas un formulario y te llama un gestor de
          cuentas, en un plazo de 3 a 5 días laborables (
          <Source href={S.rightmove}>Rightmove Overseas</Source>).
        </li>
        <li>
          <strong>Green-Acres</strong>: prueba gratis de 30 días sin compromiso y precio a medida;
          el 70% de sus visitantes son extranjeros, sobre todo de Países Bajos, Alemania, Reino
          Unido y Bélgica (<Source href={S.greenAcres}>Green-Acres para profesionales</Source>).
        </li>
        <li>
          <strong>JamesEdition</strong>, de lujo: planes Elite y Elite Plus con precio a medida, y
          viviendas desde 490.000 dólares (
          <Source href={S.jamesEdition}>JamesEdition para profesionales</Source>).
        </li>
      </ul>
      <p>
        Y no olvides el alcance de idealista fuera de España: tiene 18 versiones en otros idiomas
        y traduce tus anuncios al inglés automáticamente (
        <Source href={S.idealistaTranslate}>ayuda de idealista/tools</Source>).
      </p>

      <h2>Qué ha cambiado en 2025 y 2026</h2>
      <dl>
        <dt>Junio de 2024</dt>
        <dd>
          El fondo Cinven compra el control de idealista (<Source href={S.newsCinven}>elDiario.es</Source>
          ).
        </dd>
        <dt>Marzo de 2025</dt>
        <dd>
          Immobiliare.it compra pisos.com a Vocento (
          <Source href={S.newsPisos}>Online Marketplaces</Source>).
        </dd>
        <dt>Septiembre de 2025</dt>
        <dd>
          Scout24, dueño de ImmoScout24, acuerda comprar Fotocasa y habitaclia; la compra se
          cierra en marzo de 2026 y las marcas siguen por separado (
          <Source href={S.newsScout24}>Scout24</Source>,{" "}
          <Source href={S.newsScout24Close}>Online Marketplaces</Source>). Ese mismo mes, idealista
          renuncia a comprar Kyero por las condiciones de la CNMC (
          <Source href={S.newsKyeroDeal}>Forbes</Source>).
        </dd>
        <dt>31 de diciembre de 2025</dt>
        <dd>Kyero deja de publicar anuncios gratis.</dd>
      </dl>

      <h2>Antes de firmar con un portal: qué preguntar</h2>
      <ol>
        <li>El precio para tu zona y tu número de anuncios, por escrito.</li>
        <li>La permanencia mínima, si se renueva solo y con cuánto preaviso te puedes ir.</li>
        <li>Si el precio lleva el IVA incluido.</li>
        <li>
          Qué entra en el paquete: destacados, otros idiomas, otros portales del mismo grupo.
        </li>
        <li>
          Cómo te llegan los contactos: correo, app o llamadas, y si puedes reenviarlos a otra
          dirección.
        </li>
        <li>Qué formato de carga acepta y si tu CRM ya está conectado.</li>
        <li>Cuántos contactos reciben al mes anuncios como los tuyos en tu zona.</li>
      </ol>

      <h2>Los contactos de cada portal, en una sola lista</h2>
      <p>
        Con dos o tres portales, los contactos te llegan por el Inbox de idealista, los avisos de
        Fotocasa, los correos de Kyero y el WhatsApp, y ninguno de esos buzones te dice a quién
        tienes que volver a escribir. {SITE_NAME} es un CRM para agentes independientes que los
        junta en una lista, cada uno con su siguiente paso.
      </p>
      <p>
        Hoy funciona pegando: copias la consulta del portal, la pegas en la caja de leads y te
        devuelve la ficha rellena para revisar. No hay integración automática con los portales. Es
        gratis hasta 10 clientes; los detalles, en <Link href={marketingPath("pricing", L)}>precios</Link>{" "}
        y en <Link href={marketingPath("guideIdealista", L)}>cómo gestionar los leads de idealista</Link>
        .
      </p>

      <h2>Fuentes</h2>
      <p>Las webs de los portales, comprobadas el {AS_OF}.</p>
      <ul>
        <li>
          Idealista: <Source href={S.idealistaPro}>profesionales</Source>,{" "}
          <Source href={S.idealistaPrivate}>precios para particulares</Source>,{" "}
          <Source href={S.idealistaAgentAccount}>cuentas de agentes</Source>,{" "}
          <Source href={S.idealistaInbox}>Inbox</Source>,{" "}
          <Source href={S.idealistaSoftware}>software recomendado</Source>,{" "}
          <Source href={S.idealistaTranslate}>traducción automática</Source>.
        </li>
        <li>
          Fotocasa Pro: <Source href={S.fotocasaPacks}>packs</Source>,{" "}
          <Source href={S.fotocasaAbout}>Fotocasa</Source>,{" "}
          <Source href={S.habitacliaAbout}>habitaclia</Source>,{" "}
          <Source href={S.fotocasaLeads}>gestor de oportunidades</Source>; conexión por
          InmoFactory, <Source href={S.witeiInmofactory}>ayuda de Witei</Source>.
        </li>
        <li>
          <Source href={S.pisosPro}>pisos.com</Source>,{" "}
          <Source href={S.yaencontrePro}>yaencontre</Source>,{" "}
          <Source href={S.milanunciosPro}>Milanuncios</Source>.
        </li>
        <li>
          Kyero: <Source href={S.kyeroEndsFree}>fin de los anuncios gratis</Source>,{" "}
          <Source href={S.kyeroFeatures}>planes</Source>, <Source href={S.kyeroVat}>IVA</Source>,{" "}
          <Source href={S.kyeroXml}>XML</Source>,{" "}
          <Source href={S.kyeroEmails}>correos de contacto</Source>,{" "}
          <Source href={S.kyeroJoin}>audiencia</Source>.
        </li>
        <li>
          <Source href={S.thinkspain}>ThinkSpain</Source>,{" "}
          <Source href={S.properstarPricing}>Properstar</Source> (y{" "}
          <Source href={S.properstarCancel}>sus condiciones</Source>),{" "}
          <Source href={S.spainhouses}>Spainhouses.net</Source>,{" "}
          <Source href={S.finn}>FINN.no</Source>, <Source href={S.rightmove}>Rightmove Overseas</Source>
          , <Source href={S.greenAcres}>Green-Acres</Source>{" "}
          y <Source href={S.jamesEdition}>JamesEdition</Source>.
        </li>
        <li>
          Cifras sin verificar: <Source href={S.reportInmogesco}>inmoGesco</Source>,{" "}
          <Source href={S.reportInmolovers}>Inmolovers</Source>,{" "}
          <Source href={S.reportPsi}>Diario de un PSI</Source>.
        </li>
        <li>
          Noticias: <Source href={S.newsCinven}>elDiario.es</Source>,{" "}
          <Source href={S.newsPisos}>Online Marketplaces (pisos.com)</Source>,{" "}
          <Source href={S.newsScout24}>Scout24</Source>,{" "}
          <Source href={S.newsScout24Close}>Online Marketplaces (Fotocasa)</Source>,{" "}
          <Source href={S.newsKyeroDeal}>Forbes</Source>.
        </li>
      </ul>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Tarifas de Idealista y Fotocasa para profesionales (2026)",
  description:
    "Idealista y Fotocasa no publican sus tarifas para agencias. Qué cobra cada portal nacional e internacional, qué precios son oficiales y cuáles no, con fuentes.",
  kind: "article",
  published: FIRST_PUBLISHED,
  modified: LAST_CHECKED,
  eyebrow: "Guía · Portales",
  heading: "Cuánto cobran Idealista, Fotocasa y los portales internacionales a una inmobiliaria",
  lead: "Ningún portal nacional publica tarifas para profesionales: Idealista, Fotocasa y habitaclia, pisos.com y yaencontre dan el precio en una llamada comercial, según la zona y el número de anuncios. De los portales que usan las agencias de la costa, solo ThinkSpain, Properstar, Spainhouses y FINN.no publican sus precios. Las cifras que circulan para Idealista vienen de blogs sin fuente, y Kyero dejó de ser gratis el 31 de diciembre de 2025.",
  Body,
  faq: [
    {
      q: "¿Cuánto cuesta Idealista para una inmobiliaria?",
      a: "Idealista no publica sus tarifas para profesionales: las da su equipo comercial según la zona, el número de anuncios y los servicios. Las cifras que circulan, desde 60 o 150 €/mes hasta medias de 1.000 €, vienen de blogs y de otros CRM sin fuente, y no están verificadas.",
    },
    {
      q: "¿Puede un agente inmobiliario publicar gratis en Idealista?",
      a: "No. Idealista pide a las agencias y a los agentes un perfil profesional, de pago, y puede bloquear una cuenta de particular que use un agente. Los dos anuncios gratis son para particulares.",
    },
    {
      q: "¿Cuánto cuesta Fotocasa Pro?",
      a: "Fotocasa Pro vende tres packs, Start, Basic y Premium, que publican en Fotocasa, habitaclia y Milanuncios, pero no publica sus precios: se piden al equipo comercial.",
    },
    {
      q: "¿Kyero sigue siendo gratis para las agencias?",
      a: "No. Kyero dejó de publicar anuncios gratis el 31 de diciembre de 2025 y desde el 1 de enero de 2026 solo aparecen las agencias que pagan una suscripción, con precio bajo consulta.",
    },
    {
      q: "¿Qué portales internacionales publican sus precios para agencias?",
      a: "De los que usan las agencias de la costa, ThinkSpain (packs de 90 días desde 118 € + IVA), Properstar (desde 132,50 €/mes con pago anual), Spainhouses.net (desde 36 €/mes con la oferta de Málaga) y el noruego FINN.no (por anuncio). Kyero, Rightmove Overseas, Green-Acres y JamesEdition dan precio bajo consulta.",
    },
  ],
  related: ["guideIdealista", "crmMarbella", "toolCommission"],
};
