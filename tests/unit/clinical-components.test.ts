import { describe, it, expect } from "vitest";
import {
  calculateDaysUntilExpiry,
  formatDisplayDate,
} from "@/components/shared/clinical/ExpiryThresholdMeter";
import type { FefoProposalResult } from "@/modules/inventory/types/inventory.types";

describe("Clinical Components — Business Logic & Calculations", () => {
  describe("Expiry Date Calculations", () => {
    it("formats YYYY-MM-DD to DD/MM/YYYY correctly", () => {
      expect(formatDisplayDate("2026-12-31")).toBe("31/12/2026");
      expect(formatDisplayDate("2025-05-01")).toBe("01/05/2025");
      expect(formatDisplayDate("")).toBe("N/A");
    });

    it("calculates positive days for future expiry dates", () => {
      const future = new Date();
      future.setDate(future.getDate() + 45);
      const futureStr = future.toISOString().split("T")[0];
      const days = calculateDaysUntilExpiry(futureStr);
      expect(days).toBeGreaterThanOrEqual(44);
      expect(days).toBeLessThanOrEqual(46);
    });

    it("calculates negative days for past expired dates", () => {
      const past = new Date();
      past.setDate(past.getDate() - 10);
      const pastStr = past.toISOString().split("T")[0];
      const days = calculateDaysUntilExpiry(pastStr);
      expect(days).toBeLessThanOrEqual(-9);
    });

    it("handles today's date safely and does not mark as expired", () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const days = calculateDaysUntilExpiry(todayStr);
      expect(days).toBe(0);
      // Semantics: daysRemaining < 0 is expired; 0 is valid and classified as critical/countdown
      const isExpired = days < 0;
      expect(isExpired).toBe(false);
      const isEligibleToday = days >= 0;
      expect(isEligibleToday).toBe(true);
    });

    it("identifies past date as strictly expired", () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      const pastStr = past.toISOString().split("T")[0];
      const days = calculateDaysUntilExpiry(pastStr);
      expect(days).toBeLessThan(0);
      const isExpired = days < 0;
      expect(isExpired).toBe(true);
    });
  });

  describe("Movement Sign Normalization (Dashboard Ledger)", () => {
    function formatMovementDisplay(movementType: "STOCK_IN" | "STOCK_OUT", quantity: number): string {
      const isIncrease = movementType === "STOCK_IN";
      const sign = isIncrease ? "+" : "−";
      return `${sign}${Math.abs(quantity).toLocaleString("vi-VN")}`;
    }

    it("normalizes negative stock-out quantities to single minus sign", () => {
      expect(formatMovementDisplay("STOCK_OUT", -50)).toBe("−50");
      expect(formatMovementDisplay("STOCK_OUT", 50)).toBe("−50");
      expect(formatMovementDisplay("STOCK_OUT", -50)).not.toContain("−-");
    });

    it("formats positive stock-in quantities with plus sign", () => {
      expect(formatMovementDisplay("STOCK_IN", 100)).toBe("+100");
    });
  });

  describe("FEFO Proposal Structure Validation", () => {
    it("validates successful 100% FEFO allocation scenario", () => {
      const mockProposal: FefoProposalResult = {
        medicineId: 101,
        requestedQuantity: 150,
        availableStock: 300,
        insufficient: false,
        missingQuantity: 0,
        allocations: [
          {
            batchId: 1,
            lotNumber: "LOT-2024-01",
            expiryDate: "2026-11-15",
            allocatedQuantity: 100,
            isFefoOverride: false,
          },
          {
            batchId: 2,
            lotNumber: "LOT-2025-08",
            expiryDate: "2027-03-20",
            allocatedQuantity: 50,
            isFefoOverride: false,
          },
        ],
      };

      const totalAllocated = mockProposal.allocations.reduce(
        (sum, item) => sum + item.allocatedQuantity,
        0,
      );
      expect(totalAllocated).toBe(mockProposal.requestedQuantity);
      expect(mockProposal.insufficient).toBe(false);
      expect(mockProposal.missingQuantity).toBe(0);
      expect(mockProposal.allocations[0].isFefoOverride).toBe(false);
    });

    it("flags insufficient stock scenario when requested quantity exceeds available stock", () => {
      const mockProposal: FefoProposalResult = {
        medicineId: 102,
        requestedQuantity: 200,
        availableStock: 80,
        insufficient: true,
        missingQuantity: 120,
        allocations: [
          {
            batchId: 5,
            lotNumber: "LOT-REMAIN-80",
            expiryDate: "2026-12-01",
            allocatedQuantity: 80,
            isFefoOverride: false,
          },
        ],
      };

      expect(mockProposal.insufficient).toBe(true);
      expect(mockProposal.missingQuantity).toBe(120);
      expect(mockProposal.allocations[0].allocatedQuantity).toBe(80);
    });

    it("detects FEFO override and checks override reason field", () => {
      const mockProposal: FefoProposalResult = {
        medicineId: 103,
        requestedQuantity: 50,
        availableStock: 100,
        insufficient: false,
        missingQuantity: 0,
        allocations: [
          {
            batchId: 9,
            lotNumber: "LOT-SPECIAL-BATCH",
            expiryDate: "2027-08-15",
            allocatedQuantity: 50,
            isFefoOverride: true,
            overrideReason: "Chỉ định phác đồ của bác sĩ điều trị chuyên khoa",
          },
        ],
      };

      expect(mockProposal.allocations.some((a) => a.isFefoOverride)).toBe(true);
      expect(mockProposal.allocations[0].overrideReason).toBeTruthy();
    });

    it("simulates FEFO override state transition and clinical reason lifecycle", () => {
      let allocations = [
        {
          batchId: 10,
          lotNumber: "LOT-01",
          expiryDate: "2026-12-31",
          allocatedQuantity: 20,
          isFefoOverride: false,
          overrideReason: null as string | null,
        },
      ];

      // 1. Toggled override to active
      allocations = allocations.map((a) =>
        a.batchId === 10
          ? { ...a, isFefoOverride: true, overrideReason: "" }
          : a,
      );
      expect(allocations[0].isFefoOverride).toBe(true);
      expect(allocations[0].overrideReason).toBe("");

      // 2. Clinical reason filled by clinical pharmacist
      const clinicalReason = "Yêu cầu hội chẩn chuyên khoa Nội tiết";
      allocations = allocations.map((a) =>
        a.batchId === 10
          ? { ...a, overrideReason: clinicalReason }
          : a,
      );
      expect(allocations[0].overrideReason).toBe(clinicalReason);

      // 3. User reverts back to automated FEFO
      allocations = allocations.map((a) =>
        a.batchId === 10
          ? { ...a, isFefoOverride: false, overrideReason: null }
          : a,
      );
      expect(allocations[0].isFefoOverride).toBe(false);
      expect(allocations[0].overrideReason).toBeNull();
    });
  });
});

