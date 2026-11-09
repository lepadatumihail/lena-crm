import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_TRANSCRIBE_MODEL, openrouterTranscribe } from "./openrouter";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("openrouterTranscribe", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubEnv("VOICE_TRANSCRIBE_MODEL", undefined);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("posts raw base64 audio to the transcription endpoint, data collection denied", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ text: "  Hola Anna  ", usage: { cost: 0.0006 } }));
    const audio = new Uint8Array([1, 2, 3, 250]);

    const result = await openrouterTranscribe({ audio, format: "webm" }, fetchImpl as unknown as typeof fetch);

    expect(result).toEqual({ text: "Hola Anna", seconds: null, cost: 0.0006 });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/audio/transcriptions");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe(DEFAULT_TRANSCRIBE_MODEL);
    expect(body.input_audio).toEqual({ data: Buffer.from(audio).toString("base64"), format: "webm" });
    expect(body.input_audio.data.startsWith("data:")).toBe(false);
    expect(body.provider).toEqual({ data_collection: "deny" });
    expect(body).not.toHaveProperty("language");
  });

  it("passes a language hint and a model override when given", async () => {
    vi.stubEnv("VOICE_TRANSCRIBE_MODEL", "openai/gpt-4o-transcribe");
    const fetchImpl = vi.fn(async () => jsonResponse({ text: "x" }));
    await openrouterTranscribe({ audio: new Uint8Array([1]), format: "m4a", language: "es" }, fetchImpl as unknown as typeof fetch);
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.model).toBe("openai/gpt-4o-transcribe");
    expect(body.language).toBe("es");
  });

  it("throws the status only, never the provider's body", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: { message: "echo of secret input" } }, 404));
    await expect(
      openrouterTranscribe({ audio: new Uint8Array([1]), format: "webm" }, fetchImpl as unknown as typeof fetch)
    ).rejects.toThrow(/^transcribe:404$/);
  });

  it("needs the API key", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", undefined);
    await expect(openrouterTranscribe({ audio: new Uint8Array([1]), format: "webm" })).rejects.toThrow(/OPENROUTER_API_KEY/);
  });
});
