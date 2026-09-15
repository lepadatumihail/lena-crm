import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { TasksView } from "@/components/tasks/tasks-view";
import { Notice } from "@/components/ui/notice";
import { clientFullName } from "@/lib/crm";
import { getCalendarFormData } from "@/lib/data/calendar";
import { getClientById } from "@/lib/data/clients";
import { getAgentTimeZone } from "@/lib/data/session";
import { getDoneTasks, getOpenTasks, getTaskById } from "@/lib/data/tasks";
import { dateKeyInTimeZone } from "@/lib/home";
import { resolveTasksRequest, TASKS_VIEW_COOKIE } from "@/lib/tasks-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tasks");
  return { title: t("meta.title") };
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; client?: string; task?: string; done?: string }>;
}) {
  const [query, cookieStore, timeZone] = await Promise.all([searchParams, cookies(), getAgentTimeZone()]);
  const request = resolveTasksRequest(query, cookieStore.get(TASKS_VIEW_COOKIE)?.value);
  const now = new Date();
  const todayKey = dateKeyInTimeZone(now.toISOString(), timeZone);

  const [open, formData, focusTask] = await Promise.all([
    getOpenTasks(),
    getCalendarFormData(),
    request.taskId ? getTaskById(request.taskId) : Promise.resolve(null),
  ]);

  // A client filter from a link may point at an inactive client (not in the picker list)
  // or at nothing at all (deleted or not the agent's). Keep the first, drop the second.
  let clients = formData.clients;
  let clientScope = request.clientId;
  if (clientScope && clientScope !== "none" && !clients.some((c) => c.id === clientScope)) {
    const client = await getClientById(clientScope);
    if (client) clients = [...clients, { id: client.id, name: clientFullName(client), side: client.side }];
    else clientScope = null;
  }

  const done = await getDoneTasks({ limit: request.doneLimit, clientId: clientScope });

  // Deployed before the migration: say so instead of crashing the page.
  if (open === null || done === null) {
    const t = await getTranslations("tasks");
    return <Notice tone="amber">{t("notReady")}</Notice>;
  }

  return (
    <TasksView
      open={open}
      done={done}
      clients={clients}
      view={request.view}
      clientScope={clientScope}
      focusTask={focusTask}
      todayKey={todayKey}
    />
  );
}
