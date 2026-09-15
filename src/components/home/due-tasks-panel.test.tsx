import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DueTasksPanel } from "@/components/home/due-tasks-panel";
import { ShellProvider } from "@/components/shell/shell-context";
import { messagesFor } from "@/i18n/messages";
import { setTaskStatus } from "@/lib/actions/tasks";
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

function dueTask(n: number): TaskRow {
  const hex = n.toString(16).padStart(2, "0");
  return {
    id: `a1b2c3${hex}-4d5e-4f60-8a1b-2c3d4e5f6a7b`,
    agent_id: "5d6e7f80-9a1b-4c2d-8e3f-4a5b6c7d8e9f",
    client_id: null,
    title: `Due task ${n}`,
    description: null,
    status: "todo",
    priority: "none",
    // The first one is overdue, the rest are due today.
    due_on: n === 1 ? "2026-09-14" : TODAY,
    completed_at: null,
    created_at: "2026-09-10T08:00:00.000Z",
    updated_at: "2026-09-10T08:00:00.000Z",
    client: null,
  };
}

/** The count in the Panel header (its last span), never any other "8" on the page. */
function headerCount(): string | null | undefined {
  const heading = screen.getByRole("heading", { name: /^Due today/ });
  return heading.querySelector("span:last-child")?.textContent;
}

describe("DueTasksPanel", () => {
  it("keeps the header in step with the sidebar total", async () => {
    const six = [1, 2, 3, 4, 5, 6].map(dueTask);
    const { rerender } = render(<DueTasksPanel tasks={six} total={8} todayKey={TODAY} />, {
      wrapper,
    });
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(headerCount()).toBe("8");

    let settle!: (value: { error: null }) => void;
    vi.mocked(setTaskStatus).mockReturnValueOnce(
      new Promise((resolve) => {
        settle = resolve;
      })
    );
    fireEvent.click(screen.getByRole("button", { name: `Mark “${six[0].title}” as done` }));

    // Optimistic and still pending: no await before these checks.
    expect(setTaskStatus).toHaveBeenCalledWith(six[0].id, "done");
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(headerCount()).toBe("7");

    // What the refresh would deliver: limit 6, one fewer due task in total.
    rerender(<DueTasksPanel tasks={[...six.slice(1), dueTask(7)]} total={7} todayKey={TODAY} />);
    await act(async () => settle({ error: null }));

    expect(nav.refresh).toHaveBeenCalled();
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getByText("Due task 7")).toBeTruthy();
    expect(screen.queryByText("Due task 1")).toBeNull();
    expect(headerCount()).toBe("7");
  });
});
