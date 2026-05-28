import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const clientFormSchema = z.object({
  side: z.enum(["buyer", "seller"]),
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
  email: z.union([z.literal(""), z.email("Enter a valid email")]),
  phone: optionalText(50),
  language: optionalText(50),
  nationality: optionalText(50),
  agency: optionalText(120),
  notes: optionalText(5000),
  priority: z.boolean(),
  deal_type: z.enum(["direct", "collab"]).optional(),
  seller_role: z.enum(["owner", "representative"]).optional(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
