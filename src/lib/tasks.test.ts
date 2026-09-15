import { describe, expect, it } from "vitest";

import {
  compareTasks,
  dueState,
  groupTasksByStatus,
  isOpenStatus,
  OPEN_TASK_STATUSES,
  PRIORITY_RANK,
  sortDoneTasks,
  TASK_PRIORITIES,
  TASK_PRIORITY_TONES,
  TASK_STATUSES,
  TASK_STATUS_TONES,
  type TaskOrder,
} from "./tasks";

describe("task vocabularies", () => {
  it("ranks priorities in the enum's declaration order", () => {
    TASK_PRIORITIES.forEach((priority, index) => {
      expect(PRIORITY_RANK[priority]).toBe(index);
    });
    expect(Object.keys(PRIORITY_RANK)).toHaveLength(TASK_PRIORITIES.length);
  });

  it("gives every status and priority a tone", () => {
    for (const status of TASK_STATUSES) expect(TASK_STATUS_TONES[status]).toBeTruthy();
    for (const priority of TASK_PRIORITIES) {
      expect(TASK_PRIORITY_TONES[priority]).toBeTruthy();
    }
  });

  it("treats everything but done as open", () => {
    expect([...OPEN_TASK_STATUSES]).toEqual(TASK_STATUSES.filter((s) => s !== "done"));
    expect(isOpenStatus("todo")).toBe(true);
    expect(isOpenStatus("in_progress")).toBe(true);
    expect(isOpenStatus("waiting")).toBe(true);
    expect(isOpenStatus("done")).toBe(false);
  });
});

describe("dueState", () => {
  const today = "2026-09-15";

  it.each([
    [null, "none"],
    ["2025-12-31", "overdue"],
    ["2026-09-14", "overdue"],
    ["2026-09-15", "today"],
    ["2026-09-16", "tomorrow"],
    ["2026-09-17", "upcoming"],
    ["2026-10-01", "upcoming"],
  ] as const)("%j against %s -> %s", (dueOn, state) => {
    expect(dueState(dueOn, today)).toBe(state);
  });

  it("crosses a month boundary", () => {
    expect(dueState("2026-10-01", "2026-09-30")).toBe("tomorrow");
  });

  it("throws on a malformed key", () => {
    expect(() => dueState("2026-9-15", today)).toThrow();
  });
});

describe("compareTasks", () => {
  const base: TaskOrder = {
    priority: "none",
    due_on: null,
    created_at: "2026-09-01T10:00:00.000Z",
  };

  it("puts higher priority first", () => {
    const urgent = { ...base, priority: "urgent" as const };
    const low = { ...base, priority: "low" as const, due_on: "2026-01-01" };
    expect(compareTasks(urgent, low)).toBeLessThan(0);
    expect(compareTasks(low, urgent)).toBeGreaterThan(0);
  });

  it("puts the nearer due date first", () => {
    const soon = { ...base, due_on: "2026-09-15" };
    const later = { ...base, due_on: "2026-09-20" };
    expect(compareTasks(soon, later)).toBeLessThan(0);
    expect(compareTasks(later, soon)).toBeGreaterThan(0);
  });

  it("puts undated tasks last in both argument orders", () => {
    const dated = { ...base, due_on: "2030-01-01" };
    expect(compareTasks(base, dated)).toBeGreaterThan(0);
    expect(compareTasks(dated, base)).toBeLessThan(0);
  });

  it("puts the older task first", () => {
    const older = { ...base, created_at: "2026-08-01T10:00:00.000Z" };
    expect(compareTasks(older, base)).toBeLessThan(0);
    expect(compareTasks(base, older)).toBeGreaterThan(0);
  });

  it("returns 0 for identical keys", () => {
    expect(compareTasks(base, { ...base })).toBe(0);
  });

  it("sorts a mixed list the way the database orders it", () => {
    const rows = [
      { id: "a", priority: "none", due_on: null, created_at: "2026-09-01T00:00:00Z" },
      { id: "b", priority: "high", due_on: null, created_at: "2026-09-01T00:00:00Z" },
      { id: "c", priority: "high", due_on: "2026-09-20", created_at: "2026-09-02T00:00:00Z" },
      { id: "d", priority: "urgent", due_on: "2026-12-01", created_at: "2026-09-03T00:00:00Z" },
      { id: "e", priority: "high", due_on: "2026-09-20", created_at: "2026-09-01T00:00:00Z" },
      { id: "f", priority: "none", due_on: "2026-09-10", created_at: "2026-09-05T00:00:00Z" },
      { id: "g", priority: "high", due_on: "2026-09-16", created_at: "2026-09-09T00:00:00Z" },
    ] as const satisfies readonly (TaskOrder & { id: string })[];
    // priority desc, due_on asc nulls last, created_at asc
    expect([...rows].sort(compareTasks).map((r) => r.id)).toEqual([
      "d",
      "g",
      "e",
      "c",
      "b",
      "f",
      "a",
    ]);
  });
});

describe("sortDoneTasks", () => {
  it("puts the newest completed first, id breaking ties, without mutating", () => {
    const rows = [
      { id: "a", completed_at: "2026-09-10T10:00:00.000Z" },
      { id: "c", completed_at: "2026-09-12T10:00:00.000Z" },
      { id: "b", completed_at: "2026-09-12T10:00:00.000Z" },
      { id: "d", completed_at: "2026-09-11T10:00:00.000Z" },
    ];
    const snapshot = rows.map((r) => r.id);
    expect(sortDoneTasks(rows).map((r) => r.id)).toEqual(["c", "b", "d", "a"]);
    expect(rows.map((r) => r.id)).toEqual(snapshot);
  });
});

describe("groupTasksByStatus", () => {
  it("keeps every status key in order and the row order within each", () => {
    const rows = [
      { id: "1", status: "waiting" as const },
      { id: "2", status: "todo" as const },
      { id: "3", status: "waiting" as const },
      { id: "4", status: "done" as const },
    ];
    const groups = groupTasksByStatus(rows);
    expect(Object.keys(groups)).toEqual([...TASK_STATUSES]);
    expect(groups.todo.map((r) => r.id)).toEqual(["2"]);
    expect(groups.in_progress).toEqual([]);
    expect(groups.waiting.map((r) => r.id)).toEqual(["1", "3"]);
    expect(groups.done.map((r) => r.id)).toEqual(["4"]);
  });

  it("gives four empty arrays for no rows", () => {
    expect(groupTasksByStatus([])).toEqual({
      todo: [],
      in_progress: [],
      waiting: [],
      done: [],
    });
  });
});
