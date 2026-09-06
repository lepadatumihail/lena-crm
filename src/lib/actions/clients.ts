"use server";

import { revalidatePath } from "next/cache";

import { createClient as createSupabase } from "@/lib/supabase/server";
import { FREE_CLIENT_LIMIT, canAddClient } from "@/lib/access";
import { BUYER_STAGES, SELLER_STAGES, defaultStageForSide } from "@/lib/crm";
import {
  clientFormSchema,
  type ClientFormValues,
} from "@/lib/validation/client";

type ActionResult = { error: string | null };

const STORAGE_BUCKET = "attachments";
const REMOVE_CHUNK_SIZE = 100;

export type CreateClientResult = {
  error: string | null;
  id?: string;
  /** The Free plan's client cap was hit; the UI shows the upgrade prompt. */
  limitReached?: boolean;
};

const LIMIT_MESSAGE = `You've used your ${FREE_CLIENT_LIMIT} free clients. Pro is unlimited.`;

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
      .select("subscription_status, pro_until")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("clients").select("id", { count: "exact", head: true }),
  ]);
  if (error) return false;
  return !canAddClient(profile, count ?? 0);
}

export async function createClient(
  values: ClientFormValues
): Promise<CreateClientResult> {
  const parsed = clientFormSchema.safeParse(values);
  if (!parsed.success) return { error: "Please check the form and try again." };
  const v = parsed.data;

  const supabase = await createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (await freeLimitReached(supabase, user.id)) {
    return { error: LIMIT_MESSAGE, limitReached: true };
  }

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
      agency: v.agency || null,
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
      return { error: LIMIT_MESSAGE, limitReached: true };
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
  const parsed = clientFormSchema.safeParse(values);
  if (!parsed.success) return { error: "Please check the form and try again." };
  const v = parsed.data;

  const supabase = await createSupabase();
  const { error } = await supabase
    .from("clients")
    .update({
      first_name: v.first_name,
      last_name: v.last_name,
      email: v.email || null,
      phone: v.phone || null,
      language: v.language || null,
      nationality: v.nationality || null,
      agency: v.agency || null,
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
  const paths: string[] = [];

  const { data: docs } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("client_id", id);
  for (const d of docs ?? []) paths.push(d.storage_path);

  const { data: viewings } = await supabase
    .from("viewings")
    .select("id")
    .eq("client_id", id);
  const viewingIds = (viewings ?? []).map((v) => v.id);
  if (viewingIds.length) {
    const { data: atts } = await supabase
      .from("viewing_attachments")
      .select("storage_path")
      .in("viewing_id", viewingIds);
    for (const a of atts ?? []) paths.push(a.storage_path);
  }

  for (let i = 0; i < paths.length; i += REMOVE_CHUNK_SIZE) {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(paths.slice(i, i + REMOVE_CHUNK_SIZE));
  }

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
  if (!VALID_STAGES.includes(stage)) return { error: "Invalid stage" };

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
