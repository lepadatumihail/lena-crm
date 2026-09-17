/**
 * Reads for the two exports. Both take the cookie-scoped Supabase client, so
 * row-level security limits every query to the signed-in agent; the explicit
 * `agent_id` filter is a second lock on the same door. Never pass the
 * service-role client here.
 */
import type { ClientSide } from "@/lib/crm";
import type { createClient } from "@/lib/supabase/server";
import type {
  Appointment,
  BuyerPreferences,
  Client,
  DealAnalysis,
  EmailTemplate,
  Profile,
  Property,
  Reservation,
  Tables,
  Task,
  TaskNote,
  Viewing,
} from "@/lib/supabase/types";
import type { ClientRecord } from "@/lib/transfer/columns";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Supabase's API returns at most this many rows per request by default. */
const PAGE_SIZE = 1000;
/** Ids per `in (…)` filter, which keeps each URL well under proxy limits. */
const ID_CHUNK = 100;

type Page<T> = {
  data: T[] | null;
  error: { message: string } | null;
  count?: number | null;
};

/**
 * Every row of a query, a page at a time. The builder must order by a unique
 * key so pages don't overlap. With `{ count: "exact" }` on the select the loop
 * runs until that many rows are in, whatever page size the server allows;
 * without it a short page ends the read.
 */
export async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<Page<T>>
): Promise<T[]> {
  const rows: T[] = [];
  for (;;) {
    const { data, error, count } = await build(rows.length, rows.length + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    const done = count != null ? rows.length >= count : page.length < PAGE_SIZE;
    if (done || page.length === 0) return rows;
  }
}

type Embedded<T> = T | T[] | null;

function one<T>(value: Embedded<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function clientFields(client: Client): ClientRecord {
  return {
    first_name: client.first_name,
    last_name: client.last_name,
    email: client.email,
    phone: client.phone,
    language: client.language,
    nationality: client.nationality,
    agency: client.agency,
    stage: client.stage,
    deal_type: client.deal_type,
    seller_role: client.seller_role,
    priority: client.priority,
    is_active: client.is_active,
    notes: client.notes,
    created_at: client.created_at,
    updated_at: client.updated_at,
    id: client.id,
  };
}

export function buyerRecord(
  client: Client,
  prefs: BuyerPreferences | null,
  reservation: Reservation | null,
  viewingCount: number
): ClientRecord {
  return {
    ...clientFields(client),
    budget_min: prefs?.budget_min,
    budget_max: prefs?.budget_max,
    property_types: prefs?.property_types,
    bedrooms: prefs?.bedrooms,
    bathrooms: prefs?.bathrooms,
    area_notes: prefs?.area_notes,
    down_payment: reservation?.down_payment,
    down_payment_date: reservation?.down_payment_date,
    ppc: reservation?.ppc,
    ppc_date: reservation?.ppc_date,
    notary_date: reservation?.notary_date,
    notary_notes: reservation?.notary_notes,
    commission: reservation?.commission,
    closed_at: reservation?.closed_at,
    viewing_count: viewingCount,
  };
}

function byCreated(a: { created_at: string; id: string }, b: { created_at: string; id: string }) {
  return a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id);
}

/** One record per property, oldest first; a seller without one still gets a row. */
export function sellerRecords(client: Client, properties: Property[]): ClientRecord[] {
  const base = clientFields(client);
  if (properties.length === 0) return [base];
  return [...properties].sort(byCreated).map((property) => ({
    ...base,
    property_type: property.property_type,
    price: property.price,
    property_bedrooms: property.bedrooms,
    address: property.address,
    city: property.city,
    property_notes: property.notes,
  }));
}

type RawBuyer = Client & {
  buyer_preferences: Embedded<BuyerPreferences>;
  reservations: Embedded<Reservation>;
  viewings: { count: number }[] | null;
};
type RawSeller = Client & { properties: Property[] | null };

/**
 * The full records behind a client list, in the order of `ids` (the order on
 * screen). Ids on the other side, or another agent's, simply don't come back.
 */
export async function loadClientExport(
  supabase: Supabase,
  userId: string,
  side: ClientSide,
  ids: string[]
): Promise<ClientRecord[]> {
  const select =
    side === "buyer"
      ? "*, buyer_preferences(*), reservations(*), viewings(count)"
      : "*, properties(*)";
  const found = new Map<string, ClientRecord[]>();

  for (let start = 0; start < ids.length; start += ID_CHUNK) {
    const { data, error } = await supabase
      .from("clients")
      .select(select)
      .eq("agent_id", userId)
      .eq("side", side)
      .in("id", ids.slice(start, start + ID_CHUNK));
    if (error) throw new Error(error.message);

    if (side === "buyer") {
      for (const raw of (data ?? []) as unknown as RawBuyer[]) {
        const { buyer_preferences, reservations, viewings, ...client } = raw;
        found.set(client.id, [
          buyerRecord(
            client,
            one(buyer_preferences),
            one(reservations),
            viewings?.[0]?.count ?? 0
          ),
        ]);
      }
    } else {
      for (const raw of (data ?? []) as unknown as RawSeller[]) {
        const { properties, ...client } = raw;
        found.set(client.id, sellerRecords(client, properties ?? []));
      }
    }
  }

  return ids.flatMap((id) => found.get(id) ?? []);
}

export type ExportFile = {
  id: string;
  client_id: string | null;
  attached_to: "document" | "viewing" | "property";
  /** The viewing or property the file hangs on; empty for a client document. */
  parent_id: string | null;
  file_name: string;
  mime_type: string | null;
  size: number | null;
  created_at: string;
};

export type AccountExport = {
  profile: Profile | null;
  email: string | null;
  clients: Client[];
  buyers: ClientRecord[];
  sellers: ClientRecord[];
  properties: Property[];
  viewings: Viewing[];
  appointments: Appointment[];
  tasks: Task[];
  taskNotes: TaskNote[];
  templates: EmailTemplate[];
  dealAnalyses: DealAnalysis[];
  files: ExportFile[];
};

type OwnedTable =
  | "clients"
  | "buyer_preferences"
  | "reservations"
  | "properties"
  | "viewings"
  | "appointments"
  | "tasks"
  | "task_notes"
  | "email_templates"
  | "deal_analyses"
  | "documents"
  | "viewing_attachments"
  | "property_attachments";

/** Every row the agent owns in one table, paged on a unique key. */
function ownedRows<T extends OwnedTable>(
  supabase: Supabase,
  userId: string,
  table: T,
  orderBy: "id" | "client_id"
): Promise<Tables<T>[]> {
  return fetchAll<Tables<T>>(
    (from, to) =>
      supabase
        .from(table as OwnedTable)
        .select("*", { count: "exact" })
        .eq("agent_id", userId)
        .order(orderBy)
        .range(from, to) as unknown as PromiseLike<Page<Tables<T>>>
  );
}

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const list = groups.get(key(row));
    if (list) list.push(row);
    else groups.set(key(row), [row]);
  }
  return groups;
}

/** Everything the agent owns, oldest first in every table. */
export async function loadAccountExport(
  supabase: Supabase,
  userId: string,
  email: string | null
): Promise<AccountExport> {
  const owned = <T extends OwnedTable>(table: T, orderBy: "id" | "client_id" = "id") =>
    ownedRows(supabase, userId, table, orderBy);

  const [
    profileResult,
    clients,
    preferences,
    reservations,
    properties,
    viewings,
    appointments,
    tasks,
    taskNotes,
    templates,
    dealAnalyses,
    documents,
    viewingAttachments,
    propertyAttachments,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    owned("clients"),
    // One row per client, keyed by it.
    owned("buyer_preferences", "client_id"),
    owned("reservations", "client_id"),
    owned("properties"),
    owned("viewings"),
    owned("appointments"),
    owned("tasks"),
    owned("task_notes"),
    owned("email_templates"),
    owned("deal_analyses"),
    owned("documents"),
    owned("viewing_attachments"),
    owned("property_attachments"),
  ]);
  if (profileResult.error) throw new Error(profileResult.error.message);

  clients.sort(byCreated);
  const prefsByClient = new Map(preferences.map((p) => [p.client_id, p]));
  const reservationByClient = new Map(reservations.map((r) => [r.client_id, r]));
  const propertiesByClient = groupBy(properties, (p) => p.client_id);
  const viewingsByClient = groupBy(viewings, (v) => v.client_id);
  const viewingById = new Map(viewings.map((v) => [v.id, v]));
  const propertyById = new Map(properties.map((p) => [p.id, p]));

  const files: ExportFile[] = [
    ...documents.map((d) => ({
      id: d.id,
      client_id: d.client_id,
      attached_to: "document" as const,
      parent_id: null,
      file_name: d.file_name,
      mime_type: d.mime_type,
      size: d.size,
      created_at: d.created_at,
    })),
    ...viewingAttachments.map((a) => ({
      id: a.id,
      client_id: viewingById.get(a.viewing_id)?.client_id ?? null,
      attached_to: "viewing" as const,
      parent_id: a.viewing_id,
      file_name: a.file_name,
      mime_type: a.mime_type,
      size: a.size,
      created_at: a.created_at,
    })),
    ...propertyAttachments.map((a) => ({
      id: a.id,
      client_id: propertyById.get(a.property_id)?.client_id ?? null,
      attached_to: "property" as const,
      parent_id: a.property_id,
      file_name: a.file_name,
      mime_type: a.mime_type,
      size: a.size,
      created_at: a.created_at,
    })),
  ].sort(byCreated);

  return {
    profile: profileResult.data,
    email,
    clients,
    buyers: clients
      .filter((c) => c.side === "buyer")
      .map((c) =>
        buyerRecord(
          c,
          prefsByClient.get(c.id) ?? null,
          reservationByClient.get(c.id) ?? null,
          viewingsByClient.get(c.id)?.length ?? 0
        )
      ),
    sellers: clients
      .filter((c) => c.side === "seller")
      .flatMap((c) => sellerRecords(c, propertiesByClient.get(c.id) ?? [])),
    properties,
    viewings: viewings.sort(byCreated),
    appointments: appointments.sort(byCreated),
    tasks: tasks.sort(byCreated),
    taskNotes: taskNotes.sort(byCreated),
    templates: templates.sort(byCreated),
    dealAnalyses: dealAnalyses.sort(byCreated),
    files,
  };
}
