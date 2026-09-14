import type { ReactNode } from "react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { format, formatDistanceStrict, parseISO } from "date-fns";
import {
  Building2,
  CalendarPlus,
  Contact,
  Globe2,
  Languages,
  Mail,
  MapPin,
  NotebookPen,
  Pencil,
  Phone,
  RefreshCw,
  Star,
  Tag as TagIcon,
  type LucideIcon,
} from "lucide-react";

import { ClientAvatar } from "@/components/clients/client-avatar";
import {
  ClientHeaderActions,
  StageMenu,
} from "@/components/clients/client-header-actions";
import { CopyIconButton } from "@/components/clients/copy-icon-button";
import { KeyValueList, KeyValueRow } from "@/components/shell/key-value";
import { MessageComposer } from "@/components/clients/message-composer";
import { WhatsAppButton } from "@/components/clients/whatsapp-button";
import { DocumentsSection } from "@/components/clients/sections/documents-section";
import { MatchingListingsSection } from "@/components/clients/sections/matching-listings-section";
import { PreferencesSection } from "@/components/clients/sections/preferences-section";
import { PropertiesSection } from "@/components/clients/sections/properties-section";
import { ReservationSection } from "@/components/clients/sections/reservation-section";
import { ViewingsSection } from "@/components/clients/sections/viewings-section";
import { Panel, PanelEmpty } from "@/components/shell/panel";
import { ShellCrumb } from "@/components/shell/shell-context";
import { StatStrip } from "@/components/shell/stat-strip";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { Tag } from "@/components/ui/tag";
import { appointmentTitleFor } from "@/i18n/appointments";
import { intlTag } from "@/i18n/config";
import { dateFnsLocale } from "@/i18n/dates";
import {
  dealTypeLabel,
  languageLabel,
  propertyTypeLabel,
  sellerRoleLabel,
  sideLabel,
} from "@/i18n/labels";
import { formatTimeInTimeZone } from "@/lib/attention";
import { clientFullName, formatCurrency, type ClientSide } from "@/lib/crm";
import type { ViewingWithAttachments } from "@/lib/data/buyer";
import type { ClientAppointment } from "@/lib/data/calendar";
import type { ListingMatch } from "@/lib/data/seller";
import { dateKeyInTimeZone } from "@/lib/home";
import { DEFAULT_TIME_ZONE } from "@/lib/time-zones";
import type {
  BuyerPreferences,
  Client,
  DocumentRow,
  EmailTemplate,
  Property,
  Reservation,
} from "@/lib/supabase/types";
import { whatsappLink } from "@/lib/whatsapp";

export type ClientDetailData = {
  client: Client;
  prefs: BuyerPreferences | null;
  viewings: ViewingWithAttachments[];
  reservation: Reservation | null;
  properties: Property[];
  documents: DocumentRow[];
  matches: ListingMatch[];
  customTemplates: EmailTemplate[];
  /** The client's next calendar appointment, if one is booked. */
  nextAppointment: ClientAppointment | null;
  /** `?compose=` from the URL: a template to open the composer on. */
  compose: string | null;
  /** The instant the page is rendered for; injectable for previews. */
  now?: Date;
  /** The agent's IANA time zone: days and times on the page are read in it. */
  timeZone?: string;
};

type Stat = { label: string; value: ReactNode; hint?: ReactNode };

const DAY_MS = 86_400_000;

function Muted({ children }: { children: ReactNode }) {
  return <span className="text-muted-foreground font-normal">{children}</span>;
}

/** The next reservation key date from today on, else the latest past one. */
function reservationMilestone(
  r: Reservation,
  labels: { downPayment: string; ppc: string; notary: string },
  todayKey: string
): { label: string; date: string } | null {
  const dates = [
    { label: labels.downPayment, date: r.down_payment_date },
    { label: labels.ppc, date: r.ppc_date },
    { label: labels.notary, date: r.notary_date },
  ]
    .filter((d): d is { label: string; date: string } => d.date != null)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (dates.length === 0) return null;
  return dates.find((d) => d.date >= todayKey) ?? dates[dates.length - 1];
}

/**
 * The client page, given its data. `clients/[id]/page.tsx` does the fetching.
 * A page-scale version of the list's quick view: who the client is and what
 * to do next across the top, four headline figures, the working panels, and
 * contact and details pinned beside them.
 */
export async function ClientDetailView({
  client,
  prefs,
  viewings,
  reservation,
  properties,
  documents,
  matches,
  customTemplates,
  nextAppointment,
  compose,
  now = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
}: ClientDetailData) {
  const [t, tCrm, tClients, tCommon, tRes, tViewings, tAppt, locale] =
    await Promise.all([
      getTranslations("clientDetail.page"),
      getTranslations("crm"),
      getTranslations("clients"),
      getTranslations("common"),
      getTranslations("clientDetail.reservation"),
      getTranslations("clientDetail.viewings"),
      getTranslations("server.appointments"),
      getLocale(),
    ]);
  const tag = intlTag(locale);
  const dfl = dateFnsLocale(locale);
  const nowMs = now.getTime();
  const todayKey = dateKeyInTimeZone(now.toISOString(), timeZone);
  const tomorrowKey = dateKeyInTimeZone(
    new Date(nowMs + DAY_MS).toISOString(),
    timeZone
  );

  const side = client.side as ClientSide;
  const isBuyer = side === "buyer";
  const name = clientFullName(client);
  const typeLabel = isBuyer
    ? client.deal_type
      ? dealTypeLabel(tCrm, client.deal_type)
      : null
    : client.seller_role
      ? sellerRoleLabel(tCrm, client.seller_role)
      : null;
  const language = languageLabel(tCrm, client.language);

  /** "14 Jul 2026" for an instant, on the agent's calendar. */
  const calendarDate = (iso: string) =>
    format(parseISO(dateKeyInTimeZone(iso, timeZone)), "d MMM yyyy", {
      locale: dfl,
    });
  /** "Today, 14:00" / "Tomorrow, 09:30" / "Wed 16 Sep, 17:30". */
  const whenLabel = (iso: string) => {
    const key = dateKeyInTimeZone(iso, timeZone);
    const day =
      key === todayKey
        ? tCommon("today")
        : key === tomorrowKey
          ? tCommon("tomorrow")
          : format(parseISO(key), "EEE d MMM", { locale: dfl });
    return `${day}, ${formatTimeInTimeZone(iso, timeZone, tag)}`;
  };
  const updatedLabel = formatDistanceStrict(parseISO(client.updated_at), now, {
    addSuffix: true,
    locale: dfl,
  });

  // Who they are, in one line under the name. Language and nationality are
  // often the same word ("German"); say it once.
  const meta: { icon: LucideIcon; text: string }[] = [];
  if (client.agency) meta.push({ icon: Building2, text: client.agency });
  if (language) meta.push({ icon: Languages, text: language });
  if (
    client.nationality &&
    client.nationality.trim().toLowerCase() !== language.toLowerCase()
  ) {
    meta.push({ icon: MapPin, text: client.nationality });
  }
  meta.push({ icon: RefreshCw, text: t("updated", { when: updatedLabel }) });

  // What is booked next: a dated viewing or a calendar appointment.
  const upcoming = [
    ...viewings
      .filter((v) => v.scheduled_at && Date.parse(v.scheduled_at) >= nowMs)
      .map((v) => ({
        at: v.scheduled_at as string,
        title: `${tCrm("appointmentTypes.viewing")} · ${v.title?.trim() || tViewings("untitled")}`,
      })),
    ...(nextAppointment
      ? [
          {
            at: nextAppointment.starts_at,
            title: [
              appointmentTitleFor(tAppt, nextAppointment, {
                property: nextAppointment.property_label ?? nextAppointment.location,
              }),
              nextAppointment.type === "meeting"
                ? (nextAppointment.property_label ?? nextAppointment.location)
                : null,
            ]
              .filter(Boolean)
              .join(" · "),
          },
        ]
      : []),
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const nextEvent = upcoming[0] ?? null;
  const nextUp: Stat = {
    label: t("stats.nextUp"),
    value: nextEvent ? whenLabel(nextEvent.at) : <Muted>{t("stats.nothingScheduled")}</Muted>,
    hint: nextEvent?.title ?? null,
  };

  let stats: Stat[];
  if (isBuyer) {
    const min = prefs?.budget_min ?? null;
    const max = prefs?.budget_max ?? null;
    const types = prefs?.property_types.map((type) => propertyTypeLabel(tCrm, type)) ?? [];
    const milestone = reservation
      ? reservationMilestone(
          reservation,
          { downPayment: tRes("downPayment"), ppc: tRes("ppc"), notary: tRes("notary") },
          todayKey
        )
      : null;
    const offers = viewings.filter((v) => v.had_offer).length;

    stats = [
      {
        label: t("stats.budget"),
        value:
          min != null && max != null ? (
            <span className="inline-flex flex-wrap items-center gap-x-1">
              <span className="whitespace-nowrap">
                <Money value={Math.min(min, max)} locale={tag} /> <Muted>–</Muted>
              </span>
              <Money value={Math.max(min, max)} locale={tag} className="whitespace-nowrap" />
            </span>
          ) : max != null || min != null ? (
            <Money value={max ?? min} locale={tag} />
          ) : (
            <Muted>—</Muted>
          ),
        hint:
          min != null && max == null
            ? t("stats.fromHint")
            : max != null && min == null
              ? t("stats.upToHint")
              : types.length > 2
                ? t("stats.typesMore", { count: types.length })
                : types.join(", ") || null,
      },
      {
        label: t("stats.viewings"),
        value: viewings.length,
        hint: viewings.length ? t("stats.offers", { count: offers }) : null,
      },
      {
        label: t("stats.reservation"),
        value: reservation?.closed_at ? (
          t("stats.closedOn", {
            date: format(parseISO(reservation.closed_at), "d MMM", { locale: dfl }),
          })
        ) : milestone ? (
          `${milestone.label} · ${format(parseISO(milestone.date), "d MMM", { locale: dfl })}`
        ) : reservation ? (
          <Muted>—</Muted>
        ) : (
          <Muted>{t("stats.none")}</Muted>
        ),
        hint:
          reservation?.commission != null
            ? `${tRes("commission")} ${formatCurrency(reservation.commission, tag)}`
            : reservation?.down_payment != null
              ? `${tRes("downPayment")} ${formatCurrency(reservation.down_payment, tag)}`
              : null,
      },
      nextUp,
    ];
  } else {
    const prices = properties
      .map((p) => p.price)
      .filter((p): p is number => p != null);
    const cities = [...new Set(properties.map((p) => p.city).filter(Boolean))];
    const firstListed = properties.length
      ? properties
          .map((p) => p.created_at)
          .reduce((a, b) => (Date.parse(a) <= Date.parse(b) ? a : b))
      : null;
    const daysListed = firstListed
      ? Math.max(0, Math.floor((nowMs - Date.parse(firstListed)) / DAY_MS))
      : null;

    stats = [
      {
        label: t("stats.askingPrice"),
        value: prices.length ? <Money value={Math.max(...prices)} locale={tag} /> : <Muted>—</Muted>,
        hint:
          prices.length > 1
            ? t("stats.acrossProperties", { count: prices.length })
            : null,
      },
      {
        label: t("stats.propertiesLabel"),
        value: properties.length,
        hint: cities.join(", ") || null,
      },
      {
        label: t("stats.onMarket"),
        value: daysListed != null ? t("stats.days", { count: daysListed }) : <Muted>—</Muted>,
        hint: firstListed ? t("stats.since", { date: calendarDate(firstListed) }) : null,
      },
      nextUp,
    ];
  }

  const messageVarsInput = {
    first_name: client.first_name,
    last_name: client.last_name,
    agency: client.agency,
    budgetMin: prefs?.budget_min ?? null,
    budgetMax: prefs?.budget_max ?? null,
    property: viewings[0]?.title ?? null,
  };
  const propertyOptions = isBuyer
    ? viewings.map((v) => v.title).filter((v): v is string => Boolean(v))
    : properties.map((p) => p.address || p.property_type || "").filter(Boolean);

  return (
    <div className="space-y-5">
      <ShellCrumb side={side} label={name} />

      {/* Identity and actions */}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-start gap-4">
          <ClientAvatar name={name} side={side} size="lg" className="mt-0.5" />
          <div className="min-w-0">
            <h2 className="truncate text-2xl leading-8 font-semibold tracking-tight">
              {name}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <StageMenu clientId={client.id} stage={client.stage} side={side} />
              <Tag>{sideLabel(tCrm, side)}</Tag>
              {client.priority ? (
                <Tag tone="amber">
                  <Star className="fill-current" />
                  {tClients("list.priority")}
                </Tag>
              ) : null}
              {!client.is_active ? <Tag>{t("inactive")}</Tag> : null}
            </div>
            <ul className="text-muted-foreground mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
              {meta.map(({ icon: Icon, text }, i) => (
                <li key={i} className="inline-flex min-w-0 items-center gap-1.5">
                  <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <ClientHeaderActions
          client={client}
          primary={
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
              autoOpenTemplate={compose}
              triggerVariant="default"
              triggerSize="sm"
            />
          }
        />
      </div>

      {/* Headline figures */}
      <StatStrip items={stats} />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* Contact first in the DOM: on a phone it is what you reach for. */}
        <aside className="min-w-0 space-y-5 lg:sticky lg:top-[4.75rem] lg:col-start-3 lg:row-start-1">
          <Panel title={t("contact")} icon={<Contact className="size-3.5" />}>
            {client.email || client.phone ? (
              <>
                <KeyValueList>
                  {client.email ? (
                    <KeyValueRow
                      icon={Mail}
                      label={t("email")}
                      href={`mailto:${client.email}`}
                      actions={
                        <CopyIconButton
                          value={client.email}
                          label={t("copy", { label: t("email").toLowerCase() })}
                        />
                      }
                    >
                      {client.email}
                    </KeyValueRow>
                  ) : null}
                  {client.phone ? (
                    <KeyValueRow
                      icon={Phone}
                      label={t("phone")}
                      href={`tel:${client.phone.replace(/\s+/g, "")}`}
                      actions={
                        <CopyIconButton
                          value={client.phone}
                          label={t("copy", { label: t("phone").toLowerCase() })}
                        />
                      }
                    >
                      {client.phone}
                    </KeyValueRow>
                  ) : null}
                </KeyValueList>
                {whatsappLink(client.phone) ? (
                  <div className="border-t p-3">
                    <WhatsAppButton
                      phone={client.phone}
                      firstName={client.first_name}
                      language={client.language}
                      size="sm"
                      className="w-full"
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <PanelEmpty>{t("contactEmpty")}</PanelEmpty>
            )}
          </Panel>

          <Panel title={t("details")} icon={<TagIcon className="size-3.5" />}>
            <KeyValueList>
              {language ? (
                <KeyValueRow icon={Globe2} label={t("language")}>
                  {language}
                </KeyValueRow>
              ) : null}
              {client.nationality ? (
                <KeyValueRow icon={MapPin} label={t("nationality")}>
                  {client.nationality}
                </KeyValueRow>
              ) : null}
              {typeLabel ? (
                <KeyValueRow icon={TagIcon} label={isBuyer ? t("dealType") : t("role")}>
                  {typeLabel}
                </KeyValueRow>
              ) : null}
              {client.agency ? (
                <KeyValueRow icon={Building2} label={t("agency")}>
                  {client.agency}
                </KeyValueRow>
              ) : null}
              <KeyValueRow icon={CalendarPlus} label={t("addedLabel")}>
                {calendarDate(client.created_at)}
              </KeyValueRow>
            </KeyValueList>
          </Panel>
        </aside>

        <div className="min-w-0 space-y-5 lg:col-span-2 lg:col-start-1 lg:row-start-1">
          {isBuyer ? (
            <>
              <PreferencesSection clientId={client.id} prefs={prefs} />
              {prefs ? <MatchingListingsSection matches={matches} /> : null}
              <ViewingsSection
                clientId={client.id}
                agentId={client.agent_id}
                viewings={viewings}
              />
              <ReservationSection
                clientId={client.id}
                reservation={reservation}
                todayKey={todayKey}
              />
            </>
          ) : (
            <PropertiesSection clientId={client.id} properties={properties} />
          )}
          <Panel
            title={t("notes")}
            icon={<NotebookPen className="size-3.5" />}
            action={
              <Button asChild variant="outline" size="xs">
                <Link href={`/clients/${client.id}/edit`}>
                  <Pencil /> {tCommon("edit")}
                </Link>
              </Button>
            }
          >
            {client.notes ? (
              <p className="px-4 py-3.5 text-sm leading-relaxed whitespace-pre-wrap">
                {client.notes}
              </p>
            ) : (
              <PanelEmpty>{t("notesEmpty")}</PanelEmpty>
            )}
          </Panel>
          <DocumentsSection
            clientId={client.id}
            agentId={client.agent_id}
            documents={documents}
          />
        </div>
      </div>
    </div>
  );
}
