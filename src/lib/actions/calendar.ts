"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { createClient as createSupabase } from "@/lib/supabase/server";
import {
  appointmentInputSchema,
  type AppointmentInput,
} from "@/lib/validation/calendar";
import { feedToken } from "@/lib/calendar-feed-token";

type ActionResult = { error: string | null };

/** The current agent's signed calendar-feed token (for the .ics subscribe URL). */
export async function getCalendarFeedToken(): Promise<{
  token: string | null;
  error: string | null;
}> {
  const supabase = await createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const t = await getTranslations("calendar");
    return { token: null, error: t("errors.notSignedIn") };
  }
  return { token: feedToken(user.id), error: null };
}

export async function saveAppointment(
  appointmentId: string | null,
  input: AppointmentInput
): Promise<{ error: string | null; id?: string }> {
  const parsed = appointmentInputSchema.safeParse(input);
  if (!parsed.success) {
    const t = await getTranslations("calendar");
    return { error: t("errors.checkForm") };
  }
  const v = parsed.data;

  const isViewing = v.type === "viewing";
  const row = {
    type: v.type,
    title: v.title?.trim() || null,
    client_id: v.client_id || null,
    property_id: isViewing ? v.property_id || null : null,
    property_label: isViewing ? v.property_label?.trim() || null : null,
    starts_at: v.starts_at,
    ends_at: v.ends_at,
    location: v.location?.trim() || null,
    notes: v.notes?.trim() || null,
    reminder_minutes: v.reminder_minutes,
  };

  const supabase = await createSupabase();

  if (appointmentId) {
    const { error } = await supabase
      .from("appointments")
      .update(row)
      .eq("id", appointmentId);
    if (error) return { error: error.message };
    revalidatePath("/calendar");
    return { error: null, id: appointmentId };
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert(row)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/calendar");
  return { error: null, id: data.id };
}

export async function deleteAppointment(
  appointmentId: string
): Promise<ActionResult> {
  const supabase = await createSupabase();
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId);
  if (error) return { error: error.message };
  revalidatePath("/calendar");
  return { error: null };
}
