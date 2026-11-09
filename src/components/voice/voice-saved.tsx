"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, MessageCircle, Mic } from "lucide-react";

import { Button } from "@/components/ui/button";
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
      <p className="text-sm">
        {t("saved.summary", { count: result.clients.length })}
        {result.looseTasks ? <> {t("saved.looseTasks", { count: result.looseTasks })}</> : null}
      </p>
      {result.clients.length ? (
        <ul className="flex flex-col gap-2">
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
    <li className="flex flex-col gap-2 rounded-xl border p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="min-w-0 truncate font-medium">
          {client.name}
          {client.isNew ? <span className="text-muted-foreground text-sm font-normal"> · {t("newClient")}</span> : null}
        </p>
        <Link href={`/clients/${client.id}`} className="text-sm underline-offset-4 hover:underline">
          {t("open")}
        </Link>
      </div>
      {parts.length ? <p className="text-muted-foreground text-sm">{parts.join(" · ")}</p> : null}
      {client.errors.map((error, i) => (
        <p key={i} className="text-destructive text-xs">
          {error}
        </p>
      ))}
      {client.phone && whatsappLink(client.phone) ? (
        link ? (
          <Button asChild size="sm" className="self-start">
            <a href={link} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> {t("sendWhatsApp")}
            </a>
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" className="self-start" onClick={draft} disabled={drafting}>
            {drafting ? <Loader2 className="animate-spin" /> : <MessageCircle />}
            {drafting ? t("drafting") : t("draft")}
          </Button>
        )
      ) : null}
    </li>
  );
}
