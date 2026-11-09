/**
 * The two shapes of a voice note's data (plan 026).
 *
 * `voiceExtractionSchema` is what the model returns. It is deliberately
 * loose (no length limits, `.nullable()` rather than `.optional()`), because
 * strict JSON-schema mode needs every key present and doesn't support every
 * keyword. `sanitizeExtraction()` in proposal.ts enforces the limits after.
 *
 * `voiceApplySchema` is what the review sheet sends back on Save. It comes
 * from the browser, so it is strict.
 */
import { z } from "zod";

import { CONTACT_CHANNELS } from "@/lib/activity";
import { BUYER_STAGES, PROPERTY_TYPES, SELLER_STAGES } from "@/lib/crm";
import { ACTIVITY_BODY_MAX } from "@/lib/validation/activity";
import { TASK_TITLE_MAX } from "@/lib/validation/task";

/** Every stage either side uses, once ("qualified" is in both lists). */
export const STAGE_VALUES = Array.from(new Set<string>([...BUYER_STAGES, ...SELLER_STAGES])) as [
  string,
  ...string[],
];

const euros = z
  .number()
  .nullable()
  .describe("Whole euros as a plain number, e.g. 1500000 for 'one and a half million'. Null if not said.");

export const voiceExtractionSchema = z.object({
  summary: z.string().describe("One short sentence saying what the note covers."),
  groups: z
    .array(
      z.object({
        person: z.object({
          spoken: z.string().describe("The person or couple exactly as the agent named them, e.g. 'the Johnsons'."),
          first_name: z.string().nullable().describe("Only if the agent said it."),
          last_name: z.string().nullable().describe("Only if the agent said it."),
          side: z
            .enum(["buyer", "seller"])
            .nullable()
            .describe("buyer if they want to buy or rent, seller if they want to sell or let; null if unclear."),
        }),
        note: z.string().describe("What to keep on this client's timeline. Facts the agent said, nothing invented."),
        spoke_with_them: z
          .object({ channel: z.enum(CONTACT_CHANNELS) })
          .nullable()
          .describe("Set when the agent was in touch with them: meeting for in person or a viewing, call, whatsapp or email."),
        viewing: z
          .object({
            property: z.string().describe("The property shown, as the agent described it."),
            feedback: z.string().describe("What they thought of it."),
            had_offer: z.boolean(),
            offer_price: euros,
            property_price: euros,
          })
          .nullable()
          .describe("Set when the agent showed or visited a property with them."),
        preferences: z
          .object({
            budget_min: euros.describe("Only when the agent says 'from' or 'at least'. Whole euros."),
            budget_max: euros.describe(
              "'Up to', 'max', 'no more than', or a single budget figure. Whole euros, e.g. 1500000."
            ),
            bedrooms: z.number().int().nullable(),
            bathrooms: z.number().int().nullable(),
            property_types: z.array(z.enum(PROPERTY_TYPES)).nullable(),
            area_notes: z.string().nullable().describe("Areas or places they want, as spoken."),
          })
          .nullable()
          .describe("Only what the agent stated about what they want."),
        stage: z
          .enum(STAGE_VALUES)
          .nullable()
          .describe("Only when the agent clearly says they moved on, e.g. reserved. Usually null."),
        tasks: z
          .array(
            z.object({
              title: z.string().describe("A short to-do for the agent."),
              due_on: z
                .string()
                .regex(/^\d{4}-\d{2}-\d{2}$/)
                .nullable()
                .describe("YYYY-MM-DD, or null if no day was given."),
            })
          )
          .describe("Things the agent must do about this person."),
        appointment: z
          .object({
            title: z.string(),
            starts_at: z
              .string()
              .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
              .describe("YYYY-MM-DDTHH:mm in the agent's time zone."),
            duration_minutes: z.number().int().nullable(),
            location: z.string().nullable(),
          })
          .nullable()
          .describe("Only for a meeting or viewing fixed at a day AND a time."),
        follow_up: z
          .string()
          .nullable()
          .describe("What the agent wants to send them, e.g. 'send the floor plan'; null if nothing."),
        contact_details: z
          .object({
            phone: z.string().nullable(),
            email: z.string().nullable(),
            language: z.string().nullable().describe("As an English word, e.g. Swedish."),
            nationality: z.string().nullable().describe("As an English word, e.g. British."),
          })
          .nullable()
          .describe("Only details the agent read out."),
      })
    )
    .describe("One entry per person or couple mentioned."),
  unassigned: z
    .array(z.string())
    .describe("To-dos that belong to no client, e.g. 'renew the Idealista plan'."),
});
export type VoiceExtraction = z.infer<typeof voiceExtractionSchema>;
export type VoiceExtractionGroup = VoiceExtraction["groups"][number];

/** Limits applied after extraction and again on Save. */
export const VOICE_LIMITS = {
  groups: 12,
  tasks: 10,
  unassigned: 10,
  summary: 200,
  note: ACTIVITY_BODY_MAX,
  taskTitle: TASK_TITLE_MAX,
  property: 200,
  feedback: 2000,
  areaNotes: 2000,
  title: 200,
  location: 200,
  followUp: 300,
  name: 100,
  phone: 50,
  email: 200,
  language: 50,
  euros: 1_000_000_000,
  rooms: 50,
} as const;

const applyEuros = z.number().int().min(0).max(VOICE_LIMITS.euros).nullable();
const applyRooms = z.number().int().min(0).max(VOICE_LIMITS.rooms).nullable();

export const voiceApplyTaskSchema = z.object({
  title: z.string().trim().min(1).max(VOICE_LIMITS.taskTitle),
  due_on: z.iso.date().nullable(),
});

export const voiceApplyGroupSchema = z.object({
  client: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("existing"), id: z.uuid() }),
    z.object({
      kind: z.literal("new"),
      side: z.enum(["buyer", "seller"]),
      first_name: z.string().trim().min(1).max(VOICE_LIMITS.name),
      last_name: z.string().trim().max(VOICE_LIMITS.name),
      phone: z.string().trim().max(VOICE_LIMITS.phone),
      email: z.union([z.literal(""), z.email()]),
      language: z.string().trim().max(VOICE_LIMITS.language),
    }),
  ]),
  /** Null when the agent unticked it. */
  note: z.string().trim().max(VOICE_LIMITS.note).nullable(),
  /** Set when the note is logged as a contact (the note is its body). */
  contact_channel: z.enum(CONTACT_CHANNELS).nullable(),
  viewing: z
    .object({
      property: z.string().trim().max(VOICE_LIMITS.property),
      feedback: z.string().trim().max(VOICE_LIMITS.feedback),
      had_offer: z.boolean(),
      offer_price: applyEuros,
      property_price: applyEuros,
    })
    .nullable(),
  preferences: z
    .object({
      budget_min: applyEuros,
      budget_max: applyEuros,
      bedrooms: applyRooms,
      bathrooms: applyRooms,
      property_types: z.array(z.enum(PROPERTY_TYPES)).max(PROPERTY_TYPES.length).nullable(),
      area_notes: z.string().trim().max(VOICE_LIMITS.areaNotes).nullable(),
    })
    .nullable(),
  stage: z.enum(STAGE_VALUES).nullable(),
  tasks: z.array(voiceApplyTaskSchema).max(VOICE_LIMITS.tasks),
  appointment: z
    .object({
      title: z.string().trim().min(1).max(VOICE_LIMITS.title),
      /** Resolved to an instant in the browser, like the appointment dialog does. */
      starts_at: z.iso.datetime(),
      duration_minutes: z.number().int().min(15).max(480),
      location: z.string().trim().max(VOICE_LIMITS.location).nullable(),
    })
    .nullable(),
});

export const voiceApplySchema = z.object({
  noteId: z.uuid(),
  groups: z.array(voiceApplyGroupSchema).max(VOICE_LIMITS.groups),
  /** To-dos that belong to no client, saved as tasks without one. */
  looseTasks: z.array(voiceApplyTaskSchema).max(VOICE_LIMITS.unassigned),
});
export type VoiceApplyInput = z.infer<typeof voiceApplySchema>;
export type VoiceApplyGroup = z.infer<typeof voiceApplyGroupSchema>;
export type VoiceApplyTask = z.infer<typeof voiceApplyTaskSchema>;
