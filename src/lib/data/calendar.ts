import { createClient as createSupabase } from "@/lib/supabase/server";
import type { Appointment } from "@/lib/supabase/types";

type Embedded<T> = T | T[] | null;

function one<T>(value: Embedded<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export type AppointmentClientRef = {
  id: string;
  first_name: string;
  last_name: string;
  side: string;
};

export type AppointmentPropertyRef = {
  id: string;
  address: string | null;
  city: string | null;
  property_type: string | null;
};

export type AppointmentWithRefs = Appointment & {
  client: AppointmentClientRef | null;
  property: AppointmentPropertyRef | null;
};

type RawAppointment = Appointment & {
  client: Embedded<AppointmentClientRef>;
  property: Embedded<AppointmentPropertyRef>;
};

export async function getAppointmentsInRange(
  startISO: string,
  endISO: string
): Promise<AppointmentWithRefs[]> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "*, client:clients(id, first_name, last_name, side), property:properties(id, address, city, property_type)"
    )
    .gte("starts_at", startISO)
    .lte("starts_at", endISO)
    .order("starts_at", { ascending: true });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as RawAppointment[];
  return rows.map((r) => ({
    ...r,
    client: one(r.client),
    property: one(r.property),
  }));
}

export type CalendarClientOption = {
  id: string;
  name: string;
  side: string;
};

export type CalendarPropertyOption = {
  id: string;
  label: string;
  sellerName: string;
};

export async function getCalendarFormData(): Promise<{
  clients: CalendarClientOption[];
  properties: CalendarPropertyOption[];
}> {
  const supabase = await createSupabase();
  const [clientsRes, propsRes] = await Promise.all([
    supabase
      .from("clients")
      .select("id, first_name, last_name, side")
      .eq("is_active", true)
      .order("first_name", { ascending: true }),
    supabase
      .from("properties")
      .select(
        "id, address, city, property_type, client:clients(first_name, last_name)"
      )
      .order("created_at", { ascending: false }),
  ]);
  if (clientsRes.error) throw new Error(clientsRes.error.message);
  if (propsRes.error) throw new Error(propsRes.error.message);

  const clients: CalendarClientOption[] = (clientsRes.data ?? []).map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`.trim(),
    side: c.side,
  }));

  type RawProp = {
    id: string;
    address: string | null;
    city: string | null;
    property_type: string | null;
    client: Embedded<{ first_name: string; last_name: string }>;
  };
  const propRows = (propsRes.data ?? []) as unknown as RawProp[];
  const properties: CalendarPropertyOption[] = propRows.map((p) => {
    const seller = one(p.client);
    const label = [p.address || p.property_type || "Property", p.city]
      .filter(Boolean)
      .join(", ");
    return {
      id: p.id,
      label,
      sellerName: seller ? `${seller.first_name} ${seller.last_name}`.trim() : "",
    };
  });

  return { clients, properties };
}
