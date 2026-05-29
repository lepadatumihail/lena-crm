import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Tag,
} from "lucide-react";

import { getClientById } from "@/lib/data/clients";
import {
  getBuyerPreferences,
  getReservation,
  getViewings,
} from "@/lib/data/buyer";
import { getDocuments } from "@/lib/data/documents";
import { getMatchingListings, getProperties } from "@/lib/data/seller";
import { ClientControls } from "@/components/clients/client-controls";
import { StageBadge } from "@/components/clients/stage-badge";
import { WhatsAppButton } from "@/components/clients/whatsapp-button";
import { PreferencesSection } from "@/components/clients/sections/preferences-section";
import { ViewingsSection } from "@/components/clients/sections/viewings-section";
import { ReservationSection } from "@/components/clients/sections/reservation-section";
import { PropertiesSection } from "@/components/clients/sections/properties-section";
import { MatchingListingsSection } from "@/components/clients/sections/matching-listings-section";
import { DocumentsSection } from "@/components/clients/sections/documents-section";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buyerStageAtLeast,
  clientFullName,
  DEAL_TYPE_LABELS,
  SELLER_ROLE_LABELS,
  type ClientSide,
} from "@/lib/crm";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const side = client.side as ClientSide;
  const isBuyer = side === "buyer";
  const showPrefs = isBuyer && buyerStageAtLeast(client.stage, "qualified");
  const showViewings = isBuyer && buyerStageAtLeast(client.stage, "viewing");
  const showReservation = isBuyer && client.stage === "reserved";
  const showProperties = !isBuyer && client.stage === "qualified";

  const [prefs, viewings, reservation, properties, documents] =
    await Promise.all([
      showPrefs ? getBuyerPreferences(client.id) : Promise.resolve(null),
      showViewings ? getViewings(client.id) : Promise.resolve([]),
      showReservation ? getReservation(client.id) : Promise.resolve(null),
      showProperties ? getProperties(client.id) : Promise.resolve([]),
      getDocuments(client.id),
    ]);

  const matches =
    showPrefs && prefs
      ? await getMatchingListings({
          property_types: prefs.property_types,
          budget_min: prefs.budget_min,
          budget_max: prefs.budget_max,
          bedrooms: prefs.bedrooms,
        })
      : [];

  const typeLabel =
    side === "buyer"
      ? client.deal_type
        ? DEAL_TYPE_LABELS[client.deal_type]
        : null
      : client.seller_role
        ? SELLER_ROLE_LABELS[client.seller_role]
        : null;

  const hasContact =
    client.email ||
    client.phone ||
    client.language ||
    client.nationality ||
    typeLabel ||
    client.agency;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
          <Link href={`/clients?side=${side}`}>
            <ArrowLeft /> Back to {side}s
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {clientFullName(client)}
          </h1>
          <StageBadge stage={client.stage} />
          {!client.is_active && <Badge variant="outline">Inactive</Badge>}
        </div>
        <div className="mt-3">
          <ClientControls client={client} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {showPrefs && (
            <PreferencesSection clientId={client.id} prefs={prefs} />
          )}
          {showPrefs && prefs && <MatchingListingsSection matches={matches} />}
          {showViewings && (
            <ViewingsSection
              clientId={client.id}
              agentId={client.agent_id}
              viewings={viewings}
            />
          )}
          {showReservation && (
            <ReservationSection
              clientId={client.id}
              reservation={reservation}
            />
          )}
          {showProperties && (
            <PropertiesSection
              clientId={client.id}
              properties={properties}
            />
          )}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {client.notes}
                </p>
              </CardContent>
            </Card>
          )}
          <DocumentsSection
            clientId={client.id}
            agentId={client.agent_id}
            documents={documents}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <WhatsAppButton
                phone={client.phone}
                firstName={client.first_name}
                language={client.language}
                className="w-full"
              />
              <InfoRow
                icon={<Mail className="size-4" />}
                label="Email"
                value={client.email}
              />
              <InfoRow
                icon={<Phone className="size-4" />}
                label="Phone"
                value={client.phone}
              />
              <InfoRow
                icon={<Globe2 className="size-4" />}
                label="Language"
                value={client.language}
              />
              <InfoRow
                icon={<MapPin className="size-4" />}
                label="Nationality"
                value={client.nationality}
              />
              <InfoRow
                icon={<Tag className="size-4" />}
                label={side === "buyer" ? "Deal type" : "Role"}
                value={typeLabel}
              />
              <InfoRow
                icon={<Building2 className="size-4" />}
                label="Agency"
                value={client.agency}
              />
              {!hasContact && (
                <p className="text-muted-foreground text-sm">
                  No contact details yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
