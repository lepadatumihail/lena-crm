"use server";

import { getTranslations } from "next-intl/server";

import { revalidatePath } from "next/cache";

import { createClient as createSupabase } from "@/lib/supabase/server";
import { emptyToNull, toNumberOrNull } from "@/lib/validation/buyer";
import {
  propertyFormSchema,
  type PropertyFormValues,
} from "@/lib/validation/seller";

type ActionResult = { error: string | null };

export async function saveProperty(
  clientId: string,
  propertyId: string | null,
  values: PropertyFormValues
): Promise<{ error: string | null; id?: string }> {
  const parsed = propertyFormSchema(await getTranslations("validation")).safeParse(values);
  if (!parsed.success)
    return { error: (await getTranslations("clientDetail.errors"))("checkForm") };
  const v = parsed.data;

  const supabase = await createSupabase();
  const row = {
    property_type: emptyToNull(v.property_type),
    price: toNumberOrNull(v.price),
    bedrooms: toNumberOrNull(v.bedrooms),
    address: emptyToNull(v.address),
    city: emptyToNull(v.city),
    notes: emptyToNull(v.notes),
  };

  if (propertyId) {
    const { error } = await supabase
      .from("properties")
      .update(row)
      .eq("id", propertyId);
    if (error) return { error: error.message };
    revalidatePath(`/clients/${clientId}`);
    return { error: null, id: propertyId };
  }

  const { data, error } = await supabase
    .from("properties")
    .insert({ client_id: clientId, ...row })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  return { error: null, id: data.id };
}

export async function deleteProperty(
  clientId: string,
  propertyId: string
): Promise<ActionResult> {
  const supabase = await createSupabase();
  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId);
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  return { error: null };
}
