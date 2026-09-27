import "server-only";

import { AppError } from "@/lib/errors/app-error";
import { isOracleConfigured } from "@/lib/db/oracle";
import { InMemoryMedicineRepository } from "@/modules/medicines/repositories/in-memory-medicine.repository";
import type { MedicineRepository } from "@/modules/medicines/repositories/medicine.repository";
import { OracleMedicineRepository } from "@/modules/medicines/repositories/oracle-medicine.repository";

let demoRepository: InMemoryMedicineRepository | undefined;

export function getMedicineRepository(): MedicineRepository {
  if (isOracleConfigured()) return new OracleMedicineRepository();

  if (process.env.NODE_ENV === "production") {
    throw new AppError(
      "DATABASE_ERROR",
      "Ứng dụng production chưa được cấu hình kết nối Oracle.",
    );
  }

  demoRepository ??= new InMemoryMedicineRepository();
  return demoRepository;
}

export function isDemoDataMode(): boolean {
  return !isOracleConfigured();
}
