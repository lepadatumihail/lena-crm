import Link from "next/link";

import { intlTag } from "@/i18n/config";
import { marketingPath } from "@/lib/routes";
import { PUBLISHED } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";

const L = "es";

/**
 * El día en que se comprobó por última vez cada dato frente a su fuente. Es
 * también la fecha de "Actualizado", así que la revisión mensual sube
 * PUBLISHED.guideAndaluciaRegister aunque no haya cambiado nada.
 */
const AS_OF = new Intl.DateTimeFormat(intlTag(L), {
  dateStyle: "long",
  timeZone: "UTC",
}).format(new Date(PUBLISHED.guideAndaluciaRegister));

// La Ley 5/2025 en el BOE, texto consolidado; las anclas son las del propio BOE.
const LAW = "https://www.boe.es/buscar/act.php?id=BOE-A-2026-423";
const ART_49 = `${LAW}#a4-11`;
const ART_50 = `${LAW}#a5-2`;
const ART_51 = `${LAW}#a5-3`;
const ART_52 = `${LAW}#a5-4`;
const ART_53 = `${LAW}#a5-5`;
const ADDITIONAL_1 = `${LAW}#da`;
const FINAL_7 = `${LAW}#df-7`;
const FINAL_8 = `${LAW}#df-8`;
const LAW_BOJA = "https://www.juntadeandalucia.es/boja/2025/247/1";
const TALKS_BOE = "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-8197";
const TALKS_BOJA = "https://www.juntadeandalucia.es/boja/2026/69/32";
const JUNTA_NEWS =
  "https://www.juntadeandalucia.es/organismos/avra/servicios/actualidad/noticias/detalle/684223.html";
const DECREE_197 = "https://www.juntadeandalucia.es/boja/2026/515/9";
const LEY_10_2003 = "https://www.boe.es/buscar/act.php?id=BOE-A-2003-10185#a3";
const BOJA_SEARCH =
  "https://www.juntadeandalucia.es/eboja/buscador/search.do?eboja=on&q=%22Agentes+Inmobiliarios+Especializados%22";

function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

/** El texto literal y dónde leerlo. */
function Quote({
  where,
  href,
  children,
}: {
  where: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <blockquote>“{children}”</blockquote>
      <div className="text-muted-foreground mt-2 text-sm">
        <Source href={href}>{where}</Source>
      </div>
    </>
  );
}

function Body() {
  return (
    <>
      <Callout title={`Situación a ${AS_OF}`}>
        <ul>
          <li>
            La ley vigente sigue diciendo que la inscripción es un requisito para ejercer como
            agente inmobiliario en Andalucía (art. 50.3).
          </li>
          <li>
            Todavía no hay registro en el que inscribirse: no se han publicado ni sus normas ni
            sus formularios, y la ley da a la Junta hasta el 24 de enero de 2028 para ponerlo en
            marcha.
          </li>
          <li>
            El 18 de septiembre de 2026 la Junta anunció que cambiará la ley para que la
            inscripción deje de ser un requisito para ejercer. No se ha publicado ni el texto de
            la reforma ni una fecha.
          </li>
        </ul>
        <p>Esta página cita y enlaza los textos oficiales. No es asesoramiento jurídico.</p>
      </Callout>

      <h2>Qué es el registro</h2>
      <p>
        La Ley 5/2025, de Vivienda de Andalucía, creó el Registro de Agentes Inmobiliarios
        Especializados del Sector Residencial de Andalucía, un registro de los agentes que
        trabajan con viviendas en Andalucía. La ley se publicó en el BOJA el 24 de diciembre de
        2025 y en el BOE el 8 de enero de 2026, y está en vigor desde el 24 de enero de 2026 (
        <Source href={FINAL_8}>disposición final octava</Source>).
      </p>
      <p>
        La ley lo define como un registro público, administrativo, gratuito y obligatorio,
        adscrito a la consejería competente en materia de vivienda (
        <Source href={ART_50}>art. 50</Source>). Está pensado para toda persona que se dedique
        de forma habitual y retribuida, profesional o empresarialmente, a la intermediación, el
        asesoramiento y la gestión en la compra, el alquiler, la permuta o la cesión de viviendas
        (<Source href={ART_49}>art. 49.1</Source>).
      </p>
      <p>
        La inscripción se haría mediante una declaración responsable, presentada antes de empezar
        a ejercer, de que se cumplen los requisitos, y la Administración puede pedir en cualquier
        momento los documentos que lo acrediten. Habría que renovarla periódicamente (
        <Source href={ART_51}>art. 51</Source>).
      </p>

      <h2>Qué dice hoy la Ley 5/2025</h2>
      <p>
        El texto no ha cambiado desde su publicación: la versión consolidada del BOE sigue siendo
        la original, y la única corrección de errores publicada desde entonces, en marzo de 2026,
        arregla un desliz en la lista de normas derogadas. Estos son los pasajes que le importan
        a un agente.
      </p>
      <Quote where="Art. 49.1" href={ART_49}>
        …y que deberá inscribirse obligatoriamente en el registro que se creará al efecto por la
        Consejería competente en materia de vivienda.
      </Quote>
      <Quote where="Art. 50.3" href={ART_50}>
        La inscripción en el Registro será requisito necesario para el ejercicio de la actividad
        en el ámbito de la Comunidad Autónoma de Andalucía.
      </Quote>
      <Quote where="Art. 50.4" href={ART_50}>
        Reglamentariamente, se determinarán y desarrollarán los requisitos y las normas de
        organización y funcionamiento.
      </Quote>
      <Quote where="Disposición final séptima" href={FINAL_7}>
        En el plazo máximo de dos años desde la entrada en vigor de la presente ley, la
        Consejería competente en materia de vivienda adoptará las medidas necesarias para la
        creación, regulación y puesta en funcionamiento del Registro…
      </Quote>
      <p>
        Es decir, la ley hace obligatoria la inscripción, pero deja para más adelante el propio
        registro, sus normas de detalle y sus formularios. Los dos años cuentan desde el 24 de
        enero de 2026, así que el plazo acaba el 24 de enero de 2028. Los modelos de declaración
        los aprobará una resolución de la Secretaría General de Vivienda (
        <Source href={ADDITIONAL_1}>disposición adicional primera</Source>), y un decreto de
        julio de 2026 encargó a esa misma secretaría general “el desarrollo y coordinación” del
        registro (<Source href={DECREE_197}>Decreto 197/2026, art. 6.2.n</Source>). El {AS_OF},
        una <Source href={BOJA_SEARCH}>búsqueda en el BOJA por el nombre del registro</Source>{" "}
        devolvía esos dos textos y ninguno más.
      </p>

      <h2>Qué cambió el 18 de septiembre de 2026</h2>
      <p>
        El Gobierno de España planteó discrepancias sobre parte de la ley, y los dos gobiernos
        acordaron negociar sobre 16 de sus artículos y una disposición final, entre ellos los
        cuatro del registro (del 49 al 52). Ese acuerdo se publicó en el{" "}
        <Source href={TALKS_BOE}>BOE</Source> y en el <Source href={TALKS_BOJA}>BOJA</Source> el
        13 de abril de 2026.
      </p>
      <p>
        El 18 de septiembre de 2026 la Junta anunció que la negociación había terminado en un
        acuerdo que, según explica, cierra la controversia sin recurso ante el Tribunal
        Constitucional. Sobre el registro, <Source href={JUNTA_NEWS}>su nota</Source> dice:
      </p>
      <Quote where="Junta de Andalucía, 18 de septiembre de 2026" href={JUNTA_NEWS}>
        …la Junta promoverá los ajustes legislativos necesarios para eliminar la inscripción
        obligatoria como requisito para acceder a la actividad y adecuar su regulación a los
        principios de proporcionalidad y unidad de mercado. Asimismo, se precisará el carácter
        alternativo de los requisitos establecidos y la aplicación de la normativa estatal en
        materia de colegiación.
      </Quote>
      <p>Dicho de forma sencilla, se anuncian tres cambios:</p>
      <ul>
        <li>la inscripción dejaría de ser un requisito para ejercer como agente en Andalucía;</li>
        <li>la ley dejaría claro que sus requisitos son alternativos;</li>
        <li>se aplicaría la normativa estatal sobre colegiación.</li>
      </ul>
      <p>
        La nota no da fecha ni texto. A {AS_OF} no se había publicado en el BOE ni en el BOJA ni
        el acuerdo ni ninguna ley que modifique la Ley 5/2025.
      </p>

      <h2>Qué significa para ti</h2>
      <p>
        Esta sección solo resume los textos anteriores. No dice si una persona concreta cumple o
        no los requisitos.
      </p>
      <h3>Qué se aplica hoy</h3>
      <ul>
        <li>
          El texto de la ley sigue exigiendo la inscripción (
          <Source href={ART_50}>art. 50.3</Source>) y no se ha modificado.
        </li>
        <li>
          El registro no se ha puesto en marcha, así que no hay registro en el que inscribirse ni
          declaración que presentar.
        </li>
        <li>
          La normativa estatal sigue permitiendo que personas físicas o jurídicas ejerzan la
          intermediación inmobiliaria “sin necesidad de estar en posesión de título alguno, ni de
          pertenencia a ningún colegio oficial”, sin perjuicio de los requisitos que, por razones
          de protección a los consumidores, establezca la normativa reguladora de esta actividad (
          <Source href={LEY_10_2003}>Ley 10/2003, art. 3</Source>).
        </li>
      </ul>
      <h3>Qué vigilar</h3>
      <ol>
        <li>
          <strong>El texto del acuerdo</strong>, publicado en el BOE y en el BOJA. Es el texto
          oficial de lo que acordaron los dos gobiernos; la nota de prensa es un resumen.
        </li>
        <li>
          <strong>Una ley o un decreto-ley que modifique los arts. 49 a 52</strong>, publicado en
          el BOJA. Mientras no se publique, rige el texto actual.
        </li>
        <li>
          <strong>El decreto que cree y regule el registro</strong>, y la resolución que apruebe
          sus formularios.
        </li>
        <li>
          <strong>El 24 de enero de 2028</strong>, el plazo de la disposición final séptima,
          salvo que la reforma lo cambie.
        </li>
      </ol>
      <p>
        Esta página está fechada. Cuando se publique cualquiera de estas cosas, la actualizamos
        junto con la fecha de arriba.
      </p>

      <h2>Los requisitos, tal como los escribe la ley</h2>
      <p>
        Estas son las condiciones para inscribirse en el registro según los arts. 51 a 53, tal
        como se publicaron. La Junta ha anunciado que la reforma precisará que los requisitos son
        alternativos y que se aplica la normativa estatal sobre colegiación, así que léelos como
        el texto actual, no como la lista definitiva.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Requisito</th>
            <th scope="col">Qué dice la ley</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">
              Capacitación, <Source href={ART_52}>art. 52.1</Source>
            </th>
            <td>
              Se enumeran cuatro: (a) título oficial de Agente de la Propiedad Inmobiliaria (API);
              (b) titulación universitaria de la rama de ciencias sociales y jurídicas, ingeniería
              o arquitectura; (c) al menos cuatro años de experiencia en la actividad
              inmediatamente anteriores a la solicitud, acreditados con el informe de vida
              laboral, el alta en autónomos o un contrato de franquicia inmobiliaria de esos años;
              (d) estar colegiado en un Colegio Oficial de Agentes de la Propiedad Inmobiliaria.
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Sociedades, <Source href={ART_52}>art. 52.1</Source>
            </th>
            <td>
              Los requisitos los debe cumplir al menos una de las personas administradoras o del
              consejo de administración, y también la persona responsable del establecimiento
              abierto al público.
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Formación, <Source href={ART_52}>art. 52.2</Source>
            </th>
            <td>
              Formación oficial de al menos 100 horas lectivas en intermediación inmobiliaria
              residencial y vivienda protegida, obtenida en los cuatro años anteriores a la
              declaración, para el titular de la actividad y el 50% de sus empleados. Presencial,
              a distancia o virtual, en los tipos de centro que enumera el artículo.
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Garantía o seguro, <Source href={ART_53}>arts. 52.3 y 53</Source>
            </th>
            <td>
              Una de las dos: una garantía financiera que responda de las cantidades recibidas en
              el ejercicio de la actividad, o un seguro de responsabilidad civil profesional. Los
              importes mínimos quedan para un reglamento, en función del volumen de negocio.
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Antecedentes penales, <Source href={ART_52}>art. 52.4</Source>
            </th>
            <td>
              No tener antecedentes penales relacionados con la intermediación inmobiliaria. Esto
              y la garantía o el seguro deben mantenerse mientras dure la inscripción (art. 52.5).
            </td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Declaración, <Source href={ART_51}>art. 51</Source>
            </th>
            <td>
              Una declaración responsable antes de empezar a ejercer, sobre cualificación mínima,
              solvencia, seguro de responsabilidad civil y código de buenas prácticas, que se
              renovará periódicamente con normas aún por escribir.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Cronología</h2>
      <dl>
        <dt>24 de diciembre de 2025</dt>
        <dd>
          Se publica en el <Source href={LAW_BOJA}>BOJA núm. 247</Source> la Ley 5/2025, de 16
          de diciembre.
        </dd>
        <dt>8 de enero de 2026</dt>
        <dd>
          Se publica en el BOE como <Source href={LAW}>BOE-A-2026-423</Source>.
        </dd>
        <dt>24 de enero de 2026</dt>
        <dd>Entra en vigor, un mes después de su publicación en el BOJA.</dd>
        <dt>13 de abril de 2026</dt>
        <dd>
          El BOE y el BOJA publican el acuerdo para negociar sobre 16 artículos, entre ellos los
          arts. 49 a 52.
        </dd>
        <dt>31 de julio de 2026</dt>
        <dd>
          El Decreto 197/2026 encarga el desarrollo del registro a la Secretaría General de
          Vivienda.
        </dd>
        <dt>18 de septiembre de 2026</dt>
        <dd>La Junta anuncia el acuerdo: se eliminará la inscripción obligatoria.</dd>
        <dt>24 de enero de 2028</dt>
        <dd>
          Fin del plazo para crear y poner en marcha el registro, salvo que la reforma lo cambie.
        </dd>
      </dl>

      <h2>Fuentes</h2>
      <p>Todas comprobadas el {AS_OF}.</p>
      <ul>
        <li>
          <Source href={LAW}>Ley 5/2025, de 16 de diciembre, de Vivienda de Andalucía</Source>,
          texto consolidado en el BOE (BOE-A-2026-423).
        </li>
        <li>
          <Source href={LAW_BOJA}>La misma ley tal como se publicó en el BOJA</Source>, núm. 247,
          de 24 de diciembre de 2025.
        </li>
        <li>
          <Source href={TALKS_BOE}>BOE-A-2026-8197</Source>, el acuerdo para iniciar
          negociaciones, BOE núm. 90, de 13 de abril de 2026, y{" "}
          <Source href={TALKS_BOJA}>el mismo acuerdo en el BOJA</Source>, núm. 69, de 13 de abril
          de 2026.
        </li>
        <li>
          <Source href={JUNTA_NEWS}>
            Junta de Andalucía: “Junta y Gobierno alcanzan un acuerdo que resuelve las
            discrepancias sobre la Ley de Vivienda de Andalucía”
          </Source>
          , 18 de septiembre de 2026.
        </li>
        <li>
          <Source href={DECREE_197}>Decreto 197/2026, de 30 de julio</Source>, de estructura de
          la consejería de vivienda, BOJA extraordinario núm. 15, de 31 de julio de 2026 (art.
          6.2.n).
        </li>
        <li>
          <Source href={LEY_10_2003}>Ley 10/2003, de 20 de mayo, art. 3</Source>, en el BOE.
        </li>
        <li>
          <Source href={BOJA_SEARCH}>La búsqueda en el BOJA por el nombre del registro</Source>,
          para ver lo que se haya publicado después.
        </li>
      </ul>
      <p>
        {SITE_NAME} es un CRM para agentes inmobiliarios independientes en España, no un
        despacho de abogados. El resto de nuestras guías van del trabajo del día a día, como el{" "}
        <Link href={marketingPath("guideFollowUp", L)}>seguimiento de leads</Link>.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Registro de agentes inmobiliarios de Andalucía: qué cambia",
  description:
    "La Ley 5/2025 hizo obligatoria la inscripción de los agentes inmobiliarios en Andalucía y en 2026 la Junta acordó cambiarlo. Qué dice hoy la ley, con fuentes.",
  kind: "article",
  published: PUBLISHED.guideAndaluciaRegister,
  eyebrow: "Guía · Andalucía",
  heading: "Registro de agentes inmobiliarios de Andalucía: qué dice la ley y qué ha cambiado",
  lead: "La Ley 5/2025, de Vivienda de Andalucía, creó un registro de agentes inmobiliarios y convirtió la inscripción en requisito para ejercer. El 18 de septiembre de 2026 la Junta de Andalucía anunció que cambiará la ley para que deje de serlo. Aquí tienes qué dice hoy la ley, qué se ha anunciado y qué vigilar, con el enlace a cada fuente.",
  Body,
  faq: [
    {
      q: "¿Es obligatorio inscribirse en el registro de agentes inmobiliarios de Andalucía?",
      a: `La ley vigente dice que sí: la Ley 5/2025 convierte la inscripción en requisito para ejercer como agente inmobiliario en Andalucía (art. 50.3). Pero el registro aún no se ha puesto en marcha, y el 18 de septiembre de 2026 la Junta anunció que cambiará la ley para que la inscripción deje de ser requisito para ejercer. A ${AS_OF} no se había publicado ninguna ley que la modifique.`,
    },
    {
      q: "¿Qué requisitos pide el registro de agentes inmobiliarios de Andalucía?",
      a: "Tal como está escrita la ley: las capacitaciones o titulaciones del art. 52.1 (título de API, titulación universitaria de determinadas ramas, cuatro años de experiencia, colegiación en un Colegio de API), 100 horas de formación oficial en los cuatro años anteriores, una garantía financiera o un seguro de responsabilidad civil profesional, y no tener antecedentes penales relacionados con la intermediación inmobiliaria (arts. 52 y 53). La Junta ha anunciado que la reforma precisará el carácter alternativo de los requisitos.",
    },
    {
      q: "¿Cuándo abrirá el registro de agentes inmobiliarios de Andalucía?",
      a: "No hay fecha anunciada. La ley da a la Junta hasta el 24 de enero de 2028, dos años desde su entrada en vigor, para crear, regular y poner en funcionamiento el registro, y un decreto de julio de 2026 encargó su desarrollo a la Secretaría General de Vivienda.",
    },
    {
      q: "¿Hace falta ser API o estar colegiado para trabajar como agente inmobiliario?",
      a: "La normativa estatal no exige ninguna de las dos cosas: la Ley 10/2003 (art. 3) permite a personas físicas y jurídicas ejercer la intermediación inmobiliaria sin título alguno y sin pertenecer a ningún colegio oficial, sin perjuicio de los requisitos de protección a los consumidores que establezca la normativa reguladora de la actividad. La Ley 5/2025, tal como está escrita, incluye el título de API y la colegiación entre las capacitaciones para su registro, y la Junta ha anunciado que la reforma aplicará la normativa estatal sobre colegiación.",
    },
    {
      q: "¿Quién tendría que inscribirse?",
      a: "Según el texto actual, toda persona que se dedique de forma habitual y retribuida, profesional o empresarialmente, a la intermediación, el asesoramiento y la gestión en la compra, el alquiler, la permuta o la cesión de viviendas en Andalucía (art. 49.1). El cambio anunciado eliminaría la inscripción como requisito para ejercer.",
    },
  ],
  related: ["crmMarbella", "guideFollowUp", "about"],
  topic: {
    "@type": "Legislation",
    name: "Ley 5/2025, de 16 de diciembre, de Vivienda de Andalucía",
    legislationIdentifier: "https://www.boe.es/eli/es-an/l/2025/12/16/5",
    legislationDate: "2025-12-16",
    legislationJurisdiction: "ES-AN",
    url: LAW,
    inLanguage: "es",
  },
};
