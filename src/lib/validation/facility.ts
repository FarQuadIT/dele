import { z } from "zod";

export const facilityTypeValues = [
  "HOUSE",
  "APARTMENT",
  "COMMERCIAL",
  "OTHER",
] as const;

export const facilityTypeLabels: Record<
  (typeof facilityTypeValues)[number],
  string
> = {
  HOUSE: "Загородный дом",
  APARTMENT: "Квартира",
  COMMERCIAL: "Коммерческий объект",
  OTHER: "Другое",
};

export const createFacilitySchema = z.object({
  title: z.string().min(2, "Укажите название").max(120),
  type: z.enum(facilityTypeValues),
  address: z.string().min(5, "Укажите адрес").max(300),
  region: z.string().max(120).optional().or(z.literal("")),
  area: z.coerce
    .number()
    .positive("Площадь должна быть больше нуля")
    .max(1_000_000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  floorsCount: z.coerce
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  buildYear: z.coerce
    .number()
    .int()
    .min(1800, "Год не раньше 1800")
    .max(new Date().getFullYear() + 1)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export type CreateFacilityInput = z.output<typeof createFacilitySchema>;
export type CreateFacilityFormInput = z.input<typeof createFacilitySchema>;
