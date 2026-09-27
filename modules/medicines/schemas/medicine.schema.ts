import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Tối đa ${max} ký tự.`)
    .transform((value) => value || null);

export const medicineInputSchema = z.object({
  code: z.string().trim().min(1, "Mã thuốc là bắt buộc.").max(40, "Tối đa 40 ký tự."),
  name: z.string().trim().min(1, "Tên thuốc là bắt buộc.").max(250, "Tối đa 250 ký tự."),
  activeIngredient: optionalText(250),
  strength: optionalText(100),
  dosageForm: optionalText(100),
  route: optionalText(100),
  manufacturer: optionalText(200),
  baseUnitId: z.coerce.number().int().positive("Chọn đơn vị cơ sở."),
  minimumStock: z.coerce.number().min(0, "Tồn tối thiểu không được âm."),
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
