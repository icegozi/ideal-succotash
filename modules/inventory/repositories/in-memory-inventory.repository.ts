import { AppError } from "@/lib/errors/app-error";
import { getExpiryStatus } from "@/lib/config/inventory";
import type { InventoryRepository } from "@/modules/inventory/repositories/inventory.repository";
import { FefoAllocationService } from "@/modules/inventory/services/fefo-allocation.service";
import type {
  Batch,
  BatchStatus,
  BatchTraceability,
  DepartmentOption,
  FefoCandidateBatch,
  InventoryBalance,
  InventoryDashboardMetrics,
  InventoryListQuery,
  InventoryPage,
  MedicineInventorySummary,
  MedicineOption,
  StockIssue,
  StockIssueAllocation,
  StockIssueInput,
  StockIssueItem,
  StockIssueListQuery,
  StockIssuePage,
  StockMovement,
  StockReceipt,
  StockReceiptInput,
  StockReceiptItem,
  StockReceiptListQuery,
  StockReceiptPage,
  SupplierOption,
  WarehouseOption,
} from "@/modules/inventory/types/inventory.types";

import { createStandardDemoData, type DemoDataset } from "@/lib/demo";

export class InMemoryInventoryRepository implements InventoryRepository {
  private warehouses: WarehouseOption[];
  private suppliers: SupplierOption[];
  private departments: DepartmentOption[];
  private medicines: MedicineOption[];
  private batches: Batch[];
  private balances: InventoryBalance[];
  private receipts: StockReceipt[];
  private issues: StockIssue[];
  private movements: StockMovement[];

  // Async lock mutex for warehouse + medicine concurrency protection
  private lockMap = new Map<string, Promise<void>>();
  private fefoService = new FefoAllocationService();

  constructor(initialData?: Partial<DemoDataset>) {
    const defaultData = createStandardDemoData();
    this.warehouses = (initialData?.warehouses ?? defaultData.warehouses).map((w) => ({ ...w }));
    this.suppliers = (initialData?.suppliers ?? defaultData.suppliers).map((s) => ({ ...s }));
    this.departments = (initialData?.departments ?? defaultData.departments).map((d) => ({ ...d }));
    this.medicines = (initialData?.medicineOptions ?? defaultData.medicineOptions).map((m) => ({ ...m }));
    this.batches = (initialData?.batches ?? defaultData.batches).map((b) => ({ ...b }));
    this.balances = (initialData?.balances ?? defaultData.balances).map((b) => ({ ...b }));
    this.receipts = (initialData?.receipts ?? defaultData.receipts).map((r) => ({
      ...r,
      items: r.items?.map((item) => ({ ...item })),
    }));
    this.issues = (initialData?.issues ?? defaultData.issues).map((i) => ({
      ...i,
      items: i.items?.map((item) => ({
        ...item,
        allocations: item.allocations?.map((a) => ({ ...a })),
      })),
    }));
    this.movements = (initialData?.movements ?? defaultData.movements).map((m) => ({ ...m }));
  }

  private async acquireLock(key: string): Promise<() => void> {
    while (this.lockMap.has(key)) {
      await this.lockMap.get(key);
    }
    let release!: () => void;
    const p = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.lockMap.set(key, p);
    return () => {
      this.lockMap.delete(key);
      release();
    };
  }

  // Master Data Lookups
  async listWarehouses(): Promise<WarehouseOption[]> {
    return this.warehouses.filter((w) => w.active === "Y");
  }

  async listSuppliers(): Promise<SupplierOption[]> {
    return this.suppliers.filter((s) => s.active === "Y");
  }

  async listDepartments(): Promise<DepartmentOption[]> {
    return this.departments.filter((d) => d.active === "Y");
  }

  async listMedicines(): Promise<MedicineOption[]> {
    return this.medicines.filter((m) => m.active === "Y");
  }

  // Dashboard Metrics
  async getDashboardMetrics(): Promise<InventoryDashboardMetrics> {
    const todayStr = new Date().toISOString().split("T")[0];

    // Total distinct medicines with inventory records
    const distinctMedicines = new Set(this.balances.map((b) => b.medicineId));

    // Batch metrics
    let totalBatches = 0;
    let nearExpiryBatches = 0;
    let expiredBatches = 0;

    for (const b of this.balances) {
      if (b.onHandQuantity > 0) {
        totalBatches++;
        const exp = getExpiryStatus(b.expiryDate, todayStr);
        if (exp.status === "EXPIRED" || b.batchStatus === "EXPIRED") {
          expiredBatches++;
        } else if (exp.status === "NEAR_EXPIRY") {
          nearExpiryBatches++;
        }
      }
    }

    // Low stock medicines
    let lowStockCount = 0;
    for (const med of this.medicines) {
      const totalAvailable = this.balances
        .filter((b) => b.medicineId === med.id)
        .reduce((sum, b) => sum + b.availableQuantity, 0);
      if (totalAvailable < med.minimumStock) {
        lowStockCount++;
      }
    }

    return {
      totalMedicineCount: distinctMedicines.size,
      totalBatchCount: totalBatches,
      nearExpiryBatchCount: nearExpiryBatches,
      expiredBatchCount: expiredBatches,
      lowStockMedicineCount: lowStockCount,
    };
  }

  // List Inventory
  async listInventory(query: Required<InventoryListQuery>): Promise<InventoryPage> {
    const todayStr = new Date().toISOString().split("T")[0];
    const normalizedQuery = query.query.toLocaleLowerCase("vi").trim();

    // Group balances by (medicineId, warehouseId)
    type GroupKey = `${number}-${number}`;
    const groupMap = new Map<
      GroupKey,
      {
        medicine: MedicineOption;
        warehouse: WarehouseOption;
        balances: InventoryBalance[];
      }
    >();

    for (const balance of this.balances) {
      if (query.warehouseId !== "ALL" && balance.warehouseId !== query.warehouseId) {
        continue;
      }

      const medicine = this.medicines.find((m) => m.id === balance.medicineId);
      const warehouse = this.warehouses.find((w) => w.id === balance.warehouseId);
      if (!medicine || !warehouse) continue;

      const key: GroupKey = `${medicine.id}-${warehouse.id}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, { medicine, warehouse, balances: [] });
      }
      groupMap.get(key)!.balances.push(balance);
    }

    // Convert to summaries
    const summaries: MedicineInventorySummary[] = [];

    for (const { medicine, warehouse, balances } of groupMap.values()) {
      // Check query match (code, name, activeIngredient, or any batch lotNumber)
      if (normalizedQuery) {
        const matchesMed =
          medicine.code.toLocaleLowerCase("vi").includes(normalizedQuery) ||
          medicine.name.toLocaleLowerCase("vi").includes(normalizedQuery) ||
          (medicine.activeIngredient &&
            medicine.activeIngredient.toLocaleLowerCase("vi").includes(normalizedQuery));
        const matchesLot = balances.some((b) =>
          b.lotNumber.toLocaleLowerCase("vi").includes(normalizedQuery),
        );
        if (!matchesMed && !matchesLot) {
          continue;
        }
      }

      const onHandTotal = balances.reduce((sum, b) => sum + b.onHandQuantity, 0);
      const availableTotal = balances.reduce((sum, b) => sum + b.availableQuantity, 0);

      // Stock status filter
      if (query.stockStatus === "IN_STOCK" && onHandTotal <= 0) continue;
      if (query.stockStatus === "OUT_OF_STOCK" && onHandTotal > 0) continue;

      // Find nearest expiry date among active batches
      const activeBatches = balances.filter((b) => b.onHandQuantity > 0);
      let nearestExpiryDate: string | null = null;
      let worstExpiryStatus: "NORMAL" | "NEAR_EXPIRY" | "EXPIRED" = "NORMAL";

      if (activeBatches.length > 0) {
        const sorted = [...activeBatches].sort((a, b) =>
          a.expiryDate.localeCompare(b.expiryDate),
        );
        nearestExpiryDate = sorted[0].expiryDate;

        for (const b of activeBatches) {
          const st = getExpiryStatus(b.expiryDate, todayStr).status;
          if (st === "EXPIRED" || b.batchStatus === "EXPIRED") {
            worstExpiryStatus = "EXPIRED";
            break;
          } else if (st === "NEAR_EXPIRY") {
            worstExpiryStatus = "NEAR_EXPIRY";
          }
        }
      }

      // Expiry status filter
      if (query.expiryStatus !== "ALL" && worstExpiryStatus !== query.expiryStatus) {
        continue;
      }

      summaries.push({
        medicineId: medicine.id,
        medicineCode: medicine.code,
        medicineName: medicine.name,
        activeIngredient: medicine.activeIngredient,
        strength: medicine.strength,
        unitName: medicine.baseUnitName,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        onHandQuantity: onHandTotal,
        availableQuantity: availableTotal,
        batchCount: activeBatches.length,
        nearestExpiryDate,
        expiryStatus: worstExpiryStatus,
        minimumStock: medicine.minimumStock,
        isLowStock: availableTotal < medicine.minimumStock,
      });
    }

    // Sort by medicine code ASC
    summaries.sort((a, b) => a.medicineCode.localeCompare(b.medicineCode));

    const total = summaries.length;
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const page = Math.min(query.page, totalPages);
    const offset = (page - 1) * query.pageSize;

    return {
      items: summaries.slice(offset, offset + query.pageSize),
      page,
      pageSize: query.pageSize,
      total,
      totalPages,
    };
  }

  // Get Batches for a specific medicine
  async getMedicineBatches(
    medicineId: number,
    warehouseId?: number,
  ): Promise<InventoryBalance[]> {
    const todayStr = new Date().toISOString().split("T")[0];

    const list = this.balances.filter(
      (b) =>
        b.medicineId === medicineId &&
        (warehouseId === undefined || warehouseId === 0 || b.warehouseId === warehouseId),
    );

    // Refresh dynamic expiry status
    for (const b of list) {
      const exp = getExpiryStatus(b.expiryDate, todayStr);
      b.daysUntilExpiry = exp.daysUntilExpiry;
      b.expiryStatus =
        b.batchStatus === "EXPIRED" || exp.status === "EXPIRED"
          ? "EXPIRED"
          : exp.status;
      if (b.expiryStatus === "EXPIRED" || b.batchStatus !== "AVAILABLE") {
        b.availableQuantity = 0;
      }
    }

    // Sort by FEFO: expiryDate ASC, then batchId ASC
    list.sort((a, b) => {
      const cmp = a.expiryDate.localeCompare(b.expiryDate);
      if (cmp !== 0) return cmp;
      return a.batchId - b.batchId;
    });

    return list;
  }

  // Get FEFO candidate batches
  async getCandidateBatchesForFefo(
    warehouseId: number,
    medicineId: number,
  ): Promise<FefoCandidateBatch[]> {
    const todayStr = new Date().toISOString().split("T")[0];

    const balances = this.balances.filter(
      (b) => b.warehouseId === warehouseId && b.medicineId === medicineId,
    );

    const candidates: FefoCandidateBatch[] = [];

    for (const b of balances) {
      const batch = this.batches.find((item) => item.id === b.batchId);
      const isExpired = b.expiryDate < todayStr || b.batchStatus === "EXPIRED";
      const status: BatchStatus = isExpired ? "EXPIRED" : b.batchStatus;
      const availableQuantity =
        status === "AVAILABLE" && !isExpired
          ? b.onHandQuantity - b.reservedQuantity
          : 0;

      candidates.push({
        batchId: b.batchId,
        lotNumber: b.lotNumber,
        expiryDate: b.expiryDate,
        receivedAt: batch?.receivedAt || b.manufacturingDate || todayStr,
        availableQuantity: Math.max(0, availableQuantity),
        status,
      });
    }

    return candidates;
  }

  // Batch Traceability
  async getBatchTraceability(batchId: number): Promise<BatchTraceability | null> {
    const batch = this.batches.find((b) => b.id === batchId);
    if (!batch) return null;

    const currentBalances = this.balances
      .filter((b) => b.batchId === batchId)
      .map((b) => ({
        warehouseId: b.warehouseId,
        warehouseName: b.warehouseName,
        onHandQuantity: b.onHandQuantity,
        availableQuantity: b.availableQuantity,
      }));

    // Find in receipts
    const receiptHistory: BatchTraceability["receiptHistory"] = [];
    for (const rc of this.receipts) {
      const matchingItems = (rc.items || []).filter((item) => item.batchId === batchId);
      for (const item of matchingItems) {
        receiptHistory.push({
          receiptId: rc.id,
          receiptCode: rc.receiptCode,
          receiptDate: rc.receiptDate,
          supplierName: rc.supplierName,
          quantity: item.quantity,
          unitCost: item.unitCost,
        });
      }
    }

    // Find in issues
    const issueHistory: BatchTraceability["issueHistory"] = [];
    for (const is of this.issues) {
      for (const item of is.items || []) {
        for (const alloc of item.allocations || []) {
          if (alloc.batchId === batchId) {
            issueHistory.push({
              issueId: is.id,
              issueCode: is.issueCode,
              issueDate: is.issueDate,
              receiver: is.receiver,
              departmentName: is.departmentName,
              quantity: alloc.allocatedQuantity,
            });
          }
        }
      }
    }

    // Find movements
    const movements = this.movements
      .filter((m) => m.batchId === batchId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      batch,
      currentBalances,
      receiptHistory,
      issueHistory,
      movements,
    };
  }

  // Stock Receipts (Nhập kho)
  async listReceipts(query: Required<StockReceiptListQuery>): Promise<StockReceiptPage> {
    const normalized = query.query.toLocaleLowerCase("vi").trim();

    const filtered = this.receipts.filter((rc) => {
      if (query.warehouseId !== "ALL" && rc.warehouseId !== query.warehouseId) {
        return false;
      }
      if (query.status !== "ALL" && rc.status !== query.status) {
        return false;
      }
      if (query.fromDate && rc.receiptDate < query.fromDate) {
        return false;
      }
      if (query.toDate && rc.receiptDate > query.toDate) {
        return false;
      }
      if (normalized) {
        const matchesCode = rc.receiptCode.toLocaleLowerCase("vi").includes(normalized);
        const matchesSupplier = rc.supplierName.toLocaleLowerCase("vi").includes(normalized);
        const matchesDoc = (rc.documentNumber || "").toLocaleLowerCase("vi").includes(normalized);
        if (!matchesCode && !matchesSupplier && !matchesDoc) return false;
      }
      return true;
    });

    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const page = Math.min(query.page, totalPages);
    const offset = (page - 1) * query.pageSize;

    return {
      items: filtered.slice(offset, offset + query.pageSize),
      page,
      pageSize: query.pageSize,
      total,
      totalPages,
    };
  }

  async getReceiptById(id: number): Promise<StockReceipt | null> {
    const receipt = this.receipts.find((r) => r.id === id);
    return receipt ? { ...receipt } : null;
  }

  async createReceipt(input: StockReceiptInput, creatorName: string): Promise<StockReceipt> {
    const warehouse = this.warehouses.find((w) => w.id === input.warehouseId);
    if (!warehouse) throw new AppError("NOT_FOUND", "Kho nhận không tồn tại.");

    const supplier = this.suppliers.find((s) => s.id === input.supplierId);
    if (!supplier) throw new AppError("NOT_FOUND", "Nhà cung cấp không tồn tại.");

    if (!input.items || input.items.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Phiếu nhập phải có ít nhất 1 mặt hàng.");
    }

    const receiptId = Math.max(0, ...this.receipts.map((r) => r.id)) + 1;
    const receiptCode =
      input.receiptCode?.trim() ||
      `PN-${new Date().getFullYear()}-${String(receiptId).padStart(4, "0")}`;

    const items: StockReceiptItem[] = [];
    let totalQuantity = 0;

    for (let i = 0; i < input.items.length; i++) {
      const itemInput = input.items[i];
      const medicine = this.medicines.find((m) => m.id === itemInput.medicineId);
      if (!medicine) {
        throw new AppError(
          "NOT_FOUND",
          `Thuốc (ID: ${itemInput.medicineId}) không tồn tại trong danh mục.`,
        );
      }

      if (itemInput.quantity <= 0) {
        throw new AppError("VALIDATION_ERROR", "Số lượng nhập phải lớn hơn 0.");
      }

      const unitCost = Number(itemInput.unitCost || 0);
      const totalCost = itemInput.quantity * unitCost;

      items.push({
        id: i + 1,
        receiptId,
        medicineId: medicine.id,
        medicineCode: medicine.code,
        medicineName: medicine.name,
        unitName: medicine.baseUnitName,
        lotNumber: itemInput.lotNumber.trim(),
        manufacturingDate: itemInput.manufacturingDate || null,
        expiryDate: itemInput.expiryDate.trim(),
        quantity: itemInput.quantity,
        unitCost,
        totalCost,
        note: itemInput.note || null,
      });

      totalQuantity += itemInput.quantity;
    }

    const now = new Date().toISOString();
    const newReceipt: StockReceipt = {
      id: receiptId,
      receiptCode,
      warehouseId: warehouse.id,
      warehouseCode: warehouse.code,
      warehouseName: warehouse.name,
      supplierId: supplier.id,
      supplierName: supplier.name,
      receiptDate: input.receiptDate,
      documentNumber: input.documentNumber || null,
      status: "DRAFT", // Must start as DRAFT
      note: input.note || null,
      totalItems: items.length,
      totalQuantity,
      createdBy: creatorName,
      createdAt: now,
      items,
    };

    this.receipts.push(newReceipt);
    return { ...newReceipt };
  }

  async confirmReceipt(id: number, actorName: string): Promise<StockReceipt> {
    const receipt = this.receipts.find((r) => r.id === id);
    if (!receipt) throw new AppError("NOT_FOUND", "Không tìm thấy phiếu nhập kho.");

    if (receipt.status === "CONFIRMED") {
      throw new AppError("CONFLICT", "Phiếu nhập kho này đã được xác nhận trước đó.");
    }
    if (receipt.status === "CANCELLED") {
      throw new AppError("CONFLICT", "Phiếu nhập kho này đã bị hủy, không thể xác nhận.");
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const lock = await this.acquireLock(`receipt-${id}`);

    try {
      // Validate all items before making any modifications
      for (const item of receipt.items || []) {
        if (item.quantity <= 0) {
          throw new AppError(
            "VALIDATION_ERROR",
            `Mặt hàng ${item.medicineName} có số lượng không hợp lệ (<= 0).`,
          );
        }
        if (item.expiryDate < todayStr) {
          throw new AppError(
            "CONFLICT",
            `Thuốc ${item.medicineName} (Lô: ${item.lotNumber}) đã hết hạn sử dụng (${item.expiryDate}). Không được nhập vào tồn khả dụng.`,
          );
        }

        // Check duplicate lot with different expiry date
        const existingBatchSameLot = this.batches.find(
          (b) =>
            b.medicineId === item.medicineId &&
            b.lotNumber.toUpperCase() === item.lotNumber.toUpperCase(),
        );
        if (existingBatchSameLot && existingBatchSameLot.expiryDate !== item.expiryDate) {
          throw new AppError(
            "CONFLICT",
            `Số lô ${item.lotNumber} của thuốc ${item.medicineName} đã tồn tại với hạn dùng khác (${existingBatchSameLot.expiryDate}). Không thể tự động gộp lô.`,
          );
        }
      }

      // Begin atomic updates
      const now = new Date().toISOString();

      for (const item of receipt.items || []) {
        // 1. Reuse or Create Batch
        let batch = this.batches.find(
          (b) =>
            b.medicineId === item.medicineId &&
            b.lotNumber.toUpperCase() === item.lotNumber.toUpperCase() &&
            b.expiryDate === item.expiryDate,
        );

        if (!batch) {
          const newBatchId = Math.max(0, ...this.batches.map((b) => b.id)) + 1;
          batch = {
            id: newBatchId,
            medicineId: item.medicineId,
            medicineCode: item.medicineCode,
            medicineName: item.medicineName,
            lotNumber: item.lotNumber,
            manufacturingDate: item.manufacturingDate,
            expiryDate: item.expiryDate,
            status: "AVAILABLE",
            supplierId: receipt.supplierId,
            supplierName: receipt.supplierName,
            receivedAt: receipt.receiptDate,
            createdAt: now,
          };
          this.batches.push(batch);
        }

        item.batchId = batch.id;

        // 2. Increase Inventory Balance
        let balance = this.balances.find(
          (b) => b.warehouseId === receipt.warehouseId && b.batchId === batch!.id,
        );

        const expStatus = getExpiryStatus(batch.expiryDate, todayStr);
        const qtyBefore = balance ? balance.onHandQuantity : 0;
        const qtyAfter = qtyBefore + item.quantity;

        if (balance) {
          balance.onHandQuantity = qtyAfter;
          balance.availableQuantity = Math.max(0, qtyAfter - balance.reservedQuantity);
          balance.batchStatus = batch.status;
          balance.expiryStatus = expStatus.status;
          balance.daysUntilExpiry = expStatus.daysUntilExpiry;
        } else {
          const newBalanceId = Math.max(0, ...this.balances.map((b) => b.id)) + 1;
          balance = {
            id: newBalanceId,
            warehouseId: receipt.warehouseId,
            warehouseCode: receipt.warehouseCode,
            warehouseName: receipt.warehouseName,
            medicineId: item.medicineId,
            medicineCode: item.medicineCode,
            medicineName: item.medicineName,
            medicineStrength: null,
            medicineActiveIngredient: null,
            unitName: item.unitName,
            batchId: batch.id,
            lotNumber: batch.lotNumber,
            manufacturingDate: batch.manufacturingDate,
            expiryDate: batch.expiryDate,
            batchStatus: batch.status,
            onHandQuantity: qtyAfter,
            reservedQuantity: 0,
            availableQuantity: qtyAfter,
            expiryStatus: expStatus.status,
            daysUntilExpiry: expStatus.daysUntilExpiry,
          };
          this.balances.push(balance);
        }

        // 3. Create Stock Movement Ledger
        const movementId = Math.max(0, ...this.movements.map((m) => m.id)) + 1;
        this.movements.push({
          id: movementId,
          warehouseId: receipt.warehouseId,
          warehouseName: receipt.warehouseName,
          medicineId: item.medicineId,
          medicineCode: item.medicineCode,
          medicineName: item.medicineName,
          batchId: batch.id,
          lotNumber: batch.lotNumber,
          movementType: "STOCK_IN",
          quantity: item.quantity,
          quantityBefore: qtyBefore,
          quantityAfter: qtyAfter,
          referenceType: "PHIEU_NHAP",
          referenceId: receipt.id,
          referenceCode: receipt.receiptCode,
          performedBy: actorName,
          createdAt: now,
        });
      }

      // Mark receipt CONFIRMED
      receipt.status = "CONFIRMED";
      receipt.confirmedBy = actorName;
      receipt.confirmedAt = now;

      return { ...receipt };
    } finally {
      lock();
    }
  }

  async cancelReceipt(id: number, actorName: string): Promise<StockReceipt> {
    const receipt = this.receipts.find((r) => r.id === id);
    if (!receipt) throw new AppError("NOT_FOUND", "Không tìm thấy phiếu nhập kho.");

    if (receipt.status === "CANCELLED") {
      throw new AppError("CONFLICT", "Phiếu nhập kho này đã ở trạng thái hủy.");
    }

    const lock = await this.acquireLock(`receipt-${id}`);
    try {
      if (receipt.status === "DRAFT") {
        receipt.status = "CANCELLED";
        return { ...receipt };
      }

      // If CONFIRMED, check if stock reversal is possible
      // Available stock must be >= receipt item quantity for all items
      for (const item of receipt.items || []) {
        if (!item.batchId) continue;
        const balance = this.balances.find(
          (b) => b.warehouseId === receipt.warehouseId && b.batchId === item.batchId,
        );
        const currentOnHand = balance ? balance.onHandQuantity : 0;
        if (currentOnHand < item.quantity) {
          throw new AppError(
            "CONFLICT",
            `Không thể hủy phiếu nhập. Lô ${item.lotNumber} của ${item.medicineName} chỉ còn ${currentOnHand} (đã xuất bớt ${item.quantity - currentOnHand}). Việc hủy phiếu sẽ làm tồn âm!`,
          );
        }
      }

      // Perform reversal
      const now = new Date().toISOString();
      for (const item of receipt.items || []) {
        if (!item.batchId) continue;
        const balance = this.balances.find(
          (b) => b.warehouseId === receipt.warehouseId && b.batchId === item.batchId,
        );
        if (!balance) continue;

        const qtyBefore = balance.onHandQuantity;
        const qtyAfter = qtyBefore - item.quantity;
        balance.onHandQuantity = qtyAfter;
        balance.availableQuantity = Math.max(0, qtyAfter - balance.reservedQuantity);

        const movementId = Math.max(0, ...this.movements.map((m) => m.id)) + 1;
        this.movements.push({
          id: movementId,
          warehouseId: receipt.warehouseId,
          warehouseName: receipt.warehouseName,
          medicineId: item.medicineId,
          medicineCode: item.medicineCode,
          medicineName: item.medicineName,
          batchId: item.batchId,
          lotNumber: item.lotNumber,
          movementType: "STOCK_IN_REVERSAL",
          quantity: -item.quantity,
          quantityBefore: qtyBefore,
          quantityAfter: qtyAfter,
          referenceType: "PHIEU_NHAP",
          referenceId: receipt.id,
          referenceCode: receipt.receiptCode,
          performedBy: actorName,
          createdAt: now,
        });
      }

      receipt.status = "CANCELLED";
      return { ...receipt };
    } finally {
      lock();
    }
  }

  // Stock Issues (Xuất kho)
  async listIssues(query: Required<StockIssueListQuery>): Promise<StockIssuePage> {
    const normalized = query.query.toLocaleLowerCase("vi").trim();

    const filtered = this.issues.filter((is) => {
      if (query.warehouseId !== "ALL" && is.warehouseId !== query.warehouseId) {
        return false;
      }
      if (query.status !== "ALL" && is.status !== query.status) {
        return false;
      }
      if (query.issueType !== "ALL" && is.issueType !== query.issueType) {
        return false;
      }
      if (query.fromDate && is.issueDate < query.fromDate) {
        return false;
      }
      if (query.toDate && is.issueDate > query.toDate) {
        return false;
      }
      if (normalized) {
        const matchesCode = is.issueCode.toLocaleLowerCase("vi").includes(normalized);
        const matchesReceiver = is.receiver.toLocaleLowerCase("vi").includes(normalized);
        const matchesDept = (is.departmentName || "")
          .toLocaleLowerCase("vi")
          .includes(normalized);
        const matchesMedicine = (is.items || []).some(
          (item) =>
            item.medicineCode.toLocaleLowerCase("vi").includes(normalized) ||
            item.medicineName.toLocaleLowerCase("vi").includes(normalized),
        );
        if (!matchesCode && !matchesReceiver && !matchesDept && !matchesMedicine) {
          return false;
        }
      }
      return true;
    });

    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const page = Math.min(query.page, totalPages);
    const offset = (page - 1) * query.pageSize;

    return {
      items: filtered.slice(offset, offset + query.pageSize),
      page,
      pageSize: query.pageSize,
      total,
      totalPages,
    };
  }

  async getIssueById(id: number): Promise<StockIssue | null> {
    const issue = this.issues.find((i) => i.id === id);
    return issue ? { ...issue } : null;
  }

  async createIssue(input: StockIssueInput, creatorName: string): Promise<StockIssue> {
    const warehouse = this.warehouses.find((w) => w.id === input.warehouseId);
    if (!warehouse) throw new AppError("NOT_FOUND", "Kho xuất không tồn tại.");

    let departmentName: string | null = null;
    if (input.departmentId) {
      const dept = this.departments.find((d) => d.id === input.departmentId);
      departmentName = dept?.name || null;
    }

    if (!input.items || input.items.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Phiếu xuất phải có ít nhất 1 mặt hàng.");
    }

    const issueId = Math.max(0, ...this.issues.map((i) => i.id)) + 1;
    const issueCode =
      input.issueCode?.trim() ||
      `PX-${new Date().getFullYear()}-${String(issueId).padStart(4, "0")}`;

    const items: StockIssueItem[] = [];
    let totalQuantity = 0;

    for (let i = 0; i < input.items.length; i++) {
      const itemInput = input.items[i];
      const medicine = this.medicines.find((m) => m.id === itemInput.medicineId);
      if (!medicine) {
        throw new AppError(
          "NOT_FOUND",
          `Thuốc (ID: ${itemInput.medicineId}) không tồn tại trong danh mục.`,
        );
      }

      if (itemInput.requestedQuantity <= 0) {
        throw new AppError("VALIDATION_ERROR", "Số lượng xuất phải lớn hơn 0.");
      }

      // Build allocations (draft proposal)
      const allocations: StockIssueAllocation[] = [];
      if (itemInput.allocations && itemInput.allocations.length > 0) {
        for (let j = 0; j < itemInput.allocations.length; j++) {
          const alloc = itemInput.allocations[j];
          const batch = this.batches.find((b) => b.id === alloc.batchId);
          allocations.push({
            id: j + 1,
            issueItemId: i + 1,
            batchId: alloc.batchId,
            lotNumber: batch?.lotNumber || `LOT-${alloc.batchId}`,
            expiryDate: batch?.expiryDate || "",
            allocatedQuantity: alloc.allocatedQuantity,
            isFefoOverride: Boolean(alloc.isFefoOverride),
            overrideReason: alloc.overrideReason || null,
          });
        }
      }

      items.push({
        id: i + 1,
        issueId,
        medicineId: medicine.id,
        medicineCode: medicine.code,
        medicineName: medicine.name,
        unitName: medicine.baseUnitName,
        requestedQuantity: itemInput.requestedQuantity,
        note: itemInput.note || null,
        allocations,
      });

      totalQuantity += itemInput.requestedQuantity;
    }

    const now = new Date().toISOString();
    const newIssue: StockIssue = {
      id: issueId,
      issueCode,
      warehouseId: warehouse.id,
      warehouseCode: warehouse.code,
      warehouseName: warehouse.name,
      issueDate: input.issueDate,
      issueType: input.issueType,
      receiver: input.receiver.trim(),
      departmentId: input.departmentId || null,
      departmentName,
      status: "DRAFT", // DRAFT does not touch inventory
      note: input.note || null,
      totalItems: items.length,
      totalQuantity,
      createdBy: creatorName,
      createdAt: now,
      items,
    };

    this.issues.push(newIssue);
    return { ...newIssue };
  }

  async confirmIssue(id: number, actorName: string): Promise<StockIssue> {
    const issue = this.issues.find((i) => i.id === id);
    if (!issue) throw new AppError("NOT_FOUND", "Không tìm thấy phiếu xuất kho.");

    if (issue.status === "CONFIRMED") {
      throw new AppError("CONFLICT", "Phiếu xuất kho này đã được xác nhận trước đó.");
    }
    if (issue.status === "CANCELLED") {
      throw new AppError("CONFLICT", "Phiếu xuất kho này đã bị hủy, không thể xác nhận.");
    }

    const lock = await this.acquireLock(`issue-${id}`);
    try {
      const todayStr = new Date().toISOString().split("T")[0];

      // 1. Recalculate FEFO on backend and lock relevant inventory rows
      for (const item of issue.items || []) {
        const candidates = await this.getCandidateBatchesForFefo(
          issue.warehouseId,
          item.medicineId,
        );

        let finalProposal: {
          allocations: StockIssueAllocation[];
        };

        const hasManualOverrides = (item.allocations || []).some((a) => a.isFefoOverride);

        if (hasManualOverrides) {
          const result = this.fefoService.allocateWithOverrides(
            item.medicineId,
            item.requestedQuantity,
            candidates,
            item.allocations,
            { today: todayStr },
          );
          finalProposal = {
            allocations: result.allocations.map((a, idx) => ({
              id: idx + 1,
              issueItemId: item.id,
              batchId: a.batchId,
              lotNumber: a.lotNumber,
              expiryDate: a.expiryDate,
              allocatedQuantity: a.allocatedQuantity,
              isFefoOverride: a.isFefoOverride,
              overrideReason: a.overrideReason || null,
            })),
          };
        } else {
          // Standard FEFO recalculation on backend
          const result = this.fefoService.allocate(
            item.medicineId,
            item.requestedQuantity,
            candidates,
            { today: todayStr },
          );

          if (result.insufficient) {
            throw new AppError(
              "CONFLICT",
              `Không đủ tồn kho để xuất thuốc ${item.medicineName}. Tồn khả dụng: ${result.availableStock}, Yêu cầu: ${item.requestedQuantity}, Còn thiếu: ${result.missingQuantity}.`,
            );
          }

          finalProposal = {
            allocations: result.allocations.map((a, idx) => ({
              id: idx + 1,
              issueItemId: item.id,
              batchId: a.batchId,
              lotNumber: a.lotNumber,
              expiryDate: a.expiryDate,
              allocatedQuantity: a.allocatedQuantity,
              isFefoOverride: false,
              overrideReason: null,
            })),
          };
        }

        // Apply allocations to issue item
        item.allocations = finalProposal.allocations;

        // Verify that stock is sufficient and decrease balances
        for (const alloc of item.allocations) {
          const balance = this.balances.find(
            (b) => b.warehouseId === issue.warehouseId && b.batchId === alloc.batchId,
          );
          if (!balance) {
            throw new AppError(
              "NOT_FOUND",
              `Không tìm thấy bản ghi tồn kho cho lô ${alloc.lotNumber}.`,
            );
          }

          if (balance.batchStatus !== "AVAILABLE") {
            throw new AppError(
              "CONFLICT",
              `Lô ${alloc.lotNumber} đang ở trạng thái ${balance.batchStatus}, không thể xuất.`,
            );
          }

          if (balance.expiryDate < todayStr) {
            throw new AppError(
              "CONFLICT",
              `Lô ${alloc.lotNumber} đã hết hạn (${balance.expiryDate}), không thể xuất.`,
            );
          }

          if (balance.availableQuantity < alloc.allocatedQuantity) {
            throw new AppError(
              "CONFLICT",
              `Lô ${alloc.lotNumber} không đủ tồn khả dụng (hiện còn ${balance.availableQuantity}, cần xuất ${alloc.allocatedQuantity}).`,
            );
          }
        }
      }

      // Execute atomic balance decrease and stock movements
      const now = new Date().toISOString();

      for (const item of issue.items || []) {
        for (const alloc of item.allocations) {
          const balance = this.balances.find(
            (b) => b.warehouseId === issue.warehouseId && b.batchId === alloc.batchId,
          )!;

          const qtyBefore = balance.onHandQuantity;
          const qtyAfter = qtyBefore - alloc.allocatedQuantity;

          if (qtyAfter < 0) {
            throw new AppError("CONFLICT", "Thao tác xuất kho làm tồn kho âm! Đã hủy giao dịch.");
          }

          balance.onHandQuantity = qtyAfter;
          balance.availableQuantity = Math.max(0, qtyAfter - balance.reservedQuantity);

          const movementId = Math.max(0, ...this.movements.map((m) => m.id)) + 1;
          this.movements.push({
            id: movementId,
            warehouseId: issue.warehouseId,
            warehouseName: issue.warehouseName,
            medicineId: item.medicineId,
            medicineCode: item.medicineCode,
            medicineName: item.medicineName,
            batchId: alloc.batchId,
            lotNumber: alloc.lotNumber,
            movementType: "STOCK_OUT",
            quantity: -alloc.allocatedQuantity,
            quantityBefore: qtyBefore,
            quantityAfter: qtyAfter,
            referenceType: "PHIEU_XUAT",
            referenceId: issue.id,
            referenceCode: issue.issueCode,
            performedBy: actorName,
            createdAt: now,
          });
        }
      }

      issue.status = "CONFIRMED";
      issue.confirmedBy = actorName;
      issue.confirmedAt = now;

      return { ...issue };
    } finally {
      lock();
    }
  }

  async cancelIssue(id: number, actorName: string): Promise<StockIssue> {
    const issue = this.issues.find((i) => i.id === id);
    if (!issue) throw new AppError("NOT_FOUND", "Không tìm thấy phiếu xuất kho.");

    if (issue.status === "CANCELLED") {
      throw new AppError("CONFLICT", "Phiếu xuất kho này đã bị hủy.");
    }

    const lock = await this.acquireLock(`issue-${id}`);
    try {
      if (issue.status === "DRAFT") {
        issue.status = "CANCELLED";
        return { ...issue };
      }

      // If CONFIRMED, restore stock via STOCK_OUT_REVERSAL
      const now = new Date().toISOString();
      for (const item of issue.items || []) {
        for (const alloc of item.allocations || []) {
          const balance = this.balances.find(
            (b) => b.warehouseId === issue.warehouseId && b.batchId === alloc.batchId,
          );
          if (!balance) continue;

          const qtyBefore = balance.onHandQuantity;
          const qtyAfter = qtyBefore + alloc.allocatedQuantity;
          balance.onHandQuantity = qtyAfter;
          balance.availableQuantity = Math.max(0, qtyAfter - balance.reservedQuantity);

          const movementId = Math.max(0, ...this.movements.map((m) => m.id)) + 1;
          this.movements.push({
            id: movementId,
            warehouseId: issue.warehouseId,
            warehouseName: issue.warehouseName,
            medicineId: item.medicineId,
            medicineCode: item.medicineCode,
            medicineName: item.medicineName,
            batchId: alloc.batchId,
            lotNumber: alloc.lotNumber,
            movementType: "STOCK_OUT_REVERSAL",
            quantity: alloc.allocatedQuantity,
            quantityBefore: qtyBefore,
            quantityAfter: qtyAfter,
            referenceType: "PHIEU_XUAT",
            referenceId: issue.id,
            referenceCode: issue.issueCode,
            performedBy: actorName,
            createdAt: now,
          });
        }
      }

      issue.status = "CANCELLED";
      return { ...issue };
    } finally {
      lock();
    }
  }

  // Movements (Sổ giao dịch kho)
  async listMovements(filter?: {
    warehouseId?: number;
    medicineId?: number;
    batchId?: number;
    limit?: number;
  }): Promise<StockMovement[]> {
    let list = [...this.movements];
    if (filter?.warehouseId) {
      list = list.filter((m) => m.warehouseId === filter.warehouseId);
    }
    if (filter?.medicineId) {
      list = list.filter((m) => m.medicineId === filter.medicineId);
    }
    if (filter?.batchId) {
      list = list.filter((m) => m.batchId === filter.batchId);
    }

    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (filter?.limit) {
      list = list.slice(0, filter.limit);
    }
    return list;
  }
}
