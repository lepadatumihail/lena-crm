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

/** What a record page tells the shell: which list it belongs to and its name. */
export type ShellCrumbValue = { side: ClientSide; label: string };

type ShellContextValue = {
  crumb: ShellCrumbValue | null;
  setCrumb: (crumb: ShellCrumbValue | null) => void;
  agentFirstName: string | null;
};

const ShellContext = createContext<ShellContextValue | null>(null);

/**
 * Shared by the app shell and the pages inside it. Down: the signed-in
 * agent's first name, which the layout already reads, so a page can greet
 * them without waiting on a query. Up: a record page reports which list it
 * belongs to, since a client record URL carries no side.
 */
export function ShellProvider({
  agentFirstName = null,
  children,
}: {
  agentFirstName?: string | null;
  children: ReactNode;
}) {
  const [crumb, setCrumb] = useState<ShellCrumbValue | null>(null);
  const value = useMemo(
    () => ({ crumb, setCrumb, agentFirstName }),
    [crumb, agentFirstName]
  );
  return <ShellContext value={value}>{children}</ShellContext>;
}

export function useShellCrumb(): ShellCrumbValue | null {
  return useContext(ShellContext)?.crumb ?? null;
}

/** The signed-in agent's first name, or null when neither name nor email gives one. */
export function useAgentFirstName(): string | null {
  return useContext(ShellContext)?.agentFirstName ?? null;
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
