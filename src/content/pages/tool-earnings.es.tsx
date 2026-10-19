import Link from "next/link";

import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { CuotaTable } from "@/components/tools/cuota-table";
import { EarningsCalculator } from "@/components/tools/earnings-calculator";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME } from "@/lib/site";
import { COTIZACION_YEAR } from "@/lib/tools/earnings";

/*
 * En esta página no aparece ningún porcentaje de comisión ni de reparto, ni
 * siquiera como ejemplo: el ejemplo da la parte del agente en euros. Los únicos
 * porcentajes son los tipos de impuestos y de cotización; pages.test.ts falla
 * con cualquier otro. Las cifras del ejemplo se comprueban en earnings.test.ts
 * y cambian con la tabla de cotización de cada año.
 */

const SOURCES = {
  colegios: "https://www.boe.es/buscar/act.php?id=BOE-A-1974-289#a14",
  orden: "https://www.boe.es/buscar/act.php?id=BOE-A-2026-7296",
  lgss: "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724#a308",
  leta: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-13409#a3-5",
  withholding: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820#a95",
  advances: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820#a110",
  waiver: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820#a109",
} as const;

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
      <h2>Cómo calcula la calculadora lo que ganas</h2>
      <p>
        Un agente autónomo gana su parte de los honorarios de las ventas que cierra. La
        calculadora parte de los honorarios que tu agencia pacta con cada cliente, un porcentaje
        del precio o un importe fijo, y los sigue en cinco pasos:
      </p>
      <ol>
        <li>
          <strong>Los honorarios de tus ventas.</strong> Los honorarios de una venta, sin IVA,
          por tus ventas del año. El IVA de tus facturas es de Hacienda, así que nunca cuenta como
          ingreso.
        </li>
        <li>
          <strong>Las ventas compartidas.</strong> Cuando otra agencia trajo al comprador, una
          parte de los honorarios es suya, según vuestro acuerdo de colaboración.
        </li>
        <li>
          <strong>Tu agencia o tu red.</strong> Si trabajas con una agencia o una red, se queda
          una parte de lo que os toca y el resto es tuyo.
        </li>
        <li>
          <strong>La cuota de autónomos y tus gastos.</strong> Lo que pagas cada mes a la
          Seguridad Social y lo que gastas para trabajar: portales, coche, teléfono, la cuota de
          la oficina.
        </li>
        <li>
          <strong>El IRPF.</strong> Lo que te retienen en las facturas, o los pagos fraccionados
          que haces tú cada trimestre.
        </li>
      </ol>
      <p>
        Lo que queda, dividido entre doce, es lo que te queda al mes. Todos los campos empiezan
        vacíos: en España no hay honorarios ni repartos estándar, y los colegios profesionales no
        pueden fijarlos ni recomendarlos (
        <Source href={SOURCES.colegios}>artículo 14 de la Ley de Colegios Profesionales</Source>),
        así que las cifras tienen que ser las tuyas.
      </p>

      <h2>Un ejemplo con números</h2>
      <p>
        Imagina que cierras ocho ventas al año y que tu parte de cada venta, después de
        repartos, son 5.000 € sin IVA: 40.000 € de honorarios. Gastas 500 € al mes en portales,
        coche y teléfono, y la agencia a la que facturas te retiene el IRPF al 15 %.
      </p>
      <ul>
        <li>
          Para la cuota, tus rendimientos son 40.000 € menos 6.000 € de gastos, menos la
          deducción del 7 % por gastos genéricos: unos 2.635 € al mes. Es el tramo 10 de la tabla
          de {COTIZACION_YEAR}, con una cuota mínima de 427,21 € al mes, 5.126,52 € al año.
        </li>
        <li>La retención del 15 % sobre 40.000 € son 6.000 €.</li>
        <li>
          40.000 € menos 6.000 €, 5.126,52 € y 6.000 € dejan 22.873,48 € al año:{" "}
          <strong>1.906,12 € al mes</strong>.
        </li>
      </ul>
      <p>
        Las mismas cifras responden a la pregunta contraria. Para que te queden 2.500 € al mes,
        elige “Ventas que necesito”: con nueve ventas te quedan 2.234,56 € al mes y con diez,
        2.562,99 €, así que la respuesta es diez. Vender más también sube tu cuota, porque con
        más rendimientos pasas a un tramo más alto.
      </p>

      <h2>La cuota de autónomos en {COTIZACION_YEAR}</h2>
      <p>
        Desde 2023 la cuota depende de lo que ganas. Tus rendimientos netos del año, sumándoles
        la propia cuota y con una deducción del 7 % por gastos genéricos (
        <Source href={SOURCES.lgss}>
          artículo 308 de la Ley General de la Seguridad Social
        </Source>
        ), se dividen entre doce y caen en uno de quince tramos. Cada tramo tiene una base mínima
        de cotización, y la cuota es esa base por el 31,5 %: los tipos de contingencias comunes y
        profesionales, cese de actividad, formación profesional y el mecanismo de equidad
        intergeneracional, fijados para {COTIZACION_YEAR} por la{" "}
        <Source href={SOURCES.orden}>Orden PJC/297/2026</Source>.
      </p>
      <CuotaTable locale="es" />
      <p>
        Durante el año pagas una cuota provisional según los rendimientos que prevés, y la
        Seguridad Social regulariza la diferencia cuando tu declaración de la renta muestra la
        cifra real: te cobra lo que falte o te devuelve lo que pagaste de más. También puedes
        elegir una base más alta que la mínima de tu tramo, que cuesta más y cuenta para una
        pensión más alta. La calculadora usa la base mínima de cada tramo.
      </p>
      <p>
        El primer año como autónomo puedes pagar una cuota reducida, la <em>tarifa plana</em>,
        durante doce meses, y otros doce si tus rendimientos no llegan al salario mínimo (
        <Source href={SOURCES.leta}>
          artículo 38 ter de la Ley del Estatuto del Trabajo Autónomo
        </Source>
        ). Si es tu caso, elige “La escribo yo” y pon lo que pagas.
      </p>
      <p>
        Si todavía no te has dado de alta, aquí tienes{" "}
        <Link href={marketingPath("guideBecomeAgent", "es")}>
          cómo ser agente inmobiliario y qué exige cada comunidad
        </Link>
        , con los pasos del alta como autónomo.
      </p>

      <h2>El IRPF: lo que te retienen y lo que debes</h2>
      <p>
        Cuando facturas a una empresa, como la agencia o la red con la que trabajas, te retiene
        el IRPF en la factura: el 15 % de la base, o el 7 % el año en que empiezas y los dos
        siguientes (<Source href={SOURCES.withholding}>artículo 95 del Reglamento del IRPF</Source>
        ). Las facturas a particulares no llevan retención, y entonces haces tú pagos
        fraccionados cada trimestre con el modelo 130: el 20 % de tus rendimientos netos del año
        hasta ese trimestre (<Source href={SOURCES.advances}>artículo 110</Source>), salvo que
        al menos el 70 % de tus ingresos del año anterior llevara retención (
        <Source href={SOURCES.waiver}>artículo 109</Source>).
      </p>
      <p>
        En los dos casos es un pago a cuenta. Tu IRPF del año se liquida en la declaración de la
        renta y depende de todos tus ingresos, de tu comunidad autónoma y de tus deducciones, así
        que puede salir más alto o más bajo. La calculadora descuenta lo retenido o pagado a
        cuenta, porque es lo que sale de tu cuenta durante el año.
      </p>

      <h2>Entonces, ¿cuánto gana un agente inmobiliario en España?</h2>
      <p>
        No hay una única cifra honesta. Los ingresos de un agente autónomo dependen de tres
        números que cambian de un agente a otro: cuántas ventas cierra, qué honorarios pacta su
        agencia con cada cliente y cómo se reparten. Por eso esta página te da una calculadora y
        no una media. Pon tus cifras y cambia una cada vez para ver lo que vale cada una.
      </p>
      <p>
        Para una sola operación, con el IVA y el reparto entre dos agencias, usa la{" "}
        <Link href={marketingPath("toolCommission", "es")}>calculadora de comisión</Link>.
      </p>

      <h2>Para que sigan llegando las ventas</h2>
      <p>
        Cada venta de esta calculadora empezó con una consulta a la que alguien hizo
        seguimiento. <Link href={marketingPath("home", "es")}>{SITE_NAME}</Link> es un CRM para
        agentes inmobiliarios independientes en España. Guarda cada comprador y cada vendedor con
        sus visitas, sus ofertas y los seguimientos pendientes, para que nadie se quede sin
        respuesta sin que te des cuenta. Funciona en español, inglés y ruso, y es gratis hasta{" "}
        {FREE_CLIENT_LIMIT} clientes.
      </p>

      <p className="text-muted-foreground text-sm">
        Esta calculadora hace cuentas; no es asesoramiento fiscal ni legal.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "¿Cuánto gana un agente inmobiliario en España? Calculadora",
  description:
    "Calculadora gratuita para agentes inmobiliarios en España: tus ventas, honorarios y repartos, menos cuota de autónomos, gastos e IRPF. Lo que te queda al mes.",
  kind: "tool",
  published: "2026-10-09",
  eyebrow: "Herramienta gratuita",
  heading: "¿Cuánto gana un agente inmobiliario en España?",
  lead: "Introduce tus ventas, tus honorarios y tus repartos. La calculadora descuenta la cuota de autónomos, tus gastos y el IRPF, y te dice lo que te queda al mes o cuántas ventas necesitas para ganar lo que quieres.",
  Body,
  faq: [
    {
      q: "¿Cuánto gana un agente inmobiliario en España?",
      a: "No hay una cifra estándar: los ingresos de un agente autónomo dependen de las ventas que cierra, de los honorarios que su agencia pacta con cada cliente y de cómo se reparten. Lo que le queda es su parte de los honorarios menos la cuota de autónomos, sus gastos y el IRPF.",
    },
    {
      q: `¿Cuánto es la cuota de autónomos en ${COTIZACION_YEAR}?`,
      a: "Depende de tus rendimientos netos al mes. La mínima va de 205,88 € para rendimientos de hasta 670 € a 607,35 € por encima de 6.000 €: la base mínima de cada tramo por el 31,5 % (Orden PJC/297/2026). La Seguridad Social la regulariza al año siguiente con los rendimientos de tu declaración de la renta.",
    },
    {
      q: "¿Cómo tributa la comisión de un agente inmobiliario?",
      a: "Un agente autónomo paga IRPF por sus honorarios menos sus gastos. Si factura a una empresa, esta le retiene el 15 %, o el 7 % el año de inicio de la actividad y los dos siguientes. Si no le retienen nada, paga el 20 % de sus rendimientos netos en pagos fraccionados trimestrales (modelo 130). La declaración anual fija el impuesto real.",
    },
    {
      q: "¿Cuántas ventas necesita un agente inmobiliario para vivir?",
      a: "Las suficientes para que tu parte de los honorarios cubra la cuota, tus gastos y el IRPF, más lo que necesitas para vivir. Elige “Ventas que necesito”, pon esa cifra mensual con tus honorarios y repartos, y la calculadora busca el menor número de ventas al año que llega.",
    },
    {
      q: "¿El IVA cuenta como ingreso del agente?",
      a: "No. El IVA de tus facturas es de Hacienda: lo cobras y lo ingresas cada trimestre. Introduce tus honorarios sin IVA; la calculadora nunca cuenta el impuesto como ingreso.",
    },
  ],
  related: ["toolCommission", "guideBecomeAgent", "guideFollowUp", "pricing"],
  tool: {
    Component: EarningsCalculator,
    schema: { "@type": "WebApplication", applicationCategory: "FinanceApplication" },
  },
};
