import Link from "next/link";

import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { ToolCards } from "@/components/tools/tool-cards";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { marketingPath } from "@/lib/routes";

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
    "Herramientas gratis para agentes inmobiliarios en España: una calculadora de comisión con IVA, reparto e IRPF, y una plantilla Excel de clientes para LeadWing.",
  kind: "page",
  published: "2026-09-29",
  eyebrow: "Herramientas gratis",
  heading: "Herramientas gratis para agentes inmobiliarios",
  lead: "Una calculadora para los honorarios de tu próxima venta y una plantilla para tus clientes. Sin cuenta y sin email: ábrelas y úsalas.",
  Body,
  faq: [
    {
      q: "¿Las herramientas son gratis?",
      a: "Sí. Las dos funcionan sin cuenta y sin email: la calculadora va en tu navegador y la plantilla se descarga al momento.",
    },
    {
      q: "¿Necesito LeadWing para usarlas?",
      a: `No, funcionan por su cuenta. LeadWing es el CRM al que llevan: las columnas de la plantilla se importan tal cual, y es gratis hasta ${FREE_CLIENT_LIMIT} clientes.`,
    },
    {
      q: "¿Para quién son?",
      a: "Para agentes inmobiliarios independientes en España, también los que trabajan con varias agencias. La calculadora resuelve los honorarios, el IVA o el IGIC, el reparto y el IRPF; la plantilla lleva tus compradores y vendedores.",
    },
  ],
  related: ["guideFollowUp", "guideIdealista", "pricing"],
};
