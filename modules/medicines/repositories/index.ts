import "server-only";

import { AppError } from "@/lib/errors/app-error";
import { isOracleConfigured } from "@/lib/db/oracle";
import { InMemoryMedicineRepository } from "@/modules/medicines/repositories/in-memory-medicine.repository";
import type { MedicineRepository } from "@/modules/medicines/repositories/medicine.repository";
import { OracleMedicineRepository } from "@/modules/medicines/repositories/oracle-medicine.repository";

import { standardDemoMedicines } from "@/lib/demo";

let demoRepository: InMemoryMedicineRepository | undefined;

export function getMedicineRepository(): MedicineRepository {
  if (process.env.DEMO_MODE !== "true" && isOracleConfigured()) return new OracleMedicineRepository();

  if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "true") {
    throw new AppError(
      "DATABASE_ERROR",
      "Ứng dụng production chưa được cấu hình kết nối Oracle.",
    );
  }

  demoRepository ??= new InMemoryMedicineRepository(standardDemoMedicines);
  return demoRepository;
}

export function resetDemoMedicineRepository(): void {
  demoRepository = new InMemoryMedicineRepository(standardDemoMedicines);
}

export function isDemoDataMode(): boolean {
  return process.env.DEMO_MODE === "true" || !isOracleConfigured();
}
