"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { ClientSide } from "@/lib/crm";
import { DEFAULT_TIME_ZONE } from "@/lib/time-zones";

/** What a record page tells the shell: which list it belongs to and its name. */
export type ShellCrumbValue = { side: ClientSide; label: string };

type ShellContextValue = {
  crumb: ShellCrumbValue | null;
  setCrumb: (crumb: ShellCrumbValue | null) => void;
  agentId: string | null;
  agentFirstName: string | null;
  timeZone: string;
};

const ShellContext = createContext<ShellContextValue | null>(null);

/**
 * Shared by the app shell and the pages inside it. Down: the signed-in
 * agent's id, first name and time zone, which the layout already reads, so a page
 * can greet them and date things without waiting on a query. Up: a record
 * page reports which list it belongs to, since a client record URL carries
 * no side.
 */
export function ShellProvider({
  agentId = null,
  agentFirstName = null,
  timeZone = DEFAULT_TIME_ZONE,
  children,
}: {
  /** The signed-in agent's user id, for per-agent browser state on a shared device. */
  agentId?: string | null;
  agentFirstName?: string | null;
  /** The agent's IANA time zone, from their settings. */
  timeZone?: string;
  children: ReactNode;
}) {
  const [crumb, setCrumb] = useState<ShellCrumbValue | null>(null);
  const value = useMemo(
    () => ({ crumb, setCrumb, agentId, agentFirstName, timeZone }),
    [crumb, agentId, agentFirstName, timeZone]
  );
  return <ShellContext value={value}>{children}</ShellContext>;
}

export function useShellCrumb(): ShellCrumbValue | null {
  return useContext(ShellContext)?.crumb ?? null;
}

/** The signed-in agent's user id; null outside the signed-in shell. */
export function useAgentId(): string | null {
  return useContext(ShellContext)?.agentId ?? null;
}

/** The signed-in agent's first name, or null when neither name nor email gives one. */
export function useAgentFirstName(): string | null {
  return useContext(ShellContext)?.agentFirstName ?? null;
}

/** The IANA zone the agent's day runs in, from their settings. */
export function useAgentTimeZone(): string {
  return useContext(ShellContext)?.timeZone ?? DEFAULT_TIME_ZONE;
}

/**
 * Rendered by a record page. Set in a layout effect so a client-side
 * navigation paints the breadcrumb in the same frame as the page.
 */
export function ShellCrumb({ side, label }: ShellCrumbValue) {
  const setCrumb = useContext(ShellContext)?.setCrumb;
  useLayoutEffect(() => {
    if (!setCrumb) return;
    setCrumb({ side, label });
    return () => setCrumb(null);
  }, [setCrumb, side, label]);
  return null;
}
