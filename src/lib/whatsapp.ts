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

// Short reminder phrasing per language. `w` = what (property/title, may be
// empty → localized fallback noun), `t` = when (formatted date/time).
const REMINDERS: Record<string, (w: string, t: string) => string> = {
  English: (w, t) =>
    `just a reminder about ${w || "our appointment"} on ${t}. See you then!`,
  Spanish: (w, t) =>
    `un recordatorio sobre ${w || "nuestra cita"} el ${t}. ¡Nos vemos!`,
  German: (w, t) =>
    `eine kurze Erinnerung an ${w || "unseren Termin"} am ${t}. Bis dann!`,
  French: (w, t) =>
    `un petit rappel concernant ${w || "notre rendez-vous"} le ${t}. À bientôt !`,
  Dutch: (w, t) =>
    `een herinnering voor ${w || "onze afspraak"} op ${t}. Tot dan!`,
  Swedish: (w, t) => `en påminnelse om ${w || "vårt möte"} den ${t}. Vi ses!`,
  Italian: (w, t) =>
    `un promemoria per ${w || "il nostro appuntamento"} il ${t}. A presto!`,
  Russian: (w, t) => `напоминаю о ${w || "нашей встрече"} — ${t}. До встречи!`,
  Polish: (w, t) =>
    `przypomnienie o ${w || "naszym spotkaniu"} — ${t}. Do zobaczenia!`,
  Arabic: (w, t) => `تذكير بخصوص ${w || "موعدنا"} في ${t}. إلى اللقاء!`,
};

/** A short reminder: localized opener + body in the client's language. */
export function reminderMessage(
  firstName: string,
  language: string | null | undefined,
  what: string,
  when: string
): string {
  const body = (language && REMINDERS[language]) || REMINDERS.English;
  return whatsappGreeting(firstName, language) + body((what || "").trim(), when);
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
