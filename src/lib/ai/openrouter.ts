/**
 * The Vercel AI SDK's OpenRouter provider, for features that need typed
 * output (voice notes, plan 026). The older plain-fetch helpers stay in
 * `src/lib/openrouter.ts`. Server-only: the API key never reaches a browser.
 */
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const DEFAULT_EXTRACT_MODEL = "openai/gpt-4o-mini";

let provider: ReturnType<typeof createOpenRouter> | null = null;

/** Created on first use, so a missing key fails the call rather than the build. */
function openrouter() {
  if (!provider) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");
    provider = createOpenRouter({ apiKey, headers: { "X-Title": "LeadWing CRM" } });
  }
  return provider;
}

/**
 * The model that sorts a voice-note transcript into client updates. It is
 * OpenAI-served, like LeadWing's other AI features, routed only to providers
 * that don't collect data, and reports its cost.
 */
export function voiceExtractionModel() {
  const id = process.env.VOICE_EXTRACT_MODEL ?? process.env.OPENROUTER_MODEL ?? DEFAULT_EXTRACT_MODEL;
  return openrouter().chat(id, {
    usage: { include: true },
    provider: { data_collection: "deny" },
  });
}
