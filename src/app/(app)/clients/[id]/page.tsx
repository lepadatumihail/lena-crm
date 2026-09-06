import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
import { getTemplates } from "@/lib/data/templates";
import { getMatchingListings, getProperties } from "@/lib/data/seller";
import { ClientControls } from "@/components/clients/client-controls";
import { StageBadge } from "@/components/clients/stage-badge";
import { WhatsAppButton } from "@/components/clients/whatsapp-button";
import { MessageComposer } from "@/components/clients/message-composer";
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
import { clientFullName, clientsPath, type ClientSide } from "@/lib/crm";
import {
  dealTypeLabel,
  languageLabel,
  sellerRoleLabel,
} from "@/i18n/labels";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ compose?: string }>;
}) {
  const { id } = await params;
  const { compose } = await searchParams;
  const client = await getClientById(id);
  if (!client) notFound();

  const [t, tCrm] = await Promise.all([
    getTranslations("clientDetail.page"),
    getTranslations("crm"),
  ]);

  const side = client.side as ClientSide;
  const isBuyer = side === "buyer";
  const showPrefs = isBuyer;
  const showViewings = isBuyer;
  const showReservation = isBuyer;
  const showProperties = !isBuyer;

  const [prefs, viewings, reservation, properties, documents, customTemplates] =
    await Promise.all([
      showPrefs ? getBuyerPreferences(client.id) : Promise.resolve(null),
      showViewings ? getViewings(client.id) : Promise.resolve([]),
      showReservation ? getReservation(client.id) : Promise.resolve(null),
      showProperties ? getProperties(client.id) : Promise.resolve([]),
      getDocuments(client.id),
      getTemplates(),
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

  const messageVarsInput = {
    first_name: client.first_name,
    last_name: client.last_name,
    agency: client.agency,
    budgetMin: prefs?.budget_min ?? null,
    budgetMax: prefs?.budget_max ?? null,
    property: viewings[0]?.title ?? null,
  };

  const propertyOptions = isBuyer
    ? viewings.map((v) => v.title).filter((t): t is string => Boolean(t))
    : properties
        .map((p) => p.address || p.property_type || "")
        .filter(Boolean);

  const typeLabel =
    side === "buyer"
      ? client.deal_type
        ? dealTypeLabel(tCrm, client.deal_type)
        : null
      : client.seller_role
        ? sellerRoleLabel(tCrm, client.seller_role)
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
          <Link href={clientsPath(side)}>
            <ArrowLeft /> {t("back", { side })}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {clientFullName(client)}
          </h1>
          <StageBadge stage={client.stage} />
          {!client.is_active && (
            <Badge variant="outline">{t("inactive")}</Badge>
          )}
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("notes")}</CardTitle>
            </CardHeader>
            <CardContent>
              {client.notes ? (
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {client.notes}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("notesEmpty")}
                </p>
              )}
            </CardContent>
          </Card>
          <DocumentsSection
            clientId={client.id}
            agentId={client.agent_id}
            documents={documents}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("contact")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <WhatsAppButton
                phone={client.phone}
                firstName={client.first_name}
                language={client.language}
                className="w-full"
              />
              <MessageComposer
                client={{
                  id: client.id,
                  first_name: client.first_name,
                  phone: client.phone,
                  email: client.email,
                  language: client.language,
                }}
                varsInput={messageVarsInput}
                customTemplates={customTemplates}
                propertyOptions={propertyOptions}
                autoOpenTemplate={compose ?? null}
              />
              <InfoRow
                icon={<Mail className="size-4" />}
                label={t("email")}
                value={client.email}
              />
              <InfoRow
                icon={<Phone className="size-4" />}
                label={t("phone")}
                value={client.phone}
              />
              <InfoRow
                icon={<Globe2 className="size-4" />}
                label={t("language")}
                value={languageLabel(tCrm, client.language)}
              />
              <InfoRow
                icon={<MapPin className="size-4" />}
                label={t("nationality")}
                value={client.nationality}
              />
              <InfoRow
                icon={<Tag className="size-4" />}
                label={side === "buyer" ? t("dealType") : t("role")}
                value={typeLabel}
              />
              <InfoRow
                icon={<Building2 className="size-4" />}
                label={t("agency")}
                value={client.agency}
              />
              {!hasContact && (
                <p className="text-muted-foreground text-sm">
                  {t("contactEmpty")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
