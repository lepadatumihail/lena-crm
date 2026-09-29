import Link from "next/link";

import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { TrackerDownload } from "@/components/tools/tracker-download";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { STALE_AFTER_DAYS } from "@/lib/attention";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME } from "@/lib/site";
import { XLSX_TYPE, trackerPath } from "@/lib/tools/tracker-files";

const PUBLISHED_ON = "2026-09-29";
const home = marketingPath("home", "es");

function Tracker() {
  return <TrackerDownload locale="es" asOf={PUBLISHED_ON} />;
}

function Body() {
  return (
    <>
      <h2>Qué trae la plantilla</h2>
      <p>
        Es una plantilla Excel inmobiliaria pensada para un agente, no para una oficina: tu base
        de datos de clientes inmobiliaria en un archivo que es tuyo. Tiene tres hojas.
        Compradores y Vendedores llevan un cliente por fila, con las mismas columnas que usa{" "}
        {SITE_NAME}, así que al importar el archivo todas las columnas encajan solas. Cómo usarla
        resume esta página y recoge las palabras que aceptan columnas como Etapa y Prioridad.
      </p>
      <p>La hoja Compradores tiene estas columnas:</p>
      <dl>
        <dt>El cliente</dt>
        <dd>
          Nombre, Apellidos, Email, Teléfono, Idioma, Nacionalidad y Agencia: la agencia por la
          que te llegó el lead, si trabajas con varias.
        </dd>
        <dt>En qué punto está</dt>
        <dd>
          Etapa (Nuevo, Contactado, Cualificado, Visita o Reservado), Tipo de operación (Directo o
          Colaboración), Prioridad y Activo.
        </dd>
        <dt>Qué busca</dt>
        <dd>Presupuesto mín. y máx., Tipos de propiedad, Dormitorios, Baños y Notas de zona.</dd>
        <dt>Tu seguimiento</dt>
        <dd>
          Notas, Último contacto, Próximo seguimiento y Días sin contacto, que se calcula solo a
          partir de Último contacto.
        </dd>
      </dl>
      <p>
        La hoja Vendedores cambia la búsqueda por la propiedad: Rol (Propietario o
        Representante), Tipo de propiedad, Precio, Dormitorios, Dirección, Ciudad / zona y Notas
        de la propiedad. Un vendedor con dos propiedades ocupa dos filas, y {SITE_NAME} las junta
        en un solo cliente al importar.
      </p>

      <h2>Cómo funcionan los colores</h2>
      <p>
        Mandan dos fechas. Cuando hables con un cliente, pon la fecha en Último contacto. Cuando
        toque volver a contactar, pon esa fecha en Próximo seguimiento.
      </p>
      <ul>
        <li>
          Una fila se pone ámbar el día que llega su Próximo seguimiento, y sigue así hasta que
          cambies la fecha. Son las llamadas de hoy.
        </li>
        <li>
          Una fila se pone gris cuando Días sin contacto llega a {STALE_AFTER_DAYS}: una semana
          sin noticias, justo cuando el propio {SITE_NAME} marca a un comprador como enfriado.
        </li>
        <li>
          Si una fila cumple las dos cosas, se queda en ámbar, porque un seguimiento pendiente
          importa más.
        </li>
      </ul>
      <p>No hace falta actualizar nada: los colores miran la fecha de hoy cada vez que abres el archivo.</p>

      <h2>En Excel, Google Sheets o Numbers</h2>
      <p>Es un Excel para inmobiliarias gratis, en formato .xlsx normal.</p>
      <ul>
        <li>
          <strong>Excel</strong>, en Windows, en Mac o en la web, lo abre tal cual, con los
          colores y la cuenta de días funcionando. Escribe las fechas con el año primero, como
          2026-09-29, o como las escribas normalmente; la plantilla las muestra con el año primero.
        </li>
        <li>
          <strong>Google Sheets</strong>: sube el archivo a Google Drive y ábrelo con Google
          Sheets, o crea una hoja en blanco y usa Archivo → Importar. Los colores y la cuenta de
          días se mantienen.
        </li>
        <li>
          <strong>Numbers</strong> también lo abre, con tus datos y la cuenta de días. Numbers
          gestiona las reglas de color a su manera, así que puede que allí las filas se queden en
          blanco.
        </li>
      </ul>

      <h2>Cuándo una hoja de cálculo se queda corta</h2>
      <p>
        Una hoja de cálculo es un buen punto de partida, y muchos agentes trabajan con una
        durante años. Pero tiene límites, y se notan cuando la lista crece:
      </p>
      <ul>
        <li>
          No te avisa. El ámbar solo se ve cuando abres el archivo; nada en tu móvil te dice que
          toca un seguimiento.
        </li>
        <li>
          No escribe nada. Cada seguimiento empieza con un mensaje en blanco, en el idioma que
          hable el cliente.
        </li>
        <li>
          Vive en un solo sitio. La copia del portátil y la del móvil se van separando, y las
          visitas, las ofertas y los documentos acaban en la columna Notas.
        </li>
      </ul>

      <h2>Pasarla a {SITE_NAME}</h2>
      <p>
        <Link href={home}>{SITE_NAME}</Link> es un CRM para agentes inmobiliarios independientes
        en España, y este archivo es su plantilla de importación con un seguimiento alrededor.
        Pasarte lleva tres pasos:
      </p>
      <ol>
        <li>
          <strong>Inicia sesión</strong> con Google o con un código por email, sin inventar
          contraseñas.
        </li>
        <li>
          <strong>Sube tu Excel.</strong> Abre Compradores, elige Importar desde una hoja de
          cálculo y escoge la hoja Compradores. Todas las columnas encajan ya: ves una vista
          previa y puedes deshacer toda la importación con un clic. Luego haz lo mismo en
          Vendedores con la hoja Vendedores.
        </li>
        <li>
          <strong>Envía el primer seguimiento.</strong> Abre un comprador que se ha quedado
          callado. El mensaje ya está redactado en su idioma; lo lees, lo retocas y lo envías.
        </li>
      </ol>
      <p>
        Último contacto y Próximo seguimiento entran como líneas en las notas de cada cliente, y
        Días sin contacto se queda fuera. A partir de ahí, cada contacto que registres en{" "}
        {SITE_NAME} guarda esa fecha por ti. Es gratis hasta {FREE_CLIENT_LIMIT} clientes.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Plantilla Excel gratis para agentes inmobiliarios",
  description:
    "Plantilla Excel gratis para tus clientes inmobiliarios: compradores y vendedores, seguimientos pendientes en ámbar y columnas que se importan a LeadWing.",
  kind: "tool",
  published: PUBLISHED_ON,
  eyebrow: "Herramienta gratuita",
  heading: "Plantilla Excel gratis para llevar tus clientes inmobiliarios",
  lead: "Compradores y vendedores en un solo Excel, con los seguimientos pendientes en ámbar y los clientes que se enfrían en gris. Descárgala sin dejar tu email.",
  Body,
  faq: [
    {
      q: "¿La plantilla es gratis?",
      a: "Sí. La descargas sin cuenta y sin dejar tu email, y la usas el tiempo que quieras. Es un archivo Excel que te quedas, no una prueba.",
    },
    {
      q: "¿Funciona en Google Sheets?",
      a: "Sí. Sube el archivo a Google Drive y ábrelo con Google Sheets, o usa Archivo → Importar en una hoja en blanco. Los colores y la cuenta de días se mantienen.",
    },
    {
      q: "¿Puedo añadir mis propias columnas?",
      a: "Sí, todas las que necesites. Cuando importes el archivo a LeadWing, cada columna extra entra como una línea en las notas del cliente.",
    },
    {
      q: "¿Cómo la importo a LeadWing?",
      a: "Inicia sesión, abre Compradores, elige Importar desde una hoja de cálculo y escoge la hoja Compradores: todas las columnas encajan ya. Haz lo mismo en Vendedores con la hoja Vendedores. Primero ves una vista previa, y puedes deshacer la importación con un clic.",
    },
    {
      q: "¿Qué significan los colores?",
      a: `Ámbar: la fecha de Próximo seguimiento es hoy o ya ha pasado, así que ese cliente te está esperando. Gris: han pasado ${STALE_AFTER_DAYS} días o más desde la fecha de Último contacto. Si se cumplen las dos cosas, la fila se queda en ámbar.`,
    },
  ],
  related: ["toolCommission", "guideFollowUp", "pricing"],
  tool: {
    Component: Tracker,
    schema: {
      "@type": "SpreadsheetDigitalDocument",
      encodingFormat: XLSX_TYPE,
      contentPath: trackerPath("es"),
    },
  },
};
