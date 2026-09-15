import type { ReactNode } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ShellProvider } from "@/components/shell/shell-context";
import {
  reduceTasks,
  useTaskActions,
} from "@/components/tasks/use-task-actions";
import { messagesFor } from "@/i18n/messages";
import { setTaskPriority, setTaskStatus } from "@/lib/actions/tasks";
import type { TaskRow } from "@/lib/data/tasks";

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
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider
    locale="en"
    messages={messagesFor("en")}
    timeZone="UTC"
  >
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

function task(overrides: Partial<TaskRow> = {}): TaskRow {
  return {
    id: "8a1f5c2e-3b4d-4e6f-9a0b-1c2d3e4f5a6b",
    agent_id: "5d6e7f80-9a1b-4c2d-8e3f-4a5b6c7d8e9f",
    client_id: null,
    title: "Call back about the viewing",
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

describe("reduceTasks", () => {
  it("updates and removes without mutating the input", () => {
    const a = task();
    const b = task({
      id: "c7d8e9f0-1a2b-4c3d-8e4f-5a6b7c8d9e0f",
      title: "Chase the nota simple",
    });
    const state = [a, b];
    const snapshot = structuredClone(state);

    const updated = reduceTasks(state, {
      type: "update",
      id: a.id,
      changes: { priority: "high" },
    });
    expect(updated).not.toBe(state);
    expect(updated[0]).toEqual({ ...a, priority: "high" });
    expect(updated[1]).toBe(b);

    const removed = reduceTasks(state, { type: "remove", id: a.id });
    expect(removed).toEqual([b]);

    expect(state).toEqual(snapshot);
    expect(state[0]).toBe(a);
  });
});

describe("useTaskActions", () => {
  it("Undo restores the status the task had before it was completed", async () => {
    const row = task({ status: "in_progress" });
    const { result } = renderHook(
      () => useTaskActions({ rows: [row], apply: vi.fn() }),
      {
        wrapper,
      },
    );

    act(() => result.current.changeStatus(row.id, "done"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(setTaskStatus).toHaveBeenNthCalledWith(1, row.id, "done");

    const options = vi.mocked(toast.success).mock.calls[0][1] as {
      action: { label: string; onClick: () => void };
    };
    expect(options.action.label).toBe("Undo");

    // The toast's closure still sees `rows` with the old status; Undo must not
    // look it up again or it would see nothing to change.
    act(() => options.action.onClick());
    await waitFor(() =>
      expect(setTaskStatus).toHaveBeenNthCalledWith(2, row.id, "in_progress"),
    );
    await waitFor(() => expect(nav.refresh).toHaveBeenCalledTimes(2));
    expect(toast.success).toHaveBeenLastCalledWith("Task reopened");
  });

  it("a failed status change shows an error with no Undo and no refresh", async () => {
    vi.mocked(setTaskStatus).mockResolvedValueOnce({ error: "boom" });
    const row = task();
    const { result } = renderHook(
      () => useTaskActions({ rows: [row], apply: vi.fn() }),
      { wrapper },
    );

    act(() => result.current.changeStatus(row.id, "done"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't update status", {
        description: "boom",
      }),
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(nav.refresh).not.toHaveBeenCalled();
  });

  it("a failed priority change shows an error and does not refresh", async () => {
    vi.mocked(setTaskPriority).mockResolvedValueOnce({ error: "boom" });
    const row = task();
    const { result } = renderHook(
      () => useTaskActions({ rows: [row], apply: vi.fn() }),
      { wrapper },
    );

    act(() => result.current.changePriority(row.id, "urgent"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't update priority", {
        description: "boom",
      }),
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(nav.refresh).not.toHaveBeenCalled();
  });
});
