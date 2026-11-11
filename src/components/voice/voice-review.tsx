"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  Eye,
  Loader2,
  NotebookPen,
  Pencil,
  Search,
  SlidersHorizontal,
  UserPlus,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { ClientAvatar } from "@/components/clients/client-avatar";
import { CHANNEL_ICONS } from "@/components/clients/contact-log";
import { StageBadge } from "@/components/clients/stage-badge";
import { DatePicker, TimePicker } from "@/components/date-time-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tag } from "@/components/ui/tag";
import { Textarea } from "@/components/ui/textarea";
import { intlTag } from "@/i18n/config";
import { dateFnsLocale } from "@/i18n/dates";
import { stageLabel } from "@/i18n/labels";
import { CONTACT_CHANNELS } from "@/lib/activity";
import { searchIndex, type SearchClient } from "@/lib/actions/search";
import { applyVoiceNote, type VoiceApplyResult } from "@/lib/actions/voice";
import { EVENT_TONES } from "@/lib/calendar";
import { formatCurrency, STAGE_TONES, type ClientSide, type Stage } from "@/lib/crm";
import type { ContactChannel } from "@/lib/supabase/types";
import { TONE_BG, TONE_INK, type Tone } from "@/lib/tones";
import { cn, fold } from "@/lib/utils";
import { stageChange } from "@/lib/voice/apply-map";
import type { ProposalCandidate, ProposalGroup, VoiceProposal } from "@/lib/voice/proposal";
import type { VoiceApplyGroup } from "@/lib/voice/schema";

type Choice =
  | { kind: "existing"; candidate: ProposalCandidate }
  | {
      kind: "new";
      side: ClientSide;
      first_name: string;
      last_name: string;
      phone: string;
      email: string;
      language: string;
    }
  | { kind: "unset" };

type Prefs = NonNullable<ProposalGroup["preferences"]>;

type Draft = {
  key: string;
  include: boolean;
  spoken: string;
  candidates: ProposalCandidate[];
  choice: Choice;
  noteOn: boolean;
  note: string;
  /** Only when the model heard that the agent was in touch. */
  contact: { on: boolean; channel: ContactChannel } | null;
  viewing: (NonNullable<ProposalGroup["viewing"]> & { on: boolean }) | null;
  preferences: (Prefs & { on: boolean }) | null;
  stage: { on: boolean; value: string } | null;
  tasks: { on: boolean; title: string; due_on: string }[];
  appointment: {
    on: boolean;
    title: string;
    date: string;
    time: string;
    duration_minutes: number;
    location: string | null;
  } | null;
  followUp: string | null;
};

const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initialChoice(g: ProposalGroup): Choice {
  if (g.match.kind === "one" && g.match.candidates[0]) {
    return { kind: "existing", candidate: g.match.candidates[0] };
  }
  if (g.match.kind === "many") return { kind: "unset" };
  const words = g.person.spoken.replace(/^(the|los|las|la|el)\s+/i, "").trim().split(/\s+/);
  const email = g.contact_details?.email ?? "";
  return {
    kind: "new",
    side: g.person.side ?? "buyer",
    first_name: g.person.first_name ?? words[0] ?? "",
    last_name: g.person.last_name ?? words.slice(1).join(" "),
    phone: g.contact_details?.phone ?? "",
    email: LOOKS_LIKE_EMAIL.test(email) ? email : "",
    language: g.contact_details?.language ?? "",
  };
}

function initialDraft(g: ProposalGroup): Draft {
  const [date = "", time = ""] = g.appointment?.starts_at.split("T") ?? [];
  return {
    key: g.key,
    include: true,
    spoken: g.person.spoken,
    candidates: g.match.candidates,
    choice: initialChoice(g),
    noteOn: Boolean(g.note),
    note: g.note,
    contact: g.spoke_with_them ? { on: true, channel: g.spoke_with_them.channel } : null,
    viewing: g.viewing ? { ...g.viewing, on: true } : null,
    preferences: g.preferences ? { ...g.preferences, on: true } : null,
    stage: g.stage ? { on: true, value: g.stage } : null,
    tasks: g.tasks.map((t) => ({ on: true, title: t.title, due_on: t.due_on ?? "" })),
    appointment: g.appointment
      ? {
          on: true,
          title: g.appointment.title,
          date,
          time,
          duration_minutes: g.appointment.duration_minutes ?? 60,
          location: g.appointment.location,
        }
      : null,
    followUp: g.follow_up,
  };
}

function sideOf(d: Draft): ClientSide | null {
  if (d.choice.kind === "existing") return d.choice.candidate.side;
  if (d.choice.kind === "new") return d.choice.side;
  return null;
}

function displayName(c: { first_name: string; last_name: string }): string {
  return `${c.first_name} ${c.last_name}`.trim();
}

/** The payload for one card, or null when it's unticked or has no client yet. */
function toApplyGroup(d: Draft): VoiceApplyGroup | null {
  const side = sideOf(d);
  if (!d.include || !side || d.choice.kind === "unset") return null;
  const choice = d.choice;
  const client: VoiceApplyGroup["client"] =
    choice.kind === "existing"
      ? { kind: "existing", id: choice.candidate.id }
      : {
          kind: "new",
          side,
          first_name: choice.first_name.trim(),
          last_name: choice.last_name.trim(),
          phone: choice.phone.trim(),
          email: choice.email.trim(),
          language: choice.language.trim(),
        };

  let appointment: VoiceApplyGroup["appointment"] = null;
  const a = d.appointment;
  if (a?.on && a.title.trim() && a.date && a.time) {
    // resolved in the browser's zone, as the appointment dialog does
    const start = new Date(`${a.date}T${a.time}`);
    if (!Number.isNaN(start.getTime())) {
      appointment = {
        title: a.title.trim(),
        starts_at: start.toISOString(),
        duration_minutes: a.duration_minutes,
        location: a.location?.trim() || null,
      };
    }
  }

  const p = d.preferences;
  return {
    client,
    note: d.noteOn && d.note.trim() ? d.note.trim() : null,
    contact_channel: d.contact?.on ? d.contact.channel : null,
    viewing:
      side === "buyer" && d.viewing?.on
        ? {
            property: d.viewing.property.trim(),
            feedback: d.viewing.feedback.trim(),
            had_offer: d.viewing.had_offer,
            offer_price: d.viewing.offer_price,
            property_price: d.viewing.property_price,
          }
        : null,
    preferences:
      side === "buyer" && p?.on
        ? {
            budget_min: p.budget_min,
            budget_max: p.budget_max,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            property_types: p.property_types,
            area_notes: p.area_notes,
          }
        : null,
    stage: d.stage?.on ? d.stage.value : null,
    tasks: d.tasks
      .filter((t) => t.on && t.title.trim())
      .map((t) => ({ title: t.title.trim(), due_on: t.due_on || null })),
    appointment,
  };
}

export function VoiceReview({
  noteId,
  proposal,
  transcript,
  onSaved,
  onDiscard,
}: {
  noteId: string;
  proposal: VoiceProposal;
  transcript: string;
  /** followUps[i] is the follow-up the agent asked for on the i-th saved card. */
  onSaved: (result: VoiceApplyResult, followUps: (string | null)[]) => void;
  onDiscard: () => void;
}) {
  const t = useTranslations("voice");
  const [drafts, setDrafts] = useState<Draft[]>(() => proposal.groups.map(initialDraft));
  const [loose, setLoose] = useState(() => proposal.unassigned.map((title) => ({ on: true, title })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState<SearchClient[] | null>(null);

  const update = (i: number, patch: Partial<Draft>) =>
    setDrafts((all) => all.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  async function loadIndex(): Promise<SearchClient[]> {
    if (index) return index;
    const rows = await searchIndex();
    setIndex(rows);
    return rows;
  }

  const unresolved = drafts.some((d) => d.include && d.choice.kind === "unset");
  const missingName = drafts.some((d) => d.include && d.choice.kind === "new" && !d.choice.first_name.trim());
  const nothing = proposal.groups.length === 0 && proposal.unassigned.length === 0;

  async function save() {
    if (unresolved || missingName) {
      setError(t("review.pickFirst"));
      return;
    }
    const included = drafts
      .map((d) => ({ d, group: toApplyGroup(d) }))
      .filter((x): x is { d: Draft; group: VoiceApplyGroup } => x.group != null);
    const looseTasks = loose
      .filter((l) => l.on && l.title.trim())
      .map((l) => ({ title: l.title.trim(), due_on: null }));
    setSaving(true);
    setError(null);
    const result = await applyVoiceNote({ noteId, groups: included.map((x) => x.group), looseTasks });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved(result, included.map((x) => x.d.followUp));
  }

  return (
    <div className="flex flex-col gap-3">
      {proposal.summary ? (
        <p className="text-muted-foreground text-sm text-pretty">{proposal.summary}</p>
      ) : null}
      {nothing ? <p className="text-sm">{t("review.nothing")}</p> : null}

      {drafts.map((d, i) => (
        <ReviewCard
          key={d.key}
          draft={d}
          onChange={(patch) => update(i, patch)}
          loadIndex={loadIndex}
        />
      ))}

      {loose.length ? <LooseCard loose={loose} setLoose={setLoose} /> : null}

      {transcript ? (
        <details className="group text-sm">
          <summary className="text-muted-foreground hover:text-foreground w-fit cursor-pointer select-none">
            {t("review.heard")}
          </summary>
          <p className="bg-muted/50 text-foreground/80 mt-2 rounded-xl px-3.5 py-3 leading-relaxed whitespace-pre-wrap">
            {transcript}
          </p>
        </details>
      ) : null}

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDiscard} disabled={saving}>
          {t("discard")}
        </Button>
        <Button type="button" onClick={save} disabled={saving || nothing}>
          {saving ? <Loader2 className="animate-spin" /> : null}
          {saving ? t("review.saving") : t("review.save")}
        </Button>
      </div>
    </div>
  );
}

/*
  One card per person, the way the voice-note film shows them: who it is on
  top (their avatar, name and stage), then one short row per change the note
  proposes, each ticked to save and summed up in a line or two. A row opens
  its editor when tapped, so the card reads at a glance and a fix is one tap
  away. Each row's icon and colour are the ones the change will have on the
  client's timeline.
*/

/** Which row starts open: one the save would skip unless the agent fills it in. */
function firstOpen(d: Draft): string | null {
  if (d.choice.kind === "new" && !d.choice.first_name.trim()) return "client";
  if (d.appointment && (!d.appointment.date || !d.appointment.time)) return "appointment";
  return null;
}

function ReviewCard({
  draft: d,
  onChange,
  loadIndex,
}: {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  loadIndex: () => Promise<SearchClient[]>;
}) {
  const t = useTranslations("voice.review");
  const tChannels = useTranslations("clientDetail.contactLog.channels");
  const tCrm = useTranslations("crm");
  const locale = useLocale();
  const money = (v: number | null | undefined) => formatCurrency(v ?? null, intlTag(locale));
  const day = (key: string) =>
    key ? format(parseISO(key), "EEE d MMM", { locale: dateFnsLocale(locale) }) : "";
  const [open, setOpen] = useState<string | null>(() => firstOpen(d));
  const toggle = (id: string) => setOpen((o) => (o === id ? null : id));

  const side = sideOf(d);
  const current = d.choice.kind === "existing" ? d.choice.candidate : null;
  const nextStage =
    d.stage && side ? stageChange(side, current?.stage ?? null, d.stage.value) : null;
  const newClient = d.choice.kind === "new" ? d.choice : null;
  const setNew = (patch: Partial<Extract<Choice, { kind: "new" }>>) =>
    newClient && onChange({ choice: { ...newClient, ...patch } });

  const prefsSummary = (p: Prefs): string =>
    [
      p.budget_min != null ? `${t("budgetMin")} ${money(p.budget_min)}` : null,
      p.budget_max != null ? `${t("budgetMax")} ${money(p.budget_max)}` : null,
      p.bedrooms != null ? `${t("bedrooms")} ${p.bedrooms}` : null,
      p.bathrooms != null ? `${t("bathrooms")} ${p.bathrooms}` : null,
      p.property_types?.length
        ? p.property_types.map((type) => tCrm(`propertyTypes.${type}`)).join(", ")
        : null,
      p.area_notes,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <article
      className={cn(
        "rounded-2xl border transition-[background-color,box-shadow] duration-150",
        d.include ? "bg-card shadow-xs" : "bg-transparent"
      )}
    >
      {/* The tick sits level with the first line: the avatar row, or the "Which Lars?" question. */}
      <div className="flex items-start gap-3 px-3.5 py-3">
        <Checkbox
          className="mt-2"
          checked={d.include}
          onCheckedChange={(v) => onChange({ include: v === true })}
          aria-label={t("include")}
        />
        <div className={cn("min-w-0 flex-1", !d.include && "opacity-50")}>
          <ClientChooser draft={d} onChoose={(choice) => onChange({ choice })} loadIndex={loadIndex} />
        </div>
      </div>

      {d.include ? (
        <div className="divide-y border-t px-3.5">
          {newClient ? (
            <ChangeRow
              id="client"
              icon={UserRound}
              tone="indigo"
              label={newClient.side === "seller" ? t("seller") : t("buyer")}
              open={open === "client"}
              onToggle={toggle}
              editor={
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={newClient.first_name} onChange={(e) => setNew({ first_name: e.target.value })} placeholder={t("firstName")} aria-label={t("firstName")} maxLength={100} />
                    <Input value={newClient.last_name} onChange={(e) => setNew({ last_name: e.target.value })} placeholder={t("lastName")} aria-label={t("lastName")} maxLength={100} />
                  </div>
                  <Input value={newClient.phone} onChange={(e) => setNew({ phone: e.target.value })} placeholder={t("phone")} aria-label={t("phone")} inputMode="tel" maxLength={50} />
                  <Pills
                    label={t("newClient")}
                    value={newClient.side}
                    onChange={(value) => setNew({ side: value })}
                    items={[
                      { value: "buyer" as const, label: t("buyer") },
                      { value: "seller" as const, label: t("seller") },
                    ]}
                  />
                </>
              }
            >
              {newClient.phone || <span className="text-muted-foreground">{t("phone")}</span>}
            </ChangeRow>
          ) : null}

          {/* Always there, so a note can be added when the model heard none. */}
          <ChangeRow
            id="note"
            icon={NotebookPen}
            tone="amber"
            label={t("note")}
            checked={d.noteOn}
            onChecked={(on) => {
              onChange({ noteOn: on });
              if (on && !d.note.trim()) setOpen("note");
            }}
            open={open === "note"}
            onToggle={toggle}
            lines={3}
            editor={
              <Textarea
                value={d.note}
                onChange={(e) => onChange({ note: e.target.value })}
                rows={3}
                maxLength={2000}
                aria-label={t("note")}
                className="resize-none"
              />
            }
          >
            {d.note}
          </ChangeRow>

          {d.contact ? (
            <ChangeRow
              id="contact"
              icon={CHANNEL_ICONS[d.contact.channel]}
              tone="green"
              label={t("spokeTo")}
              checked={d.contact.on}
              onChecked={(on) => onChange({ contact: { ...d.contact!, on } })}
              open={open === "contact"}
              onToggle={toggle}
              editor={
                <Pills
                  label={t("spokeTo")}
                  value={d.contact.channel}
                  onChange={(channel) => onChange({ contact: { ...d.contact!, channel } })}
                  items={CONTACT_CHANNELS.map((c) => ({ value: c, label: tChannels(c) }))}
                />
              }
            >
              {tChannels(d.contact.channel)}
            </ChangeRow>
          ) : null}

          {d.viewing && side === "buyer" ? (
            <ChangeRow
              id="viewing"
              icon={Eye}
              tone={EVENT_TONES.viewing}
              label={t("viewing")}
              checked={d.viewing.on}
              onChecked={(on) => onChange({ viewing: { ...d.viewing!, on } })}
              open={open === "viewing"}
              onToggle={toggle}
              editor={
                <>
                  <Input
                    value={d.viewing.property}
                    onChange={(e) => onChange({ viewing: { ...d.viewing!, property: e.target.value } })}
                    maxLength={200}
                    aria-label={t("property")}
                    placeholder={t("property")}
                  />
                  <Textarea
                    value={d.viewing.feedback}
                    onChange={(e) => onChange({ viewing: { ...d.viewing!, feedback: e.target.value } })}
                    rows={2}
                    maxLength={2000}
                    aria-label={t("feedback")}
                    placeholder={t("feedback")}
                    className="resize-none"
                  />
                </>
              }
            >
              {[
                d.viewing.property,
                d.viewing.feedback,
                d.viewing.had_offer && d.viewing.offer_price
                  ? t("offer", { amount: money(d.viewing.offer_price) })
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </ChangeRow>
          ) : null}

          {d.preferences && side === "buyer" ? (
            <ChangeRow
              id="preferences"
              icon={SlidersHorizontal}
              tone="indigo"
              label={t("preferences")}
              checked={d.preferences.on}
              onChecked={(on) => onChange({ preferences: { ...d.preferences!, on } })}
              open={open === "preferences"}
              onToggle={toggle}
              editor={
                <PreferenceFields
                  proposed={d.preferences}
                  current={current?.preferences ?? null}
                  onChange={(patch) => onChange({ preferences: { ...d.preferences!, ...patch } })}
                />
              }
            >
              {prefsSummary(d.preferences)}
            </ChangeRow>
          ) : null}

          {d.stage && nextStage ? (
            <ChangeRow
              id="stage"
              icon={ArrowRight}
              tone={STAGE_TONES[nextStage as Stage] ?? "neutral"}
              label={t.rich("stageRich", {
                stage: stageLabel(tCrm, nextStage),
                tag: (chunks) => <Tag tone={STAGE_TONES[nextStage as Stage] ?? "neutral"}>{chunks}</Tag>,
              })}
              checkLabel={t("stage", { stage: stageLabel(tCrm, nextStage) })}
              checked={d.stage.on}
              onChecked={(on) => onChange({ stage: { ...d.stage!, on } })}
            />
          ) : null}

          {d.tasks.map((task, i) => {
            const setTask = (patch: Partial<Draft["tasks"][number]>) =>
              onChange({ tasks: d.tasks.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
            return (
              <ChangeRow
                key={i}
                id={`task-${i}`}
                icon={BellRing}
                tone="indigo"
                label={t("taskTitle")}
                checked={task.on}
                onChecked={(on) => setTask({ on })}
                open={open === `task-${i}`}
                onToggle={toggle}
                editor={
                  <>
                    <Input
                      value={task.title}
                      onChange={(e) => setTask({ title: e.target.value })}
                      maxLength={160}
                      aria-label={t("taskTitle")}
                    />
                    <div className="sm:w-48">
                      <DatePicker value={task.due_on} onChange={(due_on) => setTask({ due_on })} placeholder={t("noDate")} />
                    </div>
                  </>
                }
              >
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="min-w-0">{task.title}</span>
                  <When>{task.due_on ? day(task.due_on) : <span className="text-muted-foreground">{t("noDate")}</span>}</When>
                </span>
              </ChangeRow>
            );
          })}

          {d.appointment ? (
            <ChangeRow
              id="appointment"
              icon={CalendarDays}
              tone={EVENT_TONES.meeting}
              label={t("appointment")}
              checked={d.appointment.on}
              onChecked={(on) => onChange({ appointment: { ...d.appointment!, on } })}
              open={open === "appointment"}
              onToggle={toggle}
              editor={
                <>
                  <Input
                    value={d.appointment.title}
                    onChange={(e) => onChange({ appointment: { ...d.appointment!, title: e.target.value } })}
                    maxLength={200}
                    aria-label={t("appointment")}
                  />
                  <div className="flex flex-wrap gap-2">
                    <div className="w-44">
                      <DatePicker
                        value={d.appointment.date}
                        onChange={(date) => onChange({ appointment: { ...d.appointment!, date } })}
                      />
                    </div>
                    <TimePicker
                      value={d.appointment.time}
                      onChange={(time) => onChange({ appointment: { ...d.appointment!, time } })}
                    />
                  </div>
                </>
              }
            >
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="min-w-0">{d.appointment.title}</span>
                <When>
                  {d.appointment.date && d.appointment.time ? (
                    `${day(d.appointment.date)}, ${d.appointment.time}`
                  ) : (
                    <span className="text-muted-foreground">{t("noDate")}</span>
                  )}
                </When>
              </span>
            </ChangeRow>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/** A day or a time, as a small grey chip after a title. */
function When({ children }: { children: ReactNode }) {
  return (
    <span className="bg-muted text-foreground/80 shrink-0 rounded-md px-1.5 py-0.5 text-xs whitespace-nowrap tabular-nums">
      {children}
    </span>
  );
}

/**
 * One proposed change: the tick that keeps it, a tinted icon and a short
 * label, and the value under them. With an editor, the label and value are
 * one button that opens it below; a change without a tick (a new client's
 * details) always saves.
 */
function ChangeRow({
  id,
  icon: Icon,
  tone,
  label,
  checkLabel,
  checked = true,
  onChecked,
  open = false,
  onToggle,
  lines = 2,
  editor,
  children,
}: {
  id: string;
  icon: LucideIcon;
  tone: Tone;
  label: ReactNode;
  /** The tick's name when the label isn't plain text. */
  checkLabel?: string;
  checked?: boolean;
  onChecked?: (on: boolean) => void;
  open?: boolean;
  onToggle?: (id: string) => void;
  /** How many lines of the value show while closed. */
  lines?: 2 | 3;
  editor?: ReactNode;
  children?: ReactNode;
}) {
  const tCommon = useTranslations("common");
  const editable = editor != null && onToggle != null && checked;
  const head = (
    <span className="flex min-h-5 items-center gap-2">
      <span
        aria-hidden
        className={cn("flex size-5 shrink-0 items-center justify-center rounded-full", TONE_BG[tone], TONE_INK[tone])}
      >
        <Icon className="size-3" strokeWidth={2} />
      </span>
      <span className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-1.5 text-[13px]">{label}</span>
      {editable ? (
        <Pencil
          aria-hidden
          className={cn(
            "text-muted-foreground ml-auto size-3.5 shrink-0 transition-opacity duration-150",
            open ? "opacity-100" : "opacity-0 group-hover/row:opacity-100 group-focus-visible/row:opacity-100 pointer-coarse:opacity-60"
          )}
        />
      ) : null}
    </span>
  );
  const value = children ? (
    <span
      className={cn(
        "mt-1 block text-sm leading-snug break-words",
        lines === 3 ? "line-clamp-3" : "line-clamp-2",
        open && "line-clamp-none"
      )}
    >
      {children}
    </span>
  ) : null;

  return (
    <div className="flex gap-3 py-2.5">
      {onChecked ? (
        <Checkbox
          className="mt-0.5"
          checked={checked}
          onCheckedChange={(v) => onChecked(v === true)}
          aria-label={checkLabel ?? (typeof label === "string" ? label : undefined)}
        />
      ) : (
        <span aria-hidden className="w-4 shrink-0" />
      )}
      <div className={cn("min-w-0 flex-1", !checked && "opacity-50")}>
        {editable ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => onToggle(id)}
            className="group/row hover:bg-muted/60 focus-visible:ring-ring/50 -mx-2 -my-1 block w-[calc(100%+1rem)] rounded-lg px-2 py-1 text-left outline-none transition-colors duration-150 focus-visible:ring-[3px]"
          >
            {/* Heard first, so the button says what it does, then what it holds. */}
            <span className="sr-only">{tCommon("edit")}: </span>
            {head}
            {value}
          </button>
        ) : (
          <>
            {head}
            {value}
          </>
        )}
        {editable && open ? <div className="mt-2.5 mb-1 flex flex-col gap-2">{editor}</div> : null}
      </div>
    </div>
  );
}

/** A small set of choices as soft pills, the chosen one in indigo, as the other dialogs draw them. */
function Pills<T extends string>({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: T;
  items: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          aria-pressed={item.value === value}
          onClick={() => onChange(item.value)}
          className={cn(
            "focus-visible:ring-ring/50 inline-flex h-8 items-center rounded-full px-3 text-[13px] whitespace-nowrap outline-none select-none transition-[color,background-color,box-shadow,scale] duration-150 ease-(--ease-out-quint) focus-visible:ring-[3px] active:scale-[0.96] [touch-action:manipulation]",
            item.value === value
              ? "bg-tone-indigo-soft text-tone-indigo-ink shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_40%,transparent)]"
              : "bg-muted/80 text-foreground/80 hover:bg-muted hover:text-foreground"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/** To-dos the note gave that belong to no client, as rows on a card of their own. */
function LooseCard({
  loose,
  setLoose,
}: {
  loose: { on: boolean; title: string }[];
  setLoose: (update: (all: { on: boolean; title: string }[]) => { on: boolean; title: string }[]) => void;
}) {
  const t = useTranslations("voice.review");
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="bg-card rounded-2xl border shadow-xs">
      <h3 className="text-muted-foreground px-3.5 pt-3 pb-1 text-[13px]">{t("loose")}</h3>
      <div className="divide-y px-3.5">
        {loose.map((l, i) => (
          <ChangeRow
            key={i}
            id={`loose-${i}`}
            icon={BellRing}
            tone="indigo"
            label={t("looseTask")}
            checked={l.on}
            onChecked={(on) => setLoose((all) => all.map((x, j) => (j === i ? { ...x, on } : x)))}
            open={open === `loose-${i}`}
            onToggle={(id) => setOpen((o) => (o === id ? null : id))}
            editor={
              <Input
                value={l.title}
                onChange={(e) =>
                  setLoose((all) => all.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                }
                maxLength={160}
                aria-label={t("taskTitle")}
              />
            }
          >
            {l.title}
          </ChangeRow>
        ))}
      </div>
    </section>
  );
}

const PREF_FIELDS = ["budget_min", "budget_max", "bedrooms", "bathrooms"] as const;

function PreferenceFields({
  proposed,
  current,
  onChange,
}: {
  proposed: Prefs;
  current: ProposalCandidate["preferences"];
  onChange: (patch: Partial<Prefs>) => void;
}) {
  const t = useTranslations("voice.review");
  const tCrm = useTranslations("crm");
  const locale = intlTag(useLocale());
  const labels = { budget_min: t("budgetMin"), budget_max: t("budgetMax"), bedrooms: t("bedrooms"), bathrooms: t("bathrooms") };
  const isMoney = (f: (typeof PREF_FIELDS)[number]) => f === "budget_min" || f === "budget_max";
  const show = (f: (typeof PREF_FIELDS)[number], v: number | null | undefined) =>
    v == null ? "—" : isMoney(f) ? formatCurrency(v, locale) : String(v);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {PREF_FIELDS.filter((f) => proposed[f] != null).map((f) => (
          <label key={f} className="flex min-w-0 flex-col gap-1">
            <span className="text-muted-foreground flex min-w-0 items-baseline justify-between gap-2 text-xs">
              <span className="truncate">{labels[f]}</span>
              {current && current[f] != null && current[f] !== proposed[f] ? (
                <span className="shrink-0 tabular-nums">{t("was", { value: show(f, current[f]) })}</span>
              ) : null}
            </span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={proposed[f] ?? ""}
              onChange={(e) => onChange({ [f]: e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value))) })}
              className="tabular-nums"
            />
          </label>
        ))}
      </div>
      {proposed.property_types?.length ? (
        <p className="text-sm">
          <span className="text-muted-foreground">{t("types")}: </span>
          {proposed.property_types.map((type) => tCrm(`propertyTypes.${type}`)).join(", ")}
        </p>
      ) : null}
      {proposed.area_notes ? (
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">{t("areas")}</span>
          <Input
            value={proposed.area_notes}
            onChange={(e) => onChange({ area_notes: e.target.value || null })}
            maxLength={2000}
          />
        </label>
      ) : null}
    </div>
  );
}

/** Who a card is about: the client's avatar, name and stage, or the ways to settle it. */
function ClientChooser({
  draft: d,
  onChoose,
  loadIndex,
}: {
  draft: Draft;
  onChoose: (choice: Choice) => void;
  loadIndex: () => Promise<SearchClient[]>;
}) {
  const t = useTranslations("voice.review");
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<SearchClient[] | null>(null);

  const results = useMemo(() => {
    const q = fold(query);
    if (!rows) return [];
    return rows.filter((r) => !q || fold(r.name).includes(q)).slice(0, 6);
  }, [rows, query]);

  async function openSearch() {
    setSearching(true);
    setRows(await loadIndex());
  }

  const pick = (r: SearchClient) => {
    setSearching(false);
    setQuery("");
    onChoose({
      kind: "existing",
      candidate: {
        id: r.id,
        first_name: r.name,
        last_name: "",
        side: r.side,
        stage: r.stage,
        phone: r.phone,
        email: r.email,
        language: null,
        preferences: null,
      },
    });
  };

  const newChoice = (): Choice => {
    const words = d.spoken.replace(/^(the|los|las|la|el)\s+/i, "").trim().split(/\s+/);
    return {
      kind: "new",
      side: "buyer",
      first_name: words[0] ?? "",
      last_name: words.slice(1).join(" "),
      phone: "",
      email: "",
      language: "",
    };
  };

  const link = "text-muted-foreground hover:text-foreground h-auto shrink-0 px-0 text-[13px] font-normal";

  if (searching) {
    return (
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            autoFocus
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
          />
        </div>
        {rows == null ? (
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        ) : results.length ? (
          <ul className="-mx-1 flex flex-col">
            {results.map((r) => (
              <li key={r.id}>
                <CandidateButton name={r.name} side={r.side} stage={r.stage} onClick={() => pick(r)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">{t("noResults")}</p>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => {
            onChoose(newChoice());
            setSearching(false);
          }}
        >
          <UserPlus /> {t("newClient")}
        </Button>
      </div>
    );
  }

  if (d.choice.kind === "existing") {
    const c = d.choice.candidate;
    return (
      <div className="flex min-w-0 items-center gap-2.5">
        <ClientAvatar name={displayName(c)} side={c.side} size="md" />
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-[15px] font-medium">{displayName(c)}</span>
          <StageBadge stage={c.stage} />
        </span>
        <Button type="button" variant="link" size="sm" className={link} onClick={openSearch}>
          {t("change")}
        </Button>
      </div>
    );
  }

  if (d.choice.kind === "unset") {
    return (
      <div className="flex flex-col gap-2">
        <p className="flex min-h-8 items-center text-[15px] font-medium">{t("whichOne", { name: d.spoken })}</p>
        <ul className="-mx-1 flex flex-col">
          {d.candidates.map((c) => (
            <li key={c.id}>
              <CandidateButton
                name={displayName(c)}
                side={c.side}
                stage={c.stage}
                onClick={() => onChoose({ kind: "existing", candidate: c })}
              />
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={openSearch}>
            <Search /> {t("someoneElse")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChoose(newChoice())}>
            <UserPlus /> {t("newClient")}
          </Button>
        </div>
      </div>
    );
  }

  const c = d.choice;
  const name = displayName(c);
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <ClientAvatar name={name || d.spoken} side={c.side} size="md" />
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn("truncate text-[15px] font-medium", !name && "text-muted-foreground")}>
          {name || t("firstName")}
        </span>
        <Tag tone="indigo">{t("newClient")}</Tag>
      </span>
      <Button type="button" variant="link" size="sm" className={link} onClick={openSearch}>
        {t("someoneElse")}
      </Button>
    </div>
  );
}

/** A client to pick: avatar, name and stage on one row. */
function CandidateButton({
  name,
  side,
  stage,
  onClick,
}: {
  name: string;
  side: string;
  stage: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-muted focus-visible:ring-ring/50 flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 text-left text-sm outline-none transition-colors duration-150 focus-visible:ring-[3px]"
    >
      <ClientAvatar name={name} side={side} size="sm" />
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <StageBadge stage={stage} />
    </button>
  );
}
