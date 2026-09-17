"use server";

import { getTranslations } from "next-intl/server";

import { revalidatePath } from "next/cache";

import { FREE_CLIENT_LIMIT, clientLimit } from "@/lib/access";
import type { ClientSide } from "@/lib/crm";
import { contactKeys } from "@/lib/import/dedupe";
import { collectClientFilePaths, removeFilePaths } from "@/lib/storage/client-files";
import { createClient as createSupabase } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import {
  checkRowForSide,
  importBatchSchema,
  startImportSchema,
  type ImportRow,
} from "@/lib/validation/import";

type Supabase = Awaited<ReturnType<typeof createSupabase>>;

/* PostgREST answers at most this many rows per request. */
const PAGE = 1000;
/* Undo deletes this many clients per statement; one for the whole import could hit the 8 s timeout. */
const DELETE_CHUNK = 200;
const RECENT_DAYS = 30;
const RECENT_LIMIT = 10;

export type RecentImport = {
  id: string;
  fileName: string;
  side: ClientSide;
  rowCount: number;
  importedCount: number;
  skippedCount: number;
  createdAt: string;
  finishedAt: string | null;
};

export type ImportContext = {
  /** Clients the agent may still add; `null` on Pro. */
  capacity: number | null;
  /** The Free plan's cap; `null` on Pro. */
  limit: number | null;
  clientCount: number;
  /** `contactKeys` of the agent's clients on this side: no names leave the server. */
  existingKeys: string[];
  /** Every agency spelling the agent uses, so an import keeps to them. */
  agencies: string[];
  recent: RecentImport[];
};

export type StartImportResult = { error: string | null; importId?: string };
export type ImportBatchResult = { error: string | null; imported?: number; limitReached?: boolean };
export type UndoPreview = {
  error: string | null;
  total?: number;
  /**
   * Clients edited since the import, or with a viewing, task, document,
   * appointment, reservation or scheduled email: what "keep the ones I've
   * worked on" keeps.
   */
  worked?: number;
};
export type UndoResult = { error: string | null; deleted?: number; kept?: number };

/** The actions the wizard calls, as one object so a preview page can pass stubs. */
export type ImportActions = {
  startClientImport: typeof startClientImport;
  importClientBatch: typeof importClientBatch;
  finishClientImport: typeof finishClientImport;
  previewUndo: typeof previewUndo;
  undoClientImport: typeof undoClientImport;
};

async function signedIn(supabase: Supabase): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function errors() {
  return getTranslations("imports.errors");
}

/** Reads a whole result set page by page. */
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

async function capacityFor(
  supabase: Supabase,
  userId: string
): Promise<{ capacity: number | null; limit: number | null; clientCount: number }> {
  const [{ data: profile }, { count }] = await Promise.all([
    supabase
      .from("profiles")
      .select("subscription_status, pro_until, is_admin")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("clients").select("id", { count: "exact", head: true }),
  ]);
  const clientCount = count ?? 0;
  // No profile row: let the database trigger decide.
  const limit = profile ? clientLimit(profile) : null;
  return {
    capacity: limit === null ? null : Math.max(0, limit - clientCount),
    limit,
    clientCount,
  };
}

export async function getImportContext(side: ClientSide): Promise<ImportContext> {
  const supabase = await createSupabase();
  const userId = await signedIn(supabase);
  if (!userId) throw new Error((await errors())("signedOut"));

  const since = new Date(Date.now() - RECENT_DAYS * 86_400_000).toISOString();
  const [plan, contacts, agencyRows, recentRes] = await Promise.all([
    capacityFor(supabase, userId),
    fetchAll<{ email: string | null; phone: string | null }>((from, to) =>
      supabase.from("clients").select("email, phone").eq("side", side).order("id").range(from, to)
    ),
    fetchAll<{ agency: string | null }>((from, to) =>
      supabase.from("clients").select("agency").not("agency", "is", null).order("id").range(from, to)
    ),
    supabase
      .from("client_imports")
      .select("id, file_name, side, row_count, imported_count, skipped_count, created_at, finished_at")
      .is("undone_at", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT),
  ]);

  const existingKeys = new Set<string>();
  for (const contact of contacts) for (const key of contactKeys(contact)) existingKeys.add(key);

  return {
    ...plan,
    existingKeys: [...existingKeys],
    agencies: agencyRows.map((r) => r.agency).filter((a): a is string => !!a),
    recent: (recentRes.data ?? []).map((r) => ({
      id: r.id,
      fileName: r.file_name,
      side: r.side,
      rowCount: r.row_count,
      importedCount: r.imported_count,
      skippedCount: r.skipped_count,
      createdAt: r.created_at,
      finishedAt: r.finished_at,
    })),
  };
}

export async function startClientImport(input: {
  side: ClientSide;
  fileName: string;
  rowCount: number;
}): Promise<StartImportResult> {
  const t = await errors();
  const parsed = startImportSchema.safeParse(input);
  if (!parsed.success) return { error: t("invalid") };

  const supabase = await createSupabase();
  if (!(await signedIn(supabase))) return { error: t("signedOut") };

  const { data, error } = await supabase
    .from("client_imports")
    .insert({ side: parsed.data.side, file_name: parsed.data.fileName, row_count: parsed.data.rowCount })
    .select("id")
    .single();
  if (error || !data) {
    console.error("import: start", error);
    return { error: t("failed") };
  }
  return { error: null, importId: data.id };
}

export async function importClientBatch(
  importId: string,
  side: ClientSide,
  rows: ImportRow[]
): Promise<ImportBatchResult> {
  const t = await errors();
  const parsed = importBatchSchema.safeParse(rows);
  if (!parsed.success || !parsed.data.every((row) => checkRowForSide(row, side))) {
    return { error: t("invalid") };
  }

  const supabase = await createSupabase();
  const userId = await signedIn(supabase);
  if (!userId) return { error: t("signedOut") };

  // A friendly answer before the database's own refusal.
  const { capacity } = await capacityFor(supabase, userId);
  if (capacity !== null && capacity < parsed.data.length) {
    return { error: t("limitReached", { limit: FREE_CLIENT_LIMIT }), limitReached: true };
  }

  const { data, error } = await supabase.rpc("import_clients", {
    p_import_id: importId,
    p_rows: parsed.data as unknown as Json,
  });
  if (error) {
    console.error("import: batch", error);
    if (error.message.includes("client_limit_reached")) {
      return { error: t("limitReached", { limit: FREE_CLIENT_LIMIT }), limitReached: true };
    }
    if (error.message.includes("import_not_found")) return { error: t("importClosed") };
    if (error.code === "57014") return { error: t("timeout") };
    return { error: t("failed") };
  }
  return { error: null, imported: data ?? parsed.data.length };
}

export async function finishClientImport(
  importId: string,
  { skipped }: { skipped: number }
): Promise<{ error: string | null }> {
  const t = await errors();
  const supabase = await createSupabase();
  if (!(await signedIn(supabase))) return { error: t("signedOut") };

  const { error } = await supabase
    .from("client_imports")
    .update({ finished_at: new Date().toISOString(), skipped_count: Math.max(0, Math.floor(skipped)) })
    .eq("id", importId);
  if (error) {
    console.error("import: finish", error);
    return { error: t("failed") };
  }
  revalidatePath("/clients");
  return { error: null };
}

type ImportedClient = { id: string; created_at: string; updated_at: string };

async function importedClients(supabase: Supabase, importId: string): Promise<ImportedClient[]> {
  return fetchAll<ImportedClient>((from, to) =>
    supabase
      .from("clients")
      .select("id, created_at, updated_at")
      .eq("import_id", importId)
      .order("id")
      .range(from, to)
  );
}

/* Tables whose rows mean the agent has worked with the client since the import. */
const WORK_TABLES = ["viewings", "tasks", "documents", "appointments", "reservations", "scheduled_emails"] as const;

async function clientsWithWork(supabase: Supabase, clientIds: string[]): Promise<Set<string>> {
  const worked = new Set<string>();
  for (let i = 0; i < clientIds.length; i += DELETE_CHUNK) {
    const ids = clientIds.slice(i, i + DELETE_CHUNK);
    const results = await Promise.all(
      WORK_TABLES.map((table) => supabase.from(table).select("client_id").in("client_id", ids))
    );
    for (const { data } of results) {
      for (const row of data ?? []) if (row.client_id) worked.add(row.client_id);
    }
  }
  return worked;
}

async function ownImport(supabase: Supabase, importId: string) {
  const { data } = await supabase
    .from("client_imports")
    .select("id, undone_at")
    .eq("id", importId)
    .maybeSingle();
  return data && !data.undone_at ? data : null;
}

export async function previewUndo(importId: string): Promise<UndoPreview> {
  const t = await errors();
  const supabase = await createSupabase();
  if (!(await signedIn(supabase))) return { error: t("signedOut") };
  if (!(await ownImport(supabase, importId))) return { error: t("notFound") };

  try {
    const clients = await importedClients(supabase, importId);
    const worked = await clientsWithWork(
      supabase,
      clients.map((c) => c.id)
    );
    return {
      error: null,
      total: clients.length,
      worked: clients.filter((c) => worked.has(c.id) || c.updated_at > c.created_at).length,
    };
  } catch (error) {
    console.error("import: preview undo", error);
    return { error: t("failed") };
  }
}

/**
 * Deletes an import's clients and their files. With `keepWorked`, clients
 * edited since the import or with any work attached stay; they keep their
 * `import_id`, and the import is closed either way.
 */
export async function undoClientImport(
  importId: string,
  { keepWorked }: { keepWorked: boolean }
): Promise<UndoResult> {
  const t = await errors();
  const supabase = await createSupabase();
  if (!(await signedIn(supabase))) return { error: t("signedOut") };
  if (!(await ownImport(supabase, importId))) return { error: t("notFound") };

  try {
    const clients = await importedClients(supabase, importId);
    let doomed = clients.map((c) => c.id);
    if (keepWorked) {
      const worked = await clientsWithWork(supabase, doomed);
      doomed = clients.filter((c) => !worked.has(c.id) && c.updated_at <= c.created_at).map((c) => c.id);
    }

    const paths = await collectClientFilePaths(supabase, doomed);
    await removeFilePaths(supabase, paths);

    for (let i = 0; i < doomed.length; i += DELETE_CHUNK) {
      const { error } = await supabase
        .from("clients")
        .delete()
        .in("id", doomed.slice(i, i + DELETE_CHUNK));
      if (error) throw new Error(error.message);
    }

    const { error } = await supabase
      .from("client_imports")
      .update({ undone_at: new Date().toISOString() })
      .eq("id", importId);
    if (error) throw new Error(error.message);

    revalidatePath("/clients");
    return { error: null, deleted: doomed.length, kept: clients.length - doomed.length };
  } catch (error) {
    console.error("import: undo", error);
    return { error: t("failed") };
  }
}
