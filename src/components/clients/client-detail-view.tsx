import type { ReactNode } from "react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { format, formatDistanceStrict, parseISO } from "date-fns";
import {
  Building2,
  CalendarPlus,
  Contact,
  Globe2,
  History,
  Languages,
  Mail,
  MapPin,
  NotebookPen,
  Pencil,
  Phone,
  RefreshCw,
  Star,
  Tag as TagIcon,
  Timer,
  type LucideIcon,
} from "lucide-react";

import { ActivityPanel } from "@/components/clients/activity-panel";
import { ClientAvatar } from "@/components/clients/client-avatar";
import {
  ContactButtons,
  LogContactButton,
} from "@/components/clients/contact-log";
import {
  ClientHeaderActions,
  StageMenu,
} from "@/components/clients/client-header-actions";
import { CopyIconButton } from "@/components/clients/copy-icon-button";
import { KeyValueList, KeyValueRow } from "@/components/shell/key-value";
import { MessageComposer } from "@/components/clients/message-composer";
import {
  NextStepCard,
  type BookedEvent,
  type NextStep,
} from "@/components/clients/next-step-card";
import { DocumentsSection } from "@/components/clients/sections/documents-section";
import { MatchingListingsSection } from "@/components/clients/sections/matching-listings-section";
import { PreferencesSection } from "@/components/clients/sections/preferences-section";
import { PropertiesSection } from "@/components/clients/sections/properties-section";
import { ReservationSection } from "@/components/clients/sections/reservation-section";
import { TasksSection } from "@/components/clients/sections/tasks-section";
import { ViewingsSection } from "@/components/clients/sections/viewings-section";
import { Panel, PanelEmpty } from "@/components/shell/panel";
import { ShellCrumb } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { Notice } from "@/components/ui/notice";
import { Tag } from "@/components/ui/tag";
import type { ClientPageEnquiry } from "@/lib/data/agent-pages";
import { appointmentTitleFor } from "@/i18n/appointments";
import { intlTag } from "@/i18n/config";
import { dateFnsLocale } from "@/i18n/dates";
import {
  dealTypeLabel,
  languageLabel,
  nationalityLabel,
  propertyTypeLabel,
  sellerRoleLabel,
  sideLabel,
} from "@/i18n/labels";
import { lastTouchedAt, needsFollowUp } from "@/lib/activity";
import { formatTimeInTimeZone } from "@/lib/attention";
import { calendarHref } from "@/lib/calendar-view";
import {
  clientFullName,
  defaultStageForSide,
  formatCurrency,
  type ClientSide,
} from "@/lib/crm";
import type { ActivityRow } from "@/lib/data/activity";
import type { ViewingWithAttachments } from "@/lib/data/buyer";
import type { ClientAppointment } from "@/lib/data/calendar";
import type { ListingMatch, PropertyWithAttachments } from "@/lib/data/seller";
import type { TaskRow } from "@/lib/data/tasks";
import { dateKeyInTimeZone } from "@/lib/home";
import { dueState, isOpenStatus } from "@/lib/tasks";
import { DEFAULT_TIME_ZONE } from "@/lib/time-zones";
import { cn } from "@/lib/utils";
import type {
  BuyerPreferences,
  Client,
  DocumentRow,
  EmailTemplate,
  Reservation,
} from "@/lib/supabase/types";

export type ClientDetailData = {
  client: Client;
  prefs: BuyerPreferences | null;
  viewings: ViewingWithAttachments[];
  reservation: Reservation | null;
  properties: PropertyWithAttachments[];
  documents: DocumentRow[];
  matches: ListingMatch[];
  customTemplates: EmailTemplate[];
  /** The client's next calendar appointment, if one is booked. */
  nextAppointment: ClientAppointment | null;
  /** The client's open tasks; null until the tasks table exists. */
  tasks: TaskRow[] | null;
  /** Contacts, notes and stage moves, newest first; null until the table exists. */
  activities: ActivityRow[] | null;
  /** `?compose=` from the URL: a template to open the composer on. */
  compose: string | null;
  /** The public-page enquiry that brought the client in, if one did. */
  pageEnquiry?: ClientPageEnquiry | null;
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
  tasks,
  activities,
  compose,
  pageEnquiry = null,
  now = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
}: ClientDetailData) {
  const [t, tCrm, tClients, tCommon, tRes, tViewings, tAppt, tActivity, tPageEnquiry, locale] =
    await Promise.all([
      getTranslations("clientDetail.page"),
      getTranslations("crm"),
      getTranslations("clients"),
      getTranslations("common"),
      getTranslations("clientDetail.reservation"),
      getTranslations("clientDetail.viewings"),
      getTranslations("server.appointments"),
      getTranslations("clientDetail.activity"),
      getTranslations("clientDetail.pageEnquiry"),
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
  const contactTarget = {
    id: client.id,
    firstName: client.first_name,
    side: client.side,
    stage: client.stage,
  };
  const typeLabel = isBuyer
    ? client.deal_type
      ? dealTypeLabel(tCrm, client.deal_type)
      : null
    : client.seller_role
      ? sellerRoleLabel(tCrm, client.seller_role)
      : null;
  const language = languageLabel(tCrm, client.language);
  const nationality = nationalityLabel(tCrm, client.nationality);

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

  // A client who wrote in from the agent's public page: how long they have
  // waited, while the page's reply time is on the line, and later how fast
  // the reply came (shown for three days, then the tag alone remains).
  let pageNotice: { tone: "amber" | "red" | "green"; text: string } | null = null;
  if (pageEnquiry) {
    const received = parseISO(pageEnquiry.received_at);
    if (pageEnquiry.first_reply_at) {
      if (nowMs - received.getTime() <= 3 * DAY_MS) {
        pageNotice = {
          tone: "green",
          text: tPageEnquiry("replied", {
            wait: formatDistanceStrict(received, parseISO(pageEnquiry.first_reply_at), {
              locale: dfl,
            }),
          }),
        };
      }
    } else {
      const late = nowMs - received.getTime() > 60 * 60 * 1000;
      pageNotice = {
        tone: late ? "red" : "amber",
        text: tPageEnquiry(late ? "late" : "waiting", {
          ago: formatDistanceStrict(received, now, { addSuffix: true, locale: dfl }),
        }),
      };
    }
  }

  // Who they are, in one line under the name. Language and nationality are
  // often the same word ("German"); say it once.
  const meta: { icon: LucideIcon; text: string }[] = [];
  if (client.agency) meta.push({ icon: Building2, text: client.agency });
  if (language) meta.push({ icon: Languages, text: language });
  // Both are stored in English, so the stored words are the ones to compare.
  if (
    nationality &&
    client.nationality?.trim().toLowerCase() !==
      client.language?.trim().toLowerCase()
  ) {
    meta.push({ icon: MapPin, text: nationality });
  }
  // When the agent last reached them says more than the last edit, once there is one.
  meta.push(
    client.last_contacted_at
      ? {
          icon: History,
          text: tActivity("lastContact", {
            when: formatDistanceStrict(parseISO(client.last_contacted_at), now, {
              addSuffix: true,
              locale: dfl,
            }),
          }),
        }
      : { icon: RefreshCw, text: t("updated", { when: updatedLabel }) }
  );

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
  const booked: BookedEvent | null = nextEvent
    ? {
        when: whenLabel(nextEvent.at),
        title: nextEvent.title,
        href: calendarHref("week", dateKeyInTimeZone(nextEvent.at, timeZone)),
      }
    : null;

  // The one thing to do now, for the card on top of the side column: an
  // overdue task, then one due today, a viewing or meeting today or
  // tomorrow, a lead nobody has written to or a client gone quiet (the
  // lists' Needs follow-up rule), a later booking, else all caught up.
  const openTasks = (tasks ?? []).filter((task) => isOpenStatus(task.status));
  const urgent = openTasks
    .map((task) => ({ task, due: dueState(task.due_on, todayKey) }))
    .filter(({ due }) => due === "overdue" || due === "today")
    // Overdue first; the query's order (priority, then due date) within each.
    .sort((a, b) => Number(a.due === "today") - Number(b.due === "today"));
  const eventSoon =
    nextEvent != null &&
    [todayKey, tomorrowKey].includes(dateKeyInTimeZone(nextEvent.at, timeZone));
  let nextStep: NextStep;
  if (urgent.length > 0) {
    const { task, due } = urgent[0];
    nextStep = {
      kind: "task",
      due: due === "overdue" ? "overdue" : "today",
      task,
      overdueDays: task.due_on
        ? Math.max(1, Math.round((Date.parse(todayKey) - Date.parse(task.due_on)) / DAY_MS))
        : 0,
      more: urgent.length - 1,
    };
  } else if (booked && eventSoon) {
    nextStep = { kind: "event", event: booked };
  } else if (needsFollowUp({ ...client, side }, nowMs)) {
    nextStep =
      client.last_contacted_at == null && client.stage === defaultStageForSide(side)
        ? { kind: "firstContact" }
        : {
            kind: "quiet",
            days: Math.floor((nowMs - Date.parse(lastTouchedAt(client))) / DAY_MS),
          };
  } else if (booked) {
    nextStep = { kind: "event", event: booked };
  } else {
    nextStep = {
      kind: "clear",
      lastContact: client.last_contacted_at
        ? formatDistanceStrict(parseISO(client.last_contacted_at), now, {
            addSuffix: true,
            locale: dfl,
          })
        : null,
      nextTask: openTasks[0]?.title ?? null,
    };
  }

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
    const reservationMoney =
      reservation?.commission != null
        ? `${tRes("commission")} ${formatCurrency(reservation.commission, tag)}`
        : reservation?.down_payment != null
          ? `${tRes("downPayment")} ${formatCurrency(reservation.down_payment, tag)}`
          : null;

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
          // When, then what under it, like "Next up": a long step name
          // ("Contrato de arras (PPC)") would break the date across lines.
          format(parseISO(milestone.date), "d MMM", { locale: dfl })
        ) : reservation ? (
          <Muted>—</Muted>
        ) : (
          <Muted>{t("stats.none")}</Muted>
        ),
        // The step, then the money when the cell has room for both: a
        // truncated figure ("Commission €21,6…") reads as broken, so on a
        // phone and in the narrow four-up row at lg the step stands alone,
        // and elsewhere a long step name gives way before the figure does.
        hint:
          milestone && !reservation?.closed_at ? (
            <span className="flex min-w-0">
              <span className="truncate">{milestone.label}</span>
              {reservationMoney ? (
                <span className="shrink-0 whitespace-pre max-sm:hidden lg:max-xl:hidden">
                  {` · ${reservationMoney}`}
                </span>
              ) : null}
            </span>
          ) : (
            reservationMoney
          ),
      },
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

  // Reference facts. Beside the working panels from lg up; on a phone they
  // go last, after the tasks and activity (the header already says agency,
  // language and nationality), so it renders in both places, one hidden.
  const detailsPanel = (className: string) => (
    <Panel title={t("details")} icon={<TagIcon className="size-3.5" />} className={className}>
      <KeyValueList>
        {language ? (
          <KeyValueRow icon={Globe2} label={t("language")}>
            {language}
          </KeyValueRow>
        ) : null}
        {nationality ? (
          <KeyValueRow icon={MapPin} label={t("nationality")}>
            {nationality}
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
  );

  return (
    <div className="space-y-5">
      <ShellCrumb side={side} label={name} />

      {/* Who the client is and what the deal is worth, on one grey surface:
          the name and the lead figure are set large in the display face, so
          the eye lands here first and the panels below read as detail. */}
      <section className="bg-muted/55 dark:bg-muted/35 rounded-2xl ring-1 ring-black/[0.04] ring-inset dark:ring-white/[0.06]">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 p-5 sm:p-6">
          <div className="flex min-w-0 items-start gap-3.5 sm:items-center sm:gap-4">
            <span className="bg-background shrink-0 rounded-full p-1 shadow-xs">
              <ClientAvatar
                name={name}
                side={side}
                size="xl"
                className="max-sm:size-12 max-sm:text-base"
              />
            </span>
            <div className="min-w-0">
              {/* A long name wraps on a phone and is cut short only where there is room for most of it. */}
              <h2 className="font-display text-2xl leading-tight font-normal tracking-[-0.03em] text-balance break-words sm:truncate sm:text-[1.75rem]">
                {name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <StageMenu clientId={client.id} stage={client.stage} side={side} />
                <Tag>{sideLabel(tCrm, side)}</Tag>
                {client.source === "page" ? (
                  <Tag tone="indigo">
                    <Globe2 />
                    {t("fromPage")}
                  </Tag>
                ) : null}
                {client.priority ? (
                  <Tag>
                    <Star className="fill-foreground text-foreground" />
                    {tClients("list.priority")}
                  </Tag>
                ) : null}
                {!client.is_active ? <Tag>{t("inactive")}</Tag> : null}
              </div>
              <ul className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
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
              <>
              {activities ? (
                <LogContactButton client={contactTarget} labelClassName="max-sm:sr-only" />
              ) : null}
              <MessageComposer
                client={{
                  id: client.id,
                  first_name: client.first_name,
                  last_name: client.last_name,
                  phone: client.phone,
                  email: client.email,
                  language: client.language,
                  side: client.side,
                  stage: client.stage,
                }}
                varsInput={messageVarsInput}
                customTemplates={customTemplates}
                propertyOptions={propertyOptions}
                autoOpenTemplate={compose}
                triggerVariant="default"
                triggerSize="sm"
              />
              </>
            }
          />
        </div>

        {/* Headline figures: the money first and largest, the rest beside it. */}
        <dl className="border-foreground/[0.07] mx-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 pb-5 sm:mx-6 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] sm:pb-6">
          {stats.map((stat, i) => (
            <div key={stat.label} className={cn("min-w-0", i === 0 && "col-span-2 sm:col-span-1")}>
              <dt className="text-muted-foreground truncate text-[13px]">{stat.label}</dt>
              <dd
                className={cn(
                  "font-display mt-1 font-normal tracking-[-0.03em] break-words tabular-nums",
                  i === 0
                    ? "text-[1.625rem] leading-tight sm:text-[1.875rem]"
                    : "text-lg leading-7 sm:text-xl"
                )}
              >
                {stat.value}
              </dd>
              {stat.hint ? (
                <dd className="text-muted-foreground mt-0.5 truncate text-[13px]">{stat.hint}</dd>
              ) : null}
            </div>
          ))}
        </dl>
      </section>

      {pageNotice ? (
        <Notice tone={pageNotice.tone} icon={pageNotice.tone === "green" ? undefined : Timer}>
          {pageNotice.text}
        </Notice>
      ) : null}


      {/* Two to one, but the side column never drops under 20rem: at
          1024-1279px a third of the row would cut the phone number short. */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        {/* The next step and contact first in the DOM: on a phone they are
            what you reach for. */}
        <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-[4.75rem] lg:col-start-2 lg:row-start-1">
          <NextStepCard
            step={nextStep}
            client={contactTarget}
            phone={client.phone}
            language={client.language}
            booked={booked}
          />
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
                {client.phone ? (
                  <div className="border-t p-3">
                    <ContactButtons
                      client={contactTarget}
                      phone={client.phone}
                      language={client.language}
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <PanelEmpty>{t("contactEmpty")}</PanelEmpty>
            )}
          </Panel>

          {detailsPanel("max-lg:hidden")}
        </aside>

        <div className="flex min-w-0 flex-col gap-5 lg:col-start-1 lg:row-start-1">
          {tasks ? (
            <TasksSection
              clientId={client.id}
              clientName={name}
              side={side}
              tasks={tasks}
              todayKey={todayKey}
            />
          ) : null}
          {activities ? (
            <ActivityPanel
              client={contactTarget}
              activities={activities}
              about={client.notes}
              aboutHref={`/clients/${client.id}/edit`}
              createdAt={client.created_at}
              todayKey={todayKey}
            />
          ) : (
            <Panel
              title={t("notes")}
              icon={<NotebookPen className="size-3.5" />}
              action={
                <Button
                  asChild
                  variant="ghost"
                  size="xs"
                  className="text-muted-foreground -mr-1.5"
                >
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
          )}
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
            <PropertiesSection
              clientId={client.id}
              agentId={client.agent_id}
              properties={properties}
            />
          )}
          <DocumentsSection
            clientId={client.id}
            agentId={client.agent_id}
            documents={documents}
          />
          {detailsPanel("lg:hidden")}
        </div>
      </div>
    </div>
  );
}
