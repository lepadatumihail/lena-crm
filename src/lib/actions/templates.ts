"use server";

import { getTranslations } from "next-intl/server";

import { revalidatePath } from "next/cache";

import { createClient as createSupabase } from "@/lib/supabase/server";
import {
  templateFormSchema,
  type TemplateFormValues,
} from "@/lib/validation/template";

type ActionResult = { error: string | null };

export async function saveTemplate(
  templateId: string | null,
  values: TemplateFormValues
): Promise<{ error: string | null; id?: string }> {
  const parsed = templateFormSchema(await getTranslations("validation")).safeParse(values);
  if (!parsed.success) {
    return { error: (await getTranslations("templates"))("errors.checkForm") };
  }
  const v = parsed.data;

  const row = {
    name: v.name.trim(),
    subject: (v.subject ?? "").trim(),
    body: v.body.trim(),
  };

  const supabase = await createSupabase();

  if (templateId) {
    const { error } = await supabase
      .from("email_templates")
      .update(row)
      .eq("id", templateId);
    if (error) return { error: error.message };
    revalidatePath("/templates");
    return { error: null, id: templateId };
  }

  const { data, error } = await supabase
    .from("email_templates")
    .insert(row)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/templates");
  return { error: null, id: data.id };
}

export async function deleteTemplate(
  templateId: string
): Promise<ActionResult> {
  const supabase = await createSupabase();
  const { error } = await supabase
    .from("email_templates")
    .delete()
    .eq("id", templateId);
  if (error) return { error: error.message };
  revalidatePath("/templates");
  return { error: null };
}
