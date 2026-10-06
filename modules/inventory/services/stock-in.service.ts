import { INVENTORY_CONFIG } from "@/lib/config/inventory";
import { AppError } from "@/lib/errors/app-error";
import { INVENTORY_MESSAGES } from "@/constants/messages";
import type { InventoryRepository } from "@/modules/inventory/repositories/inventory.repository";
import type {
  StockReceipt,
  StockReceiptInput,
  StockReceiptListQuery,
  StockReceiptPage,
} from "@/modules/inventory/types/inventory.types";

export class StockInService {
  constructor(private readonly repository: InventoryRepository) {}

  async listReceipts(query: StockReceiptListQuery): Promise<StockReceiptPage> {
    return this.repository.listReceipts({
      query: query.query ?? "",
      warehouseId: query.warehouseId ?? "ALL",
      status: query.status ?? "ALL",
      fromDate: query.fromDate ?? "",
      toDate: query.toDate ?? "",
      page: Math.max(1, Number(query.page) || 1),
      pageSize: Math.max(1, Math.min(100, Number(query.pageSize) || INVENTORY_CONFIG.defaultPageSize)),
    });
  }

  async getReceiptById(id: number): Promise<StockReceipt> {
    const receipt = await this.repository.getReceiptById(id);
    if (!receipt) {
      throw new AppError("NOT_FOUND", INVENTORY_MESSAGES.RECEIPT.NOT_FOUND);
    }
    return receipt;
  }

  async createReceipt(input: StockReceiptInput, creatorName: string): Promise<StockReceipt> {
    // Basic service-level validation
    if (!input.items || input.items.length === 0) {
      throw new AppError("VALIDATION_ERROR", INVENTORY_MESSAGES.RECEIPT.MIN_ITEMS);
    }

    for (const item of input.items) {
      if (item.quantity <= 0) {
        throw new AppError("VALIDATION_ERROR", INVENTORY_MESSAGES.RECEIPT.ITEM_QUANTITY_POSITIVE);
      }
      if (item.manufacturingDate && item.expiryDate) {
        if (new Date(item.manufacturingDate) > new Date(item.expiryDate)) {
          throw new AppError(
            "VALIDATION_ERROR",
            INVENTORY_MESSAGES.RECEIPT.LOT_MFG_DATE_INVALID(item.lotNumber),
          );
        }
      }
    }

    return this.repository.createReceipt(input, creatorName);
  }

  async confirmReceipt(id: number, actorName: string): Promise<StockReceipt> {
    return this.repository.confirmReceipt(id, actorName);
  }

  async cancelReceipt(id: number, actorName: string): Promise<StockReceipt> {
    return this.repository.cancelReceipt(id, actorName);
  }
}
