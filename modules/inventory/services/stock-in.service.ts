import { INVENTORY_CONFIG } from "@/lib/config/inventory";
import { AppError } from "@/lib/errors/app-error";
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
      throw new AppError("NOT_FOUND", "Không tìm thấy phiếu nhập kho.");
    }
    return receipt;
  }

  async createReceipt(input: StockReceiptInput, creatorName: string): Promise<StockReceipt> {
    // Basic service-level validation
    if (!input.items || input.items.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Phiếu nhập phải có ít nhất 1 mặt hàng.");
    }

    for (const item of input.items) {
      if (item.quantity <= 0) {
        throw new AppError("VALIDATION_ERROR", "Số lượng nhập của từng mặt hàng phải lớn hơn 0.");
      }
      if (item.manufacturingDate && item.expiryDate) {
        if (new Date(item.manufacturingDate) > new Date(item.expiryDate)) {
          throw new AppError(
            "VALIDATION_ERROR",
            `Lô ${item.lotNumber}: Ngày sản xuất không được lớn hơn hạn dùng.`,
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
