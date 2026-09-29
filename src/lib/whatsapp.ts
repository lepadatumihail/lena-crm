// Agent-initiated WhatsApp via free wa.me deep links — no API/key needed.

import type { Locale as DateFnsLocale } from "date-fns";
import { ar, de, enGB, es, fr, it, nl, pl, ru, sv } from "date-fns/locale";

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

type Reminder = {
  /** `w` = what (property/title, may be empty → localized fallback noun),
   * `t` = when (the day, `at`, then the time). */
  body: (w: string, t: string) => string;
  /** date-fns pattern for the day, read with `locale`. */
  day: string;
  locale: DateFnsLocale;
  /** The word between the day and the time. */
  at: string;
};

// Short reminder phrasing per language, with the day and time worded to
// match, so a Spanish message never carries an English date.
const REMINDERS: Record<string, Reminder> = {
  English: {
    body: (w, t) =>
      `just a reminder about ${w || "our appointment"} on ${t}. See you then!`,
    day: "EEE d MMM",
    locale: enGB,
    at: "at",
  },
  Spanish: {
    body: (w, t) =>
      `un recordatorio sobre ${w || "nuestra cita"} el ${t}. ¡Nos vemos!`,
    day: "EEEE d 'de' MMMM",
    locale: es,
    at: "a las",
  },
  German: {
    body: (w, t) =>
      `eine kurze Erinnerung an ${w || "unseren Termin"} am ${t}. Bis dann!`,
    day: "EEEE, d. MMMM",
    locale: de,
    at: "um",
  },
  French: {
    body: (w, t) =>
      `un petit rappel concernant ${w || "notre rendez-vous"} le ${t}. À bientôt !`,
    day: "EEEE d MMMM",
    locale: fr,
    at: "à",
  },
  Dutch: {
    body: (w, t) =>
      `een herinnering voor ${w || "onze afspraak"} op ${t}. Tot dan!`,
    day: "EEEE d MMMM",
    locale: nl,
    at: "om",
  },
  Swedish: {
    body: (w, t) => `en påminnelse om ${w || "vårt möte"} ${t}. Vi ses!`,
    day: "EEEE 'den' d MMMM",
    locale: sv,
    at: "kl.",
  },
  Italian: {
    body: (w, t) =>
      `un promemoria per ${w || "il nostro appuntamento"} ${t}. A presto!`,
    day: "EEEE d MMMM",
    locale: it,
    at: "alle",
  },
  Russian: {
    body: (w, t) => `напоминаю о ${w || "нашей встрече"} — ${t}. До встречи!`,
    day: "EEEE, d MMMM",
    locale: ru,
    at: "в",
  },
  Polish: {
    body: (w, t) =>
      `przypomnienie o ${w || "naszym spotkaniu"} — ${t}. Do zobaczenia!`,
    day: "EEEE, d MMMM",
    locale: pl,
    at: "o",
  },
  Arabic: {
    body: (w, t) => `تذكير بخصوص ${w || "موعدنا"} في ${t}. إلى اللقاء!`,
    day: "'يوم' EEEE d MMMM",
    locale: ar,
    at: "الساعة",
  },
};

function reminderIn(language: string | null | undefined): Reminder {
  return (language && REMINDERS[language]) || REMINDERS.English;
}

/**
 * How a reminder words its date in the client's language (English when the
 * language has none): the day pattern and its date-fns locale, and the word
 * that joins the day to the time ("at", "a las", "в").
 */
export function reminderDateWording(
  language: string | null | undefined
): Pick<Reminder, "day" | "locale" | "at"> {
  const { day, locale, at } = reminderIn(language);
  return { day, locale, at };
}

/** A short reminder: localized opener + body in the client's language. */
export function reminderMessage(
  firstName: string,
  language: string | null | undefined,
  what: string,
  when: string
): string {
  return (
    whatsappGreeting(firstName, language) +
    reminderIn(language).body((what || "").trim(), when)
  );
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
