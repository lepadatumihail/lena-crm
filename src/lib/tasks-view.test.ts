import { describe, expect, it } from "vitest";

import { DEFAULT_TASKS_VIEW, isTasksView, resolveTasksRequest, tasksHref, tasksSearch } from "./tasks-view";

const clientId = "3f6c2a1e-8b4d-4c2e-9a7f-1d2e3f4a5b6c";
const taskId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

describe("resolveTasksRequest", () => {
  it("opens the open list for all clients by default", () => {
    expect(resolveTasksRequest({}, undefined)).toEqual({
      view: "list",
      tab: "open",
      clientId: null,
      taskId: null,
      doneLimit: 40,
    });
    expect(DEFAULT_TASKS_VIEW).toBe("list");
  });

  it("remembers the board", () => {
    expect(resolveTasksRequest({}, "board").view).toBe("board");
  });

  it("ignores a cookie it doesn't understand", () => {
    expect(resolveTasksRequest({}, "kanban").view).toBe("list");
    expect(isTasksView("kanban")).toBe(false);
  });

  it("reads the Done tab", () => {
    expect(resolveTasksRequest({ tab: "done" }, undefined).tab).toBe("done");
    expect(resolveTasksRequest({ tab: "archive" }, undefined).tab).toBe("open");
  });

  it("scopes to a client, or to tasks without one", () => {
    expect(resolveTasksRequest({ client: clientId }, undefined).clientId).toBe(clientId);
    expect(resolveTasksRequest({ client: "none" }, undefined).clientId).toBe("none");
  });

  it("drops a client or task that isn't a uuid", () => {
    const request = resolveTasksRequest({ client: "abc", task: "123" }, undefined);
    expect(request.clientId).toBeNull();
    expect(request.taskId).toBeNull();
    expect(resolveTasksRequest({ task: taskId }, undefined).taskId).toBe(taskId);
  });

  it("clamps the Done range", () => {
    expect(resolveTasksRequest({ done: "80" }, undefined).doneLimit).toBe(80);
    expect(resolveTasksRequest({ done: "5" }, undefined).doneLimit).toBe(40);
    expect(resolveTasksRequest({ done: "99999" }, undefined).doneLimit).toBe(1000);
    expect(resolveTasksRequest({ done: "abc" }, undefined).doneLimit).toBe(40);
  });
});

describe("tasksHref", () => {
  it("links to the plain page with no options", () => {
    expect(tasksHref()).toBe("/tasks");
  });

  it("writes the Done tab and the client", () => {
    expect(tasksHref({ tab: "done", clientId })).toBe(`/tasks?tab=done&client=${clientId}`);
  });

  it("opens the new-task dialog", () => {
    expect(tasksHref({ openNew: true })).toBe("/tasks?new=1");
  });

  it("leaves default values out", () => {
    expect(tasksSearch({ tab: "open", doneLimit: 40 })).toBe("");
    expect(tasksSearch({ doneLimit: 80, taskId })).toBe(`done=80&task=${taskId}`);
  });
});
