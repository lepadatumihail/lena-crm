import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

/**
 * react-hook-form values for the appointment dialog. Date and time are kept
 * as the raw native-input strings; the dialog combines them into a TZ-correct
 * instant on the client before calling the server action.
 */
export const appointmentFormSchema = z
  .object({
    type: z.enum(["meeting", "viewing"]),
    title: optionalText(200),
    client_id: z.string(),
    property_id: z.string(),
    property_label: optionalText(200),
    date: z.string().min(1, "Pick a date"),
    time: z.string().min(1, "Pick a time"),
    duration_minutes: z.string(),
    location: optionalText(200),
    notes: optionalText(2000),
    reminder: z.string(),
  })
  .refine((v) => v.type !== "meeting" || v.client_id !== "", {
    path: ["client_id"],
    message: "Choose a client",
  });
export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

/** Cleaned payload the server action receives (instants already resolved). */
export const appointmentInputSchema = z.object({
  type: z.enum(["meeting", "viewing"]),
  title: z.string().nullable(),
  client_id: z.string().nullable(),
  property_id: z.string().nullable(),
  property_label: z.string().nullable(),
  starts_at: z.string().min(1),
  ends_at: z.string().nullable(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
  reminder_minutes: z.number().int().min(0).nullable(),
});
export type AppointmentInput = z.infer<typeof appointmentInputSchema>;
