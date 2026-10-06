import { z } from "zod";
import { VALIDATION_MESSAGES, MEDICINE_MESSAGES } from "@/constants/messages";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, VALIDATION_MESSAGES.TEXT.MAX_LENGTH(max))
    .transform((value) => value || null);

export const medicineInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, MEDICINE_MESSAGES.VALIDATION.CODE_REQUIRED)
    .max(40, VALIDATION_MESSAGES.TEXT.MAX_LENGTH(40)),
  name: z
    .string()
    .trim()
    .min(1, MEDICINE_MESSAGES.VALIDATION.NAME_REQUIRED)
    .max(250, VALIDATION_MESSAGES.TEXT.MAX_LENGTH(250)),
  activeIngredient: optionalText(250),
  strength: optionalText(100),
  dosageForm: optionalText(100),
  route: optionalText(100),
  manufacturer: optionalText(200),
  baseUnitId: z.coerce.number().int().positive(MEDICINE_MESSAGES.VALIDATION.BASE_UNIT_REQUIRED),
  minimumStock: z.coerce.number().min(0, MEDICINE_MESSAGES.VALIDATION.MIN_STOCK_NON_NEGATIVE),
  controlled: z.enum(["Y", "N"]),
  active: z.enum(["Y", "N"]),
});

export const medicineListQuerySchema = z.object({
  query: z.string().trim().max(250).optional().default(""),
  active: z.enum(["ALL", "Y", "N"]).catch("ALL"),
  controlled: z.enum(["ALL", "Y", "N"]).catch("ALL"),
  sort: z.enum(["code", "name", "minimumStock"]).catch("code"),
  direction: z.enum(["asc", "desc"]).catch("asc"),
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce.number().int().min(5).max(100).catch(10),
});

export type MedicineFormValues = z.input<typeof medicineInputSchema>;
