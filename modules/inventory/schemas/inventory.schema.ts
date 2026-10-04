import { z } from "zod";

export const stockReceiptItemInputSchema = z
  .object({
    medicineId: z.coerce.number().int().positive("Vui lòng chọn thuốc."),
    lotNumber: z.string().trim().min(1, "Số lô không được để trống."),
    manufacturingDate: z.string().trim().optional().nullable(),
    expiryDate: z.string().trim().min(1, "Hạn dùng không được để trống."),
    quantity: z.coerce.number().positive("Số lượng nhập phải lớn hơn 0."),
    unitCost: z.coerce.number().min(0, "Đơn giá không được âm.").optional().nullable(),
    note: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự.").optional().nullable(),
  })
  .refine(
    (item) => {
      if (item.manufacturingDate && item.expiryDate) {
        return new Date(item.manufacturingDate) <= new Date(item.expiryDate);
      }
      return true;
    },
    {
      message: "Ngày sản xuất phải nhỏ hơn hoặc bằng hạn dùng.",
      path: ["manufacturingDate"],
    },
  );

export const stockReceiptInputSchema = z.object({
  receiptCode: z.string().trim().optional(),
  warehouseId: z.coerce.number().int().positive("Vui lòng chọn kho nhận."),
  supplierId: z.coerce.number().int().positive("Vui lòng chọn nhà cung cấp."),
  receiptDate: z.string().trim().min(1, "Vui lòng chọn ngày nhập."),
  documentNumber: z.string().trim().max(100, "Số chứng từ tối đa 100 ký tự.").optional().nullable(),
  note: z.string().trim().max(1000, "Ghi chú tối đa 1000 ký tự.").optional().nullable(),
  items: z.array(stockReceiptItemInputSchema).min(1, "Phiếu nhập phải có ít nhất 1 mặt hàng."),
});

export const stockIssueItemInputSchema = z.object({
  medicineId: z.coerce.number().int().positive("Vui lòng chọn thuốc."),
  requestedQuantity: z.coerce.number().positive("Số lượng xuất phải lớn hơn 0."),
  note: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự.").optional().nullable(),
  allocations: z
    .array(
      z.object({
        batchId: z.coerce.number().int().positive(),
        allocatedQuantity: z.coerce.number().positive(),
        isFefoOverride: z.boolean().default(false),
        overrideReason: z.string().trim().optional().nullable(),
      }),
    )
    .optional(),
});

export const stockIssueInputSchema = z.object({
  issueCode: z.string().trim().optional(),
  warehouseId: z.coerce.number().int().positive("Vui lòng chọn kho xuất."),
  departmentId: z.coerce.number().int().positive().optional().nullable(),
  receiver: z.string().trim().min(1, "Người nhận / Đơn vị nhận không được để trống."),
  issueDate: z.string().trim().min(1, "Vui lòng chọn ngày xuất."),
  issueType: z.enum([
    "DEPARTMENT_ISSUE",
    "PATIENT_ISSUE",
    "TRANSFER",
    "DISPOSAL",
    "OTHER",
  ]),
  note: z.string().trim().max(1000, "Ghi chú tối đa 1000 ký tự.").optional().nullable(),
  items: z.array(stockIssueItemInputSchema).min(1, "Phiếu xuất phải có ít nhất 1 mặt hàng."),
});

export type StockReceiptInputValues = z.input<typeof stockReceiptInputSchema>;
export type StockIssueInputValues = z.input<typeof stockIssueInputSchema>;
