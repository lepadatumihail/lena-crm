import type { ReactNode } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ShellProvider } from "@/components/shell/shell-context";
import { TasksView } from "@/components/tasks/tasks-view";
import { messagesFor } from "@/i18n/messages";
import { setTaskPriority, setTaskStatus } from "@/lib/actions/tasks";
import type { CalendarClientOption } from "@/lib/data/calendar";
import type { DoneTasksPage, TaskRow } from "@/lib/data/tasks";
import type { TasksClientScope } from "@/lib/tasks-view";

const nav = vi.hoisted(() => ({
  search: "",
  refresh: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: nav.refresh,
    replace: nav.replace,
    push: nav.push,
  }),
  useSearchParams: () => new URLSearchParams(nav.search),
  usePathname: () => "/tasks",
}));
vi.mock("@/lib/actions/tasks", () => ({
  createTask: vi
    .fn()
    .mockResolvedValue({
      error: null,
      id: "3f2c8b0e-5a1d-4c2b-9e7f-1a2b3c4d5e6f",
    }),
  updateTask: vi.fn().mockResolvedValue({ error: null }),
  deleteTask: vi.fn().mockResolvedValue({ error: null }),
  setTaskStatus: vi.fn().mockResolvedValue({ error: null }),
  setTaskPriority: vi.fn().mockResolvedValue({ error: null }),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider
    locale="en"
    messages={messagesFor("en")}
    timeZone="UTC"
  >
    <ShellProvider timeZone="UTC">{children}</ShellProvider>
  </NextIntlClientProvider>
);

// Radix menus and dialogs reach for browser APIs jsdom does not have.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

beforeEach(() => {
  nav.search = "";
});

// Vitest runs without globals, so Testing Library's automatic cleanup is off.
afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});

const TODAY = "2026-09-15";
const CLIENT_ID = "b3c4d5e6-f7a8-4b9c-8d0e-1f2a3b4c5d6e";
const clients: CalendarClientOption[] = [
  { id: CLIENT_ID, name: "Ana García", side: "buyer" },
];

let seq = 0;
function task(overrides: Partial<TaskRow> = {}): TaskRow {
  seq += 1;
  const hex = seq.toString(16).padStart(4, "0");
  return {
    id: `e1f2${hex}-a3b4-4c5d-9e6f-7a8b9c0d1e2f`,
    agent_id: "5d6e7f80-9a1b-4c2d-8e3f-4a5b6c7d8e9f",
    client_id: null,
    title: `Task ${seq}`,
    description: null,
    status: "todo",
    priority: "none",
    due_on: null,
    completed_at: null,
    created_at: "2026-09-10T08:00:00.000Z",
    updated_at: "2026-09-10T08:00:00.000Z",
    client: null,
    ...overrides,
  };
}

function doneTask(overrides: Partial<TaskRow> = {}): TaskRow {
  return task({
    status: "done",
    completed_at: "2026-09-15T09:00:00.000Z",
    updated_at: "2026-09-15T09:00:00.000Z",
    ...overrides,
  });
}

function show({
  open = [],
  done = { rows: [], hasMore: false },
  clientScope = null,
}: {
  open?: TaskRow[];
  done?: DoneTasksPage;
  clientScope?: TasksClientScope;
}) {
  return render(
    <TasksView
      open={open}
      done={done}
      clients={clients}
      view="list"
      clientScope={clientScope}
      focusTask={null}
      todayKey={TODAY}
    />,
    { wrapper },
  );
}

describe("TasksView", () => {
  it("groups open tasks by status, most urgent first", () => {
    show({
      open: [
        task({ title: "Low priority call", priority: "low" }),
        task({
          title: "Urgent overdue deposit",
          priority: "urgent",
          due_on: "2026-09-14",
        }),
        task({ title: "Waiting on the bank", status: "in_progress" }),
      ],
    });

    const todo = screen.getByRole("heading", { name: "To do" });
    expect(screen.getByRole("heading", { name: "In progress" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Waiting" })).toBeNull();

    const items = within(todo.closest("section")!).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("Urgent overdue deposit")).toBeTruthy();
    expect(within(items[1]).getByText("Low priority call")).toBeTruthy();
    expect(screen.getByText("Overdue since 14 Sep")).toBeTruthy();
  });

  it("asks the server for one more page of done tasks", () => {
    nav.search = "tab=done";
    show({
      done: { rows: [doneTask({ title: "Sent the contract" })], hasMore: true },
    });

    expect(screen.getByRole("heading", { name: /^Today/ })).toBeTruthy();
    expect(screen.getByText("Sent the contract")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(nav.replace).toHaveBeenCalledTimes(1);
    const [href, options] = nav.replace.mock.calls[0];
    const url = new URL(href, "https://leadwing.test");
    expect(url.pathname).toBe("/tasks");
    expect(url.searchParams.get("tab")).toBe("done");
    expect(url.searchParams.get("done")).toBe("41");
    expect(options).toEqual({ scroll: false });
  });

  it("opens the new task dialog from ?new=1 with the title focused", async () => {
    nav.search = "new=1";
    show({ open: [task()] });

    const dialog = await screen.findByRole("dialog", { name: "New task" });
    const title = within(dialog).getByLabelText("Title");
    await waitFor(() => expect(document.activeElement).toBe(title));
  });

  it("says nothing is open when every task is done", () => {
    show({ done: { rows: [doneTask()], hasMore: false } });

    expect(screen.getByText("Nothing open. Everything is done.")).toBeTruthy();
    expect(screen.queryByText("No tasks match your filters.")).toBeNull();
    expect(screen.queryByText("No tasks yet")).toBeNull();
  });

  it("tells a search with no done matches apart from an empty Done tab", () => {
    nav.search = "tab=done";
    show({
      done: { rows: [doneTask({ title: "Sent the contract" })], hasMore: true },
    });

    fireEvent.change(screen.getByLabelText("Search tasks"), {
      target: { value: "zzz nothing" },
    });

    expect(screen.getByText("No tasks match your filters.")).toBeTruthy();
    expect(
      screen.queryByText("Nothing finished yet. Completed tasks land here."),
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Load more" })).toBeTruthy();
  });

  it("shows the server-scoped done rows for a client filter", () => {
    nav.search = `tab=done&client=${CLIENT_ID}`;
    show({
      clientScope: CLIENT_ID,
      done: {
        rows: [
          doneTask({
            title: "Booked Ana's viewing",
            client_id: CLIENT_ID,
            client: {
              id: CLIENT_ID,
              first_name: "Ana",
              last_name: "García",
              side: "buyer",
            },
          }),
        ],
        hasMore: true,
      },
    });

    expect(screen.getByText("Booked Ana's viewing")).toBeTruthy();
    expect(
      screen.queryByText("Nothing finished yet. Completed tasks land here."),
    ).toBeNull();
    expect(screen.getAllByText("Ana García").length).toBeGreaterThan(0);

    // The scope comes from props and rides along into the server range.
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(nav.replace).toHaveBeenCalledTimes(1);
    const url = new URL(nav.replace.mock.calls[0][0], "https://leadwing.test");
    expect(url.searchParams.get("client")).toBe(CLIENT_ID);
    expect(url.searchParams.get("tab")).toBe("done");
    expect(url.searchParams.get("done")).toBe("41");
  });

  it("changes the status from the row's menu without opening the task", async () => {
    const row = task({ title: "Confirm the notary", status: "todo" });
    show({ open: [row] });

    const trigger = screen.getByRole("button", { name: /change status/i });
    // A mouse click on the glyph must not reach the row and open the task.
    fireEvent.click(trigger);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "Done" }));

    expect(setTaskStatus).toHaveBeenCalledWith(row.id, "done");
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(nav.refresh).toHaveBeenCalled());
  });

  it("changes the priority from the row's menu without opening the task", async () => {
    const row = task({ title: "Chase the nota simple", priority: "low" });
    show({ open: [row] });

    const trigger = screen.getByRole("button", { name: /change priority/i });
    fireEvent.click(trigger);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.click(
      await screen.findByRole("menuitemradio", { name: "Urgent" }),
    );

    expect(setTaskPriority).toHaveBeenCalledWith(row.id, "urgent");
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(nav.refresh).toHaveBeenCalled());
  });
});
