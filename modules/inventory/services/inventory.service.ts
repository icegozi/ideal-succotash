import { INVENTORY_CONFIG } from "@/lib/config/inventory";
import type { InventoryRepository } from "@/modules/inventory/repositories/inventory.repository";
import type {
  BatchTraceability,
  DepartmentOption,
  InventoryBalance,
  InventoryDashboardMetrics,
  InventoryListQuery,
  InventoryPage,
  MedicineOption,
  StockMovement,
  SupplierOption,
  WarehouseOption,
} from "@/modules/inventory/types/inventory.types";

export class InventoryService {
  constructor(private readonly repository: InventoryRepository) {}

  async listWarehouses(): Promise<WarehouseOption[]> {
    return this.repository.listWarehouses();
  }

  async listSuppliers(): Promise<SupplierOption[]> {
    return this.repository.listSuppliers();
  }

  async listDepartments(): Promise<DepartmentOption[]> {
    return this.repository.listDepartments();
  }

  async listMedicines(): Promise<MedicineOption[]> {
    return this.repository.listMedicines();
  }

  async getDashboardMetrics(): Promise<InventoryDashboardMetrics> {
    return this.repository.getDashboardMetrics();
  }

  async listInventory(query: InventoryListQuery): Promise<InventoryPage> {
    return this.repository.listInventory({
      query: query.query ?? "",
      warehouseId: query.warehouseId ?? "ALL",
      stockStatus: query.stockStatus ?? "ALL",
      expiryStatus: query.expiryStatus ?? "ALL",
      page: Math.max(1, Number(query.page) || 1),
      pageSize: Math.max(1, Math.min(100, Number(query.pageSize) || INVENTORY_CONFIG.defaultPageSize)),
    });
  }

  async getMedicineBatches(
    medicineId: number,
    warehouseId?: number,
  ): Promise<InventoryBalance[]> {
    return this.repository.getMedicineBatches(medicineId, warehouseId);
  }

  async getBatchTraceability(batchId: number): Promise<BatchTraceability | null> {
    return this.repository.getBatchTraceability(batchId);
  }

  async listMovements(filter?: {
    warehouseId?: number;
    medicineId?: number;
    batchId?: number;
    limit?: number;
  }): Promise<StockMovement[]> {
    return this.repository.listMovements(filter);
  }
}
