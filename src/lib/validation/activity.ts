import { z } from "zod";

import { CONTACT_CHANNELS } from "@/lib/activity";

/** Mirrored by client_activities_body_len in the client_activity migration. */
export const ACTIVITY_BODY_MAX = 2000;

/** A note as the note action takes it: trimmed, never blank. */
export const activityNoteSchema = z.object({
  clientId: z.uuid(),
  body: z.string().trim().min(1).max(ACTIVITY_BODY_MAX),
});

/** A logged contact: how the agent reached the client, and optionally what about. */
export const logContactSchema = z.object({
  clientId: z.uuid(),
  channel: z.enum(CONTACT_CHANNELS),
  body: z
    .string()
    .trim()
    .max(ACTIVITY_BODY_MAX)
    .nullish()
    .transform((b) => (b ? b : null)),
});
export type LogContactInput = z.input<typeof logContactSchema>;
