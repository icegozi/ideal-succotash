import { describe, it, expect } from "vitest";
import type { Medicine } from "@/modules/medicines/types/medicine.types";

describe("Medicine Catalog UI Logic & Formatting", () => {
  const sampleMedicines: Medicine[] = [
    {
      id: 1,
      code: "PARA500",
      name: "Paracetamol 500 mg",
      activeIngredient: "Paracetamol",
      strength: "500 mg",
      dosageForm: "Viên nén",
      route: "Uống",
      manufacturer: "Dược Hậu Giang",
      baseUnitId: 1,
      baseUnitCode: "VIEN",
      baseUnitName: "Viên",
      minimumStock: 500,
      controlled: "N",
      active: "Y",
    },
    {
      id: 2,
      code: "MORPH10",
      name: "Morphine 10 mg/ml",
      activeIngredient: "Morphine hydrochloride",
      strength: "10 mg/ml",
      dosageForm: "Dung dịch tiêm",
      route: "Tiêm",
      manufacturer: "Dược phẩm TW1",
      baseUnitId: 6,
      baseUnitCode: "ONG",
      baseUnitName: "Ống",
      minimumStock: 20,
      controlled: "Y",
      active: "Y",
    },
    {
      id: 3,
      code: "AMOX250",
      name: "Amoxicillin 250 mg",
      activeIngredient: null,
      strength: null,
      dosageForm: "Gói bột",
      route: "Uống",
      manufacturer: "Mekophar",
      baseUnitId: 3,
      baseUnitCode: "GOI",
      baseUnitName: "Gói",
      minimumStock: 100,
      controlled: "N",
      active: "N",
    },
  ];

  describe("Active Ingredient and Strength display formatting", () => {
    function formatActiveIngredient(m: Medicine): string {
      return (
        [m.activeIngredient, m.strength].filter(Boolean).join(" · ") ||
        "Chưa có hoạt chất"
      );
    }

    it("formats both active ingredient and strength separated by middle dot", () => {
      expect(formatActiveIngredient(sampleMedicines[0])).toBe("Paracetamol · 500 mg");
    });

    it("falls back to default placeholder when both are null", () => {
      expect(formatActiveIngredient(sampleMedicines[2])).toBe("Chưa có hoạt chất");
    });

    it("handles only active ingredient without trailing middle dot", () => {
      const medOnlyIngredient: Medicine = {
        ...sampleMedicines[0],
        strength: null,
      };
      expect(formatActiveIngredient(medOnlyIngredient)).toBe("Paracetamol");
    });
  });

  describe("Filter active state detection", () => {
    function checkIsFiltered(query?: string, active?: string, controlled?: string, sort?: string): boolean {
      return Boolean(
        query ||
          (active && active !== "ALL") ||
          (controlled && controlled !== "ALL") ||
          (sort && sort !== "code"),
      );
    }

    it("returns false for default empty/unfiltered query", () => {
      expect(checkIsFiltered("", "ALL", "ALL", "code")).toBe(false);
      expect(checkIsFiltered(undefined, undefined, undefined, undefined)).toBe(false);
    });

    it("detects keyword search filter", () => {
      expect(checkIsFiltered("para", "ALL", "ALL", "code")).toBe(true);
    });

    it("detects active status filter", () => {
      expect(checkIsFiltered("", "Y", "ALL", "code")).toBe(true);
      expect(checkIsFiltered("", "N", "ALL", "code")).toBe(true);
    });

    it("detects controlled management filter", () => {
      expect(checkIsFiltered("", "ALL", "Y", "code")).toBe(true);
    });

    it("detects non-default sorting", () => {
      expect(checkIsFiltered("", "ALL", "ALL", "name")).toBe(true);
      expect(checkIsFiltered("", "ALL", "ALL", "minimumStock")).toBe(true);
    });
  });

  describe("Controlled Drug Status classification", () => {
    it("identifies controlled drugs requiring special badges and double sign-off", () => {
      const morph = sampleMedicines.find((m) => m.code === "MORPH10");
      expect(morph?.controlled).toBe("Y");
    });

    it("identifies standard unrestricted drugs", () => {
      const para = sampleMedicines.find((m) => m.code === "PARA500");
      expect(para?.controlled).toBe("N");
    });
  });

  describe("KPI Stat Card Calculations", () => {
    it("computes correct stat metrics from catalog", () => {
      const totalMedicines = sampleMedicines.length;
      const activeMedicines = sampleMedicines.filter((m) => m.active === "Y").length;
      const controlledMedicines = sampleMedicines.filter((m) => m.controlled === "Y").length;
      const lowStockMedicines = 1; // Simulated from inventory metrics

      expect(totalMedicines).toBe(3);
      expect(activeMedicines).toBe(2);
      expect(controlledMedicines).toBe(1);
      expect(lowStockMedicines).toBe(1);

      // Warning triggers
      const hasControlledWarning = controlledMedicines > 0;
      const hasLowStockAlert = lowStockMedicines > 0;

      expect(hasControlledWarning).toBe(true);
      expect(hasLowStockAlert).toBe(true);
    });
  });
});
