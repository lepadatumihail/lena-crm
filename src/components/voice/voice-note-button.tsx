"use client";

import { useTranslations } from "next-intl";
import { Mic } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useVoiceNoteControls } from "./voice-note-provider";

/** "Voice note" on a client's page: the note belongs to this client. Hidden while voice notes are off. */
export function VoiceNoteButton({
  clientId,
  clientName,
  className,
}: {
  clientId: string;
  clientName: string;
  className?: string;
}) {
  const t = useTranslations("voice");
  const voice = useVoiceNoteControls();
  if (!voice) return null;
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      className={className}
      onClick={() => voice.open({ clientId, clientName })}
    >
      <Mic />
      {t("button")}
    </Button>
  );
}
