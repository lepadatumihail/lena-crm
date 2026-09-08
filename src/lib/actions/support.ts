"use server";

import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";

import { planState } from "@/lib/access";
import { emailConfigured, sendEmail } from "@/lib/email";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";
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

/**
 * Files a message from the in-app help dialog to the support inbox.
 *
 * Reply-to is whatever address the agent put in the form, so answering is one
 * click; the account they are actually signed in as goes in the body, so an
 * edited address can't obscure who wrote.
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

  if (!emailConfigured())
    return { error: t("notConfigured", { email: SUPPORT_EMAIL }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, founding_number, subscription_status, pro_until")
    .eq("id", user.id)
    .maybeSingle();
  const plan = planState(profile);

  const label = KIND_LABEL[v.kind];
  const subject = v.subject?.trim()
    ? `[${label}] ${v.subject.trim()}`
    : `[${label}] from ${v.replyTo}`;

  const facts = [
    ["Type", label],
    ["Reply to", v.replyTo],
    ["Account", `${user.email ?? "—"} (${user.id})`],
    [
      "Plan",
      `${plan.tier}${plan.source ? ` (${plan.source})` : ""}${
        profile?.founding_number ? ` · founding #${profile.founding_number}` : ""
      }`,
    ],
    ["Language", locale],
    ["Page", context.path || "—"],
    ["Browser", (await headers()).get("user-agent") ?? "—"],
    ["Sent", new Date().toISOString()],
  ];

  const text = [
    v.message,
    "",
    "—",
    ...facts.map(([k, value]) => `${k}: ${value}`),
  ].join("\n");

  try {
    await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `${SITE_NAME} · ${subject}`,
      text,
      replyTo: v.replyTo,
    });
  } catch (e) {
    // The provider's reason (a bad key or an unverified sending domain are the
    // usual two) belongs in the server log, not in front of the agent; the
    // dialog offers a mailto: fallback so the message isn't stranded either way.
    console.error("[support] send failed:", e);
    return { error: t("sendFailed", { email: SUPPORT_EMAIL }) };
  }

  return { error: null };
}
