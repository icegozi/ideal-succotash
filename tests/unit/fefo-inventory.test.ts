import { describe, expect, it } from "vitest";

import { InMemoryInventoryRepository } from "@/modules/inventory/repositories/in-memory-inventory.repository";
import { FefoAllocationService } from "@/modules/inventory/services/fefo-allocation.service";
import { StockInService } from "@/modules/inventory/services/stock-in.service";
import { StockOutService } from "@/modules/inventory/services/stock-out.service";
import type { FefoCandidateBatch } from "@/modules/inventory/types/inventory.types";

describe("FEFO Allocation Service", () => {
  const fefoService = new FefoAllocationService();
  const testDate = "2026-10-04";

  // CASE 1: Standard FEFO splitting across batches
  it("CASE 1: allocates strictly according to earliest expiry date first", () => {
    const candidates: FefoCandidateBatch[] = [
      {
        batchId: 2,
        lotNumber: "LOT-B",
        expiryDate: "2026-12-01",
        receivedAt: "2026-05-01",
        availableQuantity: 50,
        status: "AVAILABLE",
      },
      {
        batchId: 1,
        lotNumber: "LOT-A",
        expiryDate: "2026-11-01",
        receivedAt: "2026-04-01",
        availableQuantity: 30,
        status: "AVAILABLE",
      },
    ];

    const result = fefoService.allocate(1, 70, candidates, { today: testDate });

    expect(result.insufficient).toBe(false);
    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0].lotNumber).toBe("LOT-A");
    expect(result.allocations[0].allocatedQuantity).toBe(30);
    expect(result.allocations[1].lotNumber).toBe("LOT-B");
    expect(result.allocations[1].allocatedQuantity).toBe(40);
  });

  // CASE 2: Expired lot must be excluded
  it("CASE 2: excludes expired batches even if they have stock", () => {
    const candidates: FefoCandidateBatch[] = [
      {
        batchId: 1,
        lotNumber: "LOT-A",
        expiryDate: "2026-09-01", // Past date (expired relative to 2026-10-04)
        receivedAt: "2026-01-01",
        availableQuantity: 100,
        status: "AVAILABLE",
      },
      {
        batchId: 2,
        lotNumber: "LOT-B",
        expiryDate: "2026-12-01",
        receivedAt: "2026-05-01",
        availableQuantity: 30,
        status: "AVAILABLE",
      },
    ];

    const result = fefoService.allocate(1, 20, candidates, { today: testDate });

    expect(result.insufficient).toBe(false);
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].lotNumber).toBe("LOT-B");
    expect(result.allocations[0].allocatedQuantity).toBe(20);
  });

  // CASE 3: Quarantine lot must be excluded
  it("CASE 3: excludes QUARANTINE batches from allocation", () => {
    const candidates: FefoCandidateBatch[] = [
      {
        batchId: 1,
        lotNumber: "LOT-A",
        expiryDate: "2026-11-01",
        receivedAt: "2026-01-01",
        availableQuantity: 100,
        status: "QUARANTINE",
      },
      {
        batchId: 2,
        lotNumber: "LOT-B",
        expiryDate: "2026-12-01",
        receivedAt: "2026-05-01",
        availableQuantity: 20,
        status: "AVAILABLE",
      },
    ];

    const result = fefoService.allocate(1, 20, candidates, { today: testDate });

    expect(result.insufficient).toBe(false);
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].lotNumber).toBe("LOT-B");
    expect(result.allocations[0].allocatedQuantity).toBe(20);
  });

  // CASE 4: Insufficient stock raises flag and reports missing quantity
  it("CASE 4: flags insufficient stock when requested quantity exceeds available stock", () => {
    const candidates: FefoCandidateBatch[] = [
      {
        batchId: 1,
        lotNumber: "LOT-A",
        expiryDate: "2026-11-01",
        receivedAt: "2026-04-01",
        availableQuantity: 50,
        status: "AVAILABLE",
      },
    ];

    const result = fefoService.allocate(1, 100, candidates, { today: testDate });

    expect(result.insufficient).toBe(true);
    expect(result.availableStock).toBe(50);
    expect(result.missingQuantity).toBe(50);
  });

  // CASE 8: Expired batch cannot be issued
  it("CASE 8: cannot allocate when only expired batches exist", () => {
    const candidates: FefoCandidateBatch[] = [
      {
        batchId: 1,
        lotNumber: "LOT-A",
        expiryDate: "2026-08-01",
        receivedAt: "2026-01-01",
        availableQuantity: 50,
        status: "EXPIRED",
      },
    ];

    const result = fefoService.allocate(1, 10, candidates, { today: testDate });

    expect(result.insufficient).toBe(true);
    expect(result.availableStock).toBe(0);
    expect(result.allocations).toHaveLength(0);
  });

  // CASE 9: Ties in expiry date sort by receivedAt ASC
  it("CASE 9: breaks tie in expiry date using receivedAt ASC", () => {
    const candidates: FefoCandidateBatch[] = [
      {
        batchId: 2,
        lotNumber: "LOT-NEW",
        expiryDate: "2026-12-01",
        receivedAt: "2026-06-01",
        availableQuantity: 50,
        status: "AVAILABLE",
      },
      {
        batchId: 1,
        lotNumber: "LOT-OLD",
        expiryDate: "2026-12-01",
        receivedAt: "2026-02-01",
        availableQuantity: 50,
        status: "AVAILABLE",
      },
    ];

    const result = fefoService.allocate(1, 30, candidates, { today: testDate });

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].lotNumber).toBe("LOT-OLD");
    expect(result.allocations[0].allocatedQuantity).toBe(30);
  });
});

describe("Stock-In and Stock-Out Workflow Integration", () => {
  // CASE 6: Stock-in confirm updates inventory, movement, and marks CONFIRMED
  it("CASE 6: confirms stock-in, increases inventory balance and records movement", async () => {
    const repo = new InMemoryInventoryRepository();
    const stockInService = new StockInService(repo);

    const receipt = await stockInService.createReceipt(
      {
        warehouseId: 1,
        supplierId: 1,
        receiptDate: "2026-10-04",
        documentNumber: "TEST-DOC-01",
        items: [
          {
            medicineId: 1,
            lotNumber: "NEW-PARA-99",
            manufacturingDate: "2026-01-01",
            expiryDate: "2027-01-01",
            quantity: 100,
            unitCost: 200,
          },
        ],
      },
      "Tester",
    );

    expect(receipt.status).toBe("DRAFT");

    // DRAFT does not yet appear in movements
    const preMovements = await repo.listMovements({ medicineId: 1 });
    const preHasDoc = preMovements.some((m) => m.referenceCode === receipt.receiptCode);
    expect(preHasDoc).toBe(false);

    // Confirm receipt
    const confirmed = await stockInService.confirmReceipt(receipt.id, "Approver");
    expect(confirmed.status).toBe("CONFIRMED");
    expect(confirmed.confirmedBy).toBe("Approver");

    // Verify inventory balance increased
    const batches = await repo.getMedicineBatches(1, 1);
    const newBatch = batches.find((b) => b.lotNumber === "NEW-PARA-99");
    expect(newBatch).toBeDefined();
    expect(newBatch?.onHandQuantity).toBe(100);

    // Verify movement ledger recorded
    const movements = await repo.listMovements({ medicineId: 1 });
    const movement = movements.find((m) => m.referenceCode === receipt.receiptCode);
    expect(movement).toBeDefined();
    expect(movement?.movementType).toBe("STOCK_IN");
    expect(movement?.quantity).toBe(100);
  });

  // CASE 7: Validation error prevents partial updates
  it("CASE 7: rejects stock-in with expired expiry date and does not mutate stock", async () => {
    const repo = new InMemoryInventoryRepository();
    const stockInService = new StockInService(repo);

    const receipt = await stockInService.createReceipt(
      {
        warehouseId: 1,
        supplierId: 1,
        receiptDate: "2026-10-04",
        items: [
          {
            medicineId: 1,
            lotNumber: "EXP-TEST-01",
            expiryDate: "2020-01-01", // Long expired!
            quantity: 50,
          },
        ],
      },
      "Tester",
    );

    await expect(stockInService.confirmReceipt(receipt.id, "Approver")).rejects.toThrow();

    // Verify receipt remains DRAFT
    const current = await stockInService.getReceiptById(receipt.id);
    expect(current.status).toBe("DRAFT");
  });

  // CASE 10: Re-confirming a confirmed document is rejected
  it("CASE 10: rejects confirming a receipt that is already confirmed", async () => {
    const repo = new InMemoryInventoryRepository();
    const stockInService = new StockInService(repo);

    const receipt = await stockInService.createReceipt(
      {
        warehouseId: 1,
        supplierId: 1,
        receiptDate: "2026-10-04",
        items: [
          {
            medicineId: 1,
            lotNumber: "DOUBLE-CONFIRM-LOT",
            expiryDate: "2027-10-04",
            quantity: 10,
          },
        ],
      },
      "Tester",
    );

    await stockInService.confirmReceipt(receipt.id, "Approver");

    // Second confirm must throw CONFLICT
    await expect(stockInService.confirmReceipt(receipt.id, "Approver")).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  // CASE 5: Concurrency protection (two stock-out requests that together exceed inventory)
  it("CASE 5: protects against race conditions and concurrent stock-out exceeding balance", async () => {
    const repo = new InMemoryInventoryRepository();
    const stockOutService = new StockOutService(repo);

    // Initial Ceftriaxone (medicineId = 4) in Kho 1 has onHandQuantity = 15
    const issueA = await stockOutService.createIssue(
      {
        warehouseId: 1,
        receiver: "BS Nguyễn Văn A",
        issueDate: "2026-10-04",
        issueType: "DEPARTMENT_ISSUE",
        items: [{ medicineId: 4, requestedQuantity: 10 }],
      },
      "Operator A",
    );

    const issueB = await stockOutService.createIssue(
      {
        warehouseId: 1,
        receiver: "BS Trần Thị B",
        issueDate: "2026-10-04",
        issueType: "DEPARTMENT_ISSUE",
        items: [{ medicineId: 4, requestedQuantity: 10 }],
      },
      "Operator B",
    );

    // Total available = 15. A requests 10, B requests 10.
    // When run concurrently, exactly one must succeed and the second must be rejected with CONFLICT!
    const results = await Promise.allSettled([
      stockOutService.confirmIssue(issueA.id, "Pharmacist A"),
      stockOutService.confirmIssue(issueB.id, "Pharmacist B"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    // Verify remaining stock is 5 (15 - 10) and NEVER negative!
    const batches = await repo.getMedicineBatches(4, 1);
    const balance = batches.find((b) => b.lotNumber === "CEF-C01");
    expect(balance?.onHandQuantity).toBe(5);
    expect(balance?.onHandQuantity).toBeGreaterThanOrEqual(0);
  });

  // Cancel receipt reversal test
  it("prevents cancelling a receipt if the stock has already been issued", async () => {
    const repo = new InMemoryInventoryRepository();
    const stockInService = new StockInService(repo);
    const stockOutService = new StockOutService(repo);

    // 1. Receive 50
    const receipt = await stockInService.createReceipt(
      {
        warehouseId: 1,
        supplierId: 1,
        receiptDate: "2026-10-04",
        items: [
          {
            medicineId: 1,
            lotNumber: "REVERSAL-TEST-LOT",
            expiryDate: "2027-01-01",
            quantity: 50,
          },
        ],
      },
      "Tester",
    );
    await stockInService.confirmReceipt(receipt.id, "Approver");

    // 2. Issue 40
    const issue = await stockOutService.createIssue(
      {
        warehouseId: 1,
        receiver: "Khoa Nội",
        issueDate: "2026-10-04",
        issueType: "DEPARTMENT_ISSUE",
        items: [
          {
            medicineId: 1,
            requestedQuantity: 40,
            allocations: [
              {
                batchId: receipt.items![0].batchId!,
                allocatedQuantity: 40,
                isFefoOverride: true,
                overrideReason: "Thử nghiệm",
              },
            ],
          },
        ],
      },
      "Tester",
    );
    await stockOutService.confirmIssue(issue.id, "Approver");

    // Now remaining stock of this batch is 10. Trying to cancel receipt of 50 must fail because 50 > 10!
    await expect(stockInService.cancelReceipt(receipt.id, "Approver")).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
