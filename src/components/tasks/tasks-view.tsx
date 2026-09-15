"use client";

import { useEffect, useMemo, useOptimistic, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ListChecks, Plus, Search } from "lucide-react";

import { FilterSelect, ToolbarTabs, ViewToggle } from "@/components/shell/toolbar";
import { Panel, PanelEmpty } from "@/components/shell/panel";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { DoneList, TaskList } from "@/components/tasks/task-list";
import { TaskSheet } from "@/components/tasks/task-sheet";
import { reduceTasks, useTaskActions } from "@/components/tasks/use-task-actions";
import { useTaskSheet } from "@/components/tasks/use-task-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { taskPriorityLabel } from "@/i18n/labels";
import { clientFullName } from "@/lib/crm";
import type { CalendarClientOption } from "@/lib/data/calendar";
import type { DoneTasksPage, TaskRow } from "@/lib/data/tasks";
import {
  BOARD_DONE_LIMIT,
  compareTasks,
  DONE_PAGE_SIZE,
  groupTasksByStatus,
  isOpenStatus,
  OPEN_TASK_STATUSES,
  sortDoneTasks,
  TASK_PRIORITIES,
} from "@/lib/tasks";
import {
  TASKS_VIEW_COOKIE,
  TASKS_VIEW_COOKIE_MAX_AGE,
  tasksSearch,
  type TasksClientScope,
  type TasksTab,
  type TasksViewKind,
} from "@/lib/tasks-view";
import { TONE_SOLID } from "@/lib/tones";

function rememberView(view: TasksViewKind) {
  document.cookie = `${TASKS_VIEW_COOKIE}=${view}; path=/; max-age=${TASKS_VIEW_COOKIE_MAX_AGE}; samesite=lax`;
}

/** First copy of each id wins: a task can sit in both lists for one render after a change. */
function dedupeById(rows: TaskRow[]): TaskRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

/** Urgent first, the way the priority menu lists them. */
const PRIORITY_ORDER = [...TASK_PRIORITIES].reverse();

/**
 * The /tasks screen: Open and Done tabs, search and filters, list or board.
 * The tab, the client scope and the loaded Done range live in the URL; the
 * server answers a change of scope or range with the whole range.
 */
export function TasksView(props: {
  open: TaskRow[];
  /** The first `doneLimit` done tasks for the current client scope (server-scoped). */
  done: DoneTasksPage;
  clients: CalendarClientOption[];
  view: TasksViewKind;
  /** From the URL: a client id, "none", or null. The Done rows are already scoped to it. */
  clientScope: TasksClientScope;
  /** `?task=<id>` resolved on the server, so a task outside the loaded rows can still open. */
  focusTask: TaskRow | null;
  /** Today in the agent's zone, from the server; nothing here reads the clock during render. */
  todayKey: string;
}) {
  const t = useTranslations("tasks");
  const tCrm = useTranslations("crm");
  const router = useRouter();
  const pathname = usePathname();
  const go = (search: string) =>
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });

  // The tab lives only in the URL: a mirrored copy would go stale on a soft
  // navigation that lands on this same mounted view.
  const searchParams = useSearchParams();
  const tab: TasksTab = searchParams.get("tab") === "done" ? "done" : "open";
  const [navigating, startNavigation] = useTransition(); // client filter
  const [loadingMore, startLoadMore] = useTransition(); // Load more

  const [clientFilter, setClientFilterOptimistic] = useOptimistic(props.clientScope);
  const [view, setView] = useState<TasksViewKind>(props.view);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const base = useMemo(
    () => dedupeById([...props.open, ...props.done.rows]),
    [props.open, props.done.rows]
  );
  const [rows, applyOptimistic] = useOptimistic(base, reduceTasks);
  const { changeStatus, changePriority, removeLocally } = useTaskActions({
    rows,
    apply: applyOptimistic,
  });
  // The drawer a task opens in, from a row, a card or ?task=.
  const sheet = useTaskSheet({ rows, changeStatus, changePriority });

  function changeTab(next: TasksTab) {
    if (navigating || loadingMore) {
      // A router.replace is in flight. window.location still holds the old URL, and
      // Next turns a replaceState into ACTION_RESTORE built from it, which would
      // cancel that navigation. Re-issue the pending target with the new tab instead.
      go(
        tasksSearch({
          tab: next,
          clientId: clientFilter, // optimistic value = the pending target
          doneLimit: loadingMore ? props.done.rows.length + DONE_PAGE_SIZE : undefined,
        })
      );
      return;
    }
    // Edit the live URL so client= and done= survive; do not rebuild it with tasksSearch here.
    const url = new URL(window.location.href);
    if (next === "done") url.searchParams.set("tab", "done");
    else url.searchParams.delete("tab");
    window.history.replaceState(null, "", url.toString());
  }

  function changeClientFilter(value: string) {
    const next: TasksClientScope = value === "all" ? null : value;
    startNavigation(() => {
      setClientFilterOptimistic(next);
      go(tasksSearch({ tab, clientId: next }));
    });
  }

  function loadMore() {
    startLoadMore(() =>
      go(
        tasksSearch({
          tab: "done",
          clientId: clientFilter,
          doneLimit: props.done.rows.length + DONE_PAGE_SIZE,
        })
      )
    );
  }

  function changeView(next: TasksViewKind) {
    setView(next);
    rememberView(next);
  }

  // New task dialog: the client preset stays put while it animates closed.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createClientId, setCreateClientId] = useState<string | undefined>(undefined);
  const presetClient = clientFilter && clientFilter !== "none" ? clientFilter : undefined;
  const findTask = (id: string) =>
    rows.find((r) => r.id === id) ?? (props.focusTask?.id === id ? props.focusTask : null);

  function openCreate() {
    setCreateClientId(presetClient);
    setDialogOpen(true);
  }
  function openTask(id: string) {
    const task = findTask(id);
    if (task) sheet.show(task);
  }

  // URL intents (?new=1 from ⌘K, ?task=<id> from the bell or Home), adopted
  // when the raw values change. React's derived-state pattern, no effect.
  const intentNew = searchParams.get("new") === "1";
  const intentTask = searchParams.get("task");
  const [seenIntent, setSeenIntent] = useState<{ isNew: boolean; taskId: string | null }>({
    isNew: false,
    taskId: null,
  });
  if (intentNew !== seenIntent.isNew || intentTask !== seenIntent.taskId) {
    setSeenIntent({ isNew: intentNew, taskId: intentTask });
    if (intentNew) {
      setCreateClientId(presetClient);
      setDialogOpen(true);
    } else if (intentTask) {
      const task = findTask(intentTask);
      if (task) sheet.show(task);
    }
  }

  // The intents are one-shot: take them off the URL so refresh or Back doesn't
  // replay them. This effect only touches history, never React state.
  // Deferred a task: on a hard load, child effects run before the app router's
  // own effect patches history.replaceState, and an unpatched call would leave
  // useSearchParams holding the stale intent, so a later ⌘K "New task" on this
  // page would look unchanged and never reopen the dialog.
  useEffect(() => {
    if (!intentNew && !intentTask) return;
    const timer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("new");
      url.searchParams.delete("task");
      window.history.replaceState(null, "", url.toString());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [intentNew, intentTask]);

  // Inactive clients referenced by a loaded task still get a name in the filter.
  const clientOptions = useMemo(() => {
    const options = [...props.clients];
    const known = new Set(options.map((c) => c.id));
    for (const row of [...base, ...(props.focusTask ? [props.focusTask] : [])]) {
      if (row.client && !known.has(row.client.id)) {
        known.add(row.client.id);
        options.push({ id: row.client.id, name: clientFullName(row.client), side: row.client.side });
      }
    }
    return options;
  }, [props.clients, base, props.focusTask]);

  const filtersActive = search.trim() !== "" || clientFilter !== null || priorityFilter !== "all";
  const q = search.trim().toLowerCase();

  function matches(row: TaskRow, open: boolean): boolean {
    if (priorityFilter !== "all" && row.priority !== priorityFilter) return false;
    // Done rows are already scoped to the client on the server.
    if (open && clientFilter !== null) {
      if (clientFilter === "none" ? row.client_id != null : row.client_id !== clientFilter) return false;
    }
    if (!q) return true;
    return [row.title, row.description, row.client ? clientFullName(row.client) : null]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  }

  const openRows = rows.filter((row) => isOpenStatus(row.status));
  const doneRows = sortDoneTasks(rows.filter((row) => !isOpenStatus(row.status)));
  const openCount = openRows.length;
  const doneCount = doneRows.length;
  const openVisible = openRows.filter((row) => matches(row, true));
  const doneVisible = doneRows.filter((row) => matches(row, false));
  const byStatus = groupTasksByStatus(openVisible);
  const groups = OPEN_TASK_STATUSES.map((status) => ({
    status,
    tasks: [...byStatus[status]].sort(compareTasks),
  }));

  const itemHandlers = {
    onOpen: openTask,
    onStatusChange: changeStatus,
    onPriorityChange: changePriority,
  };

  const clientSelectOptions = [
    { value: "all", label: t("filters.allClients") },
    { value: "none", label: t("filters.noClient") },
    ...clientOptions.map((c) => ({ value: c.id, label: c.name })),
  ];
  const priorityOptions = [
    { value: "all", label: t("filters.allPriorities") },
    ...PRIORITY_ORDER.map((p) => ({ value: p, label: taskPriorityLabel(tCrm, p) })),
  ];

  const newButton = (
    <Button size="sm" className="rounded-full" onClick={openCreate}>
      <Plus /> {t("new")}
    </Button>
  );

  let body: ReactNode;
  if (tab === "done") {
    const doneListProps = {
      todayKey: props.todayKey,
      hasMore: props.done.hasMore,
      loadingMore,
      onLoadMore: loadMore,
      ...itemHandlers,
    };
    if (doneCount === 0 && !props.done.hasMore && !filtersActive) {
      body = <DoneList rows={[]} emptyMessage={t("empty.done")} {...doneListProps} />;
    } else if (doneVisible.length === 0) {
      body = <DoneList rows={[]} emptyMessage={t("empty.noMatches")} {...doneListProps} />;
    } else {
      body = <DoneList rows={doneVisible} emptyMessage={null} {...doneListProps} />;
    }
  } else if (openCount === 0 && doneCount === 0 && !props.done.hasMore && clientFilter === null) {
    body = <EmptyState action={newButton} />;
  } else {
    const board = (
      <TaskBoard
        open={openVisible}
        done={doneVisible.slice(0, BOARD_DONE_LIMIT)}
        doneCount={doneVisible.length}
        doneHasMore={props.done.hasMore}
        todayKey={props.todayKey}
        onViewAllDone={() => changeTab("done")}
        {...itemHandlers}
      />
    );
    if (openCount === 0) {
      const allDone = (
        <Panel>
          <PanelEmpty className="py-16">{t("empty.allDone")}</PanelEmpty>
        </Panel>
      );
      body =
        view === "board" ? (
          <div className="space-y-4">
            {allDone}
            {board}
          </div>
        ) : (
          allDone
        );
    } else if (view === "list" && openVisible.length === 0) {
      body = (
        <Panel>
          <PanelEmpty className="py-16">{t("empty.noMatches")}</PanelEmpty>
        </Panel>
      );
    } else if (view === "list") {
      body = <TaskList groups={groups} todayKey={props.todayKey} {...itemHandlers} />;
    } else {
      body = board;
    }
  }

  return (
    <div className="space-y-4">
      <ToolbarTabs
        label={t("tabs.label")}
        value={tab}
        onChange={(value) => changeTab(value === "done" ? "done" : "open")}
        tabs={[
          { value: "open", label: t("tabs.open"), count: openCount },
          { value: "done", label: t("tabs.done"), dot: TONE_SOLID.green },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            strokeWidth={1.75}
          />
          <Input
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 md:text-[13px]"
          />
        </div>

        <FilterSelect
          label={t("filters.client")}
          value={clientFilter ?? "all"}
          onValueChange={changeClientFilter}
          options={clientSelectOptions}
        />

        <FilterSelect
          label={t("filters.priority")}
          value={priorityFilter}
          onValueChange={setPriorityFilter}
          options={priorityOptions}
        />

        <div className="ml-auto flex items-center gap-2">
          {tab === "open" ? (
            <ViewToggle
              view={view === "board" ? "kanban" : "table"}
              onChange={(next) => changeView(next === "kanban" ? "board" : "list")}
              tableLabel={t("views.list")}
              boardLabel={t("views.board")}
            />
          ) : null}
          {newButton}
        </div>
      </div>

      {body}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payload={{ mode: "create", clientId: createClientId }}
        clients={clientOptions}
      />

      <TaskSheet
        task={sheet.task}
        open={sheet.open}
        onOpenChange={sheet.setOpen}
        todayKey={props.todayKey}
        clients={clientOptions}
        onStatusChange={sheet.changeStatus}
        onPriorityChange={sheet.changePriority}
        onDeleted={removeLocally}
      />
    </div>
  );
}

function EmptyState({ action }: { action: ReactNode }) {
  const t = useTranslations("tasks.empty");
  return (
    <div className="bg-card flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <div className="bg-muted text-muted-foreground mb-3 flex size-12 items-center justify-center rounded-full">
        <ListChecks className="size-6" strokeWidth={1.5} />
      </div>
      <h3 className="font-medium">{t("title")}</h3>
      <p className="text-muted-foreground mt-1 max-w-xs text-sm">{t("body")}</p>
      <div className="mt-4">{action}</div>
    </div>
  );
}
