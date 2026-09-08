/**
 * Outbound transactional email over the Resend REST API. Server-only — the
 * API key is never exposed to the browser, and no SDK is pulled in for what is
 * one POST.
 */

const RESEND_URL = "https://api.resend.com/emails";

/**
 * Envelope the support inbox is sent from. Resend only accepts a `from` on a
 * domain verified in the account, so this stays an env var: until leadwing.app
 * is verified, point it at a domain that is (Resend's own `onboarding@resend.dev`
 * works for testing, but only delivers to the account owner).
 */
export const SUPPORT_FROM =
  process.env.SUPPORT_FROM_EMAIL?.trim() || "LeadWing <info@leadwing.app>";

export type SendEmailInput = {
  to: string;
  subject: string;
  /** Plain text; Resend requires at least one of text/html. */
  text: string;
  /** Where a "Reply" goes, when that is not the sender. */
  replyTo?: string;
};

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Sends one email. Throws with the provider's message on failure so the caller
 * can decide what the person sees; it never throws the API key.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: SUPPORT_FROM,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${detail.slice(0, 300)}`);
  }
}
