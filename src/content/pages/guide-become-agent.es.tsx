import Link from "next/link";

import { intlTag } from "@/i18n/config";
import { marketingPath } from "@/lib/routes";
import { CHECKED, PUBLISHED } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { SOURCES as S } from "@/content/pages/guide-become-agent.sources";

const L = "es";

/** El día en que se publicó la página, que sigue siendo su datePublished. */
const FIRST_PUBLISHED = PUBLISHED.guideBecomeAgent;

/**
 * El día en que se comprobó por última vez cada requisito frente a su norma.
 * Es también la fecha de "Actualizado", su dateModified y el lastmod del
 * sitemap, así que la revisión trimestral sube CHECKED.guideBecomeAgent, nunca
 * PUBLISHED.
 */
const LAST_CHECKED = CHECKED.guideBecomeAgent ?? FIRST_PUBLISHED;

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
      <Callout title={`Situación a ${AS_OF}`}>
        <ul>
          <li>
            En España no hace falta ningún título ni colegiarse para trabajar como agente
            inmobiliario.
          </li>
          <li>
            Cataluña y la Comunitat Valenciana obligan a inscribirse en un registro de agentes.
            Andalucía también lo exige en su ley, pero no ha creado el registro y se ha
            comprometido a quitar la obligación.
          </li>
          <li>
            En Madrid, Illes Balears, Navarra, Canarias y el País Vasco el registro es voluntario.
          </li>
        </ul>
        <p>
          Esta página resume la normativa y enlaza cada texto. No es asesoramiento jurídico ni
          fiscal, ni dice si una persona concreta cumple los requisitos.
        </p>
      </Callout>

      <h2>Lo que dice la ley estatal</h2>
      <p>
        La intermediación inmobiliaria es una actividad libre. La Ley 10/2003 permite ejercerla a
        cualquier persona física o jurídica “sin necesidad de estar en posesión de título alguno,
        ni de pertenencia a ningún colegio oficial”, sin perjuicio de los requisitos que fije la
        normativa de protección de los consumidores (
        <Source href={S.ley10_2003}>Ley 10/2003, art. 3</Source>). Lo mismo decía antes el{" "}
        <Source href={S.rdl4_2000}>Real Decreto-ley 4/2000, art. 3</Source>.
      </p>
      <p>
        El título de Agente de la Propiedad Inmobiliaria (API) y los colegios de API siguen
        existiendo, pero son una opción: el reglamento de los colegios dice que “la colegiación se
        alza sobre el principio de voluntariedad”. Lo que sí reserva es el nombre: solo los
        colegiados pueden llamarse “agente de la propiedad inmobiliaria” (
        <Source href={S.rd1294_2007}>Real Decreto 1294/2007</Source>).
      </p>

      <h2>Comunidad por comunidad</h2>
      <p>
        Lo que cambia según dónde trabajes es si tienes que inscribirte en un registro de agentes
        y qué te piden para hacerlo.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Comunidad</th>
            <th scope="col">Registro de agentes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="align-top">
              Cataluña
            </th>
            <td>Obligatorio</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Comunitat Valenciana
            </th>
            <td>Obligatorio; un tribunal anuló parte de sus requisitos en 2024</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Andalucía
            </th>
            <td>Obligatorio en la ley, pero sin crear y con la obligación en vías de eliminarse</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Illes Balears
            </th>
            <td>Voluntario desde el 14 de junio de 2026, pero la ley pide garantía y seguro a todos</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Comunidad de Madrid
            </th>
            <td>Voluntario</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Navarra
            </th>
            <td>Voluntario</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              Canarias
            </th>
            <td>Voluntario</td>
          </tr>
          <tr>
            <th scope="row" className="align-top">
              País Vasco
            </th>
            <td>No puede ser obligatorio, según el Tribunal Constitucional; sin decreto que lo cree</td>
          </tr>
        </tbody>
      </table>
      <p>
        En Galicia, Cantabria, Castilla-La Mancha, Castilla y León, Extremadura, la Región de
        Murcia y La Rioja no hemos encontrado ningún registro de agentes. Asturias y Aragón han
        anunciado el suyo, pero a {AS_OF} no se había publicado.
      </p>

      <h3>Cataluña</h3>
      <p>
        La ley catalana de vivienda exige a los agentes un establecimiento abierto al público (o
        una dirección física si solo trabajan por internet), capacitación profesional, una
        garantía y un seguro de responsabilidad civil, y crea un registro obligatorio (
        <Source href={S.catLaw}>Ley 18/2007, arts. 55.3 y 55.4</Source>). No inscribirse no anula
        los contratos (art. 56.4). El{" "}
        <Source href={S.catDecree}>Decreto 12/2010</Source> concreta los requisitos:
      </p>
      <ul>
        <li>
          capacitación: una titulación relacionada o cursos de al menos 200 horas lectivas (anexo
          1);
        </li>
        <li>
          garantía: 60.000 € por establecimiento y año, o 300.000 € si solo se trabaja por
          internet (art. 8);
        </li>
        <li>
          seguro de responsabilidad civil: 100.000 € por siniestro y 600.000 € al año, o 150.000 €
          y 1.000.000 € por internet (art. 11).
        </li>
      </ul>
      <p>
        El trámite está en la <Source href={S.catProcedure}>web de la Generalitat</Source>.
      </p>

      <h3>Comunitat Valenciana</h3>
      <p>
        El <Source href={S.valDecree}>Decreto 98/2022</Source> creó el Registro de Agentes de
        Intermediación Inmobiliaria, “gratuito y de carácter obligatorio” (art. 4.1), con
        requisitos de domicilio, capacitación, garantía y seguro en su art. 3. En diciembre de
        2024 el Tribunal Superior de Justicia de la Comunitat Valenciana, a recurso de la CNMC,
        anuló varios de ellos (<Source href={S.valSentence}>sentencia 706/2024</Source>, firme
        según la <Source href={S.valCnmc}>CNMC</Source>):
      </p>
      <ul>
        <li>
          el requisito de capacitación profesional entero, con las 200 horas de formación
          incluidas;
        </li>
        <li>las cuantías de los avales y seguros de caución;</li>
        <li>
          que los agentes que solo trabajan por internet tengan su dirección en la Comunitat;
        </li>
        <li>
          y el aviso que debían dar los agentes ocasionales y los inscritos en otras
          comunidades.
        </li>
      </ul>
      <p>
        La obligación de inscribirse no se recurrió y sigue en pie. Antes de hacerlo, mira en el
        propio registro qué documentos piden hoy (<Source href={S.valRuling}>nota del TSJCV</Source>
        ).
      </p>

      <h3>Andalucía</h3>
      <p>
        La <Source href={S.andLaw}>Ley 5/2025</Source> creó un registro “público, administrativo,
        gratuito y obligatorio” (art. 50.1), pero todavía no está en marcha. En el{" "}
        <Source href={S.andAgreement}>acuerdo publicado en el BOE el 19 de octubre de 2026</Source>
        , la Junta se compromete a cambiar la ley para quitar la inscripción obligatoria. Lo
        explicamos en{" "}
        <Link href={marketingPath("guideAndaluciaRegister", L)}>
          la guía del registro de Andalucía
        </Link>
        .
      </p>

      <h3>Illes Balears</h3>
      <p>
        La Ley 3/2024 hizo obligatorio el registro, pero la Ley 4/2026 lo cambió desde el 14 de
        junio de 2026: “La inscripción en este tiene, en todo caso, carácter voluntario” (
        <Source href={S.balLaw}>Ley 3/2024, disposición adicional decimocuarta</Source>). Aun así, la disposición adicional decimotercera se aplica a todas las personas que
        ejercen como agentes en Baleares, inscritas o no, y les pide un establecimiento (o una
        dirección postal en Baleares si trabajan solo por internet), una garantía de 60.000 € por
        año y un seguro de responsabilidad civil de 100.000 € por siniestro y 600.000 € al año. La
        formación ya solo se pide para inscribirse en el registro.
      </p>

      <h3>Comunidad de Madrid, Navarra, Canarias y País Vasco</h3>
      <ul>
        <li>
          <strong>Madrid</strong>: la inscripción tiene “en todo caso, carácter voluntario”. Para
          inscribirte piden una titulación, 200 horas de formación o cuatro años de experiencia,
          una garantía de 60.000 € y un seguro de 100.000 € por siniestro y 600.000 € al año (
          <Source href={S.madDecree}>Decreto 8/2018, arts. 1, 6 y 7</Source>;{" "}
          <Source href={S.madRegister}>registro RAIN</Source>).
        </li>
        <li>
          <strong>Navarra</strong>: registro voluntario, público y gratuito. Para inscribirte, 200
          horas de formación (o ser API colegiado, una titulación o cuatro años de experiencia),
          una garantía de 30.000 € y un seguro de 100.000 € por siniestro y 600.000 € al año, un
          50 % más si solo trabajas por internet (<Source href={S.navDecree}>Decreto Foral 33/2019, arts. 4, 8 y 9</Source>
          ).
        </li>
        <li>
          <strong>Canarias</strong>: la inscripción “tiene un carácter voluntario”. Para
          inscribirte piden un establecimiento abierto al público (o una dirección física en
          Canarias si trabajas por internet), ser API colegiado, una titulación, cuatro años de
          experiencia o 200 horas de formación, y una garantía de 30.000 € por establecimiento,
          que puede sustituirse por un seguro de responsabilidad civil de al menos ese capital (
          <Source href={S.canDecree}>Decreto 11/2022, arts. 4 a 8</Source>).
        </li>
        <li>
          <strong>País Vasco</strong>: la ley de vivienda prevé un registro (
          <Source href={S.pvLaw}>Ley 3/2015, disposición adicional primera</Source>), y el Tribunal Constitucional excluyó que la inscripción pueda ser “presupuesto o título
          habilitante del ejercicio de la actividad inmobiliaria en el País Vasco” (
          <Source href={S.pvRuling}>STC 97/2018</Source>). No hemos encontrado el decreto que lo
          cree.
        </li>
      </ul>

      <h2>Darte de alta como autónomo, paso a paso</h2>
      <p>
        Si vas a trabajar por tu cuenta, estos son los trámites estatales, en el orden en que se
        hacen. Antes, mira en la tabla de arriba si tu comunidad te pide inscribirte.
      </p>
      <ol>
        <li>
          <strong>Alta en Hacienda con el modelo 036</strong>, antes de empezar la actividad. El
          modelo 037 ya no existe: desde febrero de 2025 todo se hace con el 036 (
          <Source href={S.modelo036}>Agencia Tributaria</Source>).
        </li>
        <li>
          <strong>El epígrafe del IAE.</strong> Los agentes colegiados van en el grupo 721 de la
          sección segunda. Para un agente no colegiado, la Dirección General de Tributos ha
          contestado en consultas que la intermediación en ventas de promociones va en el 724, la
          de alquileres en el 799 y la 834 de la sección primera solo si la actividad es
          empresarial. Para otras intermediaciones, como la venta de viviendas de segunda mano, esas consultas
          no fijan epígrafe: confírmalo con la Agencia Tributaria. Ojo: el 723, que citan muchas
          webs, es el de los administradores de fincas
          (<Source href={S.iae}>tarifas del IAE</Source>). Las personas físicas no pagan el
          impuesto; el epígrafe se indica en el modelo 036 (
          <Source href={S.iaeExemption}>Ley de Haciendas Locales, art. 82.1.c</Source>).
        </li>
        <li>
          <strong>Alta en el RETA</strong> de la Seguridad Social antes de empezar, con hasta 60
          días de antelación (<Source href={S.reta}>Import@ss</Source>).
        </li>
        <li>
          <strong>La cuota</strong> depende de tus rendimientos reales, por tramos (
          <Source href={S.cotizacion}>Orden PJC/297/2026, art. 18</Source>). Existe una cuota
          reducida para quien empieza, la tarifa plana (
          <Source href={S.leta}>Ley del Estatuto del Trabajo Autónomo, art. 38 ter</Source>), cuyo
          importe fija la ley de presupuestos: consulta la cifra vigente en la Seguridad Social.
          Con nuestra{" "}
          <Link href={marketingPath("toolEarnings", L)}>calculadora de ingresos</Link> ves tu cuota
          con tus cifras.
        </li>
        <li>
          <strong>Tus facturas</strong> llevan IVA del 21 % (
          <Source href={S.liva}>Ley del IVA, art. 90</Source>). Si facturas a una empresa, como la
          agencia o la red con la que trabajas, te retiene el 15 % de IRPF, o el 7 % el año en que
          empiezas y los dos siguientes (
          <Source href={S.rirpf}>Reglamento del IRPF, art. 95</Source>). Los particulares no
          retienen, y entonces pagas tú a cuenta con el modelo 130. El IVA se declara cada
          trimestre con el modelo 303.
        </li>
        <li>
          <strong>El programa de facturación</strong> tendrá que cumplir el reglamento de sistemas
          de facturación (Verifactu): para los autónomos, antes del 1 de julio de 2027 según el{" "}
          <Source href={S.verifactu}>Real Decreto-ley 15/2025</Source>.
        </li>
      </ol>

      <h2>Si trabajas para una red o una agencia</h2>
      <p>
        Muchas redes y agencias trabajan con agentes autónomos. Si al menos el 75 % de tus
        ingresos viene de un solo cliente, la ley te considera trabajador autónomo
        económicamente dependiente (TRADE): el contrato tiene que constar por escrito y
        registrarse en el Servicio Público de Empleo, y te toca registrarlo a ti en los diez días
        hábiles siguientes a la firma (
        <Source href={S.leta}>Ley del Estatuto del Trabajo Autónomo, arts. 11 y 12</Source>;{" "}
        <Source href={S.trade}>Real Decreto 197/2009, art. 6</Source>;{" "}
        <Source href={S.tradeSepe}>trámite en el SEPE</Source>).
      </p>

      <h2>Lo que la ley te pide desde la primera operación</h2>
      <ul>
        <li>
          <strong>Prevención del blanqueo de capitales.</strong> Quien se dedica
          profesionalmente a la intermediación en la compraventa de inmuebles es sujeto obligado
          (art. 2.1.l), y en los alquileres a partir de 10.000 € al mes. Eso supone identificar al
          cliente y a su titular real, hacer un análisis de riesgo por escrito, comunicar las
          operaciones sospechosas al SEPBLAC, conservar los documentos diez años y formarte (
          <Source href={S.aml}>Ley 10/2010</Source>).
        </li>
        <li>
          <strong>La información al ofrecer viviendas.</strong> La publicidad no puede inducir a
          error y lo que anuncias obliga; debes tener a disposición del comprador los datos de la
          vivienda, y el precio total incluye, en su caso, tus honorarios y el IVA (
          <Source href={S.rd515}>Real Decreto 515/1989</Source>).
        </li>
        <li>
          <strong>Lo que pueden pedirte antes de pagar.</strong> El comprador o el inquilino puede
          pedir información mínima sobre la operación, la vivienda y quién interviene antes de
          firmar o entregar dinero (<Source href={S.ley12_2023}>Ley 12/2023, art. 31</Source>).
        </li>
      </ul>

      <h2>¿Cuánto se gana?</h2>
      <p>
        Depende de cuántas operaciones cierres, de los honorarios que pactes con cada cliente y de
        cómo los repartas con otras agencias o con tu red. La{" "}
        <Link href={marketingPath("toolEarnings", L)}>
          calculadora de ingresos de agente inmobiliario
        </Link>{" "}
        hace la cuenta con tus cifras, con la cuota de autónomos, el IRPF y tus gastos.
      </p>

      <h2>Lo que necesitas el primer día</h2>
      <p>
        Desde el primer cliente te hace falta un sitio donde tener a cada comprador y cada
        vendedor con su siguiente paso. Puede ser una{" "}
        <Link href={marketingPath("toolSpreadsheet", L)}>hoja de cálculo</Link> o un CRM.{" "}
        {SITE_NAME} es un CRM para agentes independientes: pegas cada contacto que te llega y lo
        convierte en una ficha, gratis hasta 10 clientes. Si vas a anunciarte en portales, mira
        antes{" "}
        <Link href={marketingPath("guidePortalPrices", L)}>lo que cobra cada portal</Link>.
      </p>

      <h2>Fuentes</h2>
      <p>Todas comprobadas el {AS_OF}.</p>
      <ul>
        <li>
          Normativa estatal: <Source href={S.ley10_2003}>Ley 10/2003</Source>,{" "}
          <Source href={S.rdl4_2000}>Real Decreto-ley 4/2000</Source>,{" "}
          <Source href={S.rd1294_2007}>Real Decreto 1294/2007</Source>.
        </li>
        <li>
          Cataluña: <Source href={S.catLaw}>Ley 18/2007</Source>,{" "}
          <Source href={S.catDecree}>Decreto 12/2010</Source>,{" "}
          <Source href={S.catProcedure}>trámite</Source>. Comunitat Valenciana:{" "}
          <Source href={S.valDecree}>Decreto 98/2022</Source>,{" "}
          <Source href={S.valSentence}>sentencia 706/2024</Source>,{" "}
          <Source href={S.valRuling}>nota del TSJCV</Source>,{" "}
          <Source href={S.valCnmc}>expediente de la CNMC</Source>.
        </li>
        <li>
          Andalucía: <Source href={S.andLaw}>Ley 5/2025</Source>,{" "}
          <Source href={S.andAgreement}>BOE-A-2026-21762</Source>. Illes Balears:{" "}
          <Source href={S.balLaw}>Ley 3/2024</Source>. Madrid:{" "}
          <Source href={S.madDecree}>Decreto 8/2018</Source>,{" "}
          <Source href={S.madRegister}>RAIN</Source>. Navarra:{" "}
          <Source href={S.navDecree}>Decreto Foral 33/2019</Source>. Canarias:{" "}
          <Source href={S.canDecree}>Decreto 11/2022</Source>. País Vasco:{" "}
          <Source href={S.pvLaw}>Ley 3/2015</Source>, <Source href={S.pvRuling}>STC 97/2018</Source>
          .
        </li>
        <li>
          Alta y fiscalidad: <Source href={S.modelo036}>modelo 036</Source>,{" "}
          <Source href={S.iae}>tarifas del IAE</Source>,{" "}
          <Source href={S.iaeExemption}>Ley de Haciendas Locales</Source>,{" "}
          <Source href={S.reta}>alta en el RETA</Source>,{" "}
          <Source href={S.cotizacion}>Orden PJC/297/2026</Source>,{" "}
          <Source href={S.leta}>Estatuto del Trabajo Autónomo</Source>,{" "}
          <Source href={S.liva}>Ley del IVA</Source>,{" "}
          <Source href={S.rirpf}>Reglamento del IRPF</Source>,{" "}
          <Source href={S.trade}>Real Decreto 197/2009</Source>,{" "}
          <Source href={S.tradeSepe}>registro de contratos TRADE</Source>,{" "}
          <Source href={S.verifactu}>Real Decreto-ley 15/2025</Source>.
        </li>
        <li>
          Obligaciones: <Source href={S.aml}>Ley 10/2010</Source>,{" "}
          <Source href={S.rd515}>Real Decreto 515/1989</Source>,{" "}
          <Source href={S.ley12_2023}>Ley 12/2023</Source>.
        </li>
      </ul>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Cómo ser agente inmobiliario en España: requisitos 2026",
  description:
    "En España no hace falta título para ser agente inmobiliario. Qué exige cada comunidad, qué registros son obligatorios y cómo darte de alta como autónomo.",
  kind: "article",
  published: FIRST_PUBLISHED,
  modified: LAST_CHECKED,
  eyebrow: "Guía · Empezar",
  heading: "Cómo ser agente inmobiliario en España: qué exige la ley, comunidad por comunidad",
  lead: "En España no hace falta título ni colegiarse para ser agente inmobiliario. Lo que cambia es la comunidad: Cataluña y la Comunitat Valenciana obligan a inscribirse en un registro, Andalucía lo exige en su ley pero se ha comprometido a quitarlo, y en Madrid, Illes Balears, Navarra, Canarias y el País Vasco el registro es voluntario. Aquí tienes qué pide cada una, con su fuente, y los pasos para empezar como autónomo.",
  Body,
  faq: [
    {
      q: "¿Hace falta título para ser agente inmobiliario en España?",
      a: "No. La Ley 10/2003 (art. 3) permite trabajar como intermediario inmobiliario sin ningún título y sin pertenecer a ningún colegio, sin perjuicio de las normas de protección de los consumidores. Lo que sí pueden exigir algunas comunidades es inscribirse en un registro de agentes.",
    },
    {
      q: "¿Tengo que ser API o colegiarme?",
      a: "No es obligatorio. El título de Agente de la Propiedad Inmobiliaria y los colegios de API existen, pero la colegiación es voluntaria. Solo los colegiados pueden usar el nombre de agente de la propiedad inmobiliaria.",
    },
    {
      q: "¿Qué epígrafe del IAE tiene un agente inmobiliario?",
      a: "Los agentes colegiados van en el grupo 721 de la sección segunda. Para los no colegiados, la Dirección General de Tributos ha respondido que la intermediación en ventas de promociones va en el 724, la de alquileres en el 799 y el 834 de la sección primera solo si la actividad es empresarial; para otros casos, como la venta de viviendas de segunda mano, no fijan epígrafe. El 723 es el de los administradores de fincas. Las personas físicas están exentas de pagar el impuesto.",
    },
    {
      q: "¿Hay que inscribirse en un registro de agentes inmobiliarios?",
      a: "Depende de la comunidad. Es obligatorio en Cataluña y en la Comunitat Valenciana. En Andalucía la ley lo exige, pero el registro no se ha creado y la Junta se ha comprometido a quitar la obligación. En Madrid, Illes Balears, Navarra, Canarias y el País Vasco es voluntario.",
    },
    {
      q: "¿Puedo vender casas sin estar registrado como agente inmobiliario?",
      a: "En la mayor parte de España, sí: la ley estatal no exige título, colegiación ni registro para intermediar en la venta de viviendas (Ley 10/2003, art. 3). Las excepciones son Cataluña y la Comunitat Valenciana, donde hay que inscribirse en el registro de agentes para ejercer. Andalucía también lo exige en su ley, pero el registro aún no se ha creado y la Junta se ha comprometido a quitar la obligación. En Madrid, Illes Balears, Navarra, Canarias y el País Vasco el registro es voluntario, aunque en Illes Balears la ley pide a todos los agentes, inscritos o no, un establecimiento, una garantía y un seguro.",
    },
    {
      q: "¿Qué hay que estudiar para ser agente inmobiliario?",
      a: "La ley estatal no exige ningún estudio. Algunas comunidades piden formación para inscribirse en su registro: por ejemplo, Cataluña pide una titulación relacionada o cursos de al menos 200 horas lectivas, y Madrid y Navarra piden 200 horas para su registro voluntario.",
    },
    {
      q: "¿Cuánto cuesta darse de alta como autónomo siendo agente inmobiliario?",
      a: "Darse de alta en Hacienda y en la Seguridad Social no cuesta nada. La cuota mensual de autónomos depende de tus rendimientos reales, por tramos, y quien empieza puede pagar una cuota reducida, la tarifa plana, cuyo importe fija la ley de presupuestos.",
    },
  ],
  related: ["toolEarnings", "guideAndaluciaRegister", "guidePortalPrices"],
  topic: {
    "@type": "Occupation",
    name: "Agente inmobiliario",
    occupationLocation: { "@type": "Country", name: "España" },
  },
};
