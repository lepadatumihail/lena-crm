"use client";

import Link from "next/link";

import { ClientAvatar } from "@/components/clients/client-avatar";
import { clientFullName } from "@/lib/crm";
import type { TaskClientRef } from "@/lib/data/tasks";
import { cn } from "@/lib/utils";

/** The link sits inside a clickable row and a draggable card: keep its events to itself. */
const stop = (e: React.SyntheticEvent) => e.stopPropagation();

/** The client a task is about, linking to their page. */
export function ClientChip({ client, className }: { client: TaskClientRef; className?: string }) {
  const name = clientFullName(client);
  return (
    <Link
      href={`/clients/${client.id}`}
      onClick={stop}
      onPointerDown={stop}
      onMouseDown={stop}
      onTouchStart={stop}
      className={cn(
        "text-muted-foreground hover:text-foreground inline-flex min-w-0 items-center gap-1.5 rounded-md text-xs transition-colors duration-150",
        className
      )}
    >
      <ClientAvatar name={name} side={client.side} size="sm" />
      <span className="truncate">{name}</span>
    </Link>
  );
}
