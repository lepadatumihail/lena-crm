import { describe, expect, it } from "vitest";

import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/tasks";
import {
  TASK_DESCRIPTION_MAX,
  TASK_TITLE_MAX,
  taskFormSchema,
  taskInputSchema,
  toTaskInput,
  type TaskFormValues,
} from "./task";

const schema = taskFormSchema((key) => key);
const CLIENT_ID = "3f2c8b0e-5a1d-4c2b-9e7f-1a2b3c4d5e6f";

const form: TaskFormValues = {
  title: "Send the floor plans",
  description: "",
  status: "todo",
  priority: "none",
  client_id: "",
  due_on: "",
};

function parse(overrides: Record<string, unknown>) {
  return schema.safeParse({ ...form, ...overrides });
}

function firstMessage(overrides: Record<string, unknown>) {
  const result = parse(overrides);
  return result.success ? null : result.error.issues[0]?.message;
}

describe("taskFormSchema", () => {
  it("accepts the minimal form", () => {
    expect(parse({}).success).toBe(true);
  });

  it("rejects a blank title", () => {
    expect(firstMessage({ title: "   " })).toBe("titleRequired");
  });

  it("caps the title", () => {
    expect(parse({ title: "a".repeat(TASK_TITLE_MAX) }).success).toBe(true);
    expect(firstMessage({ title: "a".repeat(TASK_TITLE_MAX + 1) })).toBe("titleTooLong");
  });

  it("caps the description", () => {
    expect(parse({ description: "a".repeat(TASK_DESCRIPTION_MAX) }).success).toBe(true);
    expect(firstMessage({ description: "a".repeat(TASK_DESCRIPTION_MAX + 1) })).toBe(
      "descriptionTooLong"
    );
  });

  it("accepts every status and priority", () => {
    for (const status of TASK_STATUSES) expect(parse({ status }).success).toBe(true);
    for (const priority of TASK_PRIORITIES) expect(parse({ priority }).success).toBe(true);
  });

  it("rejects an unknown status or priority", () => {
    expect(parse({ status: "archived" }).success).toBe(false);
    expect(parse({ priority: "critical" }).success).toBe(false);
  });

  it.each([
    ["", true],
    [CLIENT_ID, true],
    ["abc", false],
  ])("client_id %j -> success=%s", (client_id, ok) => {
    expect(parse({ client_id }).success).toBe(ok);
  });

  it.each([
    ["", true],
    ["2026-09-15", true],
    ["2028-02-29", true],
    ["2026-02-29", false],
    ["2026-9-5", false],
    ["2026-09-15T10:00", false],
  ])("due_on %j -> success=%s", (due_on, ok) => {
    expect(parse({ due_on }).success).toBe(ok);
  });
});

describe("taskInputSchema", () => {
  const input = {
    title: "Chase the bank",
    description: null,
    status: "todo",
    priority: "none",
    client_id: null,
    due_on: null,
  };

  it("accepts nulls", () => {
    expect(taskInputSchema.safeParse(input).success).toBe(true);
  });

  it("rejects blanks for client and due date", () => {
    expect(taskInputSchema.safeParse({ ...input, client_id: "" }).success).toBe(false);
    expect(taskInputSchema.safeParse({ ...input, due_on: "" }).success).toBe(false);
  });

  it("rejects a blank title", () => {
    expect(taskInputSchema.safeParse({ ...input, title: "  " }).success).toBe(false);
  });

  it("trims the title", () => {
    const result = taskInputSchema.safeParse({ ...input, title: "  Chase the bank  " });
    expect(result.success && result.data.title).toBe("Chase the bank");
  });

  it("stores a blank description as null", () => {
    expect(taskInputSchema.parse({ ...input, description: "   " }).description).toBeNull();
    expect(taskInputSchema.parse({ ...input, description: " Note " }).description).toBe("Note");
  });
});

describe("toTaskInput", () => {
  it("turns blanks into nulls and trims text", () => {
    expect(toTaskInput({ ...form, title: "  Call  ", description: "   " })).toEqual({
      title: "Call",
      description: null,
      status: "todo",
      priority: "none",
      client_id: null,
      due_on: null,
    });
  });

  it("keeps filled values, and its output passes taskInputSchema", () => {
    const out = toTaskInput({
      ...form,
      description: "  Ask about the valuation  ",
      status: "waiting",
      priority: "urgent",
      client_id: CLIENT_ID,
      due_on: "2026-09-15",
    });
    expect(out).toEqual({
      title: "Send the floor plans",
      description: "Ask about the valuation",
      status: "waiting",
      priority: "urgent",
      client_id: CLIENT_ID,
      due_on: "2026-09-15",
    });
    expect(taskInputSchema.safeParse(out).success).toBe(true);
    expect(taskInputSchema.safeParse(toTaskInput(form)).success).toBe(true);
  });
});
