const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * Minimal OpenRouter chat completion. Server-only — the API key is never
 * exposed to the client.
 */
export async function openrouterChat(
  messages: ChatMessage[],
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "X-Title": "LeadWing CRM",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
      messages,
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 600,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

const TRANSCRIBE_URL = "https://openrouter.ai/api/v1/audio/transcriptions";
export const DEFAULT_TRANSCRIBE_MODEL = "openai/gpt-4o-mini-transcribe";

export type Transcription = { text: string; seconds: number | null; cost: number | null };

/**
 * Speech to text for voice notes (plan 026). OpenAI's transcription models
 * have no zero-data-retention endpoint, so requests only go to providers that
 * don't collect data (founder's choice, 8 Nov 2026). An error carries the
 * HTTP status only, because a provider's error body can echo the input.
 */
export async function openrouterTranscribe(
  input: { audio: Uint8Array; format: string; language?: string },
  fetchImpl: typeof fetch = fetch
): Promise<Transcription> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");

  const res = await fetchImpl(TRANSCRIBE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "X-Title": "LeadWing CRM",
    },
    body: JSON.stringify({
      model: process.env.VOICE_TRANSCRIBE_MODEL ?? DEFAULT_TRANSCRIBE_MODEL,
      input_audio: { data: Buffer.from(input.audio).toString("base64"), format: input.format },
      ...(input.language ? { language: input.language } : {}),
      provider: { data_collection: "deny" },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`transcribe:${res.status}`);

  const data = (await res.json()) as { text?: unknown; usage?: { seconds?: unknown; cost?: unknown } };
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  return {
    text: typeof data.text === "string" ? data.text.trim() : "",
    seconds: num(data.usage?.seconds),
    cost: num(data.usage?.cost),
  };
}
