import { AppError } from "@/lib/errors/app-error";
import { MEDICINE_MESSAGES } from "@/constants/messages";
import type { MedicineRepository } from "@/modules/medicines/repositories/medicine.repository";
import {
  medicineInputSchema,
  medicineListQuerySchema,
} from "@/modules/medicines/schemas/medicine.schema";
import type { MedicineListQuery } from "@/modules/medicines/types/medicine.types";

export class MedicineService {
  constructor(private readonly repository: MedicineRepository) {}

  async list(input: MedicineListQuery = {}) {
    const query = medicineListQuerySchema.parse(input);
    return this.repository.list(query);
  }

  async getById(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("NOT_FOUND", MEDICINE_MESSAGES.ERROR.NOT_FOUND);
    }
    const medicine = await this.repository.findById(id);
    if (!medicine) throw new AppError("NOT_FOUND", MEDICINE_MESSAGES.ERROR.NOT_FOUND);
    return medicine;
  }

  async listActiveUnits() {
    return this.repository.listActiveUnits();
  }

  async create(input: unknown) {
    return this.repository.create(medicineInputSchema.parse(input));
  }

  async update(id: number, input: unknown) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("NOT_FOUND", MEDICINE_MESSAGES.ERROR.NOT_FOUND);
    }
    const parsed = medicineInputSchema.parse(input);
    const existing = await this.repository.findById(id);
    if (!existing) throw new AppError("NOT_FOUND", MEDICINE_MESSAGES.ERROR.NOT_FOUND);
    if (existing.baseUnitId !== parsed.baseUnitId) {
      throw new AppError(
        "CONFLICT",
        MEDICINE_MESSAGES.ERROR.CANNOT_CHANGE_BASE_UNIT,
      );
    }
    const medicine = await this.repository.update(id, parsed);
    if (!medicine) throw new AppError("NOT_FOUND", MEDICINE_MESSAGES.ERROR.NOT_FOUND);
    return medicine;
  }
}
