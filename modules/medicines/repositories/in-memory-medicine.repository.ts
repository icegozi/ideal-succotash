import { AppError } from "@/lib/errors/app-error";
import type { MedicineRepository } from "@/modules/medicines/repositories/medicine.repository";
import type {
  Medicine,
  MedicineInput,
  MedicineListQuery,
  MedicinePage,
  UnitOption,
} from "@/modules/medicines/types/medicine.types";

const units: UnitOption[] = [
  { id: 1, code: "VIEN", name: "Viên" },
  { id: 2, code: "HOP", name: "Hộp" },
  { id: 4, code: "LO", name: "Lọ" },
  { id: 5, code: "CHAI", name: "Chai" },
  { id: 6, code: "ONG", name: "Ống" },
  { id: 9, code: "ML", name: "Mililit" },
];

const seed: Medicine[] = [
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
    code: "AMOX500",
    name: "Amoxicillin 500 mg",
    activeIngredient: "Amoxicillin",
    strength: "500 mg",
    dosageForm: "Viên nang",
    route: "Uống",
    manufacturer: "Mekophar",
    baseUnitId: 1,
    baseUnitCode: "VIEN",
    baseUnitName: "Viên",
    minimumStock: 300,
    controlled: "N",
    active: "Y",
  },
  {
    id: 3,
    code: "MORPH10",
    name: "Morphine 10 mg/ml",
    activeIngredient: "Morphine hydrochloride",
    strength: "10 mg/ml",
    dosageForm: "Dung dịch tiêm",
    route: "Tiêm",
    manufacturer: "Demo kiểm soát",
    baseUnitId: 6,
    baseUnitCode: "ONG",
    baseUnitName: "Ống",
    minimumStock: 20,
    controlled: "Y",
    active: "Y",
  },
];

export class InMemoryMedicineRepository implements MedicineRepository {
  private medicines = seed.map((medicine) => ({ ...medicine }));

  async list(query: Required<MedicineListQuery>): Promise<MedicinePage> {
    const normalizedQuery = query.query.toLocaleLowerCase("vi");
    const filtered = this.medicines.filter((medicine) => {
      const matchesQuery =
        !normalizedQuery ||
        [medicine.code, medicine.name, medicine.activeIngredient || ""].some((value) =>
          value.toLocaleLowerCase("vi").includes(normalizedQuery),
        );
      return (
        matchesQuery &&
        (query.active === "ALL" || medicine.active === query.active) &&
        (query.controlled === "ALL" || medicine.controlled === query.controlled)
      );
    });

    const key = query.sort === "minimumStock" ? "minimumStock" : query.sort;
    filtered.sort((left, right) => {
      const a = left[key];
      const b = right[key];
      const comparison = typeof a === "number" ? a - Number(b) : a.localeCompare(String(b), "vi");
      return query.direction === "asc" ? comparison : -comparison;
    });

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

  async findById(id: number): Promise<Medicine | null> {
    return this.medicines.find((medicine) => medicine.id === id) ?? null;
  }

  async listActiveUnits(): Promise<UnitOption[]> {
    return units;
  }

  async create(input: MedicineInput): Promise<Medicine> {
    this.assertUniqueCode(input.code);
    const medicine = this.toMedicine(Math.max(0, ...this.medicines.map(({ id }) => id)) + 1, input);
    this.medicines.push(medicine);
    return medicine;
  }

  async update(id: number, input: MedicineInput): Promise<Medicine | null> {
    const index = this.medicines.findIndex((medicine) => medicine.id === id);
    if (index < 0) return null;
    this.assertUniqueCode(input.code, id);
    const medicine = this.toMedicine(id, input);
    this.medicines[index] = medicine;
    return medicine;
  }

  private assertUniqueCode(code: string, exceptId?: number) {
    if (
      this.medicines.some(
        (medicine) => medicine.id !== exceptId && medicine.code.toUpperCase() === code.toUpperCase(),
      )
    ) {
      throw new AppError("CONFLICT", "Mã thuốc đã tồn tại.");
    }
  }

  private toMedicine(id: number, input: MedicineInput): Medicine {
    const unit = units.find(({ id: unitId }) => unitId === input.baseUnitId);
    if (!unit) throw new AppError("VALIDATION_ERROR", "Đơn vị cơ sở không hợp lệ.");

    return {
      id,
      ...input,
      baseUnitCode: unit.code,
      baseUnitName: unit.name,
    };
  }
}
