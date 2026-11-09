"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Search, UserPlus } from "lucide-react";

import { DatePicker, TimePicker } from "@/components/date-time-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { intlTag } from "@/i18n/config";
import { stageLabel } from "@/i18n/labels";
import { CONTACT_CHANNELS } from "@/lib/activity";
import { searchIndex, type SearchClient } from "@/lib/actions/search";
import { applyVoiceNote, type VoiceApplyResult } from "@/lib/actions/voice";
import { formatCurrency, type ClientSide } from "@/lib/crm";
import type { ContactChannel } from "@/lib/supabase/types";
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
    <div className="flex flex-col gap-4">
      {proposal.summary ? <p className="text-muted-foreground text-sm">{proposal.summary}</p> : null}
      {nothing ? <p className="text-sm">{t("review.nothing")}</p> : null}

      {drafts.map((d, i) => (
        <ReviewCard
          key={d.key}
          draft={d}
          onChange={(patch) => update(i, patch)}
          loadIndex={loadIndex}
        />
      ))}

      {loose.length ? (
        <section className="flex flex-col gap-2 rounded-xl border p-3">
          <h3 className="text-sm font-medium">{t("review.loose")}</h3>
          {loose.map((l, i) => (
            <label key={i} className="flex items-center gap-2">
              <Checkbox
                checked={l.on}
                onCheckedChange={(v) =>
                  setLoose((all) => all.map((x, j) => (j === i ? { ...x, on: v === true } : x)))
                }
                aria-label={t("review.looseTask")}
              />
              <Input
                value={l.title}
                onChange={(e) =>
                  setLoose((all) => all.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                }
                maxLength={160}
                aria-label={t("review.taskTitle")}
              />
            </label>
          ))}
        </section>
      ) : null}

      {transcript ? (
        <details className="text-sm">
          <summary className="text-muted-foreground cursor-pointer select-none">{t("review.heard")}</summary>
          <p className="mt-2 whitespace-pre-wrap">{transcript}</p>
        </details>
      ) : null}

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
  const locale = intlTag(useLocale());
  const side = sideOf(d);
  const current = d.choice.kind === "existing" ? d.choice.candidate : null;
  const nextStage =
    d.stage && side ? stageChange(side, current?.stage ?? null, d.stage.value) : null;
  const money = (v: number | null | undefined) => formatCurrency(v ?? null, locale);

  return (
    <article className={cn("flex flex-col gap-3 rounded-xl border p-3", !d.include && "opacity-60")}>
      <div className="flex items-start gap-2.5">
        <Checkbox
          className="mt-1"
          checked={d.include}
          onCheckedChange={(v) => onChange({ include: v === true })}
          aria-label={t("include")}
        />
        <div className="min-w-0 flex-1">
          <ClientChooser draft={d} onChoose={(choice) => onChange({ choice })} loadIndex={loadIndex} />
        </div>
      </div>

      {d.include ? (
        <div className="flex flex-col gap-3 pl-6.5">
          <Row label={t("note")} checked={d.noteOn} onChecked={(on) => onChange({ noteOn: on })}>
            <Textarea
              value={d.note}
              onChange={(e) => onChange({ note: e.target.value })}
              rows={3}
              maxLength={2000}
              aria-label={t("note")}
            />
          </Row>

          {d.contact ? (
            <Row
              label={t("spokeTo")}
              checked={d.contact.on}
              onChecked={(on) => onChange({ contact: { ...d.contact!, on } })}
            >
              <ChoiceChips
                label={t("spokeTo")}
                items={CONTACT_CHANNELS.map((c) => ({ value: c, label: tChannels(c) }))}
                value={d.contact.channel}
                onChange={(channel) => onChange({ contact: { ...d.contact!, channel } })}
              />
            </Row>
          ) : null}

          {d.viewing && side === "buyer" ? (
            <Row
              label={t("viewing")}
              checked={d.viewing.on}
              onChecked={(on) => onChange({ viewing: { ...d.viewing!, on } })}
            >
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
              />
              {d.viewing.had_offer && d.viewing.offer_price ? (
                <p className="text-muted-foreground text-xs">
                  {t("offer", { amount: money(d.viewing.offer_price) })}
                </p>
              ) : null}
            </Row>
          ) : null}

          {d.preferences && side === "buyer" ? (
            <Row
              label={t("preferences")}
              checked={d.preferences.on}
              onChecked={(on) => onChange({ preferences: { ...d.preferences!, on } })}
            >
              <PreferenceFields
                proposed={d.preferences}
                current={current?.preferences ?? null}
                onChange={(patch) => onChange({ preferences: { ...d.preferences!, ...patch } })}
              />
            </Row>
          ) : null}

          {d.stage && nextStage ? (
            <Row
              label={t("stage", { stage: stageLabel(tCrm, nextStage) })}
              checked={d.stage.on}
              onChecked={(on) => onChange({ stage: { ...d.stage!, on } })}
            />
          ) : null}

          {d.tasks.length ? (
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{t("tasks")}</p>
              {d.tasks.map((task, i) => (
                <div key={i} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1.5">
                  <Checkbox
                    checked={task.on}
                    onCheckedChange={(v) =>
                      onChange({ tasks: d.tasks.map((x, j) => (j === i ? { ...x, on: v === true } : x)) })
                    }
                    aria-label={t("taskTitle")}
                  />
                  <Input
                    value={task.title}
                    onChange={(e) =>
                      onChange({ tasks: d.tasks.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })
                    }
                    maxLength={160}
                    aria-label={t("taskTitle")}
                  />
                  {task.on ? (
                    <div className="col-start-2 w-44">
                      <DatePicker
                        value={task.due_on}
                        onChange={(due_on) =>
                          onChange({ tasks: d.tasks.map((x, j) => (j === i ? { ...x, due_on } : x)) })
                        }
                        placeholder={t("noDate")}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {d.appointment ? (
            <Row
              label={t("appointment")}
              checked={d.appointment.on}
              onChecked={(on) => onChange({ appointment: { ...d.appointment!, on } })}
            >
              <Input
                value={d.appointment.title}
                onChange={(e) => onChange({ appointment: { ...d.appointment!, title: e.target.value } })}
                maxLength={200}
                aria-label={t("appointment")}
              />
              <div className="flex flex-wrap gap-2">
                <div className="w-40">
                  <DatePicker
                    value={d.appointment.date}
                    onChange={(date) => onChange({ appointment: { ...d.appointment!, date } })}
                  />
                </div>
                <div className="w-28">
                  <TimePicker
                    value={d.appointment.time}
                    onChange={(time) => onChange({ appointment: { ...d.appointment!, time } })}
                  />
                </div>
              </div>
            </Row>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function Row({
  label,
  checked,
  onChecked,
  children,
}: {
  label: string;
  checked: boolean;
  onChecked: (on: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 text-sm font-medium">
        <Checkbox checked={checked} onCheckedChange={(v) => onChecked(v === true)} />
        {label}
      </label>
      {checked && children ? <div className="flex flex-col gap-2 pl-6">{children}</div> : null}
    </div>
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
      {PREF_FIELDS.filter((f) => proposed[f] != null).map((f) => (
        <label key={f} className="grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-2 text-sm">
          <span className="flex min-w-0 flex-col">
            {labels[f]}
            {current && current[f] != null && current[f] !== proposed[f] ? (
              <span className="text-muted-foreground text-xs">{t("was", { value: show(f, current[f]) })}</span>
            ) : null}
          </span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={proposed[f] ?? ""}
            onChange={(e) => onChange({ [f]: e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value))) })}
          />
        </label>
      ))}
      {proposed.property_types?.length ? (
        <p className="text-sm">
          <span className="text-muted-foreground">{t("types")}: </span>
          {proposed.property_types.map((type) => tCrm(`propertyTypes.${type}`)).join(", ")}
        </p>
      ) : null}
      {proposed.area_notes ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{t("areas")}</span>
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
  const tCrm = useTranslations("crm");
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
          <ul className="flex flex-col">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  className="hover:bg-accent flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm"
                >
                  <span className="truncate">{r.name}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">{stageLabel(tCrm, r.stage)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">{t("noResults")}</p>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChoose(newChoice());
              setSearching(false);
            }}
          >
            <UserPlus /> {t("newClient")}
          </Button>
        </div>
      </div>
    );
  }

  if (d.choice.kind === "existing") {
    const c = d.choice.candidate;
    return (
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="min-w-0 truncate font-medium">
          {displayName(c)}{" "}
          <span className="text-muted-foreground text-sm font-normal">· {stageLabel(tCrm, c.stage)}</span>
        </p>
        <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={openSearch}>
          {t("change")}
        </Button>
      </div>
    );
  }

  if (d.choice.kind === "unset") {
    return (
      <div className="flex flex-col gap-2">
        <p className="font-medium">{t("whichOne", { name: d.spoken })}</p>
        <div className="flex flex-col gap-1">
          {d.candidates.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onChoose({ kind: "existing", candidate: c })}
              className="hover:bg-accent flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm"
            >
              <span className="truncate">{displayName(c)}</span>
              <span className="text-muted-foreground shrink-0 text-xs">{stageLabel(tCrm, c.stage)}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
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
  const set = (patch: Partial<Extract<Choice, { kind: "new" }>>) => onChoose({ ...c, ...patch });
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">{t("newClient")}</p>
        <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={openSearch}>
          {t("someoneElse")}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input value={c.first_name} onChange={(e) => set({ first_name: e.target.value })} placeholder={t("firstName")} aria-label={t("firstName")} maxLength={100} />
        <Input value={c.last_name} onChange={(e) => set({ last_name: e.target.value })} placeholder={t("lastName")} aria-label={t("lastName")} maxLength={100} />
      </div>
      <Input value={c.phone} onChange={(e) => set({ phone: e.target.value })} placeholder={t("phone")} aria-label={t("phone")} inputMode="tel" maxLength={50} />
      <ChoiceChips
        label={t("newClient")}
        items={[
          { value: "buyer" as const, label: t("buyer") },
          { value: "seller" as const, label: t("seller") },
        ]}
        value={c.side}
        onChange={(side) => set({ side })}
      />
    </div>
  );
}
