import Link from "next/link";

import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { CommissionCalculator } from "@/components/tools/commission-calculator";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { marketingPath } from "@/lib/routes";
import { CHECKED } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

const home = marketingPath("home", "es");

/*
 * En esta página no aparece ningún porcentaje de comisión ni de reparto, ni
 * siquiera como ejemplo: los ejemplos dan los honorarios en euros y nunca un
 * precio. pages.test.ts falla con cualquier porcentaje que no sea un impuesto.
 */

const SOURCES = {
  iva: "https://sede.agenciatributaria.gob.es/Sede/iva/calculo-iva-repercutido-clientes/tipos-impositivos-iva.html",
  igic: "https://www3.gobiernodecanarias.org/tributos/atc/w/igic-impuesto-general-indirecto-canario-",
  rirpf: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820#a95",
  ruling: "https://petete.tributos.hacienda.gob.es/consultas/?num_consulta=V2188-21",
  colegios: "https://www.boe.es/buscar/act.php?id=BOE-A-1974-289#a14",
  lau: "https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003#a20",
  rdl29: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-20823",
  civilCode: "https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763#art1257",
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
      <h2>Cómo se calcula la comisión</h2>
      <p>
        La comisión de una agencia (sus honorarios) se fija en el acuerdo que firma con su
        cliente, normalmente la nota de encargo. Tiene una de dos formas: un porcentaje del
        precio de venta o un importe fijo en euros. En los dos casos, la cifra del acuerdo
        suele ser la base, sin impuestos, y el impuesto se suma encima.
      </p>
      <p>
        No hay una tarifa oficial ni estándar. Cada agencia pacta sus honorarios con su propio
        cliente, y los colegios profesionales no pueden fijarlos ni recomendarlos (
        <Source href={SOURCES.colegios}>artículo 14 de la Ley de Colegios Profesionales</Source>).
        Por eso la calculadora empieza vacía: las cifras las pones tú.
      </p>
      <p>
        Pongamos que un acuerdo fija unos honorarios de 12.000 € más IVA. Los 12.000 € son la
        base. El IVA al 21 % suma 2.520 €, así que el cliente paga 14.520 €. Si los honorarios
        son un porcentaje, la calculadora multiplica primero el precio de venta por ese
        porcentaje y después hace exactamente lo mismo.
      </p>
      <p>
        A partir de ahí todo son repartos: cuánto de la base va a otra agencia cuando la venta
        es compartida, cuánto de lo que le toca a tu agencia es tuyo y qué dice tu propia
        factura una vez aplicada la retención de IRPF. La calculadora hace cada paso en
        céntimos, así que las partes siempre suman el total.
      </p>

      <h2>El IVA de los honorarios: “más IVA” o “IVA incluido”</h2>
      <p>
        Los honorarios de una agencia inmobiliaria llevan IVA al tipo general, que es el 21 %
        (consulta la{" "}
        <Source href={SOURCES.iva}>página de la Agencia Tributaria sobre los tipos de IVA</Source>
        ). En Canarias no hay IVA: el impuesto es el IGIC, cuyo tipo general es el 7 % (consulta
        la{" "}
        <Source href={SOURCES.igic}>página del IGIC de la Agencia Tributaria Canaria</Source>).
        Para cualquier otro tipo, elige “Otro” y escríbelo.
      </p>
      <p>Los honorarios se expresan de dos maneras, y es fácil confundirlas:</p>
      <ul>
        <li>
          <strong>“Más IVA”</strong>: el importe es la base y el impuesto se suma encima. 12.000 €
          más IVA quiere decir que el cliente paga 14.520 €.
        </li>
        <li>
          <strong>“IVA incluido”</strong>: el importe ya lleva el impuesto dentro. Para sacar la
          base, divide entre 1,21. 14.520 € con IVA incluido son 12.000 € de honorarios y 2.520 €
          de IVA.
        </li>
      </ul>
      <p>
        Si la cifra que tienes es de las segundas, activa “Estos honorarios ya incluyen el IVA”
        y la calculadora quitará el impuesto antes de repartir nada.
      </p>

      <h2>¿Quién paga los honorarios de la inmobiliaria?</h2>
      <p>
        Quien firmó el encargo con la agencia. En una compraventa, ninguna ley dice si paga el
        vendedor o el comprador: los honorarios los debe quien contrató a la agencia, y un
        contrato solo obliga a quienes lo firman (
        <Source href={SOURCES.civilCode}>artículo 1257 del Código Civil</Source>). En la
        práctica suele ser el vendedor, a través de la <em>nota de encargo</em>.
      </p>
      <p>
        El comprador solo paga honorarios si firmó su propio encargo, por ejemplo con un agente
        al que contrató para buscarle vivienda. En una venta compartida, las dos agencias se
        reparten unos mismos honorarios: la agencia que tiene el encargo comparte lo que le
        paga su cliente con la agencia que trajo al comprador.
      </p>
      <p>
        En los alquileres, en cambio, sí decide la ley. En un arrendamiento de vivienda, los
        gastos de gestión inmobiliaria y los de formalización del contrato “no podrán ser
        repercutidos al arrendatario, ni directa ni indirectamente” (
        <Source href={SOURCES.lau}>artículo 20.2 de la Ley de Arrendamientos Urbanos</Source>, en
        la redacción del <Source href={SOURCES.rdl29}>Real Decreto-ley 29/2026</Source>, en vigor
        desde el 8 de octubre de 2026). Antes de esa reforma, desde la Ley 12/2023, el artículo
        20.1 ya los ponía a cargo del arrendador.
      </p>

      <h2>Alquiler: meses de renta o una parte de la renta anual</h2>
      <p>
        En un alquiler, los honorarios se fijan en meses de renta, como un porcentaje de la
        renta de un año o como un importe fijo. Elige “Alquiler”, introduce la renta mensual y
        los honorarios tal como los diga tu acuerdo; el impuesto, el reparto con otra agencia,
        tu parte y el IRPF funcionan exactamente igual que en una venta.
      </p>

      <h2>Cómo se reparte una comisión compartida entre dos agencias</h2>
      <p>
        En una venta compartida, lo normal es que una agencia tenga el inmueble en cartera y
        otra aporte el comprador. Los honorarios siguen siendo unos solos, y se mueven por
        pasos:
      </p>
      <ol>
        <li>El cliente paga a la agencia con la que firmó: todos los honorarios, más impuestos.</li>
        <li>La otra agencia factura a esa agencia su parte de los honorarios, más impuestos.</li>
        <li>
          El agente autónomo que trabaja con una agencia le factura su parte, más impuestos, y
          normalmente con retención de IRPF (lo verás en el apartado siguiente).
        </li>
      </ol>
      <p>
        No hay un reparto fijo. Cada acuerdo de colaboración fija el suyo, y la calculadora
        usa el que diga el tuyo. Cada parte se calcula sobre los honorarios sin impuestos;
        después, cada agencia suma el impuesto en su propia factura.
      </p>
      <p>
        Cuando termines, “Copiar el reparto” te da un mensaje corto para la otra agencia: los
        honorarios, el impuesto y las dos partes en euros. Nunca incluye tu parte personal.
      </p>

      <h2>La retención de IRPF en tu factura</h2>
      <p>
        Si eres autónomo y tu actividad está dada de alta como profesional, la empresa o el
        profesional que paga tu factura te retiene IRPF y lo ingresa en Hacienda por ti. El
        tipo es el 15 % con carácter general, o el 7 % el año en que empiezas y los dos
        siguientes, siempre que no hayas tenido actividad profesional el año anterior; para
        aplicarlo, se lo comunicas por escrito a quien te paga (
        <Source href={SOURCES.rirpf}>artículo 95 del Reglamento del IRPF</Source>).
      </p>
      <p>
        Las facturas a particulares no llevan retención: quien compra una vivienda para sí no
        retiene nada. Hacienda confirmó las dos cosas para un agente inmobiliario persona
        física en la consulta vinculante{" "}
        <Source href={SOURCES.ruling}>V2188-21</Source>.
      </p>
      <p>
        La retención se aplica sobre la base, nunca sobre el impuesto. Con una base de 4.000 €
        e IVA al 21 %, la factura suma 840 € de IVA y retiene 600 € al 15 %, así que cobras
        4.240 €. Esos 600 € no se pierden: son un pago a cuenta de tu IRPF y cuentan a tu favor
        cuando haces la declaración de la renta.
      </p>

      <h2>¿Cuánto gana un agente inmobiliario por venta?</h2>
      <p>
        No hay una cifra única, porque depende de tres números que cambian en cada operación:
        los honorarios que tu agencia pacta con su cliente, el reparto con otra agencia cuando
        la hay y tu parte de lo que le toca a tu agencia. Pon tus cifras en la calculadora y
        cambia una cada vez para ver cuánto vale cada una para ti.
      </p>
      <p>
        La cifra que te da la calculadora es lo que dice tu factura, antes de tu propio IRPF y de
        tus gastos. Para un año entero de ventas, después de la cuota de autónomos, tus gastos y
        el IRPF, usa la{" "}
        <Link href={marketingPath("toolEarnings", "es")}>calculadora de ingresos</Link>.
      </p>

      <h2>Las operaciones detrás de las cifras</h2>
      <p>
        <Link href={home}>{SITE_NAME}</Link> es un CRM para agentes inmobiliarios
        independientes en España. Guarda a cada cliente con la agencia por la que llegó, junto
        con sus visitas, sus ofertas y los seguimientos pendientes, así que cuando se cierra
        una venta la operación ya está en un solo sitio. Funciona en español, inglés y ruso, y es
        gratis hasta {FREE_CLIENT_LIMIT} clientes.
      </p>

      <p className="text-muted-foreground text-sm">
        Esta calculadora hace cuentas; no es asesoramiento fiscal ni legal.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Calculadora de comisión inmobiliaria con IVA y reparto",
  description:
    "Calculadora gratuita de comisión inmobiliaria para venta y alquiler: honorarios con IVA o IGIC, reparto entre agencias, tu parte y la retención de IRPF.",
  kind: "tool",
  published: "2026-09-29",
  modified: CHECKED.toolCommission,
  eyebrow: "Herramienta gratuita",
  heading: "Calculadora de comisión inmobiliaria: honorarios, IVA y reparto entre agencias",
  lead: "Calcula los honorarios con IVA, el reparto entre dos agencias y tu propia factura a partir de las cifras que has pactado.",
  Body,
  faq: [
    {
      q: "¿Cómo se calcula la comisión inmobiliaria?",
      a: "Como un porcentaje del precio de venta o como un importe fijo, según lo que la agencia haya pactado con su cliente, y con el impuesto sumado encima: IVA al 21 %, o IGIC al 7 % en Canarias. Cuando dos agencias comparten una venta, los honorarios sin impuestos se reparten entre ellas según su acuerdo de colaboración.",
    },
    {
      q: "¿La comisión inmobiliaria lleva IVA?",
      a: "Sí. Los honorarios de una agencia llevan IVA al tipo general del 21 %, o IGIC al 7 % en Canarias. Si se expresan “más IVA”, el impuesto se suma encima; si son “IVA incluido”, ya lo llevan dentro y la base es el importe dividido entre 1,21.",
    },
    {
      q: "¿Cómo se reparte una comisión compartida entre dos agencias?",
      a: "Como acuerden las dos agencias: no hay un reparto estándar. El cliente paga a la agencia con la que firmó, y la otra agencia le factura su parte más impuestos. Cada parte se calcula sobre los honorarios sin impuestos.",
    },
    {
      q: "¿Qué retención de IRPF lleva la factura de un agente inmobiliario?",
      a: "Cuando un agente autónomo con la actividad dada de alta como profesional factura a una empresa o a un profesional, quien paga retiene el 15 % de la base, o el 7 % el año de inicio de la actividad y los dos siguientes. Las facturas a particulares no llevan retención.",
    },
    {
      q: "¿Quién paga los honorarios de la inmobiliaria?",
      a: "Quien firmó el encargo con la agencia. En una compraventa ninguna ley lo decide, así que suele ser el vendedor, a través de la nota de encargo; el comprador solo paga si firmó su propio encargo. En un alquiler de vivienda, la Ley de Arrendamientos Urbanos no permite repercutir al inquilino los gastos de gestión inmobiliaria ni los de formalización del contrato (artículo 20.2, en la redacción del Real Decreto-ley 29/2026; antes, desde la Ley 12/2023, el artículo 20.1 los ponía a cargo del arrendador).",
    },
    {
      q: "¿Hay una comisión estándar en España?",
      a: "No. Cada agencia pacta sus honorarios con su propio cliente, y los colegios profesionales no pueden fijarlos ni recomendarlos (Ley 2/1974 de Colegios Profesionales, artículo 14, añadido por la Ley 25/2009).",
    },
  ],
  related: ["guideFollowUp", "crmSpain", "pricing"],
  tool: {
    Component: CommissionCalculator,
    schema: { "@type": "WebApplication", applicationCategory: "FinanceApplication" },
  },
};
