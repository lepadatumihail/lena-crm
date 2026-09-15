import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useTaskSheet } from "@/components/tasks/use-task-sheet";
import type { TaskRow } from "@/lib/data/tasks";

// Vitest runs without globals, so Testing Library's automatic cleanup is off.
afterEach(() => {
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

function setup(rows: TaskRow[]) {
  const changeStatus = vi.fn();
  const changePriority = vi.fn();
  const hook = renderHook(
    (props: { rows: TaskRow[] }) =>
      useTaskSheet({ rows: props.rows, changeStatus, changePriority }),
    { initialProps: { rows } },
  );
  return { ...hook, changeStatus, changePriority };
}

describe("useTaskSheet", () => {
  it("follows the task's live copy and keeps the last one after it leaves the rows", () => {
    const row = task();
    const { result, rerender } = setup([row]);

    act(() => result.current.show(row));
    expect(result.current.open).toBe(true);
    expect(result.current.task).toEqual(row);

    const done = {
      ...row,
      status: "done" as const,
      completed_at: "2026-09-15T09:00:00.000Z",
    };
    rerender({ rows: [done] });
    expect(result.current.task).toEqual(done);

    // The client panel drops a done task; the drawer still shows it, as done.
    rerender({ rows: [] });
    expect(result.current.task).toEqual(done);
  });

  it("changes a task outside the rows through the drawer's own copy", () => {
    const row = task({
      status: "done",
      completed_at: "2026-09-15T09:00:00.000Z",
    });
    const { result, rerender, changeStatus, changePriority } = setup([row]);
    act(() => result.current.show(row));
    rerender({ rows: [] });

    act(() => result.current.changeStatus(row.id, "todo"));
    expect(changeStatus).toHaveBeenCalledWith(row.id, "todo", "done");
    expect(result.current.task).toMatchObject({
      status: "todo",
      completed_at: null,
    });

    act(() => result.current.changePriority(row.id, "urgent"));
    expect(changePriority).toHaveBeenCalledWith(row.id, "urgent", "none");
    expect(result.current.task?.priority).toBe("urgent");
  });

  it("leaves a task that is still in the rows to their optimistic copy", () => {
    const row = task();
    const { result, changePriority } = setup([row]);
    act(() => result.current.show(row));

    act(() => result.current.changePriority(row.id, "high"));
    expect(changePriority).toHaveBeenCalledWith(row.id, "high", "none");
    // The parent's optimistic update is mocked away, so the rows and the drawer stay put.
    expect(result.current.task?.priority).toBe("none");
  });
});
