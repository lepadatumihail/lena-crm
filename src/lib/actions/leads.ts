"use server";

import { getLocale, getTranslations } from "next-intl/server";

import { createClient as createSupabase } from "@/lib/supabase/server";
import { openrouterChat } from "@/lib/openrouter";

export type ExtractedLead = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  language: string;
  nationality: string;
  notes: string;
};

/** The agent reads the extracted `notes`, so the model writes them in the UI language. */
const NOTES_LANGUAGE: Record<string, string> = { en: "English", es: "Spanish", ru: "Russian" };

/**
 * Parse a raw lead message (portal inquiry, forwarded email, WhatsApp text)
 * into structured contact fields the new-client form can pre-fill.
 */
export async function extractLead(
  text: string
): Promise<{ data: ExtractedLead | null; error: string | null }> {
  const t = await getTranslations("clients.leadPaste.errors");
  const input = text.trim();
  if (!input) return { data: null, error: t("empty") };

  const supabase = await createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const tCommon = await getTranslations("common");
    return { data: null, error: tCommon("errors.notAuthenticated") };
  }
  if (input.length > 4000)
    return {
      data: null,
      error: t("tooLong"),
    };

  const notesLanguage = NOTES_LANGUAGE[await getLocale()] ?? "English";
  const system = [
    "You extract a real-estate lead's details from a raw message — a portal inquiry (Idealista, Fotocasa, Kyero), a forwarded email, or a WhatsApp/SMS text.",
    'Respond ONLY with a JSON object with these string keys: first_name, last_name, email, phone, language, nationality, notes.',
    "language: the language the lead writes in or asks to be contacted in, as an English word (e.g. English, Spanish, German, French, Dutch, Italian, Swedish, Russian, Polish, Arabic).",
    `nationality: their nationality if stated, as an English word (e.g. British, German, Swedish, Dutch). notes: a short ${notesLanguage} summary of what they want — budget, area, property type, bedrooms, timing.`,
    'Use an empty string "" for anything not present. Never invent names, emails, or phone numbers.',
  ].join(" ");

  let content: string;
  try {
    content = await openrouterChat(
      [
        { role: "system", content: system },
        { role: "user", content: `Lead message:\n"""${input}"""` },
      ],
      { temperature: 0.2 }
    );
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : t("aiFailed"),
    };
  }

  const parsed = parseLead(content);
  if (!parsed) return { data: null, error: t("unreadable") };
  return { data: parsed, error: null };
}

function parseLead(content: string): ExtractedLead | null {
  const text = content.trim();
  const candidates = [text];
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidates.push(fence[1].trim());
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) candidates.push(brace[0]);

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  for (const candidate of candidates) {
    try {
      const obj = JSON.parse(candidate) as Record<string, unknown>;
      if (obj && typeof obj === "object") {
        return {
          first_name: str(obj.first_name),
          last_name: str(obj.last_name),
          email: str(obj.email),
          phone: str(obj.phone),
          language: str(obj.language),
          nationality: str(obj.nationality),
          notes: str(obj.notes),
        };
      }
    } catch {
      // try the next candidate
    }
  }
  return null;
}
