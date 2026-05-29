// Agent-initiated WhatsApp via free wa.me deep links — no API/key needed.

const GREETINGS: Record<string, string> = {
  English: "Hi",
  Spanish: "Hola",
  German: "Hallo",
  French: "Bonjour",
  Dutch: "Hallo",
  Swedish: "Hej",
  Italian: "Ciao",
  Russian: "Здравствуйте",
  Polish: "Cześć",
  Arabic: "مرحبا",
};

/** Normalize a stored phone into the digits-only form wa.me expects. */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let s = phone.trim();
  if (s.startsWith("00")) s = s.slice(2);
  const digits = s.replace(/\D/g, "");
  return digits.length >= 6 ? digits : null;
}

/** A friendly opener in the client's language (defaults to English). */
export function whatsappGreeting(
  firstName: string,
  language: string | null | undefined
): string {
  const hello = (language && GREETINGS[language]) || "Hi";
  return `${hello} ${firstName}, `;
}

/** Build a wa.me click-to-chat URL, or null if the phone is unusable. */
export function whatsappLink(
  phone: string | null | undefined,
  text?: string
): string | null {
  const digits = normalizePhone(phone);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
