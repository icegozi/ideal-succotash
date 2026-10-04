import { INVENTORY_CONFIG } from "@/lib/config/inventory";
import { AppError } from "@/lib/errors/app-error";
import type { InventoryRepository } from "@/modules/inventory/repositories/inventory.repository";
import { FefoAllocationService } from "@/modules/inventory/services/fefo-allocation.service";
import type {
  FefoProposalResult,
  StockIssue,
  StockIssueInput,
  StockIssueListQuery,
  StockIssuePage,
} from "@/modules/inventory/types/inventory.types";

export class StockOutService {
  private fefoAllocationService = new FefoAllocationService();

  constructor(private readonly repository: InventoryRepository) {}

  async listIssues(query: StockIssueListQuery): Promise<StockIssuePage> {
    return this.repository.listIssues({
      query: query.query ?? "",
      warehouseId: query.warehouseId ?? "ALL",
      status: query.status ?? "ALL",
      issueType: query.issueType ?? "ALL",
      fromDate: query.fromDate ?? "",
      toDate: query.toDate ?? "",
      page: Math.max(1, Number(query.page) || 1),
      pageSize: Math.max(1, Math.min(100, Number(query.pageSize) || INVENTORY_CONFIG.defaultPageSize)),
    });
  }

  async getIssueById(id: number): Promise<StockIssue> {
    const issue = await this.repository.getIssueById(id);
    if (!issue) {
      throw new AppError("NOT_FOUND", "Không tìm thấy phiếu xuất kho.");
    }
    return issue;
  }

  /**
   * Preview FEFO proposal for UI when selecting medicine and quantity.
   */
  async previewFefo(
    warehouseId: number,
    medicineId: number,
    requestedQuantity: number,
  ): Promise<FefoProposalResult> {
    if (requestedQuantity <= 0) {
      throw new AppError("VALIDATION_ERROR", "Số lượng yêu cầu phải lớn hơn 0.");
    }

    const candidates = await this.repository.getCandidateBatchesForFefo(
      warehouseId,
      medicineId,
    );

    return this.fefoAllocationService.allocate(
      medicineId,
      requestedQuantity,
      candidates,
    );
  }

  async createIssue(input: StockIssueInput, creatorName: string): Promise<StockIssue> {
    if (!input.items || input.items.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Phiếu xuất phải có ít nhất 1 mặt hàng.");
    }

    for (const item of input.items) {
      if (item.requestedQuantity <= 0) {
        throw new AppError("VALIDATION_ERROR", "Số lượng xuất của từng mặt hàng phải lớn hơn 0.");
      }
    }

    return this.repository.createIssue(input, creatorName);
  }

  async confirmIssue(id: number, actorName: string): Promise<StockIssue> {
    return this.repository.confirmIssue(id, actorName);
  }

  async cancelIssue(id: number, actorName: string): Promise<StockIssue> {
    return this.repository.cancelIssue(id, actorName);
  }
}
