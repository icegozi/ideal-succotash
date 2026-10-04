export type BatchStatus = "AVAILABLE" | "QUARANTINE" | "BLOCKED" | "EXPIRED" | "RECALLED";

export type ReceiptStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export type IssueStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export type IssueType =
  | "DEPARTMENT_ISSUE"
  | "PATIENT_ISSUE"
  | "TRANSFER"
  | "DISPOSAL"
  | "OTHER";

export type MovementType =
  | "STOCK_IN"
  | "STOCK_OUT"
  | "STOCK_IN_REVERSAL"
  | "STOCK_OUT_REVERSAL";

export type ExpiryStatus = "NORMAL" | "NEAR_EXPIRY" | "EXPIRED";

export interface WarehouseOption {
  id: number;
  code: string;
  name: string;
  type?: string;
  active: "Y" | "N";
}

export interface SupplierOption {
  id: number;
  code: string;
  name: string;
  active: "Y" | "N";
}

export interface DepartmentOption {
  id: number;
  code: string;
  name: string;
  active: "Y" | "N";
}

export interface MedicineOption {
  id: number;
  code: string;
  name: string;
  activeIngredient?: string | null;
  strength?: string | null;
  baseUnitId: number;
  baseUnitName: string;
  controlled: "Y" | "N";
  minimumStock: number;
  active: "Y" | "N";
}

export interface Batch {
  id: number;
  medicineId: number;
  medicineCode: string;
  medicineName: string;
  lotNumber: string;
  manufacturingDate?: string | null; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  status: BatchStatus;
  supplierId?: number | null;
  supplierName?: string | null;
  receivedAt: string; // ISO date string
  createdAt: string;
}

export interface InventoryBalance {
  id: number;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  medicineId: number;
  medicineCode: string;
  medicineName: string;
  medicineStrength?: string | null;
  medicineActiveIngredient?: string | null;
  unitName: string;
  batchId: number;
  lotNumber: string;
  manufacturingDate?: string | null;
  expiryDate: string;
  batchStatus: BatchStatus;
  onHandQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  expiryStatus: ExpiryStatus;
  daysUntilExpiry: number;
}

export interface MedicineInventorySummary {
  medicineId: number;
  medicineCode: string;
  medicineName: string;
  activeIngredient?: string | null;
  strength?: string | null;
  unitName: string;
  warehouseId: number;
  warehouseName: string;
  onHandQuantity: number;
  availableQuantity: number;
  batchCount: number;
  nearestExpiryDate: string | null;
  expiryStatus: ExpiryStatus;
  minimumStock: number;
  isLowStock: boolean;
}

export interface InventoryDashboardMetrics {
  totalMedicineCount: number;
  totalBatchCount: number;
  nearExpiryBatchCount: number;
  expiredBatchCount: number;
  lowStockMedicineCount: number;
}

export interface InventoryListQuery {
  query?: string;
  warehouseId?: number | "ALL";
  stockStatus?: "ALL" | "IN_STOCK" | "OUT_OF_STOCK";
  expiryStatus?: "ALL" | "NORMAL" | "NEAR_EXPIRY" | "EXPIRED";
  page?: number;
  pageSize?: number;
}

export interface InventoryPage {
  items: MedicineInventorySummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// FEFO types
export interface FefoCandidateBatch {
  batchId: number;
  lotNumber: string;
  expiryDate: string;
  receivedAt: string;
  availableQuantity: number;
  status: BatchStatus;
}

export interface FefoAllocationItem {
  batchId: number;
  lotNumber: string;
  expiryDate: string;
  allocatedQuantity: number;
  isFefoOverride: boolean;
  overrideReason?: string | null;
}

export interface FefoProposalResult {
  medicineId: number;
  requestedQuantity: number;
  availableStock: number;
  allocations: FefoAllocationItem[];
  insufficient: boolean;
  missingQuantity: number;
}

// Stock Receipt types
export interface StockReceiptItemInput {
  medicineId: number;
  lotNumber: string;
  manufacturingDate?: string | null;
  expiryDate: string;
  quantity: number;
  unitCost?: number | null;
  note?: string | null;
}

export interface StockReceiptInput {
  receiptCode?: string;
  warehouseId: number;
  supplierId: number;
  receiptDate: string; // YYYY-MM-DD
  documentNumber?: string | null;
  note?: string | null;
  items: StockReceiptItemInput[];
}

export interface StockReceiptItem {
  id: number;
  receiptId: number;
  medicineId: number;
  medicineCode: string;
  medicineName: string;
  unitName: string;
  batchId?: number | null;
  lotNumber: string;
  manufacturingDate?: string | null;
  expiryDate: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  note?: string | null;
}

export interface StockReceipt {
  id: number;
  receiptCode: string;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  supplierId: number;
  supplierName: string;
  receiptDate: string;
  documentNumber?: string | null;
  status: ReceiptStatus;
  note?: string | null;
  totalItems: number;
  totalQuantity: number;
  createdBy: string;
  confirmedBy?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
  items?: StockReceiptItem[];
}

export interface StockReceiptListQuery {
  query?: string;
  warehouseId?: number | "ALL";
  status?: "ALL" | ReceiptStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface StockReceiptPage {
  items: StockReceipt[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Stock Issue types
export interface StockIssueItemInput {
  medicineId: number;
  requestedQuantity: number;
  note?: string | null;
  allocations?: {
    batchId: number;
    allocatedQuantity: number;
    isFefoOverride?: boolean;
    overrideReason?: string | null;
  }[];
}

export interface StockIssueInput {
  issueCode?: string;
  warehouseId: number;
  departmentId?: number | null;
  receiver: string;
  issueDate: string; // YYYY-MM-DD
  issueType: IssueType;
  note?: string | null;
  items: StockIssueItemInput[];
}

export interface StockIssueAllocation {
  id: number;
  issueItemId: number;
  batchId: number;
  lotNumber: string;
  expiryDate: string;
  allocatedQuantity: number;
  isFefoOverride: boolean;
  overrideReason?: string | null;
}

export interface StockIssueItem {
  id: number;
  issueId: number;
  medicineId: number;
  medicineCode: string;
  medicineName: string;
  unitName: string;
  requestedQuantity: number;
  note?: string | null;
  allocations: StockIssueAllocation[];
}

export interface StockIssue {
  id: number;
  issueCode: string;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  issueDate: string;
  issueType: IssueType;
  receiver: string;
  departmentId?: number | null;
  departmentName?: string | null;
  status: IssueStatus;
  note?: string | null;
  totalItems: number;
  totalQuantity: number;
  createdBy: string;
  confirmedBy?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
  items?: StockIssueItem[];
}

export interface StockIssueListQuery {
  query?: string;
  warehouseId?: number | "ALL";
  status?: "ALL" | IssueStatus;
  issueType?: "ALL" | IssueType;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface StockIssuePage {
  items: StockIssue[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Stock Movement types
export interface StockMovement {
  id: number;
  warehouseId: number;
  warehouseName: string;
  medicineId: number;
  medicineCode: string;
  medicineName: string;
  batchId: number;
  lotNumber: string;
  movementType: MovementType;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  referenceType: "PHIEU_NHAP" | "PHIEU_XUAT";
  referenceId: number;
  referenceCode: string;
  performedBy: string;
  createdAt: string;
}

// Batch traceability view
export interface BatchTraceability {
  batch: Batch;
  currentBalances: {
    warehouseId: number;
    warehouseName: string;
    onHandQuantity: number;
    availableQuantity: number;
  }[];
  receiptHistory: {
    receiptId: number;
    receiptCode: string;
    receiptDate: string;
    supplierName: string;
    quantity: number;
    unitCost: number;
  }[];
  issueHistory: {
    issueId: number;
    issueCode: string;
    issueDate: string;
    receiver: string;
    departmentName?: string | null;
    quantity: number;
  }[];
  movements: StockMovement[];
}
