"use client";

import { Mic } from "lucide-react";

import { openNewInPlace } from "@/components/shell/new-actions";
import { useVoiceNotes } from "@/components/shell/shell-context";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

/** "Voice note" in a New menu rendered on the server; hidden while voice notes are off. */
export function VoiceNoteMenuItem({ label }: { label: string }) {
  const enabled = useVoiceNotes();
  if (!enabled) return null;
  return (
    <DropdownMenuItem onSelect={() => openNewInPlace("voice-note")}>
      <Mic strokeWidth={1.75} />
      {label}
    </DropdownMenuItem>
  );
}
