import { z } from "zod";

import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/tasks";
import type { ValidationT } from "./i18n";

/** The migration mirrors both caps as check constraints (tasks_title_len, tasks_description_len). */
export const TASK_TITLE_MAX = 160;
export const TASK_DESCRIPTION_MAX = 2000;

/**
 * react-hook-form values for the task dialog. The client and due-date
 * fields hold "" for "none" (what a select / date input gives); toTaskInput()
 * turns the form into the payload the server actions take.
 */
export function taskFormSchema(t: ValidationT) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, t("titleRequired"))
      .max(TASK_TITLE_MAX, t("titleTooLong", { max: TASK_TITLE_MAX })),
    description: z
      .string()
      .trim()
      .max(TASK_DESCRIPTION_MAX, t("descriptionTooLong", { max: TASK_DESCRIPTION_MAX })),
    status: z.enum(TASK_STATUSES),
    priority: z.enum(TASK_PRIORITIES),
    client_id: z.union([z.literal(""), z.uuid()]),
    // a real calendar day (leap years included), never a datetime
    due_on: z.union([z.literal(""), z.iso.date()]),
  });
}
export type TaskFormValues = z.infer<ReturnType<typeof taskFormSchema>>;

/** Cleaned payload the server actions receive and check again. */
export const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(TASK_TITLE_MAX),
  // a blank description is stored as null, whoever builds the payload
  description: z
    .string()
    .trim()
    .max(TASK_DESCRIPTION_MAX)
    .nullable()
    .transform((d) => (d === "" ? null : d)),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  client_id: z.uuid().nullable(),
  due_on: z.iso.date().nullable(),
});
export type TaskInput = z.infer<typeof taskInputSchema>;

/** Form values → action payload: blanks become nulls, text is trimmed. */
export function toTaskInput(values: TaskFormValues): TaskInput {
  const description = values.description.trim();
  return {
    title: values.title.trim(),
    description: description === "" ? null : description,
    status: values.status,
    priority: values.priority,
    client_id: values.client_id === "" ? null : values.client_id,
    due_on: values.due_on === "" ? null : values.due_on,
  };
}
