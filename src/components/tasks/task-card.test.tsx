import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ShellProvider } from "@/components/shell/shell-context";
import { CardBody } from "@/components/tasks/task-card";
import { messagesFor } from "@/i18n/messages";
import type { TaskRow } from "@/lib/data/tasks";

const nav = vi.hoisted(() => ({ search: "", refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: nav.refresh, replace: nav.replace, push: nav.push }),
  useSearchParams: () => new URLSearchParams(nav.search),
  usePathname: () => "/tasks",
}));
vi.mock("@/lib/actions/tasks", () => ({
  createTask: vi.fn().mockResolvedValue({ error: null, id: "3f2c8b0e-5a1d-4c2b-9e7f-1a2b3c4d5e6f" }),
  updateTask: vi.fn().mockResolvedValue({ error: null }),
  deleteTask: vi.fn().mockResolvedValue({ error: null }),
  setTaskStatus: vi.fn().mockResolvedValue({ error: null }),
  setTaskPriority: vi.fn().mockResolvedValue({ error: null }),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messagesFor("en")} timeZone="UTC">
    <ShellProvider timeZone="UTC">{children}</ShellProvider>
  </NextIntlClientProvider>
);

beforeEach(() => {
  nav.search = "";
});

// Vitest runs without globals, so Testing Library's automatic cleanup is off.
afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});

const TODAY = "2026-09-15";

const doneTask: TaskRow = {
  id: "8a1f5c2e-3b4d-4e6f-9a0b-1c2d3e4f5a6b",
  agent_id: "5d6e7f80-9a1b-4c2d-8e3f-4a5b6c7d8e9f",
  client_id: null,
  title: "Send the reservation contract",
  description: null,
  status: "done",
  priority: "medium",
  due_on: "2026-09-10",
  completed_at: "2026-09-15T09:00:00.000Z",
  created_at: "2026-09-01T08:00:00.000Z",
  updated_at: "2026-09-15T09:00:00.000Z",
  client: null,
};

describe("CardBody", () => {
  it("never shows a due chip on a done card", () => {
    render(<CardBody task={doneTask} todayKey={TODAY} onPriorityChange={vi.fn()} />, { wrapper });
    expect(screen.getByText("Send the reservation contract")).toBeTruthy();
    expect(screen.queryByText(/Overdue since/)).toBeNull();
  });

  it("shows the overdue chip on the same task while it is open", () => {
    render(
      <CardBody
        task={{ ...doneTask, status: "todo", completed_at: null }}
        todayKey={TODAY}
        onPriorityChange={vi.fn()}
      />,
      { wrapper }
    );
    expect(screen.getByText(/Overdue since 10 Sep/)).toBeTruthy();
  });

  it("closes with the day the task was created", () => {
    render(<CardBody task={doneTask} todayKey={TODAY} onPriorityChange={vi.fn()} />, { wrapper });
    expect(screen.getByText("Created 1 Sep")).toBeTruthy();
  });

  it("adds the year to a creation day from another year", () => {
    render(
      <CardBody
        task={{ ...doneTask, created_at: "2025-12-12T08:00:00.000Z" }}
        todayKey={TODAY}
        onPriorityChange={vi.fn()}
      />,
      { wrapper }
    );
    expect(screen.getByText("Created 12 Dec 2025")).toBeTruthy();
  });
});
