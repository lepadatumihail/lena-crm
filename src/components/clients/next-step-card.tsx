"use client";

import { useOptimistic, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  Check,
  CircleAlert,
  CircleCheck,
  Clock,
  Hourglass,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

import {
  LogContactButton,
  useContactLog,
  type ContactTarget,
} from "@/components/clients/contact-log";
import { WhatsAppButton } from "@/components/clients/whatsapp-button";
import { reduceTasks, useTaskActions } from "@/components/tasks/use-task-actions";
import { Button } from "@/components/ui/button";
import type { TaskRow } from "@/lib/data/tasks";
import { TONE_INK } from "@/lib/tones";
import { cn } from "@/lib/utils";

/** A booked viewing or appointment, worded on the server in the agent's time zone. */
export type BookedEvent = { when: string; title: string; href: string };

/**
 * The one thing to do for this client now, most urgent first: an overdue
 * task, one due today, a viewing or meeting coming up, a lead nobody has
 * written to yet, a client gone quiet; otherwise a calm "all caught up".
 */
export type NextStep =
  | { kind: "task"; due: "overdue" | "today"; task: TaskRow; overdueDays: number; more: number }
  | { kind: "event"; event: BookedEvent }
  | { kind: "firstContact" }
  | { kind: "quiet"; days: number }
  | { kind: "clear"; lastContact: string | null; nextTask: string | null };

type CardTone = "red" | "amber" | "indigo" | "green";

/* The card takes the urgency's tone: a pale fill with a hairline of the same hue. */
const CARD_TONES: Record<CardTone, string> = {
  red: "bg-tone-red-soft/70 ring-tone-red/20",
  amber: "bg-tone-amber-soft/70 ring-tone-amber/35",
  indigo: "bg-tone-indigo-soft/70 ring-tone-indigo/20",
  green: "bg-tone-green-soft/60 ring-tone-green/20",
};

/**
 * The client page's focal point, at the top of the side column: what needs
 * doing, said in one line, with the button that does it. The tone carries
 * the urgency the same way tasks do (red overdue, amber today), and the
 * footer always says what is booked next, so the card answers "what now?"
 * and "what then?" together.
 */
export function NextStepCard({
  step,
  client,
  phone,
  language,
  booked,
}: {
  step: NextStep;
  client: ContactTarget;
  phone: string | null;
  language: string | null;
  /** What is booked next; the footer line, unless the card is about that event. */
  booked: BookedEvent | null;
}) {
  const t = useTranslations("clientDetail.nextStep");

  let tone: CardTone;
  let Icon: LucideIcon;
  let eyebrow: string;
  let title: string;
  let detail: string | null = null;
  let actions: ReactNode = null;

  switch (step.kind) {
    case "task":
      tone = step.due === "overdue" ? "red" : "amber";
      Icon = step.due === "overdue" ? CircleAlert : Clock;
      eyebrow = step.due === "overdue" ? t("overdue", { days: step.overdueDays }) : t("dueToday");
      title = step.task.title;
      detail = step.more > 0 ? t("moreTasks", { count: step.more }) : null;
      actions = <TaskActions task={step.task} client={client} phone={phone} language={language} />;
      break;
    case "event":
      tone = "indigo";
      Icon = CalendarDays;
      eyebrow = t("upcoming");
      title = step.event.when;
      detail = step.event.title;
      actions = (
        <Button asChild variant="outline" size="sm">
          <Link href={step.event.href}>
            <CalendarDays /> {t("openCalendar")}
          </Link>
        </Button>
      );
      break;
    case "firstContact":
    case "quiet":
      tone = "amber";
      Icon = step.kind === "quiet" ? Hourglass : MessageCircle;
      eyebrow = step.kind === "quiet" ? t("quiet", { days: step.days }) : t("firstContact");
      title =
        step.kind === "quiet"
          ? t("quietTitle", { name: client.firstName })
          : t("firstContactTitle", { name: client.firstName });
      actions = <ReachOut client={client} phone={phone} language={language} />;
      break;
    case "clear":
      tone = "green";
      Icon = CircleCheck;
      eyebrow = t("clear");
      title = step.nextTask ? t("nextTask", { title: step.nextTask }) : t("clearTitle");
      detail = step.lastContact ? t("lastContact", { when: step.lastContact }) : null;
      break;
  }

  const showBooked = step.kind !== "event";

  return (
    <section
      aria-label={t("label")}
      className={cn("rounded-xl px-4 pt-3.5 pb-4 ring-1 ring-inset", CARD_TONES[tone])}
    >
      <p className={cn("flex items-center gap-1.5 text-[13px] font-medium", TONE_INK[tone])}>
        <Icon className="size-4 shrink-0" strokeWidth={2} />
        {eyebrow}
      </p>
      <h3 className="font-display text-foreground mt-1.5 text-lg leading-snug tracking-[-0.02em] text-pretty break-words">
        {title}
      </h3>
      {detail ? <p className="text-muted-foreground mt-0.5 text-[13px]">{detail}</p> : null}
      {actions ? <div className="mt-3.5 flex flex-wrap gap-2">{actions}</div> : null}
      {showBooked ? (
        <p className="text-muted-foreground border-foreground/[0.07] mt-4 flex min-w-0 items-center gap-1.5 border-t pt-3 text-[13px]">
          <CalendarDays className="size-3.5 shrink-0" strokeWidth={1.75} />
          {booked ? (
            <Link
              href={booked.href}
              className="hover:text-foreground min-w-0 truncate transition-colors duration-150"
            >
              {t("booked", { when: booked.when })}
              <span className="text-muted-foreground/80"> · {booked.title}</span>
            </Link>
          ) : (
            <span className="truncate">{t("nothingBooked")}</span>
          )}
        </p>
      ) : null}
    </section>
  );
}

/** Mark the task done in place (with the usual Undo toast), or write to the client. */
function TaskActions({
  task,
  client,
  phone,
  language,
}: {
  task: TaskRow;
  client: ContactTarget;
  phone: string | null;
  language: string | null;
}) {
  const t = useTranslations("clientDetail.nextStep");
  const [rows, apply] = useOptimistic([task], reduceTasks);
  const { changeStatus } = useTaskActions({ rows, apply });
  const done = rows[0]?.status === "done";
  const { logStarted, dialog } = useContactLog(client);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={done}
        onClick={() => changeStatus(task.id, "done")}
      >
        <Check /> {t("done")}
      </Button>
      <WhatsAppButton
        phone={phone}
        firstName={client.firstName}
        language={language}
        size="sm"
        short
        onOpen={() => void logStarted("whatsapp")}
      />
      {dialog}
    </>
  );
}

/** WhatsApp when there is a number, and Log contact for a call or a chat in person. */
function ReachOut({
  client,
  phone,
  language,
}: {
  client: ContactTarget;
  phone: string | null;
  language: string | null;
}) {
  const { logStarted, dialog } = useContactLog(client);
  return (
    <>
      <WhatsAppButton
        phone={phone}
        firstName={client.firstName}
        language={language}
        size="sm"
        short
        onOpen={() => void logStarted("whatsapp")}
      />
      <LogContactButton client={client} />
      {dialog}
    </>
  );
}
