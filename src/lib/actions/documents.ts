"use server";

import { getTranslations } from "next-intl/server";

import { revalidatePath } from "next/cache";

import { createClient as createSupabase } from "@/lib/supabase/server";

type ActionResult = { error: string | null };

const STORAGE_BUCKET = "attachments";

export async function addDocument(
  clientId: string,
  meta: {
    storage_path: string;
    file_name: string;
    mime_type: string | null;
    size: number | null;
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
  const { data: owned } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .maybeSingle();
  if (!owned) return { error: t("clientNotFound") };

  const { error } = await supabase.from("documents").insert({
    client_id: clientId,
    storage_path: meta.storage_path,
    file_name: meta.file_name,
    mime_type: meta.mime_type,
    size: meta.size,
  });
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  return { error: null };
}

export async function deleteDocument(
  clientId: string,
  documentId: string
): Promise<ActionResult> {
  const supabase = await createSupabase();

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .maybeSingle();
  if (doc?.storage_path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([doc.storage_path]);
  }

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  return { error: null };
}
