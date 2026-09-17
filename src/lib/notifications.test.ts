import { describe, expect, it } from "vitest";

import { notificationHref } from "./notifications";

describe("notificationHref", () => {
  it("opens the task for a task_due row", () => {
    expect(notificationHref({ type: "task_due", client_id: "c1", task_id: "t1" })).toBe(
      "/tasks?task=t1"
    );
  });

  it("falls back to the tasks page for a task_due row without a task", () => {
    expect(notificationHref({ type: "task_due", client_id: null, task_id: null })).toBe("/tasks");
  });

  it.each(["appointment_today", "appointment_reminder"] as const)(
    "sends %s to the calendar",
    (type) => {
      expect(notificationHref({ type, client_id: "c1", task_id: null })).toBe("/calendar");
    }
  );

  it.each([
    ["follow_up", "/clients/c1?compose=check_in"],
    ["stalled_offer", "/clients/c1?compose=offer_followup"],
    ["reservation_date", "/clients/c1"],
  ] as const)("opens the client for %s", (type, href) => {
    expect(notificationHref({ type, client_id: "c1", task_id: null })).toBe(href);
  });

  it("sends the client-less follow_up digest to the buyers list", () => {
    expect(notificationHref({ type: "follow_up", client_id: null, task_id: null })).toBe(
      "/clients/buyers"
    );
  });

  it("sends any other client-less row to the calendar", () => {
    expect(notificationHref({ type: "stalled_offer", client_id: null, task_id: null })).toBe(
      "/calendar"
    );
  });
});
