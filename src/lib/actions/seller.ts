"use server";

import { getTranslations } from "next-intl/server";

import { revalidatePath } from "next/cache";

import { createClient as createSupabase } from "@/lib/supabase/server";
import type { PropertyAttachmentKind } from "@/lib/supabase/types";
import { emptyToNull, toNumberOrNull } from "@/lib/validation/buyer";
import {
  propertyFormSchema,
  type PropertyFormValues,
} from "@/lib/validation/seller";

type ActionResult = { error: string | null };

const STORAGE_BUCKET = "attachments";

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

  // The attachment rows cascade away with the property, the bucket files do
  // not: remove them first or they leak.
  const { data: atts } = await supabase
    .from("property_attachments")
    .select("storage_path")
    .eq("property_id", propertyId);
  const paths = (atts ?? []).map((a) => a.storage_path);
  if (paths.length) {
    await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  }

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId);
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  return { error: null };
}

export async function addPropertyAttachment(
  clientId: string,
  propertyId: string,
  meta: {
    storage_path: string;
    file_name: string;
    mime_type: string | null;
    size: number | null;
    kind: PropertyAttachmentKind;
  }
): Promise<ActionResult> {
  const t = await getTranslations("clientDetail.errors");
  const supabase = await createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { error: (await getTranslations("common"))("errors.notAuthenticated") };
  if (!meta.storage_path.startsWith(`${user.id}/${clientId}/`))
    return { error: t("invalidFilePath") };
  if (meta.file_name.length > 200) return { error: t("fileNameTooLong") };
  if (meta.size != null && meta.size > 15 * 1024 * 1024)
    return { error: t("fileTooLarge") };
  const { data: property } = await supabase
    .from("properties")
    .select("id, client_id")
    .eq("id", propertyId)
    .maybeSingle();
  if (!property || property.client_id !== clientId)
    return { error: t("propertyNotFound") };

  const { error } = await supabase.from("property_attachments").insert({
    property_id: propertyId,
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

export async function deletePropertyAttachment(
  clientId: string,
  attachmentId: string
): Promise<ActionResult> {
  const supabase = await createSupabase();

  const { data: att } = await supabase
    .from("property_attachments")
    .select("storage_path")
    .eq("id", attachmentId)
    .maybeSingle();
  if (att?.storage_path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([att.storage_path]);
  }

  const { error } = await supabase
    .from("property_attachments")
    .delete()
    .eq("id", attachmentId);
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  return { error: null };
}
