import Link from "next/link";

import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { ToolCards } from "@/components/tools/tool-cards";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { marketingPath } from "@/lib/routes";
import { CHECKED } from "@/lib/seo";

function Body() {
  return (
    <>
      <ToolCards locale="es" />
      <p>
        ¿También necesitas las palabras para tus seguimientos? La{" "}
        <Link href={marketingPath("guideFollowUp", "es")}>guía de seguimiento</Link> tiene un
        ritmo para compradores y mensajes listos para enviar, en español, inglés y alemán.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Herramientas gratis para agentes inmobiliarios",
  description:
    "Herramientas gratis para agentes inmobiliarios en España: calculadora de comisión con IVA y reparto, calculadora de ingresos y plantilla Excel para LeadWing.",
  kind: "page",
  published: "2026-09-29",
  modified: CHECKED.tools,
  eyebrow: "Herramientas gratis",
  heading: "Herramientas gratis para agentes inmobiliarios",
  lead: "Calculadoras para los honorarios de tu próxima venta y para lo que te deja un año de ventas, y una plantilla para tus clientes. Sin cuenta y sin email: ábrelas y úsalas.",
  Body,
  faq: [
    {
      q: "¿Las herramientas son gratis?",
      a: "Sí. Las tres funcionan sin cuenta y sin email: las calculadoras van en tu navegador y la plantilla se descarga al momento.",
    },
    {
      q: "¿Necesito LeadWing para usarlas?",
      a: `No, funcionan por su cuenta. LeadWing es el CRM al que llevan: las columnas de la plantilla se importan tal cual, y es gratis hasta ${FREE_CLIENT_LIMIT} clientes.`,
    },
    {
      q: "¿Para quién son?",
      a: "Para agentes inmobiliarios independientes en España, también los que trabajan con varias agencias. La calculadora de comisión resuelve los honorarios, el IVA o el IGIC, el reparto y el IRPF; la de ingresos convierte un año de ventas en lo que te queda; la plantilla lleva tus compradores y vendedores.",
    },
  ],
  related: ["guideFollowUp", "guideIdealista", "pricing"],
};
