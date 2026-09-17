/**
 * The bucket files that belong to clients. Database rows cascade when a
 * client is deleted; bucket objects don't, so callers collect the paths
 * first and remove them, or the files leak.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

type Supabase = SupabaseClient<Database>;

export const STORAGE_BUCKET = "attachments";
/** PostgREST `in()` lists and storage removes are kept to this many at a time. */
const CHUNK_SIZE = 100;

function chunks<T>(items: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK_SIZE) out.push(items.slice(i, i + CHUNK_SIZE));
  return out;
}

/** Documents, viewing attachments and property attachments of these clients. */
export async function collectClientFilePaths(
  supabase: Supabase,
  clientIds: readonly string[]
): Promise<string[]> {
  const paths: string[] = [];
  const viewingIds: string[] = [];
  const propertyIds: string[] = [];

  for (const ids of chunks(clientIds)) {
    const [docs, viewings, properties] = await Promise.all([
      supabase.from("documents").select("storage_path").in("client_id", ids),
      supabase.from("viewings").select("id").in("client_id", ids),
      supabase.from("properties").select("id").in("client_id", ids),
    ]);
    for (const d of docs.data ?? []) paths.push(d.storage_path);
    for (const v of viewings.data ?? []) viewingIds.push(v.id);
    for (const p of properties.data ?? []) propertyIds.push(p.id);
  }

  for (const ids of chunks(viewingIds)) {
    const { data } = await supabase.from("viewing_attachments").select("storage_path").in("viewing_id", ids);
    for (const a of data ?? []) paths.push(a.storage_path);
  }
  for (const ids of chunks(propertyIds)) {
    const { data } = await supabase.from("property_attachments").select("storage_path").in("property_id", ids);
    for (const a of data ?? []) paths.push(a.storage_path);
  }
  return paths;
}

export async function removeFilePaths(supabase: Supabase, paths: readonly string[]): Promise<void> {
  for (const batch of chunks(paths)) {
    await supabase.storage.from(STORAGE_BUCKET).remove(batch);
  }
}
