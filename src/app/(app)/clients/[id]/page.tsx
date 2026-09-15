import { notFound } from "next/navigation";

import { getClientById } from "@/lib/data/clients";
import {
  getBuyerPreferences,
  getReservation,
  getViewings,
} from "@/lib/data/buyer";
import { getDocuments } from "@/lib/data/documents";
import { getNextClientAppointment } from "@/lib/data/calendar";
import { getAgentTimeZone } from "@/lib/data/session";
import { getClientTasks } from "@/lib/data/tasks";
import { getTemplates } from "@/lib/data/templates";
import { getMatchingListings, getProperties } from "@/lib/data/seller";
import { ClientDetailView } from "@/components/clients/client-detail-view";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ compose?: string }>;
}) {
  const { id } = await params;
  const { compose } = await searchParams;
  const client = await getClientById(id);
  if (!client) notFound();

  const isBuyer = client.side === "buyer";
  const now = new Date();
  const [
    prefs,
    viewings,
    reservation,
    properties,
    documents,
    customTemplates,
    nextAppointment,
    timeZone,
    tasks,
  ] = await Promise.all([
    isBuyer ? getBuyerPreferences(client.id) : Promise.resolve(null),
    isBuyer ? getViewings(client.id) : Promise.resolve([]),
    isBuyer ? getReservation(client.id) : Promise.resolve(null),
    isBuyer ? Promise.resolve([]) : getProperties(client.id),
    getDocuments(client.id),
    getTemplates(),
    getNextClientAppointment(client.id, now.toISOString()),
    getAgentTimeZone(),
    getClientTasks(client.id),
  ]);

  const matches =
    isBuyer && prefs
      ? await getMatchingListings({
          property_types: prefs.property_types,
          budget_min: prefs.budget_min,
          budget_max: prefs.budget_max,
          bedrooms: prefs.bedrooms,
        })
      : [];

  return (
    <ClientDetailView
      client={client}
      prefs={prefs}
      viewings={viewings}
      reservation={reservation}
      properties={properties}
      documents={documents}
      matches={matches}
      customTemplates={customTemplates}
      nextAppointment={nextAppointment}
      tasks={tasks}
      compose={compose ?? null}
      now={now}
      timeZone={timeZone}
    />
  );
}
