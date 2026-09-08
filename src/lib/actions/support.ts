"use server";

import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";

import { planState } from "@/lib/access";
import { emailConfigured, sendEmail } from "@/lib/email";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSupabase } from "@/lib/supabase/server";
import {
  supportFormSchema,
  type SupportFormValues,
} from "@/lib/validation/support";

type ActionResult = { error: string | null };

/** Where the agent was when they opened the dialog — the first thing you want on a bug report. */
export type SupportContext = { path?: string };

/** Subject prefixes, in English: they land in one inbox, not in the agent's UI. */
const KIND_LABEL = {
  bug: "Bug",
  feedback: "Feedback",
  feature: "Feature request",
  billing: "Billing",
  question: "Question",
} as const;

/** Truncated so a hostile user-agent string can't bloat the row. */
function short(value: string | null, max = 400): string | null {
  if (!value) return null;
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/**
 * Files a message from the in-app help dialog.
 *
 * It lands in two places, in this order: a `support_messages` row, then an
 * email to the support inbox. Storing first is what makes a Resend outage cost
 * a notification rather than the message — `delivered_at` on the row says
 * whether the email actually went out.
 *
 * Reply-to is whatever address the agent put in the form, so answering is one
 * click; the account they are actually signed in as is recorded either way, so
 * an edited address can't obscure who wrote.
 */
export async function sendSupportMessage(
  values: SupportFormValues,
  context: SupportContext = {}
): Promise<ActionResult> {
  const [supabase, t, tv, locale] = await Promise.all([
    createSupabase(),
    getTranslations("support.errors"),
    getTranslations("validation"),
    getLocale(),
  ]);

  // Server Actions are reachable by direct POST, so re-check the session here
  // rather than trusting that the dialog is only rendered behind the layout.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("notAuthenticated") };

  const parsed = supportFormSchema(tv).safeParse(values);
  if (!parsed.success) return { error: t("checkForm") };
  const v = parsed.data;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, founding_number, subscription_status, pro_until")
    .eq("id", user.id)
    .maybeSingle();
  const state = planState(profile);
  const planLabel = `${state.tier}${state.source ? ` (${state.source})` : ""}${
    profile?.founding_number ? ` · founding #${profile.founding_number}` : ""
  }`;

  const subject = v.subject?.trim() || null;
  const page = context.path || null;
  const userAgent = short((await headers()).get("user-agent"));

  // ---- 1. Record it. The table is service-role only (RLS on, no policies). ----
  let messageId: string | null = null;
  try {
    const { data, error } = await createAdminClient()
      .from("support_messages")
      .insert({
        agent_id: user.id,
        kind: v.kind,
        reply_to: v.replyTo,
        account_email: user.email ?? null,
        subject,
        message: v.message,
        page,
        locale,
        plan: planLabel,
        user_agent: userAgent,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    messageId = data.id;
  } catch (e) {
    // Losing the row is survivable as long as the email goes out, so carry on
    // and let the send decide what the agent sees.
    console.error("[support] could not store message:", e);
  }

  // ---- 2. Email it. ----
  const label = KIND_LABEL[v.kind];
  const emailSubject = subject
    ? `[${label}] ${subject}`
    : `[${label}] from ${v.replyTo}`;

  const facts = [
    ["Type", label],
    ["Reply to", v.replyTo],
    ["Account", `${user.email ?? "—"} (${user.id})`],
    ["Plan", planLabel],
    ["Language", locale],
    ["Page", page ?? "—"],
    ["Browser", userAgent ?? "—"],
    ["Sent", new Date().toISOString()],
    ["Record", messageId ?? "not stored"],
  ];

  let deliveryError: string | null = null;
  if (!emailConfigured()) {
    deliveryError = "RESEND_API_KEY is not set";
  } else {
    try {
      await sendEmail({
        to: SUPPORT_EMAIL,
        subject: `${SITE_NAME} · ${emailSubject}`,
        text: [
          v.message,
          "",
          "—",
          ...facts.map(([k, value]) => `${k}: ${value}`),
        ].join("\n"),
        replyTo: v.replyTo,
      });
    } catch (e) {
      deliveryError = e instanceof Error ? e.message : "send failed";
    }
  }

  // ---- 3. Mark the row either way, so `delivered_at is null` is the real queue. ----
  if (messageId) {
    const { error } = await createAdminClient()
      .from("support_messages")
      .update(
        deliveryError
          ? { delivery_error: short(deliveryError, 1000) }
          : { delivered_at: new Date().toISOString(), delivery_error: null }
      )
      .eq("id", messageId);
    if (error) console.error("[support] could not mark delivery:", error.message);
  }

  if (deliveryError) {
    // The provider's reason belongs in the log, not in front of the agent.
    console.error("[support] send failed:", deliveryError);
    // A stored row means we have the message — the founder's undelivered queue
    // will surface it — so only a total loss is worth alarming the agent about.
    if (!messageId) return { error: t("sendFailed", { email: SUPPORT_EMAIL }) };
  }

  return { error: null };
}
