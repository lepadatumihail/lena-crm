import { createClient as createSupabase } from "@/lib/supabase/server";
import { agencyOptions } from "@/lib/agencies";
import type { ClientSide } from "@/lib/crm";
import type { Client } from "@/lib/supabase/types";

/** A list row: the client plus the figures the table and quick view show. */
export type ClientRow = Client & {
  budget_min: number | null;
  budget_max: number | null;
  property_types: string[];
  /** The seller's highest asking price across their properties. */
  asking_price: number | null;
  property_count: number;
  viewing_count: number;
  /** The buyer's reservation commission, and when the deal closed. */
  commission: number | null;
  closed_at: string | null;
};

type Embedded<T> = T | T[] | null;

type RawClientRow = Client & {
  buyer_preferences: Embedded<{
    budget_min: number | null;
    budget_max: number | null;
    property_types: string[] | null;
  }>;
  properties: { price: number | null }[] | null;
  viewings: { count: number }[] | null;
  reservations: Embedded<{
    commission: number | null;
    closed_at: string | null;
  }>;
};

function one<T>(value: Embedded<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function toRow(raw: RawClientRow): ClientRow {
  const { buyer_preferences, properties, viewings, reservations, ...client } =
    raw;
  const prefs = one(buyer_preferences);
  const reservation = one(reservations);
  const prices = (properties ?? [])
    .map((p) => p.price)
    .filter((p): p is number => p != null);
  return {
    ...client,
    budget_min: prefs?.budget_min ?? null,
    budget_max: prefs?.budget_max ?? null,
    property_types: prefs?.property_types ?? [],
    asking_price: prices.length ? Math.max(...prices) : null,
    property_count: properties?.length ?? 0,
    viewing_count: viewings?.[0]?.count ?? 0,
    commission: reservation?.commission ?? null,
    closed_at: reservation?.closed_at ?? null,
  };
}

/**
 * One side's clients with their headline figures joined in: a buyer's budget
 * and viewing count, a seller's asking price and property count. Priority
 * first, then most recently touched.
 */
export async function getClientRows(
  side: ClientSide,
  opts?: { includeInactive?: boolean }
): Promise<ClientRow[]> {
  const supabase = await createSupabase();
  let query = supabase
    .from("clients")
    .select(
      "*, buyer_preferences(budget_min, budget_max, property_types), properties(price), viewings(count), reservations(commission, closed_at)"
    )
    .eq("side", side)
    .order("priority", { ascending: false })
    .order("updated_at", { ascending: false });

  if (!opts?.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RawClientRow[]).map(toRow);
}

export async function getClients(
  side: ClientSide,
  opts?: { includeInactive?: boolean }
): Promise<Client[]> {
  const supabase = await createSupabase();
  let query = supabase
    .from("clients")
    .select("*")
    .eq("side", side)
    .order("priority", { ascending: false })
    .order("updated_at", { ascending: false });

  if (!opts?.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Lightweight {id, name} list of active clients, for pickers. */
export async function getActiveClientOptions(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("id, first_name, last_name")
    .eq("is_active", true)
    .order("first_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`.trim(),
  }));
}

/**
 * The agency names the agent already uses, most used first, across buyers and
 * sellers. The client form offers them so one agency keeps one spelling.
 */
export async function getAgencyNames(): Promise<
  { name: string; count: number }[]
> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("agency")
    .not("agency", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  return agencyOptions((data ?? []).map((c) => c.agency))
    .slice(0, 50)
    .map(({ name, count }) => ({ name, count }));
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
