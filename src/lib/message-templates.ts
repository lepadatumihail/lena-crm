import { formatCurrency } from "@/lib/crm";

/**
 * Built-in starting points for 1:1 client messages. Each is a scaffold the
 * agent can send as-is (after {{variable}} fill) or hand to the AI to
 * personalise. Not marketing automation — one message, one client.
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

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "intro",
    label: "Introduce yourself",
    description: "Warm first hello to a new lead",
    subject: "Lovely to connect, {{first_name}}",
    body: "Hi {{first_name}}, lovely to connect! I help buyers find the right home on the Costa del Sol. Tell me a bit about what you're looking for and I'll get to work.",
    purpose:
      "Introduce yourself warmly to a brand-new lead and invite them to share what they're looking for.",
  },
  {
    id: "new_matches",
    label: "New matching listings",
    description: "Share properties that fit their criteria",
    subject: "A couple of places I think you'll like",
    body: "Hi {{first_name}}, a few new listings just came up that fit what you're after ({{budget}}). Want me to send the details or set up a viewing this week?",
    purpose:
      "Tell the buyer that new listings matching their budget and preferences are available and offer to share details or book a viewing.",
  },
  {
    id: "viewing_confirm",
    label: "Confirm a viewing",
    description: "Confirm an upcoming appointment",
    subject: "Confirming your viewing",
    body: "Hi {{first_name}}, just confirming our viewing of {{property}}. Looking forward to showing you around — let me know if anything changes.",
    purpose:
      "Confirm an upcoming property viewing and reassure them you're looking forward to it.",
  },
  {
    id: "offer_followup",
    label: "Offer follow-up",
    description: "Check in after an offer was made",
    subject: "Update on your offer",
    body: "Hi {{first_name}}, just following up on your offer for {{property}}. I'm chasing the other side and will update you the moment I hear back.",
    purpose:
      "Follow up on an offer the buyer made, letting them know you're actively chasing a response.",
  },
  {
    id: "reservation_next",
    label: "Reservation next steps",
    description: "Walk through what happens next",
    subject: "Next steps on your reservation",
    body: "Hi {{first_name}}, congratulations again! Here's what happens next with the reservation. I'll guide you through each step — shout with any questions.",
    purpose:
      "Reassure a buyer who has reserved a property and outline that you'll guide them through the next steps.",
  },
  {
    id: "check_in",
    label: "Check in / re-engage",
    description: "Gently reconnect with a quiet lead",
    subject: "Still thinking about a move?",
    body: "Hi {{first_name}}, it's been a little while — are you still on the lookout? The market's moving and I'd love to help when you're ready.",
    purpose:
      "Gently re-engage a lead who has gone quiet, without pressure, and offer to help when they're ready.",
  },
];

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
