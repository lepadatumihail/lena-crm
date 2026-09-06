import { formatCurrency } from "@/lib/crm";
import enTemplates from "../../messages/en/templates.json";

/**
 * Built-in starting points for 1:1 client messages. Each is a scaffold the
 * agent can send as-is (after {{variable}} fill) or hand to the AI to
 * personalise. Not marketing automation — one message, one client.
 *
 * `subject`/`body` are read by the CLIENT, so they stay English here and are
 * translated (if at all) into the client's own language by the composer. The
 * agent-facing `label`/`description`/`purpose` live in the `templates` message
 * catalog, keyed by template id — read them with `templateLabel()` and friends
 * so they follow the UI language. `MESSAGE_TEMPLATES` carries the English
 * catalog values as the fallback for callers with no translator to hand.
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

/** Agent-facing copy for the built-ins, keyed by id — `templates.builtin.*`. */
const BUILTIN_COPY = enTemplates.builtin;

export type BuiltinTemplateId = keyof typeof BUILTIN_COPY;

const BUILTIN: { id: BuiltinTemplateId; subject: string; body: string }[] = [
  {
    id: "intro",
    subject: "Lovely to connect, {{first_name}}",
    body: "Hi {{first_name}}, lovely to connect! I'd love to help you find the right home. Tell me a bit about what you're looking for and I'll get to work.",
  },
  {
    id: "new_matches",
    subject: "A couple of places I think you'll like",
    body: "Hi {{first_name}}, a few new listings just came up that fit what you're after ({{budget}}). Want me to send the details or set up a viewing this week?",
  },
  {
    id: "viewing_confirm",
    subject: "Confirming your viewing",
    body: "Hi {{first_name}}, just confirming our viewing of {{property}}. Looking forward to showing you around — let me know if anything changes.",
  },
  {
    id: "offer_followup",
    subject: "Update on your offer",
    body: "Hi {{first_name}}, just following up on your offer for {{property}}. I'm chasing the other side and will update you the moment I hear back.",
  },
  {
    id: "reservation_next",
    subject: "Next steps on your reservation",
    body: "Hi {{first_name}}, congratulations again! Here's what happens next with the reservation. I'll guide you through each step — shout with any questions.",
  },
  {
    id: "check_in",
    subject: "Still thinking about a move?",
    body: "Hi {{first_name}}, it's been a little while — are you still on the lookout? The market's moving and I'd love to help when you're ready.",
  },
];

export const MESSAGE_TEMPLATES: MessageTemplate[] = BUILTIN.map((t) => ({
  ...t,
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

export function getTemplate(id: string | null | undefined): MessageTemplate | null {
  if (!id) return null;
  return MESSAGE_TEMPLATES.find((t) => t.id === id) ?? null;
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

export function buildVars(input: {
  first_name: string;
  last_name: string;
  agency?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  property?: string | null;
}): MessageVars {
  const min = input.budgetMin ?? null;
  const max = input.budgetMax ?? null;
  let budget = "";
  if (min != null && max != null)
    budget = `${formatCurrency(min)}–${formatCurrency(max)}`;
  else if (min != null) budget = `from ${formatCurrency(min)}`;
  else if (max != null) budget = `up to ${formatCurrency(max)}`;

  return {
    first_name: input.first_name,
    full_name: `${input.first_name} ${input.last_name}`.trim(),
    budget,
    property: input.property ?? "",
    agency: input.agency ?? "",
  };
}
