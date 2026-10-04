import type {
  BatchTraceability,
  DepartmentOption,
  FefoCandidateBatch,
  InventoryBalance,
  InventoryDashboardMetrics,
  InventoryListQuery,
  InventoryPage,
  MedicineOption,
  StockIssue,
  StockIssueInput,
  StockIssueListQuery,
  StockIssuePage,
  StockMovement,
  StockReceipt,
  StockReceiptInput,
  StockReceiptListQuery,
  StockReceiptPage,
  SupplierOption,
  WarehouseOption,
} from "@/modules/inventory/types/inventory.types";

export interface InventoryRepository {
  // Master data lookups
  listWarehouses(): Promise<WarehouseOption[]>;
  listSuppliers(): Promise<SupplierOption[]>;
  listDepartments(): Promise<DepartmentOption[]>;
  listMedicines(): Promise<MedicineOption[]>;

  // Inventory queries
  getDashboardMetrics(): Promise<InventoryDashboardMetrics>;
  listInventory(query: Required<InventoryListQuery>): Promise<InventoryPage>;
  getMedicineBatches(medicineId: number, warehouseId?: number): Promise<InventoryBalance[]>;
  getBatchTraceability(batchId: number): Promise<BatchTraceability | null>;
  getCandidateBatchesForFefo(warehouseId: number, medicineId: number): Promise<FefoCandidateBatch[]>;

  // Stock Receipts (Nhập kho)
  listReceipts(query: Required<StockReceiptListQuery>): Promise<StockReceiptPage>;
  getReceiptById(id: number): Promise<StockReceipt | null>;
  createReceipt(input: StockReceiptInput, creatorName: string): Promise<StockReceipt>;
  confirmReceipt(id: number, actorName: string): Promise<StockReceipt>;
  cancelReceipt(id: number, actorName: string): Promise<StockReceipt>;

  // Stock Issues (Xuất kho)
  listIssues(query: Required<StockIssueListQuery>): Promise<StockIssuePage>;
  getIssueById(id: number): Promise<StockIssue | null>;
  createIssue(input: StockIssueInput, creatorName: string): Promise<StockIssue>;
  confirmIssue(id: number, actorName: string): Promise<StockIssue>;
  cancelIssue(id: number, actorName: string): Promise<StockIssue>;

  // Movements (Sổ giao dịch kho)
  listMovements(filter?: {
    warehouseId?: number;
    medicineId?: number;
    batchId?: number;
    limit?: number;
  }): Promise<StockMovement[]>;
}
