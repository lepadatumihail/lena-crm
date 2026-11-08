"use server";

import { createHmac } from "node:crypto";

import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { after } from "next/server";

import {
  BUDGETS,
  CLIENT_LANGUAGE,
  bedroomCount,
  budgetRange,
  enquiryDetails,
  enquiryInputSchema,
  looksLikeBot,
  parseContact,
  pickAreas,
  splitName,
  type EnquiryInput,
} from "@/lib/agent-pages/enquiry";
import { findPublishedPage } from "@/lib/data/agent-pages";
import { DEFAULT_LOCALE, intlTag, isLocale } from "@/i18n/config";
import { languageLabel, propertyTypeLabel } from "@/i18n/labels";
import { emailConfigured, sendEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

export type EnquiryResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "name" | "contact" | "rate" | "server" };

const HOUR_MS = 3_600_000;
/** One person (one address, one day) can send this many an hour. */
const PER_SENDER_PER_HOUR = 5;
/** A page takes at most this many a day, whoever sends them. */
const PER_PAGE_PER_DAY = 40;

/**
 * An HMAC of the sender's IP and the day: enough to tell one sender's
 * messages apart for the rate limit, without storing the IP or anything that
 * links one day's sender to the next.
 */
function senderKey(ip: string | null): string | null {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!ip || !secret) return null;
  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", secret).update(`agent-page|${ip}|${day}`).digest("base64url").slice(0, 32);
}

/** "€400K–€800K" in the agent's language, for the bell and the email. */
function budgetLabel(key: EnquiryInput["budget"], locale: string): string | null {
  const band = BUDGETS.find((b) => b.key === key);
  if (!band) return null;
  const money = new Intl.NumberFormat(intlTag(locale), {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  if (band.min === null) return `≤ ${money.format(band.max)}`;
  if (band.max === null) return `≥ ${money.format(band.min)}`;
  return `${money.format(band.min)}–${money.format(band.max)}`;
}

/**
 * The page form's server action. Public: anyone can call it, so it trusts
 * nothing it is sent. The page must exist and be published; areas are kept
 * only if the page offers them; a sender gets a few tries an hour and a page
 * a few dozen a day. A bot (hidden field filled, or sent in under a couple
 * of seconds) is told it worked and nothing is stored.
 *
 * The enquiry becomes a client of the page's owner, with the wishes filled
 * in, a bell notification and an email; the Free plan's client cap lets it
 * through (20261108140000), because a buyer who wrote in must never bounce.
 */
export async function sendPageEnquiry(raw: unknown): Promise<EnquiryResult> {
  const parsed = enquiryInputSchema.safeParse(raw);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return {
      ok: false,
      error: field === "name" ? "name" : field === "contact" ? "contact" : "invalid",
    };
  }
  const input = parsed.data;
  if (looksLikeBot(input)) return { ok: true };

  const contact = parseContact(input.contact);
  if (!contact) return { ok: false, error: "contact" };

  let found: Awaited<ReturnType<typeof findPublishedPage>>;
  try {
    found = await findPublishedPage(input.slug);
  } catch (error) {
    console.error("page enquiry: page lookup failed:", error);
    return { ok: false, error: "server" };
  }
  if (!found) return { ok: false, error: "invalid" };
  const { page } = found;
  const admin = createAdminClient();

  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    null;
  const key = senderKey(ip);
  const now = Date.now();

  if (key) {
    const { count } = await admin
      .from("page_enquiries")
      .select("id", { count: "exact", head: true })
      .eq("sender_key", key)
      .gte("received_at", new Date(now - HOUR_MS).toISOString());
    if ((count ?? 0) >= PER_SENDER_PER_HOUR) return { ok: false, error: "rate" };
  }
  const { count: todays } = await admin
    .from("page_enquiries")
    .select("id", { count: "exact", head: true })
    .eq("page_id", page.id)
    .gte("received_at", new Date(now - 24 * HOUR_MS).toISOString());
  if ((todays ?? 0) >= PER_PAGE_PER_DAY) return { ok: false, error: "rate" };

  const isBuy = input.kind === "buy";
  const areas = isBuy ? pickAreas(input.areas, page.areas) : [];
  const details = enquiryDetails(input, areas);
  const { first, last } = splitName(input.name);
  const clientLanguage = CLIENT_LANGUAGE[input.lang];

  // Everything the agent reads is in their own app language.
  const { data: profile } = await admin
    .from("profiles")
    .select("email, locale")
    .eq("id", page.agentId)
    .maybeSingle();
  const profileLocale = profile?.locale;
  const locale = isLocale(profileLocale) ? profileLocale : DEFAULT_LOCALE;
  const [t, tCrm] = await Promise.all([
    getTranslations({ locale, namespace: "notifications.pageEnquiry" }),
    getTranslations({ locale, namespace: "crm" }),
  ]);
  const language = languageLabel(tCrm, clientLanguage);
  const message = input.message?.trim() || null;

  const noteLines = [t("note", { language })];
  if (page.isExample) noteLines.push(t("noteExample"));
  if (isBuy && input.when) noteLines.push(t("noteWhen", { when: t(`when.${input.when}`) }));
  if (!isBuy && input.sellWhen) {
    noteLines.push(t("noteWhen", { when: t(`sellWhen.${input.sellWhen}`) }));
  }
  if (!isBuy && input.where) noteLines.push(t("noteWhere", { where: input.where }));
  if (message) noteLines.push(`“${message}”`);

  const { data: client, error: clientError } = await admin
    .from("clients")
    .insert({
      agent_id: page.agentId,
      side: isBuy ? "buyer" : "seller",
      first_name: first,
      last_name: last,
      email: "email" in contact ? contact.email : null,
      phone: "phone" in contact ? contact.phone : null,
      language: clientLanguage,
      notes: noteLines.join("\n"),
      stage: isBuy ? "new" : "pending",
      seller_role: isBuy ? null : "owner",
      source: "page",
    })
    .select("id")
    .single();
  if (clientError) console.error("page enquiry: client insert failed:", clientError.message);

  if (client && isBuy) {
    const { min, max } = budgetRange(input.budget);
    const { error } = await admin.from("buyer_preferences").insert({
      client_id: client.id,
      agent_id: page.agentId,
      budget_min: min,
      budget_max: max,
      bedrooms: bedroomCount(input.beds),
      area_notes: areas.length ? areas.join(", ") : null,
    });
    if (error) console.error("page enquiry: wishes insert failed:", error.message);
  }
  if (client && !isBuy && (input.where || input.homeType)) {
    const { error } = await admin.from("properties").insert({
      client_id: client.id,
      agent_id: page.agentId,
      address: input.where || null,
      property_type: input.homeType ?? null,
    });
    if (error) console.error("page enquiry: property insert failed:", error.message);
  }

  const { data: enquiry, error: enquiryError } = await admin
    .from("page_enquiries")
    .insert({
      agent_id: page.agentId,
      page_id: page.id,
      client_id: client?.id ?? null,
      kind: input.kind,
      lang: input.lang,
      name: input.name,
      contact: input.contact,
      details,
      message,
      sender_key: key,
    })
    .select("id")
    .single();
  if (enquiryError) {
    console.error("page enquiry: enquiry insert failed:", enquiryError.message);
    // Nothing was kept anywhere: let the sender try again or use WhatsApp.
    if (!client) return { ok: false, error: "server" };
  }

  // One line for the bell and the email: "Buying · Swedish · €400K–€800K · …".
  const summary = [
    isBuy ? t("buying") : t("selling"),
    language,
    isBuy ? budgetLabel(input.budget, locale) : null,
    isBuy && input.beds
      ? input.beds === "4+"
        ? t("bedroomsMore")
        : t("bedrooms", { count: bedroomCount(input.beds) ?? 0 })
      : null,
    isBuy && areas.length ? areas.join(", ") : null,
    !isBuy && input.homeType ? propertyTypeLabel(tCrm, input.homeType) : null,
    !isBuy && input.where ? input.where : null,
  ]
    .filter(Boolean)
    .join(" · ");

  if (client) {
    const { error } = await admin.from("notifications").insert({
      agent_id: page.agentId,
      type: "page_enquiry",
      title: t("title", { name: input.name }),
      body: summary,
      client_id: client.id,
      dedupe_key: `page-enquiry:${enquiry?.id ?? client.id}`,
      due_at: new Date(now).toISOString(),
    });
    if (error) console.error("page enquiry: notification insert failed:", error.message);
  }

  const to = profile?.email;
  if (to && emailConfigured()) {
    const link = client ? absoluteUrl(`/clients/${client.id}`) : absoluteUrl("/clients/buyers");
    const text = [
      t("emailIntro", { name: input.name, language }),
      "",
      summary,
      ...(message ? ["", t("emailMessage"), `“${message}”`] : []),
      "",
      t("emailContact", { contact: input.contact }),
      "",
      t("emailCta"),
      link,
      "",
      "—",
      t("emailFooter"),
    ].join("\n");
    after(async () => {
      try {
        await sendEmail({
          to,
          subject: t("emailSubject", { name: input.name }),
          text,
          replyTo: "email" in contact ? contact.email : undefined,
        });
      } catch (error) {
        console.error("page enquiry: email failed:", error instanceof Error ? error.message : error);
      }
    });
  }

  return { ok: true };
}
