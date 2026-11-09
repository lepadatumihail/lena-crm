import {
  Building2,
  CalendarPlus,
  ClipboardPaste,
  ListPlus,
  Mic,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { tasksHref } from "@/lib/tasks-view";

/** A way to add something new. The phone's + sheet, ⌘K and Home's New menu list the same ones. */
export type NewAction = {
  id: "voice-note" | "new-buyer" | "new-seller" | "paste-lead" | "new-task" | "new-appointment";
  href: string;
  /** Its label, a key in the `nav` messages. */
  labelKey:
    | "mobile.voiceNote"
    | "quickSearch.newBuyer"
    | "quickSearch.newSeller"
    | "mobile.pasteLead"
    | "quickSearch.newTask"
    | "quickSearch.newAppointment";
  icon: LucideIcon;
};

/** Fired by the "Voice note" action; the voice-note provider opens its sheet in place (plan 026). */
export const VOICE_NOTE_EVENT = "lw:voice-note";

export const NEW_ACTIONS: readonly NewAction[] = [
  { id: "voice-note", href: "#voice-note", labelKey: "mobile.voiceNote", icon: Mic },
  { id: "new-buyer", href: "/clients/new?side=buyer", labelKey: "quickSearch.newBuyer", icon: UserPlus },
  { id: "new-seller", href: "/clients/new?side=seller", labelKey: "quickSearch.newSeller", icon: Building2 },
  { id: "paste-lead", href: "/clients/new?side=buyer&paste=1", labelKey: "mobile.pasteLead", icon: ClipboardPaste },
  { id: "new-task", href: tasksHref({ openNew: true }), labelKey: "quickSearch.newTask", icon: ListPlus },
  { id: "new-appointment", href: "/calendar?new=1", labelKey: "quickSearch.newAppointment", icon: CalendarPlus },
];

/** The actions this agent sees: "Voice note" only while voice notes are switched on for them. */
export function newActionsFor(opts: { voiceNotes: boolean }): readonly NewAction[] {
  return opts.voiceNotes ? NEW_ACTIONS : NEW_ACTIONS.filter((action) => action.id !== "voice-note");
}

/** The page that opens each in-place action from `?new=1`. */
const IN_PLACE: Partial<Record<NewAction["id"], string>> = {
  "new-task": "/tasks",
  "new-appointment": "/calendar",
};

/**
 * "New task" on /tasks or "New appointment" on /calendar: add the intent to
 * the URL in place rather than navigating, so the tab, the filters, the view
 * and the date survive. Next syncs replaceState into useSearchParams; the
 * view opens its dialog and strips the param again. Returns whether it
 * handled the action.
 */
export function openNewInPlace(id: string): boolean {
  if (id === "voice-note") {
    // the voice-note sheet opens over whatever page the agent is on
    window.dispatchEvent(new CustomEvent(VOICE_NOTE_EVENT));
    return true;
  }
  const page = IN_PLACE[id as NewAction["id"]];
  if (!page || window.location.pathname !== page) return false;
  const url = new URL(window.location.href);
  url.searchParams.set("new", "1");
  window.history.replaceState(null, "", url.toString());
  return true;
}
