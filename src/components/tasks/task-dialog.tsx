"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Trash2, X } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DatePicker } from "@/components/date-time-picker";
import { SearchSelect } from "@/components/search-select";
import { useAgentTimeZone } from "@/components/shell/shell-context";
import { PriorityIcon } from "@/components/tasks/priority-icon";
import { StatusIcon } from "@/components/tasks/status-icon";
import { Button } from "@/components/ui/button";
import { ChoiceChips } from "@/components/ui/choice-chips";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { taskPriorityLabel, taskStatusLabel } from "@/i18n/labels";
import { addDaysToKey } from "@/lib/activity";
import { createTask, deleteTask, updateTask } from "@/lib/actions/tasks";
import { clientFullName } from "@/lib/crm";
import type { CalendarClientOption } from "@/lib/data/calendar";
import type { TaskRow } from "@/lib/data/tasks";
import { dateKeyInTimeZone } from "@/lib/home";
import { announceNotificationsChanged } from "@/lib/notifications";
import { DUE_PRESETS, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/tasks";
import { taskFormSchema, toTaskInput, type TaskFormValues } from "@/lib/validation/task";

export type TaskDialogPayload = { mode: "create"; clientId?: string } | { mode: "edit"; task: TaskRow };

/** Urgent first, the way the priority menu lists them. */
const PRIORITY_ORDER = [...TASK_PRIORITIES].reverse();

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

/** Create and edit a task. Enter in the title creates it with the defaults. */
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(task ? "dialog.editTitle" : "dialog.newTitle")}</DialogTitle>
          <DialogDescription>{t("dialog.description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dialog.title")}</FormLabel>
                  <FormControl>
                    <Input autoFocus placeholder={t("dialog.titlePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dialog.status")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            <StatusIcon status={s} />
                            {taskStatusLabel(tCrm, s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dialog.priority")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITY_ORDER.map((p) => (
                          <SelectItem key={p} value={p}>
                            <PriorityIcon priority={p} />
                            {taskPriorityLabel(tCrm, p)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="due_on"
              render={({ field }) => {
                // One tap for the usual dates, counted from the agent's own today.
                const todayKey = dateKeyInTimeZone(new Date().toISOString(), timeZone);
                const presets = DUE_PRESETS.map((p) => ({ id: p.id, key: addDaysToKey(todayKey, p.days) }));
                const active = presets.find((p) => p.key === field.value)?.id ?? "";
                return (
                  <FormItem>
                    <FormLabel>{t("dialog.dueDate")}</FormLabel>
                    <ChoiceChips<string>
                      label={t("dialog.dueDate")}
                      value={active}
                      onChange={(id) => field.onChange(presets.find((p) => p.id === id)?.key ?? "")}
                      items={DUE_PRESETS.map((p) => ({ value: p.id, label: t(`dialog.duePresets.${p.id}`) }))}
                    />
                    <div className="flex items-center gap-1">
                      <div className="min-w-0 flex-1">
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t("dialog.noDueDate")}
                        />
                      </div>
                      {field.value ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("dialog.clearDate")}
                          onClick={() => field.onChange("")}
                        >
                          <X />
                        </Button>
                      ) : null}
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dialog.client")}</FormLabel>
                  <FormControl>
                    <SearchSelect
                      value={field.value}
                      onChange={field.onChange}
                      disabled={fixedClient}
                      options={clientOptions.map((c) => ({ value: c.id, label: c.name }))}
                      labels={{
                        placeholder: t("dialog.noClient"),
                        search: t("dialog.searchClient"),
                        none: t("dialog.noClient"),
                        empty: tCommon("noMatch"),
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("dialog.descriptionLabel")}{" "}
                    <span className="text-muted-foreground font-normal">
                      · {tCommon("optional")}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder={t("dialog.descriptionPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:justify-between">
              {task ? (
                <ConfirmDialog
                  title={t("dialog.deleteTitle")}
                  description={t("dialog.deleteDescription", { title: task.title })}
                  onConfirm={onDelete}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 /> {tCommon("delete")}
                    </Button>
                  }
                />
              ) : (
                <span />
              )}
              <div className="flex gap-2">
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
