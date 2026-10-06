import { z } from "zod";
import { INVENTORY_MESSAGES, VALIDATION_MESSAGES } from "@/constants/messages";

export const stockReceiptItemInputSchema = z
  .object({
    medicineId: z.coerce.number().int().positive(INVENTORY_MESSAGES.RECEIPT.SELECT_MEDICINE),
    lotNumber: z.string().trim().min(1, INVENTORY_MESSAGES.RECEIPT.LOT_NUMBER_REQUIRED),
    manufacturingDate: z.string().trim().optional().nullable(),
    expiryDate: z.string().trim().min(1, INVENTORY_MESSAGES.RECEIPT.EXPIRY_DATE_REQUIRED),
    quantity: z.coerce.number().positive(INVENTORY_MESSAGES.RECEIPT.ITEM_QUANTITY_POSITIVE_FIELD),
    unitCost: z.coerce.number().min(0, INVENTORY_MESSAGES.RECEIPT.UNIT_COST_NON_NEGATIVE).optional().nullable(),
    note: z.string().trim().max(500, VALIDATION_MESSAGES.TEXT.MAX_LENGTH(500)).optional().nullable(),
  })
  .refine(
    (item) => {
      if (item.manufacturingDate && item.expiryDate) {
        return new Date(item.manufacturingDate) <= new Date(item.expiryDate);
      }
      return true;
    },
    {
      message: VALIDATION_MESSAGES.DATE.MFG_LE_EXP,
      path: ["manufacturingDate"],
    },
  );

export const stockReceiptInputSchema = z.object({
  receiptCode: z.string().trim().optional(),
  warehouseId: z.coerce.number().int().positive(INVENTORY_MESSAGES.RECEIPT.SELECT_WAREHOUSE),
  supplierId: z.coerce.number().int().positive(INVENTORY_MESSAGES.RECEIPT.SELECT_SUPPLIER),
  receiptDate: z.string().trim().min(1, INVENTORY_MESSAGES.RECEIPT.SELECT_DATE),
  documentNumber: z.string().trim().max(100, VALIDATION_MESSAGES.TEXT.MAX_LENGTH(100)).optional().nullable(),
  note: z.string().trim().max(1000, VALIDATION_MESSAGES.TEXT.MAX_LENGTH(1000)).optional().nullable(),
  items: z.array(stockReceiptItemInputSchema).min(1, INVENTORY_MESSAGES.RECEIPT.MIN_ITEMS),
});

export const stockIssueItemInputSchema = z.object({
  medicineId: z.coerce.number().int().positive(INVENTORY_MESSAGES.ISSUE.SELECT_MEDICINE),
  requestedQuantity: z.coerce.number().positive(INVENTORY_MESSAGES.ISSUE.ITEM_QUANTITY_POSITIVE_FIELD),
  note: z.string().trim().max(500, VALIDATION_MESSAGES.TEXT.MAX_LENGTH(500)).optional().nullable(),
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
  warehouseId: z.coerce.number().int().positive(INVENTORY_MESSAGES.ISSUE.SELECT_WAREHOUSE),
  departmentId: z.coerce.number().int().positive().optional().nullable(),
  receiver: z.string().trim().min(1, INVENTORY_MESSAGES.ISSUE.RECEIVER_REQUIRED),
  issueDate: z.string().trim().min(1, INVENTORY_MESSAGES.ISSUE.SELECT_DATE),
  issueType: z.enum([
    "DEPARTMENT_ISSUE",
    "PATIENT_ISSUE",
    "TRANSFER",
    "DISPOSAL",
    "OTHER",
  ]),
  note: z.string().trim().max(1000, VALIDATION_MESSAGES.TEXT.MAX_LENGTH(1000)).optional().nullable(),
  items: z.array(stockIssueItemInputSchema).min(1, INVENTORY_MESSAGES.ISSUE.MIN_ITEMS),
});

export type StockReceiptInputValues = z.input<typeof stockReceiptInputSchema>;
export type StockIssueInputValues = z.input<typeof stockIssueInputSchema>;
