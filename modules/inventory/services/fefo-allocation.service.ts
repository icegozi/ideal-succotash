import { AppError } from "@/lib/errors/app-error";
import type {
  FefoAllocationItem,
  FefoCandidateBatch,
  FefoProposalResult,
} from "@/modules/inventory/types/inventory.types";

export interface FefoAllocationOptions {
  today?: string; // Optional YYYY-MM-DD for deterministic testing
}

export class FefoAllocationService {
  /**
   * Filter and sort batches according to hospital FEFO rules:
   * 1. Only AVAILABLE batches with availableQuantity > 0
   * 2. Exclude EXPIRED batches (expiryDate < today)
   * 3. Exclude QUARANTINE, BLOCKED, RECALLED batches
   * 4. Sort order:
   *    - expiryDate ASC
   *    - receivedAt ASC
   *    - batchId ASC
   */
  filterAndSortBatches(
    candidates: FefoCandidateBatch[],
    options?: FefoAllocationOptions,
  ): FefoCandidateBatch[] {
    const todayStr =
      options?.today || new Date().toISOString().split("T")[0];

    const eligible = candidates.filter((batch) => {
      // Must be AVAILABLE status
      if (batch.status !== "AVAILABLE") return false;
      // Must have positive available quantity
      if (batch.availableQuantity <= 0) return false;
      // Must not be expired (expiryDate >= today)
      if (batch.expiryDate < todayStr) return false;
      return true;
    });

    eligible.sort((a, b) => {
      // 1. expiryDate ASC
      const expCmp = a.expiryDate.localeCompare(b.expiryDate);
      if (expCmp !== 0) return expCmp;

      // 2. receivedAt ASC
      const recCmp = a.receivedAt.localeCompare(b.receivedAt);
      if (recCmp !== 0) return recCmp;

      // 3. batchId ASC
      return a.batchId - b.batchId;
    });

    return eligible;
  }

  /**
   * Compute standard FEFO proposal for a requested quantity.
   */
  allocate(
    medicineId: number,
    requestedQuantity: number,
    candidates: FefoCandidateBatch[],
    options?: FefoAllocationOptions,
  ): FefoProposalResult {
    if (requestedQuantity <= 0) {
      throw new AppError("VALIDATION_ERROR", "Số lượng yêu cầu xuất phải lớn hơn 0.");
    }

    const sortedBatches = this.filterAndSortBatches(candidates, options);
    const totalAvailable = sortedBatches.reduce(
      (sum, b) => sum + b.availableQuantity,
      0,
    );

    const allocations: FefoAllocationItem[] = [];
    let remaining = requestedQuantity;

    for (const batch of sortedBatches) {
      const allocated = Math.min(batch.availableQuantity, remaining);
      allocations.push({
        batchId: batch.batchId,
        lotNumber: batch.lotNumber,
        expiryDate: batch.expiryDate,
        allocatedQuantity: allocated,
        isFefoOverride: false,
      });

      remaining -= allocated;
      if (remaining <= 0) break;
    }

    const insufficient = remaining > 0;
    const missingQuantity = Math.max(0, remaining);

    return {
      medicineId,
      requestedQuantity,
      availableStock: totalAvailable,
      allocations,
      insufficient,
      missingQuantity,
    };
  }

  /**
   * Validate or build allocations when a user manual override is requested.
   * If override is active, checks that the override reason is provided and batches are valid.
   */
  allocateWithOverrides(
    medicineId: number,
    requestedQuantity: number,
    candidates: FefoCandidateBatch[],
    overrides?: {
      batchId: number;
      allocatedQuantity: number;
      isFefoOverride?: boolean;
      overrideReason?: string | null;
    }[],
    options?: FefoAllocationOptions,
  ): FefoProposalResult {
    if (!overrides || overrides.length === 0) {
      return this.allocate(medicineId, requestedQuantity, candidates, options);
    }

    const todayStr =
      options?.today || new Date().toISOString().split("T")[0];

    const candidateMap = new Map(candidates.map((c) => [c.batchId, c]));
    let totalAllocated = 0;
    const allocations: FefoAllocationItem[] = [];

    for (const item of overrides) {
      const batch = candidateMap.get(item.batchId);
      if (!batch) {
        throw new AppError(
          "NOT_FOUND",
          `Không tìm thấy lô thuốc (ID: ${item.batchId}) trong kho.`,
        );
      }

      if (batch.status !== "AVAILABLE") {
        throw new AppError(
          "CONFLICT",
          `Lô ${batch.lotNumber} đang ở trạng thái ${batch.status}, không thể xuất kho.`,
        );
      }

      if (batch.expiryDate < todayStr) {
        throw new AppError(
          "CONFLICT",
          `Lô ${batch.lotNumber} đã hết hạn (${batch.expiryDate}), không thể xuất kho.`,
        );
      }

      if (item.allocatedQuantity > batch.availableQuantity) {
        throw new AppError(
          "CONFLICT",
          `Số lượng xuất của lô ${batch.lotNumber} (${item.allocatedQuantity}) vượt quá tồn khả dụng (${batch.availableQuantity}).`,
        );
      }

      if (item.isFefoOverride && (!item.overrideReason || !item.overrideReason.trim())) {
        throw new AppError(
          "VALIDATION_ERROR",
          `Bắt buộc nhập lý do khi chọn xuất lô không theo thứ tự FEFO (Lô: ${batch.lotNumber}).`,
        );
      }

      allocations.push({
        batchId: batch.batchId,
        lotNumber: batch.lotNumber,
        expiryDate: batch.expiryDate,
        allocatedQuantity: item.allocatedQuantity,
        isFefoOverride: Boolean(item.isFefoOverride),
        overrideReason: item.overrideReason || null,
      });

      totalAllocated += item.allocatedQuantity;
    }

    if (totalAllocated < requestedQuantity) {
      const missing = requestedQuantity - totalAllocated;
      throw new AppError(
        "CONFLICT",
        `Không đủ số lượng xuất. Yêu cầu: ${requestedQuantity}, Đã phân bổ: ${totalAllocated}, Thiếu: ${missing}.`,
      );
    }

    const totalAvailable = candidates
      .filter((b) => b.status === "AVAILABLE" && b.expiryDate >= todayStr)
      .reduce((sum, b) => sum + b.availableQuantity, 0);

    return {
      medicineId,
      requestedQuantity,
      availableStock: totalAvailable,
      allocations,
      insufficient: false,
      missingQuantity: 0,
    };
  }
}
