"use server";

import { getTranslations } from "next-intl/server";

import { revalidatePath } from "next/cache";

import { createClient as createSupabase } from "@/lib/supabase/server";
import { FREE_CLIENT_LIMIT, canAddClient } from "@/lib/access";
import { pickSpelling } from "@/lib/agencies";
import { BUYER_STAGES, SELLER_STAGES, defaultStageForSide } from "@/lib/crm";
import { collectClientFilePaths, removeFilePaths } from "@/lib/storage/client-files";
import {
  clientFormSchema,
  type ClientFormValues,
} from "@/lib/validation/client";

type ActionResult = { error: string | null };

export type CreateClientResult = {
  error: string | null;
  id?: string;
  /** The Free plan's client cap was hit; the UI shows the upgrade prompt. */
  limitReached?: boolean;
};

async function limitMessage(): Promise<string> {
  const t = await getTranslations("clients.errors");
  return t("limitReached", { limit: FREE_CLIENT_LIMIT });
}

/**
 * Free agents may hold FREE_CLIENT_LIMIT clients. Checked here for a friendly
 * answer; the database trigger `clients_enforce_free_limit` is the backstop.
 * Missing profile data (e.g. before the billing migration runs) is left to
 * the trigger rather than blocking anyone in the app.
 */
async function freeLimitReached(
  supabase: Awaited<ReturnType<typeof createSupabase>>,
  userId: string
): Promise<boolean> {
  const [{ data: profile, error }, { count }] = await Promise.all([
    supabase
      .from("profiles")
      .select("subscription_status, pro_until, is_admin")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("clients").select("id", { count: "exact", head: true }),
  ]);
  if (error) return false;
  return !canAddClient(profile, count ?? 0);
}

/**
 * One spelling per agency: a new value snaps to the spelling the agent's
 * other clients already use. The edited row is left out, so a name only that
 * client uses can still be corrected ("solvilla" → "Solvilla").
 */
async function canonicalAgency(
  supabase: Awaited<ReturnType<typeof createSupabase>>,
  raw: string | undefined,
  selfId?: string
): Promise<string | null> {
  if (!raw?.trim()) return null;
  let query = supabase
    .from("clients")
    .select("agency")
    .not("agency", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (selfId) query = query.neq("id", selfId);
  // A failed read must not block the save: keep the cleaned input.
  const { data } = await query;
  return pickSpelling(
    (data ?? []).map((c) => c.agency),
    raw
  );
}

export async function createClient(
  values: ClientFormValues
): Promise<CreateClientResult> {
  const t = await getTranslations("clients.errors");
  const parsed = clientFormSchema(await getTranslations("validation")).safeParse(values);
  if (!parsed.success) return { error: t("invalidForm") };
  const v = parsed.data;

  const supabase = await createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const tCommon = await getTranslations("common");
    return { error: tCommon("errors.notAuthenticated") };
  }
  if (await freeLimitReached(supabase, user.id)) {
    return { error: await limitMessage(), limitReached: true };
  }

  const agency = await canonicalAgency(supabase, v.agency);
  const { data, error } = await supabase
    .from("clients")
    .insert({
      side: v.side,
      first_name: v.first_name,
      last_name: v.last_name,
      email: v.email || null,
      phone: v.phone || null,
      language: v.language || null,
      nationality: v.nationality || null,
      agency,
      notes: v.notes || null,
      priority: v.priority,
      stage: defaultStageForSide(v.side),
      deal_type: v.side === "buyer" ? (v.deal_type ?? null) : null,
      seller_role: v.side === "seller" ? (v.seller_role ?? null) : null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("client_limit_reached")) {
      return { error: await limitMessage(), limitReached: true };
    }
    return { error: error.message };
  }
  revalidatePath("/clients");
  return { error: null, id: data.id };
}

export async function updateClient(
  id: string,
  values: ClientFormValues
): Promise<ActionResult> {
  const t = await getTranslations("clients.errors");
  const parsed = clientFormSchema(await getTranslations("validation")).safeParse(values);
  if (!parsed.success) return { error: t("invalidForm") };
  const v = parsed.data;

  const supabase = await createSupabase();
  const agency = await canonicalAgency(supabase, v.agency, id);
  const { error } = await supabase
    .from("clients")
    .update({
      first_name: v.first_name,
      last_name: v.last_name,
      email: v.email || null,
      phone: v.phone || null,
      language: v.language || null,
      nationality: v.nationality || null,
      agency,
      notes: v.notes || null,
      priority: v.priority,
      deal_type: v.side === "buyer" ? (v.deal_type ?? null) : null,
      seller_role: v.side === "seller" ? (v.seller_role ?? null) : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { error: null };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const supabase = await createSupabase();

  // Gather every storage object owned by this client before deleting the row.
  // The DB rows cascade away, but the bucket files do not, so collect their
  // paths first or they leak.
  const paths = await collectClientFilePaths(supabase, [id]);
  await removeFilePaths(supabase, paths);

  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clients");
  return { error: null };
}

const VALID_STAGES: readonly string[] = [...BUYER_STAGES, ...SELLER_STAGES];

export async function updateClientStage(
  id: string,
  stage: string
): Promise<ActionResult> {
  if (!VALID_STAGES.includes(stage)) {
    const t = await getTranslations("clients.errors");
    return { error: t("invalidStage") };
  }

  const supabase = await createSupabase();
  const { error } = await supabase
    .from("clients")
    .update({ stage })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { error: null };
}

export async function setClientPriority(
  id: string,
  priority: boolean
): Promise<ActionResult> {
  const supabase = await createSupabase();
  const { error } = await supabase
    .from("clients")
    .update({ priority })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { error: null };
}

export async function setClientActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const supabase = await createSupabase();
  const { error } = await supabase
    .from("clients")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { error: null };
}
