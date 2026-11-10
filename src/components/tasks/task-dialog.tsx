"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { CalendarDays, ChevronDown, Loader2, Trash2, UserRound, X } from "lucide-react";

import { ClientAvatar } from "@/components/clients/client-avatar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SearchSelect } from "@/components/search-select";
import { useAgentTimeZone } from "@/components/shell/shell-context";
import { PriorityIcon } from "@/components/tasks/priority-icon";
import { StatusIcon } from "@/components/tasks/status-icon";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { dateFnsLocale } from "@/i18n/dates";
import { taskPriorityLabel, taskStatusLabel } from "@/i18n/labels";
import { addDaysToKey } from "@/lib/activity";
import { createTask, deleteTask, updateTask } from "@/lib/actions/tasks";
import { clientFullName } from "@/lib/crm";
import type { CalendarClientOption } from "@/lib/data/calendar";
import type { TaskRow } from "@/lib/data/tasks";
import { dateKeyInTimeZone } from "@/lib/home";
import { announceNotificationsChanged } from "@/lib/notifications";
import { DUE_PRESETS, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { taskFormSchema, toTaskInput, type TaskFormValues } from "@/lib/validation/task";

export type TaskDialogPayload = { mode: "create"; clientId?: string } | { mode: "edit"; task: TaskRow };

/** Urgent first, the way the priority menu lists them. */
const PRIORITY_ORDER = [...TASK_PRIORITIES].reverse();

/*
  Soft pills, as the contact-log and message dialogs draw their choices: grey
  at rest, the chosen one in the brand's soft indigo with a hairline ring.
  The same shape opens a menu (client, status, priority, the day) or sets a
  value in one tap (the usual due days).
*/
const PILL =
  "focus-visible:ring-ring/50 inline-flex h-8 max-w-full items-center gap-1.5 rounded-full px-3 text-[13px] whitespace-nowrap outline-none select-none transition-[color,background-color,box-shadow,scale] duration-150 ease-(--ease-out-quint) focus-visible:ring-[3px] active:scale-[0.96] [touch-action:manipulation] [&_svg]:shrink-0";
const PILL_IDLE =
  "bg-muted/80 text-foreground/80 hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground";
const PILL_ON =
  "bg-tone-indigo-soft text-tone-indigo-ink shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_40%,transparent)]";

function toFormValues(payload: TaskDialogPayload): TaskFormValues {
  const task = payload.mode === "edit" ? payload.task : null;
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "todo",
    priority: task?.priority ?? "none",
    client_id: task?.client_id ?? (payload.mode === "create" ? payload.clientId : undefined) ?? "",
    due_on: task?.due_on ?? "",
  };
}

/**
 * Create and edit a task. What needs doing comes first, the title over its
 * details on one sheet; then who it's for and how it stands as pills; then
 * when, one tap for the usual days or any day from the calendar. Enter in
 * the title creates it with the defaults.
 */
export function TaskDialog({
  open,
  onOpenChange,
  payload,
  clients,
  fixedClient = false,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * What the dialog shows. The parent keeps it after closing, so the title,
   * the Delete button and the submit label do not flip during the exit animation.
   */
  payload: TaskDialogPayload;
  clients: CalendarClientOption[];
  /** The client cannot be changed (client detail page). */
  fixedClient?: boolean;
  /** After a confirmed delete succeeded, so the parent drops the row. */
  onDeleted?: (id: string) => void;
}) {
  const router = useRouter();
  const timeZone = useAgentTimeZone();
  const [submitting, setSubmitting] = useState(false);

  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const tCrm = useTranslations("crm");
  const tv = useTranslations("validation");
  const schema = useMemo(() => taskFormSchema(tv), [tv]);
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(payload),
  });

  const task = payload.mode === "edit" ? payload.task : null;

  useEffect(() => {
    if (open) form.reset(toFormValues(payload));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id]);

  // An inactive client is missing from the picker list; keep the task's own in it.
  const taskClient = task?.client ?? null;
  const clientOptions =
    taskClient && !clients.some((c) => c.id === taskClient.id)
      ? [...clients, { id: taskClient.id, name: clientFullName(taskClient), side: taskClient.side }]
      : clients;

  async function onSubmit(values: TaskFormValues) {
    const input = toTaskInput(values);
    setSubmitting(true);
    const { error } = task ? await updateTask(task.id, input) : await createTask(input);
    setSubmitting(false);
    if (error) {
      toast.error(t("toasts.saveFailed"), { description: error });
      return;
    }
    toast.success(t(task ? "toasts.updated" : "toasts.created"));
    onOpenChange(false);
    router.refresh();
    // Let the bell resync now instead of on its next poll.
    const pingsChanged = task
      ? task.status !== input.status || task.due_on !== input.due_on
      : input.due_on != null;
    if (pingsChanged) announceNotificationsChanged();
  }

  async function onDelete() {
    if (!task) return true;
    const { error } = await deleteTask(task.id);
    if (error) {
      toast.error(t("toasts.deleteFailed"), { description: error });
      return false;
    }
    toast.success(t("toasts.deleted"));
    // The task's pings were cascade-deleted; the bell would otherwise link to a missing task.
    announceNotificationsChanged();
    onOpenChange(false);
    onDeleted?.(task.id);
    return true;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="pr-8">
          <DialogTitle className="font-display text-xl leading-tight font-normal tracking-[-0.02em] text-balance">
            {t(task ? "dialog.editTitle" : "dialog.newTitle")}
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] text-pretty">
            {t("dialog.description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid min-w-0 grid-cols-1 gap-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">{t("dialog.title")}</FormLabel>
                  {/* What needs doing: the title over its details, one sheet,
                      like the message dialog's email. */}
                  <div className="bg-background focus-within:ring-ring/50 has-[[aria-invalid=true]]:border-destructive overflow-hidden rounded-xl border shadow-xs transition-[box-shadow,border-color] duration-150 focus-within:ring-[3px] dark:bg-input/30">
                    <FormControl>
                      {/* One line that wraps as it grows, so a long title stays
                          readable on a phone; Enter still creates the task. */}
                      <Textarea
                        autoFocus
                        rows={1}
                        placeholder={t("dialog.titlePlaceholder")}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/\n/g, " "))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            e.currentTarget.form?.requestSubmit();
                          }
                        }}
                        className="focus-visible:border-border min-h-12 resize-none rounded-none border-0 border-b px-3.5 py-3 text-base leading-6 font-medium shadow-none focus-visible:ring-0 md:text-base dark:bg-transparent"
                      />
                    </FormControl>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field: details }) => (
                        <FormItem className="gap-0">
                          <FormLabel className="sr-only">{t("dialog.descriptionLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder={t("dialog.descriptionPlaceholder")}
                              className="min-h-20 resize-none rounded-none border-0 bg-transparent px-3.5 py-3 leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
                              {...details}
                            />
                          </FormControl>
                          <FormMessage className="px-3.5 pb-3" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Who it's for and how it stands, each pill opening its own short list. */}
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => {
                  // The client page's own client, shown as a fixed pill.
                  const fixedOption = fixedClient
                    ? (clientOptions.find((c) => c.id === field.value) ?? null)
                    : null;
                  return (
                    <FormItem className="min-w-0">
                      <FormLabel className="sr-only">{t("dialog.client")}</FormLabel>
                      {fixedClient ? (
                        // The client page's own client: said, not picked.
                        <span className={cn(PILL, "bg-muted/80 text-foreground active:scale-100")}>
                          {fixedOption ? (
                            <ClientAvatar
                              name={fixedOption.name}
                              side={fixedOption.side}
                              size="sm"
                              className="-ml-2"
                            />
                          ) : (
                            <UserRound className="size-4" strokeWidth={1.75} />
                          )}
                          <span className="truncate">{fixedOption?.name ?? t("dialog.noClient")}</span>
                        </span>
                      ) : (
                        <FormControl>
                          <SearchSelect
                            variant="ghost"
                            value={field.value}
                            onChange={field.onChange}
                            icon={<UserRound className="size-4" strokeWidth={1.75} />}
                            options={clientOptions.map((c) => ({
                              value: c.id,
                              label: c.name,
                              prefix: <ClientAvatar name={c.name} side={c.side} size="sm" />,
                            }))}
                            labels={{
                              placeholder: t("dialog.noClient"),
                              search: t("dialog.searchClient"),
                              none: t("dialog.noClient"),
                              empty: tCommon("noMatch"),
                            }}
                            className={cn(
                              PILL,
                              PILL_IDLE,
                              // A picked client's avatar hugs the pill's left edge.
                              "w-auto justify-start gap-1.5 font-normal has-[>span>span[aria-hidden]]:pl-1 [&>span]:gap-1.5 [&>svg:last-child]:size-3.5"
                            )}
                          />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <PillMenu
                    label={t("dialog.status")}
                    value={field.value}
                    onChange={field.onChange}
                    items={TASK_STATUSES.map((s) => ({
                      value: s,
                      icon: <StatusIcon status={s} />,
                      label: taskStatusLabel(tCrm, s),
                    }))}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <PillMenu
                    label={t("dialog.priority")}
                    value={field.value}
                    onChange={field.onChange}
                    muted={field.value === "none"}
                    items={PRIORITY_ORDER.map((p) => ({
                      value: p,
                      icon: <PriorityIcon priority={p} />,
                      label: taskPriorityLabel(tCrm, p),
                    }))}
                  />
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="due_on"
              render={({ field }) => {
                // One tap for the usual days, counted from the agent's own today.
                const todayKey = dateKeyInTimeZone(new Date().toISOString(), timeZone);
                const presets = DUE_PRESETS.map((p) => ({ id: p.id, key: addDaysToKey(todayKey, p.days) }));
                const active = presets.find((p) => p.key === field.value)?.id ?? null;
                return (
                  <FormItem>
                    <Label id="task-due">{t("dialog.dueDate")}</Label>
                    <div role="group" aria-labelledby="task-due" className="flex flex-wrap items-center gap-1.5">
                      {presets.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          aria-pressed={active === p.id}
                          // A second tap on the chosen day clears it.
                          onClick={() => field.onChange(active === p.id ? "" : p.key)}
                          className={cn(PILL, active === p.id ? PILL_ON : PILL_IDLE)}
                        >
                          {t(`dialog.duePresets.${p.id}`)}
                        </button>
                      ))}
                      <DayPill
                        value={field.value}
                        chosen={field.value !== "" && active == null}
                        placeholder={t("dialog.noDueDate")}
                        clearLabel={t("dialog.clearDate")}
                        onChange={field.onChange}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <DialogFooter className="items-center gap-2 sm:justify-between">
              {task ? (
                <ConfirmDialog
                  title={t("dialog.deleteTitle")}
                  description={t("dialog.deleteDescription", { title: task.title })}
                  onConfirm={onDelete}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive self-start sm:self-auto"
                    >
                      <Trash2 /> {tCommon("delete")}
                    </Button>
                  }
                />
              ) : (
                <span className="hidden sm:block" />
              )}
              {/* Stacked and full width on a phone, like the other dialogs' footers. */}
              <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="animate-spin" />}
                  {task ? tCommon("save") : t("dialog.create")}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/** A status or a priority as a pill that opens its list, the way the task drawer's menus do. */
function PillMenu<T extends string>({
  label,
  value,
  items,
  onChange,
  muted = false,
}: {
  label: string;
  value: T;
  items: { value: T; icon: ReactNode; label: string }[];
  onChange: (value: T) => void;
  /** The value means "none set" ("No priority"): its word in grey. */
  muted?: boolean;
}) {
  const current = items.find((i) => i.value === value) ?? items[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`${label}: ${current.label}`} className={cn(PILL, PILL_IDLE)}>
        {current.icon}
        <span className={cn("truncate", muted && "text-muted-foreground")}>{current.label}</span>
        <ChevronDown aria-hidden className="text-muted-foreground size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel className="text-muted-foreground text-xs">{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as T)}>
          {items.map((i) => (
            <DropdownMenuRadioItem key={i.value} value={i.value}>
              {i.icon}
              {i.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The due day itself, after the one-tap days: the real date once one is set
 * ("Fri 13 Nov", so "In 3 days" says which day it is), in indigo when it came
 * from the calendar rather than a preset; "No due date" until then. The date
 * opens the calendar for any other day, and an × inside the pill clears it,
 * so the clear never wraps onto a line of its own.
 */
function DayPill({
  value,
  chosen,
  placeholder,
  clearLabel,
  onChange,
}: {
  value: string;
  chosen: boolean;
  placeholder: string;
  clearLabel: string;
  onChange: (value: string) => void;
}) {
  const dateLocale = dateFnsLocale(useLocale());
  const [open, setOpen] = useState(false);
  // parseISO on a date-only key is local midnight of that day, so the day never shifts.
  const selected = value ? parseISO(value) : undefined;
  const valid = selected != null && !Number.isNaN(selected.getTime());

  return (
    <span
      className={cn(
        "inline-flex h-8 max-w-full items-center rounded-full transition-[color,background-color,box-shadow] duration-150",
        chosen
          ? PILL_ON
          : "bg-muted/80 text-foreground/80 has-[[data-state=open]]:bg-muted has-[button:hover]:bg-muted has-[button:hover]:text-foreground"
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "focus-visible:ring-ring/50 inline-flex h-full min-w-0 items-center gap-1.5 rounded-full pl-3 text-[13px] whitespace-nowrap outline-none select-none focus-visible:ring-[3px] [touch-action:manipulation] [&_svg]:shrink-0",
              valid ? "pr-1.5" : "pr-3"
            )}
          >
            <CalendarDays aria-hidden className="size-4" strokeWidth={1.75} />
            <span className={cn("truncate tabular-nums", !valid && "text-muted-foreground")}>
              {valid ? format(selected, "EEE d MMM", { locale: dateLocale }) : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            autoFocus
            locale={dateLocale}
            selected={valid ? selected : undefined}
            defaultMonth={valid ? selected : undefined}
            onSelect={(date) => {
              onChange(date ? format(date, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {valid ? (
        <button
          type="button"
          aria-label={clearLabel}
          title={clearLabel}
          onClick={() => onChange("")}
          className="focus-visible:ring-ring/50 mr-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full opacity-70 outline-none transition-[background-color,opacity] duration-150 hover:bg-foreground/10 hover:opacity-100 focus-visible:ring-[3px] [&_svg]:size-3.5"
        >
          <X />
        </button>
      ) : null}
    </span>
  );
}
