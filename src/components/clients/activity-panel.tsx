"use client";

import {
  useOptimistic,
  useState,
  useTransition,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowRight,
  History,
  NotebookPen,
  Pencil,
  Trash2,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  CHANNEL_ICONS,
  LogContactButton,
  type ContactTarget,
} from "@/components/clients/contact-log";
import { Panel } from "@/components/shell/panel";
import { useAgentTimeZone } from "@/components/shell/shell-context";
import { dayLabel } from "@/components/tasks/day-label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoiceNoteButton } from "@/components/voice/voice-note-button";
import { intlTag } from "@/i18n/config";
import { stageLabel } from "@/i18n/labels";
import { addDaysToKey } from "@/lib/activity";
import { addClientNote, deleteActivity } from "@/lib/actions/activity";
import { formatTimeInTimeZone } from "@/lib/attention";
import { STAGE_TONES, type Stage } from "@/lib/crm";
import type { ActivityRow } from "@/lib/data/activity";
import { dateKeyInTimeZone } from "@/lib/home";
import { TONE_SOLID } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { ACTIVITY_BODY_MAX } from "@/lib/validation/activity";

/** An entry on screen; `pending` while its insert is on the way. */
type ShownActivity = ActivityRow & { pending?: boolean };

/** Ids for notes that are still being saved. */
let pendingSeq = 0;

/**
 * The client's history on their page: a note box, then contacts, notes and
 * stage moves, newest first, ending with the day they were added. The old
 * free-text notes stay pinned on top as "About", edited with the client.
 */
export function ActivityPanel({
  client,
  activities,
  about,
  aboutHref,
  createdAt,
  todayKey,
}: {
  client: ContactTarget;
  activities: ActivityRow[];
  /** The client's free-text notes field. */
  about: string | null;
  /** Where the About text is edited. */
  aboutHref: string;
  createdAt: string;
  todayKey: string;
}) {
  const t = useTranslations("clientDetail.activity");
  const tCrm = useTranslations("crm");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const timeZone = useAgentTimeZone();
  const [draft, setDraft] = useState("");
  const [, startTransition] = useTransition();
  const [shown, addShown] = useOptimistic<ShownActivity[], ShownActivity>(
    activities,
    (state, entry) => [entry, ...state]
  );

  function add() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    pendingSeq += 1;
    const pendingId = `pending-${pendingSeq}`;
    startTransition(async () => {
      addShown({
        id: pendingId,
        kind: "note",
        channel: null,
        body,
        stage_from: null,
        stage_to: null,
        occurred_at: new Date().toISOString(),
        pending: true,
      });
      let error: string | null;
      try {
        ({ error } = await addClientNote({ clientId: client.id, body }));
      } catch {
        error = tCommon("errors.tryAgain");
      }
      if (error) {
        // Hand the text back, unless a new note was started meanwhile.
        setDraft((current) => current || body);
        toast.error(t("toasts.noteFailed"), { description: error });
      }
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      add();
    }
  }

  async function remove(id: string): Promise<boolean> {
    const { error } = await deleteActivity(id);
    if (error) {
      toast.error(t("toasts.deleteFailed"), { description: error });
      return false;
    }
    toast.success(t("toasts.deleted"));
    return true;
  }

  // Day and time in the agent's zone: "Today, 14:03", "Yesterday, 18:20", "11 Sep, 09:12".
  const yesterdayKey = addDaysToKey(todayKey, -1);
  function when(iso: string): string {
    const key = dateKeyInTimeZone(iso, timeZone);
    const day =
      key === todayKey
        ? tCommon("today")
        : key === yesterdayKey
          ? t("yesterday")
          : dayLabel(key, todayKey, locale);
    return t("time", { day, time: formatTimeInTimeZone(iso, timeZone, intlTag(locale)) });
  }

  function describe(a: ShownActivity): { icon: LucideIcon; title: ReactNode } {
    if (a.kind === "contact") {
      return { icon: CHANNEL_ICONS[a.channel ?? "other"], title: t(`contact.${a.channel ?? "other"}`) };
    }
    if (a.kind === "stage") {
      const to = a.stage_to ?? "";
      return {
        icon: ArrowRight,
        title: (
          <span className="inline-flex flex-wrap items-center gap-x-1.5">
            <span
              aria-hidden
              className={cn("size-1.5 rounded-full", TONE_SOLID[STAGE_TONES[to as Stage] ?? "neutral"])}
            />
            {t("stage", { stage: stageLabel(tCrm, to) })}
            {a.stage_from ? (
              <span className="text-muted-foreground">
                {t("stageFrom", { stage: stageLabel(tCrm, a.stage_from) })}
              </span>
            ) : null}
          </span>
        ),
      };
    }
    return { icon: NotebookPen, title: null };
  }

  return (
    <Panel
      title={t("title")}
      icon={<History className="size-3.5" />}
      action={
        <span className="-mr-1.5 flex items-center gap-0.5">
          <VoiceNoteButton
            clientId={client.id}
            clientName={client.firstName}
            className="text-muted-foreground"
          />
          <LogContactButton
            client={client}
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
          />
        </span>
      }
    >
      <form
        className="border-b px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          aria-label={t("noteLabel")}
          placeholder={t("notePlaceholder")}
          maxLength={ACTIVITY_BODY_MAX}
          rows={2}
          className="max-h-60 resize-none md:text-[13px]"
        />
        {draft.trim() ? (
          <div className="mt-2 flex justify-end">
            <Button type="submit" size="sm">
              {t("addNote")}
            </Button>
          </div>
        ) : null}
      </form>

      {about ? (
        <div className="bg-muted/40 border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="section-label text-muted-foreground">{t("about")}</p>
            <Button asChild variant="ghost" size="xs" className="text-muted-foreground -mr-1.5">
              <Link href={aboutHref}>
                <Pencil /> {tCommon("edit")}
              </Link>
            </Button>
          </div>
          <p className="mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">{about}</p>
        </div>
      ) : null}

      <ol className="px-4 pt-4 pb-3">
        {shown.map((a) => {
          const { icon: Icon, title } = describe(a);
          const deletable = !a.pending && (a.kind === "note" || a.kind === "contact");
          return (
            <li
              key={a.id}
              className={cn("group relative flex gap-3 pb-4", a.pending && "opacity-60")}
            >
              <span aria-hidden className="bg-border absolute top-8 bottom-0 left-[13px] w-px" />
              <span className="bg-muted text-muted-foreground relative flex size-7 shrink-0 items-center justify-center rounded-full">
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1 pt-[3px]">
                <div className="flex min-h-5 items-start justify-between gap-3">
                  {/* A note is its own text; other entries get a title and the text below. */}
                  {title ? (
                    <p className="text-sm">{title}</p>
                  ) : (
                    <p className="text-foreground/90 min-w-0 text-sm break-words whitespace-pre-wrap">
                      {a.body}
                    </p>
                  )}
                  <div className="flex shrink-0 items-center gap-1">
                    <time dateTime={a.occurred_at} className="text-muted-foreground text-xs leading-5 tabular-nums max-sm:hidden">
                      {when(a.occurred_at)}
                    </time>
                    {/* Every row keeps this slot, so the times line up. */}
                    <span className="-my-1 flex w-6 justify-end">
                    {deletable ? (
                      <ConfirmDialog
                        title={t("deleteTitle")}
                        description={t("deleteDescription")}
                        onConfirm={() => remove(a.id)}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={t("delete")}
                            title={t("delete")}
                            // Revealed on hover or focus; always there on touch screens.
                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100"
                          >
                            <Trash2 />
                          </Button>
                        }
                      />
                    ) : null}
                    </span>
                  </div>
                </div>
                {title && a.body ? (
                  <p className="text-muted-foreground mt-0.5 line-clamp-3 text-sm break-words whitespace-pre-wrap">
                    {a.body}
                  </p>
                ) : null}
                {/* On a phone the time goes under the entry, so the text keeps the width. */}
                <time dateTime={a.occurred_at} className="text-muted-foreground mt-0.5 block text-xs tabular-nums sm:hidden">
                  {when(a.occurred_at)}
                </time>
              </div>
            </li>
          );
        })}
        <li className="relative flex gap-3">
          <span className="bg-muted text-muted-foreground relative flex size-7 shrink-0 items-center justify-center rounded-full">
            <UserPlus className="size-3.5" />
          </span>
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pt-[3px] max-sm:flex-col max-sm:gap-0.5">
            <p className="text-sm">{t("added")}</p>
            <div className="flex shrink-0 items-center gap-1">
              <time dateTime={createdAt} className="text-muted-foreground text-xs leading-5 tabular-nums max-sm:leading-4">
                {when(createdAt)}
              </time>
              <span className="w-6 max-sm:hidden" />
            </div>
          </div>
        </li>
      </ol>
      {shown.length === 0 ? (
        <p className="text-muted-foreground pr-4 pb-4 pl-14 text-[13px]">{t("empty")}</p>
      ) : null}
    </Panel>
  );
}
