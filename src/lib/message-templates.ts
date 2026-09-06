import { formatCurrency } from "@/lib/crm";
import enTemplates from "../../messages/en/templates.json";

/**
 * Built-in starting points for 1:1 client messages. Each is a scaffold the
 * agent can send as-is (after {{variable}} fill) or hand to the AI to
 * personalise. Not marketing automation — one message, one client.
 *
 * `subject`/`body` are read by the CLIENT, so they follow the client's
 * language rather than the agent's UI language: every built-in carries copy
 * for each of `TEMPLATE_LANGUAGES`, and any other client language gets the
 * English copy (the composer's AI rewrite can take it from there). The
 * agent-facing `label`/`description`/`purpose` live in the `templates`
 * message catalog, keyed by template id — read them with `templateLabel()`
 * and friends so they follow the UI language. `MESSAGE_TEMPLATES` carries the
 * English values as the fallback for callers with no translator or client
 * language to hand.
 */
export type MessageTemplate = {
  id: string;
  label: string;
  description: string;
  /** Email subject line (ignored for WhatsApp). */
  subject: string;
  body: string;
  /** Plain-language intent, used to steer the AI rewrite. */
  purpose: string;
};

export type TemplateCopy = { subject: string; body: string };

/** Client languages (stored as their English names) with native template copy. */
export const TEMPLATE_LANGUAGES = ["English", "Spanish"] as const;
export type TemplateLanguage = (typeof TEMPLATE_LANGUAGES)[number];

/** Agent-facing copy for the built-ins, keyed by id — `templates.builtin.*`. */
const BUILTIN_COPY = enTemplates.builtin;

export type BuiltinTemplateId = keyof typeof BUILTIN_COPY;

const BUILTIN: {
  id: BuiltinTemplateId;
  copy: Record<TemplateLanguage, TemplateCopy>;
}[] = [
  {
    id: "intro",
    copy: {
      English: {
        subject: "Lovely to connect, {{first_name}}",
        body: "Hi {{first_name}}, lovely to connect! I'd love to help you find the right home. Tell me a bit about what you're looking for and I'll get to work.",
      },
      Spanish: {
        subject: "Un placer conocerte, {{first_name}}",
        body: "Hola {{first_name}}, ¡un placer conocerte! Me encantaría ayudarte a encontrar la casa ideal. Cuéntame un poco qué estás buscando y me pongo manos a la obra.",
      },
    },
  },
  {
    id: "new_matches",
    copy: {
      English: {
        subject: "A couple of places I think you'll like",
        body: "Hi {{first_name}}, a few new listings just came up that fit what you're after ({{budget}}). Want me to send the details or set up a viewing this week?",
      },
      Spanish: {
        subject: "Un par de propiedades que creo que te van a gustar",
        body: "Hola {{first_name}}, acaban de salir algunas propiedades nuevas que encajan con lo que buscas ({{budget}}). ¿Quieres que te envíe los detalles o que organicemos una visita esta semana?",
      },
    },
  },
  {
    id: "viewing_confirm",
    copy: {
      English: {
        subject: "Confirming your viewing",
        body: "Hi {{first_name}}, just confirming our viewing of {{property}}. Looking forward to showing you around — let me know if anything changes.",
      },
      Spanish: {
        subject: "Confirmación de tu visita",
        body: "Hola {{first_name}}, te escribo para confirmar nuestra visita a {{property}}. Con muchas ganas de enseñarte la propiedad. Avísame si hay algún cambio.",
      },
    },
  },
  {
    id: "offer_followup",
    copy: {
      English: {
        subject: "Update on your offer",
        body: "Hi {{first_name}}, just following up on your offer for {{property}}. I'm chasing the other side and will update you the moment I hear back.",
      },
      Spanish: {
        subject: "Novedades sobre tu oferta",
        body: "Hola {{first_name}}, te escribo por tu oferta para {{property}}. Estoy insistiendo a la otra parte y te aviso en cuanto tenga respuesta.",
      },
    },
  },
  {
    id: "reservation_next",
    copy: {
      English: {
        subject: "Next steps on your reservation",
        body: "Hi {{first_name}}, congratulations again! Here's what happens next with the reservation. I'll guide you through each step — shout with any questions.",
      },
      Spanish: {
        subject: "Próximos pasos de tu reserva",
        body: "Hola {{first_name}}, ¡enhorabuena de nuevo! Te cuento qué viene ahora con la reserva. Te acompañaré en cada paso; cualquier duda, aquí me tienes.",
      },
    },
  },
  {
    id: "check_in",
    copy: {
      English: {
        subject: "Still thinking about a move?",
        body: "Hi {{first_name}}, it's been a little while — are you still on the lookout? The market's moving and I'd love to help when you're ready.",
      },
      Spanish: {
        subject: "¿Sigues pensando en mudarte?",
        body: "Hola {{first_name}}, ha pasado un tiempo. ¿Sigues buscando? El mercado se mueve y me encantaría ayudarte cuando quieras.",
      },
    },
  },
];

/** The template language for a client language; anything unsupported reads English. */
export function templateLanguage(language: string | null | undefined): TemplateLanguage {
  return (TEMPLATE_LANGUAGES as readonly string[]).includes(language ?? "")
    ? (language as TemplateLanguage)
    : "English";
}

/** Subject and body of a built-in template in the client's language. */
export function templateCopy(
  id: string | null | undefined,
  language?: string | null
): TemplateCopy | null {
  if (!id) return null;
  const builtin = BUILTIN.find((t) => t.id === id);
  return builtin ? builtin.copy[templateLanguage(language)] : null;
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = BUILTIN.map((t) => ({
  id: t.id,
  ...t.copy.English,
  ...BUILTIN_COPY[t.id],
}));

/**
 * The `templates` translator (`useTranslations("templates")` /
 * `await getTranslations("templates")`), narrowed to the built-in copy keys.
 */
export type TemplatesT = (
  key: `builtin.${BuiltinTemplateId}.${"label" | "description" | "purpose"}`,
  values?: Record<string, string | number>
) => string;

export function isBuiltinTemplateId(id: string): id is BuiltinTemplateId {
  return Object.hasOwn(BUILTIN_COPY, id);
}

/** Translated name of a built-in template; unknown ids pass through. */
export function templateLabel(t: TemplatesT, id: string): string {
  return isBuiltinTemplateId(id) ? t(`builtin.${id}.label`) : id;
}

/** Translated one-liner under a built-in template's name. */
export function templateDescription(t: TemplatesT, id: string): string {
  return isBuiltinTemplateId(id) ? t(`builtin.${id}.description`) : "";
}

/** Translated intent of a built-in template, used to steer the AI rewrite. */
export function templatePurpose(t: TemplatesT, id: string): string {
  return isBuiltinTemplateId(id) ? t(`builtin.${id}.purpose`) : "";
}

/** A built-in template, with subject/body in the client's language when given. */
export function getTemplate(
  id: string | null | undefined,
  language?: string | null
): MessageTemplate | null {
  if (!id) return null;
  const base = MESSAGE_TEMPLATES.find((t) => t.id === id);
  if (!base) return null;
  const copy = templateCopy(id, language);
  return copy ? { ...base, ...copy } : base;
}

export type MessageVars = {
  first_name: string;
  full_name: string;
  budget: string;
  property: string;
  agency: string;
};

/** Replace {{var}} placeholders; unknown/empty vars collapse gracefully. */
export function fillTemplate(text: string, vars: MessageVars): string {
  return text
    .replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const value = vars[key as keyof MessageVars];
      return value && value.trim() ? value : "";
    })
    .replace(/\s{2,}/g, " ")
    .replace(/\(\s*\)/g, "")
    .trim();
}

export type TemplateVarsInput = {
  first_name: string;
  last_name: string;
  agency?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  property?: string | null;
};

// The {{budget}} fill lands inside the client's message, so its wording and
// number format follow the client's language too.
const BUDGET_PHRASES: Record<
  TemplateLanguage,
  { tag: string; from: (v: string) => string; upTo: (v: string) => string }
> = {
  English: { tag: "en-GB", from: (v) => `from ${v}`, upTo: (v) => `up to ${v}` },
  Spanish: { tag: "es-ES", from: (v) => `desde ${v}`, upTo: (v) => `hasta ${v}` },
};

export function buildVars(input: TemplateVarsInput, language?: string | null): MessageVars {
  const phrases = BUDGET_PHRASES[templateLanguage(language)];
  const money = (v: number) => formatCurrency(v, phrases.tag);
  const min = input.budgetMin ?? null;
  const max = input.budgetMax ?? null;
  let budget = "";
  if (min != null && max != null) budget = `${money(min)}–${money(max)}`;
  else if (min != null) budget = phrases.from(money(min));
  else if (max != null) budget = phrases.upTo(money(max));

  return {
    first_name: input.first_name,
    full_name: `${input.first_name} ${input.last_name}`.trim(),
    budget,
    property: input.property ?? "",
    agency: input.agency ?? "",
  };
}
