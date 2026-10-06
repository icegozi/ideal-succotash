"use server";

import { revalidatePath } from "next/cache";

import { getCurrentActor, permissions, requirePermission } from "@/lib/auth/permissions";
import { toPublicError } from "@/lib/errors/app-error";
import { INVENTORY_MESSAGES } from "@/constants/messages";
import {
  stockIssueInputSchema,
  stockReceiptInputSchema,
} from "@/modules/inventory/schemas/inventory.schema";
import {
  getStockInService,
  getStockOutService,
} from "@/modules/inventory/services";
import type { FefoProposalResult } from "@/modules/inventory/types/inventory.types";

export type InventoryActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  id?: number;
  fieldErrors?: Record<string, string[]>;
};

export async function createReceiptAction(input: unknown): Promise<InventoryActionState> {
  try {
    const actor = await requirePermission(permissions.stockInCreate);
    const parsed = stockReceiptInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        status: "error",
        message: INVENTORY_MESSAGES.RECEIPT.INVALID_INPUT,
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const receipt = await getStockInService().createReceipt(parsed.data, actor.name);
    revalidatePath("/stock-in");
    revalidatePath("/inventory");
    return { status: "success", message: INVENTORY_MESSAGES.RECEIPT.CREATE_SUCCESS, id: receipt.id };
  } catch (error) {
    return { status: "error", ...toPublicError(error) };
  }
}

export async function confirmReceiptAction(id: number): Promise<InventoryActionState> {
  try {
    const actor = await requirePermission(permissions.stockInConfirm);
    const receipt = await getStockInService().confirmReceipt(id, actor.name);
    revalidatePath("/stock-in");
    revalidatePath(`/stock-in/${id}`);
    revalidatePath("/inventory");
    return { status: "success", message: INVENTORY_MESSAGES.RECEIPT.CONFIRM_SUCCESS, id: receipt.id };
  } catch (error) {
    return { status: "error", ...toPublicError(error) };
  }
}

export async function cancelReceiptAction(id: number): Promise<InventoryActionState> {
  try {
    const actor = await requirePermission(permissions.stockInCancel);
    const receipt = await getStockInService().cancelReceipt(id, actor.name);
    revalidatePath("/stock-in");
    revalidatePath(`/stock-in/${id}`);
    revalidatePath("/inventory");
    return { status: "success", message: INVENTORY_MESSAGES.RECEIPT.CANCEL_SUCCESS, id: receipt.id };
  } catch (error) {
    return { status: "error", ...toPublicError(error) };
  }
}

export async function createIssueAction(input: unknown): Promise<InventoryActionState> {
  try {
    const actor = await requirePermission(permissions.stockOutCreate);
    const parsed = stockIssueInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        status: "error",
        message: INVENTORY_MESSAGES.ISSUE.INVALID_INPUT,
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const issue = await getStockOutService().createIssue(parsed.data, actor.name);
    revalidatePath("/stock-out");
    revalidatePath("/inventory");
    return { status: "success", message: INVENTORY_MESSAGES.ISSUE.CREATE_SUCCESS, id: issue.id };
  } catch (error) {
    return { status: "error", ...toPublicError(error) };
  }
}

export async function confirmIssueAction(id: number): Promise<InventoryActionState> {
  try {
    const actor = await requirePermission(permissions.stockOutConfirm);
    const issue = await getStockOutService().confirmIssue(id, actor.name);
    revalidatePath("/stock-out");
    revalidatePath(`/stock-out/${id}`);
    revalidatePath("/inventory");
    return { status: "success", message: INVENTORY_MESSAGES.ISSUE.CONFIRM_SUCCESS, id: issue.id };
  } catch (error) {
    return { status: "error", ...toPublicError(error) };
  }
}

export async function cancelIssueAction(id: number): Promise<InventoryActionState> {
  try {
    const actor = await requirePermission(permissions.stockOutCancel);
    const issue = await getStockOutService().cancelIssue(id, actor.name);
    revalidatePath("/stock-out");
    revalidatePath(`/stock-out/${id}`);
    revalidatePath("/inventory");
    return { status: "success", message: INVENTORY_MESSAGES.ISSUE.CANCEL_SUCCESS, id: issue.id };
  } catch (error) {
    return { status: "error", ...toPublicError(error) };
  }
}

export async function previewFefoAction(
  warehouseId: number,
  medicineId: number,
  quantity: number,
): Promise<{ success: boolean; data?: FefoProposalResult; error?: string }> {
  try {
    await getCurrentActor();
    const result = await getStockOutService().previewFefo(warehouseId, medicineId, quantity);
    return { success: true, data: result };
  } catch (error) {
    const pub = toPublicError(error);
    return { success: false, error: pub.message };
  }
}
