import { describe, expect, it } from "vitest";

import { InMemoryMedicineRepository } from "@/modules/medicines/repositories/in-memory-medicine.repository";
import { MedicineService } from "@/modules/medicines/services/medicine.service";

const validInput = {
  code: "  CEF1000  ",
  name: "Ceftriaxone 1 g",
  activeIngredient: "Ceftriaxone",
  strength: "1 g",
  dosageForm: "Bột pha tiêm",
  route: "Tiêm",
  manufacturer: "Nhà sản xuất kiểm thử",
  baseUnitId: 4,
  minimumStock: 12,
  controlled: "N" as const,
  active: "Y" as const,
};

describe("MedicineService", () => {
  it("normalizes and creates a medicine", async () => {
    const service = new MedicineService(new InMemoryMedicineRepository());
    const medicine = await service.create(validInput);

    expect(medicine.code).toBe("CEF1000");
    expect(medicine.baseUnitCode).toBe("LO");
    expect(medicine.minimumStock).toBe(12);
  });

  it("rejects a negative minimum stock", async () => {
    const service = new MedicineService(new InMemoryMedicineRepository());

    await expect(service.create({ ...validInput, minimumStock: -1 })).rejects.toMatchObject({
      name: "ZodError",
    });
  });

  it("rejects duplicate medicine codes", async () => {
    const service = new MedicineService(new InMemoryMedicineRepository());
    await service.create(validInput);

    await expect(service.create({ ...validInput, name: "Bản ghi trùng" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("filters controlled medicines and paginates", async () => {
    const service = new MedicineService(new InMemoryMedicineRepository());
    const result = await service.list({ controlled: "Y", page: 1, pageSize: 5 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].code).toBe("MORPH10");
    expect(result.totalPages).toBe(1);
  });

  it("prevents base-unit changes through generic edit", async () => {
    const service = new MedicineService(new InMemoryMedicineRepository());
    const medicine = await service.getById(1);

    await expect(
      service.update(1, {
        code: medicine.code,
        name: medicine.name,
        activeIngredient: medicine.activeIngredient,
        strength: medicine.strength,
        dosageForm: medicine.dosageForm,
        route: medicine.route,
        manufacturer: medicine.manufacturer,
        baseUnitId: 2,
        minimumStock: medicine.minimumStock,
        controlled: medicine.controlled,
        active: medicine.active,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
