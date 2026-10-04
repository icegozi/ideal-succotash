import "server-only";

import { AppError } from "@/lib/errors/app-error";
import { isOracleConfigured } from "@/lib/db/oracle";
import { InMemoryInventoryRepository } from "@/modules/inventory/repositories/in-memory-inventory.repository";
import type { InventoryRepository } from "@/modules/inventory/repositories/inventory.repository";
import { OracleInventoryRepository } from "@/modules/inventory/repositories/oracle-inventory.repository";

let demoInventoryRepository: InMemoryInventoryRepository | undefined;

export function getInventoryRepository(): InventoryRepository {
  if (process.env.DEMO_MODE !== "true" && isOracleConfigured()) return new OracleInventoryRepository();

  if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "true") {
    throw new AppError(
      "DATABASE_ERROR",
      "Ứng dụng production chưa được cấu hình kết nối Oracle.",
    );
  }

  demoInventoryRepository ??= new InMemoryInventoryRepository();
  return demoInventoryRepository;
}

export function resetDemoInventoryRepository(): void {
  demoInventoryRepository = new InMemoryInventoryRepository();
}
