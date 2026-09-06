import { getTranslations } from "next-intl/server";

import { createClient as createSupabase } from "@/lib/supabase/server";
import type { Appointment, Viewing } from "@/lib/supabase/types";
import { appointmentTitleFor } from "@/i18n/appointments";
import { propertyTypeLabel } from "@/i18n/labels";

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
  phone: string | null;
  language: string | null;
};

/** Minimal client contact carried on calendar events for one-tap reminders. */
export type EventContact = {
  firstName: string;
  phone: string | null;
  language: string | null;
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

async function getAppointmentsInRange(
  startISO: string,
  endISO: string
): Promise<AppointmentWithRefs[]> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "*, client:clients(id, first_name, last_name, side, phone, language), property:properties(id, address, city, property_type)"
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

/** A single thing on the calendar — a meeting (appointment) or a dated viewing. */
export type CalendarEvent =
  | {
      kind: "meeting";
      id: string;
      starts_at: string;
      ends_at: string | null;
      title: string;
      location: string | null;
      contact: EventContact | null;
      reminderWhat: string;
      appointment: AppointmentWithRefs;
    }
  | {
      kind: "viewing";
      id: string;
      starts_at: string;
      ends_at: string | null;
      title: string;
      location: string | null;
      contact: EventContact | null;
      reminderWhat: string;
      viewing: Viewing;
      buyerId: string;
      buyerName: string | null;
    };

export async function getCalendarEvents(
  startISO: string,
  endISO: string
): Promise<CalendarEvent[]> {
  const supabase = await createSupabase();
  const [t, tCrm, appointments, viewingsRes] = await Promise.all([
    getTranslations("server.appointments"),
    getTranslations("crm"),
    getAppointmentsInRange(startISO, endISO),
    supabase
      .from("viewings")
      .select("*, client:clients(id, first_name, last_name, phone, language)")
      .not("scheduled_at", "is", null)
      .gte("scheduled_at", startISO)
      .lte("scheduled_at", endISO)
      .order("scheduled_at", { ascending: true }),
  ]);
  if (viewingsRes.error) throw new Error(viewingsRes.error.message);

  const meetings: CalendarEvent[] = appointments.map((a) => ({
    kind: "meeting",
    id: a.id,
    starts_at: a.starts_at,
    ends_at: a.ends_at,
    title: appointmentTitleFor(t, a, {
      clientName: a.client
        ? `${a.client.first_name} ${a.client.last_name}`.trim()
        : null,
      property:
        a.property_label ??
        a.property?.address ??
        (a.property?.property_type
          ? propertyTypeLabel(tCrm, a.property.property_type)
          : null),
    }),
    location: a.location,
    contact: a.client
      ? {
          firstName: a.client.first_name,
          phone: a.client.phone,
          language: a.client.language,
        }
      : null,
    reminderWhat: a.title ?? "",
    appointment: a,
  }));

  type RawViewing = Viewing & {
    client: Embedded<{
      id: string;
      first_name: string;
      last_name: string;
      phone: string | null;
      language: string | null;
    }>;
  };
  const viewings: CalendarEvent[] = (
    (viewingsRes.data ?? []) as unknown as RawViewing[]
  ).map((v) => {
    const buyer = one(v.client);
    const buyerName = buyer
      ? `${buyer.first_name} ${buyer.last_name}`.trim()
      : null;
    return {
      kind: "viewing",
      id: v.id,
      starts_at: v.scheduled_at as string,
      ends_at: null,
      title:
        v.title?.trim() ||
        (buyerName ? t("viewingWith", { name: buyerName }) : t("viewing")),
      location: null,
      contact: buyer
        ? {
            firstName: buyer.first_name,
            phone: buyer.phone,
            language: buyer.language,
          }
        : null,
      reminderWhat: v.title ?? "",
      viewing: v,
      buyerId: v.client_id,
      buyerName,
    };
  });

  return [...meetings, ...viewings];
}

export type CalendarClientOption = {
  id: string;
  name: string;
  side: string;
};

export async function getCalendarFormData(): Promise<{
  clients: CalendarClientOption[];
}> {
  const supabase = await createSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("id, first_name, last_name, side")
    .eq("is_active", true)
    .order("first_name", { ascending: true });
  if (error) throw new Error(error.message);

  const clients: CalendarClientOption[] = (data ?? []).map((c) => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`.trim(),
    side: c.side,
  }));
  return { clients };
}
