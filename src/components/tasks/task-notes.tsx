"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { format, parseISO, subDays } from "date-fns";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAgentTimeZone } from "@/components/shell/shell-context";
import { dayLabel } from "@/components/tasks/day-label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { intlTag } from "@/i18n/config";
import { addTaskNote, deleteTaskNote, listTaskNotes } from "@/lib/actions/task-notes";
import { formatTimeInTimeZone } from "@/lib/attention";
import { dateKeyInTimeZone } from "@/lib/home";
import type { TaskNote } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { TASK_NOTE_MAX } from "@/lib/validation/task";

/** A note on screen; `pending` while its insert is on the way. */
type ShownNote = TaskNote & { pending?: boolean };

type NotesState =
  | { status: "loading" }
  | { status: "ready"; notes: ShownNote[] }
  | { status: "notReady" }
  | { status: "failed" };

/** Ids for notes that are still being saved. */
let pendingSeq = 0;

/**
 * The notes log inside the task drawer: a composer, then the notes, newest
 * first. They load when the drawer shows the task; render this with
 * `key={taskId}` so another task starts from a clean slate.
 */
export function TaskNotes({ taskId, todayKey }: { taskId: string; todayKey: string }) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const timeZone = useAgentTimeZone();
  const [state, setState] = useState<NotesState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    listTaskNotes(taskId).then(
      ({ notes, error }) => {
        if (cancelled) return;
        if (error) setState({ status: "failed" });
        else setState(notes ? { status: "ready", notes } : { status: "notReady" });
      },
      () => {
        if (!cancelled) setState({ status: "failed" });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [taskId, attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }

  /** Applies `update` to the loaded notes; nothing to update before they load. */
  function updateNotes(update: (notes: ShownNote[]) => ShownNote[]) {
    setState((current) =>
      current.status === "ready" ? { status: "ready", notes: update(current.notes) } : current
    );
  }

  async function add() {
    const body = draft.trim();
    if (!body || state.status !== "ready") return;
    // The note shows at once, faded, and turns into the saved row when the insert returns.
    pendingSeq += 1;
    const pendingId = `pending-${pendingSeq}`;
    updateNotes((notes) => [
      {
        id: pendingId,
        agent_id: "",
        task_id: taskId,
        body,
        created_at: new Date().toISOString(),
        pending: true,
      },
      ...notes,
    ]);
    setDraft("");

    let result: Awaited<ReturnType<typeof addTaskNote>>;
    try {
      result = await addTaskNote(taskId, body);
    } catch {
      result = { error: tCommon("errors.tryAgain") };
    }
    const saved = result.note;
    updateNotes((notes) =>
      saved
        ? notes.map((note) => (note.id === pendingId ? saved : note))
        : notes.filter((note) => note.id !== pendingId)
    );
    if (!saved) {
      // Hand the text back, unless a new note was started meanwhile.
      setDraft((current) => current || body);
      toast.error(t("notes.toasts.addFailed"), { description: result.error ?? undefined });
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void add();
    }
  }

  async function remove(id: string): Promise<boolean> {
    const { error } = await deleteTaskNote(id);
    if (error) {
      toast.error(t("notes.toasts.deleteFailed"), { description: error });
      return false;
    }
    updateNotes((notes) => notes.filter((note) => note.id !== id));
    toast.success(t("notes.toasts.deleted"));
    return true;
  }

  // Day and time in the agent's zone: "Today, 14:03", "11 Sep, 09:12".
  const yesterdayKey = format(subDays(parseISO(todayKey), 1), "yyyy-MM-dd");
  function when(iso: string): string {
    const key = dateKeyInTimeZone(iso, timeZone);
    const day =
      key === todayKey
        ? tCommon("today")
        : key === yesterdayKey
          ? t("done.yesterday")
          : dayLabel(key, todayKey, locale);
    return t("notes.time", { day, time: formatTimeInTimeZone(iso, timeZone, intlTag(locale)) });
  }

  const notes = state.status === "ready" ? state.notes : [];

  return (
    <section className="px-5 py-4">
      <h4 className="label-caps text-muted-foreground mb-3 flex items-center gap-2">
        {t("notes.title")}
        {notes.length > 0 ? (
          <span className="bg-muted text-foreground/80 inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] font-medium tracking-normal normal-case tabular-nums">
            {notes.length}
          </span>
        ) : null}
      </h4>

      {state.status === "notReady" ? (
        <p className="text-muted-foreground text-sm">{t("notes.notReady")}</p>
      ) : state.status === "failed" ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">{t("notes.loadFailed")}</p>
          <Button variant="outline" size="xs" onClick={retry}>
            {tCommon("retry")}
          </Button>
        </div>
      ) : (
        <>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void add();
            }}
          >
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              aria-label={t("notes.label")}
              placeholder={t("notes.placeholder")}
              maxLength={TASK_NOTE_MAX}
              rows={2}
              className="max-h-60 resize-none md:text-[13px]"
            />
            <div className="mt-2 flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={state.status !== "ready" || draft.trim() === ""}
              >
                {t("notes.add")}
              </Button>
            </div>
          </form>

          {state.status === "loading" ? (
            <div className="mt-4" role="status" aria-label={t("notes.loading")}>
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-muted-foreground mt-4 text-sm">{t("notes.empty")}</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className={cn(
                    "group bg-muted/40 rounded-lg border px-3 pt-2.5 pb-1.5 transition-opacity duration-150",
                    note.pending && "opacity-60"
                  )}
                >
                  <p className="text-sm break-words whitespace-pre-wrap">{note.body}</p>
                  <div className="mt-1 flex min-h-7 items-center justify-between gap-2">
                    <time
                      dateTime={note.created_at}
                      className="text-muted-foreground text-xs tabular-nums"
                    >
                      {when(note.created_at)}
                    </time>
                    {note.pending ? null : (
                      <ConfirmDialog
                        title={t("notes.deleteTitle")}
                        description={t("notes.deleteDescription")}
                        onConfirm={() => remove(note.id)}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={t("notes.delete")}
                            title={t("notes.delete")}
                            // Revealed on hover or focus; always there on touch screens.
                            className="text-muted-foreground hover:text-destructive -mr-1.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100"
                          >
                            <Trash2 />
                          </Button>
                        }
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
