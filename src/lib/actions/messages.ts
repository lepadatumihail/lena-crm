"use server";

import { createClient as createSupabase } from "@/lib/supabase/server";
import { openrouterChat } from "@/lib/openrouter";
import { formatCurrency } from "@/lib/crm";

type DraftResult = { subject: string; body: string; error: string | null };

export async function draftMessage(input: {
  clientId: string;
  channel: "whatsapp" | "email";
  /** Current message text to polish/rewrite; empty = write from scratch. */
  draft?: string;
  language?: string;
  instruction?: string;
  /** The property this message is about (overrides the auto-detected one). */
  property?: string;
}): Promise<DraftResult> {
  const supabase = await createSupabase();

  const { data: client } = await supabase
    .from("clients")
    .select("first_name, last_name, language, side, stage, deal_type, agency")
    .eq("id", input.clientId)
    .maybeSingle();
  if (!client) return { subject: "", body: "", error: "Client not found" };

  const [prefsRes, viewingsRes, reservationRes] = await Promise.all([
    supabase
      .from("buyer_preferences")
      .select("budget_min, budget_max, bedrooms, property_types")
      .eq("client_id", input.clientId)
      .maybeSingle(),
    supabase
      .from("viewings")
      .select("title, had_offer, offer_price")
      .eq("client_id", input.clientId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("reservations")
      .select("ppc_date, notary_date, down_payment_date")
      .eq("client_id", input.clientId)
      .maybeSingle(),
  ]);

  const language =
    input.language?.trim() || client.language?.trim() || "English";

  // Compact, factual context for the model (no invented details).
  const ctx: string[] = [
    `Client: ${client.first_name} ${client.last_name}`,
    `They are a ${client.side}; pipeline stage: ${client.stage}.`,
  ];
  if (client.agency) ctx.push(`Agency: ${client.agency}.`);
  const prefs = prefsRes.data;
  if (prefs) {
    const parts: string[] = [];
    if (prefs.budget_min != null || prefs.budget_max != null) {
      const min = prefs.budget_min != null ? formatCurrency(prefs.budget_min) : "?";
      const max = prefs.budget_max != null ? formatCurrency(prefs.budget_max) : "?";
      parts.push(`budget ${min}–${max}`);
    }
    if (prefs.bedrooms != null) parts.push(`${prefs.bedrooms}+ bedrooms`);
    if (prefs.property_types?.length)
      parts.push(`types: ${prefs.property_types.join(", ")}`);
    if (parts.length) ctx.push(`Preferences: ${parts.join("; ")}.`);
  }
  const property = input.property?.trim();
  const lastViewing = (viewingsRes.data ?? [])[0];
  if (property) {
    ctx.push(`Property this message is about: ${property}.`);
  } else if (lastViewing) {
    ctx.push(
      `Most recent property of interest: ${lastViewing.title ?? "a property"}${
        lastViewing.had_offer
          ? ` (offer made${
              lastViewing.offer_price != null
                ? " of " + formatCurrency(lastViewing.offer_price)
                : ""
            })`
          : ""
      }.`
    );
  }
  const reservation = reservationRes.data;
  if (
    reservation &&
    (reservation.ppc_date || reservation.notary_date || reservation.down_payment_date)
  ) {
    ctx.push("They have an active reservation in progress.");
  }

  const channelLabel =
    input.channel === "whatsapp" ? "WhatsApp message" : "email";
  const system = [
    `You are helping an independent real-estate agent on the Costa del Sol (Marbella) write a short, warm, professional ${channelLabel} to a client.`,
    `Write entirely in ${language}.`,
    input.channel === "whatsapp"
      ? "Keep it brief and conversational like a real WhatsApp message — 1 to 3 short sentences, no subject line."
      : "Keep it concise and friendly — a short subject line and 2 to 4 sentences.",
    "Sound human and personal, never salesy or templated. Do not invent specific facts (prices, dates, addresses) that aren't in the context. End with a brief, natural sign-off (no placeholder names).",
    `Respond ONLY with a JSON object: {"subject": string, "body": string}. For WhatsApp set subject to "".`,
  ].join(" ");

  const draft = input.draft?.trim();
  const instruction = input.instruction?.trim();
  const user = [
    draft
      ? `Polish and personalise this draft into a natural, warm ${channelLabel} — keep its meaning and intent, don't invent facts:\n"""${draft}"""`
      : "Write a short, friendly message to this client.",
    instruction
      ? `Instruction from the agent — follow it closely: ${instruction}`
      : "",
    `Client context:\n${ctx.join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  let content: string;
  try {
    content = await openrouterChat([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
  } catch (e) {
    return {
      subject: "",
      body: "",
      error: e instanceof Error ? e.message : "AI request failed",
    };
  }

  const parsed = parseDraft(content);
  if (!parsed.body)
    return { subject: "", body: "", error: "Couldn't read the AI response." };
  return { subject: parsed.subject, body: parsed.body, error: null };
}

function parseDraft(content: string): { subject: string; body: string } {
  const text = content.trim();
  const candidates = [text];
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidates.push(fence[1].trim());
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) candidates.push(brace[0]);

  for (const candidate of candidates) {
    try {
      const obj = JSON.parse(candidate) as {
        subject?: unknown;
        body?: unknown;
      };
      if (obj && typeof obj.body === "string") {
        return {
          subject: typeof obj.subject === "string" ? obj.subject : "",
          body: obj.body,
        };
      }
    } catch {
      // try the next candidate
    }
  }
  return { subject: "", body: text };
}
