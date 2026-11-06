import { z } from "zod";

export const requestTypeValues = [
  "PROFILE_FILL",
  "DESIGN",
  "INSTALLATION",
  "RETROFIT",
  "REPAIR",
  "EMERGENCY",
  "SERVICE_ONE_TIME",
  "SERVICE_RECURRING",
  "MATERIALS",
] as const;

export const urgencyValues = ["LOW", "NORMAL", "HIGH", "EMERGENCY"] as const;

export const createRequestSchema = z.object({
  type: z.enum(requestTypeValues),
  facilityId: z.string().min(1, "Выберите объект"),
  systemId: z.string().optional(),
  equipmentId: z.string().optional(),
  title: z.string().min(5, "Опишите задачу коротко (от 5 символов)").max(140),
  description: z.string().max(4000).optional().or(z.literal("")),
  urgency: z.enum(urgencyValues),
  desiredDateFrom: z.string().optional().or(z.literal("")),
  desiredDateTo: z.string().optional().or(z.literal("")),
  visitTimeNote: z.string().max(200).optional().or(z.literal("")),
  budgetMin: z
    .union([z.coerce.number().int().min(0).max(1_000_000_000), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  budgetMax: z
    .union([z.coerce.number().int().min(0).max(1_000_000_000), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  needsEstimate: z.boolean(),
  needsContract: z.boolean(),
  needsWarranty: z.boolean(),
  contactName: z.string().max(120).optional().or(z.literal("")),
  contactPhone: z.string().max(30).optional().or(z.literal("")),
});

export type CreateRequestInput = z.output<typeof createRequestSchema>;
export type CreateRequestFormInput = z.input<typeof createRequestSchema>;
