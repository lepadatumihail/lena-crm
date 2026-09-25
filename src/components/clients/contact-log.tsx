"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Check,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Users,
  type LucideIcon,
} from "lucide-react";

import { WhatsAppButton } from "@/components/clients/whatsapp-button";
import { useAgentTimeZone } from "@/components/shell/shell-context";
import { dayLabel } from "@/components/tasks/day-label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChoiceChips } from "@/components/ui/choice-chips";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { stageLabel } from "@/i18n/labels";
import {
  CONTACT_CHANNELS,
  DEFAULT_NEXT_STEP,
  NEXT_STEPS,
  nextStepDueOn,
  stageAfterContact,
  type NextStep,
} from "@/lib/activity";
import { deleteActivity, logContact } from "@/lib/actions/activity";
import { updateClientStage } from "@/lib/actions/clients";
import { createTask } from "@/lib/actions/tasks";
import { dateKeyInTimeZone } from "@/lib/home";
import { announceNotificationsChanged } from "@/lib/notifications";
import type { ContactChannel } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { ACTIVITY_BODY_MAX } from "@/lib/validation/activity";
import { TASK_TITLE_MAX } from "@/lib/validation/task";
import { whatsappLink } from "@/lib/whatsapp";

/** The client a contact is logged against. */
export type ContactTarget = {
  id: string;
  firstName: string;
  side: string;
  stage: string;
};

/** A contact that was logged the moment the agent started it (a send, a call). */
type Logged = { id: string; channel: ContactChannel };

export const CHANNEL_ICONS: Record<ContactChannel, LucideIcon> = {
  whatsapp: MessageCircle,
  call: Phone,
  email: Mail,
  meeting: Users,
  other: MoreHorizontal,
};

/**
 * Logs a contact and asks for the next step in one go: how the agent reached
 * the client and what about, when to follow up (a task), and for a buyer
 * who is still New, the move to Contacted. After a send or a call the
 * contact is already logged (`logged`), so the dialog only asks for the next
 * step and offers Undo in case the message never went out.
 */
export function LogContactDialog({
  client,
  open,
  onOpenChange,
  logged = null,
  defaultChannel,
}: {
  client: ContactTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logged?: Logged | null;
  defaultChannel?: ContactChannel;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Content unmounts when the dialog closes, so every open starts fresh. */}
        <LogContactForm
          client={client}
          logged={logged}
          defaultChannel={defaultChannel}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function LogContactForm({
  client,
  logged,
  defaultChannel,
  onDone,
}: {
  client: ContactTarget;
  logged: Logged | null;
  defaultChannel?: ContactChannel;
  onDone: () => void;
}) {
  const t = useTranslations("clientDetail.contactLog");
  const tCrm = useTranslations("crm");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const timeZone = useAgentTimeZone();
  const [pending, startTransition] = useTransition();
  const defaultTitle = t("taskTitleDefault", { name: client.firstName });
  const moveTarget = stageAfterContact(client.side, client.stage);

  const [channel, setChannel] = useState<ContactChannel>(defaultChannel ?? "whatsapp");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<NextStep>(DEFAULT_NEXT_STEP);
  const [title, setTitle] = useState(defaultTitle);
  const [move, setMove] = useState(moveTarget != null);

  function save() {
    startTransition(async () => {
      if (!logged) {
        const res = await logContact({ clientId: client.id, channel, body: note });
        if (res.error) {
          toast.error(t("toasts.failed"), { description: res.error });
          return;
        }
      }
      const todayKey = dateKeyInTimeZone(new Date().toISOString(), timeZone);
      const dueOn = nextStepDueOn(step, todayKey);
      let taskFailed = false;
      if (dueOn) {
        const res = await createTask({
          title: title.trim() || defaultTitle,
          description: null,
          status: "todo",
          priority: "none",
          client_id: client.id,
          due_on: dueOn,
        });
        if (res.error) {
          taskFailed = true;
          toast.error(t("toasts.taskFailed"), { description: res.error });
        } else {
          // Let the bell pick up the new task's due date now.
          announceNotificationsChanged();
        }
      }
      if (moveTarget && move) {
        const res = await updateClientStage(client.id, moveTarget);
        if (res.error) toast.error(res.error);
      }
      if (!taskFailed) {
        const date = dueOn ? dayLabel(dueOn, todayKey, locale) : null;
        if (logged) {
          if (date) toast.success(t("toasts.taskOnly", { date }));
        } else {
          toast.success(date ? t("toasts.savedWithTask", { date }) : t("toasts.saved"));
        }
      }
      onDone();
    });
  }

  function undo() {
    if (!logged) return;
    startTransition(async () => {
      const res = await deleteActivity(logged.id);
      if (res.error) {
        toast.error(t("toasts.undoFailed"), { description: res.error });
        return;
      }
      toast.success(t("toasts.undone"));
      onDone();
    });
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <DialogHeader>
        <DialogTitle>
          {logged
            ? t("loggedTitle", { channel: logged.channel, name: client.firstName })
            : t("title", { name: client.firstName })}
        </DialogTitle>
        <DialogDescription>
          {logged
            ? t("loggedDescription", { name: client.firstName })
            : t("description", { name: client.firstName })}
        </DialogDescription>
      </DialogHeader>

      {logged ? null : (
        <>
          <div className="grid gap-2">
            <Label>{t("channelLabel")}</Label>
            <ChoiceChips
              label={t("channelLabel")}
              value={channel}
              onChange={setChannel}
              items={CONTACT_CHANNELS.map((c) => {
                const Icon = CHANNEL_ICONS[c];
                return { value: c, label: t(`channels.${c}`), icon: <Icon /> };
              })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-note">{t("note")}</Label>
            <Textarea
              id="contact-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t("notePlaceholder")}
              maxLength={ACTIVITY_BODY_MAX}
              rows={2}
              className="resize-none"
            />
          </div>
        </>
      )}

      <div className="grid gap-2">
        <Label>{t("nextStep")}</Label>
        <ChoiceChips
          label={t("nextStep")}
          value={step}
          onChange={setStep}
          items={NEXT_STEPS.map((s) => ({ value: s, label: t(`steps.${s}`) }))}
        />
        {step !== "none" ? (
          <Input
            aria-label={t("taskTitle")}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={TASK_TITLE_MAX}
            className="mt-1"
          />
        ) : null}
      </div>

      {moveTarget ? (
        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox checked={move} onCheckedChange={(v) => setMove(v === true)} />
          {t("moveTo", { stage: stageLabel(tCrm, moveTarget) })}
        </label>
      ) : null}

      <DialogFooter className="items-center gap-2 sm:justify-between">
        {logged ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-auto px-0"
            disabled={pending}
            onClick={undo}
          >
            {t("undo")}
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={onDone}>
            {logged ? t("skip") : tCommon("cancel")}
          </Button>
          {/* Focus starts here, so Enter keeps the defaults: the common case. */}
          <Button type="submit" disabled={pending} autoFocus>
            <Check /> {t("save")}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

/**
 * Contact logging with one next-step dialog for any client: `logStarted`
 * logs a message or call the agent just started and opens the dialog;
 * `openLog` opens it to log a contact that happened elsewhere. A list keeps
 * one of these above its rows, because a row can leave the list the moment
 * its client is contacted (Needs follow-up), and the dialog must outlive it.
 * Render `dialog` once.
 */
export function useContactLogger() {
  const t = useTranslations("clientDetail.contactLog");
  const [state, setState] = useState<{
    open: boolean;
    client: ContactTarget | null;
    logged: Logged | null;
    channel?: ContactChannel;
  }>({ open: false, client: null, logged: null });

  async function logStarted(client: ContactTarget, channel: ContactChannel, body?: string) {
    const res = await logContact({ clientId: client.id, channel, body });
    if (res.error || !res.id) {
      toast.error(t("toasts.failed"), { description: res.error ?? undefined });
      return;
    }
    setState({ open: true, client, logged: { id: res.id, channel } });
  }

  function openLog(client: ContactTarget, channel?: ContactChannel) {
    setState({ open: true, client, logged: null, channel });
  }

  // The client stays set while the dialog closes, so it animates out whole.
  const dialog = state.client ? (
    <LogContactDialog
      client={state.client}
      open={state.open}
      onOpenChange={(open) => setState((s) => ({ ...s, open }))}
      logged={state.logged}
      defaultChannel={state.channel}
    />
  ) : null;

  return { logStarted, openLog, dialog };
}

/** Contact logging for one client; see useContactLogger. Render `dialog` once. */
export function useContactLog(client: ContactTarget) {
  const log = useContactLogger();
  return {
    logStarted: (channel: ContactChannel, body?: string) =>
      log.logStarted(client, channel, body),
    openLog: (channel?: ContactChannel) => log.openLog(client, channel),
    dialog: log.dialog,
  };
}

/** "Log contact": for a call from the agent's own phone, a chat at a viewing. */
export function LogContactButton({
  client,
  variant = "outline",
  size = "sm",
  iconOnly = false,
  className,
  labelClassName,
  children,
}: {
  client: ContactTarget;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "xs" | "icon-sm" | "icon-xs";
  iconOnly?: boolean;
  className?: string;
  /** E.g. "max-sm:sr-only" to show just the icon on a phone. */
  labelClassName?: string;
  children?: ReactNode;
}) {
  const t = useTranslations("clientDetail.contactLog");
  const { openLog, dialog } = useContactLog(client);
  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => openLog()}
        aria-label={iconOnly ? t("trigger") : undefined}
        title={iconOnly ? t("trigger") : undefined}
      >
        <Check />
        {iconOnly ? null : <span className={labelClassName}>{children ?? t("trigger")}</span>}
      </Button>
      {dialog}
    </>
  );
}

/**
 * WhatsApp and Call side by side. Both open the conversation as before and
 * log it, then ask for the next step.
 */
export function ContactButtons({
  client,
  phone,
  language,
  className,
}: {
  client: ContactTarget;
  phone: string | null;
  language: string | null;
  className?: string;
}) {
  const t = useTranslations("clientDetail.page");
  const { logStarted, dialog } = useContactLog(client);
  if (!phone) return null;
  const tel = `tel:${phone.replace(/\s+/g, "")}`;
  return (
    <div className={cn("grid gap-2", whatsappLink(phone) ? "grid-cols-2" : "grid-cols-1", className)}>
      <WhatsAppButton
        phone={phone}
        firstName={client.firstName}
        language={language}
        size="sm"
        className="w-full"
        short
        onOpen={() => void logStarted("whatsapp")}
      />
      <Button asChild variant="outline" size="sm" className="w-full">
        <a href={tel} onClick={() => void logStarted("call")}>
          <Phone /> {t("call")}
        </a>
      </Button>
      {dialog}
    </div>
  );
}
