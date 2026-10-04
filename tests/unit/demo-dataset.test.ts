import { describe, expect, it } from "vitest";

import { createStandardDemoData } from "@/lib/demo";

describe("Standard Demo Data Generator", () => {
  it("generates a complete, internally consistent STANDARD demo dataset", () => {
    const data = createStandardDemoData();

    // 1. Master Data Counts
    expect(data.warehouses).toHaveLength(3);
    expect(data.suppliers).toHaveLength(6);
    expect(data.departments).toHaveLength(7);
    expect(data.medicines).toHaveLength(20);
    expect(data.medicineOptions).toHaveLength(20);

    // 2. Batches & Balances
    expect(data.batches.length).toBeGreaterThanOrEqual(25);
    expect(data.balances.length).toBeGreaterThanOrEqual(30);

    // 3. Document Counts
    expect(data.receipts).toHaveLength(4);
    expect(data.issues).toHaveLength(4);
    expect(data.movements.length).toBeGreaterThanOrEqual(6);

    // 4. Verify Referential Integrity: Every batch references a valid medicine and supplier
    const medicineIds = new Set(data.medicines.map((m) => m.id));
    const warehouseIds = new Set(data.warehouses.map((w) => w.id));
    const supplierIds = new Set(data.suppliers.map((s) => s.id));
    const batchIds = new Set(data.batches.map((b) => b.id));

    for (const batch of data.batches) {
      expect(medicineIds.has(batch.medicineId)).toBe(true);
      if (batch.supplierId) {
        expect(supplierIds.has(batch.supplierId)).toBe(true);
      }
      expect(batch.lotNumber).toBeTruthy();
      expect(batch.expiryDate).toBeTruthy();
    }

    // 5. Verify Balances Integrity: Every balance references a valid warehouse, medicine, and batch
    for (const balance of data.balances) {
      expect(warehouseIds.has(balance.warehouseId)).toBe(true);
      expect(medicineIds.has(balance.medicineId)).toBe(true);
      expect(batchIds.has(balance.batchId)).toBe(true);

      // No negative balances
      expect(balance.onHandQuantity).toBeGreaterThanOrEqual(0);
      expect(balance.reservedQuantity).toBeGreaterThanOrEqual(0);
      expect(balance.availableQuantity).toBeGreaterThanOrEqual(0);

      // Expired or Quarantined batches must have 0 available quantity
      if (balance.batchStatus === "EXPIRED" || balance.batchStatus === "QUARANTINE") {
        expect(balance.availableQuantity).toBe(0);
      } else {
        expect(balance.availableQuantity).toBe(
          balance.onHandQuantity - balance.reservedQuantity,
        );
      }
    }

    // 6. Verify Status Coverage across Receipts and Issues
    const receiptStatuses = new Set(data.receipts.map((r) => r.status));
    expect(receiptStatuses.has("DRAFT")).toBe(true);
    expect(receiptStatuses.has("CONFIRMED")).toBe(true);
    expect(receiptStatuses.has("CANCELLED")).toBe(true);

    const issueStatuses = new Set(data.issues.map((i) => i.status));
    expect(issueStatuses.has("DRAFT")).toBe(true);
    expect(issueStatuses.has("CONFIRMED")).toBe(true);
    expect(issueStatuses.has("CANCELLED")).toBe(true);

    // 7. Verify FEFO Override scenario exists with reason
    const hasFefoOverride = data.issues.some((issue) =>
      issue.items?.some((item) =>
        item.allocations?.some((alloc) => alloc.isFefoOverride && alloc.overrideReason),
      ),
    );
    expect(hasFefoOverride).toBe(true);

    // 8. Verify Receipt line cost calculations: totalCost = quantity * unitCost
    for (const receipt of data.receipts) {
      if (receipt.items) {
        for (const item of receipt.items) {
          expect(item.totalCost).toBe(item.quantity * item.unitCost);
        }
      }
    }
  });

  it("produces fresh cloned copies so mutations in one repository do not pollute another", () => {
    const copy1 = createStandardDemoData();
    const copy2 = createStandardDemoData();

    copy1.medicines[0].name = "Mutated Name";
    expect(copy2.medicines[0].name).not.toBe("Mutated Name");
  });

  it("covers all 3 warehouses with distributed stock", () => {
    const data = createStandardDemoData();
    const warehousesWithStock = new Set(data.balances.map((b) => b.warehouseId));

    expect(warehousesWithStock.has(1)).toBe(true); // Kho Chẵn
    expect(warehousesWithStock.has(2)).toBe(true); // Kho Lẻ
    expect(warehousesWithStock.has(3)).toBe(true); // Kho Cấp Cứu
  });
});
