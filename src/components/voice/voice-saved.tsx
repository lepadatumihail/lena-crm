"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, Check, Loader2, Mic } from "lucide-react";

import { ClientAvatar } from "@/components/clients/client-avatar";
import { WhatsAppIcon } from "@/components/clients/whatsapp-button";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { draftMessage } from "@/lib/actions/messages";
import type { VoiceApplyResult, VoiceSavedClient } from "@/lib/actions/voice";
import { whatsappLink } from "@/lib/whatsapp";

export function VoiceSaved({
  result,
  followUps,
  onRecordAnother,
  onClose,
}: {
  result: VoiceApplyResult;
  followUps: (string | null)[];
  onRecordAnother: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("voice");
  return (
    <div className="flex flex-col gap-4">
      {/* As the voice-note film ends: a tick, what was saved, then a card per client. */}
      <p className="flex items-start gap-2.5 text-sm">
        <span
          aria-hidden
          className="bg-tone-indigo-soft text-tone-indigo-ink mt-px flex size-5 shrink-0 items-center justify-center rounded-full"
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
        <span className="text-pretty">
          <span className="font-medium">{t("saved.summary", { count: result.clients.length })}</span>
          {result.looseTasks ? <> {t("saved.looseTasks", { count: result.looseTasks })}</> : null}
        </span>
      </p>
      {result.clients.length ? (
        <ul className="flex flex-col gap-3">
          {result.clients.map((client) => (
            <SavedClient key={client.id} client={client} followUp={followUps[client.index] ?? null} />
          ))}
        </ul>
      ) : null}
      {result.failed.map((f) => (
        <p key={f.index} role="alert" className="text-destructive text-sm">
          {t("saved.failedCard", { error: f.error })}
        </p>
      ))}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onClose}>
          {t("close")}
        </Button>
        <Button type="button" variant="outline" onClick={onRecordAnother}>
          <Mic /> {t("recordAnother")}
        </Button>
      </div>
    </div>
  );
}

function SavedClient({ client, followUp }: { client: VoiceSavedClient; followUp: string | null }) {
  const t = useTranslations("voice.saved");
  const tReview = useTranslations("voice.review");
  const [drafting, setDrafting] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  const parts = [
    client.saved.timeline && t("parts.timeline"),
    client.saved.viewing && t("parts.viewing"),
    client.saved.preferences && t("parts.preferences"),
    client.saved.stage && t("parts.stage"),
    client.saved.tasks > 0 && t("parts.tasks", { count: client.saved.tasks }),
    client.saved.appointment && t("parts.appointment"),
  ].filter(Boolean);

  async function draft() {
    setDrafting(true);
    const res = await draftMessage({
      clientId: client.id,
      channel: "whatsapp",
      instruction: followUp ?? undefined,
    });
    setDrafting(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setLink(whatsappLink(client.phone, res.body));
  }

  return (
    <li className="bg-card flex flex-col gap-3 rounded-2xl border p-3.5 shadow-xs">
      <div className="flex items-start gap-3">
        <ClientAvatar name={client.name} side="buyer" size="md" />
        <div className="min-w-0 flex-1">
          <p className="flex min-h-8 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-[15px] font-medium">{client.name}</span>
            {client.isNew ? <Tag tone="indigo">{tReview("newClient")}</Tag> : null}
          </p>
          {parts.length ? (
            <p className="text-muted-foreground text-[13px] leading-snug">{parts.join(" · ")}</p>
          ) : null}
        </div>
        <Link
          href={`/clients/${client.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex min-h-8 shrink-0 items-center gap-1 text-[13px] transition-colors duration-150"
        >
          {t("open")} <ArrowRight className="size-3.5" />
        </Link>
      </div>
      {client.errors.map((error, i) => (
        <p key={i} className="text-destructive pl-11 text-xs">
          {error}
        </p>
      ))}
      {client.phone && whatsappLink(client.phone) ? (
        link ? (
          <Button asChild size="sm" className="ml-11 self-start">
            <a href={link} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="text-primary-foreground" /> {t("sendWhatsApp")}
            </a>
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" className="ml-11 self-start" onClick={draft} disabled={drafting}>
            {drafting ? <Loader2 className="animate-spin" /> : <WhatsAppIcon />}
            {drafting ? t("drafting") : t("draft")}
          </Button>
        )
      ) : null}
    </li>
  );
}
