"use server";

import { revalidatePath } from "next/cache";

import { createClient as createSupabase } from "@/lib/supabase/server";
import {
  emptyToNull,
  preferencesFormSchema,
  reservationFormSchema,
  toNumberOrNull,
  viewingFormSchema,
  viewingScheduleSchema,
  type PreferencesFormValues,
  type ReservationFormValues,
  type ViewingFormValues,
} from "@/lib/validation/buyer";

type ActionResult = { error: string | null };

const STORAGE_BUCKET = "attachments";

export async function upsertPreferences(
  clientId: string,
  values: PreferencesFormValues
): Promise<ActionResult> {
  const parsed = preferencesFormSchema.safeParse(values);
  if (!parsed.success) return { error: "Please check the form." };
  const v = parsed.data;

  const supabase = await createSupabase();
  const { error } = await supabase.from("buyer_preferences").upsert(
    {
      client_id: clientId,
      property_types: v.property_types,
      budget_min: toNumberOrNull(v.budget_min),
      budget_max: toNumberOrNull(v.budget_max),
      bedrooms: toNumberOrNull(v.bedrooms),
      bathrooms: toNumberOrNull(v.bathrooms),
      area_notes: emptyToNull(v.area_notes),
    },
    { onConflict: "client_id" }
  );
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  return { error: null };
}

export async function saveViewing(
  clientId: string,
  viewingId: string | null,
  values: ViewingFormValues,
  schedule: { scheduled_at: string | null; reminder_minutes: number | null }
): Promise<{ error: string | null; id?: string }> {
  const parsed = viewingFormSchema.safeParse(values);
  if (!parsed.success) return { error: "Please check the form." };
  const v = parsed.data;

  const parsedSchedule = viewingScheduleSchema.safeParse(schedule);
  if (!parsedSchedule.success) return { error: "Please check the form." };
  const s = parsedSchedule.data;

  const supabase = await createSupabase();
  const row = {
    title: emptyToNull(v.title),
    description: emptyToNull(v.description),
    property_price: toNumberOrNull(v.property_price),
    had_offer: v.had_offer,
    offer_price: v.had_offer ? toNumberOrNull(v.offer_price) : null,
    scheduled_at: s.scheduled_at,
    reminder_minutes: s.reminder_minutes,
  };

  if (viewingId) {
    const { error } = await supabase
      .from("viewings")
      .update(row)
      .eq("id", viewingId);
    if (error) return { error: error.message };
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/calendar");
    return { error: null, id: viewingId };
  }

  const { data, error } = await supabase
    .from("viewings")
    .insert({ client_id: clientId, ...row })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/calendar");
  return { error: null, id: data.id };
}

export async function deleteViewing(
  clientId: string,
  viewingId: string
): Promise<ActionResult> {
  const supabase = await createSupabase();

  const { data: atts } = await supabase
    .from("viewing_attachments")
    .select("storage_path")
    .eq("viewing_id", viewingId);
  const paths = (atts ?? []).map((a) => a.storage_path);
  if (paths.length) {
    await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  }

  const { error } = await supabase
    .from("viewings")
    .delete()
    .eq("id", viewingId);
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/calendar");
  return { error: null };
}

export async function addViewingAttachment(
  clientId: string,
  viewingId: string,
  meta: {
    storage_path: string;
    file_name: string;
    mime_type: string | null;
    size: number | null;
    kind: "window_card" | "image";
  }
): Promise<ActionResult> {
  const supabase = await createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!meta.storage_path.startsWith(`${user.id}/${clientId}/`))
    return { error: "Invalid file path" };
  const { data: viewing } = await supabase
    .from("viewings")
    .select("id, client_id")
    .eq("id", viewingId)
    .maybeSingle();
  if (!viewing || viewing.client_id !== clientId)
    return { error: "Viewing not found" };

  const { error } = await supabase.from("viewing_attachments").insert({
    viewing_id: viewingId,
    storage_path: meta.storage_path,
    file_name: meta.file_name,
    mime_type: meta.mime_type,
    size: meta.size,
    kind: meta.kind,
  });
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  return { error: null };
}

export async function deleteViewingAttachment(
  clientId: string,
  attachmentId: string
): Promise<ActionResult> {
  const supabase = await createSupabase();

  const { data: att } = await supabase
    .from("viewing_attachments")
    .select("storage_path")
    .eq("id", attachmentId)
    .maybeSingle();
  if (att?.storage_path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([att.storage_path]);
  }

  const { error } = await supabase
    .from("viewing_attachments")
    .delete()
    .eq("id", attachmentId);
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  return { error: null };
}

export async function upsertReservation(
  clientId: string,
  values: ReservationFormValues
): Promise<ActionResult> {
  const parsed = reservationFormSchema.safeParse(values);
  if (!parsed.success) return { error: "Please check the form." };
  const v = parsed.data;

  const supabase = await createSupabase();
  const { error } = await supabase.from("reservations").upsert(
    {
      client_id: clientId,
      down_payment: toNumberOrNull(v.down_payment),
      down_payment_date: emptyToNull(v.down_payment_date),
      ppc: toNumberOrNull(v.ppc),
      ppc_date: emptyToNull(v.ppc_date),
      notary_date: emptyToNull(v.notary_date),
      notary_notes: emptyToNull(v.notary_notes),
      commission: toNumberOrNull(v.commission),
      closed_at: emptyToNull(v.closed_at),
    },
    { onConflict: "client_id" }
  );
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  return { error: null };
}
