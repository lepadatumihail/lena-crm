"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatDistanceToNowStrict } from "date-fns";
import { NotebookPen } from "lucide-react";

import { CHANNEL_ICONS } from "@/components/clients/contact-log";
import { buttonVariants } from "@/components/ui/button";
import { dateFnsLocale } from "@/i18n/dates";
import type { LatestActivity } from "@/lib/data/clients";
import { cn } from "@/lib/utils";
import { whatsappGreeting, whatsappLink } from "@/lib/whatsapp";

/** The channels a list row can open in one tap. */
export type RowChannel = "whatsapp" | "call" | "email";

/** What the icons need to know about the client. */
type Reachable = {
  first_name: string;
  phone: string | null;
  email: string | null;
  language: string | null;
};

/**
 * The line under a client's name: how they were last reached, the first line
 * of what it was about, and when ("WhatsApp · Hi Sofia, I found two villas…
 * · 2 days ago"). A note shows the same way. Only the text truncates, so the
 * channel and the time always show.
 */
export function LatestActivityLine({
  activity,
  className,
}: {
  activity: LatestActivity | null;
  className?: string;
}) {
  const t = useTranslations("clients.latest");
  const locale = useLocale();

  if (!activity) {
    return (
      <span className={cn("text-muted-foreground/80 block truncate", className)}>
        {t("none")}
      </span>
    );
  }

  const channel = activity.channel ?? "other";
  const Icon = activity.kind === "note" ? NotebookPen : CHANNEL_ICONS[channel];
  return (
    <span className={cn("text-muted-foreground flex min-w-0 items-center gap-1.5", className)}>
      <Icon aria-hidden className="size-3.5 shrink-0" strokeWidth={1.75} />
      <span className="shrink-0">
        {activity.kind === "note" ? t("note") : t(`channels.${channel}`)}
      </span>
      {activity.preview ? (
        <>
          <span aria-hidden>·</span>
          <span className="text-foreground/75 min-w-0 truncate" title={activity.preview}>
            {activity.preview}
          </span>
        </>
      ) : null}
      <span aria-hidden>·</span>
      <time dateTime={activity.occurred_at} className="shrink-0 whitespace-nowrap">
        {formatDistanceToNowStrict(new Date(activity.occurred_at), {
          addSuffix: true,
          locale: dateFnsLocale(locale),
        })}
      </time>
    </span>
  );
}

/** Where each channel opens, or null when the client can't be reached that way. */
function channelHref(client: Reachable, channel: RowChannel): string | null {
  if (channel === "whatsapp") {
    return whatsappLink(client.phone, whatsappGreeting(client.first_name, client.language));
  }
  if (channel === "call") {
    const phone = client.phone?.replace(/\s+/g, "");
    return phone ? `tel:${phone}` : null;
  }
  const email = client.email?.trim();
  return email ? `mailto:${email}` : null;
}

const ROW_CHANNELS = ["whatsapp", "call", "email"] as const satisfies readonly RowChannel[];

/**
 * One-tap WhatsApp, Call and Email on a list row. Each opens the
 * conversation and reports it through `onContact`, which logs the contact
 * and asks for the next step. A click never reaches the row, which opens the
 * quick view. `single` shows one icon for a phone row: WhatsApp, else Call.
 */
export function ContactIcons({
  client,
  onContact,
  single = false,
  className,
}: {
  client: Reachable;
  onContact: (channel: RowChannel) => void;
  single?: boolean;
  className?: string;
}) {
  const t = useTranslations("clients.reach");
  const links = ROW_CHANNELS.map((channel) => ({ channel, href: channelHref(client, channel) }));
  const shown = single
    ? links.filter((l) => l.channel !== "email" && l.href).slice(0, 1)
    : links;
  if (!shown.some((l) => l.href)) return null;

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {shown.map(({ channel, href }) => {
        // A missing channel keeps its slot, so the icons line up down a table.
        if (!href) return <span key={channel} aria-hidden className="size-7 shrink-0" />;
        const Icon = CHANNEL_ICONS[channel];
        const label = t(channel, { name: client.first_name });
        return (
          <a
            key={channel}
            href={href}
            {...(channel === "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            aria-label={label}
            title={label}
            onClick={(event) => {
              event.stopPropagation();
              onContact(channel);
            }}
            className={cn(
              buttonVariants({ variant: "ghost", size: single ? "icon" : "icon-xs" }),
              "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon strokeWidth={1.75} className={single ? "size-[18px]" : undefined} />
          </a>
        );
      })}
    </div>
  );
}
